import crypto from "crypto";

export interface PabiloPaymentPayload {
  transactionId: string;
  reference: string;
  amount: number;
  currency: "USD" | "BS";
  payerDocNumber: string;
  payerName: string;
  paymentMethod: string;
  status: "approved" | "rejected" | "pending";
  timestamp: string;
}

export class PabiloService {
  private apiUrl: string;
  private apiKey: string;
  private webhookSecret: string;

  constructor() {
    this.apiUrl = process.env.PABILO_API_URL || "https://api.pabilo.com/v1";
    this.apiKey = process.env.PABILO_API_KEY || "";
    this.webhookSecret = process.env.PABILO_WEBHOOK_SECRET || "";
  }

  /**
   * Valida la firma criptográfica HMAC-SHA256 del Webhook enviado por Pabilo
   */
  verifyWebhookSignature(payloadString: string, signatureHeader: string): boolean {
    if (!this.webhookSecret || this.webhookSecret === "whsec_test_demo_secret") {
      return true; // Modo desarrollo / prueba
    }

    try {
      const hmac = crypto.createHmac("sha256", this.webhookSecret);
      const digest = hmac.update(payloadString).digest("hex");
      return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(signatureHeader));
    } catch {
      return false;
    }
  }

  /**
   * Consulta el estado de un pago directamente en la API de Pabilo
   */
  async verifyPayment(transactionIdOrRef: string): Promise<{
    isValid: boolean;
    status: "approved" | "rejected" | "pending";
    amount: number;
    currency: "USD" | "BS";
    message: string;
  }> {
    try {
      console.log(`[PabiloService] Verificando pago con ID/Ref: ${transactionIdOrRef}...`);

      // Modo de prueba o desarrollo
      if (!this.apiKey || this.apiKey.includes("test")) {
        const isApproved = !transactionIdOrRef.toLowerCase().includes("fail");
        return {
          isValid: isApproved,
          status: isApproved ? "approved" : "rejected",
          amount: 35.0,
          currency: "USD",
          message: isApproved
            ? "Pago conciliado y validado exitosamente por Pabilo (Simulación)."
            : "Transacción rechazada por fondos insuficientes o referencia inválida.",
        };
      }

      // Consulta real a Pabilo API
      const res = await fetch(`${this.apiUrl}/transactions/${transactionIdOrRef}`, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) {
        throw new Error(`Pabilo API error: ${res.statusText}`);
      }

      const data = await res.json();
      return {
        isValid: data.status === "approved",
        status: data.status,
        amount: data.amount,
        currency: data.currency,
        message: data.message || "Estado obtenido de Pabilo",
      };
    } catch (error: any) {
      console.error("[PabiloService] Error verificando pago:", error?.message || error);
      return {
        isValid: false,
        status: "pending",
        amount: 0,
        currency: "USD",
        message: error?.message || "Error al conectar con Pabilo",
      };
    }
  }
}

export const pabiloService = new PabiloService();
