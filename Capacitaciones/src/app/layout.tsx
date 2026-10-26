import type { Metadata } from "next";
import "./globals.css";
import { runAutoMigrate } from "@/lib/autoMigrate";

export const metadata: Metadata = {
  title: "Onprotec | Gestión de Sala de Capacitaciones",
  description:
    "Sistema integral para la gestión y control de la sala de capacitaciones (Aforo: 18 participantes) de Onprotec C.A.",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Verificación proactiva de migraciones DDL idempotentes
  try {
    await runAutoMigrate();
  } catch (err) {
    console.warn("Auto-migrate inicial no bloqueante:", err);
  }

  return (
    <html lang="es">
      <body className="antialiased selection:bg-brand-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
