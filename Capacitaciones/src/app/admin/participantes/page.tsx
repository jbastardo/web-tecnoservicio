"use client";

import React, { useState, useEffect } from "react";
import {
  Users,
  ShoppingBag,
  Search,
  Building,
  Phone,
  Mail,
  CheckCircle,
  AlertCircle,
  DollarSign,
  ArrowUpRight,
} from "lucide-react";
import { Participant } from "@/types";
import { formatCurrency, fmtLocalDate } from "@/utils/formatUtils";
import { initialParticipants } from "@/lib/mockData";

export default function ParticipantesAdminPage() {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<"all" | "store_clients" | "prospects">("all");

  useEffect(() => {
    setParticipants(initialParticipants);
  }, []);

  const filtered = participants.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.docNumber || "").toLowerCase().includes(search.toLowerCase()) ||
      (p.phone || "").includes(search) ||
      (p.email || "").toLowerCase().includes(search.toLowerCase()) ||
      (p.company || "").toLowerCase().includes(search.toLowerCase()) ||
      (p.cargo || "").toLowerCase().includes(search.toLowerCase()) ||
      (p.city || "").toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;
    if (filterType === "store_clients") return p.hasStorePurchases;
    if (filterType === "prospects") return !p.hasStorePurchases;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Cintillo Widescreen de Cabecera y Filtros */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-brand-400" />
            <span>Directorio de Participantes & Clientes (CRM)</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Cruce de asistentes reales a la sala de capacitaciones con historial de compras de hardware en Onprotec ({participants.length} participantes únicos).
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Buscar por nombre, cédula, empresa o ciudad..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 w-72"
            />
          </div>

          <div className="flex bg-slate-900 border border-slate-700 rounded-xl p-1 text-xs">
            <button
              onClick={() => setFilterType("all")}
              className={`px-3 py-1 rounded-lg font-medium transition ${
                filterType === "all" ? "bg-brand-600 text-white" : "text-slate-400 hover:text-white"
              }`}
            >
              Todos ({participants.length})
            </button>
            <button
              onClick={() => setFilterType("prospects")}
              className={`px-3 py-1 rounded-lg font-medium transition ${
                filterType === "prospects"
                  ? "bg-cyan-600 text-white"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Prospectos Vírgenes
            </button>
            <button
              onClick={() => setFilterType("store_clients")}
              className={`px-3 py-1 rounded-lg font-medium transition ${
                filterType === "store_clients"
                  ? "bg-emerald-600 text-white"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Clientes Tienda
            </button>
          </div>
        </div>
      </div>

      {/* Tabla Widescreen de Participantes */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4">Participante</th>
                <th className="py-3.5 px-4">Documento</th>
                <th className="py-3.5 px-4">Contacto</th>
                <th className="py-3.5 px-4">Empresa / Rol</th>
                <th className="py-3.5 px-4">Ciudad / Nivel</th>
                <th className="py-3.5 px-4">Historial Tienda</th>
                <th className="py-3.5 px-4">Monto Comprado</th>
                <th className="py-3.5 px-4 text-right">Potencial Comercial</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filtered.slice(0, 100).map((p) => {
                return (
                  <tr key={p.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3.5 px-4 font-bold text-white">
                      {p.name}
                    </td>

                    <td className="py-3.5 px-4 font-mono text-slate-400">
                      {p.docNumber || "S/D"}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="block text-cyan-300 font-mono font-medium">{p.phone}</span>
                      <span className="block text-slate-500 text-[11px] truncate max-w-[180px]">{p.email}</span>
                    </td>

                    <td className="py-3.5 px-4 text-slate-300">
                      <span className="block font-semibold text-slate-200">{p.company || "Independiente"}</span>
                      {p.cargo && <span className="block text-[11px] text-slate-400">{p.cargo}</span>}
                    </td>

                    <td className="py-3.5 px-4 text-slate-300">
                      <span className="block text-slate-300">{p.city || "Caracas"}</span>
                      {p.experienceLevel && (
                        <span className="block text-[10px] text-amber-400/90 truncate max-w-[150px]">
                          {p.experienceLevel}
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      {p.hasStorePurchases ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          <CheckCircle className="w-3 h-3 text-emerald-400" />
                          Cliente Frecuente
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                          <ShoppingBag className="w-3 h-3 text-cyan-400" />
                          Prospecto Virgen
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 font-bold text-white">
                      {p.hasStorePurchases
                        ? formatCurrency(p.storePurchasesAmount)
                        : "$0.00"}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      {!p.hasStorePurchases ? (
                        <span className="text-[11px] font-semibold text-brand-300 bg-brand-950/60 border border-brand-800/60 px-2 py-0.5 rounded">
                          🎯 Alta prioridad ventas
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-500">Cuenta activa</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
