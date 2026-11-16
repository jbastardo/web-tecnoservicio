"use client";

import React from "react";
import Link from "next/link";
import { OnprotecBrand } from "@/components/OnprotecBrand";
import { ArrowLeft, Home, ShieldCheck } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#f8f9fc] dark:bg-[#0b0e17] text-[#1a1c29] dark:text-slate-100 transition-colors">
      {/* Cintillo Superior */}
      <div className="w-full bg-[#f4730a] text-white py-2 px-4 text-center text-xs font-black uppercase tracking-wider">
        OnProtec® • Centro de Capacitación & Certificación Técnica (Caracas)
      </div>

      <header className="max-w-6xl w-full mx-auto px-4 py-6 flex items-center justify-between">
        <OnprotecBrand />
        <Link
          href="/"
          className="text-xs font-extrabold text-[#f4730a] hover:underline flex items-center gap-1.5"
        >
          <Home className="w-4 h-4" />
          <span>Inicio</span>
        </Link>
      </header>

      <main className="max-w-lg w-full mx-auto px-4 py-12 text-center space-y-6">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-orange-100 dark:bg-orange-500/20 text-[#f4730a] font-black text-3xl shadow-inner border border-orange-300 dark:border-orange-500/40">
          404
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-black text-[#2a285c] dark:text-white">
            Página No Encontrada
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
            El enlace que abriste no existe o ha sido reubicado. Te invitamos a regresar a la página principal de capacitaciones para revisar los cursos y convocatorias activas.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link
            href="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#f4730a] hover:bg-[#ef7922] text-white font-black text-xs uppercase tracking-wider px-6 py-3 rounded-full shadow-lg shadow-[#f4730a]/25 transition hover:-translate-y-0.5"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver a Capacitaciones</span>
          </Link>

          <Link
            href="/admin"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-extrabold text-xs px-5 py-3 rounded-full transition"
          >
            <ShieldCheck className="w-4 h-4 text-[#f4730a]" />
            <span>Portal Admin</span>
          </Link>
        </div>
      </main>

      <footer className="py-6 text-center text-xs text-slate-500 border-t border-slate-200 dark:border-slate-800">
        © {new Date().getFullYear()} OnProtec C.A. • La Tienda del Instalador • Caracas, Venezuela
      </footer>
    </div>
  );
}
