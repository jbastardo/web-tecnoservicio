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
      return "bg-emerald-100 text-emerald-900 border-emerald-300 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/40 font-bold";
    if (status === "Confirmado")
      return "bg-sky-100 text-sky-900 border-sky-300 dark:bg-cyan-500/20 dark:text-cyan-300 dark:border-cyan-500/40 font-bold";
    if (status === "Lista de Espera")
      return "bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/40 font-bold";
    if (status === "No Asistió")
      return "bg-rose-100 text-rose-900 border-rose-300 dark:bg-red-500/20 dark:text-red-300 dark:border-red-500/40 font-bold";
    return "bg-slate-100 text-slate-800 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 font-bold";
  };

  return (
    <div className="space-y-6">
      {/* Cintillo Widescreen de Cabecera y Filtros */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 pb-4 border-b border-slate-300 dark:border-slate-800">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-[#f4730a]" />
            <span>Directorio de Inscritos & Historial de Participación (CRM OnProtec)</span>
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 font-medium">
            Consulta en qué capacitaciones ha participado cada inscrito, su asistencia real y su
            historial de compras en tienda ({participants.length} inscritos únicos).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Buscar por nombre, cédula, empresa o curso..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-[#f4730a] w-72 shadow-sm"
            />
          </div>

          <div className="flex flex-wrap bg-slate-200/70 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl p-1 text-xs gap-1 shadow-sm">
            <button
              onClick={() => setFilterType("all")}
              className={`px-3 py-1 rounded-lg font-bold transition ${
                filterType === "all"
                  ? "bg-[#2a285c] text-white shadow-sm keep-white"
                  : "text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              Todos ({participants.length})
            </button>
            <button
              onClick={() => setFilterType("recurring")}
              className={`px-3 py-1 rounded-lg font-bold transition ${
                filterType === "recurring"
                  ? "bg-[#f4730a] text-white shadow-sm keep-white"
                  : "text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              Recurrentes 2+ Cursos ({recurringCount})
            </button>
            <button
              onClick={() => setFilterType("prospects")}
              className={`px-3 py-1 rounded-lg font-bold transition ${
                filterType === "prospects"
                  ? "bg-sky-600 text-white shadow-sm keep-white"
                  : "text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              Prospectos Vírgenes
            </button>
            <button
              onClick={() => setFilterType("store_clients")}
              className={`px-3 py-1 rounded-lg font-bold transition ${
                filterType === "store_clients"
                  ? "bg-emerald-600 text-white shadow-sm keep-white"
                  : "text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              Clientes Tienda
            </button>
          </div>

          <button
            onClick={fetchParticipants}
            className="p-2 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs shadow-sm transition"
            title="Actualizar lista"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Tabla Widescreen de Participantes con Historial de Cursos */}
      <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-800 dark:text-slate-300">
            <thead className="bg-slate-100 dark:bg-slate-950 text-slate-700 dark:text-slate-400 uppercase text-[10px] tracking-wider font-extrabold border-b border-slate-300 dark:border-slate-800">
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
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800/80">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500 font-semibold">
                    Cargando historial de participantes...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500 font-semibold">
                    No se encontraron participantes con ese criterio.
                  </td>
                </tr>
              ) : (
                filtered.slice(0, 100).map((p) => {
                  const parts = p.participations || [];
                  const attended = parts.filter((x: any) => x.status === "Asistió").length;

                  return (
                    <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                      <td className="py-3.5 px-4">
                        <span className="font-extrabold text-slate-900 dark:text-white text-sm block">
                          {p.name || "Sin Nombre"}
                        </span>
                        <span className="text-[#0e5cd7] dark:text-cyan-400 font-mono text-xs font-bold block mt-0.5">
                          {p.phone || "Sin Teléfono"}
                        </span>
                        <span className="text-slate-600 dark:text-slate-400 text-[11px] block truncate max-w-[180px]">
                          {p.email || "Sin Email"}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 font-mono font-bold text-slate-800 dark:text-slate-300 text-xs">
                        {p.docNumber || "S/D"}
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="block font-bold text-slate-900 dark:text-slate-200 text-xs">
                          {p.company || "Independiente"}
                        </span>
                        <span className="block text-[11px] text-slate-600 dark:text-slate-400 font-medium">
                          {p.cargo || p.city || "Caracas"}
                        </span>
                      </td>

                      {/* Columna Clave: A dónde ha participado cada inscrito */}
                      <td className="py-3.5 px-4 max-w-md">
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-900 border border-blue-300 dark:bg-brand-500/20 dark:text-brand-300 dark:border-brand-500/30">
                            {parts.length} {parts.length === 1 ? "curso" : "cursos"}
                          </span>
                          <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold">
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
                              className="px-2 py-0.5 rounded text-[10px] font-bold bg-orange-100 text-[#f4730a] border border-[#f4730a]/40 dark:bg-[#e07b29]/20 dark:text-[#e07b29] dark:border-[#e07b29]/40"
                            >
                              +{parts.length - 3} más...
                            </button>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        {p.hasStorePurchases ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/30">
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
                            Cliente Tienda
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-sky-100 text-sky-900 border border-sky-300 dark:bg-cyan-500/20 dark:text-cyan-300 dark:border-cyan-500/30">
                            <ShoppingBag className="w-3.5 h-3.5 text-sky-700 dark:text-cyan-400" />
                            Prospecto Virgen
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 font-black text-slate-900 dark:text-white font-mono text-xs">
                        {p.hasStorePurchases ? formatCurrency(p.storePurchasesAmount) : "$0.00"}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedParticipant(p)}
                          className="px-3 py-1.5 bg-orange-50 hover:bg-[#f4730a] text-[#f4730a] hover:text-white border border-[#f4730a]/40 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-cyan-300 dark:border-slate-700 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 transition shadow-sm cursor-pointer"
                        >
                          <BookOpen className="w-3.5 h-3.5 text-[#f4730a] group-hover:text-white" />
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
          <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-3xl p-6 max-w-3xl w-full shadow-2xl relative my-8 text-slate-900 dark:text-white">
            <button
              onClick={() => setSelectedParticipant(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-800 dark:hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-start gap-4 pb-4 border-b border-slate-200 dark:border-slate-800 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-[#1a1b4b] border border-[#e07b29] flex items-center justify-center text-white font-black text-lg keep-white shadow-sm">
                {selectedParticipant.name?.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                  {selectedParticipant.name}
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                  Doc: <strong className="text-slate-900 dark:text-slate-200 font-bold">{selectedParticipant.docNumber || "S/D"}</strong>{" "}
                  · WhatsApp: <strong className="text-[#0e5cd7] dark:text-cyan-400 font-bold">{selectedParticipant.phone}</strong> ·
                  Email: <span className="font-medium">{selectedParticipant.email}</span>
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                  Empresa:{" "}
                  <strong className="text-slate-900 dark:text-white font-bold">
                    {selectedParticipant.company || "Independiente"}
                  </strong>{" "}
                  {selectedParticipant.cargo ? `(${selectedParticipant.cargo})` : ""} · Ciudad:{" "}
                  <span className="font-medium">{selectedParticipant.city || "Caracas"}</span>
                </p>
              </div>
            </div>

            {/* KPIs rápidos del participante */}
            <div className="grid grid-cols-3 gap-3 mb-5 text-center">
              <div className="bg-slate-100 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                <span className="text-[11px] text-slate-600 dark:text-slate-400 font-semibold block">Total Inscripciones</span>
                <span className="text-xl font-black text-slate-900 dark:text-white">
                  {selectedParticipant.participations?.length || 0}
                </span>
              </div>
              <div className="bg-slate-100 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                <span className="text-[11px] text-slate-600 dark:text-slate-400 font-semibold block">Asistencias Efectivas</span>
                <span className="text-xl font-black text-emerald-700 dark:text-emerald-400">
                  {(selectedParticipant.participations || []).filter(
                    (x: any) => x.status === "Asistió"
                  ).length}
                </span>
              </div>
              <div className="bg-slate-100 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                <span className="text-[11px] text-slate-600 dark:text-slate-400 font-semibold block">Compras en Tienda OnProtec</span>
                <span className="text-xl font-black text-[#0e5cd7] dark:text-cyan-400 font-mono">
                  {formatCurrency(selectedParticipant.storePurchasesAmount || 0)}
                </span>
              </div>
            </div>

            <h4 className="text-xs font-black uppercase tracking-wider text-[#f4730a] mb-3 flex items-center gap-1.5">
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
                  className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono font-bold text-[#0e5cd7] dark:text-brand-300">
                        {part.trainingCode}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-orange-100 text-[#f4730a] dark:bg-[#e07b29]/15 dark:text-[#e07b29] text-[10px] font-bold">
                        {part.brand || part.trainingType}
                      </span>
                      <span className="text-slate-600 dark:text-slate-400 flex items-center gap-1 text-[11px]">
                        <Calendar className="w-3 h-3 text-cyan-400" />
                        {fmtLocalDate(part.eventDate)}
                      </span>
                    </div>
                    <p className="font-bold text-slate-900 dark:text-white text-sm">{part.trainingName}</p>
                    {part.specialNotes && (
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 italic font-medium">
                        Nota / Consulta: {part.specialNotes}
                      </p>
                    )}
                    {part.customAnswers && Object.keys(part.customAnswers).length > 0 && (
                      <div className="pt-1 flex flex-wrap gap-1.5">
                        {Object.entries(part.customAnswers).map(([k, v]) => (
                          <span
                            key={k}
                            className="text-[10px] bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 px-2 py-0.5 rounded text-slate-700 dark:text-slate-300 font-medium"
                          >
                            <strong>{k}:</strong>{" "}
                            {typeof v === "string" && v.startsWith("data:") ? (
                              <a
                                href={v}
                                target="_blank"
                                rel="noreferrer"
                                download={`adjunto-${part.trainingCode}.png`}
                                className="text-cyan-600 dark:text-cyan-400 font-bold underline"
                              >
                                📎 Ver Archivo / Comprobante
                              </a>
                            ) : (
                              String(v)
                            )}
                          </span>
                        ))}
                      </div>
                    )}
                    {part.paymentProofUrl && (
                      <div className="pt-1">
                        <a
                          href={part.paymentProofUrl}
                          target="_blank"
                          rel="noreferrer"
                          download={part.paymentProofUrl.startsWith("data:") ? `comprobante-${part.trainingCode}.png` : undefined}
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700 px-2 py-0.5 rounded hover:underline"
                        >
                          📎 Comprobante de Pago
                        </a>
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
                    <span className="text-[11px] text-slate-600 dark:text-slate-400 font-mono font-bold">
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
