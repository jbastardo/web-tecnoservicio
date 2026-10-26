import dotenv from "dotenv";
dotenv.config();

import { gdriveService } from "../src/services/gdriveService";
import { initialTrainings, initialParticipants, initialRegistrations } from "../src/lib/mockData";

async function main() {
  console.log("==================================================================");
  console.log("EXTRACTOR DE FORMULARIOS GOOGLE DRIVE (social@onprotec.com)");
  console.log("==================================================================");

  if (!gdriveService.hasServiceAccount()) {
    console.error("❌ ERROR: No se encontró 'service-account.json' en la raíz.");
    console.log("Coloca el archivo 'service-account.json' descargado de Google Cloud Console");
    console.log("en: c:\\Antigravity\\Capacitaciones\\service-account.json");
    process.exit(1);
  }

  try {
    console.log("📡 Conectando con Google Drive API...");
    const files = await gdriveService.listFormsAndSheets();
    console.log(`✅ Se encontraron ${files.length} archivo(s) de Formularios / Hojas de respuestas.`);

    if (files.length === 0) {
      console.log("ℹ️ No se detectaron archivos compartidos con esta Cuenta de Servicio.");
      console.log("Asegúrate de haber compartido la carpeta o los formularios en Google Drive");
      console.log("con el email de la cuenta de servicio (client_email).");
      return;
    }

    for (const file of files) {
      console.log(`\n📄 Procesando: "${file.name}" (ID: ${file.id})`);
      const data = await gdriveService.extractSheetResponses(file.id, file.name);
      console.log(`   Columnas encontradas (${data.headers.length}):`, data.headers.join(" | "));
      console.log(`   Total registros/respuestas: ${data.rows.length}`);
      console.log(`   ¿Capacitación cobrada?: ${data.isPaidTraining ? "SÍ (De Cero a UniFi)" : "NO (Gratuito)"}`);
    }
  } catch (error: any) {
    console.error("❌ Error durante la extracción de Google Drive:", error?.message || error);
  }
}

main();
