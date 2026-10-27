import { NextResponse } from "next/server";
import { initialTrainings, initialParticipants, initialRegistrations } from "@/lib/mockData";
import { pabiloService } from "@/services/pabiloService";
import { whatsappService } from "@/services/whatsappService";
import { fmtLocalTime } from "@/utils/formatUtils";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const trainingIdParam = searchParams.get("trainingId");

    let results = initialRegistrations;
    if (trainingIdParam) {
      const trainingId = parseInt(trainingIdParam);
      results = results.filter((r) => r.trainingId === trainingId);
    }

    const populated = results.map((r) => ({
      ...r,
      training: initialTrainings.find((t) => t.id === r.trainingId),
      participant: initialParticipants.find((p) => p.id === r.participantId),
    }));

    return NextResponse.json({ success: true, data: populated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      trainingId,
      name,
      docType = "V",
      docNumber,
      phone,
      email,
      company,
      paymentMethod,
      paymentReference,
      paymentProofUrl,
      specialNotes,
    } = body;

    if (!trainingId || !name || !docNumber || !phone || !email) {
      return NextResponse.json(
        { success: false, error: "Datos del participante o capacitación incompletos." },
        { status: 400 }
      );
    }

    const training = initialTrainings.find((t) => t.id === parseInt(trainingId));
    if (!training) {
      return NextResponse.json(
        { success: false, error: "Capacitación no encontrada." },
        { status: 404 }
      );
    }

    // 1. Verificar el aforo de la sala de capacitaciones (18 cupos)
    const activeRegs = initialRegistrations.filter(
      (r) => r.trainingId === training.id && ["Inscrito", "Confirmado", "Asistió"].includes(r.status)
    );
    const isWaitlist = activeRegs.length >= training.maxCapacity;

    // 2. Registrar o buscar el participante en el CRM
    let participant = initialParticipants.find(
      (p) => p.docNumber === docNumber || p.email.toLowerCase() === email.toLowerCase()
    );

    if (!participant) {
      participant = {
        id: initialParticipants.length + 1,
        name,
        docType: docType as any,
        docNumber,
        phone,
        email,
        hasStorePurchases: false, // Nuevo prospecto
        storePurchasesAmount: 0,
        company: company || null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      initialParticipants.push(participant);
    }

    // 3. Validación de Pago con Pabilo si aplica
    let isPaid = false;
    let pabiloStatus: any = "pending";
    let pabiloTransactionId: string | null = null;

    if (paymentReference && paymentMethod?.toLowerCase().includes("pabilo")) {
      const pabiloCheck = await pabiloService.verifyPayment(paymentReference);
      if (pabiloCheck.isValid) {
        isPaid = true;
        pabiloStatus = "approved";
        pabiloTransactionId = `tx_pab_${Date.now()}`;
      }
    }

    // 4. Crear la inscripción
    const newRegId = initialRegistrations.length + 1;
    const newRegistration = {
      id: newRegId,
      trainingId: training.id,
      participantId: participant.id,
      status: isWaitlist ? ("Lista de Espera" as const) : ("Inscrito" as const),
      confirmationDate: null,
      amount: training.price,
      currency: training.currency,
      isPaid,
      paymentDate: isPaid ? new Date().toISOString() : null,
      paymentMethod: paymentMethod || "Transferencia",
      paymentReference: paymentReference || null,
      pabiloTransactionId,
      pabiloStatus,
      invoiceNumber: null,
      paymentProofUrl: paymentProofUrl || null,
      specialNotes: specialNotes || (isWaitlist ? "Generado en lista de espera (Cupo > 18)" : null),
      reminderSentAt: null,
      surveySentAt: null,
      checkInAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      training,
      participant,
    };

    initialRegistrations.push(newRegistration);

    // 5. Envío de notificación automatizada por WhatsApp
    await whatsappService.sendRegistrationConfirmation({
      to: participant.phone,
      participantName: participant.name,
      trainingName: training.name,
      eventDate: fmtLocalTime(training.eventDate),
      isWaitlist,
    });

    return NextResponse.json(
      {
        success: true,
        message: isWaitlist
          ? "El aforo de 18 cupos está lleno. Has sido registrado con éxito en la Lista de Espera prioritaria."
          : "Inscripción registrada exitosamente en la Sala de Capacitaciones Onprotec.",
        data: newRegistration,
        isWaitlist,
      },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const {
      id,
      status,
      isPaid,
      amount,
      pabiloStatus,
      paymentMethod,
      paymentReference,
      paymentNotes,
      paymentDate,
      checkInAt,
      invoiceNumber,
    } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "ID de inscripción requerido." },
        { status: 400 }
      );
    }

    const regIndex = initialRegistrations.findIndex((r) => r.id === parseInt(id));
    if (regIndex === -1) {
      return NextResponse.json(
        { success: false, error: "Inscripción no encontrada." },
        { status: 404 }
      );
    }

    const current = initialRegistrations[regIndex];
    const updated = {
      ...current,
      ...(status !== undefined && { status }),
      ...(isPaid !== undefined && { isPaid }),
      ...(amount !== undefined && { amount: parseFloat(amount) }),
      ...(pabiloStatus !== undefined && { pabiloStatus }),
      ...(paymentMethod !== undefined && { paymentMethod }),
      ...(paymentReference !== undefined && { paymentReference }),
      ...(paymentNotes !== undefined && { paymentNotes }),
      ...(paymentDate !== undefined && { paymentDate }),
      ...(checkInAt !== undefined && { checkInAt }),
      ...(invoiceNumber !== undefined && { invoiceNumber }),
      updatedAt: new Date().toISOString(),
    };

    initialRegistrations[regIndex] = updated;

    // Sincronizar con archivo local realFormsData.json si está disponible
    try {
      const fs = await import("fs");
      const path = await import("path");
      const filePath = path.join(process.cwd(), "src", "lib", "realFormsData.json");
      if (fs.existsSync(filePath)) {
        const raw = fs.readFileSync(filePath, "utf-8");
        const parsed = JSON.parse(raw);
        if (parsed.registrations) {
          const fileIndex = parsed.registrations.findIndex((r: any) => r.id === parseInt(id));
          if (fileIndex !== -1) {
            parsed.registrations[fileIndex] = updated;
            fs.writeFileSync(filePath, JSON.stringify(parsed, null, 2));
          }
        }
      }
    } catch (fsErr) {
      console.warn("No se pudo escribir en realFormsData.json (modo solo lectura o serverless):", fsErr);
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

