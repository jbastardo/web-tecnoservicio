import type { Metadata } from "next";
import "./globals.css";
import { runAutoMigrate } from "@/lib/autoMigrate";

export const metadata: Metadata = {
  title: "OnProtec® | Sala de Capacitaciones — La Tienda del Instalador",
  description:
    "Centro de formación técnica y práctica en Seguridad Electrónica, CCTV, Control de Acceso, Redes y Telecomunicaciones de OnProtec C.A. (www.onprotec.com). Aforo exclusivo: 18 participantes.",
  icons: {
    icon: "/brand/onprotec-icon.png",
  },
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
    <html lang="es" data-theme="light" suppressHydrationWarning>
      <head>
        <meta name="color-scheme" content="light dark" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Montserrat:ital,wght@0,400;0,500;0,600;0,700;0,800;0,900;1,500&display=swap"
          rel="stylesheet"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var savedTheme = localStorage.getItem('onprotec-theme') || 'light';
                document.documentElement.setAttribute('data-theme', savedTheme);
                var m = document.querySelector('meta[name="color-scheme"]');
                if (m) m.setAttribute('content', savedTheme);
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body className="antialiased selection:bg-[#f4730a] selection:text-white">
        {children}
      </body>
    </html>
  );
}
