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

export interface PabiloVerificationResult {
  isValid: boolean;
  verified: boolean;
  status: "approved" | "rejected" | "pending";
  paymentId: string;
  isNew: boolean;
  amount: number;
  currency: "USD" | "BS";
  fechaPago: string;
  errorCode: string;
  message: string;
}

const PABILO_ERROR_MESSAGES: Record<string, string> = {
  PAYMENT_NOT_FOUND:
    "El pago no fue encontrado en la cuenta Binance de OnProtec. Verifica el Nro. de Referencia / Order ID, la fecha del pago y que hayas transferido el monto exacto.",
  PAYMENT_AMOUNT_NOT_VALID:
    "La referencia existe en Binance, pero el monto transferido no coincide con el valor exacto de esta capacitación.",
  NOT_ENOUGH_CREDITS:
    "Servicio de validación Pabilo sin créditos disponibles temporalmente. Contacta a soporte OnProtec.",
  USER_BANK_IS_DISABLED:
    "La cuenta receptora de Binance en Pabilo está deshabilitada temporalmente.",
  USER_BANCK_BLOCKED:
    "La cuenta receptora en Pabilo requiere actualización de sesión.",
  MOVEMENT_TYPE_REQUIRED:
    "Se requiere especificar el tipo de movimiento.",
  IS_NOT_POSITIVE_PAYMENT:
    "El movimiento consultado no corresponde a un pago recibido.",
  UNAUTHORIZED:
    "Error de autenticación con el API Key de Pabilo.",
  PLAN_IS_NOT_ACTIVE:
    "La cuenta de Pabilo no tiene un plan activo en este momento.",
  USER_IS_NOT_ACTIVE:
    "El usuario de Pabilo no se encuentra activo.",
  CLIENT_IS_NOT_ACTIVE:
    "El cliente de Pabilo no se encuentra activo.",
  REQUEST_LIMIT_REACHED:
    "Límite de consultas del plan de Pabilo alcanzado temporalmente.",
  ALREADY_CONSUMED:
    "Este pago de Binance ya fue utilizado anteriormente para registrar otra inscripción.",
};

export function getCaracasTodayDate(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Caracas",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export class PabiloService {
  private apiUrl: string;
  private apiKey: string;
  private webhookSecret: string;
  private binanceBankId: string;

  constructor() {
    const rawUrl = (process.env.PABILO_API_URL || "https://api.pabilo.app").trim();
    this.apiUrl =
      rawUrl.includes("api.pabilo.com") || !rawUrl
        ? "https://api.pabilo.app"
        : rawUrl.replace(/\/+$/, "");
    this.apiKey =
      (process.env.PABILO_API_KEY || "2bb7d915-22a3-4c93-9e18-1654309c76f6").trim();
    this.webhookSecret =
      (
        process.env.PABILO_WEBHOOK_SECRET ||
        "27d8ba192795067fca0d4b2b0d6aa85988478e0fcf466a183197e9576ce3011d"
      ).trim();
    this.binanceBankId =
      (process.env.PABILO_BINANCE_BANK_ID || "6a8628f7ea21f60026765c37").trim();
  }

  private resolveSigningSecret(): string {
    return this.webhookSecret || this.apiKey;
  }

  private buildTokenPayload(
    paymentId: string,
    reference: string,
    amount: number,
    trainingId: number
  ): string {
    const roundedAmount = (Math.round(Number(amount || 0) * 100) / 100).toFixed(2);
    return `${String(paymentId).trim()}|${String(reference).trim()}|${roundedAmount}|${Number(trainingId)}`;
  }

  createVerificationToken(
    paymentId: string,
    reference: string,
    amount: number,
    trainingId: number
  ): string {
    const payload = this.buildTokenPayload(paymentId, reference, amount, trainingId);
    return crypto
      .createHmac("sha256", this.resolveSigningSecret())
      .update(payload)
      .digest("hex");
  }

  verifyVerificationToken(
    token: string,
    paymentId: string,
    reference: string,
    amount: number,
    trainingId: number
  ): boolean {
    if (!token || !paymentId || !reference) return false;
    try {
      const expected = this.createVerificationToken(paymentId, reference, amount, trainingId);
      const tokenBuf = Buffer.from(String(token).trim(), "utf8");
      const expectedBuf = Buffer.from(expected, "utf8");
      if (tokenBuf.length !== expectedBuf.length) return false;
      return crypto.timingSafeEqual(tokenBuf, expectedBuf);
    } catch {
      return false;
    }
  }

  /**
   * Valida la firma criptográfica HMAC-SHA256 del Webhook enviado por Pabilo
   */
  verifyWebhookSignature(payloadString: string, signatureHeader: string): boolean {
    if (!this.webhookSecret || !signatureHeader) {
      return false;
    }

    try {
      const hmac = crypto.createHmac("sha256", this.webhookSecret);
      const digest = hmac.update(payloadString).digest("hex");
      const cleanSig = signatureHeader.replace(/^sha256=/i, "").trim();
      const digestBuf = Buffer.from(digest, "utf8");
      const sigBuf = Buffer.from(cleanSig, "utf8");
      if (digestBuf.length !== sigBuf.length) return false;
      return crypto.timingSafeEqual(digestBuf, sigBuf);
    } catch {
      return false;
    }
  }

  /**
   * Verifica un pago real contra la cuenta Binance de OnProtec en Pabilo (endpoint betaserio)
   */
  async verifyPayment(
    reference: string,
    expectedAmount = 0,
    fechaPago?: string,
    userBankId?: string
  ): Promise<PabiloVerificationResult> {
    const cleanRef = String(reference || "").trim();
    const roundedAmount = Math.round(Number(expectedAmount || 0) * 100) / 100;
    const rawFecha = String(fechaPago || "").trim();
    const resolvedFecha = /^\d{4}-\d{2}-\d{2}$/.test(rawFecha)
      ? rawFecha
      : getCaracasTodayDate();
    const targetBankId = (userBankId || this.binanceBankId).trim();

    if (cleanRef.length < 4) {
      return {
        isValid: false,
        verified: false,
        status: "rejected",
        paymentId: "",
        isNew: false,
        amount: 0,
        currency: "USD",
        fechaPago: resolvedFecha,
        errorCode: "INVALID_REFERENCE",
        message: "Ingresa al menos los últimos 4 a 6 dígitos o el Order ID completo del pago.",
      };
    }

    if (!Number.isFinite(roundedAmount) || roundedAmount <= 0) {
      return {
        isValid: false,
        verified: false,
        status: "rejected",
        paymentId: "",
        isNew: false,
        amount: 0,
        currency: "USD",
        fechaPago: resolvedFecha,
        errorCode: "INVALID_AMOUNT",
        message: "El monto requerido de la capacitación no es válido para verificación.",
      };
    }

    if (!this.apiKey || !targetBankId) {
      return {
        isValid: false,
        verified: false,
        status: "rejected",
        paymentId: "",
        isNew: false,
        amount: 0,
        currency: "USD",
        fechaPago: resolvedFecha,
        errorCode: "NO_API_KEY",
        message: "La configuración de Pabilo API no está completa en el servidor.",
      };
    }

    const endpoint = `${this.apiUrl}/userbankpayment/${targetBankId}/betaserio`;
    const payload = {
      bank_reference: cleanRef,
      amount: roundedAmount,
      movement_type: "GENERIC",
      source_name: "Sala Capacitaciones OnProtec Web",
      fecha_pago: resolvedFecha,
    };

    try {
      console.log(
        `[PabiloService] Consultando betaserio Binance (${targetBankId}) Ref=${cleanRef} Monto=${roundedAmount} Fecha=${resolvedFecha}...`
      );

      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          appKey: this.apiKey,
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(110000),
      });

      const rawText = await res.text();
      let body: any = {};
      try {
        body = rawText ? JSON.parse(rawText) : {};
      } catch {
        body = { error: "INVALID_RESPONSE", message: rawText.slice(0, 300) };
      }

      if (res.status === 200) {
        const paymentData = body?.data?.user_bank_payment || {};
        const paymentStatus = String(paymentData.status || "").toLowerCase();
        const paymentId = String(paymentData.id || "");
        const isNew = Boolean(body?.data?.is_new);

        if (paymentStatus === "paid" && paymentId) {
          return {
            isValid: true,
            verified: true,
            status: "approved",
            paymentId,
            isNew,
            amount: roundedAmount,
            currency: "USD",
            fechaPago: resolvedFecha,
            errorCode: "",
            message: "Pago real en Binance validado exitosamente por Pabilo.",
          };
        }

        return {
          isValid: false,
          verified: false,
          status: "rejected",
          paymentId,
          isNew,
          amount: 0,
          currency: "USD",
          fechaPago: resolvedFecha,
          errorCode: "PAYMENT_NOT_PAID",
          message: `El movimiento en Pabilo no tiene estado confirmado (estado: ${paymentStatus || "desconocido"}).`,
        };
      }

      const errorCode = String(body?.error || `HTTP_${res.status}`);
      const mappedMessage =
        PABILO_ERROR_MESSAGES[errorCode] ||
        body?.message ||
        "No se pudo verificar el pago en Binance.";

      console.warn(
        `[PabiloService] Verificación rechazada Ref=${cleanRef}: ${errorCode} - ${body?.message || mappedMessage}`
      );

      return {
        isValid: false,
        verified: false,
        status: "rejected",
        paymentId: "",
        isNew: false,
        amount: 0,
        currency: "USD",
        fechaPago: resolvedFecha,
        errorCode,
        message: mappedMessage,
      };
    } catch (error: any) {
      const isTimeout = error?.name === "TimeoutError" || error?.name === "AbortError";
      console.error("[PabiloService] Error conectando con Pabilo:", error?.message || error);
      return {
        isValid: false,
        verified: false,
        status: "pending",
        paymentId: "",
        isNew: false,
        amount: 0,
        currency: "USD",
        fechaPago: resolvedFecha,
        errorCode: isTimeout ? "TIMEOUT" : "CONNECTION_ERROR",
        message: isTimeout
          ? "La consulta a Binance / Pabilo excedió el tiempo de espera. Intenta verificar nuevamente en unos segundos."
          : "No se pudo conectar con Pabilo para validar el pago. Verifica tu conexión e intenta de nuevo.",
      };
    }
  }
}

export const pabiloService = new PabiloService();
