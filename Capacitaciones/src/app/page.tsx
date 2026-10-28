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
  MapPin,
  ExternalLink,
  FileText,
  QrCode,
  Phone,
  Image as ImageIcon,
  Cpu,
  Award,
  Zap,
  Search,
  CheckCircle2,
  Building2,
  UserCheck,
  Radio,
  Lock,
  Wifi,
  Camera,
  Server,
  ChevronRight,
} from "lucide-react";
import { FormQuestion } from "@/types";
import { fmtLocalDate, fmtLocalHour, formatCurrency } from "@/utils/formatUtils";
import { ThemeToggle } from "@/components/ThemeToggle";
import { OnprotecBrand, ONPROTEC_PARTNER_BRANDS } from "@/components/OnprotecBrand";

const ONPROTEC_CATEGORIES = [
  { id: "all", label: "TODOS LOS CURSOS", pillLabel: "TODAS", icon: Sparkles },
  { id: "REDES", label: "REDES & WIFI", pillLabel: "REDES", icon: Wifi, match: ["tp-link", "omada", "ubiquiti", "unifi", "redes", "mikrotik", "ruijie"] },
  { id: "CCTV", label: "CCTV & VIDEOVIGILANCIA", pillLabel: "CCTV", icon: Camera, match: ["hikvision", "dahua", "dolynk", "hikcentral", "ezviz", "cctv", "camara"] },
  { id: "SEGURIDAD", label: "SEGURIDAD & ACCESO", pillLabel: "SEGURIDAD", icon: ShieldCheck, match: ["watchguard", "seguridad", "acceso", "alarma", "biometrico", "zkteco"] },
  { id: "COMPUTACION", label: "ENERGÍA & COMPUTACIÓN", pillLabel: "COMPUTACIÓN", icon: Server, match: ["marsriva", "ups", "energia", "computacion", "servidor"] },
];

export default function HomePage() {
  const [trainings, setTrainings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTraining, setSelectedTraining] = useState<any | null>(null);
  const [activeCoverIdx, setActiveCoverIdx] = useState(0);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [brandFilter, setBrandFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Formulario de Fricción Cero con Etiquetas Flotantes (Floating Labels)
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

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const handleSelectAndRegister = (training: any) => {
    setSelectedTraining(training);
    scrollToSection("registro-express");
  };

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

  const filteredTrainings = trainings.filter((t) => {
    const textBlob = `${t.title || ""} ${t.brand || ""} ${t.topic || ""} ${t.code || ""}`.toLowerCase();

    if (searchQuery.trim() !== "" && !textBlob.includes(searchQuery.toLowerCase().trim())) {
      return false;
    }

    if (brandFilter !== "all" && !(t.brand || "").toLowerCase().includes(brandFilter.toLowerCase())) {
      return false;
    }

    if (categoryFilter !== "all") {
      const cat = ONPROTEC_CATEGORIES.find((c) => c.id === categoryFilter);
      if (cat?.match && !cat.match.some((kw) => textBlob.includes(kw))) {
        return false;
      }
    }

    return true;
  });

  const coverGallery: string[] = selectedTraining
    ? Array.isArray(selectedTraining.coverPhotos) && selectedTraining.coverPhotos.length > 0
      ? selectedTraining.coverPhotos
      : selectedTraining.coverImageUrl
      ? [selectedTraining.coverImageUrl]
      : []
    : [];

  const activeFormQuestions: FormQuestion[] = Array.isArray(selectedTraining?.formQuestions)
    ? selectedTraining.formQuestions
    : [];

  const maxSeats = Number(selectedTraining?.maxCapacity || 18);
  const occupiedSeats = Number(selectedTraining?.occupiedCount || 0);
  const availableSeats = Math.max(0, maxSeats - occupiedSeats);
  const occupancyPct = Math.min(100, Math.round((occupiedSeats / maxSeats) * 100));

  return (
    <div className="min-h-screen flex flex-col bg-[#f8f9fc] dark:bg-[#0b0e17] text-[#1a1c29] dark:text-slate-100 transition-colors duration-200">
      {/* =====================================================================
          1. CINTILLO SUPERIOR OFICIAL ONPROTEC.COM (#f4730a)
      ===================================================================== */}
      <div className="w-full bg-[#f4730a] text-white py-2 px-4 text-center text-[11px] sm:text-xs font-extrabold tracking-wider uppercase shadow-sm">
        <div className="max-w-[1640px] mx-auto flex flex-wrap items-center justify-center gap-x-6 gap-y-1">
          <span>
            DELIVERY EN CARACAS GRATIS PARA COMPRAS MAYORES A 50$ EN PÁGINA WEB
          </span>
          <span className="hidden md:inline opacity-60">•</span>
          <span className="hidden sm:inline-flex items-center gap-1.5 bg-black/15 px-2.5 py-0.5 rounded-full">
            <Sparkles className="w-3.5 h-3.5" />
            SALA DE CAPACITACIONES EXCLUSIVA ONPROTEC® — AFORO VIP 18 INSTALADORES
          </span>
        </div>
      </div>

      {/* =====================================================================
          2. HEADER CORPORATIVO ONPROTEC.COM (FONDO BLANCO PURO + BUSCADOR + NAV)
      ===================================================================== */}
      <header className="sticky top-0 z-50 bg-white/95 dark:bg-[#111526]/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 shadow-[0_4px_20px_rgba(42,40,92,0.05)]">
        <div className="max-w-[1640px] mx-auto px-4 sm:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4">
          {/* Logo Oficial */}
          <OnprotecBrand />

          {/* Barra de Búsqueda Estilo OnProtec.com */}
          <div className="flex-1 max-w-md mx-auto hidden lg:block">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar certificación, marca (Dahua, Hikvision, Omada) o código..."
                className="w-full bg-[#f3f4f6] dark:bg-slate-900 border border-transparent focus:border-[#f4730a] focus:bg-white dark:focus:bg-slate-900 rounded-full pl-5 pr-11 py-2.5 text-xs font-medium text-slate-800 dark:text-slate-100 placeholder-slate-400 outline-none transition-all"
              />
              <Search className="w-4 h-4 text-slate-500 absolute right-4 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          {/* Acciones Derecha */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            <a
              href="#registro-express"
              className="hidden sm:inline-flex items-center gap-2 bg-[#f4730a] hover:bg-[#ef7922] text-white text-xs font-extrabold uppercase tracking-wider px-5 py-2.5 rounded-full shadow-md shadow-[#f4730a]/25 transition-all hover:-translate-y-0.5"
            >
              Asegura tu cupo
              <ArrowRight className="w-3.5 h-3.5" />
            </a>

            <a
              href="https://www.onprotec.com"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#2a285c] dark:text-slate-200 hover:text-[#f4730a] px-3 py-2 rounded-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/70 transition-colors"
            >
              Tienda Web <ExternalLink className="w-3.5 h-3.5 text-[#f4730a]" />
            </a>

            <ThemeToggle />

            <Link
              href="/admin"
              className="inline-flex items-center gap-1.5 text-xs font-extrabold text-white bg-[#2a285c] hover:bg-[#1f1d47] px-4 py-2.5 rounded-full transition-all shadow-sm"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-[#f4730a]" />
              <span>Gestión Admin</span>
            </Link>
          </div>
        </div>

        {/* Sub-barra de Navegación centrada idéntica a onprotec.com */}
        <div className="border-t border-slate-100 dark:border-slate-800/80 bg-white dark:bg-[#111526]">
          <nav className="max-w-[1640px] mx-auto px-4 sm:px-8 py-2 flex items-center justify-center gap-5 sm:gap-8 overflow-x-auto text-xs font-bold text-[#1a1c29] dark:text-slate-300 whitespace-nowrap">
            <button
              type="button"
              onClick={() => scrollToSection("hero-sala")}
              className="hover:text-[#f4730a] transition-colors py-1"
            >
              Inicio Sala VIP
            </button>
            <button
              type="button"
              onClick={() => scrollToSection("propuesta-valor")}
              className="hover:text-[#f4730a] transition-colors py-1"
            >
              ¿Por qué Certificarte?
            </button>
            <button
              type="button"
              onClick={() => scrollToSection("calendario-temario")}
              className="hover:text-[#f4730a] transition-colors py-1 flex items-center gap-1"
            >
              <span className="w-2 h-2 rounded-full bg-[#f4730a]" />
              Calendario & Temario
            </button>
            <button
              type="button"
              onClick={() => scrollToSection("metodologia-timeline")}
              className="hover:text-[#f4730a] transition-colors py-1"
            >
              Línea de Tiempo
            </button>
            <button
              type="button"
              onClick={() => scrollToSection("registro-express")}
              className="text-[#f4730a] font-extrabold transition-colors py-1"
            >
              Inscripción Express
            </button>
            <button
              type="button"
              onClick={() => scrollToSection("marcas-autoridad")}
              className="hover:text-[#f4730a] transition-colors py-1"
            >
              Marcas & Certificaciones
            </button>
            <a
              href="https://onprotec.com/lp/onprotec"
              target="_blank"
              rel="noreferrer"
              className="hover:text-[#f4730a] transition-colors py-1 hidden md:inline"
            >
              Catálogo OnProtec
            </a>
          </nav>
        </div>
      </header>

      {/* =====================================================================
          3. HERO SECTION (IMPACTO, ENGANCHE Y EXCLUSIVIDAD DE SALA)
          Inspirado directamente en el banner hexagonal de www.onprotec.com
      ===================================================================== */}
      <section
        id="hero-sala"
        className="relative onprotec-hex-bg border-b border-slate-200/80 dark:border-slate-800 overflow-hidden"
      >
        {/* Decoración sutil */}
        <div className="max-w-[1640px] mx-auto px-4 sm:px-8 pt-8 pb-12 lg:py-14">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
            {/* COLUMNA IZQUIERDA (7 cols): IDENTIDAD DE MARCA + PROPUESTA DE ALTO IMPACTO */}
            <div className="lg:col-span-7 space-y-6">
              {/* Badge Superior de Exclusividad */}
              <div className="inline-flex flex-wrap items-center gap-2.5 bg-white dark:bg-slate-900 border border-[#f4730a]/30 rounded-full pl-2 pr-4 py-1.5 shadow-sm">
                <span className="bg-[#f4730a] text-white text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full">
                  EXCLUSIVO PRESENCIAL
                </span>
                <span className="text-xs font-extrabold text-[#2a285c] dark:text-slate-200">
                  Sala de Capacitaciones OnProtec® • Solo 18 Puestos de Laboratorio
                </span>
              </div>

              {/* Encabezado icónico "La tienda del INSTALADOR" + Título persuasivo */}
              <div className="space-y-3">
                <div className="inline-block">
                  <p className="text-xs sm:text-sm font-extrabold uppercase tracking-[0.2em] text-[#2a285c] dark:text-slate-300 mb-1">
                    CENTRO DE ENTRENAMIENTO TÉCNICO CERTIFICADO
                  </p>
                  <h1 className="text-3xl sm:text-5xl xl:text-[54px] font-black tracking-tight leading-[1.06] text-[#1a1c29] dark:text-white">
                    La{" "}
                    <span className="text-[#f4730a] font-black">tienda</span>{" "}
                    del{" "}
                    <span className="text-stroke-orange tracking-wider">
                      INSTALADOR
                    </span>
                  </h1>
                  <div className="onprotec-dotted-line mt-2 w-full max-w-lg" />
                </div>

                <h2 className="text-xl sm:text-2xl xl:text-3xl font-extrabold text-[#2a285c] dark:text-slate-100 leading-snug pt-2">
                  Domina las arquitecturas líderes del mercado con{" "}
                  <span className="text-[#f4730a] underline decoration-[#f4730a]/40 decoration-wavy underline-offset-4">
                    equipos reales en vivo
                  </span>{" "}
                  y multiplica la rentabilidad de tus proyectos.
                </h2>

                <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-2xl leading-relaxed font-medium">
                  Diseñamos una sala técnica de estándar corporativo para integradores, ingenieros y técnicos que buscan pasar de la teoría a la práctica real. Configura soluciones{" "}
                  <strong className="text-[#2a285c] dark:text-white font-bold">
                    Dahua, Hikvision, TP-Link Omada, Ubiquiti, WatchGuard y Marsriva
                  </strong>{" "}
                  junto a especialistas certificados de fábrica.
                </p>
              </div>

              {/* CTAs Principales de Alta Conversión + Indicador de Escasez */}
              <div className="flex flex-wrap items-center gap-4 pt-2">
                <button
                  type="button"
                  onClick={() => scrollToSection("registro-express")}
                  className="inline-flex items-center justify-center gap-3 bg-[#f4730a] hover:bg-[#ef7922] text-white font-black text-sm sm:text-base uppercase tracking-wider px-8 py-4 rounded-2xl shadow-[0_12px_30px_rgba(244,115,10,0.35)] hover:shadow-[0_16px_36px_rgba(244,115,10,0.5)] transition-all transform hover:-translate-y-0.5 cursor-pointer"
                >
                  <span>Asegura tu cupo ahora</span>
                  <ArrowRight className="w-5 h-5" />
                </button>

                <button
                  type="button"
                  onClick={() => scrollToSection("calendario-temario")}
                  className="inline-flex items-center justify-center gap-2 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-[#2a285c] dark:text-white border-2 border-[#2a285c]/15 dark:border-slate-700 font-extrabold text-sm px-6 py-4 rounded-2xl transition-all cursor-pointer"
                >
                  <Calendar className="w-4 h-4 text-[#f4730a]" />
                  <span>Explorar Temario y Fechas</span>
                </button>
              </div>

              {/* Micro-métricas de Autoridad */}
              <div className="grid grid-cols-3 gap-4 pt-4 max-w-xl border-t border-slate-200/80 dark:border-slate-800">
                <div>
                  <p className="text-2xl sm:text-3xl font-black text-[#f4730a]">18 + 1</p>
                  <p className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                    Aforo VIP (18 Técnicos + 1 Instructor)
                  </p>
                </div>
                <div>
                  <p className="text-2xl sm:text-3xl font-black text-[#2a285c] dark:text-white">100%</p>
                  <p className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                    Práctico con Equipos Energizados
                  </p>
                </div>
                <div>
                  <p className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">+38</p>
                  <p className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                    Cohortes Certificadas en Caracas
                  </p>
                </div>
              </div>
            </div>

            {/* COLUMNA DERECHA (5 cols): TARJETA DESTACADA DEL PRÓXIMO EVENTO EN SALA */}
            <div className="lg:col-span-5">
              {selectedTraining ? (
                <div className="bg-white dark:bg-[#13182b] rounded-3xl border-2 border-[#f4730a]/30 shadow-[0_20px_60px_rgba(42,40,92,0.12)] overflow-hidden">
                  {/* Cabecera Navy Corporativa */}
                  <div className="bg-[#2a285c] text-white px-6 py-4 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#fdff00] animate-ping" />
                      <span className="text-[11px] font-black uppercase tracking-widest text-[#fdff00]">
                        CONVOCATORIA ACTIVA DESTACADA
                      </span>
                    </div>
                    <span className="text-xs font-mono font-bold bg-white/15 px-3 py-1 rounded-full">
                      {selectedTraining.code}
                    </span>
                  </div>

                  {/* Galería / Banner Visual del Evento */}
                  <div className="relative h-52 sm:h-60 bg-slate-900 overflow-hidden">
                    <img
                      src={
                        coverGallery[activeCoverIdx] ||
                        "/brand/onprotec-hero-1920.webp"
                      }
                      alt={selectedTraining.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#1a183b]/95 via-[#1a183b]/40 to-transparent" />

                    {/* Miniaturas si tiene varias fotos de portada */}
                    {coverGallery.length > 1 && (
                      <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-black/50 backdrop-blur-md p-1.5 rounded-xl">
                        {coverGallery.map((url, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setActiveCoverIdx(idx)}
                            className={`w-9 h-7 rounded-lg overflow-hidden border-2 transition-all ${
                              activeCoverIdx === idx
                                ? "border-[#f4730a] scale-105"
                                : "border-white/30 opacity-70"
                            }`}
                          >
                            <img src={url} alt="" className="w-full h-full object-cover" />
                          </button>
                        ))}
                      </div>
                    )}

                    <div className="absolute bottom-3 left-5 right-5 flex items-end justify-between gap-3">
                      <div>
                        <span className="inline-block bg-[#f4730a] text-white text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-md mb-1.5">
                          {selectedTraining.brand || "ONPROTEC"}
                        </span>
                        <h3 className="text-lg sm:text-xl font-black text-white leading-tight line-clamp-2">
                          {selectedTraining.title}
                        </h3>
                      </div>
                    </div>
                  </div>

                  {/* Cuerpo de la Tarjeta Hero */}
                  <div className="p-6 space-y-4">
                    {/* Nota de Presentación */}
                    {selectedTraining.presentationNotes && (
                      <div className="bg-orange-50/90 dark:bg-[#f4730a]/10 border-l-4 border-[#f4730a] p-3.5 rounded-r-xl text-xs text-slate-700 dark:text-slate-200 font-medium leading-relaxed">
                        {selectedTraining.presentationNotes}
                      </div>
                    )}

                    {/* Fechas, Horario y Especialista */}
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="bg-slate-50 dark:bg-slate-900/90 p-3 rounded-xl border border-slate-200/80 dark:border-slate-800">
                        <span className="text-[10px] font-bold uppercase text-slate-400 block">
                          Fecha (Caracas)
                        </span>
                        <span className="font-extrabold text-[#2a285c] dark:text-white flex items-center gap-1.5 mt-0.5">
                          <Calendar className="w-3.5 h-3.5 text-[#f4730a]" />
                          {fmtLocalDate(selectedTraining.startDate)}
                        </span>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-900/90 p-3 rounded-xl border border-slate-200/80 dark:border-slate-800">
                        <span className="text-[10px] font-bold uppercase text-slate-400 block">
                          Inversión
                        </span>
                        <span className="font-black text-emerald-600 dark:text-emerald-400 text-sm block mt-0.5">
                          {selectedTraining.isFree
                            ? "100% GRATUITO"
                            : formatCurrency(selectedTraining.price)}
                        </span>
                      </div>
                    </div>

                    {/* Termómetro de Escasez de Cupos en Vivo */}
                    <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800">
                      <div className="flex items-center justify-between text-xs mb-2">
                        <span className="font-extrabold text-[#2a285c] dark:text-slate-200 flex items-center gap-1.5">
                          <Users className="w-4 h-4 text-[#f4730a]" />
                          Disponibilidad en Sala (Máx. {maxSeats})
                        </span>
                        <span
                          className={`font-black px-2.5 py-0.5 rounded-full text-[11px] ${
                            availableSeats > 0
                              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300"
                              : "bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300"
                          }`}
                        >
                          {availableSeats > 0
                            ? `¡Quedan ${availableSeats} cupos libres!`
                            : "Aforo completo (Lista de Espera)"}
                        </span>
                      </div>
                      <div className="w-full h-2.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-[#f4730a] to-[#2a285c] rounded-full transition-all duration-500"
                          style={{ width: `${Math.max(12, occupancyPct)}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 font-semibold">
                        <span>{occupiedSeats} inscritos confirmados</span>
                        <span>Speaker: {selectedTraining.instructor || "Especialista OnProtec"}</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => scrollToSection("registro-express")}
                      className="w-full bg-[#f4730a] hover:bg-[#ef7922] text-white font-black text-sm uppercase tracking-wider py-4 rounded-xl shadow-lg shadow-[#f4730a]/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <span>Reservar mi Asiento en {selectedTraining.code}</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          {/* =================================================================
              PÍLDORAS NARANJAS DE CATEGORÍAS (IDÉNTICAS A WWW.ONPROTEC.COM)
          ================================================================= */}
          <div className="mt-10 pt-8 border-t border-slate-200/70 dark:border-slate-800/80">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[11px] font-extrabold uppercase tracking-widest text-slate-400">
                FILTRAR CAPACITACIONES POR VERTICAL TECNOLÓGICA ONPROTEC®
              </span>
              <span className="text-[11px] font-mono font-bold text-slate-400">
                RIF: J-40685449-2
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
              {ONPROTEC_CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                const isActive = categoryFilter === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      setCategoryFilter(cat.id);
                      scrollToSection("calendario-temario");
                    }}
                    className={`group relative flex items-center justify-between px-5 py-3.5 rounded-full font-black text-xs sm:text-sm tracking-wider uppercase transition-all cursor-pointer shadow-sm ${
                      isActive
                        ? "bg-[#2a285c] text-white ring-4 ring-[#f4730a]/30 scale-[1.02]"
                        : "bg-[#f4730a] hover:bg-[#ef7922] text-white hover:-translate-y-0.5 shadow-[#f4730a]/20"
                    }`}
                  >
                    <span className="truncate">{cat.pillLabel}</span>
                    <span
                      className={`w-8 h-8 rounded-full flex items-center justify-center transition-transform group-hover:scale-110 ${
                        isActive ? "bg-[#f4730a] text-white" : "bg-white/20 text-white"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          4. SECCIÓN DE PROPUESTA DE VALOR (POR QUÉ FORMARTE EN ONPROTEC)
          Espacio en blanco generoso + Cuadrícula de alto valor técnico
      ===================================================================== */}
      <section
        id="propuesta-valor"
        className="py-16 lg:py-20 bg-white dark:bg-[#0f1322] border-b border-slate-200/70 dark:border-slate-800"
      >
        <div className="max-w-[1640px] mx-auto px-4 sm:px-8">
          <div className="max-w-3xl mx-auto text-center space-y-3 mb-12">
            <span className="inline-block text-[11px] font-black uppercase tracking-[0.2em] text-[#f4730a] bg-orange-50 dark:bg-[#f4730a]/10 px-3.5 py-1 rounded-full">
              ESTÁNDAR CORPORATIVO DE FORMACIÓN
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-[#2a285c] dark:text-white tracking-tight">
              ¿Por qué la Sala de Capacitaciones OnProtec® es diferente?
            </h2>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 font-medium">
              No somos un webinar pasivo. Entrenamos a los mejores instaladores e integradores de Venezuela en un entorno controlado de laboratorio físico.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Card 1 */}
            <div className="group bg-[#f8f9fc] dark:bg-slate-900/90 hover:bg-white dark:hover:bg-slate-900 rounded-3xl p-7 border border-slate-200/80 dark:border-slate-800 hover:border-[#f4730a] transition-all duration-300 shadow-sm hover:shadow-[0_16px_40px_rgba(244,115,10,0.10)]">
              <div className="w-14 h-14 rounded-2xl bg-[#f4730a] text-white flex items-center justify-center mb-5 shadow-md shadow-[#f4730a]/25 group-hover:scale-105 transition-transform">
                <Cpu className="w-7 h-7" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-[#f4730a]">
                01 • LABORATORIO VIVO
              </span>
              <h3 className="text-lg font-extrabold text-[#2a285c] dark:text-white mt-1 mb-2">
                Equipos Energizados en Vivo
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Cada sesión utiliza cámaras, grabadores NVR, routers empresariales, firewalls y respaldos energizados del inventario oficial de{" "}
                <strong className="text-[#2a285c] dark:text-slate-200">www.onprotec.com</strong>.
              </p>
            </div>

            {/* Card 2 */}
            <div className="group bg-[#f8f9fc] dark:bg-slate-900/90 hover:bg-white dark:hover:bg-slate-900 rounded-3xl p-7 border border-slate-200/80 dark:border-slate-800 hover:border-[#f4730a] transition-all duration-300 shadow-sm hover:shadow-[0_16px_40px_rgba(244,115,10,0.10)]">
              <div className="w-14 h-14 rounded-2xl bg-[#2a285c] text-white flex items-center justify-center mb-5 shadow-md shadow-[#2a285c]/25 group-hover:scale-105 transition-transform">
                <Users className="w-7 h-7 text-[#fdff00]" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-[#2a285c] dark:text-indigo-400">
                02 • AFORO VIP ESTRICTO
              </span>
              <h3 className="text-lg font-extrabold text-[#2a285c] dark:text-white mt-1 mb-2">
                18 Cupos + 1 Especialista
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Garantizamos atención personalizada 1 a 1. Nuestro algoritmo cierra el salón al inscrito #18 y activa lista de espera inteligente con prioridad para nuevas fechas.
              </p>
            </div>

            {/* Card 3 */}
            <div className="group bg-[#f8f9fc] dark:bg-slate-900/90 hover:bg-white dark:hover:bg-slate-900 rounded-3xl p-7 border border-slate-200/80 dark:border-slate-800 hover:border-[#f4730a] transition-all duration-300 shadow-sm hover:shadow-[0_16px_40px_rgba(244,115,10,0.10)]">
              <div className="w-14 h-14 rounded-2xl bg-[#f4730a] text-white flex items-center justify-center mb-5 shadow-md shadow-[#f4730a]/25 group-hover:scale-105 transition-transform">
                <Award className="w-7 h-7" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-[#f4730a]">
                03 • ACREDITACIÓN OFICIAL
              </span>
              <h3 className="text-lg font-extrabold text-[#2a285c] dark:text-white mt-1 mb-2">
                Historial y Certificación Técnica
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Check-in automatizado por código QR en puerta, evaluación final digital y registro permanente en el directorio de instaladores certificados OnProtec.
              </p>
            </div>

            {/* Card 4 */}
            <div className="group bg-[#f8f9fc] dark:bg-slate-900/90 hover:bg-white dark:hover:bg-slate-900 rounded-3xl p-7 border border-slate-200/80 dark:border-slate-800 hover:border-[#f4730a] transition-all duration-300 shadow-sm hover:shadow-[0_16px_40px_rgba(244,115,10,0.10)]">
              <div className="w-14 h-14 rounded-2xl bg-[#2a285c] text-white flex items-center justify-center mb-5 shadow-md shadow-[#2a285c]/25 group-hover:scale-105 transition-transform">
                <Zap className="w-7 h-7 text-[#f4730a]" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-[#2a285c] dark:text-indigo-400">
                04 • RENTABILIDAD COMERCIAL
              </span>
              <h3 className="text-lg font-extrabold text-[#2a285c] dark:text-white mt-1 mb-2">
                Precios de Distribuidor & Cashea
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Acceso directo a asesores comerciales, precios especiales para proyectos, soporte post-venta y facilidades de compra con{" "}
                <strong className="text-[#1a1c29] dark:text-yellow-300">Cashea</strong> en tienda.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          5. ORGANIZACIÓN DE LA INFORMACIÓN E INSCRIPCIÓN DE FRICCIÓN CERO
          Layout Horizontal Widescreen: Izquierda (Catálogo, Insignias, Línea de Tiempo)
          + Derecha Sticky (Formulario Corporativo con Etiquetas Flotantes)
      ===================================================================== */}
      <section id="calendario-temario" className="py-16 lg:py-20 flex-1">
        <div className="max-w-[1640px] mx-auto px-4 sm:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            {/* ===============================================================
                COLUMNA IZQUIERDA (7 cols): CATÁLOGO + DETALLE VISUAL + TIMELINE
            =============================================================== */}
            <div className="lg:col-span-7 space-y-10">
              {/* Encabezado y Filtros Rápidos por Marca */}
              <div className="bg-white dark:bg-[#13182b] rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                  <div>
                    <span className="text-[11px] font-black uppercase tracking-widest text-[#f4730a]">
                      AGENDA OFICIAL AMERICA/CARACAS (UTC-4)
                    </span>
                    <h2 className="text-2xl sm:text-3xl font-black text-[#2a285c] dark:text-white mt-0.5">
                      Selecciona tu Certificación Técnica
                    </h2>
                  </div>

                  {/* Filtro de Marcas */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                    {["all", "Dahua", "Hikvision", "TP-Link", "Ubiquiti", "WatchGuard", "EZVIZ"].map(
                      (b) => (
                        <button
                          key={b}
                          type="button"
                          onClick={() => setBrandFilter(b)}
                          className={`text-xs px-3.5 py-1.5 rounded-full font-bold transition-all cursor-pointer ${
                            brandFilter === b
                              ? "bg-[#f4730a] text-white shadow-sm"
                              : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                          }`}
                        >
                          {b === "all" ? "Todas las Marcas" : b}
                        </button>
                      )
                    )}
                  </div>
                </div>

                {/* Grid Escaneable de Capacitaciones con Insignias (Badges) */}
                {loading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[1, 2, 3, 4].map((n) => (
                      <div
                        key={n}
                        className="h-44 rounded-2xl bg-slate-100 dark:bg-slate-800/50 animate-pulse"
                      />
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[540px] overflow-y-auto pr-1">
                    {filteredTrainings.map((t) => {
                      const isSelected = selectedTraining?.id === t.id;
                      const max = Number(t.maxCapacity || 18);
                      const occ = Number(t.occupiedCount || 0);
                      const avail = Math.max(0, max - occ);
                      const pct = Math.min(100, Math.round((occ / max) * 100));
                      const isPlanned =
                        t.status === "Planificado" || t.status === "En Publicidad";

                      return (
                        <div
                          key={t.id}
                          onClick={() => setSelectedTraining(t)}
                          className={`group cursor-pointer rounded-2xl p-5 transition-all border-2 flex flex-col justify-between ${
                            isSelected
                              ? "bg-orange-50/60 dark:bg-[#f4730a]/10 border-[#f4730a] shadow-md"
                              : "bg-[#f8f9fc] dark:bg-slate-900/70 border-slate-200/80 dark:border-slate-800 hover:border-[#2a285c]/40"
                          }`}
                        >
                          <div>
                            <div className="flex items-center justify-between gap-2 mb-2.5">
                              <span className="text-[10px] font-mono font-extrabold px-2.5 py-0.5 rounded-md bg-[#2a285c] text-white">
                                {t.code}
                              </span>
                              <div className="flex items-center gap-1.5">
                                {isPlanned && (
                                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-[#fdff00] text-[#1a1c29]">
                                    INSCRIPCIÓN ABIERTA
                                  </span>
                                )}
                                <span
                                  className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full ${
                                    t.isFree
                                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300"
                                      : "bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300"
                                  }`}
                                >
                                  {t.isFree ? "GRATIS" : formatCurrency(t.price)}
                                </span>
                              </div>
                            </div>

                            <h3 className="text-sm font-extrabold text-[#1a1c29] dark:text-white group-hover:text-[#f4730a] transition-colors line-clamp-2 mb-2">
                              {t.title}
                            </h3>

                            {/* Insignias Escaneables */}
                            <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-600 dark:text-slate-400 font-semibold mb-3">
                              <span className="inline-flex items-center gap-1 bg-white dark:bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-200/70 dark:border-slate-700">
                                <Calendar className="w-3 h-3 text-[#f4730a]" />
                                {fmtLocalDate(t.startDate)}
                              </span>
                              <span className="inline-flex items-center gap-1 bg-white dark:bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-200/70 dark:border-slate-700">
                                <Clock className="w-3 h-3 text-[#2a285c] dark:text-indigo-400" />
                                {fmtLocalHour(t.startDate)}
                              </span>
                            </div>
                          </div>

                          {/* Barra de Cupos y Botón Rápido */}
                          <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800">
                            <div className="flex items-center justify-between text-[11px] mb-1">
                              <span className="text-slate-500 font-semibold">
                                Ocupación: {occ}/{max}
                              </span>
                              <span
                                className={`font-extrabold ${
                                  avail > 0
                                    ? "text-emerald-600 dark:text-emerald-400"
                                    : "text-amber-600 dark:text-amber-400"
                                }`}
                              >
                                {avail > 0 ? `${avail} cupos libres` : "Lista de espera"}
                              </span>
                            </div>
                            <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  avail > 0 ? "bg-[#f4730a]" : "bg-amber-500"
                                }`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* FICHA TÉCNICA ESCANEABLE DEL CURSO SELECCIONADO */}
              {selectedTraining && (
                <div className="bg-white dark:bg-[#13182b] rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6">
                  <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200/70 dark:border-slate-800 pb-5">
                    <div>
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className="bg-[#f4730a] text-white text-[11px] font-black uppercase px-3 py-1 rounded-full">
                          {selectedTraining.brand || "ONPROTEC"}
                        </span>
                        <span className="bg-[#2a285c] text-white text-[11px] font-mono font-bold px-3 py-1 rounded-full">
                          {selectedTraining.code}
                        </span>
                        <span className="bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30 text-[11px] font-extrabold px-3 py-1 rounded-full">
                          Modalidad Presencial Hands-On
                        </span>
                      </div>
                      <h3 className="text-xl sm:text-2xl font-black text-[#2a285c] dark:text-white">
                        {selectedTraining.title}
                      </h3>
                    </div>

                    <div className="flex items-center gap-2">
                      <Link
                        href={`/checkin/${selectedTraining.id}`}
                        className="inline-flex items-center gap-1.5 text-xs font-bold px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-[#2a285c] dark:text-slate-200 hover:bg-[#f4730a] hover:text-white transition-colors"
                      >
                        <QrCode className="w-4 h-4" />
                        Check-in QR
                      </Link>
                      <Link
                        href={`/encuesta/${selectedTraining.id}`}
                        className="inline-flex items-center gap-1.5 text-xs font-bold px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-[#2a285c] dark:text-slate-200 hover:bg-[#2a285c] hover:text-white transition-colors"
                      >
                        <FileText className="w-4 h-4" />
                        Encuesta Final
                      </Link>
                    </div>
                  </div>

                  {/* Insignias de Ubicación, Fecha, Horario y Speaker */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3.5">
                    <div className="p-4 rounded-2xl bg-[#f8f9fc] dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                        FECHA DEL EVENTO
                      </span>
                      <p className="text-sm font-black text-[#2a285c] dark:text-white mt-1 flex items-center gap-1.5">
                        <Calendar className="w-4 h-4 text-[#f4730a]" />
                        {fmtLocalDate(selectedTraining.startDate)}
                      </p>
                    </div>

                    <div className="p-4 rounded-2xl bg-[#f8f9fc] dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                        HORARIO OFICIAL (UTC-4)
                      </span>
                      <p className="text-sm font-black text-[#2a285c] dark:text-white mt-1 flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-[#f4730a]" />
                        {fmtLocalHour(selectedTraining.startDate)} -{" "}
                        {fmtLocalHour(selectedTraining.endDate)}
                      </p>
                    </div>

                    <div className="p-4 rounded-2xl bg-[#f8f9fc] dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                        INSTRUCTOR CERTIFICADO
                      </span>
                      <p className="text-sm font-black text-[#2a285c] dark:text-white mt-1 truncate">
                        {selectedTraining.instructor || "Ing. Especialista OnProtec"}
                      </p>
                    </div>

                    <div className="p-4 rounded-2xl bg-[#f8f9fc] dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                        UBICACIÓN FÍSICA
                      </span>
                      <p className="text-xs font-extrabold text-[#2a285c] dark:text-white mt-1 flex items-center gap-1">
                        <MapPin className="w-4 h-4 text-[#f4730a] shrink-0" />
                        Los Chaguaramos, Caracas
                      </p>
                    </div>
                  </div>

                  {/* Nota de Presentación Destacada */}
                  {selectedTraining.presentationNotes && (
                    <div className="p-5 rounded-2xl bg-gradient-to-r from-orange-50 to-amber-50/50 dark:from-[#f4730a]/15 dark:to-slate-900 border border-[#f4730a]/30">
                      <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-[#f4730a] mb-1.5">
                        <Sparkles className="w-4 h-4" />
                        Alcance Técnico y Nota de Presentación
                      </div>
                      <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed font-medium">
                        {selectedTraining.presentationNotes}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* =============================================================
                  LÍNEA DE TIEMPO VISUAL (TIMELINE DE LA JORNADA EN SALA)
              ============================================================= */}
              <div
                id="metodologia-timeline"
                className="bg-white dark:bg-[#13182b] rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-sm"
              >
                <div className="mb-6">
                  <span className="text-[11px] font-black uppercase tracking-widest text-[#f4730a]">
                    ESTRUCTURA DE APRENDIZAJE PRÁCTICO
                  </span>
                  <h3 className="text-xl sm:text-2xl font-black text-[#2a285c] dark:text-white mt-0.5">
                    Línea de Tiempo de tu Jornada en la Sala OnProtec®
                  </h3>
                </div>

                <div className="relative pl-6 sm:pl-8 border-l-2 border-dashed border-[#f4730a]/50 space-y-6">
                  {/* Paso 1 */}
                  <div className="relative">
                    <div className="absolute -left-[35px] sm:-left-[43px] top-0.5 w-6 h-6 rounded-full bg-[#f4730a] text-white text-xs font-black flex items-center justify-center ring-4 ring-orange-100 dark:ring-slate-900">
                      1
                    </div>
                    <div className="bg-[#f8f9fc] dark:bg-slate-900/90 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800">
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                        <h4 className="text-sm font-extrabold text-[#2a285c] dark:text-white">
                          Acreditación QR & Kit de Bienvenida
                        </h4>
                        <span className="text-[11px] font-black text-[#f4730a] bg-orange-50 dark:bg-[#f4730a]/10 px-2.5 py-0.5 rounded-full">
                          08:30 AM – 09:00 AM
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        Validación instantánea con código QR en recepción, asignación de estación de trabajo entre las 18 mesas técnicas y entrega de material de apoyo.
                      </p>
                    </div>
                  </div>

                  {/* Paso 2 */}
                  <div className="relative">
                    <div className="absolute -left-[35px] sm:-left-[43px] top-0.5 w-6 h-6 rounded-full bg-[#2a285c] text-white text-xs font-black flex items-center justify-center ring-4 ring-indigo-100 dark:ring-slate-900">
                      2
                    </div>
                    <div className="bg-[#f8f9fc] dark:bg-slate-900/90 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800">
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                        <h4 className="text-sm font-extrabold text-[#2a285c] dark:text-white">
                          Arquitectura de Soluciones & Dimensionamiento
                        </h4>
                        <span className="text-[11px] font-black text-[#2a285c] dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-500/10 px-2.5 py-0.5 rounded-full">
                          09:00 AM – 10:30 AM
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        Análisis del portafolio actualizado, topologías recomendadas por fábrica, errores comunes en campo y cómo cotizar proyectos de alta rentabilidad.
                      </p>
                    </div>
                  </div>

                  {/* Paso 3 */}
                  <div className="relative">
                    <div className="absolute -left-[35px] sm:-left-[43px] top-0.5 w-6 h-6 rounded-full bg-[#f4730a] text-white text-xs font-black flex items-center justify-center ring-4 ring-orange-100 dark:ring-slate-900">
                      3
                    </div>
                    <div className="bg-[#f8f9fc] dark:bg-slate-900/90 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800">
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                        <h4 className="text-sm font-extrabold text-[#2a285c] dark:text-white">
                          Laboratorio Hands-On con Equipos en Vivo
                        </h4>
                        <span className="text-[11px] font-black text-[#f4730a] bg-orange-50 dark:bg-[#f4730a]/10 px-2.5 py-0.5 rounded-full">
                          10:45 AM – 12:00 PM
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        Configuración en vivo, puesta en marcha, aprovisionamiento en la nube (DoLynk Care / Hik-Partner Pro / Omada Cloud) y pruebas de diagnóstico.
                      </p>
                    </div>
                  </div>

                  {/* Paso 4 */}
                  <div className="relative">
                    <div className="absolute -left-[35px] sm:-left-[43px] top-0.5 w-6 h-6 rounded-full bg-emerald-600 text-white text-xs font-black flex items-center justify-center ring-4 ring-emerald-100 dark:ring-slate-900">
                      4
                    </div>
                    <div className="bg-[#f8f9fc] dark:bg-slate-900/90 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800">
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                        <h4 className="text-sm font-extrabold text-[#2a285c] dark:text-white">
                          Evaluación QR, Networking & Beneficios de Distribuidor
                        </h4>
                        <span className="text-[11px] font-black text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-500/10 px-2.5 py-0.5 rounded-full">
                          12:00 PM – 12:30 PM
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        Encuesta de satisfacción digital, acreditación en tu expediente histórico de participante y beneficios exclusivos en mostrador OnProtec®.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ===============================================================
                COLUMNA DERECHA STICKY (5 cols): FRICCIÓN CERO EN EL REGISTRO
                Etiquetas Flotantes (Floating Labels) + Agrupación Lógica
            =============================================================== */}
            <div id="registro-express" className="lg:col-span-5 lg:sticky lg:top-28">
              <div className="bg-white dark:bg-[#13182b] rounded-3xl border-2 border-[#2a285c]/15 dark:border-slate-800 shadow-[0_24px_60px_rgba(42,40,92,0.10)] overflow-hidden">
                {/* Cabecera del Formulario */}
                <div className="bg-gradient-to-r from-[#2a285c] to-[#1f1d47] text-white p-6">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest bg-[#f4730a] text-white px-3 py-1 rounded-full">
                      <Lock className="w-3 h-3" /> REGISTRO RÁPIDO SIN FRICCIÓN
                    </span>
                    {selectedTraining && (
                      <span className="text-xs font-mono font-bold text-[#fdff00]">
                        {selectedTraining.code}
                      </span>
                    )}
                  </div>
                  <h3 className="text-xl font-black tracking-tight">
                    Asegura tu Asiento en la Sala VIP
                  </h3>
                  <p className="text-xs text-slate-300 mt-1">
                    {selectedTraining
                      ? `${selectedTraining.title} • ${
                          availableSeats > 0
                            ? `${availableSeats} asientos disponibles de ${maxSeats}`
                            : "Lista de Espera Prioritaria Activa"
                        }`
                      : "Selecciona una capacitación para completar tu registro"}
                  </p>
                </div>

                <div className="p-6 sm:p-7">
                  {/* Mensaje de Confirmación Post-Registro */}
                  {submissionResult && (
                    <div
                      className={`mb-6 p-5 rounded-2xl border-2 ${
                        submissionResult.success
                          ? submissionResult.data?.isOverbooked
                            ? "bg-amber-50 border-amber-300 text-amber-900 dark:bg-amber-500/10 dark:border-amber-500/40 dark:text-amber-200"
                            : "bg-emerald-50 border-emerald-300 text-emerald-900 dark:bg-emerald-500/10 dark:border-emerald-500/40 dark:text-emerald-200"
                          : "bg-rose-50 border-rose-300 text-rose-900 dark:bg-rose-500/10 dark:border-rose-500/40 dark:text-rose-200"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {submissionResult.success ? (
                          submissionResult.data?.isOverbooked ? (
                            <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
                          ) : (
                            <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
                          )
                        ) : (
                          <AlertTriangle className="w-6 h-6 text-rose-600 shrink-0 mt-0.5" />
                        )}
                        <div className="space-y-1 text-xs">
                          <p className="font-black text-sm">
                            {submissionResult.message || submissionResult.error}
                          </p>
                          {submissionResult.data && (
                            <p className="font-bold">
                              Posición asignada en Sala:{" "}
                              <span className="underline">
                                #{submissionResult.data.seatPosition} de{" "}
                                {submissionResult.data.maxCapacity}
                              </span>{" "}
                              ({submissionResult.data.status})
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* GRUPO 1: IDENTIFICACIÓN DEL PARTICIPANTE */}
                    <div className="space-y-3.5">
                      <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-[#2a285c] dark:text-slate-200">
                        <span className="w-5 h-5 rounded-full bg-[#f4730a] text-white text-[11px] flex items-center justify-center">
                          1
                        </span>
                        Identificación del Instalador / Participante
                      </div>

                      {/* Floating Label: Nombre y Apellido */}
                      <div className="relative">
                        <input
                          id="fl-name"
                          type="text"
                          required
                          placeholder=" "
                          value={form.name}
                          onChange={(e) => setForm({ ...form, name: e.target.value })}
                          className="peer w-full bg-[#f8f9fc] dark:bg-slate-900 border border-slate-300 dark:border-slate-700 focus:border-[#f4730a] focus:bg-white dark:focus:bg-slate-900 rounded-xl px-4 pt-5 pb-2 text-sm font-bold text-slate-900 dark:text-white outline-none transition-all"
                        />
                        <label
                          htmlFor="fl-name"
                          className="pointer-events-none absolute left-4 top-2 text-[10px] font-extrabold uppercase tracking-wider text-[#f4730a] transition-all peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-xs peer-placeholder-shown:font-semibold peer-placeholder-shown:text-slate-400 peer-focus:top-2 peer-focus:text-[10px] peer-focus:font-extrabold peer-focus:text-[#f4730a]"
                        >
                          Nombre y Apellido Completo *
                        </label>
                      </div>

                      {/* Cédula / RIF y Teléfono WhatsApp */}
                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                        <div className="sm:col-span-6 flex gap-1.5">
                          <select
                            aria-label="Tipo de documento"
                            value={form.docType}
                            onChange={(e) => setForm({ ...form, docType: e.target.value })}
                            className="bg-[#f8f9fc] dark:bg-slate-900 border border-slate-300 dark:border-slate-700 focus:border-[#f4730a] rounded-xl px-2.5 py-3 text-xs font-black text-[#2a285c] dark:text-white outline-none"
                          >
                            <option value="V">V-</option>
                            <option value="E">E-</option>
                            <option value="J">J-</option>
                            <option value="P">P-</option>
                          </select>
                          <div className="relative flex-1">
                            <input
                              id="fl-doc"
                              type="text"
                              required
                              placeholder=" "
                              value={form.docNumber}
                              onChange={(e) => setForm({ ...form, docNumber: e.target.value })}
                              className="peer w-full bg-[#f8f9fc] dark:bg-slate-900 border border-slate-300 dark:border-slate-700 focus:border-[#f4730a] focus:bg-white dark:focus:bg-slate-900 rounded-xl px-3.5 pt-5 pb-2 text-sm font-bold text-slate-900 dark:text-white outline-none transition-all"
                            />
                            <label
                              htmlFor="fl-doc"
                              className="pointer-events-none absolute left-3.5 top-2 text-[10px] font-extrabold uppercase tracking-wider text-[#f4730a] transition-all peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-xs peer-placeholder-shown:font-semibold peer-placeholder-shown:text-slate-400 peer-focus:top-2 peer-focus:text-[10px] peer-focus:font-extrabold peer-focus:text-[#f4730a]"
                            >
                              Cédula / RIF *
                            </label>
                          </div>
                        </div>

                        <div className="sm:col-span-6 relative">
                          <input
                            id="fl-phone"
                            type="tel"
                            required
                            placeholder=" "
                            value={form.phone}
                            onChange={(e) => setForm({ ...form, phone: e.target.value })}
                            className="peer w-full bg-[#f8f9fc] dark:bg-slate-900 border border-slate-300 dark:border-slate-700 focus:border-[#f4730a] focus:bg-white dark:focus:bg-slate-900 rounded-xl px-3.5 pt-5 pb-2 text-sm font-bold text-slate-900 dark:text-white outline-none transition-all"
                          />
                          <label
                            htmlFor="fl-phone"
                            className="pointer-events-none absolute left-3.5 top-2 text-[10px] font-extrabold uppercase tracking-wider text-[#f4730a] transition-all peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-xs peer-placeholder-shown:font-semibold peer-placeholder-shown:text-slate-400 peer-focus:top-2 peer-focus:text-[10px] peer-focus:font-extrabold peer-focus:text-[#f4730a]"
                          >
                            WhatsApp (0412/0414) *
                          </label>
                        </div>
                      </div>
                    </div>

                    {/* GRUPO 2: CONTACTO Y EMPRESA INTEGRADORA */}
                    <div className="space-y-3.5 pt-2 border-t border-slate-200/70 dark:border-slate-800">
                      <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-[#2a285c] dark:text-slate-200">
                        <span className="w-5 h-5 rounded-full bg-[#2a285c] text-white text-[11px] flex items-center justify-center">
                          2
                        </span>
                        Contacto & Empresa Integradora
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="relative">
                          <input
                            id="fl-email"
                            type="email"
                            placeholder=" "
                            value={form.email}
                            onChange={(e) => setForm({ ...form, email: e.target.value })}
                            className="peer w-full bg-[#f8f9fc] dark:bg-slate-900 border border-slate-300 dark:border-slate-700 focus:border-[#f4730a] focus:bg-white dark:focus:bg-slate-900 rounded-xl px-3.5 pt-5 pb-2 text-sm font-bold text-slate-900 dark:text-white outline-none transition-all"
                          />
                          <label
                            htmlFor="fl-email"
                            className="pointer-events-none absolute left-3.5 top-2 text-[10px] font-extrabold uppercase tracking-wider text-[#f4730a] transition-all peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-xs peer-placeholder-shown:font-semibold peer-placeholder-shown:text-slate-400 peer-focus:top-2 peer-focus:text-[10px] peer-focus:font-extrabold peer-focus:text-[#f4730a]"
                          >
                            Correo Electrónico
                          </label>
                        </div>

                        <div className="relative">
                          <input
                            id="fl-company"
                            type="text"
                            placeholder=" "
                            value={form.company}
                            onChange={(e) => setForm({ ...form, company: e.target.value })}
                            className="peer w-full bg-[#f8f9fc] dark:bg-slate-900 border border-slate-300 dark:border-slate-700 focus:border-[#f4730a] focus:bg-white dark:focus:bg-slate-900 rounded-xl px-3.5 pt-5 pb-2 text-sm font-bold text-slate-900 dark:text-white outline-none transition-all"
                          />
                          <label
                            htmlFor="fl-company"
                            className="pointer-events-none absolute left-3.5 top-2 text-[10px] font-extrabold uppercase tracking-wider text-[#f4730a] transition-all peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-xs peer-placeholder-shown:font-semibold peer-placeholder-shown:text-slate-400 peer-focus:top-2 peer-focus:text-[10px] peer-focus:font-extrabold peer-focus:text-[#f4730a]"
                          >
                            Empresa / Integrador
                          </label>
                        </div>
                      </div>
                    </div>

                    {/* GRUPO 3: PREGUNTAS DINÁMICAS PERSONALIZADAS DE LA CAPACITACIÓN */}
                    {activeFormQuestions.length > 0 && (
                      <div className="space-y-3.5 pt-2 border-t border-slate-200/70 dark:border-slate-800">
                        <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-[#f4730a]">
                          <span className="w-5 h-5 rounded-full bg-[#f4730a] text-white text-[11px] flex items-center justify-center">
                            3
                          </span>
                          Perfil Técnico para el Instructor ({activeFormQuestions.length})
                        </div>

                        <div className="space-y-3 bg-[#f8f9fc] dark:bg-slate-900/90 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800">
                          {activeFormQuestions.map((q) => (
                            <div key={q.id}>
                              <label className="block text-xs font-extrabold text-[#2a285c] dark:text-slate-200 mb-1.5">
                                {q.label}{" "}
                                {q.required && <span className="text-[#f4730a]">*</span>}
                              </label>

                              {q.type === "select" && Array.isArray(q.options) ? (
                                <select
                                  required={q.required}
                                  value={customAnswers[q.id] || ""}
                                  onChange={(e) =>
                                    setCustomAnswers({
                                      ...customAnswers,
                                      [q.id]: e.target.value,
                                    })
                                  }
                                  className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 focus:border-[#f4730a] rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 dark:text-white outline-none"
                                >
                                  <option value="">Selecciona una opción...</option>
                                  {q.options.map((opt, idx) => (
                                    <option key={idx} value={opt}>
                                      {opt}
                                    </option>
                                  ))}
                                </select>
                              ) : (q.type as string) === "yesno" || q.type === "radio" ? (
                                <div className="grid grid-cols-2 gap-2">
                                  {(Array.isArray(q.options) && q.options.length > 0 ? q.options : ["Sí", "No"]).map((opt) => (
                                    <button
                                      key={opt}
                                      type="button"
                                      onClick={() =>
                                        setCustomAnswers({
                                          ...customAnswers,
                                          [q.id]: opt,
                                        })
                                      }
                                      className={`py-2 rounded-xl text-xs font-extrabold border transition-all cursor-pointer ${
                                        customAnswers[q.id] === opt
                                          ? "bg-[#f4730a] border-[#f4730a] text-white shadow-sm"
                                          : "bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                                      }`}
                                    >
                                      {opt}
                                    </button>
                                  ))}
                                </div>
                              ) : q.type === "textarea" ? (
                                <textarea
                                  rows={2}
                                  required={q.required}
                                  placeholder={q.placeholder || "Escribe tu respuesta..."}
                                  value={customAnswers[q.id] || ""}
                                  onChange={(e) =>
                                    setCustomAnswers({
                                      ...customAnswers,
                                      [q.id]: e.target.value,
                                    })
                                  }
                                  className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 focus:border-[#f4730a] rounded-xl px-3.5 py-2 text-xs font-bold text-slate-800 dark:text-white outline-none"
                                />
                              ) : (
                                <input
                                  type="text"
                                  required={q.required}
                                  placeholder={q.placeholder || "Tu respuesta..."}
                                  value={customAnswers[q.id] || ""}
                                  onChange={(e) =>
                                    setCustomAnswers({
                                      ...customAnswers,
                                      [q.id]: e.target.value,
                                    })
                                  }
                                  className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 focus:border-[#f4730a] rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 dark:text-white outline-none"
                                />
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* GRUPO 4: REPORTE DE PAGO (SOLO SI EL CURSO ES PAGO) */}
                    {selectedTraining && !selectedTraining.isFree && (
                      <div className="p-4 rounded-2xl bg-amber-50/90 dark:bg-amber-500/10 border border-amber-300 dark:border-amber-500/30 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                            <CreditCard className="w-4 h-4" />
                            Inversión de Certificación
                          </span>
                          <span className="text-base font-black text-amber-900 dark:text-amber-200">
                            {formatCurrency(selectedTraining.price)}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2.5">
                          <select
                            value={form.paymentMethod}
                            onChange={(e) =>
                              setForm({ ...form, paymentMethod: e.target.value })
                            }
                            className="bg-white dark:bg-slate-900 border border-amber-300 dark:border-slate-700 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-800 dark:text-white outline-none"
                          >
                            <option value="Pabilo">Pago Móvil (Pabilo)</option>
                            <option value="Zelle">Zelle USD</option>
                            <option value="Transferencia">Transferencia Bs</option>
                            <option value="Efectivo">Efectivo en Tienda</option>
                          </select>
                          <input
                            type="text"
                            placeholder="Nro. Referencia"
                            value={form.paymentReference}
                            onChange={(e) =>
                              setForm({ ...form, paymentReference: e.target.value })
                            }
                            className="bg-white dark:bg-slate-900 border border-amber-300 dark:border-slate-700 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-800 dark:text-white outline-none"
                          />
                        </div>
                      </div>
                    )}

                    {/* BOTÓN ANCHO DE CONFIRMACIÓN DE ALTA CONVERSIÓN */}
                    <button
                      type="submit"
                      disabled={submitting || !selectedTraining}
                      className="w-full py-4 px-6 rounded-2xl bg-[#f4730a] hover:bg-[#ef7922] disabled:opacity-50 text-white font-black text-sm sm:text-base uppercase tracking-wider shadow-[0_12px_30px_rgba(244,115,10,0.35)] hover:shadow-[0_16px_35px_rgba(244,115,10,0.50)] transition-all flex items-center justify-center gap-2.5 cursor-pointer"
                    >
                      {submitting ? (
                        <span>Procesando Reserva en Sala...</span>
                      ) : availableSeats === 0 ? (
                        <>
                          <span>Ingresar a Lista de Espera Prioritaria</span>
                          <ArrowRight className="w-5 h-5" />
                        </>
                      ) : (
                        <>
                          <span>Confirmar mi Cupo Ahora</span>
                          <ArrowRight className="w-5 h-5" />
                        </>
                      )}
                    </button>

                    <p className="text-[11px] text-center text-slate-500 dark:text-slate-400 font-medium">
                      🔒 Tus datos quedan vinculados a tu expediente histórico de certificaciones en{" "}
                      <strong className="text-[#2a285c] dark:text-slate-200">OnProtec®</strong>.
                    </p>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          6. PRUEBA SOCIAL Y AUTORIDAD: ECOSISTEMA DE MARCAS Y CERTIFICACIONES
      ===================================================================== */}
      <section
        id="marcas-autoridad"
        className="py-14 bg-white dark:bg-[#0f1322] border-t border-slate-200/80 dark:border-slate-800"
      >
        <div className="max-w-[1640px] mx-auto px-4 sm:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="text-[11px] font-black uppercase tracking-[0.2em] text-[#f4730a]">
              RESPALDO TECNOLÓGICO Y AUTORIDAD DE FÁBRICA
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-[#2a285c] dark:text-white mt-1">
              Marcas Líderes que Certificamos en Nuestra Sala
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Distribuidor autorizado en Venezuela con garantía oficial, stock inmediato y soporte de ingeniería.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-4">
            {ONPROTEC_PARTNER_BRANDS.map((brand) => (
              <button
                key={brand.name}
                type="button"
                onClick={() => {
                  setBrandFilter(brand.name.split(" ")[0]);
                  scrollToSection("calendario-temario");
                }}
                className="group bg-[#f8f9fc] dark:bg-slate-900 hover:bg-white dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-800 hover:border-[#f4730a] rounded-2xl p-4 text-center transition-all shadow-xs hover:shadow-md cursor-pointer flex flex-col items-center justify-center"
              >
                <div className="w-10 h-10 rounded-xl bg-[#2a285c]/5 dark:bg-white/5 group-hover:bg-[#f4730a]/10 flex items-center justify-center mb-2 transition-colors">
                  <ShieldCheck className="w-5 h-5 text-[#2a285c] dark:text-[#f4730a]" />
                </div>
                <span className="text-xs font-black text-[#2a285c] dark:text-white group-hover:text-[#f4730a] transition-colors">
                  {brand.name}
                </span>
                <span className="text-[10px] font-semibold text-slate-400 mt-0.5">
                  {brand.category}
                </span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* =====================================================================
          7. CINTILLO OFICIAL "COMPRA CON CASHEA" EXTRAÍDO DE WWW.ONPROTEC.COM
      ===================================================================== */}
      <div className="cashea-banner">
        <a
          href="http://wa.me/584129635648"
          target="_blank"
          rel="noreferrer"
          className="cashea-banner-link"
        >
          <img
            src="/brand/icono-cashea.png"
            alt="Icono Cashea"
            className="cashea-banner-icon"
          />
          <span className="cashea-banner-text">
            Compra tus equipos de laboratorio con <strong>Cashea</strong> en OnProtec® — Escríbenos por WhatsApp
          </span>
        </a>
      </div>

      {/* =====================================================================
          8. FOOTER CORPORATIVO ONPROTEC®
      ===================================================================== */}
      <footer className="bg-[#2a285c] text-white py-10">
        <div className="max-w-[1640px] mx-auto px-4 sm:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="bg-white px-4 py-2 rounded-2xl">
              <img
                src="/brand/onprotec-logo-web.webp"
                alt="OnProtec"
                className="h-7 w-auto object-contain"
              />
            </div>
            <div>
              <p className="text-sm font-black tracking-wide">
                ONPROTEC® — LA TIENDA DEL INSTALADOR
              </p>
              <p className="text-xs text-slate-300">
                Av. Los Estadios con Calle Edison, Los Chaguaramos, Caracas • RIF: J-40685449-2
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs font-bold">
            <a
              href="https://www.onprotec.com"
              target="_blank"
              rel="noreferrer"
              className="hover:text-[#fdff00] transition-colors"
            >
              www.onprotec.com
            </a>
            <span className="opacity-40">•</span>
            <a
              href="http://wa.me/584129635648"
              target="_blank"
              rel="noreferrer"
              className="hover:text-[#fdff00] transition-colors"
            >
              Atención WhatsApp: +58 412-9635648
            </a>
            <span className="opacity-40">•</span>
            <Link href="/admin" className="text-[#fdff00] hover:underline">
              Acceso Administrativo
            </Link>
          </div>
        </div>
      </footer>

      {/* =====================================================================
          9. BOTÓN FLOTANTE OFICIAL DE WHATSAPP (.float-wa de www.onprotec.com)
      ===================================================================== */}
      <a
        href="http://wa.me/584129635648"
        target="_blank"
        rel="noreferrer"
        aria-label="Contactar por WhatsApp OnProtec"
        className="float-wa"
      >
        <Phone className="w-7 h-7 fill-current" />
      </a>
    </div>
  );
}
