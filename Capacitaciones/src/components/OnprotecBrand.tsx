"use client";

import React from "react";
import Link from "next/link";

interface BrandProps {
  subtitle?: string;
  href?: string;
  compact?: boolean;
}

export function OnprotecBrand({
  subtitle = "«La Tienda del Instalador» · Sala de Capacitaciones",
  href = "/",
  compact = false,
}: BrandProps) {
  return (
    <Link href={href} className="flex items-center gap-3 group flex-shrink-0">
      <div className="relative flex items-center justify-center bg-[#1a1b4b] border border-[#e07b29]/50 rounded-xl px-2.5 py-1.5 shadow-md group-hover:border-[#e07b29] transition">
        <img
          src="/brand/onprotec-logo-full.png"
          alt="OnProtec - La Tienda del Instalador"
          className={`${compact ? "h-6" : "h-7 sm:h-8"} w-auto object-contain`}
        />
        <span className="absolute -bottom-0.5 left-2 right-2 h-[2px] bg-[#e07b29] rounded-full" />
      </div>
      <div className="hidden sm:block">
        <div className="flex items-center gap-1.5">
          <span className="font-extrabold text-sm tracking-tight text-white">
            ONPROTEC<span className="text-[#e07b29]">®</span>
          </span>
          <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-[#e07b29]/15 text-[#e07b29] border border-[#e07b29]/30">
            Academia Técnica
          </span>
        </div>
        <span className="text-[11px] text-slate-400 block font-medium leading-tight">
          {subtitle}
        </span>
      </div>
    </Link>
  );
}

export const ONPROTEC_PARTNER_BRANDS = [
  { name: "Hikvision", category: "CCTV & Control de Acceso", color: "#e11d48" },
  { name: "Dahua Technology", category: "Videovigilancia IA & DoLynk", color: "#0284c7" },
  { name: "TP-Link / Omada", category: "Redes Empresariales & VIGI", color: "#0d9488" },
  { name: "Ubiquiti UniFi", category: "Redes Inalámbricas & Switching", color: "#2563eb" },
  { name: "EZVIZ", category: "Smart Home & Cámaras Wi-Fi", color: "#ea580c" },
  { name: "WatchGuard", category: "Ciberseguridad & Firewalls", color: "#dc2626" },
  { name: "Marsriva / Forza", category: "Respaldo de Energía & UPS", color: "#16a34a" },
];
