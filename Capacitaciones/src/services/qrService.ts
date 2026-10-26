import QRCode from "qrcode";

export class QrService {
  /**
   * Genera un código QR en formato Data URL (base64 image/png) a partir de un enlace o identificador
   */
  async generateDataUrl(url: string): Promise<string> {
    try {
      return await QRCode.toDataURL(url, {
        width: 350,
        margin: 2,
        color: {
          dark: "#080e1a", // Azul corporativo Onprotec
          light: "#ffffff",
        },
      });
    } catch (error) {
      console.error("[QrService] Error generando QR DataURL:", error);
      throw error;
    }
  }

  /**
   * Genera un código QR en formato SVG vectorial
   */
  async generateSvg(url: string): Promise<string> {
    try {
      return await QRCode.toString(url, {
        type: "svg",
        margin: 2,
        color: {
          dark: "#080e1a",
          light: "#ffffff",
        },
      });
    } catch (error) {
      console.error("[QrService] Error generando QR SVG:", error);
      throw error;
    }
  }

  /**
   * Genera la URL pública de la encuesta para un evento
   */
  buildSurveyUrl(trainingId: number): string {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://capacitacion.tutecnoservicio.com";
    return `${baseUrl}/encuesta/${trainingId}`;
  }
}

export const qrService = new QrService();
