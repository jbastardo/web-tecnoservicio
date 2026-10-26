import { NextResponse } from "next/server";
import { initialTrainings, initialRegistrations } from "@/lib/mockData";
import { qrService } from "@/services/qrService";

export async function GET() {
  try {
    // Calculamos el aforo actual para cada capacitación
    const trainingsWithStats = initialTrainings.map((t) => {
      const regs = initialRegistrations.filter((r) => r.trainingId === t.id);
      const confirmedCount = regs.filter((r) => r.status === "Confirmado").length;
      const registeredCount = regs.filter((r) => r.status === "Inscrito").length;
      const attendedCount = regs.filter((r) => r.status === "Asistió").length;
      const waitlistCount = regs.filter((r) => r.status === "Lista de Espera").length;

      const totalOccupied = confirmedCount + registeredCount + attendedCount;
      const isFull = totalOccupied >= t.maxCapacity;

      return {
        ...t,
        stats: {
          confirmedCount,
          registeredCount,
          attendedCount,
          waitlistCount,
          totalOccupied,
          availableSeats: Math.max(0, t.maxCapacity - totalOccupied),
          isFull,
        },
      };
    });

    return NextResponse.json({ success: true, data: trainingsWithStats });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, code, type, instructor, eventDate, adStartDate, adCosts, associatedCosts, price, currency, relatedSkus, description } = body;

    if (!name || !instructor || !eventDate) {
      return NextResponse.json({ success: false, error: "Faltan campos obligatorios" }, { status: 400 });
    }

    const newId = initialTrainings.length + 1;
    const surveyUrl = qrService.buildSurveyUrl(newId);
    const surveyQrCode = await qrService.generateDataUrl(surveyUrl);

    const newTraining = {
      id: newId,
      name,
      code: code || `CAP-2026-${String(newId).padStart(3, "0")}`,
      type: type || "Curso",
      instructor,
      eventDate,
      adStartDate: adStartDate || null,
      adCosts: parseFloat(adCosts) || 0,
      associatedCosts: parseFloat(associatedCosts) || 0,
      maxCapacity: 18, // Aforo fijo sala Onprotec
      instructorCapacity: 1,
      relatedSkus: relatedSkus || [],
      price: parseFloat(price) || 0,
      currency: currency || "USD",
      status: "Planificado" as const,
      surveyUrl,
      surveyQrCode,
      description: description || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    initialTrainings.push(newTraining);

    return NextResponse.json({ success: true, data: newTraining }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
