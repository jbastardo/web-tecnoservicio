# 🎙️ Antispeech - Control por Voz y Visor de Respuestas para Antigravity IDE

**Antispeech** convierte cualquier celular (Android o iOS) en un micrófono inalámbrico interactivo para tu PC. Te permite dictar prompts por voz que se escriben solos en tu IDE, y además **muestra en la pantalla del celular la respuesta generada por la IA en tiempo real** con formateo Markdown y lectura en voz alta opcional.

---

## ⚡ Inicio Rápido (3 Pasos)

### 1. Iniciar el Servidor en tu PC
Haz doble clic en el archivo:
```
start.bat
```
*(O ejecuta en PowerShell: `python server.py`)*

El servidor:
- Instalará automáticamente las dependencias necesarias (`pyautogui`, `pyperclip`, `cryptography`, `qrcode`, `pillow`).
- Detectará tu IP local en la red WiFi (por ejemplo `192.168.68.53`).
- Generará certificados SSL para habilitar HTTPS (requerido por los navegadores móviles para el micrófono).
- **Mostrará un código QR en la consola de tu PC.**

---

### 2. Conectar tu Celular
1. Asegúrate de que tu celular esté conectado a la **misma red WiFi** que tu PC.
2. Abre la cámara de tu celular y **escanea el código QR** que aparece en la consola (o abre en el navegador `https://TU_IP:8443`, ej. `https://192.168.68.53:8443`).
3. **Paso importante de seguridad en el celular:**
   Como es un certificado local autogenerado para tu propia red, tu navegador móvil (Chrome o Safari) mostrará una advertencia de *"La conexión no es privada"*:
   - Toca en **"Configuración avanzada"** (o "Detalles").
   - Toca en **"Acceder a 192.168.x.x (no seguro)"**.
4. Acepta el permiso del micrófono cuando el navegador lo solicite.

> 💡 **Tip:** Puedes tocar el botón **"Instalar App"** que aparecerá en pantalla para guardarla en el menú de aplicaciones de tu celular como una App nativa.

---

### 3. Usar el Micrófono con el IDE
1. En tu PC, haz clic dentro del cuadro de chat de **Antigravity IDE** (para que el cursor esté activo allí).
2. En tu celular, **toca el botón grande del micrófono** o déjalo en **Auto-envío**.
3. Habla normalmente en español.
4. Al terminar de hablar (o al pausar por 1.3 segundos), el texto se transcribirá, se enviará al servidor y se escribirá automáticamente en tu IDE con `Enter`.
5. **Observa tu celular:** La respuesta de la IA y el progreso comenzarán a sincronizarse en la pantalla de tu móvil en vivo.

---

## 📱 Características de la PWA (Celular)

| Característica | Descripción |
| :--- | :--- |
| **🎙️ Reconocimiento Continuo** | Web Speech API optimizada para español con retroalimentación sonora por tonos (bips). |
| **⚡ Auto-envío Inteligente** | Detecta pausas de voz (silencio) y dispara el prompt sin que tengas que presionar nada en la pantalla. |
| **👁️ Pantalla Siempre Encendida** | Activa la Wake Lock API para que el celular no bloquee la pantalla mientras estás programando. |
| **📄 Visor Markdown en Vivo** | Conexión Server-Sent Events (SSE) y polling que lee directamente el motor de transcripciones del IDE. |
| **🔊 Text-to-Speech (TTS)** | Botón para que el celular te lea la respuesta de la IA en voz alta a través del parlante. |
| **⚙️ Panel de Ajustes** | Permite cambiar idioma (`es-419`, `es-ES`, `en-US`), tiempo de silencio, y activar/desactivar bips. |

---

## 🛠️ Arquitectura del Servidor (`server.py`)

- **Endpoints Expuestos:**
  - `GET /`: Sirve la Progressive Web App (`pwa/index.html`).
  - `POST /api/prompt`: Recibe JSON `{ "text": "..." }`, copia al portapapeles y ejecuta `Ctrl + V` + `Enter` usando `pyautogui` y `pyperclip`.
  - `GET /api/response`: Retorna el estado y la última respuesta generada por la IA leyendo el `transcript_full.jsonl` más reciente de `~/.gemini/antigravity/brain`.
  - `GET /api/stream`: Flujo SSE (Server-Sent Events) para transmitir actualizaciones en vivo al celular.
- **Inyección por Portapapeles:** Al utilizar `pyperclip.copy()` y `Ctrl + V`, la escritura es instantánea y jamás sufre errores de codificación con caracteres españoles (`ñ`, `á`, `é`, `í`, `ó`, `ú`, `¿`, `¡`) ni saltos de línea.
- **Zona Horaria:** Cumple con la regla de sincronización horaria local de `America/Caracas` (VET, UTC-4).

---

## 🌐 Opción Alternativa: Usar HTTP en lugar de HTTPS

Si prefieres usar HTTP normal en el puerto `8000` (`http://TU_IP:8000`) sin ver la advertencia de certificado SSL:
1. En Google Chrome de tu celular, abre la pestaña:
   `chrome://flags/#unsafely-treat-insecure-origin-as-secure`
2. Activa la opción (**Enabled**) y en el cuadro de texto ingresa:
   `http://192.168.68.53:8000` *(pon tu IP local)*
3. Reinicia Chrome móvil tocando **Relaunch**.
4. Ahora podrás usar el micrófono con HTTP estándar sin advertencias de certificado.
