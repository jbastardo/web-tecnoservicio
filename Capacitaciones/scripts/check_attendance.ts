import fs from 'fs';
import path from 'path';

const d = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'src', 'lib', 'realFormsData.json'), 'utf8'));

for (const t of d.trainings) {
  const regs = d.registrations.filter((r: any) => r.trainingId === t.id);
  const attended = regs.filter((r: any) => r.status === 'Asistió').length;
  const confirmed = regs.filter((r: any) => r.status === 'Confirmado').length;
  const waitlist = regs.filter((r: any) => r.status === 'Lista de Espera').length;
  console.log(`[ID ${t.id}] ${t.name.slice(0, 45).padEnd(45, ' ')} | Total: ${regs.length.toString().padStart(2, ' ')} | Asistió: ${attended} | Conf: ${confirmed} | Wait: ${waitlist}`);
}
