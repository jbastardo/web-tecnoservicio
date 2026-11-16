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
  Eye,
  Phone,
  Mail,
  Building,
  Briefcase,
  MapPin,
  HelpCircle,
  Hash,
  Sparkles,
  User,
  Trash2,
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
  // Estado para inspeccionar todos los datos enviados por el inscrito
  const [viewingDetailsReg, setViewingDetailsReg] = useState<any | null>(null);
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

  // Estado para Editar Todos los Datos de un Formulario Registrado
  const [editingReg, setEditingReg] = useState<any | null>(null);
  const [editForm, setEditForm] = useState<any>({
    trainingId: "",
    name: "",
    docType: "V",
    docNumber: "",
    phone: "",
    email: "",
    company: "",
    cargo: "",
    city: "Caracas",
    experienceLevel: "",
    status: "Inscrito",
    isPaid: false,
    amount: 0,
    paymentMethod: "",
    paymentReference: "",
    invoiceNumber: "",
    carnetNumber: "",
    specialNotes: "",
    customAnswers: {},
  });
  const [savingEdit, setSavingEdit] = useState(false);

  // Estado para Confirmar Eliminación de Formulario Registrado
  const [deletingReg, setDeletingReg] = useState<any | null>(null);
  const [isDeletingReg, setIsDeletingReg] = useState(false);

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
        const updatedRecord = data.data;
        setRegistrations((prev) =>
          prev.map((r) => {
            if (r.id === id) return { ...r, ...updatedRecord };
            if (
              updatedRecord.participant &&
              Number(r.participantId) === Number(updatedRecord.participantId)
            ) {
              return { ...r, participant: updatedRecord.participant };
            }
            return r;
          })
        );
        if (viewingDetailsReg && viewingDetailsReg.id === id) {
          setViewingDetailsReg((prev: any) => ({ ...prev, ...updatedRecord }));
        }
        return updatedRecord;
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

  // Abrir Modal de Edición Completa de Formulario Registrado
  const openEditModal = (r: any) => {
    setEditingReg(r);
    setEditForm({
      trainingId: String(r.trainingId || ""),
      name: r.participant?.name || "",
      docType: r.participant?.docType || "V",
      docNumber: r.participant?.docNumber || "",
      phone: r.participant?.phone || "",
      email: r.participant?.email || "",
      company: r.participant?.company || "",
      cargo: r.participant?.cargo || "",
      city: r.participant?.city || "Caracas",
      experienceLevel: r.participant?.experienceLevel || r.experienceLevel || "",
      status: r.status || "Inscrito",
      isPaid: Boolean(r.isPaid),
      amount: Number(r.amount || 0),
      paymentMethod: r.paymentMethod || "",
      paymentReference: r.paymentReference || "",
      invoiceNumber: r.invoiceNumber || "",
      carnetNumber: r.carnetNumber || "",
      specialNotes: r.specialNotes || "",
      customAnswers: { ...(r.customAnswers || {}) },
    });
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingReg) return;
    setSavingEdit(true);

    const updated = await patchRegistration(editingReg.id, {
      ...editForm,
      trainingId: Number(editForm.trainingId) || editingReg.trainingId,
      amount: Number(editForm.amount) || 0,
    });

    setSavingEdit(false);
    if (updated) {
      setEditingReg(null);
      showToast(`Datos del formulario #${editingReg.id} actualizados con éxito.`);
    } else {
      showToast("Error al guardar los cambios del formulario.");
    }
  };

  const handleDeleteRegistration = async () => {
    if (!deletingReg) return;
    setIsDeletingReg(true);
    try {
      const res = await fetch(`/api/inscripciones?id=${deletingReg.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        setRegistrations((prev) => prev.filter((r) => Number(r.id) !== Number(deletingReg.id)));
        if (viewingDetailsReg && Number(viewingDetailsReg.id) === Number(deletingReg.id)) {
          setViewingDetailsReg(null);
        }
        showToast("Formulario registrado eliminado con éxito");
        setDeletingReg(null);
      } else {
        showToast(data.error || "No se pudo eliminar el formulario.");
      }
    } catch (err) {
      console.error("Error al eliminar formulario:", err);
      showToast("Error de red al eliminar el formulario.");
    } finally {
      setIsDeletingReg(false);
    }
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
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-300 dark:border-slate-800">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <ClipboardList className="w-6 h-6 text-[#f4730a]" />
            <span>Matriz de Inscripciones, Pagos & Validación Manual</span>
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 font-medium">
            Gestión y conciliación de {registrations.length} inscripciones reales con validación manual y soporte Pabilo Pay.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Buscar participante, cédula o curso..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-[#f4730a] w-52 shadow-sm"
            />
          </div>

          <select
            value={trainingFilter}
            onChange={(e) => setTrainingFilter(e.target.value)}
            className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-[#f4730a] max-w-[260px] truncate shadow-sm font-medium"
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
            <option value="Cancelado">Cancelado</option>
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
                        <button
                          type="button"
                          onClick={() => setViewingDetailsReg(r)}
                          className="font-bold text-slate-900 dark:text-white hover:text-[#e07b29] text-left block transition cursor-pointer"
                          title="Clic para ver todos los datos de este inscrito"
                        >
                          {r.participant?.name || "Sin Nombre"}
                        </button>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-mono">
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
                        <span className="font-semibold text-slate-800 dark:text-slate-200 block truncate">
                          {r.training?.name || "Capacitación"}
                        </span>
                        <span className="text-[11px] text-slate-500">
                          {fmtLocalDate(r.training?.eventDate)}
                        </span>
                      </td>

                      {/* Monto / Estado de Cobro */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 dark:text-white">
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
                            download={r.paymentProofUrl.startsWith("data:") ? `comprobante-${r.code}.png` : undefined}
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-300 bg-emerald-950/60 border border-emerald-800/60 px-2 py-0.5 rounded hover:underline"
                          >
                            📎 Ver Comprobante
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
                          <option value="Cancelado">Cancelado</option>
                        </select>
                      </td>

                      {/* Acciones */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5 flex-wrap">
                          <button
                            type="button"
                            onClick={() => setViewingDetailsReg(r)}
                            className="px-2 py-1 bg-[#e07b29]/15 hover:bg-[#e07b29]/25 text-[#e07b29] rounded text-[11px] font-bold border border-[#e07b29]/40 flex items-center gap-1 transition cursor-pointer"
                            title="Ver todos los datos enviados por el inscrito y respuestas del formulario"
                          >
                            <Eye className="w-3 h-3 text-[#e07b29]" />
                            <span>Ver</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => openEditModal(r)}
                            className="px-2 py-1 bg-slate-800 hover:bg-[#f4730a] text-amber-300 hover:text-white rounded text-[11px] font-bold border border-slate-700 flex items-center gap-1 transition cursor-pointer"
                            title="Editar todos los datos de este formulario registrado"
                          >
                            <Edit3 className="w-3 h-3" />
                            <span>Editar</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => openValidationModal(r)}
                            className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded text-[11px] font-semibold border border-slate-700 flex items-center gap-1 transition cursor-pointer"
                            title="Validar o modificar pago manualmente"
                          >
                            <ShieldCheck className="w-3 h-3 text-cyan-400" />
                            <span>Validar</span>
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              alert(
                                `Recordatorio WhatsApp 24h enviado al participante ${r.participant?.name} (${r.participant?.phone})`
                              )
                            }
                            className="p-1.5 hover:bg-slate-800 rounded text-emerald-400 transition cursor-pointer"
                            title="Enviar Recordatorio WhatsApp"
                          >
                            <Send className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => setDeletingReg(r)}
                            className="px-2 py-1 bg-red-500/15 hover:bg-red-600 text-red-400 hover:text-white rounded text-[11px] font-bold border border-red-500/40 flex items-center gap-1 transition cursor-pointer"
                            title="Borrar formulario registrado"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Borrar</span>
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

      {/* Modal Ficha Completa: Datos del Inscrito & Respuestas del Formulario */}
      {viewingDetailsReg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-4xl p-6 sm:p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setViewingDetailsReg(null)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition"
              title="Cerrar Ficha"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Cabecera de la Ficha */}
            <div className="flex flex-wrap items-start justify-between gap-4 pb-5 mb-6 border-b border-slate-800">
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-1.5">
                  <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-[#e07b29] text-white">
                    FICHA DETALLADA DEL INSCRITO
                  </span>
                  <span className="text-xs font-mono font-bold text-cyan-300 bg-slate-950 px-2.5 py-0.5 rounded-lg border border-slate-800">
                    ID: #{viewingDetailsReg.id}
                  </span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                      viewingDetailsReg.status === "Asistió"
                        ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                        : viewingDetailsReg.status === "Confirmado"
                        ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/40"
                        : viewingDetailsReg.status === "Lista de Espera"
                        ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                        : "bg-slate-800 text-slate-300 border-slate-700"
                    }`}
                  >
                    {viewingDetailsReg.status}
                  </span>
                </div>
                <h2 className="text-2xl font-black text-white">
                  {viewingDetailsReg.participant?.name || "Sin Nombre"}
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Capacitación:{" "}
                  <strong className="text-white">
                    {viewingDetailsReg.training?.code} — {viewingDetailsReg.training?.name}
                  </strong>{" "}
                  ({fmtLocalDate(viewingDetailsReg.training?.eventDate)})
                </p>
              </div>

              <div className="flex items-center gap-2">
                {viewingDetailsReg.participant?.phone && (
                  <a
                    href={`https://wa.me/${viewingDetailsReg.participant.phone.replace(/\D/g, "")}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold shadow-sm transition"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>WhatsApp</span>
                  </a>
                )}
              </div>
            </div>

            {/* Grid 2 Columnas Widescreen */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Columna Izquierda: Datos Personales & Empresa */}
              <div className="lg:col-span-6 space-y-4">
                <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-3.5">
                  <h3 className="text-xs font-black uppercase tracking-wider text-[#e07b29] flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Datos Personales & Contacto
                  </h3>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-[10px] font-bold uppercase text-slate-500 block">
                        Cédula / Documento
                      </span>
                      <span className="font-mono font-bold text-white text-sm">
                        {viewingDetailsReg.participant?.docType || "V"}-
                        {viewingDetailsReg.participant?.docNumber || "S/D"}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold uppercase text-slate-500 block">
                        Teléfono / WhatsApp
                      </span>
                      <span className="font-mono font-bold text-cyan-300 text-sm">
                        {viewingDetailsReg.participant?.phone || "No registrado"}
                      </span>
                    </div>

                    <div className="col-span-2">
                      <span className="text-[10px] font-bold uppercase text-slate-500 block">
                        Correo Electrónico
                      </span>
                      <a
                        href={`mailto:${viewingDetailsReg.participant?.email}`}
                        className="font-medium text-slate-200 hover:text-[#e07b29] transition block truncate"
                      >
                        {viewingDetailsReg.participant?.email || "No registrado"}
                      </a>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold uppercase text-slate-500 block">
                        Ciudad / Región
                      </span>
                      <span className="font-bold text-white">
                        {viewingDetailsReg.participant?.city || "Caracas"}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold uppercase text-slate-500 block">
                        Nº de Carnet Físico
                      </span>
                      <input
                        type="text"
                        defaultValue={viewingDetailsReg.carnetNumber || ""}
                        placeholder="Ej. 09"
                        onBlur={async (e) => {
                          const val = e.target.value.trim();
                          await patchRegistration(viewingDetailsReg.id, { carnetNumber: val });
                          setViewingDetailsReg((prev: any) => ({ ...prev, carnetNumber: val }));
                          showToast("Nº de Carnet físico guardado");
                        }}
                        className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white font-mono w-24 focus:border-[#e07b29] outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-3.5">
                  <h3 className="text-xs font-black uppercase tracking-wider text-cyan-400 flex items-center gap-2">
                    <Building className="w-4 h-4" />
                    Empresa & Perfil Técnico
                  </h3>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-[10px] font-bold uppercase text-slate-500 block">
                        Empresa / Integrador
                      </span>
                      <span className="font-bold text-white text-sm">
                        {viewingDetailsReg.participant?.company || "Independiente"}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold uppercase text-slate-500 block">
                        Cargo / Rol
                      </span>
                      <span className="font-bold text-slate-200">
                        {viewingDetailsReg.participant?.cargo || "Técnico / Instalador"}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold uppercase text-slate-500 block">
                        Nivel de Experiencia
                      </span>
                      <span className="font-semibold text-slate-300">
                        {viewingDetailsReg.participant?.experienceLevel ||
                          viewingDetailsReg.experienceLevel ||
                          "No especificado"}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold uppercase text-slate-500 block">
                        ¿Cómo se enteró?
                      </span>
                      <span className="font-semibold text-slate-300">
                        {viewingDetailsReg.participant?.referralSource || "Redes / Web OnProtec"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Columna Derecha: Respuestas a Preguntas del Formulario + Pago */}
              <div className="lg:col-span-6 space-y-4">
                {/* Preguntas Personalizadas del Formulario */}
                <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-black uppercase tracking-wider text-emerald-400 flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      Respuestas al Formulario de Inscripción
                    </h3>
                    <span className="text-[10px] font-mono text-slate-500">
                      {Object.keys(viewingDetailsReg.customAnswers || {}).length} respuestas
                    </span>
                  </div>

                  {viewingDetailsReg.customAnswers &&
                  Object.keys(viewingDetailsReg.customAnswers).length > 0 ? (
                    <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                      {Object.entries(viewingDetailsReg.customAnswers).map(
                        ([questionKey, answer]: [string, any], idx) => {
                          // Intentar emparejar con el label de formQuestions de la capacitación
                          const formQ = (
                            viewingDetailsReg.training?.formQuestions || []
                          ).find((fq: any) => fq.id === questionKey);
                          const questionLabel = formQ?.label || questionKey;

                          return (
                            <div
                              key={idx}
                              className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs"
                            >
                              <span className="text-[10px] font-bold uppercase text-[#e07b29] block mb-0.5">
                                {questionLabel}
                              </span>
                              <span className="font-bold text-white leading-relaxed block">
                                {typeof answer === "boolean"
                                  ? answer
                                    ? "Sí"
                                    : "No"
                                  : String(answer || "Sin respuesta")}
                              </span>
                            </div>
                          );
                        }
                      )}
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-center text-xs text-slate-500">
                      Formulario base completado (sin preguntas dinámicas adicionales registradas).
                    </div>
                  )}

                  {viewingDetailsReg.specialNotes && (
                    <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200">
                      <span className="text-[10px] font-black uppercase tracking-wider block text-amber-400 mb-0.5">
                        Nota Especial / Expectativas
                      </span>
                      {viewingDetailsReg.specialNotes}
                    </div>
                  )}
                </div>

                {/* Resumen de Pago & Facturación */}
                <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-black uppercase tracking-wider text-cyan-400 flex items-center gap-2">
                      <CreditCard className="w-4 h-4" />
                      Inversión & Validación de Pago
                    </h3>
                    <span
                      className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                        viewingDetailsReg.isPaid
                          ? "bg-emerald-500/20 text-emerald-300"
                          : "bg-red-500/20 text-red-300"
                      }`}
                    >
                      {viewingDetailsReg.isPaid ? "PAGO VALIDADO" : "PENDIENTE / POR COBRAR"}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-[10px] font-bold uppercase text-slate-500 block">
                        Monto de Inscripción
                      </span>
                      <span className="font-black text-white text-base">
                        {formatCurrency(viewingDetailsReg.amount, viewingDetailsReg.currency)}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold uppercase text-slate-500 block">
                        Método de Pago
                      </span>
                      <span className="font-bold text-slate-200">
                        {viewingDetailsReg.paymentMethod || "No especificado"}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold uppercase text-slate-500 block">
                        Referencia
                      </span>
                      <span className="font-mono font-bold text-cyan-300">
                        {viewingDetailsReg.paymentReference || "S/R"}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold uppercase text-slate-500 block">
                        Factura / Nota
                      </span>
                      <span className="font-mono font-bold text-slate-300">
                        {viewingDetailsReg.invoiceNumber || "Sin facturar"}
                      </span>
                    </div>

                    {viewingDetailsReg.paymentProofUrl && (
                      <div className="col-span-2 p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold uppercase text-slate-400">
                            Comprobante de Pago Adjunto
                          </span>
                          <a
                            href={viewingDetailsReg.paymentProofUrl}
                            target="_blank"
                            rel="noreferrer"
                            download={viewingDetailsReg.paymentProofUrl.startsWith("data:") ? `comprobante-${viewingDetailsReg.code}.png` : undefined}
                            className="inline-flex items-center gap-1.5 text-xs font-bold text-cyan-400 hover:underline"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            <span>Abrir / Descargar</span>
                          </a>
                        </div>
                        {viewingDetailsReg.paymentProofUrl.startsWith("data:image/") ? (
                          <div className="relative group max-w-xs rounded-lg overflow-hidden border border-slate-700 bg-black/40">
                            <img
                              src={viewingDetailsReg.paymentProofUrl}
                              alt="Comprobante de pago"
                              className="max-h-48 w-auto object-contain mx-auto"
                            />
                          </div>
                        ) : (
                          <div className="p-2 rounded bg-slate-900 text-xs text-slate-300 flex items-center gap-2">
                            <FileText className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                            <span className="truncate">{viewingDetailsReg.paymentProofUrl.slice(0, 60)}...</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Pie de la Ficha con Acciones Rápidas */}
            <div className="mt-6 pt-5 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => {
                  setHistoryParticipant(viewingDetailsReg.participant);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white transition cursor-pointer"
              >
                <span>
                  📚 Ver Historial de otros cursos (
                  {viewingDetailsReg.participant?.participations?.length || 1})
                </span>
              </button>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    openEditModal(viewingDetailsReg);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-[#f4730a] hover:bg-[#ef7922] text-white text-xs font-extrabold shadow-sm transition cursor-pointer inline-flex items-center gap-1.5"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Editar Datos</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    openValidationModal(viewingDetailsReg);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-extrabold shadow-sm transition cursor-pointer"
                >
                  Editar Estado / Validar Pago
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDeletingReg(viewingDetailsReg);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-extrabold shadow-sm transition cursor-pointer inline-flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Borrar</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewingDetailsReg(null)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition cursor-pointer"
                >
                  Cerrar
                </button>
              </div>
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

      {/* Modal de Edición Completa del Formulario Registrado */}
      {editingReg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-3xl p-6 sm:p-7 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setEditingReg(null)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-slate-800 transition"
              title="Cerrar"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 pb-4 mb-5 border-b border-slate-800">
              <div className="w-10 h-10 rounded-xl bg-[#f4730a]/15 text-[#f4730a] flex items-center justify-center">
                <Edit3 className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-[#f4730a]">
                  EDICIÓN COMPLETA DE FORMULARIO REGISTRADO #{editingReg.id}
                </span>
                <h3 className="text-lg font-black text-white">
                  {editingReg.participant?.name || "Sin Nombre"}
                </h3>
              </div>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-5">
              {/* Sección A: Capacitación y Estado */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-cyan-400">
                  1. Capacitación & Control de Asistencia
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">
                      Capacitación Asignada
                    </label>
                    <select
                      value={editForm.trainingId}
                      onChange={(e) => setEditForm({ ...editForm, trainingId: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#f4730a]"
                    >
                      {trainings.map((t) => (
                        <option key={t.id} value={String(t.id)}>
                          {t.code} • {t.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 mb-1">
                        Estado
                      </label>
                      <select
                        value={editForm.status}
                        onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-2 text-xs text-white focus:outline-none focus:border-[#f4730a]"
                      >
                        <option value="Inscrito">Inscrito</option>
                        <option value="Confirmado">Confirmado</option>
                        <option value="Asistió">Asistió</option>
                        <option value="No Asistió">No Asistió</option>
                        <option value="Lista de Espera">Lista de Espera</option>
                        <option value="Cancelado">Cancelado</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 mb-1">
                        Nº Carnet
                      </label>
                      <input
                        type="text"
                        value={editForm.carnetNumber}
                        onChange={(e) => setEditForm({ ...editForm, carnetNumber: e.target.value })}
                        placeholder="Ej. 09"
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-2 text-xs text-white font-mono focus:outline-none focus:border-[#f4730a]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 mb-1">
                        Nº Factura
                      </label>
                      <input
                        type="text"
                        value={editForm.invoiceNumber}
                        onChange={(e) => setEditForm({ ...editForm, invoiceNumber: e.target.value })}
                        placeholder="FAC-001"
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-2 text-xs text-white font-mono focus:outline-none focus:border-[#f4730a]"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Sección B: Datos Personales */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-[#f4730a]">
                  2. Datos del Participante
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">
                      Nombre y Apellido *
                    </label>
                    <input
                      type="text"
                      required
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#f4730a]"
                    />
                  </div>

                  <div className="grid grid-cols-12 gap-2">
                    <div className="col-span-4">
                      <label className="block text-[11px] font-bold text-slate-300 mb-1">Tipo</label>
                      <select
                        value={editForm.docType}
                        onChange={(e) => setEditForm({ ...editForm, docType: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2 py-2 text-xs text-white focus:outline-none focus:border-[#f4730a]"
                      >
                        <option value="V">V-</option>
                        <option value="E">E-</option>
                        <option value="J">J-</option>
                        <option value="P">P-</option>
                      </select>
                    </div>
                    <div className="col-span-8">
                      <label className="block text-[11px] font-bold text-slate-300 mb-1">
                        Cédula / RIF *
                      </label>
                      <input
                        type="text"
                        required
                        value={editForm.docNumber}
                        onChange={(e) => setEditForm({ ...editForm, docNumber: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-[#f4730a]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">
                      Teléfono / WhatsApp *
                    </label>
                    <input
                      type="text"
                      required
                      value={editForm.phone}
                      onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-[#f4730a]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">
                      Correo Electrónico *
                    </label>
                    <input
                      type="email"
                      required
                      value={editForm.email}
                      onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#f4730a]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">
                      Empresa / Emprendimiento
                    </label>
                    <input
                      type="text"
                      value={editForm.company}
                      onChange={(e) => setEditForm({ ...editForm, company: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#f4730a]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 mb-1">
                        Cargo / Rol
                      </label>
                      <input
                        type="text"
                        value={editForm.cargo}
                        onChange={(e) => setEditForm({ ...editForm, cargo: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#f4730a]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 mb-1">
                        Ciudad
                      </label>
                      <input
                        type="text"
                        value={editForm.city}
                        onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#f4730a]"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Sección C: Respuestas Dinámicas y Cobro */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-emerald-400">
                  3. Respuestas del Formulario & Pago
                </h4>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">
                      ¿Cobrado?
                    </label>
                    <select
                      value={editForm.isPaid ? "true" : "false"}
                      onChange={(e) => setEditForm({ ...editForm, isPaid: e.target.value === "true" })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-2 text-xs text-white focus:outline-none focus:border-[#f4730a]"
                    >
                      <option value="true">Sí (Cobrado)</option>
                      <option value="false">No (Pendiente)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">
                      Monto ($)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={editForm.amount}
                      onChange={(e) =>
                        setEditForm({ ...editForm, amount: parseFloat(e.target.value) || 0 })
                      }
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-2 text-xs text-white font-mono focus:outline-none focus:border-[#f4730a]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">
                      Método de Pago
                    </label>
                    <input
                      type="text"
                      value={editForm.paymentMethod}
                      onChange={(e) => setEditForm({ ...editForm, paymentMethod: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-2 text-xs text-white focus:outline-none focus:border-[#f4730a]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">
                      Referencia
                    </label>
                    <input
                      type="text"
                      value={editForm.paymentReference}
                      onChange={(e) =>
                        setEditForm({ ...editForm, paymentReference: e.target.value })
                      }
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-2 text-xs text-white font-mono focus:outline-none focus:border-[#f4730a]"
                    />
                  </div>
                </div>

                {/* Preguntas Dinámicas de customAnswers */}
                {(() => {
                  const targetCourse =
                    trainings.find((t) => Number(t.id) === Number(editForm.trainingId)) ||
                    editingReg.training;
                  const formQuestions = Array.isArray(targetCourse?.formQuestions)
                    ? targetCourse.formQuestions
                    : [];
                  const questionMap = new Map<string, any>();
                  formQuestions.forEach((fq: any) => questionMap.set(fq.id, fq));
                  Object.keys(editForm.customAnswers || {}).forEach((k) => {
                    if (!questionMap.has(k)) {
                      questionMap.set(k, { id: k, label: k, type: "text" });
                    }
                  });
                  const fields = Array.from(questionMap.values());
                  if (fields.length === 0) return null;

                  return (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-slate-800">
                      {fields.map((fq: any) => {
                        const rawVal = editForm.customAnswers?.[fq.id] ?? "";
                        const isBase64File =
                          typeof rawVal === "string" && rawVal.startsWith("data:");
                        return (
                          <div key={fq.id}>
                            <label className="block text-[11px] font-bold text-slate-300 mb-1">
                              {fq.label}
                            </label>
                            {isBase64File ? (
                              <span className="text-[11px] text-emerald-400 font-mono block py-1.5">
                                Archivo adjunto en base64 (conservado)
                              </span>
                            ) : fq.type === "select" && Array.isArray(fq.options) ? (
                              <select
                                value={String(rawVal)}
                                onChange={(e) =>
                                  setEditForm((prev: any) => ({
                                    ...prev,
                                    customAnswers: {
                                      ...prev.customAnswers,
                                      [fq.id]: e.target.value,
                                    },
                                  }))
                                }
                                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#f4730a]"
                              >
                                <option value="">Seleccionar...</option>
                                {fq.options.map((opt: string, idx: number) => (
                                  <option key={idx} value={opt}>
                                    {opt}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <input
                                type="text"
                                value={String(rawVal)}
                                onChange={(e) =>
                                  setEditForm((prev: any) => ({
                                    ...prev,
                                    customAnswers: {
                                      ...prev.customAnswers,
                                      [fq.id]: e.target.value,
                                    },
                                  }))
                                }
                                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#f4730a]"
                              />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    Notas Especiales / Expectativas
                  </label>
                  <textarea
                    rows={2}
                    value={editForm.specialNotes}
                    onChange={(e) => setEditForm({ ...editForm, specialNotes: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#f4730a] resize-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingReg(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="px-5 py-2.5 bg-[#f4730a] hover:bg-[#ef7922] text-white text-xs font-black rounded-xl flex items-center gap-2 transition shadow-lg cursor-pointer"
                >
                  {savingEdit ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                  <span>Guardar Cambios</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Confirmación de Eliminación de Formulario Registrado */}
      {deletingReg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border-2 border-red-500/40 rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-red-500/15 text-red-400 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-white">
                  ¿Eliminar Formulario Registrado?
                </h3>
                <p className="text-xs text-slate-400">Registro #{deletingReg.id}</p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs space-y-1">
              <p className="font-bold text-white">{deletingReg.participant?.name || "Sin Nombre"}</p>
              <p className="font-mono text-slate-400">
                {deletingReg.participant?.docType || "V"}-{deletingReg.participant?.docNumber || "S/D"}
              </p>
              <p className="text-cyan-300 font-semibold truncate">
                {deletingReg.training?.code} • {deletingReg.training?.name}
              </p>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Esta acción eliminará permanentemente este registro del evento y liberará el cupo correspondiente. Si el participante no tiene otros cursos registrados, también se depurará su ficha para permitirle inscribirse nuevamente.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setDeletingReg(null)}
                disabled={isDeletingReg}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDeleteRegistration}
                disabled={isDeletingReg}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-black rounded-xl flex items-center gap-1.5 transition shadow-lg cursor-pointer"
              >
                {isDeletingReg ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Trash2 className="w-3.5 h-3.5" />
                )}
                <span>Sí, Borrar Registro</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
