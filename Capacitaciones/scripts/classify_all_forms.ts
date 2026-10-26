import fs from 'fs';
import path from 'path';
import * as XLSX from 'xlsx';

const dir = path.join(process.cwd(), 'Formularios', 'drive-download-20261026T223832Z-1-001');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.xlsx'));

interface FormInfo {
  file: string;
  isSurvey: boolean;
  isPaid: boolean;
  rows: number;
  sampleKeys: string[];
}

const list: FormInfo[] = [];

for (const file of files) {
  const wb = XLSX.readFile(path.join(dir, file));
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rows: any[] = XLSX.utils.sheet_to_json(sheet);
  const keys = rows.length > 0 ? Object.keys(rows[0]) : [];
  
  const keysStr = keys.join(' ').toLowerCase();
  const fileLower = file.toLowerCase();
  
  const isSurvey = fileLower.includes('encuesta') || 
                   fileLower.includes('evaluación') || 
                   fileLower.includes('evaluacion') || 
                   fileLower.includes('satisfacción') || 
                   fileLower.includes('satisfaccion') ||
                   keysStr.includes('¿cómo califica') ||
                   keysStr.includes('claridad de los temas') ||
                   keysStr.includes('¿el instructor explicó');
                   
  const isPaid = fileLower.includes('unifi');
  
  list.push({
    file,
    isSurvey,
    isPaid,
    rows: rows.length,
    sampleKeys: keys
  });
}

console.log('--- RESUMEN DE FORMULARIOS DETECTADOS ---');
console.log('Total archivos:', list.length);
console.log('Registros:', list.filter(x => !x.isSurvey).length);
console.log('Encuestas:', list.filter(x => x.isSurvey).length);
console.log('Pagadas:', list.filter(x => x.isPaid).length);

console.log('\n--- LISTADO DE CAPACITACIONES (REGISTROS) ---');
for (const r of list.filter(x => !x.isSurvey)) {
  console.log(`[${r.rows.toString().padStart(3, ' ')} inscritos] [PAID: ${r.isPaid}] ${r.file}`);
}

console.log('\n--- LISTADO DE ENCUESTAS DE SATISFACCIÓN ---');
for (const s of list.filter(x => x.isSurvey)) {
  console.log(`[${s.rows.toString().padStart(3, ' ')} respuestas] ${s.file}`);
}
