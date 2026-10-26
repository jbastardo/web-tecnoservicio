import { NextResponse } from "next/server";
import { pabiloService } from "@/services/pabiloService";
import { initialRegistrations } from "@/lib/mockData";

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get("x-pabilo-signature") || "";

    const isValidSig = pabiloService.verifyWebhookSignature(rawBody, signature);
    if (!isValidSig) {
      return NextResponse.json({ success: false, error: "Firma inválida de webhook Pabilo" }, { status: 401 });
    }

    const payload = JSON.parse(rawBody);
    const { transactionId, reference, status, amount } = payload;

    // Buscar inscripción por referencia o ID
    const reg = initialRegistrations.find(
      (r) => r.paymentReference === reference || r.pabiloTransactionId === transactionId
    );

    if (reg) {
      reg.pabiloStatus = status === "approved" ? "approved" : "rejected";
      if (status === "approved") {
        reg.isPaid = true;
        reg.paymentDate = new Date().toISOString();
        if (reg.status === "Inscrito") {
          reg.status = "Confirmado";
          reg.confirmationDate = new Date().toISOString();
        }
      }
      reg.updatedAt = new Date().toISOString();
    }

    return NextResponse.json({
      success: true,
      message: `Transacción Pabilo ${transactionId} procesada correctamente.`,
      matched: !!reg,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
