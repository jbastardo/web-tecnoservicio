"use client";

import React, { useState, useEffect } from "react";
import {
  Users,
  ShoppingBag,
  Search,
  CheckCircle,
  Calendar,
  Award,
  X,
  ExternalLink,
  RefreshCw,
  BookOpen,
  Clock,
} from "lucide-react";
import { formatCurrency, fmtLocalDate } from "@/utils/formatUtils";

export default function ParticipantesAdminPage() {
  const [participants, setParticipants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<
    "all" | "recurring" | "store_clients" | "prospects"
  >("all");
  const [selectedParticipant, setSelectedParticipant] = useState<any | null>(null);

  const fetchParticipants = () => {
    setLoading(true);
    fetch("/api/participantes")
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setParticipants(d.data);
      })
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchParticipants();
  }, []);

  const recurringCount = participants.filter(
    (p) => (p.participations?.length || 0) > 1
  ).length;

  const filtered = participants.filter((p) => {
    const q = search.toLowerCase();
    const matchesCourse = (p.participations || []).some(
      (part: any) =>
        part.trainingName?.toLowerCase().includes(q) ||
        part.trainingCode?.toLowerCase().includes(q) ||
        part.brand?.toLowerCase().includes(q)
    );

    const matchesSearch =
      p.name?.toLowerCase().includes(q) ||
      (p.docNumber || "").toLowerCase().includes(q) ||
      (p.phone || "").includes(search) ||
      (p.email || "").toLowerCase().includes(q) ||
      (p.company || "").toLowerCase().includes(q) ||
      (p.cargo || "").toLowerCase().includes(q) ||
      (p.city || "").toLowerCase().includes(q) ||
      matchesCourse;

    if (!matchesSearch) return false;
    if (filterType === "recurring") return (p.participations?.length || 0) > 1;
    if (filterType === "store_clients") return p.hasStorePurchases;
    if (filterType === "prospects") return !p.hasStorePurchases;
    return true;
  });

  const statusBadgeColor = (status: string) => {
    if (status === "Asistió")
      return "bg-emerald-500/20 text-emerald-300 border-emerald-500/40";
    if (status === "Confirmado")
      return "bg-cyan-500/20 text-cyan-300 border-cyan-500/40";
    if (status === "Lista de Espera")
      return "bg-amber-500/20 text-amber-300 border-amber-500/40";
    if (status === "No Asistió")
      return "bg-red-500/20 text-red-300 border-red-500/40";
    return "bg-slate-800 text-slate-300 border-slate-700";
  };

  return (
    <div className="space-y-6">
      {/* Cintillo Widescreen de Cabecera y Filtros */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-[#e07b29]" />
            <span>Directorio de Inscritos & Historial de Participación (CRM OnProtec)</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Consulta en qué capacitaciones ha participado cada inscrito, su asistencia real y su
            historial de compras en tienda ({participants.length} inscritos únicos).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Buscar por nombre, cédula, empresa o curso donde participó..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 w-72"
            />
          </div>

          <div className="flex flex-wrap bg-slate-900 border border-slate-700 rounded-xl p-1 text-xs gap-1">
            <button
              onClick={() => setFilterType("all")}
              className={`px-2.5 py-1 rounded-lg font-semibold transition ${
                filterType === "all"
                  ? "bg-brand-600 text-white"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Todos ({participants.length})
            </button>
            <button
              onClick={() => setFilterType("recurring")}
              className={`px-2.5 py-1 rounded-lg font-semibold transition ${
                filterType === "recurring"
                  ? "bg-[#e07b29] text-white keep-white"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Recurrentes 2+ Cursos ({recurringCount})
            </button>
            <button
              onClick={() => setFilterType("prospects")}
              className={`px-2.5 py-1 rounded-lg font-semibold transition ${
                filterType === "prospects"
                  ? "bg-cyan-600 text-white"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Prospectos Vírgenes
            </button>
            <button
              onClick={() => setFilterType("store_clients")}
              className={`px-2.5 py-1 rounded-lg font-semibold transition ${
                filterType === "store_clients"
                  ? "bg-emerald-600 text-white"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Clientes Tienda
            </button>
          </div>

          <button
            onClick={fetchParticipants}
            className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 rounded-xl text-xs"
            title="Actualizar lista"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Tabla Widescreen de Participantes con Historial de Cursos */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4">Participante / Contacto</th>
                <th className="py-3.5 px-4">Documento</th>
                <th className="py-3.5 px-4">Empresa / Rol</th>
                <th className="py-3.5 px-4">¿Dónde ha Participado? (Capacitaciones)</th>
                <th className="py-3.5 px-4">Historial Tienda</th>
                <th className="py-3.5 px-4">Monto Comprado</th>
                <th className="py-3.5 px-4 text-right">Expediente</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    Cargando historial de participantes...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    No se encontraron participantes con ese criterio.
                  </td>
                </tr>
              ) : (
                filtered.slice(0, 100).map((p) => {
                  const parts = p.participations || [];
                  const attended = parts.filter((x: any) => x.status === "Asistió").length;

                  return (
                    <tr key={p.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-white block">{p.name}</span>
                        <span className="text-cyan-300 font-mono text-[11px] block">
                          {p.phone}
                        </span>
                        <span className="text-slate-500 text-[10px] block truncate max-w-[180px]">
                          {p.email}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 font-mono text-slate-400">
                        {p.docNumber || "S/D"}
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="block font-semibold text-slate-200">
                          {p.company || "Independiente"}
                        </span>
                        <span className="block text-[11px] text-slate-400">
                          {p.cargo || p.city || "Caracas"}
                        </span>
                      </td>

                      {/* Columna Clave: A dónde ha participado cada inscrito */}
                      <td className="py-3.5 px-4 max-w-md">
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-brand-500/20 text-brand-300 border border-brand-500/30">
                            {parts.length} {parts.length === 1 ? "curso" : "cursos"}
                          </span>
                          <span className="text-[10px] text-emerald-400 font-semibold">
                            ({attended} asistencias en sala)
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {parts.slice(0, 3).map((item: any) => (
                            <button
                              key={item.registrationId}
                              type="button"
                              onClick={() => setSelectedParticipant(p)}
                              className={`text-left px-2 py-0.5 rounded text-[10px] border truncate max-w-[220px] transition ${statusBadgeColor(
                                item.status
                              )}`}
                              title={`${item.trainingCode} - ${item.trainingName} (${item.status})`}
                            >
                              <strong className="font-mono">{item.trainingCode}:</strong>{" "}
                              {item.trainingName} ({item.status})
                            </button>
                          ))}
                          {parts.length > 3 && (
                            <button
                              type="button"
                              onClick={() => setSelectedParticipant(p)}
                              className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#e07b29]/20 text-[#e07b29] border border-[#e07b29]/40"
                            >
                              +{parts.length - 3} más...
                            </button>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        {p.hasStorePurchases ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            <CheckCircle className="w-3 h-3 text-emerald-400" />
                            Cliente Tienda
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                            <ShoppingBag className="w-3 h-3 text-cyan-400" />
                            Prospecto Virgen
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 font-bold text-white">
                        {p.hasStorePurchases ? formatCurrency(p.storePurchasesAmount) : "$0.00"}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedParticipant(p)}
                          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 transition"
                        >
                          <BookOpen className="w-3.5 h-3.5 text-[#e07b29]" />
                          <span>Ver Participaciones ({parts.length})</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Historial Completo de Participaciones del Inscrito */}
      {selectedParticipant && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 max-w-3xl w-full shadow-2xl relative my-8">
            <button
              onClick={() => setSelectedParticipant(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-start gap-4 pb-4 border-b border-slate-800 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-[#1a1b4b] border border-[#e07b29] flex items-center justify-center text-white font-black text-lg keep-white">
                {selectedParticipant.name?.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-white">
                  {selectedParticipant.name}
                </h3>
                <p className="text-xs text-slate-400">
                  Doc: <strong className="text-slate-200">{selectedParticipant.docNumber || "S/D"}</strong>{" "}
                  · WhatsApp: <strong className="text-cyan-400">{selectedParticipant.phone}</strong> ·
                  Email: {selectedParticipant.email}
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  Empresa:{" "}
                  <strong className="text-white">
                    {selectedParticipant.company || "Independiente"}
                  </strong>{" "}
                  {selectedParticipant.cargo ? `(${selectedParticipant.cargo})` : ""} · Ciudad:{" "}
                  {selectedParticipant.city || "Caracas"}
                </p>
              </div>
            </div>

            {/* KPIs rápidos del participante */}
            <div className="grid grid-cols-3 gap-3 mb-5 text-center">
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="text-[11px] text-slate-400 block">Total Inscripciones</span>
                <span className="text-xl font-black text-white">
                  {selectedParticipant.participations?.length || 0}
                </span>
              </div>
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="text-[11px] text-slate-400 block">Asistencias Efectivas</span>
                <span className="text-xl font-black text-emerald-400">
                  {(selectedParticipant.participations || []).filter(
                    (x: any) => x.status === "Asistió"
                  ).length}
                </span>
              </div>
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="text-[11px] text-slate-400 block">Compras en Tienda OnProtec</span>
                <span className="text-xl font-black text-cyan-400">
                  {formatCurrency(selectedParticipant.storePurchasesAmount || 0)}
                </span>
              </div>
            </div>

            <h4 className="text-xs font-bold uppercase tracking-wider text-[#e07b29] mb-3 flex items-center gap-1.5">
              <Award className="w-4 h-4" />
              <span>
                Capacitaciones donde se ha inscrito o participado (
                {selectedParticipant.participations?.length || 0})
              </span>
            </h4>

            <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
              {(selectedParticipant.participations || []).map((part: any) => (
                <div
                  key={part.registrationId}
                  className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono font-bold text-brand-300">
                        {part.trainingCode}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-[#e07b29]/15 text-[#e07b29] text-[10px] font-bold">
                        {part.brand || part.trainingType}
                      </span>
                      <span className="text-slate-400 flex items-center gap-1 text-[11px]">
                        <Calendar className="w-3 h-3 text-cyan-400" />
                        {fmtLocalDate(part.eventDate)}
                      </span>
                    </div>
                    <p className="font-bold text-white text-sm">{part.trainingName}</p>
                    {part.specialNotes && (
                      <p className="text-[11px] text-slate-400 italic">
                        Nota / Consulta: {part.specialNotes}
                      </p>
                    )}
                    {part.customAnswers && Object.keys(part.customAnswers).length > 0 && (
                      <div className="pt-1 flex flex-wrap gap-1.5">
                        {Object.entries(part.customAnswers).map(([k, v]) => (
                          <span
                            key={k}
                            className="text-[10px] bg-slate-900 border border-slate-800 px-2 py-0.5 rounded text-slate-300"
                          >
                            <strong>{k}:</strong> {String(v)}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex sm:flex-col items-end justify-between gap-1.5 flex-shrink-0">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${statusBadgeColor(
                        part.status
                      )}`}
                    >
                      {part.status}
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {Number(part.amount) > 0
                        ? `${formatCurrency(part.amount)} (${part.isPaid ? "Pagado" : "Pendiente"})`
                        : "Evento Gratuito"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
