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
  Calendar,
  Download,
  Printer,
  BarChart3,
} from "lucide-react";
import {
  fmtLocalDate,
  fmtLocalTime,
  fmtLocalHour,
  formatCurrency,
  buildParticipantWhatsAppUrl,
  ONPROTEC_WHATSAPP_DISPLAY,
} from "@/utils/formatUtils";
import {
  evaluateParticipantPriority,
  matchesPriorityFilter,
  PriorityFilter,
} from "@/utils/attendancePriority";

function toCaracasYMD(dateInput?: string | number | Date | null): string {
  if (!dateInput) return "";
  const date =
    typeof dateInput === "string" || typeof dateInput === "number"
      ? new Date(dateInput)
      : dateInput;
  if (isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Caracas",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function getCaracasDateShift(daysOffset: number): string {
  const todayStr = toCaracasYMD(new Date());
  const [y, m, d] = todayStr.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + daysOffset, 12, 0, 0));
  return dt.toISOString().slice(0, 10);
}

function escapeHtml(val: unknown): string {
  return String(val ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function csvCell(val: unknown): string {
  const str = String(val ?? "").replace(/"/g, '""');
  return `"${str}"`;
}

export default function InscripcionesAdminPage() {
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [trainingFilter, setTrainingFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>("all");
  const [sortByPriority, setSortByPriority] = useState(false);
  const [dateField, setDateField] = useState<"registration" | "event">("registration");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportScope, setReportScope] = useState<"filtered" | "all">("filtered");
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

  // Estado para Papelera de Reciclaje (Soft-Delete) y Bitácora de Auditoría
  const [deletedCount, setDeletedCount] = useState(0);
  const [showTrashModal, setShowTrashModal] = useState(false);
  const [deletedRegs, setDeletedRegs] = useState<any[]>([]);
  const [loadingTrash, setLoadingTrash] = useState(false);
  const [restoringId, setRestoringId] = useState<number | null>(null);
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [auditBackups, setAuditBackups] = useState<{ daily: string[]; preDelete: string[]; rolling: string[] }>({
    daily: [],
    preDelete: [],
    rolling: [],
  });
  const [loadingAudit, setLoadingAudit] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 4500);
  };

  const getRegistrationWhatsAppUrl = (r: any) => {
    const pName = r.participant?.name || "Participante";
    const tName = r.training?.name || "Capacitación OnProtec";
    const tCode = r.training?.code ? ` (${r.training.code})` : "";
    const tDate = r.training?.eventDate ? fmtLocalDate(r.training.eventDate) : "";
    const tHour = r.training?.eventDate ? fmtLocalHour(r.training.eventDate) : "";
    const msg = `Hola ${pName}, te escribimos del equipo de OnProtec (${ONPROTEC_WHATSAPP_DISPLAY}) respecto a tu inscripción en la capacitación "${tName}"${tCode}${tDate ? ` programada para el ${tDate}` : ""}${tHour ? ` a las ${tHour} (hora Caracas)` : ""} en nuestra Sede Corporativa en Caracas. Por favor confírmanos tu asistencia por esta vía. ¡Te esperamos!`;
    return buildParticipantWhatsAppUrl(r.participant?.phone, msg);
  };

  const fetchRegistrations = () => {
    setLoading(true);
    fetch("/api/inscripciones")
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          setRegistrations(d.data);
          setDeletedCount(Number(d.deletedCount) || 0);
        }
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

  const openTrashModal = async () => {
    setShowTrashModal(true);
    setLoadingTrash(true);
    try {
      const res = await fetch("/api/inscripciones?onlyDeleted=true");
      const data = await res.json();
      if (data.success) {
        setDeletedRegs(data.data || []);
        setDeletedCount(Number(data.deletedCount) || (data.data || []).length);
      } else {
        showToast(data.error || "No se pudo cargar la Papelera.");
      }
    } catch {
      showToast("Error de red al cargar la Papelera.");
    } finally {
      setLoadingTrash(false);
    }
  };

  const handleRestoreRegistration = async (regId: number) => {
    setRestoringId(regId);
    try {
      const res = await fetch("/api/inscripciones", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: regId, action: "restore" }),
      });
      const data = await res.json();
      if (data.success) {
        setDeletedRegs((prev) => prev.filter((r) => Number(r.id) !== Number(regId)));
        setDeletedCount((c) => Math.max(0, c - 1));
        if (data.data) {
          setRegistrations((prev) => [data.data, ...prev]);
        }
        showToast(data.message || "Formulario restaurado con éxito.");
      } else {
        showToast(data.error || "No se pudo restaurar el formulario.");
      }
    } catch {
      showToast("Error de red al restaurar el formulario.");
    } finally {
      setRestoringId(null);
    }
  };

  const handlePermanentDelete = async (regId: number, participantName: string) => {
    if (
      typeof window !== "undefined" &&
      !window.confirm(
        `¿Eliminar DEFINITIVAMENTE la inscripción #${regId} (${participantName}) de la Papelera? Esta acción solo la puede ejecutar un Super Admin.`
      )
    ) {
      return;
    }
    setRestoringId(regId);
    try {
      const res = await fetch(`/api/inscripciones?id=${regId}&permanent=true`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        setDeletedRegs((prev) => prev.filter((r) => Number(r.id) !== Number(regId)));
        setDeletedCount((c) => Math.max(0, c - 1));
        showToast(data.message || "Formulario eliminado definitivamente.");
      } else {
        showToast(data.error || "No se pudo eliminar definitivamente.");
      }
    } catch {
      showToast("Error de red al eliminar definitivamente.");
    } finally {
      setRestoringId(null);
    }
  };

  const openAuditModal = async () => {
    setShowAuditModal(true);
    setLoadingAudit(true);
    try {
      const res = await fetch("/api/admin/audit");
      const data = await res.json();
      if (data.success) {
        setAuditLogs(data.data || []);
        if (data.backups) setAuditBackups(data.backups);
      } else {
        showToast(data.error || "No se pudo cargar la bitácora.");
      }
    } catch {
      showToast("Error de red al cargar la bitácora.");
    } finally {
      setLoadingAudit(false);
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const tid = params.get("trainingId");
      if (tid) {
        setTrainingFilter(tid);
      }
    }
    fetchRegistrations();
  }, []);

  useEffect(() => {
    if (
      !deletingReg &&
      !editingReg &&
      !modalReg &&
      !historyParticipant &&
      !viewingDetailsReg &&
      !showReportModal
    ) {
      return;
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (deletingReg && !isDeletingReg) setDeletingReg(null);
      else if (editingReg) setEditingReg(null);
      else if (modalReg) setModalReg(null);
      else if (historyParticipant) setHistoryParticipant(null);
      else if (viewingDetailsReg) setViewingDetailsReg(null);
      else if (showReportModal) setShowReportModal(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [
    deletingReg,
    isDeletingReg,
    editingReg,
    modalReg,
    historyParticipant,
    viewingDetailsReg,
    showReportModal,
  ]);

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
        setDeletedCount((c) => c + 1);
        if (viewingDetailsReg && Number(viewingDetailsReg.id) === Number(deletingReg.id)) {
          setViewingDetailsReg(null);
        }
        showToast(
          data.message || "Formulario enviado a la Papelera de Reciclaje (recuperable)."
        );
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

  const filteredRaw = registrations.filter((r) => {
    const pName = r.participant?.name?.toLowerCase() || "";
    const pDoc = (r.participant?.docNumber || "").toLowerCase();
    const tName = r.training?.name?.toLowerCase() || "";
    const matchesSearch =
      pName.includes(search.toLowerCase()) ||
      pDoc.includes(search.toLowerCase()) ||
      tName.includes(search.toLowerCase());

    const matchesStatus = statusFilter === "all" || r.status === statusFilter;
    const matchesTraining = trainingFilter === "all" || String(r.trainingId) === trainingFilter;

    const priority = evaluateParticipantPriority(r.participant, r.id);
    const matchesPriority = matchesPriorityFilter(priority, priorityFilter);

    let matchesDate = true;
    if (dateFrom || dateTo) {
      const rawDate =
        dateField === "registration"
          ? r.formSubmittedAt || r.createdAt || r.training?.eventDate
          : r.training?.eventDate || r.createdAt;
      const ymd = toCaracasYMD(rawDate);
      if (!ymd) {
        matchesDate = false;
      } else {
        if (dateFrom && ymd < dateFrom) matchesDate = false;
        if (dateTo && ymd > dateTo) matchesDate = false;
      }
    }

    return matchesSearch && matchesStatus && matchesTraining && matchesPriority && matchesDate;
  });

  const filtered = sortByPriority
    ? [...filteredRaw].sort((a, b) => {
        const pa = evaluateParticipantPriority(a.participant, a.id);
        const pb = evaluateParticipantPriority(b.participant, b.id);
        if (pa.priorityRank !== pb.priorityRank) return pa.priorityRank - pb.priorityRank;
        return Number(b.id) - Number(a.id);
      })
    : filteredRaw;

  const hasActiveFilters = Boolean(
    search ||
      statusFilter !== "all" ||
      trainingFilter !== "all" ||
      priorityFilter !== "all" ||
      dateFrom ||
      dateTo
  );

  const clearAllFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setTrainingFilter("all");
    setPriorityFilter("all");
    setSortByPriority(false);
    setDateFrom("");
    setDateTo("");
  };

  const reportRows = reportScope === "filtered" ? filtered : registrations;

  const reportStats = React.useMemo(() => {
    const total = reportRows.length;
    const confirmedCount = reportRows.filter((r) => r.status === "Confirmado").length;
    const attendedCount = reportRows.filter((r) => r.status === "Asistió").length;
    const inscritoCount = reportRows.filter((r) => r.status === "Inscrito").length;
    const waitlistCount = reportRows.filter((r) => r.status === "Lista de Espera").length;
    const noShowCount = reportRows.filter((r) => r.status === "No Asistió").length;
    const canceledCount = reportRows.filter((r) => r.status === "Cancelado").length;

    const collectedUsd = reportRows
      .filter((r) => r.isPaid)
      .reduce((acc, r) => acc + (Number(r.amount) || 0), 0);
    const pendingUsd = reportRows
      .filter((r) => !r.isPaid && r.status !== "Cancelado" && Number(r.amount) > 0)
      .reduce((acc, r) => acc + (Number(r.amount) || 0), 0);

    const pabiloApprovedCount = reportRows.filter(
      (r) => r.isPaid && r.pabiloStatus === "approved"
    ).length;
    const manualApprovedCount = reportRows.filter(
      (r) => r.isPaid && r.pabiloStatus === "manual"
    ).length;

    const byCourseMap = new Map<
      number,
      {
        trainingId: number;
        code: string;
        name: string;
        eventDate: string;
        total: number;
        confirmedOrAttended: number;
        paidCount: number;
        collectedUsd: number;
      }
    >();

    for (const r of reportRows) {
      const tid = Number(r.trainingId) || 0;
      const existing = byCourseMap.get(tid) || {
        trainingId: tid,
        code: r.training?.code || `CAP-${tid}`,
        name: r.training?.name || r.originalFormName || "Capacitación",
        eventDate: r.training?.eventDate || "",
        total: 0,
        confirmedOrAttended: 0,
        paidCount: 0,
        collectedUsd: 0,
      };
      existing.total += 1;
      if (r.status === "Confirmado" || r.status === "Asistió") {
        existing.confirmedOrAttended += 1;
      }
      if (r.isPaid) {
        existing.paidCount += 1;
        existing.collectedUsd += Number(r.amount) || 0;
      }
      byCourseMap.set(tid, existing);
    }

    const courseBreakdown = Array.from(byCourseMap.values()).sort(
      (a, b) => b.total - a.total
    );

    return {
      total,
      confirmedCount,
      attendedCount,
      inscritoCount,
      waitlistCount,
      noShowCount,
      canceledCount,
      collectedUsd,
      pendingUsd,
      pabiloApprovedCount,
      manualApprovedCount,
      courseBreakdown,
    };
  }, [reportRows]);

  const handleExportCsv = () => {
    const headers = [
      "ID",
      "Fecha Inscripcion (Caracas)",
      "Codigo Curso",
      "Capacitacion",
      "Fecha Evento",
      "Participante",
      "Tipo Doc",
      "Cedula/RIF",
      "Telefono",
      "Correo",
      "Empresa",
      "Cargo",
      "Ciudad",
      "Estado",
      "Pagado",
      "Monto USD",
      "Metodo Pago",
      "Tipo Validacion",
      "Referencia Pago",
      "ID Transaccion Pabilo",
      "Nro Factura",
      "Check-In",
    ];

    const lines = [headers.map(csvCell).join(",")];
    for (const r of reportRows) {
      const row = [
        r.id,
        fmtLocalTime(r.formSubmittedAt || r.createdAt),
        r.training?.code || `CAP-${r.trainingId}`,
        r.training?.name || r.originalFormName || "",
        r.training?.eventDate ? fmtLocalDate(r.training.eventDate) : "N/D",
        r.participant?.name || "",
        r.participant?.docType || "",
        r.participant?.docNumber || "",
        r.participant?.phone || "",
        r.participant?.email || "",
        r.participant?.company || "",
        r.participant?.cargo || r.customAnswers?.cargo || "",
        r.participant?.city || "",
        r.status || "",
        r.isPaid ? "Sí" : Number(r.amount) > 0 ? "No" : "Gratis",
        Number(r.amount || 0).toFixed(2),
        r.paymentMethod || (Number(r.amount) > 0 ? "Sin especificar" : "Gratuito"),
        r.pabiloStatus === "approved"
          ? "Pabilo Auto"
          : r.pabiloStatus === "manual"
          ? "Manual"
          : r.pabiloStatus || "pending",
        r.paymentReference || "",
        r.pabiloTransactionId || "",
        r.invoiceNumber || "",
        r.checkInAt ? fmtLocalTime(r.checkInAt) : "",
      ];
      lines.push(row.map(csvCell).join(","));
    }

    const csvContent = "\uFEFF" + lines.join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `reporte-inscripciones-onprotec-${toCaracasYMD(new Date())}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast(`Reporte CSV exportado (${reportRows.length} registros).`);
  };

  const handlePrintReport = () => {
    const printWin = window.open("", "_blank", "width=1100,height=800");
    if (!printWin) {
      showToast("Por favor permite ventanas emergentes para imprimir el reporte PDF.");
      return;
    }

    const filterSummary =
      reportScope === "all"
        ? "Total Histórico Completo"
        : [
            dateFrom || dateTo
              ? `${dateField === "registration" ? "Fecha Inscripción" : "Fecha Evento"}: ${dateFrom || "..."} a ${dateTo || "..."}`
              : "Todas las fechas",
            trainingFilter !== "all"
              ? `Curso: ${trainings.find((t) => String(t.id) === trainingFilter)?.code || trainingFilter}`
              : "Todos los cursos",
            statusFilter !== "all" ? `Estado: ${statusFilter}` : "Todos los estados",
          ].join(" • ");

    const courseRowsHtml = reportStats.courseBreakdown
      .map(
        (c) => `
        <tr>
          <td><strong>${escapeHtml(c.code)}</strong> — ${escapeHtml(c.name)}</td>
          <td>${c.eventDate ? escapeHtml(fmtLocalDate(c.eventDate)) : "N/D"}</td>
          <td style="text-align:center">${c.total}</td>
          <td style="text-align:center">${c.confirmedOrAttended}</td>
          <td style="text-align:center">${c.paidCount}</td>
          <td style="text-align:right"><strong>$${c.collectedUsd.toFixed(2)}</strong></td>
        </tr>`
      )
      .join("");

    const detailRowsHtml = reportRows
      .map(
        (r) => `
        <tr>
          <td>#${escapeHtml(r.id)}</td>
          <td>${escapeHtml(fmtLocalDate(r.formSubmittedAt || r.createdAt))}</td>
          <td><strong>${escapeHtml(r.participant?.name || "Sin Nombre")}</strong><br/><span style="color:#64748b;font-size:10px">${escapeHtml(r.participant?.phone || "")}</span></td>
          <td>${escapeHtml(r.participant?.docType || "V")}-${escapeHtml(r.participant?.docNumber || "S/D")}</td>
          <td>${escapeHtml(r.training?.code || "")} — ${escapeHtml(r.training?.name || "")}</td>
          <td>${escapeHtml(r.status)}</td>
          <td>${
            r.isPaid
              ? r.pabiloStatus === "approved"
                ? `Pabilo (${escapeHtml(r.paymentReference || r.pabiloTransactionId || "OK")})`
                : `Manual (${escapeHtml(r.paymentReference || "OK")})`
              : Number(r.amount) > 0
              ? "Pendiente"
              : "Gratis"
          }</td>
          <td style="text-align:right">$${Number(r.amount || 0).toFixed(2)}</td>
        </tr>`
      )
      .join("");

    const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <title>Reporte Ejecutivo de Inscripciones — OnProtec</title>
  <style>
    body { font-family: Arial, Helvetica, sans-serif; color: #0f172a; margin: 24px; font-size: 12px; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #2a285c; padding-bottom: 12px; margin-bottom: 16px; }
    .brand { font-size: 20px; font-weight: 900; color: #2a285c; margin: 0; }
    .sub { color: #f4730a; font-weight: 700; font-size: 11px; text-transform: uppercase; letter-spacing: 0.06em; margin-top: 2px; }
    .meta { text-align: right; font-size: 11px; color: #475569; }
    .kpis { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 18px; }
    .kpi { border: 1px solid #cbd5e1; border-radius: 8px; padding: 10px; background: #f8fafc; }
    .kpi-label { font-size: 10px; text-transform: uppercase; color: #64748b; font-weight: 700; }
    .kpi-val { font-size: 18px; font-weight: 900; color: #0f172a; margin-top: 4px; }
    h2 { font-size: 13px; text-transform: uppercase; color: #2a285c; border-left: 4px solid #f4730a; padding-left: 8px; margin: 16px 0 8px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 16px; font-size: 11px; }
    th { background: #2a285c; color: #fff; text-align: left; padding: 6px 8px; font-size: 10px; text-transform: uppercase; }
    td { border-bottom: 1px solid #e2e8f0; padding: 6px 8px; vertical-align: top; }
    tr:nth-child(even) td { background: #f8fafc; }
    @media print { body { margin: 10mm; } }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <h1 class="brand">OnProtec® • Sala de Capacitaciones</h1>
      <div class="sub">Reporte Ejecutivo de Inscripciones & Conciliación de Pagos</div>
      <div style="font-size:11px;color:#475569;margin-top:4px;">Alcance: ${escapeHtml(filterSummary)}</div>
    </div>
    <div class="meta">
      <div><strong>Generado (Caracas):</strong></div>
      <div>${escapeHtml(fmtLocalTime(new Date()))}</div>
    </div>
  </div>

  <div class="kpis">
    <div class="kpi">
      <div class="kpi-label">Total Inscripciones</div>
      <div class="kpi-val">${reportStats.total}</div>
    </div>
    <div class="kpi">
      <div class="kpi-label">Confirmados / Asistieron</div>
      <div class="kpi-val">${reportStats.confirmedCount + reportStats.attendedCount}</div>
    </div>
    <div class="kpi">
      <div class="kpi-label">Recaudación Confirmada</div>
      <div class="kpi-val" style="color:#047857">$${reportStats.collectedUsd.toFixed(2)}</div>
    </div>
    <div class="kpi">
      <div class="kpi-label">Pabilo Auto / Manual</div>
      <div class="kpi-val">${reportStats.pabiloApprovedCount} / ${reportStats.manualApprovedCount}</div>
    </div>
  </div>

  <h2>Resumen por Capacitación</h2>
  <table>
    <thead>
      <tr>
        <th>Capacitación</th>
        <th>Fecha Evento</th>
        <th style="text-align:center">Inscritos</th>
        <th style="text-align:center">Confirm./Asist.</th>
        <th style="text-align:center">Pagados</th>
        <th style="text-align:right">Recaudado USD</th>
      </tr>
    </thead>
    <tbody>${courseRowsHtml}</tbody>
  </table>

  <h2>Listado Nominal de Inscripciones (${reportRows.length})</h2>
  <table>
    <thead>
      <tr>
        <th>ID</th>
        <th>Fecha Reg.</th>
        <th>Participante</th>
        <th>Cédula / RIF</th>
        <th>Capacitación</th>
        <th>Estado</th>
        <th>Validación / Ref</th>
        <th style="text-align:right">Monto</th>
      </tr>
    </thead>
    <tbody>${detailRowsHtml}</tbody>
  </table>
</body>
</html>`;

    printWin.document.open();
    printWin.document.write(html);
    printWin.document.close();
    setTimeout(() => {
      printWin.focus();
      printWin.print();
    }, 350);
  };

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
      <div className="space-y-3 pb-4 border-b border-slate-300 dark:border-slate-800">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <ClipboardList className="w-6 h-6 text-[#f4730a]" />
              <span>Matriz de Inscripciones, Pagos & Validación Manual</span>
            </h1>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 font-medium">
              Gestión y conciliación de {registrations.length} inscripciones reales con validación manual y soporte Pabilo Pay.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <span className="text-[11px] font-mono text-cyan-300 bg-slate-900 border border-slate-700 px-3 py-1.5 rounded-xl">
              {filtered.length} reg. {hasActiveFilters ? `(de ${registrations.length})` : ""}
            </span>

            <button
              type="button"
              onClick={openTrashModal}
              className="px-3 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-amber-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
              title="Ver formularios eliminados y restaurarlos en 1 clic"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Papelera</span>
              {deletedCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-200 border border-amber-500/40 text-[10px] font-black">
                  {deletedCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={openAuditModal}
              className="px-3 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-cyan-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
              title="Ver bitácora de auditoría y estado de respaldos automáticos"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Auditoría</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setReportScope("filtered");
                setShowReportModal(true);
              }}
              className="px-3.5 py-2 bg-[#f4730a] hover:bg-[#ef7922] text-white rounded-xl text-xs font-black flex items-center gap-1.5 transition shadow-md cursor-pointer"
              title="Abrir Centro de Reportes y Exportación Excel/PDF"
            >
              <BarChart3 className="w-4 h-4" />
              <span>📊 Reportes</span>
            </button>

            <button
              type="button"
              onClick={fetchRegistrations}
              className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 rounded-xl text-xs transition cursor-pointer"
              title="Recargar"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Barra Horizontal de Filtros (Búsqueda + Curso + Estado + Rango de Fechas Caracas) */}
        <div className="bg-white dark:bg-slate-900/90 border border-slate-300 dark:border-slate-800 rounded-2xl p-3 flex flex-wrap items-center gap-2.5 shadow-sm">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Buscar participante, cédula o curso..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-[#f4730a] w-52"
            />
          </div>

          <select
            value={trainingFilter}
            onChange={(e) => setTrainingFilter(e.target.value)}
            className="bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-[#f4730a] max-w-[230px] truncate font-medium"
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
            className="bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-[#f4730a] font-medium"
          >
            <option value="all">Todos los Estados</option>
            <option value="Inscrito">Inscrito</option>
            <option value="Confirmado">Confirmado</option>
            <option value="Asistió">Asistió</option>
            <option value="No Asistió">No Asistió</option>
            <option value="Lista de Espera">Lista de Espera</option>
            <option value="Cancelado">Cancelado</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value as PriorityFilter)}
            className="bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-[#f4730a] font-medium"
            title="Filtrar pretendientes según cumplimiento previo y compras en OnProtec"
          >
            <option value="all">Todos los Perfiles</option>
            <option value="new_prospect">🌟 Nuevos Prospectos (0 asist.)</option>
            <option value="store_client">👑 Clientes Compradores</option>
            <option value="reliable">✅ Cumplidores (0 faltas)</option>
            <option value="noshow">⚠️ Incumplidos (Con No-Show)</option>
          </select>

          <button
            type="button"
            onClick={() => setSortByPriority((v) => !v)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer ${
              sortByPriority
                ? "bg-emerald-600 text-white keep-white border-emerald-500 shadow-sm"
                : "bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:border-[#f4730a]"
            }`}
            title="Ordenar primero Clientes Compradores y Nuevos Prospectos sin faltas, dejando al final los incumplidos para ceder cupos"
          >
            🎯 {sortByPriority ? "Ordenado por Prioridad" : "Priorizar Cupos"}
          </button>

          <div className="h-5 w-px bg-slate-300 dark:bg-slate-700 hidden xl:block" />

          {/* Filtro por Fecha */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-600 dark:text-slate-300">
              <Calendar className="w-3.5 h-3.5 text-[#f4730a]" />
              <select
                value={dateField}
                onChange={(e) => setDateField(e.target.value as "registration" | "event")}
                className="bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-[#f4730a] font-semibold"
                title="Criterio de fecha para el filtro"
              >
                <option value="registration">Fecha Inscripción</option>
                <option value="event">Fecha Evento</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                Desde:
              </span>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-[#f4730a]"
              />
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                Hasta:
              </span>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-[#f4730a]"
              />
            </div>

            {/* Presets Rápidos */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => {
                  const today = toCaracasYMD(new Date());
                  setDateFrom(today);
                  setDateTo(today);
                }}
                className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-[#f4730a] hover:text-white dark:bg-slate-800 dark:hover:bg-[#f4730a] text-slate-700 dark:text-slate-200 text-[11px] font-bold transition cursor-pointer"
              >
                Hoy
              </button>
              <button
                type="button"
                onClick={() => {
                  setDateFrom(getCaracasDateShift(-6));
                  setDateTo(toCaracasYMD(new Date()));
                }}
                className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-[#f4730a] hover:text-white dark:bg-slate-800 dark:hover:bg-[#f4730a] text-slate-700 dark:text-slate-200 text-[11px] font-bold transition cursor-pointer"
              >
                7 días
              </button>
              <button
                type="button"
                onClick={() => {
                  const today = toCaracasYMD(new Date());
                  setDateFrom(today.slice(0, 8) + "01");
                  setDateTo(today);
                }}
                className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-[#f4730a] hover:text-white dark:bg-slate-800 dark:hover:bg-[#f4730a] text-slate-700 dark:text-slate-200 text-[11px] font-bold transition cursor-pointer"
              >
                Este mes
              </button>

              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={clearAllFilters}
                  className="px-2.5 py-1 rounded-lg bg-rose-500/15 hover:bg-rose-600 text-rose-600 dark:text-rose-300 hover:text-white border border-rose-500/30 text-[11px] font-bold transition cursor-pointer flex items-center gap-1"
                  title="Limpiar todos los filtros"
                >
                  <X className="w-3 h-3" />
                  <span>Limpiar</span>
                </button>
              )}
            </div>
          </div>
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
                        <span className="text-[10px] text-slate-400 block font-mono mt-0.5">
                          Reg: {fmtLocalTime(r.formSubmittedAt || r.createdAt)}
                        </span>
                        <div className="mt-1 flex flex-wrap items-center gap-1">
                          {(() => {
                            const prio = evaluateParticipantPriority(r.participant, r.id);
                            return (
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${prio.badgeClass}`}
                                title={prio.tooltip}
                              >
                                {prio.label}
                              </span>
                            );
                          })()}
                          {r.participant?.participations && (
                            <button
                              type="button"
                              onClick={() => setHistoryParticipant(r.participant)}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#e07b29]/15 text-[#e07b29] border border-[#e07b29]/30 hover:bg-[#e07b29]/25 transition"
                              title="Ver todas las capacitaciones donde ha participado este inscrito"
                            >
                              <span>
                                📚 {r.participant.participations.length}{" "}
                                {r.participant.participations.length === 1 ? "curso" : "cursos"}
                              </span>
                            </button>
                          )}
                        </div>
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
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300 dark:text-emerald-300 dark:bg-emerald-950/70 dark:border-emerald-800/70 px-2 py-0.5 rounded-full">
                              <ShieldCheck className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
                              Validado Manual
                            </span>
                          ) : r.pabiloStatus === "approved" ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-sky-100 text-sky-900 border border-sky-300 dark:text-cyan-300 dark:bg-cyan-950/70 dark:border-cyan-800/70 px-2 py-0.5 rounded-full">
                              <CheckCircle className="w-3.5 h-3.5 text-sky-700 dark:text-cyan-400" />
                              Pabilo Auto
                            </span>
                          ) : r.pabiloStatus === "rejected" ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-rose-100 text-rose-900 border border-rose-300 dark:text-red-400 dark:bg-red-950/70 dark:border-red-800/70 px-2 py-0.5 rounded-full">
                              <X className="w-3.5 h-3.5 text-rose-700 dark:text-red-400" />
                              Rechazado
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300 dark:text-amber-300 dark:bg-amber-950/70 dark:border-amber-800/70 px-2 py-0.5 rounded-full">
                              <Clock className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />
                              Sin Validar
                            </span>
                          )
                        ) : (
                          <span className="text-[11px] text-slate-500">No aplica (Gratis)</span>
                        )}
                        {r.paymentNotes && (
                          <span className="block text-[10px] text-slate-500 dark:text-slate-400 italic mt-0.5 truncate max-w-[170px]" title={r.paymentNotes}>
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
                            className="inline-flex items-center gap-1 text-[11px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300 dark:text-emerald-300 dark:bg-emerald-950/60 dark:border-emerald-800/60 px-2 py-0.5 rounded hover:underline"
                          >
                            📎 Ver Comprobante
                          </a>
                        ) : r.paymentReference ? (
                          <span className="font-mono text-[11px] text-slate-700 dark:text-slate-400">{r.paymentReference}</span>
                        ) : (
                          <span className="text-[11px] text-slate-500">S/C</span>
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

                          <a
                            href={getRegistrationWhatsAppUrl(r)}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => {
                              patchRegistration(r.id, { reminderSentAt: new Date().toISOString() });
                              showToast(
                                `Abriendo WhatsApp para ${r.participant?.name || "participante"}...`
                              );
                            }}
                            className="px-2 py-1 bg-emerald-500/15 hover:bg-emerald-600 text-emerald-400 hover:text-white rounded text-[11px] font-bold border border-emerald-500/40 flex items-center gap-1 transition cursor-pointer"
                            title={`Enviar mensaje por WhatsApp a ${r.participant?.name || "participante"} (${r.participant?.phone || ONPROTEC_WHATSAPP_DISPLAY})`}
                          >
                            <Send className="w-3 h-3" />
                            <span>Mensaje</span>
                          </a>

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
        <div
          role="dialog"
          aria-modal="true"
          onClick={(e) => {
            if (e.target === e.currentTarget) setHistoryParticipant(null);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
        >
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
                        ? "bg-emerald-100 text-emerald-900 border-emerald-300 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/40"
                        : part.status === "Confirmado"
                        ? "bg-sky-100 text-sky-900 border-sky-300 dark:bg-cyan-500/20 dark:text-cyan-300 dark:border-cyan-500/40"
                        : part.status === "Lista de Espera"
                        ? "bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/40"
                        : "bg-slate-100 text-slate-800 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700"
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
        <div
          role="dialog"
          aria-modal="true"
          onClick={(e) => {
            if (e.target === e.currentTarget) setViewingDetailsReg(null);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn"
        >
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
                  <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-[#e07b29] text-white keep-white">
                    FICHA DETALLADA DEL INSCRITO
                  </span>
                  <span className="text-xs font-mono font-bold text-[#0e5cd7] dark:text-cyan-300 bg-slate-100 dark:bg-slate-950 px-2.5 py-0.5 rounded-lg border border-slate-300 dark:border-slate-800">
                    ID: #{viewingDetailsReg.id}
                  </span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                      viewingDetailsReg.status === "Asistió"
                        ? "bg-emerald-100 text-emerald-900 border-emerald-300 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/40"
                        : viewingDetailsReg.status === "Confirmado"
                        ? "bg-sky-100 text-sky-900 border-sky-300 dark:bg-cyan-500/20 dark:text-cyan-300 dark:border-cyan-500/40"
                        : viewingDetailsReg.status === "Lista de Espera"
                        ? "bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/40"
                        : "bg-slate-100 text-slate-800 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700"
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
                    href={getRegistrationWhatsAppUrl(viewingDetailsReg)}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => {
                      patchRegistration(viewingDetailsReg.id, {
                        reminderSentAt: new Date().toISOString(),
                      });
                    }}
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
                    <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-300 dark:border-amber-500/30 text-xs text-amber-900 dark:text-amber-200">
                      <span className="text-[10px] font-black uppercase tracking-wider block text-amber-700 dark:text-amber-400 mb-0.5">
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
            <div className="mt-6 pt-5 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => {
                  setHistoryParticipant(viewingDetailsReg.participant);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-900 border border-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 dark:border-slate-700 text-xs font-bold dark:text-white transition cursor-pointer"
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
        <div
          role="dialog"
          aria-modal="true"
          onClick={(e) => {
            if (e.target === e.currentTarget) setModalReg(null);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn"
        >
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
        <div
          role="dialog"
          aria-modal="true"
          onClick={(e) => {
            if (e.target === e.currentTarget) setEditingReg(null);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn"
        >
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
        <div
          role="dialog"
          aria-modal="true"
          onClick={(e) => {
            if (e.target === e.currentTarget && !isDeletingReg) setDeletingReg(null);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn"
        >
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

      {/* Modal Widescreen: Centro de Reportes y Exportación de Inscripciones */}
      {showReportModal && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowReportModal(false);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
        >
          <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Cabecera del Modal */}
            <div className="p-5 sm:p-6 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-950/70">
              <div>
                <span className="text-[11px] font-black uppercase tracking-wider text-[#f4730a]">
                  ONPROTEC SALA VIP • ANALÍTICA & CONCILIACIÓN
                </span>
                <h3 className="text-xl font-black text-white flex items-center gap-2 mt-0.5">
                  <BarChart3 className="w-5 h-5 text-[#f4730a]" />
                  <span>Centro de Reportes de Inscripciones</span>
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setReportScope("filtered")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer ${
                    reportScope === "filtered"
                      ? "bg-[#f4730a] text-white border-[#f4730a]"
                      : "bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700"
                  }`}
                >
                  Vista Filtrada ({filtered.length})
                </button>
                <button
                  type="button"
                  onClick={() => setReportScope("all")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer ${
                    reportScope === "all"
                      ? "bg-[#f4730a] text-white border-[#f4730a]"
                      : "bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700"
                  }`}
                >
                  Total Histórico ({registrations.length})
                </button>
                <button
                  type="button"
                  onClick={() => setShowReportModal(false)}
                  className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition cursor-pointer"
                  title="Cerrar"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Cuerpo Widescreen Scrollable solo si excede altura */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1">
              {/* Filtro activo visual */}
              {reportScope === "filtered" && (
                <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-xs text-slate-300 flex flex-wrap items-center justify-between gap-2">
                  <span>
                    <strong className="text-cyan-300">Criterio activo:</strong>{" "}
                    {dateFrom || dateTo
                      ? `${dateField === "registration" ? "Fecha Inscripción" : "Fecha Evento"}: ${dateFrom || "..."} a ${dateTo || "..."}`
                      : "Todas las fechas"}
                    {trainingFilter !== "all"
                      ? ` • Curso ID #${trainingFilter}`
                      : " • Todos los cursos"}
                    {statusFilter !== "all" ? ` • Estado: ${statusFilter}` : ""}
                  </span>
                  <span className="font-mono text-[11px] text-slate-400">
                    Generado en UTC-4 (Caracas)
                  </span>
                </div>
              )}

              {/* Tarjetas KPI Horizontales */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                    Total Inscripciones
                  </span>
                  <p className="text-2xl font-black text-white mt-1">{reportStats.total}</p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Confirm.: <strong className="text-cyan-300">{reportStats.confirmedCount}</strong> • Asist.:{" "}
                    <strong className="text-emerald-300">{reportStats.attendedCount}</strong>
                  </p>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    Inscritos: {reportStats.inscritoCount} • Espera: {reportStats.waitlistCount} • No Asistió: {reportStats.noShowCount}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                    Recaudación Confirmada
                  </span>
                  <p className="text-2xl font-black text-emerald-400 mt-1">
                    ${reportStats.collectedUsd.toFixed(2)}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Pagos conciliados y cobrados (USD)
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                    Por Cobrar / Pendiente
                  </span>
                  <p className="text-2xl font-black text-amber-400 mt-1">
                    ${reportStats.pendingUsd.toFixed(2)}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Saldo pendiente de registros activos
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                    Validación Pabilo vs Manual
                  </span>
                  <p className="text-2xl font-black text-cyan-300 mt-1">
                    {reportStats.pabiloApprovedCount}{" "}
                    <span className="text-sm font-bold text-slate-500">/</span>{" "}
                    <span className="text-emerald-300">{reportStats.manualApprovedCount}</span>
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Binance Pabilo Auto vs Validados Manual
                  </p>
                </div>
              </div>

              {/* Tabla Resumen por Capacitación */}
              <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-200">
                    Desglose por Capacitación ({reportStats.courseBreakdown.length})
                  </h4>
                </div>
                <div className="overflow-x-auto max-h-60">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-slate-900 text-slate-400 uppercase text-[10px] border-b border-slate-800">
                      <tr>
                        <th className="py-2.5 px-4">Capacitación</th>
                        <th className="py-2.5 px-4">Fecha Evento</th>
                        <th className="py-2.5 px-4 text-center">Total Inscritos</th>
                        <th className="py-2.5 px-4 text-center">Confirmados / Asist.</th>
                        <th className="py-2.5 px-4 text-center">Pagados</th>
                        <th className="py-2.5 px-4 text-right">Recaudado USD</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/70">
                      {reportStats.courseBreakdown.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-6 text-center text-slate-500">
                            No hay registros en el rango seleccionado.
                          </td>
                        </tr>
                      ) : (
                        reportStats.courseBreakdown.map((c) => (
                          <tr key={c.trainingId} className="hover:bg-slate-900/60">
                            <td className="py-2.5 px-4 font-semibold text-white">
                              <span className="font-mono text-[#f4730a] mr-1.5">{c.code}</span>
                              {c.name}
                            </td>
                            <td className="py-2.5 px-4 text-slate-400">
                              {c.eventDate ? fmtLocalDate(c.eventDate) : "N/D"}
                            </td>
                            <td className="py-2.5 px-4 text-center font-bold">{c.total}</td>
                            <td className="py-2.5 px-4 text-center text-cyan-300 font-bold">
                              {c.confirmedOrAttended}
                            </td>
                            <td className="py-2.5 px-4 text-center text-emerald-300 font-bold">
                              {c.paidCount}
                            </td>
                            <td className="py-2.5 px-4 text-right font-mono font-black text-emerald-400">
                              ${c.collectedUsd.toFixed(2)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Pie del Modal con Botones de Exportación */}
            <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-950/80 flex flex-wrap items-center justify-between gap-3">
              <span className="text-[11px] text-slate-400">
                Exportando <strong className="text-white">{reportRows.length}</strong> registros según alcance seleccionado.
              </span>
              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  onClick={handleExportCsv}
                  disabled={reportRows.length === 0}
                  className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-black flex items-center gap-2 transition shadow-md cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>📥 Exportar Excel / CSV Detallado (.csv)</span>
                </button>

                <button
                  type="button"
                  onClick={handlePrintReport}
                  disabled={reportRows.length === 0}
                  className="px-4 py-2.5 rounded-xl bg-[#2a285c] hover:bg-[#3a377c] disabled:opacity-50 text-white text-xs font-black flex items-center gap-2 transition shadow-md cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>🖨️ Imprimir / Guardar Reporte PDF</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Papelera de Reciclaje (Soft-Delete + Restauración en 1 clic) */}
      {showTrashModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl max-h-[88vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
              <div>
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <Trash2 className="w-5 h-5 text-amber-400" />
                  <span>Papelera de Reciclaje ({deletedRegs.length})</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Ningún formulario eliminado se pierde. Puedes restaurarlo a su capacitación en 1 clic.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowTrashModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 sm:p-5 overflow-y-auto flex-1">
              {loadingTrash ? (
                <div className="py-10 text-center text-xs text-slate-400">Cargando papelera...</div>
              ) : deletedRegs.length === 0 ? (
                <div className="py-12 text-center">
                  <CheckCircle className="w-10 h-10 text-emerald-500/60 mx-auto mb-2" />
                  <p className="text-sm font-bold text-slate-200">La Papelera está vacía</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Cuando alguien elimine un formulario, aparecerá aquí con opción de recuperación inmediata.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {deletedRegs.map((r) => (
                    <div
                      key={r.id}
                      className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-[11px] font-bold text-amber-300 bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 rounded">
                            #{r.id}
                          </span>
                          <span className="font-bold text-sm text-white truncate">
                            {r.participant?.name || `Participante #${r.participantId}`}
                          </span>
                          <span className="text-xs text-slate-400 font-mono">
                            {r.participant?.docNumber || ""}
                          </span>
                        </div>
                        <p className="text-xs text-slate-300 truncate">
                          Curso: <strong className="text-cyan-300">{r.training?.code || `#${r.trainingId}`}</strong> —{" "}
                          {r.training?.name || r.originalFormName || "Capacitación"}
                        </p>
                        <p className="text-[11px] text-slate-400">
                          Eliminado el <strong className="text-slate-200">{fmtLocalTime(r.deletedAt)}</strong> por{" "}
                          <strong className="text-amber-200">{r.deletedBy || "Admin"}</strong>
                          {r.deletedReason ? ` · ${r.deletedReason}` : ""}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          disabled={restoringId === r.id}
                          onClick={() => handleRestoreRegistration(r.id)}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          <span>{restoringId === r.id ? "Restaurando..." : "Restaurar"}</span>
                        </button>
                        <button
                          type="button"
                          disabled={restoringId === r.id}
                          onClick={() =>
                            handlePermanentDelete(r.id, r.participant?.name || `#${r.id}`)
                          }
                          className="px-2.5 py-1.5 rounded-lg bg-red-950/70 hover:bg-red-900 border border-red-800/60 disabled:opacity-50 text-red-300 text-xs font-bold transition cursor-pointer"
                          title="Solo Super Admin: eliminar definitivamente"
                        >
                          Purgar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal de Bitácora de Auditoría y Respaldos */}
      {showAuditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl max-h-[88vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
              <div>
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-cyan-400" />
                  <span>Bitácora de Auditoría & Protección de Respaldos</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Historial en hora local (America/Caracas, UTC-4) de eliminaciones, restauraciones y ediciones clave.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAuditModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-4 sm:px-5 py-3 bg-slate-950/50 border-b border-slate-800 grid grid-cols-3 gap-3 text-center">
              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Respaldos Diarios (30d)</span>
                <span className="text-lg font-black text-emerald-400">{auditBackups.daily.length}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Pre-Eliminación (50 máx)</span>
                <span className="text-lg font-black text-amber-400">{auditBackups.preDelete.length}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Rotativos (c/10 min)</span>
                <span className="text-lg font-black text-cyan-400">{auditBackups.rolling.length}</span>
              </div>
            </div>

            <div className="p-4 sm:p-5 overflow-y-auto flex-1">
              {loadingAudit ? (
                <div className="py-10 text-center text-xs text-slate-400">Cargando bitácora...</div>
              ) : auditLogs.length === 0 ? (
                <div className="py-10 text-center text-xs text-slate-400">
                  Aún no hay eventos registrados desde la activación de la auditoría.
                </div>
              ) : (
                <div className="space-y-2">
                  {auditLogs.map((log) => (
                    <div
                      key={log.id}
                      className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                    >
                      <div className="space-y-0.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-black ${
                              log.action?.includes("DELETE")
                                ? "bg-red-500/20 text-red-300 border border-red-500/40"
                                : log.action?.includes("RESTORE")
                                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                                : "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                            }`}
                          >
                            {log.action}
                          </span>
                          <span className="font-semibold text-white">{log.summary}</span>
                        </div>
                        <p className="text-[11px] text-slate-400">
                          Actor: <strong className="text-slate-200">{log.actorName}</strong> ({log.actorEmail} · {log.actorRole})
                        </p>
                      </div>
                      <span className="text-[11px] font-mono text-slate-400 shrink-0">
                        {fmtLocalTime(log.timestamp)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
