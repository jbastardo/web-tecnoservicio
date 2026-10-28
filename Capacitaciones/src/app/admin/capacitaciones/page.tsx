"use client";

import React, { useState, useEffect } from "react";
import {
  CalendarCheck,
  Plus,
  Users,
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
  Sparkles,
  MessageSquare,
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
    maxCapacity: "18",
    price: "0",
    currency: "USD",
    status: "Planificado",
    selectedSkus: [] as string[],
    description: "",
    presentationNotes: "",
    coverImageUrl: "",
    coverPhotos: [] as string[],
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
      maxCapacity: "18",
      price: "0",
      currency: "USD",
      status: "Planificado",
      selectedSkus: [],
      description: "",
      presentationNotes:
        "📌 Nota para la Presentación: Capacitación práctica presencial en la Sala de Capacitaciones OnProtec (Aforo limitado a 18 participantes + 1 instructor).",
      coverImageUrl: "/brand/onprotec-hero-banner.avif",
      coverPhotos: ["/brand/onprotec-hero-banner.avif"],
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
      maxCapacity: String(t.maxCapacity ?? 18),
      price: String(t.price ?? 0),
      currency: t.currency || "USD",
      status: t.status || "Planificado",
      selectedSkus: Array.isArray(t.relatedSkus) ? t.relatedSkus : [],
      description: t.description || "",
      presentationNotes: t.presentationNotes || "",
      coverImageUrl: t.coverImageUrl || photos[0] || "",
      coverPhotos: photos,
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
        price: formData.price,
        currency: formData.currency,
        status: formData.status,
        relatedSkus: formData.selectedSkus,
        description: formData.description,
        presentationNotes: formData.presentationNotes,
        coverImageUrl: formData.coverImageUrl || formData.coverPhotos[0] || null,
        coverPhotos: formData.coverPhotos,
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

  // Filtrado y ordenamiento cronológico
  const filteredTrainings = trainings
    .filter((t) => {
      const q = search.toLowerCase();
      return (
        t.name?.toLowerCase().includes(q) ||
        t.code?.toLowerCase().includes(q) ||
        t.instructor?.toLowerCase().includes(q) ||
        t.brand?.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      const dateA = new Date(a.eventDate || 0).getTime();
      const dateB = new Date(b.eventDate || 0).getTime();
      return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
    });

  return (
    <div className="space-y-6">
      {toast && (
        <div className="fixed top-5 right-5 z-50 bg-emerald-950 border border-emerald-500 text-emerald-200 text-xs px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{toast}</span>
        </div>
      )}

      {/* Cintillo Widescreen de Cabecera y Acciones */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <CalendarCheck className="w-6 h-6 text-[#e07b29]" />
            <span>Gestión de Capacitaciones, Formularios, Portadas & Encuestas</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            {filteredTrainings.length} eventos registrados · Edita preguntas de inscripción, fotos de portada, notas de presentación y encuestas finales.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Buscar código (CAP-2026-039), curso o marca..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 w-64"
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

                  return (
                    <tr key={`${t.id}-${t.code}`} className="hover:bg-slate-800/40 transition">
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
                        <div className="flex items-center gap-2">
                          <span
                            className={`font-bold ${
                              isFull ? "text-amber-400" : "text-emerald-400"
                            }`}
                          >
                            {stats.totalOccupied} / {maxCap}
                          </span>
                          {isFull ? (
                            <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded border border-amber-500/30 font-bold">
                              Lleno
                            </span>
                          ) : (
                            <span className="text-[10px] bg-emerald-500/15 text-emerald-300 px-1.5 py-0.5 rounded border border-emerald-500/30 font-semibold">
                              {stats.availableSeats} libres
                            </span>
                          )}
                        </div>
                        <div className="w-24 bg-slate-800 h-1.5 rounded-full mt-1.5 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              isFull ? "bg-amber-500" : "bg-emerald-500"
                            }`}
                            style={{
                              width: `${Math.min(100, (stats.totalOccupied / maxCap) * 100)}%`,
                            }}
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
                        <span
                          className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
                            t.status === "Planificado" || t.status === "En Publicidad"
                              ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                              : "bg-slate-800 text-slate-300 border-slate-700"
                          }`}
                        >
                          {t.status}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => openEditModal(t, "general")}
                            className="px-2.5 py-1.5 bg-brand-600/20 hover:bg-brand-600/30 text-brand-300 border border-brand-500/40 rounded-lg text-xs font-bold flex items-center gap-1 transition"
                            title="Editar Capacitación, Preguntas, Portada y Notas"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>Editar</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => openSurveyViewer(t)}
                            className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1 transition"
                            title="Ver Código QR y Encuesta de Fin de Curso"
                          >
                            <QrCode className="w-3.5 h-3.5" />
                            <span>Encuesta ({sqCount})</span>
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
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
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
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
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
                        Aforo Máximo Sala
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={50}
                        value={formData.maxCapacity}
                        onChange={(e) => setFormData({ ...formData, maxCapacity: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-bold"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3 pt-2 border-t border-slate-800">
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">
                        Precio Entrada ($)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">
                        Costo Publicidad ($)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.adCosts}
                        onChange={(e) => setFormData({ ...formData, adCosts: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">
                        Costos Refrigerio/Log ($)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.associatedCosts}
                        onChange={(e) =>
                          setFormData({ ...formData, associatedCosts: e.target.value })
                        }
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-white"
                      />
                    </div>
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
                          Fotos para la Portada del Curso
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
                                className="w-full h-28 object-cover"
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
                    <button
                      type="button"
                      onClick={addFormQuestion}
                      className="onprotec-btn-primary px-3.5 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-xl font-bold flex items-center gap-1.5 flex-shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Agregar Pregunta</span>
                    </button>
                  </div>

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
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-white"
                              >
                                <option value="text">Texto Corto</option>
                                <option value="textarea">Párrafo / Comentario</option>
                                <option value="select">Lista Desplegable</option>
                                <option value="radio">Selección Única</option>
                                <option value="checkbox">Casilla Sí / No</option>
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
                <div className="text-[11px] text-slate-400">
                  {editingId
                    ? "Los cambios se reflejan de inmediato en la portada pública y encuesta QR."
                    : "Se generará automáticamente el código único y QR de encuesta."}
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
    </div>
  );
}
