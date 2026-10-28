"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Users,
  Calendar,
  Clock,
  ShieldCheck,
  CreditCard,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  Layers,
  MapPin,
  ExternalLink,
  ChevronRight,
  FileText,
  QrCode,
  Globe,
  Phone,
  Image as ImageIcon,
} from "lucide-react";
import { FormQuestion } from "@/types";
import { fmtLocalDate, fmtLocalHour, formatCurrency } from "@/utils/formatUtils";
import { ThemeToggle } from "@/components/ThemeToggle";
import { OnprotecBrand, ONPROTEC_PARTNER_BRANDS } from "@/components/OnprotecBrand";

export default function HomePage() {
  const [trainings, setTrainings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTraining, setSelectedTraining] = useState<any | null>(null);
  const [activeCoverIdx, setActiveCoverIdx] = useState(0);
  const [brandFilter, setBrandFilter] = useState("all");

  // Formulario base
  const [form, setForm] = useState({
    name: "",
    docType: "V",
    docNumber: "",
    phone: "",
    email: "",
    company: "",
    city: "Caracas",
    paymentMethod: "Pabilo",
    paymentReference: "",
    specialNotes: "",
  });

  // Respuestas a las preguntas redactadas del formulario
  const [customAnswers, setCustomAnswers] = useState<Record<string, any>>({});

  const [submitting, setSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<any | null>(null);

  useEffect(() => {
    fetch("/api/capacitaciones?order=desc")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data.length > 0) {
          setTrainings(data.data);
          // Priorizar el evento Planificado o más reciente (ej. CAP-2026-039)
          const planned =
            data.data.find(
              (t: any) => t.status === "Planificado" || t.status === "En Publicidad"
            ) || data.data[0];
          setSelectedTraining(planned);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    setActiveCoverIdx(0);
    setCustomAnswers({});
    setSubmissionResult(null);
  }, [selectedTraining?.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTraining) return;

    setSubmitting(true);
    setSubmissionResult(null);

    try {
      const res = await fetch("/api/inscripciones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trainingId: selectedTraining.id,
          ...form,
          customAnswers,
        }),
      });

      const data = await res.json();
      setSubmissionResult(data);
      if (data.success) {
        const refreshed = await fetch("/api/capacitaciones?order=desc").then((r) => r.json());
        if (refreshed.success) {
          setTrainings(refreshed.data);
          const updatedSelected = refreshed.data.find(
            (t: any) => Number(t.id) === Number(selectedTraining.id)
          );
          if (updatedSelected) setSelectedTraining(updatedSelected);
        }
      }
    } catch (err: any) {
      setSubmissionResult({ success: false, error: err.message || "Error al registrar" });
    } finally {
      setSubmitting(false);
    }
  };

  const filteredTrainings =
    brandFilter === "all"
      ? trainings
      : trainings.filter((t) =>
          (t.brand || "").toLowerCase().includes(brandFilter.toLowerCase())
        );

  const selectedPhotos: string[] =
    selectedTraining?.coverPhotos && selectedTraining.coverPhotos.length > 0
      ? selectedTraining.coverPhotos
      : selectedTraining?.coverImageUrl
      ? [selectedTraining.coverImageUrl]
      : ["/brand/onprotec-hero-banner.avif"];

  const selectedQuestions: FormQuestion[] = Array.isArray(selectedTraining?.formQuestions)
    ? selectedTraining.formQuestions
    : [];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Franja Superior Oficial OnProtec */}
      <div className="h-1.5 bg-gradient-to-r from-[#1a1b4b] via-[#e07b29] to-brand-500 w-full" />

      {/* Barra de Navegación Superior */}
      <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
          <OnprotecBrand
            subtitle="«La Tienda del Instalador» · Sala de Capacitaciones (Caracas)"
            href="/"
          />

          <div className="flex items-center gap-2.5">
            <div className="hidden xl:flex items-center gap-2 bg-slate-800/80 px-3 py-1.5 rounded-full border border-slate-700 text-xs">
              <Users className="w-3.5 h-3.5 text-[#e07b29]" />
              <span>
                Aforo Sala: <strong className="text-white">18 Participantes</strong> + 1 Instructor
              </span>
            </div>

            <a
              href="https://www.onprotec.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden md:flex items-center gap-1.5 text-xs bg-slate-800/80 hover:bg-slate-800 text-slate-200 px-3 py-1.5 rounded-xl border border-slate-700 transition"
            >
              <Globe className="w-3.5 h-3.5 text-cyan-400" />
              <span>Tienda www.onprotec.com</span>
            </a>

            {/* Botón de Vista Claro / Oscuro */}
            <ThemeToggle />

            <Link
              href="/admin"
              className="onprotec-btn-primary text-xs bg-[#1a1b4b] hover:bg-brand-800 text-white px-3.5 py-2 rounded-xl border border-[#e07b29]/50 transition flex items-center gap-1.5 font-semibold shadow-sm"
            >
              <span>Gestión Administrativa</span>
              <ChevronRight className="w-3.5 h-3.5 text-[#e07b29]" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Portada Corporativa OnProtec */}
      <section className="relative overflow-hidden pt-8 pb-10 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950 border-b border-slate-800/80">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#e07b29]/15 border border-[#e07b29]/40 text-[#e07b29] text-xs font-bold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>
                  OnProtec C.A. · Seguridad Electrónica, CCTV, Control de Acceso, Redes y Energía
                </span>
              </div>

              <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
                Centro de Formación y Certificación Técnica{" "}
                <span className="text-[#e07b29]">OnProtec®</span>
              </h1>

              <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-2xl">
                Capacitaciones prácticas presenciales en nuestra sede de{" "}
                <strong>Caracas (Av. Los Estadios con Calle Edison)</strong> con laboratorios en
                vivo, equipos reales de nuestro catálogo en{" "}
                <a
                  href="https://www.onprotec.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-cyan-400 underline font-semibold"
                >
                  www.onprotec.com
                </a>{" "}
                y especialistas certificados de las marcas líderes.
              </p>

              {/* Cintillo de Marcas Oficiales de www.onprotec.com */}
              <div className="pt-2 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setBrandFilter("all")}
                  className={`px-3 py-1 rounded-full text-xs font-bold border transition ${
                    brandFilter === "all"
                      ? "bg-[#e07b29] text-white border-[#e07b29] keep-white"
                      : "bg-slate-900 text-slate-300 border-slate-700 hover:border-slate-500"
                  }`}
                >
                  Todas las Marcas ({trainings.length})
                </button>
                {ONPROTEC_PARTNER_BRANDS.map((b) => (
                  <button
                    key={b.name}
                    type="button"
                    onClick={() =>
                      setBrandFilter(brandFilter === b.name.split(" ")[0] ? "all" : b.name.split(" ")[0])
                    }
                    className={`px-3 py-1 rounded-full text-xs font-semibold border transition ${
                      brandFilter === b.name.split(" ")[0]
                        ? "bg-brand-600 text-white border-brand-500"
                        : "bg-slate-900/90 text-slate-300 border-slate-800 hover:border-slate-600"
                    }`}
                  >
                    {b.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Tarjeta de Portada Destacada del Curso Seleccionado */}
            <div className="lg:col-span-5">
              {selectedTraining && (
                <div className="bg-slate-900 border-2 border-[#e07b29]/50 rounded-3xl overflow-hidden shadow-2xl">
                  <div className="relative h-48 sm:h-52 bg-[#1a1b4b] overflow-hidden">
                    <img
                      src={selectedPhotos[activeCoverIdx] || "/brand/onprotec-hero-banner.avif"}
                      alt={selectedTraining.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-transparent" />
                    <div className="absolute top-3 left-3 flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#1a1b4b]/90 text-white border border-[#e07b29] keep-white">
                        {selectedTraining.code}
                      </span>
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#e07b29] text-white keep-white">
                        {selectedTraining.brand || "OnProtec"}
                      </span>
                    </div>
                    <div className="absolute bottom-3 left-3 right-3">
                      <h2 className="text-base sm:text-lg font-extrabold text-white keep-white leading-snug line-clamp-2">
                        {selectedTraining.name}
                      </h2>
                    </div>
                  </div>

                  {/* Miniaturas si tiene varias fotos de portada */}
                  {selectedPhotos.length > 1 && (
                    <div className="px-4 py-2 bg-slate-950 flex items-center gap-2 overflow-x-auto border-b border-slate-800">
                      <span className="text-[10px] text-slate-400 flex items-center gap-1">
                        <ImageIcon className="w-3 h-3 text-[#e07b29]" /> Portadas:
                      </span>
                      {selectedPhotos.map((ph, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setActiveCoverIdx(i)}
                          className={`w-10 h-7 rounded overflow-hidden border-2 flex-shrink-0 ${
                            activeCoverIdx === i ? "border-[#e07b29]" : "border-slate-700 opacity-60"
                          }`}
                        >
                          <img src={ph} alt="" className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Nota para la Presentación */}
                  {selectedTraining.presentationNotes && (
                    <div className="p-4 bg-[#fdf6ef] text-[#1a1b4b] border-l-4 border-[#e07b29] text-xs leading-relaxed">
                      <strong className="block font-extrabold text-[#1a1b4b] uppercase tracking-wider text-[10px] mb-0.5">
                        Nota de Presentación del Evento:
                      </strong>
                      <span className="text-slate-800 font-medium">
                        {selectedTraining.presentationNotes}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Contenido Principal: Widescreen Horizontal Layout */}
      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Columna Izquierda: Cursos Disponibles y Aforo (7 columnas) */}
          <div className="lg:col-span-7 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Calendar className="w-5 h-5 text-[#e07b29]" />
                <span>Calendario de Capacitaciones OnProtec ({filteredTrainings.length})</span>
              </h2>
              <span className="text-xs text-slate-400">
                Haz clic en una capacitación para inscribirte o ver su presentación
              </span>
            </div>

            {loading ? (
              <div className="p-12 text-center text-slate-400">Cargando eventos...</div>
            ) : (
              <div className="space-y-4">
                {filteredTrainings.map((training) => {
                  const isSelected = selectedTraining?.id === training.id;
                  const maxCap = Number(training.maxCapacity) || 18;
                  const stats = training.stats || {
                    totalOccupied: 0,
                    availableSeats: maxCap,
                    isFull: false,
                  };

                  return (
                    <div
                      key={`${training.id}-${training.code}`}
                      onClick={() => setSelectedTraining(training)}
                      className={`cursor-pointer rounded-2xl border p-5 transition-all duration-200 relative overflow-hidden ${
                        isSelected
                          ? "bg-slate-900 border-[#e07b29] shadow-xl ring-1 ring-[#e07b29]"
                          : "bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900/90"
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap mb-2">
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#e07b29]/20 text-[#e07b29] border border-[#e07b29]/40">
                              {training.brand || training.type}
                            </span>
                            <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-brand-500/20 text-brand-300 border border-brand-500/30">
                              {training.type}
                            </span>
                            <span className="text-xs text-slate-400 font-mono font-bold">
                              {training.code}
                            </span>
                            {stats.isFull ? (
                              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3" />
                                {maxCap}/{maxCap} Cupos Llenos (Lista de Espera)
                              </span>
                            ) : (
                              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                                {stats.availableSeats} cupos disponibles de {maxCap}
                              </span>
                            )}
                          </div>

                          <h3 className="text-lg font-bold text-white leading-snug">
                            {training.name}
                          </h3>

                          {training.description && (
                            <p className="text-sm text-slate-400 mt-1.5 line-clamp-2">
                              {training.description}
                            </p>
                          )}

                          {training.presentationNotes && (
                            <div className="mt-2.5 p-2.5 rounded-xl bg-slate-950/90 border-l-4 border-[#e07b29] text-xs text-slate-300">
                              {training.presentationNotes}
                            </div>
                          )}

                          {/* Metadatos Horarios y Ubicación */}
                          <div className="mt-4 flex flex-wrap gap-y-2 gap-x-5 text-xs text-slate-300">
                            <div className="flex items-center gap-1.5">
                              <Calendar className="w-4 h-4 text-cyan-400" />
                              <span>{fmtLocalDate(training.eventDate)}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Clock className="w-4 h-4 text-cyan-400" />
                              <span>{fmtLocalHour(training.eventDate)} (Hora Vzla)</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <MapPin className="w-4 h-4 text-[#e07b29]" />
                              <span>Sede OnProtec Caracas</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <ShieldCheck className="w-4 h-4 text-cyan-400" />
                              <span>{training.instructor}</span>
                            </div>
                          </div>

                          {/* Barra de Ocupación de la Sala */}
                          <div className="mt-4 pt-3 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="flex-1">
                              <div className="flex justify-between items-center text-xs mb-1">
                                <span className="text-slate-400">Ocupación de la Sala:</span>
                                <span className="font-semibold text-slate-200">
                                  {stats.totalOccupied} / {maxCap} participantes
                                </span>
                              </div>
                              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all duration-500 ${
                                    stats.isFull
                                      ? "bg-amber-500"
                                      : stats.totalOccupied >= 15
                                      ? "bg-gradient-to-r from-brand-500 to-amber-500"
                                      : "bg-gradient-to-r from-cyan-400 to-brand-500"
                                  }`}
                                  style={{
                                    width: `${Math.min(
                                      100,
                                      (stats.totalOccupied / maxCap) * 100
                                    )}%`,
                                  }}
                                />
                              </div>
                            </div>

                            <Link
                              href={`/encuesta/${training.id}`}
                              onClick={(e) => e.stopPropagation()}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-amber-300 border border-slate-700 transition self-start sm:self-center"
                            >
                              <QrCode className="w-3.5 h-3.5" />
                              <span>Encuesta Fin de Curso</span>
                            </Link>
                          </div>
                        </div>

                        {/* Precio e Imagen lateral */}
                        <div className="text-right sm:min-w-[110px] flex sm:flex-col items-center sm:items-end justify-between gap-2">
                          <div>
                            <span className="text-xs text-slate-400 block">Inversión</span>
                            <span className="text-2xl font-black text-white">
                              {Number(training.price) > 0
                                ? formatCurrency(training.price, training.currency)
                                : "GRATIS"}
                            </span>
                          </div>
                          {training.coverImageUrl && (
                            <img
                              src={training.coverImageUrl}
                              alt={training.name}
                              className="w-20 h-14 rounded-xl object-cover border border-slate-700 hidden sm:block"
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Columna Derecha: Formulario Dinámico de Registro (5 columnas) */}
          <div className="lg:col-span-5 sticky top-20">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
              <div className="h-1.5 bg-gradient-to-r from-[#1a1b4b] via-[#e07b29] to-brand-500 absolute top-0 left-0 right-0" />

              <div className="border-b border-slate-800 pb-4 mb-5">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-extrabold text-white flex items-center gap-2">
                    <FileText className="w-5 h-5 text-[#e07b29]" />
                    <span>Formulario de Inscripción</span>
                  </h3>
                  {selectedTraining && (
                    <span className="text-xs font-mono font-bold text-brand-300 bg-brand-500/15 px-2.5 py-1 rounded-lg border border-brand-500/30">
                      {selectedTraining.code}
                    </span>
                  )}
                </div>
                {selectedTraining && (
                  <p className="text-xs text-slate-400 mt-1">
                    Curso seleccionado:{" "}
                    <strong className="text-white">{selectedTraining.name}</strong>
                  </p>
                )}
              </div>

              {selectedTraining?.stats?.isFull && (
                <div className="mb-5 bg-amber-500/10 border border-amber-500/30 rounded-xl p-3.5 text-xs text-amber-200 flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <strong className="font-semibold block text-amber-300">
                      Aforo de la sala completo ({selectedTraining.maxCapacity || 18} participantes)
                    </strong>
                    Al completar este formulario entrarás directamente en nuestra{" "}
                    <strong>Lista de Espera prioritaria</strong>. Si se libera un cupo te
                    contactaremos de inmediato por WhatsApp.
                  </div>
                </div>
              )}

              {submissionResult && (
                <div
                  className={`mb-5 p-4 rounded-xl text-sm border flex items-start gap-3 ${
                    submissionResult.success
                      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-200"
                      : "bg-red-500/10 border-red-500/30 text-red-200"
                  }`}
                >
                  {submissionResult.success ? (
                    <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  )}
                  <div>
                    <strong className="font-semibold block">
                      {submissionResult.success ? "¡Inscripción Confirmada!" : "Atención"}
                    </strong>
                    <span>{submissionResult.message || submissionResult.error}</span>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-3.5 text-sm">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Nombre y Apellido Completo *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Juan Carlos Bastardo"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-[#e07b29] text-sm"
                  />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-1">
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Tipo Doc *
                    </label>
                    <select
                      value={form.docType}
                      onChange={(e) => setForm({ ...form, docType: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-2 text-white focus:outline-none focus:border-[#e07b29] text-sm"
                    >
                      <option value="V">V - Venezolano</option>
                      <option value="E">E - Extranjero</option>
                      <option value="J">J - Jurídico</option>
                      <option value="G">G - Gobierno</option>
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Cédula / RIF *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ej. 18456123"
                      value={form.docNumber}
                      onChange={(e) => setForm({ ...form, docNumber: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-[#e07b29] text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      WhatsApp (Celular) *
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="+584121234567"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-[#e07b29] text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Correo Electrónico *
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="integrador@empresa.com"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-[#e07b29] text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Empresa / Razón Social
                    </label>
                    <input
                      type="text"
                      placeholder="Ej. Soluciones CCTV C.A."
                      value={form.company}
                      onChange={(e) => setForm({ ...form, company: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-[#e07b29] text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Ciudad / Estado
                    </label>
                    <input
                      type="text"
                      placeholder="Caracas"
                      value={form.city}
                      onChange={(e) => setForm({ ...form, city: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-[#e07b29] text-sm"
                    />
                  </div>
                </div>

                {/* Preguntas Dinámicas Redactadas para este Curso */}
                {selectedQuestions.length > 0 && (
                  <div className="pt-3 border-t border-slate-800 space-y-3">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#e07b29] block">
                      Preguntas del Evento
                    </span>
                    {selectedQuestions.map((q) => (
                      <div key={q.id}>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">
                          {q.label} {q.required && <span className="text-[#e07b29]">*</span>}
                        </label>
                        {q.type === "textarea" ? (
                          <textarea
                            rows={2}
                            required={q.required}
                            placeholder={q.placeholder || "Escribe aquí..."}
                            value={customAnswers[q.id] || ""}
                            onChange={(e) =>
                              setCustomAnswers({ ...customAnswers, [q.id]: e.target.value })
                            }
                            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-white text-xs focus:outline-none focus:border-[#e07b29]"
                          />
                        ) : q.type === "select" ? (
                          <select
                            required={q.required}
                            value={customAnswers[q.id] || ""}
                            onChange={(e) =>
                              setCustomAnswers({ ...customAnswers, [q.id]: e.target.value })
                            }
                            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-white text-xs focus:outline-none focus:border-[#e07b29]"
                          >
                            <option value="">Seleccione una opción...</option>
                            {(q.options || []).map((opt) => (
                              <option key={opt} value={opt}>
                                {opt}
                              </option>
                            ))}
                          </select>
                        ) : q.type === "radio" ? (
                          <div className="flex flex-wrap gap-2">
                            {(q.options || []).map((opt) => (
                              <label
                                key={opt}
                                className="flex items-center gap-1.5 text-xs bg-slate-950 border border-slate-700 px-3 py-1.5 rounded-lg cursor-pointer"
                              >
                                <input
                                  type="radio"
                                  name={q.id}
                                  required={q.required}
                                  checked={customAnswers[q.id] === opt}
                                  onChange={() =>
                                    setCustomAnswers({ ...customAnswers, [q.id]: opt })
                                  }
                                />
                                <span>{opt}</span>
                              </label>
                            ))}
                          </div>
                        ) : q.type === "checkbox" ? (
                          <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={Boolean(customAnswers[q.id])}
                              onChange={(e) =>
                                setCustomAnswers({ ...customAnswers, [q.id]: e.target.checked })
                              }
                            />
                            <span>Sí, confirmo</span>
                          </label>
                        ) : (
                          <input
                            type="text"
                            required={q.required}
                            placeholder={q.placeholder || ""}
                            value={customAnswers[q.id] || ""}
                            onChange={(e) =>
                              setCustomAnswers({ ...customAnswers, [q.id]: e.target.value })
                            }
                            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-white text-xs focus:outline-none focus:border-[#e07b29]"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Métodos de Pago (solo si el curso tiene costo > 0) */}
                {Number(selectedTraining?.price) > 0 && (
                  <div className="pt-3 border-t border-slate-800">
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Método de Pago ({formatCurrency(selectedTraining.price, selectedTraining.currency)})
                    </label>
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      <button
                        type="button"
                        onClick={() => setForm({ ...form, paymentMethod: "Pabilo" })}
                        className={`p-2.5 rounded-xl border text-xs text-left transition ${
                          form.paymentMethod === "Pabilo"
                            ? "bg-brand-500/20 border-brand-500 text-white font-semibold"
                            : "bg-slate-950 border-slate-700 text-slate-400"
                        }`}
                      >
                        <strong className="block text-brand-300">Pabilo Pay</strong>
                        <span>Pago Móvil / Tarjeta</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setForm({ ...form, paymentMethod: "Binance (USDT)" })}
                        className={`p-2.5 rounded-xl border text-xs text-left transition ${
                          form.paymentMethod === "Binance (USDT)"
                            ? "bg-brand-500/20 border-brand-500 text-white font-semibold"
                            : "bg-slate-950 border-slate-700 text-slate-400"
                        }`}
                      >
                        <strong className="block text-slate-200">Binance / Zelle</strong>
                        <span>Conciliación Manual</span>
                      </button>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        Referencia de Pago / Comprobante
                      </label>
                      <input
                        type="text"
                        placeholder="Ej. PAB-884920 o 019283"
                        value={form.paymentReference}
                        onChange={(e) => setForm({ ...form, paymentReference: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-white text-sm font-mono"
                      />
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting || !selectedTraining}
                  className="onprotec-btn-primary w-full mt-3 bg-gradient-to-r from-[#1a1b4b] via-brand-600 to-[#e07b29] hover:opacity-95 text-white font-bold py-3 px-4 rounded-xl shadow-lg transition duration-150 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {submitting ? (
                    "Procesando Inscripción..."
                  ) : selectedTraining?.stats?.isFull ? (
                    <>
                      <span>Unirme a la Lista de Espera Prioritaria</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  ) : (
                    <>
                      <span>Completar Inscripción en Sala OnProtec</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </main>

      {/* Footer Corporativo con Recursos de www.onprotec.com */}
      <footer className="bg-slate-950 border-t border-slate-800/80 py-8 text-xs text-slate-400">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img
              src="/brand/onprotec-logo-full.png"
              alt="OnProtec"
              className="h-7 w-auto bg-[#1a1b4b] p-1 rounded-lg border border-[#e07b29]/40"
            />
            <div>
              <p className="font-bold text-white">
                © 2026 OnProtec C.A. — «La Tienda del Instalador»
              </p>
              <p className="text-[11px] text-slate-500">
                Av. Los Estadios con Calle Edison, Caracas · Soluciones en CCTV, Redes, Control de
                Acceso y Energía.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <a
              href="https://www.onprotec.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white flex items-center gap-1"
            >
              <Globe className="w-3.5 h-3.5 text-[#e07b29]" />
              <span>www.onprotec.com</span>
            </a>
            <a
              href="https://api.whatsapp.com/send/?phone=584122319086"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white flex items-center gap-1"
            >
              <Phone className="w-3.5 h-3.5 text-emerald-400" />
              <span>WhatsApp +58 412-2319086</span>
            </a>
            <Link href="/admin" className="text-brand-400 hover:underline font-semibold">
              Portal Administrativo
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
