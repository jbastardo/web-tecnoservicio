export interface WhatsAppMessageResult {
  success: boolean;
  messageId?: string;
  error?: string;
  recipient: string;
}

export class WhatsAppService {
  private provider: string;
  private token: string;
  private phoneNumberId: string;
  private gatewayUrl: string;

  constructor() {
    this.provider = process.env.WHATSAPP_PROVIDER || "mock";
    this.token = process.env.WHATSAPP_API_TOKEN || "";
    this.phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID || "";
    this.gatewayUrl = process.env.WHATSAPP_GATEWAY_URL || "http://wa-gateway:8080/api/send";
  }

  /**
   * Envía mensaje de confirmación de registro a un participante
   */
  async sendRegistrationConfirmation(params: {
    to: string;
    participantName: string;
    trainingName: string;
    eventDate: string;
    isWaitlist?: boolean;
  }): Promise<WhatsAppMessageResult> {
    const text = params.isWaitlist
      ? `👋 Hola *${params.participantName}*, hemos recibido tu solicitud para el curso *"${params.trainingName}"* en Onprotec.\n\n⚠️ Dado que el aforo de 18 cupos está actualmente completo, has quedado en nuestra *Lista de Espera prioritaria*. Te notificaremos de inmediato si se libera un cupo.`
      : `🎉 ¡Hola *${params.participantName}*! Tu registro al evento *"${params.trainingName}"* en la Sala de Capacitaciones de Onprotec ha sido recibido con éxito.\n\n📅 Fecha: *${params.eventDate}*\n📍 Ubicación: Sala de Capacitaciones Onprotec (Aforo: 18 cupos).\n\nNos comunicaremos contigo 24 horas antes para reconfirmar tu asistencia. ¡Te esperamos!`;

    return this.sendTextMessage(params.to, text);
  }

  /**
   * Envía recordatorio automatizado 24 horas antes del evento
   */
  async send24hReminder(params: {
    to: string;
    participantName: string;
    trainingName: string;
    eventHour: string;
  }): Promise<WhatsAppMessageResult> {
    const text = `⏰ *Recordatorio Onprotec*: Hola *${params.participantName}*, te recordamos que mañana es tu capacitación *"${params.trainingName}"*.\n\n⏰ Hora: *${params.eventHour}*\n📍 Sede Onprotec: Sala de Capacitaciones Técnica.\n\nPor favor, responde a este mensaje con un *"CONFIRMAR"* para asegurar tu puesto dentro de los 18 cupos asignados. ¡Nos vemos mañana!`;

    return this.sendTextMessage(params.to, text);
  }

  /**
   * Envía enlace a la encuesta de satisfacción post-evento
   */
  async sendPostEventSurvey(params: {
    to: string;
    participantName: string;
    trainingName: string;
    surveyUrl: string;
  }): Promise<WhatsAppMessageResult> {
    const text = `🌟 ¡Gracias por asistir hoy a *"${params.trainingName}"* en Onprotec, *${params.participantName}*!\n\nTu opinión es vital para nosotros. Por favor tómate 1 minuto para calificar al instructor, el contenido y las instalaciones de nuestra sala en el siguiente enlace:\n👉 ${params.surveyUrl}\n\n¡Al completar la encuesta recibirás tu certificado digital!`;

    return this.sendTextMessage(params.to, text);
  }

  /**
   * Envío del mensaje a través del proveedor configurado (Meta Graph API o Baileys)
   */
  private async sendTextMessage(to: string, message: string): Promise<WhatsAppMessageResult> {
    const cleanPhone = to.replace(/[^0-9]/g, "");

    console.log(`[WhatsAppService] Enviando mensaje a ${cleanPhone} vía ${this.provider}...`);

    if (this.provider === "mock" || !this.token || this.token === "mock_token") {
      console.log(`[WhatsAppService Mock]\nPara: ${cleanPhone}\nMensaje:\n${message}\n---`);
      return {
        success: true,
        messageId: `mock_msg_${Date.now()}`,
        recipient: cleanPhone,
      };
    }

    try {
      if (this.provider === "meta") {
        const url = `https://graph.facebook.com/v19.0/${this.phoneNumberId}/messages`;
        const res = await fetch(url, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messaging_product: "whatsapp",
            to: cleanPhone,
            type: "text",
            text: { body: message },
          }),
        });

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error?.message || res.statusText);
        }

        const data = await res.json();
        return {
          success: true,
          messageId: data.messages?.[0]?.id,
          recipient: cleanPhone,
        };
      }

      // Proveedor Baileys / Custom Gateway
      const res = await fetch(this.gatewayUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: cleanPhone, message }),
      });

      if (!res.ok) throw new Error(`Gateway Error: ${res.statusText}`);
      const data = await res.json();
      return {
        success: true,
        messageId: data.id || `wa_${Date.now()}`,
        recipient: cleanPhone,
      };
    } catch (error: any) {
      console.error("[WhatsAppService] Error enviando mensaje:", error?.message || error);
      return {
        success: false,
        error: error?.message || "Fallo en envío de WhatsApp",
        recipient: cleanPhone,
      };
    }
  }
}

export const whatsappService = new WhatsAppService();
