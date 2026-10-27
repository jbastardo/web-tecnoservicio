"use client";

import React, { useState, useEffect } from "react";
import {
  CalendarCheck,
  Plus,
  Users,
  Layers,
  DollarSign,
  QrCode,
  ExternalLink,
  RefreshCw,
  X,
  Check,
  Search,
  ArrowUpDown,
} from "lucide-react";
import { Training } from "@/types";
import { fmtLocalDate, fmtLocalHour, formatCurrency } from "@/utils/formatUtils";
import { initialTrainings, initialOdooSkus } from "@/lib/mockData";

export default function CapacitacionesAdminPage() {
  const [trainings, setTrainings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [odooSkus, setOdooSkus] = useState<any[]>([]);
  const [syncingOdoo, setSyncingOdoo] = useState(false);
  const [search, setSearch] = useState("");
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");

  // Modal Crear
  const [showModal, setShowModal] = useState(false);
  const [newTraining, setNewTraining] = useState({
    name: "",
    code: "",
    type: "Curso",
    instructor: "",
    eventDate: "",
    adStartDate: "",
    adCosts: "0",
    associatedCosts: "0",
    price: "35",
    currency: "USD",
    selectedSkus: [] as string[],
    description: "",
  });

  const [selectedQr, setSelectedQr] = useState<{ name: string; qr: string; url: string } | null>(
    null
  );

  const fetchTrainings = () => {
    setLoading(true);
    fetch(`/api/capacitaciones?order=${sortOrder}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setTrainings(d.data);
      })
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchTrainings();
    setOdooSkus(initialOdooSkus);
  }, [sortOrder]);

  const handleSyncOdoo = async () => {
    setSyncingOdoo(true);
    try {
      const res = await fetch("/api/odoo/sync", { method: "POST" });
      const data = await res.json();
      if (data.products) {
        setOdooSkus(data.products);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSyncingOdoo(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/capacitaciones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newTraining,
          relatedSkus: newTraining.selectedSkus,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setShowModal(false);
        fetchTrainings();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Filtrado y ordenamiento cronológico
  const filteredTrainings = trainings
    .filter((t) => {
      const matchSearch =
        t.name?.toLowerCase().includes(search.toLowerCase()) ||
        t.code?.toLowerCase().includes(search.toLowerCase()) ||
        t.instructor?.toLowerCase().includes(search.toLowerCase());
      return matchSearch;
    })
    .sort((a, b) => {
      const dateA = new Date(a.eventDate || 0).getTime();
      const dateB = new Date(b.eventDate || 0).getTime();
      return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
    });

  return (
    <div className="space-y-6">
      {/* Cintillo Widescreen de Cabecera y Acciones */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <CalendarCheck className="w-6 h-6 text-brand-400" />
            <span>Gestión de Capacitaciones & Costos</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            {filteredTrainings.length} eventos ordenados cronológicamente ({sortOrder === "desc" ? "más recientes primero" : "más antiguos primero"}).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Barra de Búsqueda */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Buscar evento o instructor..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 w-52"
            />
          </div>

          {/* Botón de Ordenamiento por Fecha */}
          <button
            onClick={() => setSortOrder(sortOrder === "desc" ? "asc" : "desc")}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-200 rounded-xl transition shadow-sm"
            title="Hacer clic para cambiar orden por fecha"
          >
            <ArrowUpDown className="w-3.5 h-3.5 text-cyan-400" />
            <span>{sortOrder === "desc" ? "📅 Más recientes primero" : "📅 Más antiguos primero"}</span>
          </button>

          <button
            onClick={handleSyncOdoo}
            disabled={syncingOdoo}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-cyan-300 rounded-xl transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncingOdoo ? "animate-spin" : ""}`} />
            <span>Sincronizar Odoo</span>
          </button>

          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-brand-500/20 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Nueva Capacitación</span>
          </button>
        </div>
      </div>

      {/* Tabla Widescreen de Eventos */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800 font-semibold">
              <tr>
                <th className="py-3.5 px-4">Código / Evento</th>
                <th className="py-3.5 px-4">Tipo & Instructor</th>
                <th
                  onClick={() => setSortOrder(sortOrder === "desc" ? "asc" : "desc")}
                  className="py-3.5 px-4 cursor-pointer hover:text-white select-none transition"
                  title="Clic para cambiar orden cronológico"
                >
                  <div className="flex items-center gap-1">
                    <span>Fecha (Caracas)</span>
                    <ArrowUpDown className="w-3 h-3 text-cyan-400" />
                    <span className="text-[9px] text-cyan-400 font-mono">
                      ({sortOrder === "desc" ? "↓ Recientes" : "↑ Antiguos"})
                    </span>
                  </div>
                </th>
                <th className="py-3.5 px-4">Aforo Sala (Máx 18)</th>
                <th className="py-3.5 px-4">Inversión / Costos</th>
                <th className="py-3.5 px-4">SKUs Odoo</th>
                <th className="py-3.5 px-4">Estado</th>
                <th className="py-3.5 px-4 text-right">Encuesta QR</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 font-normal">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500">
                    Cargando capacitaciones...
                  </td>
                </tr>
              ) : filteredTrainings.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500">
                    No se encontraron capacitaciones coincidentes.
                  </td>
                </tr>
              ) : (
                filteredTrainings.map((t) => {
                  const stats = t.stats || { totalOccupied: 16, availableSeats: 2, isFull: false };
                  const isFull = stats.totalOccupied >= 18;

                  return (
                    <tr key={t.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3.5 px-4">
                        <span className="font-mono text-[11px] text-brand-300 block font-semibold">
                          {t.code}
                        </span>
                        <span className="text-white font-bold block max-w-xs truncate">
                          {t.name}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-brand-500/20 text-brand-300 border border-brand-500/30">
                          {t.type}
                        </span>
                        <span className="block text-slate-400 mt-1">{t.instructor}</span>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="font-semibold text-slate-200 block">
                          {fmtLocalDate(t.eventDate)}
                        </span>
                        <span className="text-slate-500 text-[11px]">
                          {fmtLocalHour(t.eventDate)}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className={`font-bold ${isFull ? "text-amber-400" : "text-emerald-400"}`}>
                            {stats.totalOccupied} / 18
                          </span>
                          {isFull && (
                            <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded border border-amber-500/30 font-bold">
                              Lleno
                            </span>
                          )}
                        </div>
                        <div className="w-24 bg-slate-800 h-1.5 rounded-full mt-1.5 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${isFull ? "bg-amber-500" : "bg-emerald-500"}`}
                            style={{ width: `${Math.min(100, (stats.totalOccupied / 18) * 100)}%` }}
                          />
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-bold text-white block">
                          {formatCurrency(t.price, t.currency)}
                        </span>
                        <span className="text-[10px] text-slate-500 block">
                          Pub: {formatCurrency(t.adCosts)} | Log: {formatCurrency(t.associatedCosts)}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {t.relatedSkus && t.relatedSkus.length > 0 ? (
                            t.relatedSkus.map((sku: string) => (
                              <span
                                key={sku}
                                className="text-[10px] bg-slate-800 border border-slate-700 px-1.5 py-0.5 rounded text-cyan-300 font-mono"
                              >
                                {sku}
                              </span>
                            ))
                          ) : (
                            <span className="text-slate-600 italic text-[11px]">Ninguno</span>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                          {t.status}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        {t.surveyQrCode ? (
                          <button
                            onClick={() =>
                              setSelectedQr({
                                name: t.name,
                                qr: t.surveyQrCode,
                                url: t.surveyUrl || "",
                              })
                            }
                            className="p-1.5 hover:bg-slate-800 rounded-lg text-brand-400 transition"
                            title="Ver Código QR de Encuesta"
                          >
                            <QrCode className="w-4 h-4" />
                          </button>
                        ) : (
                          <span className="text-slate-600">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Ver QR de Encuesta */}
      {selectedQr && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-sm w-full text-center relative shadow-2xl">
            <button
              onClick={() => setSelectedQr(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-base font-bold text-white mb-2">{selectedQr.name}</h3>
            <p className="text-xs text-slate-400 mb-4">
              Muestra este código en la pantalla de la sala al finalizar la clase para que los
              asistentes califiquen el curso.
            </p>
            <div className="bg-white p-4 rounded-2xl inline-block mx-auto mb-4 shadow-lg">
              <img src={selectedQr.qr} alt="Código QR" className="w-48 h-48 mx-auto" />
            </div>
            <a
              href={selectedQr.url}
              target="_blank"
              className="text-xs text-cyan-400 hover:underline flex items-center justify-center gap-1"
            >
              <span>Abrir enlace directo de encuesta</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      )}

      {/* Modal Crear Capacitación */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-xl w-full shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <CalendarCheck className="w-5 h-5 text-brand-400" />
                <span>Nueva Capacitación Onprotec</span>
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Nombre del Curso / Workshop *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Configuración de Centrales Telefónicas IP"
                  value={newTraining.name}
                  onChange={(e) => setNewTraining({ ...newTraining, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Tipo de Evento</label>
                  <select
                    value={newTraining.type}
                    onChange={(e) => setNewTraining({ ...newTraining, type: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white text-xs"
                  >
                    <option value="Curso">Curso</option>
                    <option value="Workshop">Workshop</option>
                    <option value="Certificación">Certificación</option>
                    <option value="Interno">Interno</option>
                    <option value="Otros">Otros</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Instructor *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Ing. Carlos Mendoza"
                    value={newTraining.instructor}
                    onChange={(e) => setNewTraining({ ...newTraining, instructor: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Fecha y Hora del Evento *</label>
                  <input
                    type="datetime-local"
                    required
                    value={newTraining.eventDate}
                    onChange={(e) => setNewTraining({ ...newTraining, eventDate: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white text-xs"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Inicio de Pauta Publicitaria</label>
                  <input
                    type="datetime-local"
                    value={newTraining.adStartDate}
                    onChange={(e) => setNewTraining({ ...newTraining, adStartDate: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white text-xs"
                  />
                </div>
              </div>

              {/* Estructura Financiera & ROI */}
              <div className="grid grid-cols-3 gap-3 pt-2 border-t border-slate-800">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Precio Entrada ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newTraining.price}
                    onChange={(e) => setNewTraining({ ...newTraining, price: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Costo Publicidad ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newTraining.adCosts}
                    onChange={(e) => setNewTraining({ ...newTraining, adCosts: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Costos Refrigerio/Log ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newTraining.associatedCosts}
                    onChange={(e) => setNewTraining({ ...newTraining, associatedCosts: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white text-xs"
                  />
                </div>
              </div>

              {/* SKUs Odoo vinculados */}
              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  SKUs de Odoo vinculados a las prácticas:
                </label>
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-2 bg-slate-950 rounded-lg border border-slate-800">
                  {odooSkus.map((item) => {
                    const isSelected = newTraining.selectedSkus.includes(item.sku);
                    return (
                      <button
                        key={item.sku}
                        type="button"
                        onClick={() => {
                          const next = isSelected
                            ? newTraining.selectedSkus.filter((s) => s !== item.sku)
                            : [...newTraining.selectedSkus, item.sku];
                          setNewTraining({ ...newTraining, selectedSkus: next });
                        }}
                        className={`px-2 py-1 rounded text-[11px] font-mono border transition ${
                          isSelected
                            ? "bg-cyan-500/20 border-cyan-400 text-cyan-200"
                            : "bg-slate-900 border-slate-800 text-slate-400"
                        }`}
                      >
                        {item.sku}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold"
                >
                  Guardar Capacitación
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
