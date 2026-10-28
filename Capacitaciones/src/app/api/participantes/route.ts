import { NextResponse } from "next/server";
import {
  initialParticipants,
  initialRegistrations,
  initialTrainings,
  persistDataset,
} from "@/lib/mockData";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const idParam = searchParams.get("id");

    // Pre-indexar capacitaciones por ID
    const trainingMap = new Map<number, any>();
    initialTrainings.forEach((t) => trainingMap.set(Number(t.id), t));

    // Agrupar inscripciones por participante
    const regsByParticipant = new Map<number, any[]>();
    initialRegistrations.forEach((r) => {
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

    const enriched = initialParticipants.map((p) => {
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

    initialParticipants[idx] = {
      ...initialParticipants[idx],
      ...(body.name !== undefined && { name: body.name }),
      ...(body.phone !== undefined && { phone: body.phone }),
      ...(body.email !== undefined && { email: body.email }),
      ...(body.company !== undefined && { company: body.company }),
      ...(body.cargo !== undefined && { cargo: body.cargo }),
      ...(body.city !== undefined && { city: body.city }),
      ...(body.hasStorePurchases !== undefined && {
        hasStorePurchases: Boolean(body.hasStorePurchases),
      }),
      ...(body.storePurchasesAmount !== undefined && {
        storePurchasesAmount: parseFloat(body.storePurchasesAmount) || 0,
      }),
      ...(body.notes !== undefined && { notes: body.notes }),
      updatedAt: new Date().toISOString(),
    };

    await persistDataset();
    return NextResponse.json({ success: true, data: initialParticipants[idx] });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
