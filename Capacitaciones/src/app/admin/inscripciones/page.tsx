"use client";

import React, { useState, useEffect } from "react";
import {
  ClipboardList,
  CheckCircle,
  Clock,
  Send,
  CreditCard,
  FileText,
  Search,
  Filter,
  Users,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import { Registration } from "@/types";
import { fmtLocalDate, fmtLocalTime, formatCurrency } from "@/utils/formatUtils";
import { initialRegistrations, initialTrainings, initialParticipants } from "@/lib/mockData";

export default function InscripcionesAdminPage() {
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const fetchRegistrations = () => {
    setLoading(true);
    fetch("/api/inscripciones")
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setRegistrations(d.data);
      })
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchRegistrations();
  }, []);

  // Mutación en memoria para aprobación rápida
  const togglePaid = (id: number) => {
    setRegistrations((prev) =>
      prev.map((r) => {
        if (r.id === id) {
          const nextPaid = !r.isPaid;
          return {
            ...r,
            isPaid: nextPaid,
            status: nextPaid && r.status === "Inscrito" ? "Confirmado" : r.status,
            paymentDate: nextPaid ? new Date().toISOString() : null,
          };
        }
        return r;
      })
    );
  };

  const updateStatus = (id: number, status: string) => {
    setRegistrations((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status } : r))
    );
  };

  const updateInvoice = (id: number, invoiceNumber: string) => {
    setRegistrations((prev) =>
      prev.map((r) => (r.id === id ? { ...r, invoiceNumber } : r))
    );
  };

  const filtered = registrations.filter((r) => {
    const pName = r.participant?.name?.toLowerCase() || "";
    const pDoc = r.participant?.docNumber?.toLowerCase() || "";
    const tName = r.training?.name?.toLowerCase() || "";
    const matchesSearch =
      pName.includes(search.toLowerCase()) ||
      pDoc.includes(search.toLowerCase()) ||
      tName.includes(search.toLowerCase());

    const matchesStatus = statusFilter === "all" || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Cintillo Widescreen de Cabecera y Filtros */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <ClipboardList className="w-6 h-6 text-brand-400" />
            <span>Matriz de Inscripciones, Pagos & Facturación</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Aprobación de pagos Pabilo, control de Factura/Nota de Entrega y gestión de lista de espera.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Buscar participante, cédula o curso..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 w-64"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-brand-500"
          >
            <option value="all">Todos los Estados</option>
            <option value="Inscrito">Inscrito</option>
            <option value="Confirmado">Confirmado</option>
            <option value="Asistió">Asistió</option>
            <option value="No Asistió">No Asistió</option>
            <option value="Lista de Espera">Lista de Espera</option>
          </select>

          <button
            onClick={fetchRegistrations}
            className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 rounded-xl text-xs"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Tabla Widescreen de Inscripciones */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800 font-semibold">
              <tr>
                <th className="py-3.5 px-4">Participante</th>
                <th className="py-3.5 px-4">Capacitación</th>
                <th className="py-3.5 px-4">Monto / Pago</th>
                <th className="py-3.5 px-4">Validación Pabilo</th>
                <th className="py-3.5 px-4">Factura / Nota de Entrega</th>
                <th className="py-3.5 px-4">Estado</th>
                <th className="py-3.5 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 font-normal">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    Cargando inscripciones...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    No se encontraron registros coincidentes.
                  </td>
                </tr>
              ) : (
                filtered.map((r) => {
                  return (
                    <tr key={r.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-white block">
                          {r.participant?.name || "Sin Nombre"}
                        </span>
                        <span className="text-[11px] text-slate-400 block font-mono">
                          {r.participant?.docType}-{r.participant?.docNumber} | {r.participant?.phone}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 max-w-xs">
                        <span className="font-semibold text-slate-200 block truncate">
                          {r.training?.name || "Capacitación"}
                        </span>
                        <span className="text-[11px] text-slate-500">
                          {fmtLocalDate(r.training?.eventDate)}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white">
                            {formatCurrency(r.amount, r.currency)}
                          </span>
                          <button
                            type="button"
                            onClick={() => togglePaid(r.id)}
                            className={`px-2 py-0.5 rounded text-[10px] font-bold border transition ${
                              r.isPaid
                                ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                                : "bg-red-500/20 text-red-300 border-red-500/40"
                            }`}
                          >
                            {r.isPaid ? "Cobrado (Sí)" : "Por Cobrar"}
                          </button>
                        </div>
                        <span className="text-[10px] text-slate-500 block mt-0.5 font-mono">
                          {r.paymentMethod} {r.paymentReference ? `| Ref: ${r.paymentReference}` : ""}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        {r.pabiloStatus === "approved" ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-cyan-300 bg-cyan-950/60 border border-cyan-800/60 px-2 py-0.5 rounded-full">
                            <CheckCircle className="w-3 h-3 text-cyan-400" />
                            Pabilo Aprobado
                          </span>
                        ) : r.pabiloStatus === "rejected" ? (
                          <span className="text-[11px] font-semibold text-red-400 bg-red-950/60 border border-red-800/60 px-2 py-0.5 rounded-full">
                            Rechazado
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-400">Manual / Pendiente</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <input
                          type="text"
                          defaultValue={r.invoiceNumber || ""}
                          placeholder="Ej. FAC-00123"
                          onBlur={(e) => updateInvoice(r.id, e.target.value)}
                          className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-white placeholder-slate-600 font-mono w-28 focus:border-brand-500"
                        />
                      </td>

                      <td className="py-3.5 px-4">
                        <select
                          value={r.status}
                          onChange={(e) => updateStatus(r.id, e.target.value)}
                          className={`rounded px-2 py-1 text-[11px] font-bold border focus:outline-none ${
                            r.status === "Confirmado"
                              ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/40"
                              : r.status === "Asistió"
                              ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                              : r.status === "Lista de Espera"
                              ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                              : r.status === "No Asistió"
                              ? "bg-red-500/20 text-red-300 border-red-500/40"
                              : "bg-slate-800 text-slate-300 border-slate-700"
                          }`}
                        >
                          <option value="Inscrito">Inscrito</option>
                          <option value="Confirmado">Confirmado</option>
                          <option value="Asistió">Asistió</option>
                          <option value="No Asistió">No Asistió</option>
                          <option value="Lista de Espera">Lista de Espera</option>
                        </select>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={() =>
                            alert(
                              `Recordatorio WhatsApp 24h enviado al participante ${r.participant?.name} (${r.participant?.phone})`
                            )
                          }
                          className="p-1.5 hover:bg-slate-800 rounded text-emerald-400 transition"
                          title="Enviar Recordatorio WhatsApp 24h"
                        >
                          <Send className="w-3.5 h-3.5" />
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
    </div>
  );
}
