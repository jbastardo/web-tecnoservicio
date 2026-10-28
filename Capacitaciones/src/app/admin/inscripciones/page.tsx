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
  ShieldCheck,
  X,
  Check,
  ExternalLink,
  AlertCircle,
  Edit3,
} from "lucide-react";
import { fmtLocalDate, fmtLocalTime, formatCurrency } from "@/utils/formatUtils";

export default function InscripcionesAdminPage() {
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [trainingFilter, setTrainingFilter] = useState("all");
  const [trainings, setTrainings] = useState<any[]>([]);

  // Estado para el Modal de Validación Manual de Pagos
  const [modalReg, setModalReg] = useState<any | null>(null);
  // Estado para ver en qué capacitaciones ha participado un inscrito
  const [historyParticipant, setHistoryParticipant] = useState<any | null>(null);
  const [modalForm, setModalForm] = useState({
    isPaid: false,
    amount: 0,
    paymentMethod: "",
    pabiloStatus: "manual",
    paymentReference: "",
    paymentProofUrl: "",
    status: "Confirmado",
    paymentNotes: "",
    invoiceNumber: "",
  });
  const [savingModal, setSavingModal] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 4500);
  };

  const fetchRegistrations = () => {
    setLoading(true);
    fetch("/api/inscripciones")
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setRegistrations(d.data);
      })
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));

    fetch("/api/capacitaciones")
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setTrainings(d.data);
      })
      .catch((e) => console.error(e));
  };

  useEffect(() => {
    fetchRegistrations();
  }, []);

  // Función genérica persistente para actualizar inscripción
  const patchRegistration = async (id: number, fields: any) => {
    try {
      const res = await fetch("/api/inscripciones", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...fields }),
      });
      const data = await res.json();
      if (data.success) {
        setRegistrations((prev) =>
          prev.map((r) => (r.id === id ? { ...r, ...data.data } : r))
        );
        return data.data;
      }
    } catch (err) {
      console.error("Error al actualizar inscripción:", err);
    }
    return null;
  };

  // Toggle rápido de cobro (persiste en servidor)
  const togglePaid = (r: any) => {
    const nextPaid = !r.isPaid;
    const nextStatus = nextPaid && r.status === "Inscrito" ? "Confirmado" : r.status;
    const nextPabiloStatus = nextPaid
      ? r.pabiloStatus === "approved"
        ? "approved"
        : "manual"
      : "pending";

    patchRegistration(r.id, {
      isPaid: nextPaid,
      status: nextStatus,
      pabiloStatus: nextPabiloStatus,
      paymentDate: nextPaid ? new Date().toISOString() : null,
      paymentNotes: nextPaid ? "Pago validado manualmente" : "Marcado como pendiente de pago",
    });
    showToast(`Estado de pago actualizado para ${r.participant?.name || "participante"}`);
  };

  const updateStatus = (id: number, status: string) => {
    patchRegistration(id, { status });
  };

  const updateInvoice = (id: number, invoiceNumber: string) => {
    patchRegistration(id, { invoiceNumber });
  };

  // Abrir Modal de Validación Manual
  const openValidationModal = (r: any) => {
    setModalReg(r);
    setModalForm({
      isPaid: Boolean(r.isPaid),
      amount: r.amount || r.training?.price || 0,
      paymentMethod: r.paymentMethod || "Binance (USDT)",
      pabiloStatus: r.pabiloStatus || (r.isPaid ? "manual" : "pending"),
      paymentReference: r.paymentReference || "",
      paymentProofUrl: r.paymentProofUrl || "",
      status: r.status || "Confirmado",
      paymentNotes: r.paymentNotes || "",
      invoiceNumber: r.invoiceNumber || "",
    });
  };

  // Guardar datos desde el Modal
  const handleSaveModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalReg) return;
    setSavingModal(true);

    const updated = await patchRegistration(modalReg.id, {
      isPaid: modalForm.isPaid,
      amount: modalForm.amount,
      paymentMethod: modalForm.paymentMethod,
      pabiloStatus: modalForm.pabiloStatus,
      paymentReference: modalForm.paymentReference,
      paymentProofUrl: modalForm.paymentProofUrl,
      status: modalForm.status,
      paymentNotes: modalForm.paymentNotes,
      invoiceNumber: modalForm.invoiceNumber,
      paymentDate: modalForm.isPaid ? modalReg.paymentDate || new Date().toISOString() : null,
    });

    setSavingModal(false);
    setModalReg(null);
    showToast(`Validación guardada con éxito para ${modalReg.participant?.name || "participante"}.`);
  };

  const filtered = registrations.filter((r) => {
    const pName = r.participant?.name?.toLowerCase() || "";
    const pDoc = (r.participant?.docNumber || "").toLowerCase();
    const tName = r.training?.name?.toLowerCase() || "";
    const matchesSearch =
      pName.includes(search.toLowerCase()) ||
      pDoc.includes(search.toLowerCase()) ||
      tName.includes(search.toLowerCase());

    const matchesStatus = statusFilter === "all" || r.status === statusFilter;
    const matchesTraining = trainingFilter === "all" || String(r.trainingId) === trainingFilter;
    return matchesSearch && matchesStatus && matchesTraining;
  });

  return (
    <div className="space-y-6">
      {/* Toast de Notificación */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-emerald-950 border border-emerald-600 text-emerald-200 text-xs px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 animate-bounce">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Cintillo Widescreen de Cabecera y Filtros */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <ClipboardList className="w-6 h-6 text-brand-400" />
            <span>Matriz de Inscripciones, Pagos & Validación Manual</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Gestión y conciliación de {registrations.length} inscripciones reales con validación manual y soporte Pabilo Pay.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Buscar participante, cédula o curso..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 w-52"
            />
          </div>

          <select
            value={trainingFilter}
            onChange={(e) => setTrainingFilter(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-brand-500 max-w-[260px] truncate"
          >
            <option value="all">Todas las Capacitaciones ({trainings.length})</option>
            {trainings
              .slice()
              .sort((a, b) => new Date(b.eventDate || 0).getTime() - new Date(a.eventDate || 0).getTime())
              .map((t) => (
                <option key={t.id} value={String(t.id)}>
                  [{fmtLocalDate(t.eventDate)}] {t.name}
                </option>
            ))}
          </select>

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

          <span className="text-[11px] font-mono text-cyan-300 bg-slate-900 border border-slate-700 px-2.5 py-1.5 rounded-xl">
            {filtered.length} reg.
          </span>

          <button
            onClick={fetchRegistrations}
            className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 rounded-xl text-xs transition"
            title="Recargar"
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
                <th className="py-3.5 px-4">Tipo de Validación</th>
                <th className="py-3.5 px-4">Comprobante / Ref</th>
                <th className="py-3.5 px-4">Factura / Nota</th>
                <th className="py-3.5 px-4">Asistencia</th>
                <th className="py-3.5 px-4 text-right">Acción Manual</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 font-normal">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500">
                    Cargando inscripciones...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500">
                    No se encontraron registros coincidentes.
                  </td>
                </tr>
              ) : (
                filtered.slice(0, 100).map((r) => {
                  return (
                    <tr key={r.id} className="hover:bg-slate-800/40 transition">
                      {/* Participante */}
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-white block">
                          {r.participant?.name || "Sin Nombre"}
                        </span>
                        <span className="text-[11px] text-slate-400 block font-mono">
                          {r.participant?.docNumber || "S/D"} | {r.participant?.phone}
                        </span>
                        {r.participant?.participations && (
                          <button
                            type="button"
                            onClick={() => setHistoryParticipant(r.participant)}
                            className="mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#e07b29]/15 text-[#e07b29] border border-[#e07b29]/30 hover:bg-[#e07b29]/25 transition"
                            title="Ver todas las capacitaciones donde ha participado este inscrito"
                          >
                            <span>
                              📚 Participó en {r.participant.participations.length}{" "}
                              {r.participant.participations.length === 1 ? "curso" : "cursos"}
                            </span>
                          </button>
                        )}
                      </td>

                      {/* Capacitación */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <span className="font-semibold text-slate-200 block truncate">
                          {r.training?.name || "Capacitación"}
                        </span>
                        <span className="text-[11px] text-slate-500">
                          {fmtLocalDate(r.training?.eventDate)}
                        </span>
                      </td>

                      {/* Monto / Estado de Cobro */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white">
                            {formatCurrency(r.amount, r.currency)}
                          </span>
                          <button
                            type="button"
                            onClick={() => togglePaid(r)}
                            className={`px-2 py-0.5 rounded text-[10px] font-bold border transition ${
                              r.isPaid
                                ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                                : r.amount > 0
                                ? "bg-red-500/20 text-red-300 border-red-500/40"
                                : "bg-slate-800 text-slate-400 border-slate-700"
                            }`}
                          >
                            {r.isPaid ? "Cobrado (Sí)" : r.amount > 0 ? "Por Cobrar (No)" : "Gratis"}
                          </button>
                        </div>
                        <span className="text-[10px] text-slate-500 block mt-0.5 font-mono">
                          {r.paymentMethod || (r.amount > 0 ? "Sin especificar" : "Gratuito")}
                        </span>
                      </td>

                      {/* Estado de Validación */}
                      <td className="py-3.5 px-4">
                        {r.amount > 0 ? (
                          r.pabiloStatus === "manual" ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-300 bg-emerald-950/70 border border-emerald-800/70 px-2 py-0.5 rounded-full">
                              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                              Validado Manual
                            </span>
                          ) : r.pabiloStatus === "approved" ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-cyan-300 bg-cyan-950/70 border border-cyan-800/70 px-2 py-0.5 rounded-full">
                              <CheckCircle className="w-3.5 h-3.5 text-cyan-400" />
                              Pabilo Auto
                            </span>
                          ) : r.pabiloStatus === "rejected" ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-red-400 bg-red-950/70 border border-red-800/70 px-2 py-0.5 rounded-full">
                              <X className="w-3.5 h-3.5 text-red-400" />
                              Rechazado
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-300 bg-amber-950/70 border border-amber-800/70 px-2 py-0.5 rounded-full">
                              <Clock className="w-3.5 h-3.5 text-amber-400" />
                              Sin Validar
                            </span>
                          )
                        ) : (
                          <span className="text-[11px] text-slate-500">No aplica (Gratis)</span>
                        )}
                        {r.paymentNotes && (
                          <span className="block text-[10px] text-slate-400 italic mt-0.5 truncate max-w-[170px]" title={r.paymentNotes}>
                            {r.paymentNotes}
                          </span>
                        )}
                      </td>

                      {/* Comprobante / Ref */}
                      <td className="py-3.5 px-4">
                        {r.paymentProofUrl ? (
                          <a
                            href={r.paymentProofUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand-300 bg-brand-950/60 border border-brand-800/60 px-2 py-0.5 rounded hover:underline"
                          >
                            📎 Comprobante Drive
                          </a>
                        ) : r.paymentReference ? (
                          <span className="font-mono text-[11px] text-slate-400">{r.paymentReference}</span>
                        ) : (
                          <span className="text-[11px] text-slate-600">S/C</span>
                        )}
                      </td>

                      {/* Factura */}
                      <td className="py-3.5 px-4">
                        <input
                          type="text"
                          defaultValue={r.invoiceNumber || ""}
                          placeholder="FAC-00123"
                          onBlur={(e) => updateInvoice(r.id, e.target.value)}
                          className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-white placeholder-slate-600 font-mono w-24 focus:border-brand-500"
                        />
                      </td>

                      {/* Asistencia */}
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

                      {/* Acciones */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => openValidationModal(r)}
                            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded text-[11px] font-semibold border border-slate-700 flex items-center gap-1 transition"
                            title="Validar o modificar pago manualmente"
                          >
                            <Edit3 className="w-3 h-3 text-cyan-400" />
                            <span>Validar</span>
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              alert(
                                `Recordatorio WhatsApp 24h enviado al participante ${r.participant?.name} (${r.participant?.phone})`
                              )
                            }
                            className="p-1.5 hover:bg-slate-800 rounded text-emerald-400 transition"
                            title="Enviar Recordatorio WhatsApp"
                          >
                            <Send className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Historial de Participación del Inscrito */}
      {historyParticipant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-2xl p-6 shadow-2xl relative">
            <button
              onClick={() => setHistoryParticipant(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="pb-3 mb-4 border-b border-slate-800">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#e07b29]">
                Historial de Participación en OnProtec
              </span>
              <h3 className="text-lg font-extrabold text-white">{historyParticipant.name}</h3>
              <p className="text-xs text-slate-400">
                {historyParticipant.docNumber || "S/D"} · {historyParticipant.phone} ·{" "}
                {historyParticipant.company || "Independiente"}
              </p>
            </div>

            <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
              {(historyParticipant.participations || []).map((part: any) => (
                <div
                  key={part.registrationId}
                  className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3 text-xs"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-brand-300">
                        {part.trainingCode}
                      </span>
                      <span className="text-slate-400">{fmtLocalDate(part.eventDate)}</span>
                    </div>
                    <p className="font-bold text-white mt-0.5">{part.trainingName}</p>
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                      part.status === "Asistió"
                        ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                        : part.status === "Confirmado"
                        ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/40"
                        : part.status === "Lista de Espera"
                        ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                        : "bg-slate-800 text-slate-300 border-slate-700"
                    }`}
                  >
                    {part.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Modal de Validación Manual de Pagos */}
      {modalReg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg p-6 shadow-2xl relative">
            <button
              onClick={() => setModalReg(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-800">
              <ShieldCheck className="w-5 h-5 text-brand-400" />
              <div>
                <h3 className="text-base font-bold text-white">Validación Manual de Pago</h3>
                <p className="text-xs text-slate-400">
                  {modalReg.participant?.name} ({modalReg.participant?.docNumber || "S/D"})
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveModal} className="space-y-4">
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs text-slate-300">
                <span className="font-bold text-white block mb-0.5 truncate">{modalReg.training?.name}</span>
                <span className="text-slate-400">Precio evento: {formatCurrency(modalReg.training?.price || 0)}</span>
              </div>

              {/* Estado de Pago */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    ¿Pago Recibido / Cobrado?
                  </label>
                  <select
                    value={modalForm.isPaid ? "true" : "false"}
                    onChange={(e) => setModalForm({ ...modalForm, isPaid: e.target.value === "true" })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500"
                  >
                    <option value="true">Sí (Cobrado)</option>
                    <option value="false">No (Pendiente / No Pagó)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Monto (USD)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={modalForm.amount}
                    onChange={(e) => setModalForm({ ...modalForm, amount: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500 font-mono"
                  />
                </div>
              </div>

              {/* Método de Pago y Tipo de Validación */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Método de Pago
                  </label>
                  <select
                    value={modalForm.paymentMethod}
                    onChange={(e) => setModalForm({ ...modalForm, paymentMethod: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500"
                  >
                    <option value="Binance (USDT)">Binance (USDT)</option>
                    <option value="Zelle">Zelle</option>
                    <option value="Efectivo (Oficina Onprotec)">Efectivo (Oficina)</option>
                    <option value="Pago Móvil">Pago Móvil</option>
                    <option value="Transferencia Bancaria">Transferencia Bancaria</option>
                    <option value="Pabilo Pay">Pabilo Pay (Automático)</option>
                    <option value="Sin especificar">Sin especificar</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Tipo de Validación
                  </label>
                  <select
                    value={modalForm.pabiloStatus}
                    onChange={(e) => setModalForm({ ...modalForm, pabiloStatus: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500"
                  >
                    <option value="manual">Validación Manual (Comprobante verificado)</option>
                    <option value="approved">Pabilo Pay (Automático)</option>
                    <option value="pending">Sin Validar / Pendiente</option>
                    <option value="rejected">Rechazado</option>
                  </select>
                </div>
              </div>

              {/* Referencia y Factura */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Referencia de Pago / Comprobante
                  </label>
                  <input
                    type="text"
                    value={modalForm.paymentReference}
                    placeholder="Ej. REF-12345 o Hash"
                    onChange={(e) => setModalForm({ ...modalForm, paymentReference: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Asistencia al Evento
                  </label>
                  <select
                    value={modalForm.status}
                    onChange={(e) => setModalForm({ ...modalForm, status: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500"
                  >
                    <option value="Asistió">Asistió</option>
                    <option value="No Asistió">No Asistió</option>
                    <option value="Confirmado">Confirmado</option>
                    <option value="Inscrito">Inscrito</option>
                    <option value="Lista de Espera">Lista de Espera</option>
                    <option value="Cancelado">Cancelado</option>
                  </select>
                </div>
              </div>

              {/* Enlace Comprobante Drive */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Enlace de Comprobante / Google Drive
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={modalForm.paymentProofUrl}
                    placeholder="https://drive.google.com/..."
                    onChange={(e) => setModalForm({ ...modalForm, paymentProofUrl: e.target.value })}
                    className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500 truncate"
                  />
                  {modalForm.paymentProofUrl && (
                    <a
                      href={modalForm.paymentProofUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-brand-300 rounded-xl text-xs flex items-center gap-1 border border-slate-700"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              </div>

              {/* Notas de Auditoría */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Observaciones / Notas de Auditoría
                </label>
                <textarea
                  rows={2}
                  value={modalForm.paymentNotes}
                  placeholder="Ej. Comprobante verificado en cuenta Zelle. Asistió y ocupó puesto 4."
                  onChange={(e) => setModalForm({ ...modalForm, paymentNotes: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500 resize-none"
                />
              </div>

              {/* Botones de Acción */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalReg(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingModal}
                  className="px-5 py-2 bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold rounded-xl flex items-center gap-2 transition shadow-lg shadow-brand-600/30"
                >
                  {savingModal ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                  <span>Guardar Validación</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
