import { NextResponse } from "next/server";
import { initialTrainings, initialRegistrations } from "@/lib/serverStorage";
import { pabiloService } from "@/services/pabiloService";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { trainingId, reference, fechaPago } = body || {};

    const cleanRef = String(reference || "").trim();
    if (!trainingId || cleanRef.length < 4) {
      return NextResponse.json(
        {
          success: false,
          verified: false,
          errorCode: "INVALID_INPUT",
          error:
            "Debes indicar la capacitación y una referencia / Order ID válida de Binance Pay (mínimo 4 caracteres).",
        },
        { status: 400 }
      );
    }

    const training = initialTrainings.find((t) => Number(t.id) === Number(trainingId));
    if (!training) {
      return NextResponse.json(
        {
          success: false,
          verified: false,
          errorCode: "TRAINING_NOT_FOUND",
          error: "Capacitación no encontrada.",
        },
        { status: 404 }
      );
    }

    const expectedAmount = Math.round((Number(training.price) || 0) * 100) / 100;
    if (expectedAmount <= 0) {
      return NextResponse.json(
        {
          success: false,
          verified: false,
          errorCode: "FREE_TRAINING",
          error: "Esta capacitación es gratuita y no requiere verificación de pago.",
        },
        { status: 400 }
      );
    }

    // 1. Verificar localmente si la referencia ya fue consumida por otra inscripción activa
    const alreadyUsedByRef = initialRegistrations.some(
      (r) =>
        r.status !== "Cancelado" &&
        r.isPaid &&
        String(r.paymentReference || "").trim().toLowerCase() === cleanRef.toLowerCase()
    );
    if (alreadyUsedByRef) {
      return NextResponse.json(
        {
          success: false,
          verified: false,
          errorCode: "ALREADY_CONSUMED",
          error:
            "Este pago de Binance Pay ya fue utilizado anteriormente para registrar otra inscripción.",
        },
        { status: 409 }
      );
    }

    // 2. Consultar en tiempo real contra Pabilo (betaserio - Onprotec Binance)
    const result = await pabiloService.verifyPayment(cleanRef, expectedAmount, fechaPago);

    if (!result.isValid || !result.verified) {
      return NextResponse.json(
        {
          success: false,
          verified: false,
          errorCode: result.errorCode || "VERIFICATION_FAILED",
          error: result.message || "No se pudo verificar el pago en Binance Pay.",
        },
        { status: 400 }
      );
    }

    // 3. Validar Anti-Replay por pabiloTransactionId único devuelto por Pabilo
    const alreadyUsedByPaymentId = initialRegistrations.some(
      (r) =>
        r.status !== "Cancelado" &&
        r.pabiloTransactionId &&
        String(r.pabiloTransactionId).trim() === result.paymentId
    );
    if (alreadyUsedByPaymentId) {
      return NextResponse.json(
        {
          success: false,
          verified: false,
          errorCode: "ALREADY_CONSUMED",
          error: "Este pago de Binance Pay ya fue registrado en otra inscripción.",
        },
        { status: 409 }
      );
    }

    const verificationToken = pabiloService.createVerificationToken(
      result.paymentId,
      cleanRef,
      expectedAmount,
      Number(training.id)
    );

    return NextResponse.json(
      {
        success: true,
        verified: true,
        paymentId: result.paymentId,
        reference: cleanRef,
        amount: expectedAmount,
        currency: "USD",
        fechaPago: result.fechaPago,
        verificationToken,
        message: result.message,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("[API /pabilo/verify] Error:", error?.message || error);
    return NextResponse.json(
      {
        success: false,
        verified: false,
        errorCode: "SERVER_ERROR",
        error: error?.message || "Error interno verificando el pago en Pabilo.",
      },
      { status: 500 }
    );
  }
}
