import { NextResponse } from "next/server";
import {
  loadPersistentDataset,
  savePersistentDataset,
  getStorageFilePath,
  initialTrainings,
  initialParticipants,
  initialRegistrations,
  initialSurveys,
  initialAdminUsers,
  initialAuditLogs,
  appendAuditLog,
} from "@/lib/serverStorage";
import { requireAdmin, isSuperAdmin } from "@/lib/adminAuth";

export async function GET() {
  const auth = await requireAdmin();
  if (auth.errorResponse) return auth.errorResponse;

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
  const auth = await requireAdmin();
  if (auth.errorResponse) return auth.errorResponse;

  if (!isSuperAdmin(auth.user)) {
    return NextResponse.json(
      {
        success: false,
        error: "Solo un Super Admin puede restaurar respaldos completos de la base de datos.",
      },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    if (!body || !Array.isArray(body.trainings)) {
      return NextResponse.json(
        { success: false, error: "Formato de respaldo inválido. Debe contener el array 'trainings'." },
        { status: 400 }
      );
    }

    const nextTrainings = body.trainings || [];
    const nextParticipants = body.participants || [];
    const nextRegistrations = body.registrations || [];
    const nextSurveys = body.surveys || [];
    const nextAdminUsers =
      Array.isArray(body.adminUsers) && body.adminUsers.length > 0
        ? body.adminUsers
        : [...initialAdminUsers];

    appendAuditLog({
      action: "BACKUP_RESTORE",
      entityType: "backup",
      actorName: auth.user.name,
      actorEmail: auth.user.email,
      actorRole: auth.user.role,
      summary: `Restauró respaldo completo (${nextTrainings.length} cursos, ${nextRegistrations.length} inscripciones)`,
      details: {
        trainings: nextTrainings.length,
        participants: nextParticipants.length,
        registrations: nextRegistrations.length,
      },
    });

    const success = await savePersistentDataset(
      {
        trainings: nextTrainings,
        participants: nextParticipants,
        registrations: nextRegistrations,
        surveys: nextSurveys,
        adminUsers: nextAdminUsers,
        auditLogs: initialAuditLogs,
      },
      { reason: "restore" }
    );

    if (!success) {
      return NextResponse.json(
        { success: false, error: "Error al escribir el respaldo en el almacenamiento persistente." },
        { status: 500 }
      );
    }

    // Sincronizar memoria activa en caliente
    initialTrainings.splice(0, initialTrainings.length, ...nextTrainings);
    initialParticipants.splice(0, initialParticipants.length, ...nextParticipants);
    initialRegistrations.splice(0, initialRegistrations.length, ...nextRegistrations);
    initialSurveys.splice(0, initialSurveys.length, ...nextSurveys);
    initialAdminUsers.splice(0, initialAdminUsers.length, ...nextAdminUsers);

    return NextResponse.json({
      success: true,
      message: `Respaldo restaurado exitosamente (${nextTrainings.length} capacitaciones, ${nextRegistrations.length} inscripciones).`,
      filePath: getStorageFilePath(),
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
