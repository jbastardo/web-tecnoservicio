import { NextResponse } from "next/server";
import { loadPersistentDataset, savePersistentDataset, getStorageFilePath } from "@/lib/serverStorage";
import fs from "fs";

export async function GET(request: Request) {
  try {
    const data = loadPersistentDataset();
    const jsonString = JSON.stringify(data, null, 2);

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const filename = `onprotec-capacitaciones-backup-${timestamp}.json`;

    return new NextResponse(jsonString, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body || !Array.isArray(body.trainings)) {
      return NextResponse.json(
        { success: false, error: "Formato de respaldo inválido. Debe contener el array 'trainings'." },
        { status: 400 }
      );
    }

    const success = await savePersistentDataset({
      trainings: body.trainings || [],
      participants: body.participants || [],
      registrations: body.registrations || [],
      surveys: body.surveys || [],
      adminUsers: body.adminUsers || [],
    });

    if (!success) {
      return NextResponse.json(
        { success: false, error: "Error al escribir el respaldo en el almacenamiento persistente." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Respaldo restaurado exitosamente (${body.trainings.length} capacitaciones).`,
      filePath: getStorageFilePath(),
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
