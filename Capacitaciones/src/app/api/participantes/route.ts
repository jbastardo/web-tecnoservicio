import { NextResponse } from "next/server";
import {
  initialParticipants,
  initialRegistrations,
  initialTrainings,
  persistDataset,
  appendAuditLog,
} from "@/lib/serverStorage";
import { requireAdmin } from "@/lib/adminAuth";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const idParam = searchParams.get("id");

    // Pre-indexar capacitaciones por ID
    const trainingMap = new Map<number, any>();
    initialTrainings.forEach((t) => trainingMap.set(Number(t.id), t));

    // Agrupar inscripciones activas por participante (excluir papelera)
    const regsByParticipant = new Map<number, any[]>();
    initialRegistrations
      .filter((r) => !r.deletedAt)
      .forEach((r) => {
        const pid = Number(r.participantId);
        if (!regsByParticipant.has(pid)) {
          regsByParticipant.set(pid, []);
        }
        const tr = trainingMap.get(Number(r.trainingId)) || r.training;
        regsByParticipant.get(pid)!.push({
          registrationId: r.id,
          trainingId: r.trainingId,
          trainingCode: tr?.code || `CAP-2026-${String(r.trainingId).padStart(3, "0")}`,
          trainingName: tr?.name || r.originalFormName || "Capacitación OnProtec",
          trainingType: tr?.type || "Workshop",
          brand: tr?.brand || "OnProtec",
          instructor: tr?.instructor || "Especialista OnProtec",
          eventDate: tr?.eventDate || r.formSubmittedAt || r.createdAt || new Date().toISOString(),
          status: r.status,
          isPaid: r.isPaid,
          amount: r.amount,
          currency: r.currency || "USD",
          checkInAt: r.checkInAt || null,
          customAnswers: r.customAnswers || {},
          specialNotes: r.specialNotes || null,
        });
      });

    const enriched = initialParticipants
      .filter((p) => !p.deletedAt)
      .map((p) => {
      const participations = (regsByParticipant.get(Number(p.id)) || []).sort(
        (a, b) => new Date(b.eventDate || 0).getTime() - new Date(a.eventDate || 0).getTime()
      );
      const attendedCount = participations.filter((x) => x.status === "Asistió").length;
      const confirmedCount = participations.filter((x) => x.status === "Confirmado").length;
      const waitlistCount = participations.filter((x) => x.status === "Lista de Espera").length;
      const noShowCount = participations.filter((x) => x.status === "No Asistió").length;

      return {
        ...p,
        participations,
        participationSummary: {
          totalCourses: participations.length,
          attendedCount,
          confirmedCount,
          waitlistCount,
          noShowCount,
        },
      };
    });

    if (idParam) {
      const single = enriched.find((p) => String(p.id) === idParam);
      if (!single) {
        return NextResponse.json(
          { success: false, error: "Participante no encontrado" },
          { status: 404 }
        );
      }
      return NextResponse.json({ success: true, data: single });
    }

    return NextResponse.json({ success: true, data: enriched });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const auth = await requireAdmin();
  if (auth.errorResponse) return auth.errorResponse;

  try {
    const body = await request.json();
    const { id } = body;
    if (!id) {
      return NextResponse.json({ success: false, error: "ID requerido" }, { status: 400 });
    }
    const idx = initialParticipants.findIndex((p) => Number(p.id) === Number(id));
    if (idx === -1) {
      return NextResponse.json({ success: false, error: "No encontrado" }, { status: 404 });
    }

    const updatedParticipant = {
      ...initialParticipants[idx],
      ...(body.name !== undefined && { name: body.name }),
      ...(body.docType !== undefined && { docType: body.docType }),
      ...(body.docNumber !== undefined && { docNumber: body.docNumber }),
      ...(body.phone !== undefined && { phone: body.phone }),
      ...(body.email !== undefined && { email: body.email }),
      ...(body.company !== undefined && { company: body.company }),
      ...(body.cargo !== undefined && { cargo: body.cargo }),
      ...(body.city !== undefined && { city: body.city }),
      ...(body.experienceLevel !== undefined && { experienceLevel: body.experienceLevel }),
      ...(body.referralSource !== undefined && { referralSource: body.referralSource }),
      ...(body.hasStorePurchases !== undefined && {
        hasStorePurchases: Boolean(body.hasStorePurchases),
      }),
      ...(body.storePurchasesAmount !== undefined && {
        storePurchasesAmount: parseFloat(body.storePurchasesAmount) || 0,
      }),
      ...(body.notes !== undefined && { notes: body.notes }),
      updatedAt: new Date().toISOString(),
    };

    initialParticipants[idx] = updatedParticipant;

    // Sincronizar cambios en las inscripciones vinculadas
    initialRegistrations.forEach((r) => {
      if (Number(r.participantId) === Number(updatedParticipant.id)) {
        r.participant = updatedParticipant;
        if (body.experienceLevel !== undefined) {
          r.experienceLevel = body.experienceLevel;
        }
      }
    });

    await persistDataset();
    return NextResponse.json({ success: true, data: updatedParticipant });
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

    if (!idParam) {
      try {
        const body = await request.json();
        if (body?.id !== undefined && body?.id !== null) {
          idParam = String(body.id);
        }
      } catch {
        // Sin body JSON
      }
    }

    if (!idParam) {
      return NextResponse.json(
        { success: false, error: "ID de participante requerido para eliminar." },
        { status: 400 }
      );
    }

    const idx = initialParticipants.findIndex((p) => Number(p.id) === Number(idParam));
    if (idx === -1) {
      return NextResponse.json(
        { success: false, error: "Participante no encontrado." },
        { status: 404 }
      );
    }

    const nowIso = new Date().toISOString();
    const targetParticipant = {
      ...initialParticipants[idx],
      deletedAt: nowIso,
      deletedBy: auth.user.email,
      updatedAt: nowIso,
    };
    initialParticipants[idx] = targetParticipant;

    // Soft-delete de las inscripciones asociadas (recuperables desde Papelera)
    let movedRegs = 0;
    for (let i = 0; i < initialRegistrations.length; i++) {
      if (
        !initialRegistrations[i].deletedAt &&
        Number(initialRegistrations[i].participantId) === Number(targetParticipant.id)
      ) {
        initialRegistrations[i] = {
          ...initialRegistrations[i],
          deletedAt: nowIso,
          deletedBy: auth.user.email,
          deletedReason: `Participante ${targetParticipant.name} enviado a Papelera`,
          updatedAt: nowIso,
        };
        movedRegs++;
      }
    }

    appendAuditLog({
      action: "PARTICIPANT_SOFT_DELETE",
      entityType: "participant",
      entityId: targetParticipant.id,
      actorName: auth.user.name,
      actorEmail: auth.user.email,
      actorRole: auth.user.role,
      summary: `Movió a Papelera al participante ${targetParticipant.name} y sus ${movedRegs} inscripciones`,
      details: {
        participantId: targetParticipant.id,
        participantName: targetParticipant.name,
        movedRegistrations: movedRegs,
      },
    });

    await persistDataset({ reason: "pre-delete" });

    return NextResponse.json({
      success: true,
      softDeleted: true,
      message: `Participante ${targetParticipant.name} y sus ${movedRegs} formularios fueron movidos a la Papelera (recuperables).`,
      data: targetParticipant,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
