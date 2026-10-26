"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  GraduationCap,
  LayoutDashboard,
  CalendarCheck,
  ClipboardList,
  UserCheck,
  Users,
  Layers,
  ExternalLink,
  Clock,
  Shield,
  Activity,
} from "lucide-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const navItems = [
    { href: "/admin", label: "Dashboard & KPIs", icon: LayoutDashboard },
    { href: "/admin/capacitaciones", label: "Capacitaciones", icon: CalendarCheck },
    { href: "/admin/inscripciones", label: "Inscripciones & Pagos", icon: ClipboardList },
    { href: "/admin/checkin", label: "Check-in (Día Evento)", icon: UserCheck },
    { href: "/admin/participantes", label: "Participantes (CRM)", icon: Users },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Cintillo de Navegación Fijo Superior (Sticky Widescreen Navbar) */}
      <nav className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 px-4 sm:px-6 lg:px-8">
        <div className="h-16 flex items-center justify-between gap-4">
          {/* Logo y Nombre */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-cyan-400 flex items-center justify-center font-bold text-white shadow-md shadow-brand-500/20">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold text-white text-base tracking-tight block">
                ONPROTEC
              </span>
              <span className="text-[10px] text-cyan-400 font-medium block">
                Sala de Capacitaciones (18 + 1)
              </span>
            </div>
          </div>

          {/* Menú de Navegación Horizontal Widescreen */}
          <div className="hidden md:flex items-center gap-1 overflow-x-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition ${
                    isActive
                      ? "bg-brand-500/20 text-brand-300 border border-brand-500/40 shadow-sm"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>

          {/* Indicadores de Integraciones y Horario Local */}
          <div className="flex items-center gap-3">
            <div className="hidden lg:flex items-center gap-3 text-[11px] bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 font-mono">
              <div className="flex items-center gap-1.5 text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Odoo ERP</span>
              </div>
              <span className="text-slate-700">|</span>
              <div className="flex items-center gap-1.5 text-cyan-400">
                <span className="w-2 h-2 rounded-full bg-cyan-400" />
                <span>Pabilo Pay</span>
              </div>
              <span className="text-slate-700">|</span>
              <div className="flex items-center gap-1 text-slate-400">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                <span>Caracas (UTC-4)</span>
              </div>
            </div>

            <Link
              href="/"
              target="_blank"
              className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-lg border border-slate-700 flex items-center gap-1 transition"
            >
              <span>Ver Landing</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Barra móvil secundaria */}
        <div className="md:hidden flex items-center gap-1 overflow-x-auto py-2 border-t border-slate-800">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs whitespace-nowrap ${
                  isActive
                    ? "bg-brand-500/20 text-brand-300 font-bold"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Contenido Widescreen */}
      <main className="flex-1 w-full max-w-[1700px] mx-auto p-4 sm:p-6 lg:p-8">
        {children}
      </main>
    </div>
  );
}
