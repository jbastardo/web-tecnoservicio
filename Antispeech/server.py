#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Antispeech - Servidor Local de Integración por Voz para IDE Antigravity
======================================================================
Permite conectar el micrófono del celular como entrada de voz para el IDE
y visualizar las respuestas generadas por la IA en tiempo real en el móvil.

Soporta dos motores de reconocimiento:
1. MediaRecorder Directo (Envía el audio al servidor, lo procesa con ffmpeg + SpeechRecognition)
2. Web Speech API (Reconocimiento nativo en el navegador del teléfono)

Zona Horaria Requerida: America/Caracas (UTC-4)
"""

import os
import sys
import json
import time
import socket
import ssl
import threading
import tempfile
import subprocess
import zoneinfo
import datetime
from http.server import HTTPServer, SimpleHTTPRequestHandler
from urllib.parse import urlparse, parse_qs

# Reconfigurar salida para soporte UTF-8 en consolas Windows
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

# Librerías de automatización y teclado
try:
    import pyautogui
    import pyperclip
except ImportError:
    print("[-] Error: Faltan dependencias. Ejecuta: pip install pyautogui pyperclip")
    sys.exit(1)

# Reconocimiento de voz en servidor
try:
    import speech_recognition as sr
except ImportError:
    sr = None
    print("[!] Advertencia: SpeechRecognition no está instalado. Ejecuta: pip install SpeechRecognition")

# QR Code en terminal
try:
    import qrcode
except ImportError:
    qrcode = None

# Zona Horaria Oficial
CARACAS_TZ = zoneinfo.ZoneInfo("America/Caracas")

def get_caracas_now_str():
    """Retorna la fecha y hora actual formateada en America/Caracas."""
    return datetime.datetime.now(CARACAS_TZ).strftime("%Y-%m-%d %I:%M:%S %p VET")

def get_local_ip():
    """Detecta la dirección IP local de la PC en la red LAN."""
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
    except Exception:
        ip = "127.0.0.1"
    finally:
        s.close()
    return ip

def generate_self_signed_cert(cert_path="cert.pem", key_path="key.pem", ip="127.0.0.1"):
    """
    Genera automáticamente certificados SSL autofirmados para habilitar HTTPS en la LAN.
    Esencial para que el micrófono funcione en Chrome (Android) y Safari (iOS).
    """
    if os.path.exists(cert_path) and os.path.exists(key_path):
        return

    print(f"[*] Generando certificado SSL autofirmado para IP {ip}...")
    try:
        from cryptography import x509
        from cryptography.x509.oid import NameOID
        from cryptography.hazmat.primitives import hashes
        from cryptography.hazmat.primitives.asymmetric import rsa
        from cryptography.hazmat.primitives import serialization
        import ipaddress

        key = rsa.generate_private_key(public_exponent=65537, key_size=2048)

        san_list = [
            x509.DNSName("localhost"),
            x509.IPAddress(ipaddress.ip_address("127.0.0.1"))
        ]
        try:
            san_list.append(x509.IPAddress(ipaddress.ip_address(ip)))
        except Exception:
            pass

        subject = issuer = x509.Name([
            x509.NameAttribute(NameOID.ORGANIZATION_NAME, "Antispeech IDE"),
            x509.NameAttribute(NameOID.COMMON_NAME, ip),
        ])

        now_utc = datetime.datetime.now(datetime.timezone.utc)
        cert = (
            x509.CertificateBuilder()
            .subject_name(subject)
            .issuer_name(issuer)
            .public_key(key.public_key())
            .serial_number(x509.random_serial_number())
            .not_valid_before(now_utc)
            .not_valid_after(now_utc + datetime.timedelta(days=365))
            .add_extension(x509.SubjectAlternativeName(san_list), critical=False)
            .sign(key, hashes.SHA256())
        )

        with open(key_path, "wb") as f:
            f.write(key.private_bytes(
                encoding=serialization.Encoding.PEM,
                format=serialization.PrivateFormat.TraditionalOpenSSL,
                encryption_algorithm=serialization.NoEncryption(),
            ))

        with open(cert_path, "wb") as f:
            f.write(cert.public_bytes(serialization.Encoding.PEM))

        print(f"[+] Certificados SSL creados: {cert_path}, {key_path}")
    except Exception as e:
        print(f"[-] No se pudo generar certificado SSL con cryptography: {e}")

def get_latest_conversation_response():
    """
    Lee el archivo de transcripción de la conversación activa en Antigravity
    para extraer en tiempo real la última respuesta de la IA.
    """
    user_home = os.path.expanduser("~")
    brain_path = os.path.join(user_home, ".gemini", "antigravity", "brain")
    if not os.path.exists(brain_path):
        return {"status": "waiting", "content": "Esperando inicialización de Antigravity..."}

    try:
        dirs = [
            os.path.join(brain_path, d) for d in os.listdir(brain_path)
            if os.path.isdir(os.path.join(brain_path, d)) and d != "tempmediaStorage"
        ]
        if not dirs:
            return {"status": "waiting", "content": "No hay conversaciones activas."}

        latest_dir = max(dirs, key=os.path.getmtime)
        log_file = os.path.join(latest_dir, ".system_generated", "logs", "transcript_full.jsonl")
        if not os.path.exists(log_file):
            log_file = os.path.join(latest_dir, ".system_generated", "logs", "transcript.jsonl")

        if not os.path.exists(log_file):
            return {"status": "waiting", "content": "Iniciando registro de chat..."}

        with open(log_file, "r", encoding="utf-8") as f:
            lines = f.readlines()

        for line in reversed(lines):
            try:
                data = json.loads(line)
                if data.get("source") == "MODEL" and data.get("type") == "PLANNER_RESPONSE":
                    content = data.get("content", "")
                    tool_calls = data.get("tool_calls", [])
                    step_idx = data.get("step_index", 0)

                    if content and not tool_calls:
                        return {
                            "status": "ready",
                            "step_index": step_idx,
                            "content": content,
                            "is_done": True,
                            "timestamp": get_caracas_now_str()
                        }
                    elif tool_calls or data.get("thinking"):
                        return {
                            "status": "generating",
                            "step_index": step_idx,
                            "content": "*Antigravity está ejecutando acciones y procesando tu prompt...*",
                            "is_done": False,
                            "timestamp": get_caracas_now_str()
                        }
            except Exception:
                continue

        return {"status": "waiting", "content": "Listo para recibir instrucciones."}
    except Exception as e:
        return {"status": "error", "content": f"Error leyendo transcripción: {str(e)}"}

class AntispeechHandler(SimpleHTTPRequestHandler):
    """Manejador HTTP para la API de automatización, audio STT y la PWA."""

    def __init__(self, *args, **kwargs):
        pwa_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "pwa")
        super().__init__(*args, directory=pwa_dir, **kwargs)

    def do_OPTIONS(self):
        """Soporte CORS para peticiones preflight."""
        self.send_response(200)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def do_POST(self):
        """Endpoints para recibir prompts en texto o archivos de audio."""
        parsed_path = urlparse(self.path)

        # -------------------------------------------------------------
        # 1. Endpoint /api/audio: Recibe audio del celular y transcribe
        # -------------------------------------------------------------
        if parsed_path.path == "/api/audio":
            content_length = int(self.headers.get("Content-Length", 0))
            if content_length == 0:
                self._send_json({"status": "error", "message": "Audio vacío"}, 400)
                return

            audio_bytes = self.rfile.read(content_length)
            query_params = parse_qs(parsed_path.query)
            lang = query_params.get("lang", ["es-ES"])[0]

            timestamp = get_caracas_now_str()
            print(f"\n[{timestamp}] 📥 Recibiendo audio desde el celular ({len(audio_bytes)} bytes)...")

            transcription = self._transcribe_audio_bytes(audio_bytes, lang=lang)

            if transcription.get("status") == "ok":
                text = transcription.get("text", "").strip()
                print(f"[{timestamp}] 🎙️ TRANSCRIPCIÓN EXITOSA: \"{text}\"")

                self._inject_prompt_to_active_window(text)

                self._send_json({
                    "status": "ok",
                    "text": text,
                    "injected_at": timestamp
                })
            else:
                print(f"[{timestamp}] ⚠️ {transcription.get('message', 'No se pudo transcribir.')}")
                self._send_json(transcription, 200)

        # -------------------------------------------------------------
        # 2. Endpoint /api/prompt: Recibe texto ya transcrito por Web Speech
        # -------------------------------------------------------------
        elif parsed_path.path == "/api/prompt":
            content_length = int(self.headers.get("Content-Length", 0))
            body = self.rfile.read(content_length).decode("utf-8")

            try:
                payload = json.loads(body)
                text = payload.get("text", "").strip()

                if not text:
                    self._send_json({"status": "error", "message": "Texto vacío"}, 400)
                    return

                timestamp = get_caracas_now_str()
                print(f"\n[{timestamp}] 🎙️ PROMPT RECIBIDO DESDE EL CELULAR:")
                print(f"» \"{text}\"")

                self._inject_prompt_to_active_window(text)

                self._send_json({
                    "status": "ok",
                    "text": text,
                    "injected_at": timestamp
                })

            except Exception as e:
                print(f"[-] Error al procesar prompt: {e}")
                self._send_json({"status": "error", "message": str(e)}, 500)
        else:
            self._send_json({"error": "Ruta no encontrada"}, 404)

    def do_GET(self):
        """Endpoints de API para lectura de respuesta y streaming SSE."""
        parsed_path = urlparse(self.path)

        if parsed_path.path == "/api/response":
            resp = get_latest_conversation_response()
            self._send_json(resp)
            return

        elif parsed_path.path == "/api/stream":
            self.send_response(200)
            self.send_header("Content-Type", "text/event-stream")
            self.send_header("Cache-Control", "no-cache")
            self.send_header("Connection", "keep-alive")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()

            last_sent_step = None
            last_content = None

            try:
                for _ in range(120):
                    data = get_latest_conversation_response()
                    current_content = data.get("content", "")
                    current_step = data.get("step_index", 0)

                    if current_content != last_content or current_step != last_sent_step:
                        payload = f"data: {json.dumps(data)}\n\n"
                        self.wfile.write(payload.encode("utf-8"))
                        self.wfile.flush()
                        last_content = current_content
                        last_sent_step = current_step

                    time.sleep(0.6)
            except Exception:
                pass
            return

        super().do_GET()

    def _send_json(self, data, status_code=200):
        body = json.dumps(data, ensure_ascii=False).encode("utf-8")
        self.send_response(status_code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def _transcribe_audio_bytes(self, audio_bytes, lang="es-ES"):
        """
        Guarda el audio temporalmente, lo convierte a WAV 16kHz con ffmpeg
        y lo transcribe usando SpeechRecognition (Google API gratuita).
        """
        if not sr:
            return {"status": "error", "message": "SpeechRecognition no disponible en el servidor."}

        temp_dir = tempfile.gettempdir()
        temp_input = os.path.join(temp_dir, f"antispeech_{int(time.time()*1000)}.raw")
        temp_wav = os.path.join(temp_dir, f"antispeech_{int(time.time()*1000)}.wav")

        try:
            with open(temp_input, "wb") as f:
                f.write(audio_bytes)

            cmd = ["ffmpeg", "-y", "-i", temp_input, "-ac", "1", "-ar", "16000", temp_wav]
            result = subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.PIPE)

            if not os.path.exists(temp_wav) or os.path.getsize(temp_wav) == 0:
                return {"status": "error", "message": "Error al procesar el formato de audio con ffmpeg."}

            recognizer = sr.Recognizer()
            with sr.AudioFile(temp_wav) as source:
                audio_data = recognizer.record(source)

            target_lang = "es-ES" if "es" in lang else "en-US"
            recognized_text = recognizer.recognize_google(audio_data, language=target_lang)

            return {"status": "ok", "text": recognized_text}

        except sr.UnknownValueError:
            return {"status": "no_speech", "message": "No se distinguió ninguna palabra clara. Habla más cerca del micrófono."}
        except sr.RequestError as e:
            return {"status": "error", "message": f"Error de conexión con el motor de voz: {e}"}
        except Exception as e:
            return {"status": "error", "message": f"Error interno en transcripción: {str(e)}"}
        finally:
            for p in (temp_input, temp_wav):
                if os.path.exists(p):
                    try: os.remove(p)
                    except Exception: pass

    def _inject_prompt_to_active_window(self, text):
        """
        Automatiza la escritura en la ventana activa mediante clipboard paste + Enter.
        Garantiza que acentos, emojis y saltos de línea se escriban íntegros e instantáneos.
        """
        def run_typing():
            try:
                pyperclip.copy(text)
                time.sleep(0.08)
                pyautogui.hotkey("ctrl", "v")
                time.sleep(0.08)
                pyautogui.press("enter")
                print(f"[+] Prompt inyectado y 'Enter' presionado con éxito en la ventana activa.")
            except Exception as ex:
                print(f"[-] Error en automatización de teclado: {ex}")

        threading.Thread(target=run_typing, daemon=True).start()

    def log_message(self, format, *args):
        if "/api/response" in format % args or "/api/stream" in format % args:
            return
        super().log_message(format, *args)

def print_banner(local_ip, port_https, port_http=None):
    """Imprime el banner de inicio con instrucciones y QR Code."""
    https_url = f"https://{local_ip}:{port_https}"
    
    print("\n" + "=" * 65)
    print("      🎙️  ANTISPEECH IDE - CONTROL POR VOZ INALÁMBRICO  🎙️")
    print("=" * 65)
    print(f" [Hora Local]  : {get_caracas_now_str()}")
    print(f" [URL Celular] : {https_url}")
    if port_http:
        print(f" [HTTP Altern] : http://{local_ip}:{port_http}")
    print("-" * 65)
    print(" 📲  INSTRUCCIONES PARA VINCULAR TU CELULAR:")
    print(" 1. Asegúrate de que el celular esté conectado a la MISMA RED WIFI.")
    print(" 2. Escanea el código QR de abajo o abre la URL en Chrome/Safari móvil.")
    print(" 3. Al ser HTTPS local, tu celular mostrará 'La conexión no es privada':")
    print("    -> Toca 'Configuración avanzada' y luego 'Acceder a la IP (no seguro)'.")
    print(" 4. ¡Listo! Puedes dictar usando MediaRecorder o Web Speech.")
    print("=" * 65 + "\n")

    if qrcode:
        try:
            qr = qrcode.QRCode(box_size=1, border=2)
            qr.add_data(https_url)
            qr.print_ascii(invert=True)
            print("\n")
        except Exception as e:
            pass

def main():
    port_https = 8443
    port_http = 8000
    local_ip = get_local_ip()

    base_dir = os.path.dirname(os.path.abspath(__file__))
    cert_path = os.path.join(base_dir, "cert.pem")
    key_path = os.path.join(base_dir, "key.pem")

    generate_self_signed_cert(cert_path, key_path, ip=local_ip)
    print_banner(local_ip, port_https, port_http)

    try:
        httpd_ssl = HTTPServer(("0.0.0.0", port_https), AntispeechHandler)
        ssl_context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
        ssl_context.load_cert_chain(certfile=cert_path, keyfile=key_path)
        httpd_ssl.socket = ssl_context.wrap_socket(httpd_ssl.socket, server_side=True)

        def run_http():
            try:
                httpd_plain = HTTPServer(("0.0.0.0", port_http), AntispeechHandler)
                httpd_plain.serve_forever()
            except Exception:
                pass

        threading.Thread(target=run_http, daemon=True).start()

        print(f"[✓] Servidor activo escuchando en el puerto {port_https} (HTTPS) y {port_http} (HTTP).")
        print("[*] Presiona Ctrl+C en esta consola para detener.\n")
        httpd_ssl.serve_forever()

    except KeyboardInterrupt:
        print("\n[*] Servidor Antispeech detenido por el usuario.")
    except Exception as e:
        print(f"[-] Error iniciando el servidor: {e}")

if __name__ == "__main__":
    main()
