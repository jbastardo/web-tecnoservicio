import fs from "fs";
import path from "path";
import seedData from "./realFormsData.json";
import {
  Training,
  Participant,
  Registration,
  Survey,
  AdminUser,
} from "@/types";

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

interface DatasetPayload {
  trainings: Training[];
  participants: Participant[];
  registrations: Registration[];
  surveys: Survey[];
  adminUsers: AdminUser[];
  lastSavedAt?: string;
}

let activeDataset: DatasetPayload | null = null;

export function loadPersistentDataset(): DatasetPayload {
  if (activeDataset) {
    return activeDataset;
  }

  const targetPath = getStorageFilePath();
  console.log(`[serverStorage] Determinando ruta de almacenamiento persistente: ${targetPath}`);

  try {
    if (fs.existsSync(targetPath)) {
      const raw = fs.readFileSync(targetPath, "utf-8");
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.trainings) && parsed.trainings.length > 0) {
        console.log(
          `[serverStorage] ✅ Base de datos persistente cargada desde ${targetPath} (${parsed.trainings.length} cursos, ${parsed.registrations?.length || 0} inscripciones).`
        );
        activeDataset = {
          trainings: parsed.trainings || [],
          participants: parsed.participants || [],
          registrations: parsed.registrations || [],
          surveys: parsed.surveys || [],
          adminUsers: parsed.adminUsers || [],
          lastSavedAt: parsed.lastSavedAt || new Date().toISOString(),
        };
        return activeDataset;
      }
    }
  } catch (err: any) {
    console.error(`[serverStorage] Error leyendo base persistente de ${targetPath}:`, err?.message);
  }

  // Si no existe o está corrupto, inicializar con la semilla completa del repositorio
  console.log(`[serverStorage] ⚠️ Inicializando archivo persistente inicial en ${targetPath}...`);
  activeDataset = {
    trainings: (seedData.trainings as any[]) || [],
    participants: (seedData.participants as any[]) || [],
    registrations: (seedData.registrations as any[]) || [],
    surveys: (seedData.surveys as any[]) || [],
    adminUsers: (seedData as any).adminUsers || [],
    lastSavedAt: new Date().toISOString(),
  };

  try {
    const dir = path.dirname(targetPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(targetPath, JSON.stringify(activeDataset, null, 2), "utf-8");
    console.log(`[serverStorage] ✅ Semilla persistente escrita con éxito en ${targetPath}.`);
  } catch (err: any) {
    console.warn(`[serverStorage] Advertencia al escribir semilla inicial en ${targetPath}:`, err?.message);
  }

  return activeDataset;
}

export async function savePersistentDataset(payload: DatasetPayload): Promise<boolean> {
  const targetPath = getStorageFilePath();
  const dir = path.dirname(targetPath);

  try {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const dataToSave = {
      trainings: payload.trainings,
      participants: payload.participants,
      registrations: payload.registrations,
      surveys: payload.surveys,
      adminUsers: payload.adminUsers,
      lastSavedAt: new Date().toISOString(),
    };

    // Escritura atómica para prevenir corrupción en fallos imprevistos
    const tempFile = `${targetPath}.tmp.${Date.now()}`;
    fs.writeFileSync(tempFile, JSON.stringify(dataToSave, null, 2), "utf-8");
    fs.renameSync(tempFile, targetPath);

    // En desarrollo local en Windows, mantener sincronizado src/lib/realFormsData.json si la ruta activa es distinta
    const localSrcPath = path.join(process.cwd(), "src", "lib", "realFormsData.json");
    if (path.resolve(targetPath) !== path.resolve(localSrcPath) && fs.existsSync(path.dirname(localSrcPath))) {
      try {
        fs.writeFileSync(localSrcPath, JSON.stringify(dataToSave, null, 2), "utf-8");
      } catch (_) {}
    }

    // Copia de seguridad rotativa
    try {
      const backupDir = path.join(dir, "backups");
      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
      }
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const backupFile = path.join(backupDir, `realFormsData.backup-${timestamp}.json`);
      fs.copyFileSync(targetPath, backupFile);

      // Mantener las 10 copias de seguridad más recientes
      const backups = fs
        .readdirSync(backupDir)
        .filter((f) => f.startsWith("realFormsData.backup-") && f.endsWith(".json"))
        .sort();
      if (backups.length > 10) {
        for (const oldFile of backups.slice(0, backups.length - 10)) {
          try {
            fs.unlinkSync(path.join(backupDir, oldFile));
          } catch (_) {}
        }
      }
    } catch (bErr) {
      console.warn("[serverStorage] Advertencia al generar copia de seguridad rotativa:", bErr);
    }

    console.log(
      `[serverStorage] ✅ Base de datos guardada exitosamente en ${targetPath} (${payload.trainings.length} cursos, ${payload.registrations.length} inscripciones).`
    );
    return true;
  } catch (err: any) {
    console.error(`[serverStorage] ❌ Error crítico escribiendo datos en ${targetPath}:`, err?.message || err);
    return false;
  }
}
