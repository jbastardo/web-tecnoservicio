import fs from "fs";
import path from "path";
import * as XLSX from "xlsx";
import { parse } from "csv-parse/sync";
import { initialTrainings, initialParticipants, initialRegistrations } from "../src/lib/mockData";
import { Training, Participant, Registration } from "../src/types";

const IMPORT_DIR = path.join(process.cwd(), "import_forms");

interface ParsedFormResult {
  fileName: string;
  eventName: string;
  isPaid: boolean;
  headers: string[];
  records: any[];
}

export function parseLocalForms(): ParsedFormResult[] {
  if (!fs.existsSync(IMPORT_DIR)) {
    fs.mkdirSync(IMPORT_DIR, { recursive: true });
    return [];
  }

  const files = fs.readdirSync(IMPORT_DIR).filter((f) => {
    const ext = path.extname(f).toLowerCase();
    return [".xlsx", ".xls", ".csv"].includes(ext);
  });

  const results: ParsedFormResult[] = [];

  for (const file of files) {
    const fullPath = path.join(IMPORT_DIR, file);
    const ext = path.extname(file).toLowerCase();
    const rawName = path.basename(file, ext);
    // Limpieza de nombre de archivo para obtener el título del evento
    const eventName = rawName
      .replace(/respuestas|formulario|forms|copia|de|-|_|\(respuestas\)/gi, " ")
      .trim()
      .replace(/\s+/g, " ");

    const isPaid =
      eventName.toLowerCase().includes("unifi") ||
      eventName.toLowerCase().includes("de cero a unifi") ||
      file.toLowerCase().includes("unifi");

    let rows: any[] = [];
    let headers: string[] = [];

    try {
      if (ext === ".csv") {
        const content = fs.readFileSync(fullPath, "utf8");
        const parsed = parse(content, {
          columns: true,
          skip_empty_lines: true,
          trim: true,
        });
        rows = parsed;
        if (rows.length > 0) {
          headers = Object.keys(rows[0]);
        }
      } else {
        // Excel (.xlsx, .xls)
        const workbook = XLSX.readFile(fullPath);
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });
        if (rows.length > 0) {
          headers = Object.keys(rows[0]);
        }
      }

      results.push({
        fileName: file,
        eventName: eventName || rawName,
        isPaid,
        headers,
        records: rows,
      });
    } catch (err: any) {
      console.error(`❌ Error leyendo archivo ${file}:`, err.message);
    }
  }

  return results;
}

export function executeImport() {
  console.log("==================================================================");
  console.log("IMPORTADOR DE ARCHIVOS DE FORMULARIOS GOOGLE (XLSX / CSV)");
  console.log("Directorio:", IMPORT_DIR);
  console.log("==================================================================");

  const parsedForms = parseLocalForms();

  if (parsedForms.length === 0) {
    console.log("ℹ️ No se encontraron archivos .xlsx o .csv en la carpeta import_forms/.");
    console.log("👉 Por favor descarga las respuestas de Google Forms y colócalas en:");
    console.log(`   ${IMPORT_DIR}`);
    return;
  }

  console.log(`✅ Se encontraron ${parsedForms.length} archivo(s) para procesar:\n`);

  for (const form of parsedForms) {
    console.log(`📄 Archivo: "${form.fileName}"`);
    console.log(`   Evento detectado: "${form.eventName}"`);
    console.log(`   ¿Capacitación cobrada?: ${form.isPaid ? "SÍ ($35 - De Cero a UniFi)" : "NO ($0 - Gratuita)"}`);
    console.log(`   Total participantes inscritos: ${form.records.length}`);
    console.log(`   Campos en el formulario:`, form.headers.join(" | "));
    console.log("------------------------------------------------------------------");
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  executeImport();
}
