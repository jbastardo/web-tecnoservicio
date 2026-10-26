import fs from 'fs';
import path from 'path';
import * as XLSX from 'xlsx';

const dir = path.join(process.cwd(), 'Formularios', 'drive-download-20261026T223832Z-1-001');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.xlsx'));

console.log('Total XLSX files:', files.length);

const allHeaders = new Map<string, number>();
const formTypes: { file: string; type: 'registration' | 'survey' | 'other'; rows: number; headers: string[] }[] = [];

for (const file of files) {
  try {
    const wb = XLSX.readFile(path.join(dir, file));
    const sheet = wb.Sheets[wb.SheetNames[0]];
    const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    if (rows && rows.length > 0) {
      const headers = (rows[0] || []).map((h: any) => String(h || '').trim());
      const rowCount = rows.length - 1;
      
      const isSurvey = file.toLowerCase().includes('encuesta') || 
                       file.toLowerCase().includes('satisfacción') || 
                       file.toLowerCase().includes('satisfaccion') || 
                       file.toLowerCase().includes('evaluación') || 
                       file.toLowerCase().includes('evaluacion');
                       
      formTypes.push({
        file,
        type: isSurvey ? 'survey' : 'registration',
        rows: rowCount,
        headers
      });

      for (const h of headers) {
        if (h) {
          allHeaders.set(h, (allHeaders.get(h) || 0) + 1);
        }
      }
    }
  } catch (e: any) {
    console.error('Error in file:', file, e.message);
  }
}

console.log('\n=== REGISTRATION FORMS ===');
for (const f of formTypes.filter(x => x.type === 'registration')) {
  console.log(`[${f.rows} resp] ${f.file}`);
}

console.log('\n=== SURVEY FORMS ===');
for (const f of formTypes.filter(x => x.type === 'survey')) {
  console.log(`[${f.rows} resp] ${f.file}`);
}

console.log('\n=== SUMMARY OF UNIQUE HEADERS ACROSS ALL FORMS ===');
for (const [header, count] of [...allHeaders.entries()].sort((a,b) => b[1] - a[1])) {
  console.log(`[${count}] ${header}`);
}
