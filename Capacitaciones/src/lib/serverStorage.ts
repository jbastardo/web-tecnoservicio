import fs from "fs";
import path from "path";
import seedData from "./realFormsData.json";
import {
  Training,
  Participant,
  Registration,
  Survey,
  AdminUser,
  AuditLogEntry,
} from "@/types";
import { defaultAdminUsers } from "./constants";
export * from "./constants";

export function getStorageFilePath(): string {
  // 1. Variable de entorno explícita (e.g. DATA_DIR=/app/data en Coolify / Docker)
  if (process.env.DATA_DIR) {
    const dir = process.env.DATA_DIR;
    if (!fs.existsSync(dir)) {
      try {
        fs.mkdirSync(dir, { recursive: true });
      } catch (_) {}
    }
    return path.join(dir, "realFormsData.json");
  }

  // 2. Directorio persistente de producción en Docker (/app/data)
  if (process.env.NODE_ENV === "production" && fs.existsSync("/app/data")) {
    return "/app/data/realFormsData.json";
  }

  // 3. Directorio persistente local opcional ./data/realFormsData.json
  const localDataDir = path.join(process.cwd(), "data");
  if (fs.existsSync(localDataDir)) {
    return path.join(localDataDir, "realFormsData.json");
  }

  // 4. Ubicación base en el repositorio
  return path.join(process.cwd(), "src", "lib", "realFormsData.json");
}

export interface DatasetPayload {
  trainings: Training[];
  participants: Participant[];
  registrations: Registration[];
  surveys: Survey[];
  adminUsers: AdminUser[];
  auditLogs?: AuditLogEntry[];
  lastSavedAt?: string;
}

export interface PersistOptions {
  reason?: "default" | "pre-delete" | "restore";
}

function getCaracasDateKey(date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Caracas",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

let lastRollingBackupMs = 0;

function loadInitialData(): DatasetPayload {
  const targetPath = getStorageFilePath();
  console.log(`[serverStorage] Determinando ruta de almacenamiento persistente: ${targetPath}`);

  try {
    if (fs.existsSync(targetPath)) {
      const raw = fs.readFileSync(targetPath, "utf-8");
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.trainings) && parsed.trainings.length > 0) {
        const activeRegsCount = (parsed.registrations || []).filter((r: any) => !r.deletedAt).length;
        const deletedRegsCount = (parsed.registrations || []).length - activeRegsCount;
        console.log(
          `[serverStorage] ✅ Base de datos persistente cargada desde ${targetPath} (${parsed.trainings.length} cursos, ${activeRegsCount} inscripciones activas, ${deletedRegsCount} en papelera).`
        );
        const adminList: AdminUser[] =
          Array.isArray(parsed.adminUsers) && parsed.adminUsers.length > 0
            ? parsed.adminUsers
            : [...defaultAdminUsers];

        // Garantizar que el usuario master juan@onprotec.com con clave 5197148 esté siempre activo y configurado
        const masterIdx = adminList.findIndex(
          (u) =>
            u.email?.toLowerCase() === "juan@onprotec.com" ||
            u.username?.toLowerCase() === "juan"
        );
        if (masterIdx >= 0) {
          adminList[masterIdx].password = "5197148";
          adminList[masterIdx].isActive = true;
          adminList[masterIdx].role = "Super Admin Master";
        } else {
          adminList.unshift({
            id: 1,
            username: "juan",
            email: "juan@onprotec.com",
            name: "Juan Bastardo",
            role: "Super Admin Master",
            department: "Gerencia General OnProtec",
            password: "5197148",
            isActive: true,
            lastLoginAt: new Date().toISOString(),
            createdAt: new Date().toISOString(),
          });
        }

        return {
          trainings: parsed.trainings || [],
          participants: parsed.participants || [],
          registrations: parsed.registrations || [],
          surveys: parsed.surveys || [],
          adminUsers: adminList,
          auditLogs: Array.isArray(parsed.auditLogs) ? parsed.auditLogs : [],
          lastSavedAt: parsed.lastSavedAt || new Date().toISOString(),
        };
      }
    }
  } catch (err: any) {
    console.error(`[serverStorage] Error leyendo base persistente de ${targetPath}:`, err?.message);
  }

  // Si no existe o está corrupto, inicializar con la semilla completa del repositorio
  console.log(`[serverStorage] ⚠️ Inicializando archivo persistente inicial en ${targetPath}...`);
  const initialAdminList: AdminUser[] =
    Array.isArray((seedData as any).adminUsers) && (seedData as any).adminUsers.length > 0
      ? (seedData as any).adminUsers
      : [...defaultAdminUsers];

  const initial: DatasetPayload = {
    trainings: (seedData.trainings as any[]) || [],
    participants: (seedData.participants as any[]) || [],
    registrations: (seedData.registrations as any[]) || [],
    surveys: (seedData.surveys as any[]) || [],
    adminUsers: initialAdminList,
    auditLogs: [],
    lastSavedAt: new Date().toISOString(),
  };

  try {
    const dir = path.dirname(targetPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(targetPath, JSON.stringify(initial, null, 2), "utf-8");
    console.log(`[serverStorage] ✅ Semilla persistente escrita con éxito en ${targetPath}.`);
  } catch (err: any) {
    console.warn(`[serverStorage] Advertencia al escribir semilla inicial en ${targetPath}:`, err?.message);
  }

  return initial;
}

const activeDataset = loadInitialData();

export const initialTrainings: Training[] = activeDataset.trainings;
export const initialParticipants: Participant[] = activeDataset.participants;
export const initialRegistrations: Registration[] = activeDataset.registrations;
export const initialSurveys: Survey[] = activeDataset.surveys;
export const initialAdminUsers: AdminUser[] = activeDataset.adminUsers;
export const initialAuditLogs: AuditLogEntry[] = activeDataset.auditLogs || [];

export function appendAuditLog(
  entry: Omit<AuditLogEntry, "id" | "timestamp">
): AuditLogEntry {
  const full: AuditLogEntry = {
    id: `aud-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    timestamp: new Date().toISOString(),
    ...entry,
  };
  initialAuditLogs.unshift(full);
  if (initialAuditLogs.length > 1000) {
    initialAuditLogs.length = 1000;
  }
  return full;
}

export function createPreMutationBackup(tag = "pre-delete"): string | null {
  try {
    const targetPath = getStorageFilePath();
    if (!fs.existsSync(targetPath)) return null;
    const dir = path.dirname(targetPath);
    const preDeleteDir = path.join(dir, "backups", "pre-delete");
    if (!fs.existsSync(preDeleteDir)) {
      fs.mkdirSync(preDeleteDir, { recursive: true });
    }
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const backupFile = path.join(preDeleteDir, `realFormsData.${tag}-${timestamp}.json`);
    fs.copyFileSync(targetPath, backupFile);

    // Conservar los últimos 50 respaldos pre-eliminación/pre-restauración (nunca rotados por ediciones normales)
    const files = fs
      .readdirSync(preDeleteDir)
      .filter((f) => f.endsWith(".json"))
      .sort();
    if (files.length > 50) {
      for (const oldFile of files.slice(0, files.length - 50)) {
        try {
          fs.unlinkSync(path.join(preDeleteDir, oldFile));
        } catch (_) {}
      }
    }
    return backupFile;
  } catch (err) {
    console.warn("[serverStorage] Advertencia al crear respaldo pre-operación:", err);
    return null;
  }
}

export function getBackupInventory() {
  const targetPath = getStorageFilePath();
  const baseBackupDir = path.join(path.dirname(targetPath), "backups");
  const listDir = (sub: string) => {
    const full = sub ? path.join(baseBackupDir, sub) : baseBackupDir;
    if (!fs.existsSync(full)) return [];
    return fs
      .readdirSync(full)
      .filter((f) => f.endsWith(".json"))
      .sort()
      .reverse();
  };
  return {
    daily: listDir("daily"),
    preDelete: listDir("pre-delete"),
    rolling: listDir(""),
  };
}

export function loadPersistentDataset(): DatasetPayload {
  return {
    trainings: initialTrainings,
    participants: initialParticipants,
    registrations: initialRegistrations,
    surveys: initialSurveys,
    adminUsers: initialAdminUsers,
    auditLogs: initialAuditLogs,
    lastSavedAt: activeDataset.lastSavedAt,
  };
}

export async function persistDataset(options?: PersistOptions): Promise<boolean> {
  return savePersistentDataset(
    {
      trainings: initialTrainings,
      participants: initialParticipants,
      registrations: initialRegistrations,
      surveys: initialSurveys,
      adminUsers: initialAdminUsers,
      auditLogs: initialAuditLogs,
    },
    options
  );
}

export async function savePersistentDataset(
  payload: DatasetPayload,
  options?: PersistOptions
): Promise<boolean> {
  const targetPath = getStorageFilePath();
  const dir = path.dirname(targetPath);

  try {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // 0. Si es una operación sensible (eliminación / restauración), respaldar el estado ANTERIOR en disco antes de sobrescribir
    if (options?.reason === "pre-delete" || options?.reason === "restore") {
      createPreMutationBackup(options.reason);
    }

    const dataToSave = {
      trainings: payload.trainings,
      participants: payload.participants,
      registrations: payload.registrations,
      surveys: payload.surveys,
      adminUsers: payload.adminUsers,
      auditLogs: payload.auditLogs || initialAuditLogs,
      lastSavedAt: new Date().toISOString(),
    };

    // Escritura atómica para prevenir corrupción en fallos imprevistos
    const tempFile = `${targetPath}.tmp.${Date.now()}`;
    fs.writeFileSync(tempFile, JSON.stringify(dataToSave, null, 2), "utf-8");
    fs.renameSync(tempFile, targetPath);
    activeDataset.lastSavedAt = dataToSave.lastSavedAt;

    // En desarrollo local, mantener sincronizado src/lib/realFormsData.json si la ruta activa es distinta
    const localSrcPath = path.join(process.cwd(), "src", "lib", "realFormsData.json");
    if (path.resolve(targetPath) !== path.resolve(localSrcPath) && fs.existsSync(path.dirname(localSrcPath))) {
      try {
        fs.writeFileSync(localSrcPath, JSON.stringify(dataToSave, null, 2), "utf-8");
      } catch (_) {}
    }

    // 1. Copia de seguridad DIARIA garantizada (hora Caracas, retención 30 días)
    try {
      const dailyDir = path.join(dir, "backups", "daily");
      if (!fs.existsSync(dailyDir)) {
        fs.mkdirSync(dailyDir, { recursive: true });
      }
      const todayCaracas = getCaracasDateKey();
      const dailyFile = path.join(dailyDir, `realFormsData.daily-${todayCaracas}.json`);
      if (!fs.existsSync(dailyFile)) {
        fs.copyFileSync(targetPath, dailyFile);
      }

      const dailyFiles = fs
        .readdirSync(dailyDir)
        .filter((f) => f.startsWith("realFormsData.daily-") && f.endsWith(".json"))
        .sort();
      if (dailyFiles.length > 30) {
        for (const oldFile of dailyFiles.slice(0, dailyFiles.length - 30)) {
          try {
            fs.unlinkSync(path.join(dailyDir, oldFile));
          } catch (_) {}
        }
      }
    } catch (dErr) {
      console.warn("[serverStorage] Advertencia al generar copia de seguridad diaria:", dErr);
    }

    // 2. Copia de seguridad rotativa con debounce (máx. 1 cada 10 minutos, retención 25)
    // Así múltiples clics de WhatsApp/estatus no sobrescriben respaldos previos
    try {
      const nowMs = Date.now();
      const TEN_MINUTES_MS = 10 * 60 * 1000;
      if (nowMs - lastRollingBackupMs >= TEN_MINUTES_MS) {
        lastRollingBackupMs = nowMs;
        const backupDir = path.join(dir, "backups");
        if (!fs.existsSync(backupDir)) {
          fs.mkdirSync(backupDir, { recursive: true });
        }
        const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
        const backupFile = path.join(backupDir, `realFormsData.backup-${timestamp}.json`);
        fs.copyFileSync(targetPath, backupFile);

        const backups = fs
          .readdirSync(backupDir)
          .filter((f) => f.startsWith("realFormsData.backup-") && f.endsWith(".json"))
          .sort();
        if (backups.length > 25) {
          for (const oldFile of backups.slice(0, backups.length - 25)) {
            try {
              fs.unlinkSync(path.join(backupDir, oldFile));
            } catch (_) {}
          }
        }
      }
    } catch (bErr) {
      console.warn("[serverStorage] Advertencia al generar copia de seguridad rotativa:", bErr);
    }

    const activeCount = payload.registrations.filter((r) => !r.deletedAt).length;
    console.log(
      `[serverStorage] ✅ Base de datos guardada exitosamente en ${targetPath} (${payload.trainings.length} cursos, ${activeCount} inscripciones activas, ${payload.registrations.length - activeCount} en papelera).`
    );
    return true;
  } catch (err: any) {
    console.error(`[serverStorage] ❌ Error crítico escribiendo datos en ${targetPath}:`, err?.message || err);
    return false;
  }
}
