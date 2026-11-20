"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  CalendarCheck,
  Plus,
  Users,
  UserCheck,
  Layers,
  QrCode,
  ExternalLink,
  RefreshCw,
  X,
  Check,
  Search,
  ArrowUpDown,
  Edit3,
  Image as ImageIcon,
  FileText,
  ClipboardCheck,
  Star,
  Trash2,
  Upload,
  UploadCloud,
  MapPin,
  Sparkles,
  MessageSquare,
  Download,
  AlertTriangle,
  GripVertical,
  ArrowUp,
  ArrowDown,
  Eye,
  EyeOff,
} from "lucide-react";
import { FormQuestion, SurveyQuestion } from "@/types";
import { fmtLocalDate, fmtLocalHour, formatCurrency } from "@/utils/formatUtils";
import {
  initialOdooSkus,
  defaultFormQuestions,
  defaultSurveyQuestions,
} from "@/lib/mockData";

function toDatetimeLocalValue(iso?: string | null): string {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso.slice(0, 16);
    // Ajustar a America/Caracas (UTC-4) para que el input datetime-local muestre la hora local exacta
    const caracasMs = d.getTime() - 4 * 60 * 60 * 1000;
    const cd = new Date(caracasMs);
    return cd.toISOString().slice(0, 16);
  } catch {
    return "";
  }
}

export default function CapacitacionesAdminPage() {
  const [trainings, setTrainings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [odooSkus, setOdooSkus] = useState<any[]>([]);
  const [syncingOdoo, setSyncingOdoo] = useState(false);
  const [search, setSearch] = useState("");
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");
  const [toast, setToast] = useState("");

  // Modal Crear / Editar Capacitación
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<"general" | "portada" | "formulario" | "encuesta">(
    "general"
  );
  const [saving, setSaving] = useState(false);

  // Drag-and-Drop Ordenamiento de Banners en Portada y Visibilidad de Inscripciones
  const [draggingId, setDraggingId] = useState<number | null>(null);
  const [dragOverId, setDragOverId] = useState<number | null>(null);
  const [savingOrder, setSavingOrder] = useState(false);
  const [togglingId, setTogglingId] = useState<number | null>(null);

  // Modal Confirmación de Eliminación (Permiso Diana / Coordinación)
  const [deletingTraining, setDeletingTraining] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    code: "",
    type: "Workshop",
    brand: "Dahua Technology",
    instructor: "",
    eventDate: "",
    adStartDate: "",
    adCosts: "0",
    associatedCosts: "0",
    maxCapacity: "40",
    isFree: true,
    price: "0",
    currency: "USD",
    status: "Planificado",
    registrationOpen: true,
    location: "Torre América, Piso 14, Urb. El Recreo, Caracas",
    selectedSkus: [] as string[],
    description: "",
    presentationNotes: "",
    coverImageUrl: "",
    coverPhotos: [] as string[],
    formQuestionsTitle: "Preguntas Específicas del Curso",
    formQuestionsDescription: "",
    paymentMethods: [
      "Pago Móvil",
      "Zelle USD",
      "Binance (Pabilo)",
      "Transferencia Bancaria Bs",
      "Efectivo en Tienda OnProtec",
    ] as string[],
    formQuestions: [...defaultFormQuestions] as FormQuestion[],
    surveyQuestions: [...defaultSurveyQuestions] as SurveyQuestion[],
  });

  const [newPhotoUrl, setNewPhotoUrl] = useState("");

  // Modal Ver QR y Resultados de Encuesta Final
  const [selectedSurveyModal, setSelectedSurveyModal] = useState<any | null>(null);
  const [surveyResponses, setSurveyResponses] = useState<any[]>([]);
  const [surveySummary, setSurveySummary] = useState<any | null>(null);
  const [loadingSurveys, setLoadingSurveys] = useState(false);

  const notify = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 4500);
  };

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

  useEffect(() => {
    if (!deletingTraining && !showModal && !selectedSurveyModal) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (deletingTraining) {
        setDeletingTraining(null);
      } else if (showModal) {
        setShowModal(false);
      } else if (selectedSurveyModal) {
        setSelectedSurveyModal(null);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [deletingTraining, showModal, selectedSurveyModal]);

  const handleSyncOdoo = async () => {
    setSyncingOdoo(true);
    try {
      const res = await fetch("/api/odoo/sync", { method: "POST" });
      const data = await res.json();
      if (data.products) {
        setOdooSkus(data.products);
        notify("Catálogo de SKUs de Odoo sincronizado.");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSyncingOdoo(false);
    }
  };

  const openCreateModal = (initialTab: "general" | "portada" | "formulario" | "encuesta" = "general") => {
    setEditingId(null);
    setActiveTab(initialTab);
    setFormData({
      name: "",
      code: "",
      type: "Workshop",
      brand: "OnProtec",
      instructor: "",
      eventDate: "",
      adStartDate: "",
      adCosts: "0",
      associatedCosts: "0",
      maxCapacity: "40",
      isFree: true,
      price: "0",
      currency: "USD",
      status: "Planificado",
      registrationOpen: true,
      location: "Torre América, Piso 14, Urb. El Recreo, Caracas",
      selectedSkus: [],
      description: "",
      presentationNotes:
        "📌 Nota para la Presentación: Capacitación práctica presencial en la Sala de Capacitaciones OnProtec (Aforo limitado a 18 participantes + 1 instructor).",
      coverImageUrl: "/brand/onprotec-hero-banner.avif",
      coverPhotos: ["/brand/onprotec-hero-banner.avif"],
      formQuestionsTitle: "Preguntas Específicas del Curso",
      formQuestionsDescription: "",
      paymentMethods: [
        "Binance (Pabilo)",
        "Zelle USD",
        "Pago Móvil",
        "Transferencia Bancaria Bs",
        "Efectivo en Tienda OnProtec",
      ],
      formQuestions: JSON.parse(JSON.stringify(defaultFormQuestions)),
      surveyQuestions: JSON.parse(JSON.stringify(defaultSurveyQuestions)),
    });
    setShowModal(true);
  };

  const openEditModal = (
    t: any,
    initialTab: "general" | "portada" | "formulario" | "encuesta" = "general"
  ) => {
    setEditingId(t.id);
    setActiveTab(initialTab);
    const photos =
      Array.isArray(t.coverPhotos) && t.coverPhotos.length > 0
        ? t.coverPhotos
        : t.coverImageUrl
        ? [t.coverImageUrl]
        : [];
    const isFreeVal =
      t.isFree !== undefined ? Boolean(t.isFree) : Number(t.price ?? 0) === 0;
    setFormData({
      name: t.name || "",
      code: t.code || "",
      type: t.type || "Workshop",
      brand: t.brand || "OnProtec",
      instructor: t.instructor || "",
      eventDate: toDatetimeLocalValue(t.eventDate),
      adStartDate: toDatetimeLocalValue(t.adStartDate),
      adCosts: String(t.adCosts ?? 0),
      associatedCosts: String(t.associatedCosts ?? 0),
      maxCapacity: String(t.maxCapacity ?? (isFreeVal ? 40 : 18)),
      isFree: isFreeVal,
      price: String(t.price ?? 0),
      currency: t.currency || "USD",
      status: t.status || "Planificado",
      registrationOpen: t.registrationOpen !== false,
      location: t.location || "Torre América, Piso 14, Urb. El Recreo, Caracas",
      selectedSkus: Array.isArray(t.relatedSkus) ? t.relatedSkus : [],
      description: t.description || "",
      presentationNotes: t.presentationNotes || "",
      coverImageUrl: t.coverImageUrl || photos[0] || "",
      coverPhotos: photos,
      formQuestionsTitle: t.formQuestionsTitle || "Preguntas Específicas del Curso",
      formQuestionsDescription: t.formQuestionsDescription || "",
      paymentMethods:
        Array.isArray(t.paymentMethods) && t.paymentMethods.length > 0
          ? Array.from(
              new Set(
                t.paymentMethods.map((m: string) =>
                  /binance/i.test(m)
                    ? "Binance (Pabilo)"
                    : /pago\s*m[oó]vil/i.test(m)
                    ? "Pago Móvil"
                    : m
                )
              )
            )
          : [
              "Binance (Pabilo)",
              "Zelle USD",
              "Pago Móvil",
              "Transferencia Bancaria Bs",
              "Efectivo en Tienda OnProtec",
            ],
      formQuestions:
        Array.isArray(t.formQuestions) && t.formQuestions.length > 0
          ? JSON.parse(JSON.stringify(t.formQuestions))
          : JSON.parse(JSON.stringify(defaultFormQuestions)),
      surveyQuestions:
        Array.isArray(t.surveyQuestions) && t.surveyQuestions.length > 0
          ? JSON.parse(JSON.stringify(t.surveyQuestions))
          : JSON.parse(JSON.stringify(defaultSurveyQuestions)),
    });
    setShowModal(true);
  };

  const handleToggleRegistrationOpen = async (t: any) => {
    const isCurrentlyOpen =
      t.registrationOpen !== false &&
      (t.status === "Planificado" || t.status === "En Publicidad");
    const nextOpen = !isCurrentlyOpen;
    setTogglingId(Number(t.id));
    try {
      const payload: any = {
        id: t.id,
        registrationOpen: nextOpen,
      };
      if (nextOpen && t.status !== "Planificado" && t.status !== "En Publicidad") {
        payload.status = "En Publicidad";
      }
      const res = await fetch("/api/capacitaciones", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        setTrainings((prev) =>
          prev.map((item) => (Number(item.id) === Number(t.id) ? data.data : item))
        );
        notify(
          nextOpen
            ? `🔓 Inscripciones habilitadas y banner visible en portada para ${t.code}.`
            : `🔒 Inscripciones cerradas y banner oculto en portada para ${t.code}.`
        );
      } else {
        notify(`⚠️ ${data.error || "No se pudo cambiar la visibilidad."}`);
      }
    } catch {
      notify("⚠️ Error de red al actualizar la inscripción de la capacitación.");
    } finally {
      setTogglingId(null);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...(editingId ? { id: editingId } : {}),
        name: formData.name,
        code: formData.code,
        type: formData.type,
        brand: formData.brand,
        instructor: formData.instructor,
        eventDate: formData.eventDate,
        adStartDate: formData.adStartDate || null,
        adCosts: formData.adCosts,
        associatedCosts: formData.associatedCosts,
        maxCapacity: formData.maxCapacity,
        isFree: formData.isFree,
        price: formData.isFree ? 0 : formData.price,
        currency: formData.currency,
        status: formData.status,
        registrationOpen: formData.registrationOpen,
        location: formData.location,
        relatedSkus: formData.selectedSkus,
        description: formData.description,
        presentationNotes: formData.presentationNotes,
        coverImageUrl: formData.coverImageUrl || formData.coverPhotos[0] || null,
        coverPhotos: formData.coverPhotos,
        formQuestionsTitle: formData.formQuestionsTitle,
        formQuestionsDescription: formData.formQuestionsDescription,
        paymentMethods: formData.paymentMethods,
        formQuestions: formData.formQuestions,
        surveyQuestions: formData.surveyQuestions,
      };

      const res = await fetch("/api/capacitaciones", {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        setShowModal(false);
        fetchTrainings();
        notify(
          editingId
            ? `Capacitación ${data.data.code} actualizada correctamente.`
            : `Capacitación ${data.data.code} creada exitosamente (0/18 cupos).`
        );
      } else {
        alert(data.error || "Error al guardar capacitación");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTraining = async () => {
    if (!deletingTraining) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/capacitaciones?id=${deletingTraining.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        notify(`Capacitación ${deletingTraining.code} eliminada correctamente.`);
        setDeletingTraining(null);
        if (editingId === deletingTraining.id) {
          setShowModal(false);
        }
        fetchTrainings();
      } else {
        alert(data.error || "Error al eliminar la capacitación");
      }
    } catch (err: any) {
      alert(`Error de conexión: ${err.message}`);
    } finally {
      setIsDeleting(false);
    }
  };

  // Subir archivo de foto para la portada (convierte a Base64 DataURL)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const dataUrl = ev.target?.result as string;
        if (dataUrl) {
          setFormData((prev) => {
            const nextPhotos = [...prev.coverPhotos, dataUrl];
            return {
              ...prev,
              coverPhotos: nextPhotos,
              coverImageUrl: prev.coverImageUrl || dataUrl,
            };
          });
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const addPhotoByUrl = () => {
    if (!newPhotoUrl.trim()) return;
    const url = newPhotoUrl.trim();
    setFormData((prev) => ({
      ...prev,
      coverPhotos: [...prev.coverPhotos, url],
      coverImageUrl: prev.coverImageUrl || url,
    }));
    setNewPhotoUrl("");
  };

  const removePhoto = (idx: number) => {
    setFormData((prev) => {
      const removed = prev.coverPhotos[idx];
      const next = prev.coverPhotos.filter((_, i) => i !== idx);
      return {
        ...prev,
        coverPhotos: next,
        coverImageUrl: prev.coverImageUrl === removed ? next[0] || "" : prev.coverImageUrl,
      };
    });
  };

  // Gestión de Preguntas del Formulario de Inscripción
  const addFormQuestion = () => {
    const newQ: FormQuestion = {
      id: `custom_q_${Date.now()}`,
      label: "Nueva pregunta para el inscrito",
      placeholder: "Escribe tu respuesta...",
      type: "text",
      options: [],
      required: false,
    };
    setFormData((prev) => ({
      ...prev,
      formQuestions: [...prev.formQuestions, newQ],
    }));
  };

  const addPaymentProofQuestion = () => {
    const newQ: FormQuestion = {
      id: `proof_q_${Date.now()}`,
      label: "Adjuntar Comprobante de Pago (Transferencia, Zelle o Pago Móvil)",
      placeholder: "Foto o PDF del comprobante de pago...",
      type: "file",
      options: [],
      required: true,
    };
    setFormData((prev) => ({
      ...prev,
      formQuestions: [...prev.formQuestions, newQ],
    }));
    notify("Se añadió la sección obligatoria para que el inscrito suba su comprobante de pago.");
  };

  const updateFormQuestion = (idx: number, patch: Partial<FormQuestion>) => {
    setFormData((prev) => {
      const next = [...prev.formQuestions];
      next[idx] = { ...next[idx], ...patch };
      return { ...prev, formQuestions: next };
    });
  };

  const removeFormQuestion = (idx: number) => {
    setFormData((prev) => ({
      ...prev,
      formQuestions: prev.formQuestions.filter((_, i) => i !== idx),
    }));
  };

  // Gestión de Preguntas de la Encuesta al Final del Curso
  const addSurveyQuestion = () => {
    const newSQ: SurveyQuestion = {
      id: `survey_q_${Date.now()}`,
      label: "¿Qué te pareció la demostración práctica con los equipos?",
      type: "rating",
      options: [],
      required: true,
    };
    setFormData((prev) => ({
      ...prev,
      surveyQuestions: [...prev.surveyQuestions, newSQ],
    }));
  };

  const updateSurveyQuestion = (idx: number, patch: Partial<SurveyQuestion>) => {
    setFormData((prev) => {
      const next = [...prev.surveyQuestions];
      next[idx] = { ...next[idx], ...patch };
      return { ...prev, surveyQuestions: next };
    });
  };

  const removeSurveyQuestion = (idx: number) => {
    setFormData((prev) => ({
      ...prev,
      surveyQuestions: prev.surveyQuestions.filter((_, i) => i !== idx),
    }));
  };

  const openSurveyViewer = (t: any) => {
    setSelectedSurveyModal(t);
    setLoadingSurveys(true);
    fetch(`/api/encuestas?trainingId=${t.id}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          setSurveyResponses(d.data || []);
          setSurveySummary(d.summary || null);
        }
      })
      .finally(() => setLoadingSurveys(false));
  };

  // Ordenamiento respetando primero displayOrder manual (drag & drop) y luego cronológico
  const orderedTrainings = [...trainings].sort((a, b) => {
    const hasOrderA = typeof a.displayOrder === "number" && Number.isFinite(a.displayOrder);
    const hasOrderB = typeof b.displayOrder === "number" && Number.isFinite(b.displayOrder);
    if (hasOrderA && hasOrderB && a.displayOrder !== b.displayOrder) {
      return a.displayOrder - b.displayOrder;
    }
    if (hasOrderA && !hasOrderB) return -1;
    if (!hasOrderA && hasOrderB) return 1;
    const dateA = new Date(a.eventDate || 0).getTime();
    const dateB = new Date(b.eventDate || 0).getTime();
    return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
  });

  const filteredTrainings = orderedTrainings.filter((t) => {
    const q = search.toLowerCase();
    return (
      t.name?.toLowerCase().includes(q) ||
      t.code?.toLowerCase().includes(q) ||
      t.instructor?.toLowerCase().includes(q) ||
      t.brand?.toLowerCase().includes(q)
    );
  });

  const persistTrainingOrder = async (nextOrdered: any[]) => {
    const normalized = nextOrdered.map((item, idx) => ({
      ...item,
      displayOrder: idx + 1,
    }));
    setTrainings(normalized);
    setSavingOrder(true);
    try {
      const res = await fetch("/api/capacitaciones", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "reorder",
          orderedIds: normalized.map((item) => item.id),
        }),
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setTrainings(data.data);
        notify("✅ Orden de banners actualizado en la portada.");
      } else {
        notify("⚠️ No se pudo guardar el orden.");
      }
    } catch {
      notify("⚠️ Error de red al guardar el orden de banners.");
    } finally {
      setSavingOrder(false);
    }
  };

  const handleDropRow = (targetId: number) => {
    if (draggingId === null || draggingId === targetId) {
      setDraggingId(null);
      setDragOverId(null);
      return;
    }
    const currentList = [...orderedTrainings];
    const fromIdx = currentList.findIndex((item) => Number(item.id) === Number(draggingId));
    const toIdx = currentList.findIndex((item) => Number(item.id) === Number(targetId));
    setDraggingId(null);
    setDragOverId(null);
    if (fromIdx === -1 || toIdx === -1) return;
    const [moved] = currentList.splice(fromIdx, 1);
    currentList.splice(toIdx, 0, moved);
    persistTrainingOrder(currentList);
  };

  const handleMoveRow = (trainingId: number, direction: "up" | "down") => {
    const currentList = [...orderedTrainings];
    const idx = currentList.findIndex((item) => Number(item.id) === Number(trainingId));
    if (idx === -1) return;
    const targetIdx = direction === "up" ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= currentList.length) return;
    const [moved] = currentList.splice(idx, 1);
    currentList.splice(targetIdx, 0, moved);
    persistTrainingOrder(currentList);
  };

  return (
    <div className="space-y-6">
      {toast && (
        <div className="fixed top-5 right-5 z-50 bg-emerald-950 border border-emerald-500 text-emerald-200 text-xs px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{toast}</span>
        </div>
      )}

      {/* Cintillo Widescreen de Cabecera y Acciones */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-300 dark:border-slate-800">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <CalendarCheck className="w-6 h-6 text-[#f4730a]" />
            <span>Gestión de Capacitaciones, Formularios, Portadas & Encuestas</span>
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 font-medium">
            {filteredTrainings.length} eventos registrados · Arrastra las filas para cambiar el orden de los banners en portada · Edita preguntas, portadas y encuestas.
            {savingOrder && (
              <span className="ml-2 text-[#f4730a] font-bold">Guardando nuevo orden...</span>
            )}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Buscar código (CAP-2026-039), curso o marca..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-[#f4730a] w-64 shadow-sm font-medium"
            />
          </div>

          <button
            onClick={() => setSortOrder(sortOrder === "desc" ? "asc" : "desc")}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-200 rounded-xl transition shadow-sm"
          >
            <ArrowUpDown className="w-3.5 h-3.5 text-cyan-400" />
            <span>
              {sortOrder === "desc" ? "📅 Más recientes primero" : "📅 Más antiguos primero"}
            </span>
          </button>

          <button
            onClick={handleSyncOdoo}
            disabled={syncingOdoo}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-cyan-300 rounded-xl transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncingOdoo ? "animate-spin" : ""}`} />
            <span>Sincronizar Odoo</span>
          </button>

          <a
            href="/api/admin/backup"
            download
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-emerald-400 rounded-xl transition"
            title="Descargar copia de seguridad completa JSON de todas las capacitaciones y registros"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>Descargar Respaldo BD</span>
          </a>

          <button
            onClick={() => openCreateModal("general")}
            className="onprotec-btn-primary flex items-center gap-1.5 px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-brand-500/20 transition"
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
                <th className="py-3.5 px-3 text-center whitespace-nowrap" title="Arrastra una fila para definir el orden de los banners en la portada">
                  Orden Banner
                </th>
                <th className="py-3.5 px-4">Portada / Evento</th>
                <th className="py-3.5 px-4">Marca & Instructor</th>
                <th
                  onClick={() => setSortOrder(sortOrder === "desc" ? "asc" : "desc")}
                  className="py-3.5 px-4 cursor-pointer hover:text-white select-none transition"
                >
                  <div className="flex items-center gap-1">
                    <span>Fecha (Caracas)</span>
                    <ArrowUpDown className="w-3 h-3 text-cyan-400" />
                  </div>
                </th>
                <th className="py-3.5 px-4">Aforo Sala (Máx 18)</th>
                <th className="py-3.5 px-4">Inversión / Costos</th>
                <th className="py-3.5 px-4">Formulario & Nota</th>
                <th className="py-3.5 px-4">Estado</th>
                <th className="py-3.5 px-4 text-right">Acciones (Editar / Encuesta)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 font-normal">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-500">
                    Cargando capacitaciones...
                  </td>
                </tr>
              ) : filteredTrainings.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-500">
                    No se encontraron capacitaciones coincidentes.
                  </td>
                </tr>
              ) : (
                filteredTrainings.map((t) => {
                  const maxCap = Number(t.maxCapacity) || 18;
                  const stats = t.stats || {
                    totalOccupied: 0,
                    availableSeats: maxCap,
                    isFull: false,
                    surveyCount: 0,
                  };
                  const isFull = stats.totalOccupied >= maxCap;
                  const qCount = Array.isArray(t.formQuestions) ? t.formQuestions.length : 4;
                  const sqCount = Array.isArray(t.surveyQuestions) ? t.surveyQuestions.length : 7;
                  const globalOrderIdx = orderedTrainings.findIndex(
                    (o) => Number(o.id) === Number(t.id)
                  );
                  const isBeingDragged = draggingId === Number(t.id);
                  const isDragTarget = dragOverId === Number(t.id) && draggingId !== Number(t.id);

                  return (
                    <tr
                      key={`${t.id}-${t.code}`}
                      draggable={!search.trim() && !savingOrder}
                      onDragStart={(e) => {
                        if (search.trim()) return;
                        setDraggingId(Number(t.id));
                        e.dataTransfer.effectAllowed = "move";
                      }}
                      onDragOver={(e) => {
                        if (search.trim()) return;
                        e.preventDefault();
                        e.dataTransfer.dropEffect = "move";
                        if (dragOverId !== Number(t.id)) setDragOverId(Number(t.id));
                      }}
                      onDragLeave={() => {
                        if (dragOverId === Number(t.id)) setDragOverId(null);
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        if (!search.trim()) handleDropRow(Number(t.id));
                      }}
                      onDragEnd={() => {
                        setDraggingId(null);
                        setDragOverId(null);
                      }}
                      className={`transition ${
                        isDragTarget
                          ? "bg-[#f4730a]/15 ring-2 ring-inset ring-[#f4730a]"
                          : "hover:bg-slate-800/40"
                      } ${isBeingDragged ? "opacity-45" : ""}`}
                    >
                      <td className="py-3.5 px-3 text-center whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          <span
                            className={`p-1 rounded border ${
                              search.trim()
                                ? "text-slate-600 border-slate-800 cursor-not-allowed"
                                : "text-slate-400 hover:text-[#f4730a] border-slate-700 bg-slate-950 cursor-grab active:cursor-grabbing"
                            }`}
                            title={
                              search.trim()
                                ? "Limpia la búsqueda para arrastrar filas"
                                : "Arrastra esta fila arriba o abajo para cambiar el orden del banner en portada"
                            }
                          >
                            <GripVertical className="w-3.5 h-3.5" />
                          </span>
                          <span className="font-mono text-[11px] font-black text-[#f4730a] min-w-[24px]">
                            #{globalOrderIdx + 1}
                          </span>
                          <div className="flex flex-col gap-0.5">
                            <button
                              type="button"
                              disabled={globalOrderIdx <= 0 || savingOrder}
                              onClick={() => handleMoveRow(Number(t.id), "up")}
                              className="p-0.5 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-300 cursor-pointer disabled:cursor-not-allowed"
                              title="Subir una posición en portada"
                            >
                              <ArrowUp className="w-2.5 h-2.5" />
                            </button>
                            <button
                              type="button"
                              disabled={globalOrderIdx >= orderedTrainings.length - 1 || savingOrder}
                              onClick={() => handleMoveRow(Number(t.id), "down")}
                              className="p-0.5 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-300 cursor-pointer disabled:cursor-not-allowed"
                              title="Bajar una posición en portada"
                            >
                              <ArrowDown className="w-2.5 h-2.5" />
                            </button>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          {t.coverImageUrl ? (
                            <img
                              src={t.coverImageUrl}
                              alt={t.name}
                              className="w-12 h-12 rounded-xl object-cover border border-slate-700 flex-shrink-0"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-xl bg-[#1a1b4b] border border-[#e07b29]/40 flex items-center justify-center flex-shrink-0 p-1.5">
                              <img
                                src="/brand/onprotec-icon.png"
                                alt="OnProtec"
                                className="w-full h-full object-contain"
                              />
                            </div>
                          )}
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono text-[11px] text-brand-300 font-bold">
                                {t.code}
                              </span>
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-brand-500/20 text-brand-300 border border-brand-500/30">
                                {t.type}
                              </span>
                            </div>
                            <span className="text-white font-bold block max-w-xs truncate mt-0.5">
                              {t.name}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#e07b29]/15 text-[#e07b29] border border-[#e07b29]/30">
                          {t.brand || "OnProtec"}
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
                        <Link
                          href={`/admin/inscripciones?trainingId=${t.id}`}
                          className="group inline-block"
                          title={`Ver inscripciones de ${t.code}`}
                        >
                          <div className="flex items-center gap-2">
                            <span
                              className={`font-bold group-hover:underline ${
                                isFull ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400"
                              }`}
                            >
                              {stats.totalOccupied} / {maxCap}
                            </span>
                            {isFull ? (
                              <span className="text-[10px] bg-amber-100 text-amber-900 dark:bg-amber-500/20 dark:text-amber-300 px-1.5 py-0.5 rounded border border-amber-300 dark:border-amber-500/30 font-bold">
                                Lleno
                              </span>
                            ) : (
                              <span className="text-[10px] bg-emerald-100 text-emerald-900 dark:bg-emerald-500/15 dark:text-emerald-300 px-1.5 py-0.5 rounded border border-emerald-300 dark:border-emerald-500/30 font-semibold">
                                {stats.availableSeats} libres
                              </span>
                            )}
                          </div>
                          <div className="w-24 bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full mt-1.5 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                isFull ? "bg-amber-500" : "bg-emerald-500"
                              }`}
                              style={{
                                width: `${Math.min(100, (stats.totalOccupied / maxCap) * 100)}%`,
                              }}
                            />
                          </div>
                        </Link>
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
                        <div className="space-y-1">
                          <button
                            type="button"
                            onClick={() => openEditModal(t, "formulario")}
                            className="text-[11px] text-cyan-300 hover:underline flex items-center gap-1 font-medium"
                          >
                            <FileText className="w-3 h-3" />
                            <span>{qCount} preg. inscripción</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => openEditModal(t, "portada")}
                            className="text-[10px] text-slate-400 hover:text-white flex items-center gap-1 truncate max-w-[160px]"
                            title={t.presentationNotes || "Configurar nota de presentación"}
                          >
                            <ImageIcon className="w-3 h-3 text-[#e07b29]" />
                            <span>
                              {t.coverPhotos?.length || (t.coverImageUrl ? 1 : 0)} fotos · Nota
                            </span>
                          </button>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex flex-col items-start gap-1">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
                              t.status === "Planificado" || t.status === "En Publicidad"
                                ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                                : "bg-slate-800 text-slate-300 border-slate-700"
                            }`}
                          >
                            {t.status}
                          </span>
                          {t.registrationOpen === false && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-500/20 text-rose-300 border border-rose-500/40 whitespace-nowrap">
                              🚫 Inscripción Cerrada (Oculta)
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5 flex-wrap">
                          {(() => {
                            const isOpenForReg =
                              t.registrationOpen !== false &&
                              (t.status === "Planificado" || t.status === "En Publicidad");
                            const isToggling = togglingId === Number(t.id);
                            return (
                              <button
                                type="button"
                                disabled={isToggling}
                                onClick={() => handleToggleRegistrationOpen(t)}
                                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold border flex items-center gap-1 transition cursor-pointer disabled:opacity-50 ${
                                  isOpenForReg
                                    ? "bg-amber-50 hover:bg-amber-500 text-amber-800 hover:text-white border-amber-300 dark:bg-amber-500/15 dark:hover:bg-amber-600 dark:text-amber-300 dark:border-amber-500/40"
                                    : "bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white border-emerald-300 dark:bg-emerald-500/15 dark:hover:bg-emerald-600 dark:text-emerald-300 dark:border-emerald-500/40"
                                }`}
                                title={
                                  isOpenForReg
                                    ? `Ocultar de portada y cerrar inscripciones para ${t.code}`
                                    : `Volver a mostrar banner y habilitar inscripciones para ${t.code}`
                                }
                              >
                                {isOpenForReg ? (
                                  <>
                                    <EyeOff className="w-3.5 h-3.5" />
                                    <span>Ocultar / Cerrar Inscripción</span>
                                  </>
                                ) : (
                                  <>
                                    <Eye className="w-3.5 h-3.5" />
                                    <span>Habilitar Inscripción</span>
                                  </>
                                )}
                              </button>
                            );
                          })()}

                          <Link
                            href={`/admin/checkin?trainingId=${t.id}`}
                            className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white border border-emerald-300 dark:bg-emerald-500/15 dark:hover:bg-emerald-600 dark:text-emerald-300 dark:border-emerald-500/40 rounded-lg text-xs font-bold flex items-center gap-1 transition cursor-pointer"
                            title="Abrir Check-in y Lista de Asistencia de esta capacitación"
                          >
                            <UserCheck className="w-3.5 h-3.5" />
                            <span>Check-in</span>
                          </Link>

                          <button
                            type="button"
                            onClick={() => openEditModal(t, "general")}
                            className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-[#0e5cd7] border border-blue-300 dark:bg-brand-600/20 dark:hover:bg-brand-600/30 dark:text-brand-300 dark:border-brand-500/40 rounded-lg text-xs font-bold flex items-center gap-1 transition cursor-pointer"
                            title="Editar Capacitación, Costos y Configuración General"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>Editar</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => openEditModal(t, "formulario")}
                            className="px-2.5 py-1.5 bg-cyan-50 hover:bg-cyan-100 text-cyan-800 border border-cyan-300 dark:bg-cyan-600/20 dark:hover:bg-cyan-600/35 dark:text-cyan-300 dark:border-cyan-500/40 rounded-lg text-xs font-bold flex items-center gap-1 transition cursor-pointer"
                            title="Editar preguntas, métodos de pago y campos del formulario público"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>📝 Editar Formulario</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => openEditModal(t, "portada")}
                            className="px-2.5 py-1.5 bg-[#f4730a]/15 hover:bg-[#f4730a]/30 text-[#f4730a] border border-[#f4730a]/40 rounded-lg text-xs font-bold flex items-center gap-1 transition cursor-pointer"
                            title="Subir o cambiar la foto llamativa del banner principal (1080x550)"
                          >
                            <ImageIcon className="w-3.5 h-3.5" />
                            <span>🖼️ Foto Banner</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => openSurveyViewer(t)}
                            className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-amber-700 border border-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-amber-300 dark:border-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
                            title="Ver Código QR y Encuesta de Fin de Curso"
                          >
                            <QrCode className="w-3.5 h-3.5" />
                            <span>Encuesta ({sqCount})</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setDeletingTraining(t)}
                            className="px-2 py-1.5 bg-rose-50 hover:bg-red-600 text-rose-700 hover:text-white border border-rose-300 dark:bg-red-950/40 dark:hover:bg-red-900/60 dark:text-red-400 dark:hover:text-red-300 dark:border-red-800/50 rounded-lg text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
                            title={`Eliminar capacitación ${t.code}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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

      {/* Modal Ver QR y Resultados de Encuesta al Final del Curso */}
      {selectedSurveyModal && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedSurveyModal(null);
          }}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
        >
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 max-w-4xl w-full relative shadow-2xl my-8">
            <button
              onClick={() => setSelectedSurveyModal(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800 mb-5">
              <div>
                <span className="text-xs font-mono text-[#e07b29] font-bold">
                  {selectedSurveyModal.code} · Encuesta de Fin de Curso
                </span>
                <h3 className="text-lg font-extrabold text-white">{selectedSurveyModal.name}</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const target = selectedSurveyModal;
                    setSelectedSurveyModal(null);
                    openEditModal(target, "encuesta");
                  }}
                  className="px-3 py-1.5 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Redactar / Editar Preguntas de Encuesta</span>
                </button>
                <a
                  href={`/encuesta/${selectedSurveyModal.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1"
                >
                  <span>Abrir Encuesta Pública</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
              {/* Columna QR */}
              <div className="md:col-span-4 bg-slate-950 border border-slate-800 rounded-2xl p-4 text-center">
                <span className="text-xs font-bold text-white block mb-2">
                  Código QR para Proyectar al Final del Curso
                </span>
                {selectedSurveyModal.surveyQrCode ? (
                  <div className="bg-white p-3 rounded-2xl inline-block mx-auto mb-3 shadow-md">
                    <img
                      src={selectedSurveyModal.surveyQrCode}
                      alt="Código QR Encuesta"
                      className="w-44 h-44 mx-auto"
                    />
                  </div>
                ) : null}
                <p className="text-[11px] text-slate-400">
                  Los participantes escanean este QR al finalizar la sesión para evaluar el curso.
                </p>
              </div>

              {/* Columna Resumen y Respuestas */}
              <div className="md:col-span-8 space-y-4">
                {surveySummary && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                    <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                      <span className="text-[10px] text-slate-400 block">Respuestas</span>
                      <span className="text-lg font-black text-white">
                        {surveySummary.totalResponses}
                      </span>
                    </div>
                    <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                      <span className="text-[10px] text-slate-400 block">Instructor</span>
                      <span className="text-lg font-black text-amber-400">
                        ★ {surveySummary.avgInstructor} / 5
                      </span>
                    </div>
                    <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                      <span className="text-[10px] text-slate-400 block">Contenido</span>
                      <span className="text-lg font-black text-cyan-400">
                        ★ {surveySummary.avgContent} / 5
                      </span>
                    </div>
                    <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                      <span className="text-[10px] text-slate-400 block">NPS Recomendación</span>
                      <span className="text-lg font-black text-emerald-400">
                        {surveySummary.avgNps} / 10
                      </span>
                    </div>
                  </div>
                )}

                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 max-h-64 overflow-y-auto space-y-2.5">
                  <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5 text-brand-400" />
                    <span>Evaluaciones Recibidas ({surveyResponses.length})</span>
                  </h4>
                  {loadingSurveys ? (
                    <p className="text-xs text-slate-500 py-4 text-center">
                      Cargando respuestas...
                    </p>
                  ) : surveyResponses.length === 0 ? (
                    <p className="text-xs text-slate-500 py-4 text-center">
                      Aún no se han recibido respuestas en la encuesta de este curso.
                    </p>
                  ) : (
                    surveyResponses.slice(0, 20).map((s) => (
                      <div
                        key={s.id}
                        className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-white">
                            {s.participantName || "Asistente"}
                            {s.company ? ` · ${s.company}` : ""}
                          </span>
                          <span className="text-amber-400 font-bold text-[11px]">
                            ★ Inst: {s.ratingInstructor}/5 | NPS: {s.recommendationScore}/10
                          </span>
                        </div>
                        {s.mostLiked && (
                          <p className="text-slate-300 text-[11px]">
                            <strong>Lo mejor:</strong> {s.mostLiked}
                          </p>
                        )}
                        {(s.suggestions || s.feedback) && (
                          <p className="text-slate-400 text-[11px]">
                            <strong>Sugerencias:</strong> {s.suggestions || s.feedback}
                          </p>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Completo Crear / Editar Capacitación (Con Pestañas) */}
      {showModal && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowModal(false);
          }}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
        >
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 max-w-4xl w-full shadow-2xl my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
              <div>
                <h3 className="text-lg font-extrabold text-white flex items-center gap-2">
                  <CalendarCheck className="w-5 h-5 text-[#e07b29]" />
                  <span>
                    {editingId
                      ? `Editar Capacitación (${formData.code})`
                      : "Nueva Capacitación OnProtec"}
                  </span>
                </h3>
                <p className="text-xs text-slate-400">
                  Configura datos del evento, fotos de portada, nota de presentación, preguntas del
                  formulario y encuesta final.
                </p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Navegación de Pestañas del Editor */}
            <div className="flex flex-wrap gap-2 mb-5 pb-3 border-b border-slate-800">
              {[
                { id: "general", label: "1. Datos Generales & Costos", icon: CalendarCheck },
                { id: "portada", label: "2. Nota de Presentación & Fotos Portada", icon: ImageIcon },
                {
                  id: "formulario",
                  label: `3. Preguntas del Formulario (${formData.formQuestions.length})`,
                  icon: FileText,
                },
                {
                  id: "encuesta",
                  label: `4. Encuesta al Final del Curso (${formData.surveyQuestions.length})`,
                  icon: ClipboardCheck,
                },
              ].map((tab) => {
                const Icon = tab.icon;
                const active = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border transition ${
                      active
                        ? "bg-brand-600 text-white border-brand-500 shadow-sm"
                        : "bg-slate-950 text-slate-400 border-slate-800 hover:text-white"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              {/* TAB 1: DATOS GENERALES Y COSTOS */}
              {activeTab === "general" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <div className="sm:col-span-3">
                      <label className="block text-slate-300 font-semibold mb-1">
                        Nombre del Curso / Workshop *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Ej. Gestiona y Monetiza tus clientes Dahua con DoLynk Care"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">
                        Código (Opcional)
                      </label>
                      <input
                        type="text"
                        placeholder="CAP-2026-040"
                        value={formData.code}
                        onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">
                        Tipo de Evento
                      </label>
                      <select
                        value={formData.type}
                        onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white"
                      >
                        <option value="Workshop">Workshop</option>
                        <option value="Curso">Curso</option>
                        <option value="Certificación">Certificación</option>
                        <option value="Interno">Interno</option>
                        <option value="Otros">Otros</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">
                        Marca / Fabricante
                      </label>
                      <select
                        value={formData.brand}
                        onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white"
                      >
                        <option value="OnProtec">OnProtec (Multimarca)</option>
                        <option value="Dahua Technology">Dahua Technology</option>
                        <option value="Hikvision">Hikvision</option>
                        <option value="TP-Link / Omada">TP-Link / Omada / VIGI</option>
                        <option value="Ubiquiti UniFi">Ubiquiti UniFi</option>
                        <option value="EZVIZ">EZVIZ</option>
                        <option value="WatchGuard">WatchGuard / SGSI</option>
                        <option value="Marsriva">Marsriva / Energía</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">
                        Instructor / Ponente *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Ej. Alejandro Quijada"
                        value={formData.instructor}
                        onChange={(e) => setFormData({ ...formData, instructor: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">
                        Estado del Curso
                      </label>
                      <select
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white"
                      >
                        <option value="Planificado">Planificado</option>
                        <option value="En Publicidad">En Publicidad</option>
                        <option value="En Curso">En Curso</option>
                        <option value="Finalizado">Finalizado</option>
                        <option value="Cancelado">Cancelado</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">
                        Fecha y Hora del Evento *
                      </label>
                      <input
                        type="datetime-local"
                        required
                        value={formData.eventDate}
                        onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">
                        Inicio de Pauta Publicitaria
                      </label>
                      <input
                        type="datetime-local"
                        value={formData.adStartDate}
                        onChange={(e) => setFormData({ ...formData, adStartDate: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">
                        Visibilidad e Inscripciones Públicas
                      </label>
                      <button
                        type="button"
                        onClick={() =>
                          setFormData((prev) => ({
                            ...prev,
                            registrationOpen: !prev.registrationOpen,
                          }))
                        }
                        className={`w-full px-3 py-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
                          formData.registrationOpen
                            ? "bg-emerald-500/15 border-emerald-500/50 text-emerald-300 hover:bg-emerald-500/25"
                            : "bg-rose-500/15 border-rose-500/50 text-rose-300 hover:bg-rose-500/25"
                        }`}
                      >
                        {formData.registrationOpen ? (
                          <>
                            <Eye className="w-4 h-4" />
                            <span>Visible • Inscripción Abierta</span>
                          </>
                        ) : (
                          <>
                            <EyeOff className="w-4 h-4" />
                            <span>Oculta • Inscripción Cerrada</span>
                          </>
                        )}
                      </button>
                    </div>

                  </div>

                  {/* Sede / Ubicación Física del Evento */}
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-[#f4730a]" />
                        Sede / Ubicación Física del Evento
                      </span>
                      <span className="text-[11px] text-slate-400 font-normal">
                        Editable si es presencial, hotel o auditorio externo
                      </span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Torre América, Piso 14, Urb. El Recreo, Caracas"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-medium focus:border-brand-500"
                    />
                  </div>

                  {/* Foto Llamativa del Banner Principal */}
                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div
                        className="w-36 aspect-[1080/550] rounded-xl overflow-hidden bg-slate-900 border border-slate-700 flex-shrink-0 flex items-center justify-center"
                        style={{ aspectRatio: "1080 / 550" }}
                      >
                        {formData.coverImageUrl || formData.coverPhotos[0] ? (
                          <img
                            src={formData.coverImageUrl || formData.coverPhotos[0]}
                            alt="Preview Banner"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <ImageIcon className="w-6 h-6 text-slate-600" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <span className="text-xs font-black text-white block">
                          🖼️ Foto Llamativa del Banner Principal
                        </span>
                        <span className="text-[11px] font-bold text-[#f4730a] block mt-0.5">
                          📐 Medida oficial del banner: 1080px × 550px
                        </span>
                        <span className="text-[11px] text-slate-400 block leading-snug">
                          Imagen destacada a todo color que aparece en el banner de inicio para atraer instaladores.
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <label className="cursor-pointer inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#f4730a] hover:bg-[#ef7922] text-white text-xs font-black shadow transition">
                        <Upload className="w-3.5 h-3.5" />
                        <span>Subir / Cambiar Foto del Banner</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            const reader = new FileReader();
                            reader.onload = (ev) => {
                              const dataUrl = ev.target?.result as string;
                              if (dataUrl) {
                                setFormData((prev) => ({
                                  ...prev,
                                  coverImageUrl: dataUrl,
                                  coverPhotos: [dataUrl, ...prev.coverPhotos.filter((p) => p !== dataUrl)],
                                }));
                                notify("Foto llamativa del banner actualizada.");
                              }
                            };
                            reader.readAsDataURL(file);
                          }}
                        />
                      </label>
                    </div>
                  </div>

                  {/* MODALIDAD DE ACCESO Y COBRO (REGLA DE NEGOCIO ONPROTEC) */}
                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                    <label className="block text-xs font-black uppercase tracking-wider text-amber-400">
                      Modalidad de Cobro & Política de Aforo (Regla OnProtec)
                    </label>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() =>
                          setFormData((prev) => ({
                            ...prev,
                            isFree: true,
                            price: "0",
                            maxCapacity: "40",
                          }))
                        }
                        className={`p-3.5 rounded-xl border-2 text-left transition cursor-pointer flex flex-col justify-between ${
                          formData.isFree
                            ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-950 dark:text-white shadow-md shadow-emerald-900/10"
                            : "bg-white dark:bg-slate-900/60 border-slate-300 dark:border-slate-800 text-slate-700 dark:text-slate-400 hover:border-slate-400 dark:hover:border-slate-700"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs font-black text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 dark:bg-emerald-400" />
                            🟢 EVENTO GRATUITO
                          </span>
                          <span className="text-[10px] font-mono font-bold bg-emerald-100 text-emerald-900 dark:bg-emerald-900/60 dark:text-emerald-200 px-2 py-0.5 rounded">
                            Cupo: 40 Pre-inscritos
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-700 dark:text-slate-300 leading-snug">
                          Convocatoria abierta de <strong>hasta 40 registrados</strong> para contactar y reconfirmar los <strong>18 cupos físicos en sala</strong> (compensa la tasa habitual de No-Show).
                        </p>
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          setFormData((prev) => ({
                            ...prev,
                            isFree: false,
                            price: prev.price === "0" ? "40" : prev.price,
                            maxCapacity: "18",
                          }))
                        }
                        className={`p-3.5 rounded-xl border-2 text-left transition cursor-pointer flex flex-col justify-between ${
                          !formData.isFree
                            ? "bg-amber-50 dark:bg-amber-950/40 border-amber-500 text-amber-950 dark:text-white shadow-md shadow-amber-900/10"
                            : "bg-white dark:bg-slate-900/60 border-slate-300 dark:border-slate-800 text-slate-700 dark:text-slate-400 hover:border-slate-400 dark:hover:border-slate-700"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs font-black text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 dark:bg-amber-400" />
                            🔵 ACTIVIDAD COBRADA (PAGA)
                          </span>
                          <span className="text-[10px] font-mono font-bold bg-amber-100 text-amber-900 dark:bg-amber-900/60 dark:text-amber-200 px-2 py-0.5 rounded">
                            Aforo Estricto: 18
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-700 dark:text-slate-300 leading-snug">
                          Requiere pago y comprobante. <strong>Solo 18 puestos VIP garantizados</strong> (el puesto 19 pasa automáticamente a lista de espera).
                        </p>
                      </button>
                    </div>

                    {/* Inputs condicionales según la modalidad */}
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2">
                      <div>
                        <label className="block text-slate-300 text-xs font-semibold mb-1">
                          Inversión / Precio ($)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          disabled={formData.isFree}
                          value={formData.isFree ? "0" : formData.price}
                          onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                          className={`w-full bg-slate-900 border rounded-xl p-2.5 text-white font-mono font-bold ${
                            formData.isFree
                              ? "border-slate-800 text-slate-500 cursor-not-allowed"
                              : "border-amber-400 text-amber-300"
                          }`}
                        />
                      </div>

                      <div>
                        <label className="block text-slate-300 text-xs font-semibold mb-1">
                          Límite de Inscripciones
                        </label>
                        <input
                          type="number"
                          min={1}
                          max={60}
                          value={formData.maxCapacity}
                          onChange={(e) => setFormData({ ...formData, maxCapacity: e.target.value })}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white font-bold font-mono"
                        />
                        <span className="text-[10px] text-slate-400 block mt-0.5">
                          {formData.isFree ? "Meta pre-registro (40)" : "18 en sala"}
                        </span>
                      </div>

                      <div>
                        <label className="block text-slate-300 text-xs font-semibold mb-1">
                          Costo Publicidad ($)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={formData.adCosts}
                          onChange={(e) => setFormData({ ...formData, adCosts: e.target.value })}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-300 text-xs font-semibold mb-1">
                          Refrigerio / Logística ($)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={formData.associatedCosts}
                          onChange={(e) =>
                            setFormData({ ...formData, associatedCosts: e.target.value })
                          }
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white font-mono"
                        />
                      </div>
                    </div>

                    {/* Métodos de Pago Expresados para el Curso Cobrado */}
                    {!formData.isFree && (
                      <div className="p-3.5 bg-slate-950 rounded-xl border border-amber-500/40 space-y-2">
                        <label className="block text-xs font-bold text-amber-300">
                          💳 Métodos de Pago Expresados en el Formulario (Selecciona los válidos):
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {[
                            "Binance (Pabilo)",
                            "Zelle USD",
                            "Pago Móvil",
                            "Transferencia Bancaria Bs",
                            "Efectivo en Tienda OnProtec",
                          ].map((method) => {
                            const isSelected = (formData.paymentMethods || []).includes(method);
                            return (
                              <button
                                key={method}
                                type="button"
                                onClick={() => {
                                  const currentMethods = formData.paymentMethods || [];
                                  const next = isSelected
                                    ? currentMethods.filter((m) => m !== method)
                                    : [...currentMethods, method];
                                  setFormData({ ...formData, paymentMethods: next });
                                }}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition cursor-pointer ${
                                  isSelected
                                    ? "bg-amber-500 text-amber-950 border-amber-400 shadow-sm"
                                    : "bg-slate-900 border-slate-700 text-slate-400 hover:text-white"
                                }`}
                              >
                                {isSelected ? "✓ " : "+ "}
                                {method}
                              </button>
                            );
                          })}
                        </div>
                        <p className="text-[10px] text-slate-400">
                          Solo los métodos seleccionados aquí aparecerán en la lista desplegable del formulario de inscripción.
                        </p>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">
                      SKUs de Odoo vinculados a las prácticas:
                    </label>
                    <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-2.5 bg-slate-950 rounded-xl border border-slate-800">
                      {odooSkus.map((item) => {
                        const isSelected = formData.selectedSkus.includes(item.sku);
                        return (
                          <button
                            key={item.sku}
                            type="button"
                            onClick={() => {
                              const next = isSelected
                                ? formData.selectedSkus.filter((s) => s !== item.sku)
                                : [...formData.selectedSkus, item.sku];
                              setFormData({ ...formData, selectedSkus: next });
                            }}
                            className={`px-2 py-1 rounded text-[11px] font-mono border transition ${
                              isSelected
                                ? "bg-cyan-500/20 border-cyan-400 text-cyan-200 font-bold"
                                : "bg-slate-900 border-slate-800 text-slate-400"
                            }`}
                          >
                            {item.sku}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: NOTA PARA LA PRESENTACIÓN Y FOTOS DE PORTADA */}
              {activeTab === "portada" && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-slate-300 font-bold mb-1">
                      Descripción General de la Capacitación
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Resumen comercial y técnico del curso que verán los participantes en la portada..."
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[#e07b29] font-bold mb-1 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4" />
                      <span>
                        Nota para la Presentación (Requisitos, Temario Destacado o Aviso en Portada)
                      </span>
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Ej. Traer laptop con puerto RJ45 y software instalado. Se entregará certificado digital avalado por OnProtec y la marca..."
                      value={formData.presentationNotes}
                      onChange={(e) =>
                        setFormData({ ...formData, presentationNotes: e.target.value })
                      }
                      className="w-full bg-slate-950 border border-[#e07b29]/50 rounded-xl p-3 text-white"
                    />
                  </div>

                  {/* Carga y Gestión de Fotos de Portada */}
                  <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <span className="font-bold text-white block">
                          Fotos para la Portada / Banner del Curso
                        </span>
                        <span className="text-[11px] font-bold text-[#f4730a] block">
                          📐 Medida oficial del banner: 1080px × 550px (proporción horizontal)
                        </span>
                        <span className="text-[11px] text-slate-400">
                          Sube imágenes desde tu equipo o inserta el enlace de una foto promocional.
                        </span>
                      </div>

                      <label className="onprotec-btn-primary cursor-pointer inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shadow">
                        <Upload className="w-3.5 h-3.5" />
                        <span>Subir Foto desde Computador</span>
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                      </label>
                    </div>

                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="O pega aquí la URL de una imagen (https://... o /brand/onprotec-hero-banner.avif)"
                        value={newPhotoUrl}
                        onChange={(e) => setNewPhotoUrl(e.target.value)}
                        className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                      />
                      <button
                        type="button"
                        onClick={addPhotoByUrl}
                        className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-cyan-300 font-bold rounded-xl border border-slate-700"
                      >
                        Insertar URL
                      </button>
                    </div>

                    {/* Galería de fotos cargadas */}
                    {formData.coverPhotos.length > 0 ? (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                        {formData.coverPhotos.map((photo, index) => {
                          const isPrimary = formData.coverImageUrl === photo;
                          return (
                            <div
                              key={index}
                              className={`relative rounded-xl overflow-hidden border-2 group ${
                                isPrimary ? "border-[#e07b29]" : "border-slate-800"
                              }`}
                            >
                              <img
                                src={photo}
                                alt={`Portada ${index + 1}`}
                                className="w-full aspect-[1080/550] object-cover"
                                style={{ aspectRatio: "1080 / 550" }}
                              />
                              <div className="p-1.5 bg-slate-900/95 flex items-center justify-between gap-1">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setFormData({ ...formData, coverImageUrl: photo })
                                  }
                                  className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                                    isPrimary
                                      ? "bg-[#e07b29] text-white"
                                      : "bg-slate-800 text-slate-300 hover:text-white"
                                  }`}
                                >
                                  {isPrimary ? "★ Principal" : "Usar Principal"}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => removePhoto(index)}
                                  className="p-1 text-red-400 hover:bg-red-950/50 rounded"
                                  title="Quitar foto"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-slate-500 text-center py-4">
                        No hay fotos de portada cargadas. Se mostrará el banner corporativo de
                        OnProtec.
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 3: REDACTAR PREGUNTAS DEL FORMULARIO DE INSCRIPCIÓN */}
              {activeTab === "formulario" && (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-950 p-3.5 rounded-2xl border border-slate-800">
                    <div>
                      <span className="font-bold text-white block">
                        Constructor de Preguntas del Formulario de Inscripción
                      </span>
                      <span className="text-[11px] text-slate-400">
                        Además de los datos básicos (Nombre, Cédula/RIF, WhatsApp, Correo y Empresa),
                        puedes redactar las preguntas específicas para este curso.
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={addPaymentProofQuestion}
                        className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold flex items-center gap-1.5 flex-shrink-0 shadow-sm transition cursor-pointer"
                        title="Añadir campo específico para que el participante suba su comprobante de pago"
                      >
                        <UploadCloud className="w-3.5 h-3.5" />
                        <span>+ Comprobante de Pago</span>
                      </button>
                      <button
                        type="button"
                        onClick={addFormQuestion}
                        className="onprotec-btn-primary px-3.5 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-xl font-bold flex items-center gap-1.5 flex-shrink-0 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Agregar Pregunta</span>
                      </button>
                    </div>
                  </div>

                  {/* Edición del Título y Descripción de la Sección en el Formulario Público */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 p-4 bg-slate-900 border border-slate-800 rounded-2xl">
                    <div className="sm:col-span-6">
                      <label className="block text-xs font-bold text-slate-200 mb-1">
                        Título de la Sección en el Formulario Público *
                      </label>
                      <input
                        type="text"
                        placeholder="ej. Preguntas Específicas del Curso"
                        value={formData.formQuestionsTitle || ""}
                        onChange={(e) =>
                          setFormData({ ...formData, formQuestionsTitle: e.target.value })
                        }
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-white placeholder-slate-500 focus:outline-none focus:border-[#f4730a]"
                      />
                      <span className="text-[10px] text-slate-400 mt-1 block">
                        Este título se muestra en el Paso 2 del formulario público (editable a tu gusto).
                      </span>
                    </div>
                    <div className="sm:col-span-6">
                      <label className="block text-xs font-bold text-slate-200 mb-1">
                        Instrucción o Descripción de la Sección (Opcional)
                      </label>
                      <input
                        type="text"
                        placeholder="ej. Por favor responde para adaptar el temario a tu perfil"
                        value={formData.formQuestionsDescription || ""}
                        onChange={(e) =>
                          setFormData({ ...formData, formQuestionsDescription: e.target.value })
                        }
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-white placeholder-slate-500 focus:outline-none focus:border-[#f4730a]"
                      />
                      <span className="text-[10px] text-slate-400 mt-1 block">
                        Texto de ayuda que acompaña al título para orientar al participante.
                      </span>
                    </div>
                  </div>

                  {/* Métodos de Pago Habilitados en este Formulario */}
                  {!formData.isFree && (
                    <div className="p-4 bg-slate-900 border border-amber-500/40 rounded-2xl space-y-2.5">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <label className="block text-xs font-black text-amber-300">
                          💳 Métodos de Pago Habilitados en este Formulario (Activar / Desactivar)
                        </label>
                        <span className="text-[10px] text-slate-400 font-semibold">
                          Binance valida en línea vía Pabilo • Zelle/Pago Móvil/Transf. solicitan comprobante obligatorio
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {[
                          "Binance (Pabilo)",
                          "Zelle USD",
                          "Pago Móvil",
                          "Transferencia Bancaria Bs",
                          "Efectivo en Tienda OnProtec",
                        ].map((method) => {
                          const isSelected = (formData.paymentMethods || []).includes(method);
                          return (
                            <button
                              key={method}
                              type="button"
                              onClick={() => {
                                const currentMethods = formData.paymentMethods || [];
                                const next = isSelected
                                  ? currentMethods.filter((m) => m !== method)
                                  : [...currentMethods, method];
                                setFormData({ ...formData, paymentMethods: next });
                              }}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition cursor-pointer ${
                                isSelected
                                  ? "bg-amber-500 text-amber-950 border-amber-400 shadow-sm"
                                  : "bg-slate-950 border-slate-700 text-slate-400 hover:text-white"
                              }`}
                            >
                              {isSelected ? "✓ " : "+ "}
                              {method}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                    {formData.formQuestions.map((q, idx) => (
                      <div
                        key={q.id}
                        className="p-3.5 bg-slate-950 border border-slate-800 rounded-2xl space-y-2.5"
                      >
                        <div className="flex items-start gap-2.5">
                          <span className="px-2 py-1 rounded bg-slate-900 text-brand-400 font-mono font-bold text-[11px]">
                            #{idx + 1}
                          </span>
                          <div className="flex-1 grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                            <div className="sm:col-span-6">
                              <label className="block text-[10px] text-slate-400 mb-0.5">
                                Redacción de la Pregunta *
                              </label>
                              <input
                                type="text"
                                value={q.label}
                                onChange={(e) => updateFormQuestion(idx, { label: e.target.value })}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-semibold"
                              />
                            </div>
                            <div className="sm:col-span-3">
                              <label className="block text-[10px] text-slate-400 mb-0.5">
                                Tipo de Campo
                              </label>
                              <select
                                value={q.type}
                                onChange={(e) =>
                                  updateFormQuestion(idx, { type: e.target.value as any })
                                }
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-white font-semibold"
                              >
                                <option value="text">Texto Corto</option>
                                <option value="textarea">Párrafo / Comentario</option>
                                <option value="select">Lista Desplegable</option>
                                <option value="radio">Selección Única</option>
                                <option value="checkbox">Casilla Sí / No</option>
                                <option value="file">📎 Subir Archivo / Comprobante de Pago</option>
                              </select>
                            </div>
                            <div className="sm:col-span-3 flex items-end justify-between gap-2">
                              <label className="flex items-center gap-1.5 cursor-pointer py-1.5">
                                <input
                                  type="checkbox"
                                  checked={q.required}
                                  onChange={(e) =>
                                    updateFormQuestion(idx, { required: e.target.checked })
                                  }
                                />
                                <span className="text-slate-300">Obligatoria</span>
                              </label>
                              <button
                                type="button"
                                onClick={() => removeFormQuestion(idx)}
                                className="p-1.5 text-red-400 hover:bg-red-950/50 rounded-lg"
                                title="Eliminar pregunta"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>

                        {q.type === "file" && (
                          <div className="pl-8 pt-1">
                            <div className="p-2.5 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700/60 flex items-start gap-2.5 text-xs text-emerald-800 dark:text-emerald-300">
                              <UploadCloud className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                              <div>
                                <p className="font-extrabold text-emerald-900 dark:text-emerald-200">
                                  Zona de Carga de Comprobante de Pago
                                </p>
                                <p className="text-[11px] text-emerald-700 dark:text-emerald-400 mt-0.5">
                                  El participante podrá arrastrar o adjuntar su comprobante de pago (captura, voucher bancario o PDF de transferencia / Zelle / Pago Móvil) con vista previa instantánea.
                                </p>
                              </div>
                            </div>
                          </div>
                        )}

                        {(q.type === "select" || q.type === "radio") && (
                          <div className="pl-8">
                            <label className="block text-[10px] text-cyan-400 mb-0.5">
                              Opciones de respuesta (separadas por coma):
                            </label>
                            <input
                              type="text"
                              value={(q.options || []).join(", ")}
                              onChange={(e) =>
                                updateFormQuestion(idx, {
                                  options: e.target.value
                                    .split(",")
                                    .map((s) => s.trim())
                                    .filter(Boolean),
                                })
                              }
                              placeholder="Opción 1, Opción 2, Opción 3..."
                              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white"
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 4: CREAR ENCUESTA AL FINAL DEL CURSO */}
              {activeTab === "encuesta" && (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-950 p-3.5 rounded-2xl border border-slate-800">
                    <div>
                      <span className="font-bold text-white block">
                        Constructor de Encuesta al Final del Curso (Evaluación por QR)
                      </span>
                      <span className="text-[11px] text-slate-400">
                        Personaliza las preguntas que responderán los asistentes al finalizar la
                        capacitación.
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={addSurveyQuestion}
                      className="onprotec-btn-primary px-3.5 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-xl font-bold flex items-center gap-1.5 flex-shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Agregar Pregunta a la Encuesta</span>
                    </button>
                  </div>

                  <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                    {formData.surveyQuestions.map((sq, idx) => (
                      <div
                        key={sq.id}
                        className="p-3.5 bg-slate-950 border border-slate-800 rounded-2xl space-y-2.5"
                      >
                        <div className="flex items-start gap-2.5">
                          <span className="px-2 py-1 rounded bg-slate-900 text-amber-400 font-mono font-bold text-[11px]">
                            P{idx + 1}
                          </span>
                          <div className="flex-1 grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                            <div className="sm:col-span-6">
                              <label className="block text-[10px] text-slate-400 mb-0.5">
                                Pregunta de la Encuesta *
                              </label>
                              <input
                                type="text"
                                value={sq.label}
                                onChange={(e) =>
                                  updateSurveyQuestion(idx, { label: e.target.value })
                                }
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-semibold"
                              />
                            </div>
                            <div className="sm:col-span-3">
                              <label className="block text-[10px] text-slate-400 mb-0.5">
                                Escala / Tipo
                              </label>
                              <select
                                value={sq.type}
                                onChange={(e) =>
                                  updateSurveyQuestion(idx, { type: e.target.value as any })
                                }
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-white"
                              >
                                <option value="rating">Estrellas (1 a 5)</option>
                                <option value="nps">Escala NPS (0 a 10)</option>
                                <option value="select">Lista de Opciones</option>
                                <option value="textarea">Comentario Abierto</option>
                                <option value="text">Respuesta Corta</option>
                              </select>
                            </div>
                            <div className="sm:col-span-3 flex items-end justify-between gap-2">
                              <label className="flex items-center gap-1.5 cursor-pointer py-1.5">
                                <input
                                  type="checkbox"
                                  checked={sq.required}
                                  onChange={(e) =>
                                    updateSurveyQuestion(idx, { required: e.target.checked })
                                  }
                                />
                                <span className="text-slate-300">Obligatoria</span>
                              </label>
                              <button
                                type="button"
                                onClick={() => removeSurveyQuestion(idx)}
                                className="p-1.5 text-red-400 hover:bg-red-950/50 rounded-lg"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>

                        {(sq.type === "select" || sq.type === "radio") && (
                          <div className="pl-8">
                            <label className="block text-[10px] text-cyan-400 mb-0.5">
                              Opciones (separadas por coma):
                            </label>
                            <input
                              type="text"
                              value={(sq.options || []).join(", ")}
                              onChange={(e) =>
                                updateSurveyQuestion(idx, {
                                  options: e.target.value
                                    .split(",")
                                    .map((s) => s.trim())
                                    .filter(Boolean),
                                })
                              }
                              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white"
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Pie del Modal */}
              <div className="pt-4 border-t border-slate-800 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  {editingId && (
                    <button
                      type="button"
                      onClick={() => {
                        const t = trainings.find((item) => item.id === editingId);
                        if (t) setDeletingTraining(t);
                      }}
                      className="px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-red-600 text-rose-700 hover:text-white border border-rose-300 dark:bg-red-950/40 dark:hover:bg-red-900/60 dark:text-red-400 dark:border-red-800/60 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                      title="Eliminar esta capacitación de la base de datos"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Eliminar Capacitación</span>
                    </button>
                  )}
                  <span className="text-[11px] text-slate-400 hidden sm:inline">
                    {editingId
                      ? "Los cambios se reflejan de inmediato en la portada pública y encuesta QR."
                      : "Se generará automáticamente el código único y QR de encuesta."}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 font-semibold"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="onprotec-btn-primary px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold shadow-lg shadow-brand-500/20 flex items-center gap-1.5"
                  >
                    <Check className="w-4 h-4" />
                    <span>
                      {saving
                        ? "Guardando..."
                        : editingId
                        ? "Guardar Cambios"
                        : "Crear Capacitación"}
                    </span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Confirmación de Eliminación de Capacitación (Permiso Diana / Coordinación) */}
      {deletingTraining && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={(e) => {
            if (e.target === e.currentTarget && !isDeleting) setDeletingTraining(null);
          }}
          className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div className="bg-slate-900 border border-red-500/30 rounded-2xl w-full max-w-md p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto mb-4 text-red-400">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-center text-white mb-2">
              ¿Eliminar Capacitación?
            </h3>
            <p className="text-xs text-slate-300 text-center mb-4 leading-relaxed">
              ¿Estás seguro de que deseas eliminar permanentemente la capacitación{" "}
              <span className="font-bold text-white block mt-1">
                {deletingTraining.code} · {deletingTraining.name}
              </span>
            </p>
            <div className="p-3 bg-rose-50 dark:bg-red-950/30 border border-rose-300 dark:border-red-900/40 rounded-xl mb-5 text-[11px] text-rose-800 dark:text-red-300 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-red-400 shrink-0 mt-0.5" />
              <span>
                Esta acción eliminará el evento, su formulario de preguntas personalizadas y todos los registros vinculados de la base de datos persistente.
              </span>
            </div>
            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setDeletingTraining(null)}
                disabled={isDeleting}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDeleteTraining}
                disabled={isDeleting}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-xl transition shadow-lg shadow-red-600/20 flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>{isDeleting ? "Eliminando..." : "Sí, Eliminar"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
