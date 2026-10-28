import { NextResponse } from "next/server";
import {
  initialTrainings,
  initialRegistrations,
  initialSurveys,
  defaultFormQuestions,
  defaultSurveyQuestions,
  persistDataset,
} from "@/lib/mockData";
import { qrService } from "@/services/qrService";

function enrichTraining(t: any) {
  const maxCap = Number(t.maxCapacity) || 18;
  const regs = initialRegistrations.filter((r) => Number(r.trainingId) === Number(t.id));
  const confirmedCount = regs.filter((r) => r.status === "Confirmado").length;
  const registeredCount = regs.filter((r) => r.status === "Inscrito").length;
  const attendedCount = regs.filter((r) => r.status === "Asistió").length;
  const waitlistCount = regs.filter((r) => r.status === "Lista de Espera").length;
  const noShowCount = regs.filter((r) => r.status === "No Asistió").length;

  const totalOccupied = confirmedCount + registeredCount + attendedCount;
  const isFull = totalOccupied >= maxCap;

  const courseSurveys = initialSurveys.filter((s) => Number(s.trainingId) === Number(t.id));
  const surveyCount = courseSurveys.length;
  const avgInstructor =
    surveyCount > 0
      ? courseSurveys.reduce((acc, s) => acc + (Number(s.ratingInstructor) || 5), 0) / surveyCount
      : 0;
  const avgNps =
    surveyCount > 0
      ? courseSurveys.reduce((acc, s) => acc + (Number(s.recommendationScore) || 10), 0) / surveyCount
      : 0;

  return {
    ...t,
    maxCapacity: maxCap,
    formQuestions:
      t.formQuestions && t.formQuestions.length > 0 ? t.formQuestions : defaultFormQuestions,
    surveyQuestions:
      t.surveyQuestions && t.surveyQuestions.length > 0
        ? t.surveyQuestions
        : defaultSurveyQuestions,
    coverPhotos: Array.isArray(t.coverPhotos) ? t.coverPhotos : t.coverImageUrl ? [t.coverImageUrl] : [],
    stats: {
      confirmedCount,
      registeredCount,
      attendedCount,
      waitlistCount,
      noShowCount,
      totalOccupied,
      availableSeats: Math.max(0, maxCap - totalOccupied),
      isFull,
      surveyCount,
      avgInstructor: Number(avgInstructor.toFixed(1)),
      avgNps: Number(avgNps.toFixed(1)),
    },
  };
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const idParam = searchParams.get("id");
    const order = searchParams.get("order") || "desc";

    if (idParam) {
      const found = initialTrainings.find(
        (t) => String(t.id) === idParam || t.code?.toLowerCase() === idParam.toLowerCase()
      );
      if (!found) {
        return NextResponse.json(
          { success: false, error: "Capacitación no encontrada" },
          { status: 404 }
        );
      }
      return NextResponse.json({ success: true, data: enrichTraining(found) });
    }

    const trainingsWithStats = initialTrainings.map(enrichTraining);

    trainingsWithStats.sort((a, b) => {
      const timeA = new Date(a.eventDate || 0).getTime();
      const timeB = new Date(b.eventDate || 0).getTime();
      return order === "asc" ? timeA - timeB : timeB - timeA;
    });

    return NextResponse.json({ success: true, data: trainingsWithStats });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      name,
      code,
      type,
      brand,
      instructor,
      eventDate,
      adStartDate,
      adCosts,
      associatedCosts,
      maxCapacity,
      price,
      currency,
      status,
      relatedSkus,
      description,
      presentationNotes,
      coverImageUrl,
      coverPhotos,
      formQuestions,
      surveyQuestions,
    } = body;

    if (!name || !instructor || !eventDate) {
      return NextResponse.json(
        { success: false, error: "Faltan campos obligatorios (Nombre, Instructor, Fecha)" },
        { status: 400 }
      );
    }

    // Cálculo seguro del nuevo ID único para evitar colisiones con capacitaciones existentes
    const maxId = initialTrainings.reduce((max, t) => Math.max(max, Number(t.id) || 0), 0);
    const newId = maxId + 1;
    const finalCode =
      code && code.trim() !== ""
        ? code.trim().toUpperCase()
        : `CAP-2026-${String(newId).padStart(3, "0")}`;

    const surveyUrl = qrService.buildSurveyUrl(newId);
    const surveyQrCode = await qrService.generateDataUrl(surveyUrl);

    const photosList = Array.isArray(coverPhotos)
      ? coverPhotos.filter(Boolean)
      : coverImageUrl
      ? [coverImageUrl]
      : [];

    const newTraining = {
      id: newId,
      name,
      code: finalCode,
      type: type || "Curso",
      brand: brand || "OnProtec",
      instructor,
      eventDate,
      adStartDate: adStartDate || null,
      adCosts: parseFloat(adCosts) || 0,
      associatedCosts: parseFloat(associatedCosts) || 0,
      maxCapacity: parseInt(maxCapacity) || 18,
      instructorCapacity: 1,
      relatedSkus: Array.isArray(relatedSkus) ? relatedSkus : [],
      price: parseFloat(price) || 0,
      currency: currency || "USD",
      status: (status as any) || ("Planificado" as const),
      surveyUrl,
      surveyQrCode,
      description: description || null,
      presentationNotes: presentationNotes || null,
      coverImageUrl: coverImageUrl || photosList[0] || null,
      coverPhotos: photosList,
      formQuestions:
        Array.isArray(formQuestions) && formQuestions.length > 0
          ? formQuestions
          : defaultFormQuestions,
      surveyQuestions:
        Array.isArray(surveyQuestions) && surveyQuestions.length > 0
          ? surveyQuestions
          : defaultSurveyQuestions,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    initialTrainings.push(newTraining);
    await persistDataset();

    return NextResponse.json(
      { success: true, data: enrichTraining(newTraining) },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "ID de capacitación requerido para editar" },
        { status: 400 }
      );
    }

    const idx = initialTrainings.findIndex((t) => Number(t.id) === Number(id));
    if (idx === -1) {
      return NextResponse.json(
        { success: false, error: "Capacitación no encontrada" },
        { status: 404 }
      );
    }

    const current = initialTrainings[idx];
    const surveyUrl = current.surveyUrl || qrService.buildSurveyUrl(current.id);
    const surveyQrCode =
      current.surveyQrCode || (await qrService.generateDataUrl(surveyUrl));

    const photosList =
      body.coverPhotos !== undefined
        ? Array.isArray(body.coverPhotos)
          ? body.coverPhotos.filter(Boolean)
          : []
        : current.coverPhotos || [];

    const primaryCover =
      body.coverImageUrl !== undefined
        ? body.coverImageUrl || photosList[0] || null
        : current.coverImageUrl || photosList[0] || null;

    const updated = {
      ...current,
      ...(body.name !== undefined && { name: body.name }),
      ...(body.code !== undefined && { code: body.code }),
      ...(body.type !== undefined && { type: body.type }),
      ...(body.brand !== undefined && { brand: body.brand }),
      ...(body.instructor !== undefined && { instructor: body.instructor }),
      ...(body.eventDate !== undefined && { eventDate: body.eventDate }),
      ...(body.adStartDate !== undefined && { adStartDate: body.adStartDate || null }),
      ...(body.adCosts !== undefined && { adCosts: parseFloat(body.adCosts) || 0 }),
      ...(body.associatedCosts !== undefined && {
        associatedCosts: parseFloat(body.associatedCosts) || 0,
      }),
      ...(body.maxCapacity !== undefined && {
        maxCapacity: parseInt(body.maxCapacity) || 18,
      }),
      ...(body.price !== undefined && { price: parseFloat(body.price) || 0 }),
      ...(body.currency !== undefined && { currency: body.currency }),
      ...(body.status !== undefined && { status: body.status }),
      ...(body.relatedSkus !== undefined && { relatedSkus: body.relatedSkus }),
      ...(body.description !== undefined && { description: body.description }),
      ...(body.presentationNotes !== undefined && {
        presentationNotes: body.presentationNotes,
      }),
      coverImageUrl: primaryCover,
      coverPhotos: photosList,
      ...(body.formQuestions !== undefined && { formQuestions: body.formQuestions }),
      ...(body.surveyQuestions !== undefined && {
        surveyQuestions: body.surveyQuestions,
      }),
      surveyUrl,
      surveyQrCode,
      updatedAt: new Date().toISOString(),
    };

    initialTrainings[idx] = updated;

    // Actualizar referencia embebida en inscripciones
    initialRegistrations.forEach((r) => {
      if (Number(r.trainingId) === Number(updated.id)) {
        r.training = updated;
      }
    });

    await persistDataset();

    return NextResponse.json({ success: true, data: enrichTraining(updated) });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  return PUT(request);
}
