import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { initialAuditLogs, getBackupInventory } from "@/lib/serverStorage";

export async function GET() {
  const auth = await requireAdmin();
  if (auth.errorResponse) return auth.errorResponse;

  return NextResponse.json({
    success: true,
    data: initialAuditLogs.slice(0, 200),
    backups: getBackupInventory(),
  });
}
