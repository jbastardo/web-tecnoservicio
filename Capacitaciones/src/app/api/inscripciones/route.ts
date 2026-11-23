import { NextResponse } from "next/server";
import {
  initialTrainings,
  initialParticipants,
  initialRegistrations,
  persistDataset,
  appendAuditLog,
} from "@/lib/serverStorage";
import { requireAdmin, isSuperAdmin } from "@/lib/adminAuth";
import { pabiloService } from "@/services/pabiloService";
import { whatsappService } from "@/services/whatsappService";
import { fmtLocalTime, ONPROTEC_WHATSAPP_DISPLAY } from "@/utils/formatUtils";

function isActiveReg(r: any): boolean {
  return !r?.deletedAt;
}

function buildParticipantParticipations(participantId: number) {
  return initialRegistrations
    .filter((r) => isActiveReg(r) && Number(r.participantId) === Number(participantId))
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
    const onlyDeleted = searchParams.get("onlyDeleted") === "true";
    const includeDeleted = searchParams.get("includeDeleted") === "true";

    if (onlyDeleted || includeDeleted) {
      const auth = await requireAdmin();
      if (auth.errorResponse) return auth.errorResponse;
    }

    let results = onlyDeleted
      ? initialRegistrations.filter((r) => Boolean(r.deletedAt))
      : includeDeleted
      ? initialRegistrations
      : initialRegistrations.filter(isActiveReg);

    if (trainingIdParam) {
      const trainingId = parseInt(trainingIdParam);
      results = results.filter((r) => Number(r.trainingId) === trainingId);
    }
    if (participantIdParam) {
      const participantId = parseInt(participantIdParam);
      results = results.filter((r) => Number(r.participantId) === participantId);
    }

    const sorted = [...results].sort((a, b) => Number(b.id) - Number(a.id));

    const populated = sorted.map((r) => {
      const p = initialParticipants.find((part) => Number(part.id) === Number(r.participantId));
      const participations = p ? buildParticipantParticipations(p.id) : [];
      return {
        ...r,
        training: initialTrainings.find((t) => Number(t.id) === Number(r.trainingId)) || r.training,
        participant: p ? { ...p, participations } : r.participant,
      };
    });

    const deletedCount = initialRegistrations.filter((r) => Boolean(r.deletedAt)).length;
    return NextResponse.json({ success: true, data: populated, deletedCount });
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
      paymentDate,
      paymentProofUrl,
      pabiloPaymentId,
      pabiloVerificationToken,
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

    // Validación crítica: No permitir inscripciones en capacitaciones finalizadas o cerradas
    // 0. Bloqueo estricto de eventos finalizados, cancelados o con inscripciones ocultas/cerradas
    const isClosedOrPast =
      training.registrationOpen === false ||
      training.status === "Finalizado" ||
      training.status === "Cancelado" ||
      (training.status !== "Planificado" && training.status !== "En Publicidad");
    if (isClosedOrPast) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Las inscripciones para esta capacitación se encuentran cerradas u ocultas por el administrador, o el evento ya finalizó.",
        },
        { status: 400 }
      );
    }

    // 1. Regla de Aforo OnProtec:
    // - Si la actividad es cobrada (paga): aforo estricto de 18 puestos VIP garantizados.
    // - Si la presentación es gratuita: se permite pre-inscribir de 30 a 40 participantes para que el equipo
    //   reconfirme telefónicamente a los 18 que asistirán físicamente a la sala (compensando el No-Show).
    const isPaidEvent = Number(training.price) > 0 || training.isFree === false;
    const effectiveCapacity = isPaidEvent ? 18 : Math.max(Number(training.maxCapacity) || 40, 40);
    const activeRegs = initialRegistrations.filter(
      (r) =>
        isActiveReg(r) &&
        Number(r.trainingId) === Number(training.id) &&
        ["Inscrito", "Confirmado", "Asistió"].includes(r.status)
    );
    const isWaitlist = activeRegs.length >= effectiveCapacity;

    // 2. Validación Anti-Duplicados: Evitar que el mismo documento (CI / RIF) se inscriba varias veces en la misma capacitación
    const cleanDoc = docNumber ? String(docNumber).replace(/\D/g, "") : "";
    const cleanEmail = email ? String(email).trim().toLowerCase() : "";

    const alreadyRegistered = initialRegistrations.some((r) => {
      if (!isActiveReg(r)) return false;
      if (Number(r.trainingId) !== Number(training.id)) return false;
      if (r.status === "Cancelado") return false;
      const part = initialParticipants.find((p) => Number(p.id) === Number(r.participantId));
      if (!part) return false;
      const partDoc = part.docNumber ? String(part.docNumber).replace(/\D/g, "") : "";
      const partEmail = part.email ? String(part.email).trim().toLowerCase() : "";
      return (
        (cleanDoc && partDoc && cleanDoc === partDoc) ||
        (cleanEmail && partEmail && cleanEmail === partEmail)
      );
    });

    if (alreadyRegistered) {
      return NextResponse.json(
        {
          success: false,
          error: `El documento de identidad (${docType}-${docNumber}) o correo electrónico ya se encuentra registrado en esta capacitación. Si necesitas verificar tu estatus, comunícate con el equipo de OnProtec por WhatsApp (${ONPROTEC_WHATSAPP_DISPLAY}).`,
        },
        { status: 409 }
      );
    }

    // 3. Validación de Pago para Eventos Cobrados (Binance via Pabilo, Zelle/Transferencia con Comprobante, o Efectivo 48h)
    let isPaid = false;
    let pabiloStatus: "pending" | "approved" | "rejected" | "manual" = "pending";
    let verifiedPaymentId: string | null = null;
    const cleanRef = String(paymentReference || "").trim();
    const chosenMethod = String(paymentMethod || "Binance (Pabilo)").trim();
    const isBinanceMethod =
      /binance|pabilo/i.test(chosenMethod) &&
      !/zelle|efectivo|transferencia/i.test(chosenMethod);
    const isCashMethod = /efectivo/i.test(chosenMethod);
    let resolvedPaymentMethod = isPaidEvent ? chosenMethod : "Gratuito";
    let resolvedPaymentReference: string | null = isPaidEvent ? cleanRef || null : null;
    const cleanProofUrl = String(paymentProofUrl || "").trim();

    if (isPaidEvent) {
      if (isBinanceMethod) {
        if (cleanRef.length < 4) {
          return NextResponse.json(
            {
              success: false,
              error:
                "Es obligatorio validar un pago real de Binance mediante Pabilo para inscribirse con este método.",
            },
            { status: 400 }
          );
        }

        // Control Anti-Replay por referencia de pago
        const refAlreadyConsumed = initialRegistrations.some(
          (r) =>
            r.status !== "Cancelado" &&
            r.isPaid &&
            String(r.paymentReference || "").trim().toLowerCase() === cleanRef.toLowerCase()
        );
        if (refAlreadyConsumed) {
          return NextResponse.json(
            {
              success: false,
              error:
                "Este pago de Binance ya fue utilizado anteriormente para registrar otra inscripción.",
            },
            { status: 409 }
          );
        }

        const expectedAmount = Math.round((Number(training.price) || 0) * 100) / 100;
        let pabiloErrorMessage = "";

        if (
          pabiloPaymentId &&
          pabiloVerificationToken &&
          pabiloService.verifyVerificationToken(
            String(pabiloVerificationToken),
            String(pabiloPaymentId),
            cleanRef,
            expectedAmount,
            Number(training.id)
          )
        ) {
          isPaid = true;
          pabiloStatus = "approved";
          verifiedPaymentId = String(pabiloPaymentId).trim();
        } else {
          const pabiloCheck = await pabiloService.verifyPayment(
            cleanRef,
            expectedAmount,
            paymentDate
          );
          if (pabiloCheck.isValid && pabiloCheck.verified && pabiloCheck.paymentId) {
            isPaid = true;
            pabiloStatus = "approved";
            verifiedPaymentId = pabiloCheck.paymentId;
          } else {
            pabiloErrorMessage = pabiloCheck.message;
          }
        }

        if (!isPaid || !verifiedPaymentId) {
          return NextResponse.json(
            {
              success: false,
              error:
                pabiloErrorMessage ||
                "No se ha establecido un pago real en Binance. Por favor verifica tu referencia y monto con Pabilo antes de continuar.",
            },
            { status: 402 }
          );
        }

        // Control Anti-Replay por ID de transacción único en Pabilo
        const paymentIdAlreadyConsumed = initialRegistrations.some(
          (r) =>
            r.status !== "Cancelado" &&
            r.pabiloTransactionId &&
            String(r.pabiloTransactionId).trim() === verifiedPaymentId
        );
        if (paymentIdAlreadyConsumed) {
          return NextResponse.json(
            {
              success: false,
              error:
                "Este pago de Binance ya fue utilizado para registrar otra inscripción.",
            },
            { status: 409 }
          );
        }

        resolvedPaymentMethod = "Binance (Pabilo)";
        resolvedPaymentReference = cleanRef;
      } else if (isCashMethod) {
        resolvedPaymentMethod = chosenMethod;
        resolvedPaymentReference = cleanRef || "Pago en tienda (48h)";
      } else {
        // Rama 2: Zelle USD / Transferencia / Otros métodos con comprobante obligatorio
        if (cleanRef.length < 4) {
          return NextResponse.json(
            {
              success: false,
              error: `Debes ingresar el número de referencia o confirmación de tu pago por ${chosenMethod}.`,
            },
            { status: 400 }
          );
        }

        if (!cleanProofUrl) {
          return NextResponse.json(
            {
              success: false,
              error: `Es obligatorio adjuntar la imagen o PDF del comprobante de pago (${chosenMethod}) para completar tu inscripción.`,
            },
            { status: 400 }
          );
        }

        const refAlreadyConsumed = initialRegistrations.some(
          (r) =>
            r.status !== "Cancelado" &&
            r.isPaid &&
            String(r.paymentReference || "").trim().toLowerCase() === cleanRef.toLowerCase()
        );
        if (refAlreadyConsumed) {
          return NextResponse.json(
            {
              success: false,
              error: `La referencia ${cleanRef} ya fue utilizada en un pago confirmado anteriormente.`,
            },
            { status: 409 }
          );
        }

        resolvedPaymentMethod = chosenMethod;
        resolvedPaymentReference = cleanRef;
      }
    }

    // 4. Registrar o actualizar el participante en el CRM (solo si el pago fue verificado o es evento gratuito)
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

    // 5. Crear la inscripción
    const nowIso = new Date().toISOString();
    const maxRegId = initialRegistrations.reduce((m, r) => Math.max(m, Number(r.id) || 0), 0);
    const newRegId = maxRegId + 1;
    const newRegistration = {
      id: newRegId,
      trainingId: training.id,
      participantId: participant.id,
      status: isWaitlist
        ? ("Lista de Espera" as const)
        : isPaid
        ? ("Confirmado" as const)
        : ("Inscrito" as const),
      confirmationDate: !isWaitlist && isPaid ? nowIso : null,
      amount: training.price,
      currency: training.currency,
      isPaid,
      paymentDate: isPaid ? nowIso : null,
      paymentMethod: resolvedPaymentMethod,
      paymentReference: resolvedPaymentReference,
      pabiloTransactionId: verifiedPaymentId,
      pabiloStatus,
      invoiceNumber: null,
      paymentProofUrl: cleanProofUrl || null,
      specialNotes:
        specialNotes ||
        customAnswers?.specialExpectations ||
        (isWaitlist ? `Generado en lista de espera (Cupo > ${effectiveCapacity})` : null),
      experienceLevel: resolvedExp,
      carnetNumber: body.carnetNumber || null,
      customAnswers: customAnswers || {},
      formSubmittedAt: nowIso,
      reminderSentAt: null,
      surveySentAt: null,
      checkInAt: null,
      createdAt: nowIso,
      updatedAt: nowIso,
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
          ? `El cupo de convocatoria (${effectiveCapacity} registrados) está completo. Has sido registrado en la Lista de Espera prioritaria.`
          : isPaidEvent
          ? "¡Inscripción Formalmente Registrada! Tu cupo en la Sala VIP (aforo de 18 puestos) ha quedado reservado al reportar tu pago. El equipo de OnProtec te contactará en breve con los detalles finales de acceso."
          : "¡Pre-inscripción Recibida con Éxito! Tu solicitud ha sido registrada correctamente. Realizamos una preselección de asistentes para garantizar la rotación de participantes en sala. El equipo de OnProtec se comunicará contigo vía WhatsApp para confirmar tu invitación formal.",
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
  const auth = await requireAdmin();
  if (auth.errorResponse) return auth.errorResponse;

  try {
    const body = await request.json();
    const {
      id,
      action,
      trainingId,
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
      carnetNumber,
      specialNotes,
      experienceLevel,
      customAnswers,
      // Datos del participante vinculados al formulario registrado
      name,
      docType,
      docNumber,
      phone,
      email,
      company,
      cargo,
      city,
      referralSource,
    } = body;

    // Acción especial en lote: Cerrar asistencia marcando pendientes (Confirmado / Inscrito) como "No Asistió"
    if (action === "bulk_mark_noshow") {
      if (!trainingId) {
        return NextResponse.json(
          { success: false, error: "ID de capacitación requerido para cierre de asistencia." },
          { status: 400 }
        );
      }
      const targetTrainingId = parseInt(trainingId);
      const nowIso = new Date().toISOString();
      const updatedIds: number[] = [];

      for (let i = 0; i < initialRegistrations.length; i++) {
        const reg = initialRegistrations[i];
        if (
          isActiveReg(reg) &&
          Number(reg.trainingId) === targetTrainingId &&
          (reg.status === "Confirmado" || reg.status === "Inscrito")
        ) {
          initialRegistrations[i] = {
            ...reg,
            status: "No Asistió",
            checkInAt: null,
            updatedAt: nowIso,
          };
          updatedIds.push(reg.id);
        }
      }

      if (updatedIds.length > 0) {
        const tr = initialTrainings.find((t) => Number(t.id) === targetTrainingId);
        appendAuditLog({
          action: "REGISTRATION_UPDATE",
          entityType: "registration",
          entityId: targetTrainingId,
          actorName: auth.user.name,
          actorEmail: auth.user.email,
          actorRole: auth.user.role,
          summary: `Cierre de asistencia en ${tr?.code || `curso #${targetTrainingId}`}: marcó ${updatedIds.length} pendiente(s) como "No Asistió"`,
          details: {
            trainingId: targetTrainingId,
            updatedCount: updatedIds.length,
            updatedIds,
          },
        });
        await persistDataset();
      }

      return NextResponse.json({
        success: true,
        updatedCount: updatedIds.length,
        updatedIds,
        message:
          updatedIds.length > 0
            ? `Se marcaron ${updatedIds.length} participante(s) pendiente(s) como "No Asistió" en su historial.`
            : "No había participantes pendientes por marcar como No Asistió.",
      });
    }

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
    const nowIso = new Date().toISOString();

    // Acción especial: Restaurar formulario desde Papelera de Reciclaje
    if (action === "restore") {
      if (!current.deletedAt) {
        return NextResponse.json(
          { success: false, error: "Esta inscripción ya se encuentra activa." },
          { status: 400 }
        );
      }

      const restored = {
        ...current,
        deletedAt: null,
        deletedBy: null,
        deletedReason: null,
        updatedAt: nowIso,
      };
      initialRegistrations[regIndex] = restored;

      // Si el participante también estaba en papelera, restaurarlo automáticamente
      const pIdx = initialParticipants.findIndex(
        (p) => Number(p.id) === Number(current.participantId)
      );
      if (pIdx !== -1 && initialParticipants[pIdx].deletedAt) {
        initialParticipants[pIdx] = {
          ...initialParticipants[pIdx],
          deletedAt: null,
          deletedBy: null,
          updatedAt: nowIso,
        };
      }

      const tr = initialTrainings.find((t) => Number(t.id) === Number(restored.trainingId));
      const pName =
        (pIdx !== -1 ? initialParticipants[pIdx].name : restored.participant?.name) ||
        `Participante #${restored.participantId}`;

      appendAuditLog({
        action: "REGISTRATION_RESTORE",
        entityType: "registration",
        entityId: restored.id,
        actorName: auth.user.name,
        actorEmail: auth.user.email,
        actorRole: auth.user.role,
        summary: `Restauró inscripción #${restored.id} de ${pName} en ${tr?.code || `curso #${restored.trainingId}`}`,
        details: {
          registrationId: restored.id,
          trainingId: restored.trainingId,
          participantId: restored.participantId,
          participantName: pName,
        },
      });

      await persistDataset();

      return NextResponse.json({
        success: true,
        message: `Inscripción #${restored.id} de ${pName} restaurada con éxito.`,
        data: {
          ...restored,
          training: tr || restored.training,
          participant: pIdx !== -1
            ? {
                ...initialParticipants[pIdx],
                participations: buildParticipantParticipations(initialParticipants[pIdx].id),
              }
            : restored.participant,
        },
      });
    }

    // Resolver capacitación si fue reasignada
    let resolvedTraining =
      initialTrainings.find((t) => Number(t.id) === Number(current.trainingId)) || current.training;
    let resolvedTrainingId = current.trainingId;
    if (trainingId !== undefined && Number(trainingId) !== Number(current.trainingId)) {
      const targetTr = initialTrainings.find((t) => Number(t.id) === parseInt(trainingId));
      if (!targetTr) {
        return NextResponse.json(
          { success: false, error: "Capacitación de destino no encontrada." },
          { status: 404 }
        );
      }
      resolvedTraining = targetTr;
      resolvedTrainingId = targetTr.id;
    }

    // Actualizar participante vinculado si se recibieron cambios
    const partIndex = initialParticipants.findIndex(
      (p) => Number(p.id) === Number(current.participantId)
    );
    let updatedParticipant = partIndex !== -1 ? initialParticipants[partIndex] : current.participant;

    const hasParticipantUpdates =
      name !== undefined ||
      docType !== undefined ||
      docNumber !== undefined ||
      phone !== undefined ||
      email !== undefined ||
      company !== undefined ||
      cargo !== undefined ||
      city !== undefined ||
      experienceLevel !== undefined ||
      referralSource !== undefined;

    if (partIndex !== -1 && hasParticipantUpdates) {
      const savedParticipant = {
        ...initialParticipants[partIndex],
        ...(name !== undefined && { name }),
        ...(docType !== undefined && { docType }),
        ...(docNumber !== undefined && { docNumber }),
        ...(phone !== undefined && { phone }),
        ...(email !== undefined && { email }),
        ...(company !== undefined && { company }),
        ...(cargo !== undefined && { cargo }),
        ...(city !== undefined && { city }),
        ...(experienceLevel !== undefined && { experienceLevel }),
        ...(referralSource !== undefined && { referralSource }),
        updatedAt: nowIso,
      };
      initialParticipants[partIndex] = savedParticipant;
      updatedParticipant = savedParticipant;

      // Sincronizar referencia embebida en otras inscripciones del mismo participante
      initialRegistrations.forEach((r) => {
        if (Number(r.participantId) === Number(savedParticipant.id)) {
          r.participant = savedParticipant;
        }
      });
    }

    const updated = {
      ...current,
      trainingId: resolvedTrainingId,
      training: resolvedTraining,
      participant: updatedParticipant,
      ...(status !== undefined && { status }),
      ...(isPaid !== undefined && { isPaid }),
      ...(amount !== undefined && { amount: parseFloat(amount) || 0 }),
      ...(pabiloStatus !== undefined && { pabiloStatus }),
      ...(paymentMethod !== undefined && { paymentMethod }),
      ...(paymentReference !== undefined && { paymentReference }),
      ...(paymentProofUrl !== undefined && { paymentProofUrl }),
      ...(paymentNotes !== undefined && { paymentNotes }),
      ...(paymentDate !== undefined && { paymentDate }),
      ...(checkInAt !== undefined && { checkInAt }),
      ...(invoiceNumber !== undefined && { invoiceNumber }),
      ...(carnetNumber !== undefined && { carnetNumber }),
      ...(specialNotes !== undefined && { specialNotes }),
      ...(experienceLevel !== undefined && { experienceLevel }),
      ...(customAnswers !== undefined && { customAnswers }),
      updatedAt: nowIso,
    };

    initialRegistrations[regIndex] = updated;

    // Registrar en bitácora si hubo cambios relevantes
    const changedFields: string[] = [];
    if (status !== undefined && status !== current.status) {
      changedFields.push(`estado: ${current.status} → ${status}`);
    }
    if (isPaid !== undefined && Boolean(isPaid) !== Boolean(current.isPaid)) {
      changedFields.push(`pago: ${current.isPaid ? "Sí" : "No"} → ${isPaid ? "Sí" : "No"}`);
    }
    if (resolvedTrainingId !== current.trainingId) {
      changedFields.push(`curso: #${current.trainingId} → #${resolvedTrainingId}`);
    }
    if (changedFields.length > 0) {
      appendAuditLog({
        action: "REGISTRATION_UPDATE",
        entityType: "registration",
        entityId: updated.id,
        actorName: auth.user.name,
        actorEmail: auth.user.email,
        actorRole: auth.user.role,
        summary: `Actualizó inscripción #${updated.id} (${updatedParticipant?.name || "Participante"}): ${changedFields.join(", ")}`,
        details: {
          registrationId: updated.id,
          trainingId: resolvedTrainingId,
          changes: changedFields,
        },
      });
    }

    await persistDataset();

    return NextResponse.json({
      success: true,
      data: {
        ...updated,
        participant: updatedParticipant
          ? {
              ...updatedParticipant,
              participations: buildParticipantParticipations(updatedParticipant.id),
            }
          : undefined,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  return PATCH(request);
}

export async function DELETE(request: Request) {
  const auth = await requireAdmin();
  if (auth.errorResponse) return auth.errorResponse;

  try {
    const { searchParams } = new URL(request.url);
    let idParam = searchParams.get("id");
    const permanent = searchParams.get("permanent") === "true";
    let reason = searchParams.get("reason") || "";

    if (!idParam) {
      try {
        const body = await request.json();
        if (body?.id !== undefined && body?.id !== null) {
          idParam = String(body.id);
        }
        if (body?.reason) {
          reason = String(body.reason);
        }
      } catch {
        // Sin body JSON
      }
    }

    if (!idParam) {
      return NextResponse.json(
        { success: false, error: "ID de inscripción requerido para eliminar." },
        { status: 400 }
      );
    }

    const regIndex = initialRegistrations.findIndex((r) => Number(r.id) === parseInt(idParam!));
    if (regIndex === -1) {
      return NextResponse.json(
        { success: false, error: "Inscripción no encontrada." },
        { status: 404 }
      );
    }

    const targetReg = initialRegistrations[regIndex];
    const part = initialParticipants.find(
      (p) => Number(p.id) === Number(targetReg.participantId)
    );
    const tr = initialTrainings.find((t) => Number(t.id) === Number(targetReg.trainingId));
    const participantName = part?.name || targetReg.participant?.name || `Participante #${targetReg.participantId}`;
    const trainingCode = tr?.code || `curso #${targetReg.trainingId}`;

    // Borrado definitivo SOLO permitido para Super Admin y SOLO si ya está en Papelera
    if (permanent) {
      if (!isSuperAdmin(auth.user)) {
        return NextResponse.json(
          {
            success: false,
            error: "Solo un Super Admin puede eliminar definitivamente registros de la Papelera.",
          },
          { status: 403 }
        );
      }
      if (!targetReg.deletedAt) {
        return NextResponse.json(
          {
            success: false,
            error: "Primero debes enviar el formulario a la Papelera antes de eliminarlo definitivamente.",
          },
          { status: 400 }
        );
      }

      const [removed] = initialRegistrations.splice(regIndex, 1);
      appendAuditLog({
        action: "REGISTRATION_PERMANENT_DELETE",
        entityType: "registration",
        entityId: removed.id,
        actorName: auth.user.name,
        actorEmail: auth.user.email,
        actorRole: auth.user.role,
        summary: `Eliminó definitivamente de la Papelera inscripción #${removed.id} (${participantName}) en ${trainingCode}`,
        details: {
          registrationId: removed.id,
          trainingId: removed.trainingId,
          participantId: removed.participantId,
          participantName,
        },
      });

      await persistDataset({ reason: "pre-delete" });

      return NextResponse.json({
        success: true,
        permanent: true,
        message: `Formulario #${removed.id} eliminado definitivamente de la Papelera.`,
        data: removed,
      });
    }

    // Comportamiento estándar seguro: SOFT-DELETE (Papelera de Reciclaje, 100% recuperable)
    if (targetReg.deletedAt) {
      return NextResponse.json({
        success: true,
        softDeleted: true,
        message: "Este formulario ya se encuentra en la Papelera de Reciclaje.",
        data: targetReg,
      });
    }

    const nowIso = new Date().toISOString();
    const softDeleted = {
      ...targetReg,
      deletedAt: nowIso,
      deletedBy: auth.user.email,
      deletedReason: reason || "Movido a Papelera desde el panel administrativo",
      updatedAt: nowIso,
    };
    initialRegistrations[regIndex] = softDeleted;

    appendAuditLog({
      action: "REGISTRATION_SOFT_DELETE",
      entityType: "registration",
      entityId: softDeleted.id,
      actorName: auth.user.name,
      actorEmail: auth.user.email,
      actorRole: auth.user.role,
      summary: `Movió a Papelera inscripción #${softDeleted.id} de ${participantName} en ${trainingCode}`,
      details: {
        registrationId: softDeleted.id,
        trainingId: softDeleted.trainingId,
        trainingCode,
        participantId: softDeleted.participantId,
        participantName,
        reason: softDeleted.deletedReason,
      },
    });

    await persistDataset({ reason: "pre-delete" });

    return NextResponse.json({
      success: true,
      softDeleted: true,
      message: "Formulario movido a la Papelera de Reciclaje (recuperable en cualquier momento).",
      data: softDeleted,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
