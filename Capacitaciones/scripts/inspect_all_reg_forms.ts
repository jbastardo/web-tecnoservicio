import fs from 'fs';
import path from 'path';
import * as XLSX from 'xlsx';

const dir = path.join(process.cwd(), 'Formularios', 'drive-download-20261026T223832Z-1-001');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.xlsx'));

for (const file of files) {
  const isSurvey = file.toLowerCase().includes('encuesta') || 
                   file.toLowerCase().includes('satisfacción') || 
                   file.toLowerCase().includes('satisfaccion') || 
                   file.toLowerCase().includes('evaluación') || 
                   file.toLowerCase().includes('evaluacion');
  
  if (isSurvey) continue;
  
  const wb = XLSX.readFile(path.join(dir, file));
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rows: any[] = XLSX.utils.sheet_to_json(sheet);
  
  console.log(`\n========================================`);
  console.log(`FILE: ${file} | Rows: ${rows.length}`);
  if (rows.length > 0) {
    const keys = Object.keys(rows[0]);
    console.log(`KEYS (${keys.length}):`, keys);
  }
}
