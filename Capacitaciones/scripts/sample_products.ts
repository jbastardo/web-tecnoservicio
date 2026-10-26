import path from 'path';
import * as XLSX from 'xlsx';

const p = path.join(process.cwd(), 'Formularios', 'drive-download-20261026T223832Z-1-001', 'productos (16).xlsx');
const wb = XLSX.readFile(p, { sheetRows: 20 });
const sheet = wb.Sheets[wb.SheetNames[0]];
const rows: any[] = XLSX.utils.sheet_to_json(sheet);
console.log('PRODUCTS ROW 0:', JSON.stringify(rows[0], null, 2));
