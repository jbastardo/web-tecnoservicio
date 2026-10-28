"use client";

import React from "react";
import Link from "next/link";

interface BrandProps {
  subtitle?: string;
  href?: string;
  compact?: boolean;
}

export function OnprotecBrand({
  subtitle = "La Tienda del Instalador · Sala de Capacitaciones",
  href = "/",
  compact = false,
}: BrandProps) {
  return (
    <Link href={href} className="flex items-center gap-3 group flex-shrink-0">
      <div className="relative flex items-center justify-center bg-white rounded-xl px-2.5 py-1.5 border border-slate-200/80 shadow-sm group-hover:border-[#f4730a] transition">
        <img
          src="/brand/onprotec-logo-web.webp"
          alt="OnProtec - La Tienda del Instalador"
          className={`${compact ? "h-6" : "h-7 sm:h-8"} w-auto object-contain`}
        />
      </div>
      <div className="hidden sm:block">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#f4730a]/15 text-[#f4730a] border border-[#f4730a]/30">
            Sala de Capacitaciones
          </span>
        </div>
        <span className="text-[11px] text-slate-500 block font-semibold leading-tight mt-0.5">
          {subtitle}
        </span>
      </div>
    </Link>
  );
}

export const ONPROTEC_PARTNER_BRANDS = [
  {
    name: "Hikvision",
    short: "Hikvision",
    category: "CCTV IP, ColorVu & HikCentral",
    certification: "HCSA / Lab Pro",
    accent: "#e11d48",
  },
  {
    name: "Dahua Technology",
    short: "Dahua",
    category: "Videovigilancia IA, WizSense & DoLynk Care",
    certification: "DHSA / DoLynk Partner",
    accent: "#0284c7",
  },
  {
    name: "TP-Link / Omada",
    short: "TP-Link",
    category: "Redes SDN Empresariales & VIGI CCTV",
    certification: "OCNA Wireless & Routing",
    accent: "#0d9488",
  },
  {
    name: "Ubiquiti UniFi",
    short: "Ubiquiti",
    category: "Redes Inalámbricas de Alta Densidad & Switching",
    certification: "UniFi Enterprise Lab",
    accent: "#2563eb",
  },
  {
    name: "WatchGuard",
    short: "WatchGuard",
    category: "Ciberseguridad, Firewalls & ThreatSync+ NDR",
    certification: "SGSI Network Security",
    accent: "#dc2626",
  },
  {
    name: "EZVIZ",
    short: "EZVIZ",
    category: "Smart Home, Videoporteros & Cámaras Wi-Fi",
    certification: "Instalador Autorizado",
    accent: "#f4730a",
  },
  {
    name: "Marsriva",
    short: "Marsriva",
    category: "Respaldo de Energía, Mini UPS & Smart Lithium",
    certification: "Especialista en Energía",
    accent: "#16a34a",
  },
];
