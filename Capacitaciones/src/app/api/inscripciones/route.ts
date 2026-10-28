import { NextResponse } from "next/server";
import {
  initialTrainings,
  initialParticipants,
  initialRegistrations,
  persistDataset,
} from "@/lib/mockData";
import { pabiloService } from "@/services/pabiloService";
import { whatsappService } from "@/services/whatsappService";
import { fmtLocalTime } from "@/utils/formatUtils";

function buildParticipantParticipations(participantId: number) {
  return initialRegistrations
    .filter((r) => Number(r.participantId) === Number(participantId))
    .map((r) => {
      const tr = initialTrainings.find((t) => Number(t.id) === Number(r.trainingId));
      return {
        registrationId: r.id,
        trainingId: r.trainingId,
        trainingCode: tr?.code || `CAP-${r.trainingId}`,
        trainingName: tr?.name || r.originalFormName || "Capacitación OnProtec",
        trainingType: tr?.type || "Workshop",
        brand: tr?.brand || "OnProtec",
        eventDate: tr?.eventDate || r.createdAt || new Date().toISOString(),
        status: r.status,
        isPaid: r.isPaid,
        amount: r.amount,
        checkInAt: r.checkInAt || null,
      };
    })
    .sort((a, b) => new Date(b.eventDate || 0).getTime() - new Date(a.eventDate || 0).getTime());
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const trainingIdParam = searchParams.get("trainingId");
    const participantIdParam = searchParams.get("participantId");

    let results = initialRegistrations;
    if (trainingIdParam) {
      const trainingId = parseInt(trainingIdParam);
      results = results.filter((r) => Number(r.trainingId) === trainingId);
    }
    if (participantIdParam) {
      const participantId = parseInt(participantIdParam);
      results = results.filter((r) => Number(r.participantId) === participantId);
    }

    const populated = results.map((r) => {
      const p = initialParticipants.find((part) => Number(part.id) === Number(r.participantId));
      const participations = p ? buildParticipantParticipations(p.id) : [];
      return {
        ...r,
        training: initialTrainings.find((t) => Number(t.id) === Number(r.trainingId)),
        participant: p ? { ...p, participations } : undefined,
      };
    });

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
      cargo,
      city,
      experienceLevel,
      referralSource,
      paymentMethod,
      paymentReference,
      paymentProofUrl,
      specialNotes,
      customAnswers = {},
    } = body;

    if (!trainingId || !name || !docNumber || !phone || !email) {
      return NextResponse.json(
        { success: false, error: "Datos del participante o capacitación incompletos." },
        { status: 400 }
      );
    }

    const training = initialTrainings.find((t) => Number(t.id) === parseInt(trainingId));
    if (!training) {
      return NextResponse.json(
        { success: false, error: "Capacitación no encontrada." },
        { status: 404 }
      );
    }

    // 1. Verificar el aforo de la sala de capacitaciones (18 cupos)
    const maxCap = Number(training.maxCapacity) || 18;
    const activeRegs = initialRegistrations.filter(
      (r) =>
        Number(r.trainingId) === Number(training.id) &&
        ["Inscrito", "Confirmado", "Asistió"].includes(r.status)
    );
    const isWaitlist = activeRegs.length >= maxCap;

    // 2. Registrar o actualizar el participante en el CRM
    let participant = initialParticipants.find(
      (p) =>
        (p.docNumber && p.docNumber.replace(/\D/g, "") === String(docNumber).replace(/\D/g, "")) ||
        p.email.toLowerCase() === email.toLowerCase()
    );

    const resolvedCargo = cargo || customAnswers?.cargo || null;
    const resolvedExp = experienceLevel || customAnswers?.experienceLevel || null;
    const resolvedRef = referralSource || customAnswers?.referralSource || null;

    if (!participant) {
      const maxPid = initialParticipants.reduce((m, p) => Math.max(m, Number(p.id) || 0), 0);
      participant = {
        id: maxPid + 1,
        name,
        docType: docType as any,
        docNumber,
        phone,
        email,
        hasStorePurchases: false,
        storePurchasesAmount: 0,
        company: company || null,
        cargo: resolvedCargo,
        city: city || "Caracas",
        experienceLevel: resolvedExp,
        referralSource: resolvedRef,
        allowsContact: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      initialParticipants.push(participant);
    } else {
      if (company && !participant.company) participant.company = company;
      if (resolvedCargo && !participant.cargo) participant.cargo = resolvedCargo;
      if (resolvedExp && !participant.experienceLevel) participant.experienceLevel = resolvedExp;
      if (resolvedRef && !participant.referralSource) participant.referralSource = resolvedRef;
      participant.updatedAt = new Date().toISOString();
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
    const maxRegId = initialRegistrations.reduce((m, r) => Math.max(m, Number(r.id) || 0), 0);
    const newRegId = maxRegId + 1;
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
      paymentMethod: training.price > 0 ? paymentMethod || "Transferencia" : "Gratuito",
      paymentReference: paymentReference || null,
      pabiloTransactionId,
      pabiloStatus,
      invoiceNumber: null,
      paymentProofUrl: paymentProofUrl || null,
      specialNotes:
        specialNotes ||
        customAnswers?.specialExpectations ||
        (isWaitlist ? `Generado en lista de espera (Cupo > ${maxCap})` : null),
      experienceLevel: resolvedExp,
      customAnswers: customAnswers || {},
      formSubmittedAt: new Date().toISOString(),
      reminderSentAt: null,
      surveySentAt: null,
      checkInAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      training,
      participant,
    };

    initialRegistrations.push(newRegistration);
    await persistDataset();

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
          ? `El aforo de ${maxCap} cupos está lleno. Has sido registrado con éxito en la Lista de Espera prioritaria.`
          : "Inscripción registrada exitosamente en la Sala de Capacitaciones OnProtec.",
        data: {
          ...newRegistration,
          participant: {
            ...participant,
            participations: buildParticipantParticipations(participant.id),
          },
        },
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
      paymentProofUrl,
      paymentNotes,
      paymentDate,
      checkInAt,
      invoiceNumber,
      customAnswers,
    } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "ID de inscripción requerido." },
        { status: 400 }
      );
    }

    const regIndex = initialRegistrations.findIndex((r) => Number(r.id) === parseInt(id));
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
      ...(paymentProofUrl !== undefined && { paymentProofUrl }),
      ...(paymentNotes !== undefined && { paymentNotes }),
      ...(paymentDate !== undefined && { paymentDate }),
      ...(checkInAt !== undefined && { checkInAt }),
      ...(invoiceNumber !== undefined && { invoiceNumber }),
      ...(customAnswers !== undefined && { customAnswers }),
      updatedAt: new Date().toISOString(),
    };

    initialRegistrations[regIndex] = updated;
    await persistDataset();

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
