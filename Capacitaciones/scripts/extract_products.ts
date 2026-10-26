import path from 'path';
import fs from 'fs';
import * as XLSX from 'xlsx';
import { OdooProduct } from '../src/types';

const p = path.join(process.cwd(), 'Formularios', 'drive-download-20261026T223832Z-1-001', 'productos (16).xlsx');
const wb = XLSX.readFile(p, { sheetRows: 500 });
const sheet = wb.Sheets[wb.SheetNames[0]];
const rows: any[] = XLSX.utils.sheet_to_json(sheet);

const brandList = ['Ubiquiti', 'Hikvision', 'Dahua', 'TP-Link', 'WatchGuard', 'Ezviz', 'Marsriva'];
const skus: OdooProduct[] = [];

for (const r of rows) {
  const brand = String(r['marca'] || '').trim();
  const title = String(r['título'] || '').trim();
  const sku = String(r['SKU'] || r['identificador'] || '').trim();
  const category = String(r['categorías'] || 'Hardware').trim();
  const price = parseFloat(r['precio de venta'] || '0') || 0;
  const qty = parseFloat(r['cantidad disponible'] || '0') || 0;
  const id = parseInt(r['identificador'] || '0', 10) || skus.length + 1;

  if (sku && title) {
    skus.push({
      id,
      odooId: id,
      sku,
      name: title,
      listPrice: price,
      qtyAvailable: qty,
      category: `${brand} - ${category}`,
      lastSyncAt: new Date().toISOString()
    });
  }
}

console.log(`Extracted ${skus.length} products from Odoo file.`);
fs.writeFileSync(path.join(process.cwd(), 'src', 'lib', 'odooSampleProducts.json'), JSON.stringify(skus.slice(0, 100), null, 2));
