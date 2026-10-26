import path from 'path';
import * as XLSX from 'xlsx';

const f = 'Registro Oficial — Curso _De cero a UniFi_ fundamentos y buenas prácticas para el WI-FI PROFESIONAL_ _ Onprotec  (Respuestas).xlsx';
const p = path.join(process.cwd(), 'Formularios', 'drive-download-20261026T223832Z-1-001', f);
const wb = XLSX.readFile(p);
const sheet = wb.Sheets[wb.SheetNames[0]];
const rows: any[] = XLSX.utils.sheet_to_json(sheet);
console.log('UNIFI ROWS COUNT:', rows.length);
if (rows.length > 0) {
  console.log('ALL KEYS:', Object.keys(rows[0]));
  console.log('SAMPLE ROW 0:', JSON.stringify(rows[0], null, 2));
  if (rows.length > 1) {
    console.log('SAMPLE ROW 1:', JSON.stringify(rows[1], null, 2));
  }
}
