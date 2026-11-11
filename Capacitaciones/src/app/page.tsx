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
  Lock,
  ChevronDown,
  UploadCloud,
  FileCheck,
  Trash2,
  CheckCircle2,
  Building2,
  Phone,
  Mail,
  Award,
  Zap,
} from "lucide-react";
import { FormQuestion } from "@/types";
import { fmtLocalDate, fmtLocalHour, formatCurrency } from "@/utils/formatUtils";
import { ThemeToggle } from "@/components/ThemeToggle";
import { OnprotecBrand } from "@/components/OnprotecBrand";

const PARTNER_BRANDS = [
  { name: "Dahua Technology", logo: "https://onprotec.tiendasellibri.com/rails/active_storage/blobs/proxy/eyJfcmFpbHMiOnsiZGF0YSI6MTk1Mzk0NiwicHVyIjoiYmxvYl9pZCJ9fQ==--c4bf3b2f8a846cbfbc52fa86d1a10408ca422f25/dahua-logo.png" },
  { name: "Hikvision", logo: "https://onprotec.tiendasellibri.com/rails/active_storage/blobs/proxy/eyJfcmFpbHMiOnsiZGF0YSI6MTk1Mzk0NywicHVyIjoiYmxvYl9pZCJ9fQ==--93b1368731d77a83da7080e729a75661b17b6e3f/hikvision-logo.png" },
  { name: "TP-Link Omada", logo: "https://onprotec.tiendasellibri.com/rails/active_storage/blobs/proxy/eyJfcmFpbHMiOnsiZGF0YSI6MTk1Mzk0OCwicHVyIjoiYmxvYl9pZCJ9fQ==--6c8e31a8ca9e2e6fa87d559868f763f0d440ad81/tplink-logo.png" },
  { name: "Ubiquiti UniFi", logo: "https://onprotec.tiendasellibri.com/rails/active_storage/blobs/proxy/eyJfcmFpbHMiOnsiZGF0YSI6MTk1Mzk0OSwicHVyIjoiYmxvYl9pZCJ9fQ==--89f2cf05d9e504be09d435f3d3ca24d852a55928/ubiquiti-logo.png" },
  { name: "EZVIZ", logo: "https://onprotec.tiendasellibri.com/rails/active_storage/blobs/proxy/eyJfcmFpbHMiOnsiZGF0YSI6MTk1Mzk1MCwicHVyIjoiYmxvYl9pZCJ9fQ==--3bc66df4ae1c10ee0fa6fc304494191d8e1329ee/ezviz-logo.png" },
  { name: "WatchGuard", logo: "https://onprotec.tiendasellibri.com/rails/active_storage/blobs/proxy/eyJfcmFpbHMiOnsiZGF0YSI6MTk1Mzk1MSwicHVyIjoiYmxvYl9pZCJ9fQ==--a08eec9e31d87f7b3df6e3aaee21ad434a9f3900/watchguard-logo.png" },
  { name: "Marsriva", logo: "https://onprotec.tiendasellibri.com/rails/active_storage/blobs/proxy/eyJfcmFpbHMiOnsiZGF0YSI6MTk1Mzk1MiwicHVyIjoiYmxvYl9pZCJ9fQ==--3336d3f23a59df713f0406df77d0774a3f23927d/marsriva-logo.png" },
];

export default function HomePage() {
  const [trainings, setTrainings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTraining, setSelectedTraining] = useState<any | null>(null);

  // Formulario de Fricción Cero con Etiquetas Flotantes
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
    paymentProofUrl: "",
    specialNotes: "",
  });

  const [customAnswers, setCustomAnswers] = useState<Record<string, any>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<any | null>(null);

  const [showConfirmationModal, setShowConfirmationModal] = useState(false);

  useEffect(() => {
    fetch("/api/capacitaciones?order=desc")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data.length > 0) {
          setTrainings(data.data);
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
    setCustomAnswers({});
    setSubmissionResult(null);
    setShowConfirmationModal(false);
  }, [selectedTraining?.id]);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const isSelectedTrainingOpen =
    selectedTraining &&
    (selectedTraining.status === "Planificado" || selectedTraining.status === "En Publicidad");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTraining) return;

    if (!isSelectedTrainingOpen) {
      setSubmissionResult({
        success: false,
        error:
          "Esta capacitación ya finalizó o las inscripciones se encuentran cerradas. Por favor selecciona una capacitación abierta.",
      });
      return;
    }

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
        setShowConfirmationModal(true);
        // Refrescar cupos
        const refreshRes = await fetch("/api/capacitaciones?order=desc");
        const refreshed = await refreshRes.json();
        if (refreshed.success) {
          setTrainings(refreshed.data);
          const updatedSelected = refreshed.data.find(
            (t: any) => Number(t.id) === Number(selectedTraining.id)
          );
          if (updatedSelected) setSelectedTraining(updatedSelected);
        }
      } else {
        // En caso de duplicado o error, scrollear suavemente al formulario para ver la alerta
        scrollToSection("registro-express");
      }
    } catch (err: any) {
      setSubmissionResult({
        success: false,
        error: "Error de red al procesar tu inscripción. Por favor intenta de nuevo.",
      });
      scrollToSection("registro-express");
    } finally {
      setSubmitting(false);
    }
  };

  // Regla de Negocio: Actividad Paga vs Convocatoria Gratuita
  const isPaidCourse = Boolean(
    selectedTraining &&
      (Number(selectedTraining.price) > 0 || selectedTraining.isFree === false)
  );

  // Aforo según la regla: si es cobrada son 18 puestos estrictos, si es gratuita permite hasta 40 pre-inscripciones
  const maxSeats = isPaidCourse ? 18 : Math.max(Number(selectedTraining?.maxCapacity) || 40, 40);
  const occupiedSeats = Number(
    selectedTraining?.stats?.totalOccupied ?? selectedTraining?.occupiedCount ?? 0
  );
  const availableSeats = Math.max(0, maxSeats - occupiedSeats);
  const occupancyPct = Math.min(100, Math.round((occupiedSeats / maxSeats) * 100));

  const activeFormQuestions: FormQuestion[] = Array.isArray(selectedTraining?.formQuestions)
    ? selectedTraining.formQuestions
    : [];

  // Métodos de pago permitidos expresados para este curso
  const explicitMethods =
    Array.isArray(selectedTraining?.paymentMethods) && selectedTraining.paymentMethods.length > 0
      ? selectedTraining.paymentMethods
      : [];

  const paymentQuestion = activeFormQuestions.find((q) =>
    /pago|método|metodo|forma de pago/i.test(q.label) && Array.isArray(q.options) && q.options.length > 0
  );
  const questionMethods = paymentQuestion && paymentQuestion.options ? paymentQuestion.options : [];

  const allowedPaymentMethods: string[] =
    explicitMethods.length > 0
      ? explicitMethods
      : questionMethods.length > 0
      ? questionMethods
      : [
          "Pago Móvil (Pabilo)",
          "Zelle USD",
          "Binance Pay (USDT)",
          "Transferencia Bancaria Bs",
          "Efectivo en Tienda OnProtec",
        ];

  // Preguntas dinámicas para la sección 2 (omitiendo la pregunta de pago si ya se seleccionó en el bloque de cobro)
  const displayFormQuestions = activeFormQuestions.filter(
    (q) => !/método de pago|metodo de pago|forma de pago/i.test(q.label)
  );

  // Sincronizar el método de pago por defecto si no es parte de la lista permitida
  useEffect(() => {
    if (allowedPaymentMethods.length > 0 && !allowedPaymentMethods.includes(form.paymentMethod)) {
      setForm((prev) => ({ ...prev, paymentMethod: allowedPaymentMethods[0] }));
    }
  }, [selectedTraining?.id, allowedPaymentMethods.length]);

  const openTrainings = trainings.filter(
    (t) => t.status === "Planificado" || t.status === "En Publicidad"
  );

  return (
    <div className="min-h-screen flex flex-col bg-[#f8f9fc] dark:bg-[#0b0e17] text-[#1a1c29] dark:text-slate-100 transition-colors duration-200">
      {/* =====================================================================
          1. CINTILLO OFICIAL ONPROTEC (SEDE PRIVADA CORPORATIVA CARACAS)
      ===================================================================== */}
      <div className="w-full bg-[#f4730a] text-white py-2.5 px-4 text-center text-[11px] sm:text-xs font-black tracking-wider uppercase shadow-sm">
        <div className="max-w-[1580px] mx-auto flex flex-wrap items-center justify-center gap-x-6 gap-y-1">
          <span className="flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 flex-shrink-0" />
            SEDE CORPORATIVA ONPROTEC (CARACAS) • ACCESO EXCLUSIVO CON PREVIA INVITACIÓN / CONFIRMACIÓN
          </span>
          <span className="hidden md:inline opacity-60">•</span>
          <button
            type="button"
            onClick={() => scrollToSection("registro-express")}
            className="inline-flex items-center gap-1.5 bg-black/20 hover:bg-black/40 px-3 py-0.5 rounded-full transition cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#fdff00]" />
            <span className="underline font-bold">👉 Clic aquí para Inscribirte en Sala VIP</span>
          </button>
        </div>
      </div>

      {/* =====================================================================
          2. HEADER EJECUTIVO LIMPIO (SIN SATURACIÓN NI EFECTO CABINA DE AVIÓN)
      ===================================================================== */}
      <header className="sticky top-0 z-50 bg-white/95 dark:bg-[#111526]/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 shadow-[0_4px_20px_rgba(42,40,92,0.05)]">
        <div className="max-w-[1580px] mx-auto px-4 sm:px-8 py-3.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <OnprotecBrand />
            <div className="hidden lg:block pl-3.5 border-l border-slate-200 dark:border-slate-800">
              <span className="text-[10px] font-black uppercase tracking-wider text-[#f4730a] block">
                SALA DE CAPACITACIONES
              </span>
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                <Lock className="w-3 h-3 text-[#f4730a]" />
                Sede OnProtec Caracas (Acceso Privado)
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            <button
              type="button"
              onClick={() => scrollToSection("registro-express")}
              className="inline-flex items-center gap-2 bg-[#f4730a] hover:bg-[#ef7922] text-white text-xs sm:text-sm font-black uppercase tracking-wider px-5 py-2.5 rounded-full shadow-md shadow-[#f4730a]/25 transition-all cursor-pointer hover:-translate-y-0.5"
            >
              <span>Asegurar Cupo</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            <a
              href="https://www.onprotec.com"
              target="_blank"
              rel="noreferrer"
              className="hidden sm:inline-flex items-center gap-1.5 text-xs font-bold text-[#2a285c] dark:text-slate-200 hover:text-[#f4730a] px-3.5 py-2 rounded-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/70 transition-colors"
            >
              <span>Tienda OnProtec</span>
              <ExternalLink className="w-3 h-3 text-[#f4730a]" />
            </a>

            <ThemeToggle />

            <Link
              href="/admin"
              className="inline-flex items-center gap-1.5 text-xs font-extrabold text-white bg-[#2a285c] hover:bg-[#1f1d47] px-3.5 py-2 rounded-full transition-all shadow-sm"
              title="Panel Administrativo"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-[#f4730a]" />
              <span className="hidden md:inline">Admin</span>
            </Link>
          </div>
        </div>
      </header>

      {/* =====================================================================
          3. HERO CORPORATIVO: CARTA DE PRESENTACIÓN DE LA SALA VIP
      ===================================================================== */}
      <section className="relative onprotec-hex-bg border-b border-slate-200/80 dark:border-slate-800 py-10 lg:py-14 overflow-hidden">
        <div className="max-w-[1580px] mx-auto px-4 sm:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
            {/* Columna Izquierda (7 cols): Título, Exclusividad y Valores de la Sala */}
            <div className="lg:col-span-7 space-y-4">
              <div className="inline-flex items-center gap-2 bg-white dark:bg-slate-900 border border-[#f4730a]/40 rounded-full pl-2.5 pr-4 py-1 shadow-sm">
                <span className="bg-[#f4730a] text-white text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full">
                  SALA TÉCNICA VIP
                </span>
                <span className="text-xs font-extrabold text-[#2a285c] dark:text-slate-200 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-[#f4730a]" />
                  Sede Corporativa OnProtec Caracas (Acceso Exclusivo con Invitación)
                </span>
              </div>

              <div>
                <p className="text-xs sm:text-sm font-extrabold uppercase tracking-[0.2em] text-[#f4730a] mb-1">
                  CENTRO DE ENTRENAMIENTO & CERTIFICACIÓN TÉCNICA ONPROTEC®
                </p>
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-[#1a1c29] dark:text-white leading-[1.1]">
                  La formación práctica definitiva para{" "}
                  <span className="text-[#f4730a]">Instaladores e Integradores</span> en Caracas
                </h1>
              </div>

              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 font-medium leading-relaxed max-w-2xl">
                Nuestra sala de capacitaciones corporativa en Caracas está equipada con tecnología de punta para dominar tecnologías de CCTV, Redes, Control de Acceso y Energía con{" "}
                <strong className="text-[#f4730a]">equipos reales energizados en vivo</strong>. Aforo VIP limitado a 18 puestos de trabajo individuales para máxima interacción con instructores certificados.
              </p>

              {/* 3 Insignias de Prestigio */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 max-w-2xl">
                <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-500/10 text-[#f4730a] flex items-center justify-center flex-shrink-0">
                    <Lock className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-extrabold text-[#2a285c] dark:text-white">Sede Corporativa</p>
                    <p className="text-[11px] text-slate-500">Piso enviado al confirmar</p>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-500/10 text-[#2a285c] dark:text-cyan-400 flex items-center justify-center flex-shrink-0">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-extrabold text-[#2a285c] dark:text-white">18 Puestos VIP</p>
                    <p className="text-[11px] text-slate-500">Hardware energizado</p>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0">
                    <Award className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-extrabold text-[#2a285c] dark:text-white">Certificación Oficial</p>
                    <p className="text-[11px] text-slate-500">Respaldo Fabricantes</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Columna Derecha (5 cols): Tarjeta de Orientación Directa hacia el Formulario Justo Debajo */}
            <div className="lg:col-span-5">
              <div className="bg-white dark:bg-[#13182b] rounded-3xl border-2 border-[#f4730a]/40 dark:border-slate-700 p-6 sm:p-7 shadow-[0_12px_40px_rgba(42,40,92,0.08)] space-y-4">
                <div className="flex items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
                  <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest bg-[#2a285c] text-white px-3 py-1 rounded-full keep-white">
                    <Sparkles className="w-3 h-3 text-[#fdff00]" /> PRÓXIMA CONVOCATORIA
                  </span>
                  {selectedTraining && (
                    <span className="text-xs font-mono font-extrabold text-[#f4730a] bg-orange-50 dark:bg-orange-950/40 px-2.5 py-0.5 rounded-lg border border-[#f4730a]/30">
                      {selectedTraining.code}
                    </span>
                  )}
                </div>

                <div>
                  <h3 className="text-base sm:text-lg font-black text-[#2a285c] dark:text-white leading-snug">
                    {selectedTraining ? selectedTraining.name || selectedTraining.title : "Capacitación Técnica OnProtec"}
                  </h3>
                  <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs font-bold text-slate-600 dark:text-slate-300 mt-2">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-[#f4730a]" />
                      {selectedTraining ? fmtLocalDate(selectedTraining.eventDate || selectedTraining.startDate) : ""}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-[#2a285c] dark:text-cyan-400" />
                      {selectedTraining ? fmtLocalHour(selectedTraining.eventDate || selectedTraining.startDate) : ""} (Caracas)
                    </span>
                  </div>
                </div>

                {/* Llamado de Atención Visual con Flecha Animada hacia el Formulario */}
                <div className="p-4 bg-orange-50/90 dark:bg-orange-500/10 border-2 border-dashed border-[#f4730a] rounded-2xl text-center space-y-2">
                  <div className="flex items-center justify-center gap-1.5 text-xs font-black uppercase text-[#f4730a] tracking-wider animate-bounce">
                    <ChevronDown className="w-4 h-4 text-[#f4730a]" />
                    <span>EL FORMULARIO ESTÁ JUSTO DEBAJO</span>
                    <ChevronDown className="w-4 h-4 text-[#f4730a]" />
                  </div>
                  <p className="text-xs text-slate-700 dark:text-slate-300 font-medium leading-relaxed">
                    Desliza hacia abajo o presiona el botón para completar tu registro en esta misma columna.
                  </p>
                  <button
                    type="button"
                    onClick={() => scrollToSection("registro-express")}
                    className="w-full py-3 px-4 bg-[#f4730a] hover:bg-[#ef7922] text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-[#f4730a]/30 transition-all flex items-center justify-center gap-2 cursor-pointer hover:-translate-y-0.5"
                  >
                    <span>✍️ Ir al Formulario de Inscripción ↓</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          4. SECCIÓN PRINCIPAL: CONVOCATORIA ACTIVA & REGISTRO EXPRESS (WIDESCREEN 7 / 5)
      ===================================================================== */}
      <section id="registro-express" className="py-12 lg:py-16 flex-1">
        <div className="max-w-[1580px] mx-auto px-4 sm:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
            {/* -------------------------------------------------------------
                COLUMNA IZQUIERDA (7 cols): CONVOCATORIA ACTUAL EN SALA VIP
            ------------------------------------------------------------- */}
            <div className="lg:col-span-7 space-y-6">
              {/* Selector Limpio si existen varias capacitaciones abiertas */}
              {openTrainings.length > 1 && (
                <div className="bg-white dark:bg-[#13182b] p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-[#f4730a]" />
                    <span className="text-xs font-extrabold text-[#2a285c] dark:text-white">
                      Convocatorias Disponibles:
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {openTrainings.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setSelectedTraining(t)}
                        className={`text-xs px-3.5 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                          selectedTraining?.id === t.id
                            ? "bg-[#f4730a] text-white shadow-sm"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                        }`}
                      >
                        {t.code} • {t.brand || "OnProtec"}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Ficha Ejecutiva del Evento Seleccionado */}
              {selectedTraining ? (
                <div className="bg-white dark:bg-[#13182b] rounded-3xl border-2 border-slate-200/90 dark:border-slate-800 shadow-md overflow-hidden">
                  {/* Cabecera del Evento */}
                  <div className="bg-[#2a285c] text-white p-6 sm:p-7 keep-white">
                    <div className="flex items-center justify-between gap-3 mb-2.5 flex-wrap">
                      <span className="text-xs font-mono font-bold bg-white/15 px-3 py-1 rounded-full text-[#fdff00] keep-white border border-white/20">
                        {selectedTraining.code}
                      </span>
                      <span
                        className={`text-[10px] font-black uppercase px-3 py-1 rounded-full ${
                          isPaidCourse
                            ? "bg-amber-400 text-amber-950 font-black"
                            : "bg-emerald-400 text-emerald-950 font-black"
                        }`}
                      >
                        {isPaidCourse
                          ? `INVERSIÓN: ${formatCurrency(selectedTraining.price)}`
                          : "100% GRATUITO • PRE-INSCRIPCIÓN"}
                      </span>
                    </div>

                    <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-white keep-white leading-snug">
                      {selectedTraining.name || selectedTraining.title}
                    </h2>

                    <p className="text-xs text-slate-200 mt-2 flex items-center gap-1.5 keep-white">
                      <span>Instructor:</span>
                      <strong className="text-[#fdff00] font-bold">
                        {selectedTraining.instructor || "Especialista Certificado OnProtec"}
                      </strong>
                    </p>
                  </div>

                  {/* Ficha de Información de Convocatoria */}
                  <div className="p-6 sm:p-7 space-y-5">
                    {/* Cuadrícula de Datos Clave (Fecha, Horario, Ubicación y Costo) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                        <span className="text-[10px] font-extrabold uppercase text-slate-400 block mb-1">
                          📅 Fecha y Horario
                        </span>
                        <p className="text-sm font-black text-[#2a285c] dark:text-white">
                          {fmtLocalDate(selectedTraining.eventDate || selectedTraining.startDate)}
                        </p>
                        <p className="text-xs font-bold text-[#f4730a] mt-0.5 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {fmtLocalHour(selectedTraining.eventDate || selectedTraining.startDate)} (Hora Caracas)
                        </p>
                      </div>

                      <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                        <span className="text-[10px] font-extrabold uppercase text-slate-400 block mb-1">
                          📍 Sede Presencial
                        </span>
                        <p className="text-sm font-black text-[#2a285c] dark:text-white flex items-center gap-1">
                          <Lock className="w-4 h-4 text-[#f4730a] flex-shrink-0" />
                          <span>Sede Corporativa OnProtec (Caracas)</span>
                        </p>
                        <p className="text-[10px] text-slate-500 mt-1 leading-snug">
                          🔒 Dirección exacta y piso se suministran vía WhatsApp/correo a participantes confirmados.
                        </p>
                      </div>
                    </div>

                    {/* Termómetro de Cupos & Política de Aforo */}
                    <div className="p-4 rounded-2xl bg-orange-50/70 dark:bg-orange-500/10 border border-[#f4730a]/30 space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span className="text-[#2a285c] dark:text-slate-200 flex items-center gap-1.5">
                          <Users className="w-4 h-4 text-[#f4730a]" />
                          {isPaidCourse
                            ? "Aforo Estricto de Sala (18 puestos VIP)"
                            : "Pre-inscripción Abierta (Meta: hasta 40 registrados)"}
                        </span>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[11px] font-black ${
                            availableSeats > 0
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300"
                              : "bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300"
                          }`}
                        >
                          {availableSeats > 0
                            ? isPaidCourse
                              ? `${availableSeats} puestos libres de 18`
                              : `${occupiedSeats} de ${maxSeats} pre-inscritos`
                            : "Lista de espera activa"}
                        </span>
                      </div>

                      <div className="w-full h-2.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-[#f4730a] to-[#2a285c] rounded-full transition-all duration-500"
                          style={{ width: `${Math.max(10, occupancyPct)}%` }}
                        />
                      </div>

                      <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-snug">
                        {isPaidCourse ? (
                          <>
                            <strong>Inscripción con asiento garantizado:</strong> Solo 18 puestos VIP disponibles con verificación de comprobante de pago.
                          </>
                        ) : (
                          <>
                            <strong>Convocatoria abierta para reconfirmación:</strong> Se permite registrar hasta 40 participantes para reconfirmar telefónicamente a los <strong>18 asistentes físicos</strong> que ingresarán a sala (compensando el No-Show habitual).
                          </>
                        )}
                      </p>
                    </div>

                    {/* Nota de Presentación del Instructor */}
                    {selectedTraining.presentationNotes && (
                      <div className="bg-slate-50 dark:bg-slate-900 border-l-4 border-[#2a285c] p-4 rounded-r-2xl text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                        <p className="font-extrabold text-[#2a285c] dark:text-white text-[11px] uppercase tracking-wider mb-1">
                          Nota del Instructor:
                        </p>
                        {selectedTraining.presentationNotes}
                      </div>
                    )}

                    {/* Beneficios Incluidos */}
                    <div className="pt-2">
                      <p className="text-xs font-black uppercase tracking-wider text-[#2a285c] dark:text-white mb-2.5">
                        ¿Qué incluye tu participación en sala?
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-700 dark:text-slate-300 font-medium">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                          <span>Equipos en vivo energizados en cada puesto</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                          <span>Certificado de participación oficial OnProtec</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                          <span>Coffee break ejecutivo y networking técnico</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                          <span>Precios especiales en tienda y compras Cashea</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 text-center text-slate-500">
                  Cargando capacitaciones...
                </div>
              )}
            </div>

            {/* -------------------------------------------------------------
                COLUMNA DERECHA (5 cols): FORMULARIO DE REGISTRO SIN FRICCIÓN
            ------------------------------------------------------------- */}
            <div className="lg:col-span-5 lg:sticky lg:top-24">
              <div className="bg-white dark:bg-[#13182b] rounded-3xl border-2 border-[#2a285c]/15 dark:border-slate-800 shadow-[0_20px_50px_rgba(42,40,92,0.10)] overflow-hidden">
                {/* Cabecera del Formulario con Fecha y Sede */}
                <div className="bg-gradient-to-r from-[#2a285c] to-[#1f1d47] text-white p-6 keep-white">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest bg-[#f4730a] text-white px-3 py-1 rounded-full keep-white shadow-sm">
                      <Lock className="w-3 h-3" /> FORMULARIO OFICIAL
                    </span>
                    {selectedTraining && (
                      <span className="text-xs font-mono font-bold text-[#fdff00] keep-white bg-white/10 px-2.5 py-0.5 rounded-lg border border-white/20">
                        {selectedTraining.code}
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg sm:text-xl font-black text-white keep-white leading-tight">
                    {selectedTraining ? selectedTraining.name || selectedTraining.title : "Reserva tu Cupo en Sala VIP"}
                  </h3>
                  <div className="mt-2.5 pt-2 border-t border-white/15 flex items-center justify-between text-xs text-slate-200 keep-white">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-[#fdff00]" />
                      {selectedTraining ? fmtLocalDate(selectedTraining.eventDate || selectedTraining.startDate) : ""}
                    </span>
                    <span className="flex items-center gap-1 text-[11px] text-slate-300">
                      <Lock className="w-3.5 h-3.5 text-[#f4730a]" />
                      Sede OnProtec Caracas (Acceso Privado)
                    </span>
                  </div>
                </div>

                <div className="p-6">
                  {!isSelectedTrainingOpen ? (
                    <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 text-center space-y-3">
                      <Lock className="w-8 h-8 text-amber-500 mx-auto" />
                      <h4 className="text-base font-extrabold text-[#2a285c] dark:text-white">
                        Inscripciones Cerradas para este Evento
                      </h4>
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        Este curso ya culminó o se encuentra en estado cerrado. Selecciona otra capacitación abierta en el listado.
                      </p>
                    </div>
                  ) : (
                    <>
                      {/* Mensaje de Resultado de Inscripción */}
                      {submissionResult && (
                        <div
                          className={`mb-5 p-4 rounded-2xl border-2 ${
                            submissionResult.success
                              ? "bg-emerald-50 border-emerald-300 text-emerald-900 dark:bg-emerald-500/10 dark:border-emerald-500/40 dark:text-emerald-200"
                              : "bg-rose-50 border-rose-300 text-rose-900 dark:bg-rose-500/10 dark:border-rose-500/40 dark:text-rose-200"
                          }`}
                        >
                          <div className="flex items-start gap-2.5 text-xs">
                            {submissionResult.success ? (
                              <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                            ) : (
                              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                            )}
                            <div>
                              <p className="font-extrabold text-sm">
                                {submissionResult.message || submissionResult.error}
                              </p>
                              {submissionResult.data && (
                                <p className="text-xs mt-1">
                                  Nro. de Registro: #{submissionResult.data.id} • Estado: {submissionResult.data.status}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      <form onSubmit={handleSubmit} className="space-y-4">
                        {/* GRUPO 1: DATOS DEL PARTICIPANTE */}
                        <div className="space-y-3">
                          <label className="block text-xs font-black uppercase tracking-wider text-[#2a285c] dark:text-slate-200">
                            1. Datos del Instalador / Participante
                          </label>

                          <div>
                            <input
                              type="text"
                              required
                              placeholder="Nombre y Apellido Completo *"
                              value={form.name}
                              onChange={(e) => setForm({ ...form, name: e.target.value })}
                              className="w-full bg-[#f8f9fc] dark:bg-slate-900 border border-slate-300 dark:border-slate-700 focus:border-[#f4730a] rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-900 dark:text-white outline-none"
                            />
                          </div>

                          <div className="grid grid-cols-12 gap-2">
                            <div className="col-span-4">
                              <select
                                value={form.docType}
                                onChange={(e) => setForm({ ...form, docType: e.target.value })}
                                className="w-full bg-[#f8f9fc] dark:bg-slate-900 border border-slate-300 dark:border-slate-700 focus:border-[#f4730a] rounded-xl px-2.5 py-2.5 text-xs font-bold text-slate-900 dark:text-white outline-none"
                              >
                                <option value="V">V-</option>
                                <option value="E">E-</option>
                                <option value="J">J-</option>
                                <option value="P">P-</option>
                              </select>
                            </div>
                            <div className="col-span-8">
                              <input
                                type="text"
                                required
                                placeholder="Cédula / RIF *"
                                value={form.docNumber}
                                onChange={(e) => setForm({ ...form, docNumber: e.target.value })}
                                className="w-full bg-[#f8f9fc] dark:bg-slate-900 border border-slate-300 dark:border-slate-700 focus:border-[#f4730a] rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-900 dark:text-white outline-none"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <input
                              type="tel"
                              required
                              placeholder="WhatsApp (0412/0414) *"
                              value={form.phone}
                              onChange={(e) => setForm({ ...form, phone: e.target.value })}
                              className="w-full bg-[#f8f9fc] dark:bg-slate-900 border border-slate-300 dark:border-slate-700 focus:border-[#f4730a] rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-900 dark:text-white outline-none"
                            />
                            <input
                              type="email"
                              required
                              placeholder="Correo Electrónico *"
                              value={form.email}
                              onChange={(e) => setForm({ ...form, email: e.target.value })}
                              className="w-full bg-[#f8f9fc] dark:bg-slate-900 border border-slate-300 dark:border-slate-700 focus:border-[#f4730a] rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-900 dark:text-white outline-none"
                            />
                          </div>

                          <input
                            type="text"
                            placeholder="Empresa / Emprendimiento (Opcional)"
                            value={form.company}
                            onChange={(e) => setForm({ ...form, company: e.target.value })}
                            className="w-full bg-[#f8f9fc] dark:bg-slate-900 border border-slate-300 dark:border-slate-700 focus:border-[#f4730a] rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-900 dark:text-white outline-none"
                          />
                        </div>

                        {/* GRUPO 2: PREGUNTAS ESPECÍFICAS DE LA CAPACITACIÓN (TOTALMENTE EDITABLE) */}
                        {displayFormQuestions.length > 0 && (
                          <div className="space-y-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                            <div>
                              <label className="block text-xs font-black uppercase tracking-wider text-[#2a285c] dark:text-slate-200">
                                2. {selectedTraining?.formQuestionsTitle || "Preguntas Específicas del Curso"} ({displayFormQuestions.length})
                              </label>
                              {selectedTraining?.formQuestionsDescription && (
                                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                                  {selectedTraining.formQuestionsDescription}
                                </p>
                              )}
                            </div>

                            <div className="space-y-2.5 bg-slate-50 dark:bg-slate-900/90 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800">
                              {displayFormQuestions.map((q) => (
                                <div key={q.id}>
                                  <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 mb-1">
                                    {q.label} {q.required && <span className="text-[#f4730a]">*</span>}
                                  </label>

                                  {q.type === "select" && Array.isArray(q.options) ? (
                                    <select
                                      required={q.required}
                                      value={customAnswers[q.id] || ""}
                                      onChange={(e) =>
                                        setCustomAnswers({ ...customAnswers, [q.id]: e.target.value })
                                      }
                                      className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-white outline-none"
                                    >
                                      <option value="">Selecciona una opción...</option>
                                      {q.options.map((opt, i) => (
                                        <option key={i} value={opt}>
                                          {opt}
                                        </option>
                                      ))}
                                    </select>
                                  ) : q.type === "file" ? (
                                    <div className="space-y-2">
                                      {customAnswers[q.id] ? (
                                        <div className="flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-slate-950 border border-emerald-500">
                                          <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5 truncate">
                                            <FileCheck className="w-4 h-4 flex-shrink-0" />
                                            Archivo cargado exitosamente
                                          </span>
                                          <button
                                            type="button"
                                            onClick={() => {
                                              const next = { ...customAnswers };
                                              delete next[q.id];
                                              setCustomAnswers(next);
                                            }}
                                            className="text-rose-500 hover:text-rose-700 p-1"
                                          >
                                            <Trash2 className="w-3.5 h-3.5" />
                                          </button>
                                        </div>
                                      ) : (
                                        <label className="flex items-center justify-center gap-2 p-3 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl cursor-pointer hover:border-[#f4730a] text-xs font-bold text-slate-600 dark:text-slate-400">
                                          <UploadCloud className="w-4 h-4 text-[#f4730a]" />
                                          <span>Clic para adjuntar archivo o comprobante (Máx 8MB)</span>
                                          <input
                                            type="file"
                                            accept="image/*,application/pdf"
                                            required={q.required}
                                            className="hidden"
                                            onChange={(e) => {
                                              const f = e.target.files?.[0];
                                              if (!f) return;
                                              const reader = new FileReader();
                                              reader.onload = (ev) => {
                                                const b64 = ev.target?.result as string;
                                                setCustomAnswers((prev) => ({ ...prev, [q.id]: b64 }));
                                                setForm((prev) => ({ ...prev, paymentProofUrl: b64 }));
                                              };
                                              reader.readAsDataURL(f);
                                            }}
                                          />
                                        </label>
                                      )}
                                    </div>
                                  ) : (
                                    <input
                                      type="text"
                                      required={q.required}
                                      placeholder={q.placeholder || "Escribe tu respuesta..."}
                                      value={customAnswers[q.id] || ""}
                                      onChange={(e) =>
                                        setCustomAnswers({ ...customAnswers, [q.id]: e.target.value })
                                      }
                                      className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-white outline-none"
                                    />
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* GRUPO 3: REPORTE DE PAGO (SOLO SI EL CURSO ES COBRADO) */}
                        {isPaidCourse && (
                          <div className="p-4 rounded-2xl bg-amber-50/90 dark:bg-amber-500/10 border border-amber-300 dark:border-amber-500/30 space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-black text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                                <CreditCard className="w-4 h-4" />
                                Inversión de Certificación
                              </span>
                              <span className="text-base font-black text-amber-900 dark:text-amber-200">
                                {formatCurrency(selectedTraining.price)}
                              </span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              <select
                                value={form.paymentMethod}
                                onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}
                                className="bg-white dark:bg-slate-900 border border-amber-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-white outline-none"
                              >
                                {allowedPaymentMethods.map((m) => (
                                  <option key={m} value={m}>
                                    {m}
                                  </option>
                                ))}
                              </select>

                              <input
                                type="text"
                                placeholder="Nro. Referencia Bancaria"
                                value={form.paymentReference}
                                onChange={(e) => setForm({ ...form, paymentReference: e.target.value })}
                                className="bg-white dark:bg-slate-900 border border-amber-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-white outline-none"
                              />
                            </div>

                            {/* Carga de Comprobante de Pago */}
                            <div className="pt-2 border-t border-amber-200 dark:border-amber-500/20">
                              <label className="block text-xs font-black text-amber-900 dark:text-amber-200 mb-1.5 flex items-center gap-1.5">
                                <UploadCloud className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                                Adjuntar Comprobante de Pago (Voucher / Captura / PDF)
                              </label>

                              {form.paymentProofUrl ? (
                                <div className="flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-emerald-400 dark:border-emerald-600 shadow-sm">
                                  <div className="flex items-center gap-2 truncate">
                                    {form.paymentProofUrl.startsWith("data:image/") ? (
                                      <img
                                        src={form.paymentProofUrl}
                                        alt="Comprobante"
                                        className="w-10 h-10 object-cover rounded-lg border border-slate-200 dark:border-slate-700 flex-shrink-0"
                                      />
                                    ) : (
                                      <FileCheck className="w-8 h-8 text-emerald-600 flex-shrink-0" />
                                    )}
                                    <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300 truncate">
                                      Comprobante adjuntado listo
                                    </span>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => setForm({ ...form, paymentProofUrl: "" })}
                                    className="p-1.5 text-rose-500 hover:text-rose-700"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              ) : (
                                <label className="flex flex-col items-center justify-center p-3 border-2 border-dashed border-amber-300 dark:border-amber-500/40 hover:border-amber-500 rounded-xl bg-white/70 dark:bg-slate-900/60 cursor-pointer transition text-center">
                                  <UploadCloud className="w-5 h-5 text-amber-600 mb-1" />
                                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                    Clic o arrastra para subir captura de pago
                                  </span>
                                  <span className="text-[10px] text-slate-500">JPG, PNG o PDF (Máx 8MB)</span>
                                  <input
                                    type="file"
                                    accept="image/*,application/pdf"
                                    className="hidden"
                                    onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      if (!file) return;
                                      const reader = new FileReader();
                                      reader.onload = (ev) => {
                                        setForm((prev) => ({
                                          ...prev,
                                          paymentProofUrl: ev.target?.result as string,
                                        }));
                                      };
                                      reader.readAsDataURL(file);
                                    }}
                                  />
                                </label>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Botón de Confirmación Principal */}
                        <button
                          type="submit"
                          disabled={submitting || !selectedTraining}
                          className="w-full py-4 px-6 rounded-2xl bg-[#f4730a] hover:bg-[#ef7922] disabled:opacity-50 text-white font-black text-sm uppercase tracking-wider shadow-[0_12px_28px_rgba(244,115,10,0.35)] hover:shadow-[0_16px_32px_rgba(244,115,10,0.50)] transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
                        >
                          {submitting ? (
                            <span>Procesando Registro...</span>
                          ) : availableSeats === 0 ? (
                            <span>Ingresar a Lista de Espera</span>
                          ) : isPaidCourse ? (
                            <span>Confirmar Reserva y Enviar Comprobante</span>
                          ) : (
                            <span>Completar Pre-Inscripción Gratuita</span>
                          )}
                        </button>
                      </form>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          5. ¿POR QUÉ CERTIFICARTE EN LA SALA VIP ONPROTEC? (3 TARJETAS MINIMALISTAS)
      ===================================================================== */}
      <section className="py-12 lg:py-16 bg-white dark:bg-[#111526] border-t border-slate-200/80 dark:border-slate-800">
        <div className="max-w-[1580px] mx-auto px-4 sm:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="text-xs font-black uppercase tracking-widest text-[#f4730a]">
              INFRAESTRUCTURA DE ALTO RENDIMIENTO
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-[#2a285c] dark:text-white mt-1">
              ¿Por qué formarte en la Sala VIP OnProtec?
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-2">
              Diseñamos un entorno corporativo exclusivo en nuestra sede de Caracas para que el aprendizaje sea 100% práctico y aplicable a proyectos reales.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-3xl bg-[#f8f9fc] dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-orange-100 dark:bg-orange-500/10 text-[#f4730a] flex items-center justify-center">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-black text-[#2a285c] dark:text-white">
                Equipos Energizados en Vivo
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                Sin simuladores ni teoría abstracta. Cada instalador interactúa con cámaras IP, NVRs, biométricos, switches administrables y routers configurados en tiempo real.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-[#f8f9fc] dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-500/10 text-[#2a285c] dark:text-cyan-400 flex items-center justify-center">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-black text-[#2a285c] dark:text-white">
                Aforo Exclusivo de 18 Puestos
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                Garantizamos atención personalizada del ponente en un ambiente corporativo climatizado, cómodo y profesional.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-[#f8f9fc] dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <Building2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-black text-[#2a285c] dark:text-white">
                Ecosistema Comercial & Cashea
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                Acceso a precios de distribuidor para proyectos, asesoría post-capacitación y financiamiento con Cashea directamente en nuestra tienda oficial.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          6. MARCAS ALIADAS OFICIALES
      ===================================================================== */}
      <section className="py-10 bg-[#f8f9fc] dark:bg-[#0b0e17] border-t border-slate-200/80 dark:border-slate-800 text-center">
        <div className="max-w-[1580px] mx-auto px-4 sm:px-8">
          <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-6">
            TECNOLOGÍAS Y MARCAS OFICIALES CERTIFICADAS EN SALA ONPROTEC®
          </p>
          <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10 opacity-70 hover:opacity-100 transition-opacity">
            {PARTNER_BRANDS.map((brand, i) => (
              <span
                key={i}
                className="text-xs sm:text-sm font-extrabold text-[#2a285c] dark:text-slate-300 tracking-wide bg-white dark:bg-slate-900 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm"
              >
                {brand.name}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* =====================================================================
          7. FOOTER CORPORATIVO OFICIAL
      ===================================================================== */}
      <footer className="bg-[#2a285c] text-white py-12 px-4 sm:px-8 border-t border-slate-800 keep-white">
        <div className="max-w-[1580px] mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
          <div className="space-y-1.5">
            <p className="text-base font-black text-white keep-white">
              OnProtec® | Sala de Capacitaciones — La Tienda del Instalador
            </p>
            <p className="text-xs text-slate-300 flex items-center justify-center md:justify-start gap-1.5 keep-white">
              <Lock className="w-3.5 h-3.5 text-[#f4730a]" />
              Sede Corporativa OnProtec • Caracas, Venezuela (Acceso exclusivo con invitación confirmada).
            </p>
            <p className="text-[11px] text-slate-400">
              RIF: J-40685449-2 • Contacto: ventas@onprotec.com | WhatsApp: +58 412 9635648
            </p>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="https://www.onprotec.com"
              target="_blank"
              rel="noreferrer"
              className="text-xs font-bold text-white hover:text-[#fdff00] underline"
            >
              Visitar www.onprotec.com
            </a>
            <span className="opacity-40">•</span>
            <Link
              href="/admin"
              className="text-xs font-bold text-slate-300 hover:text-white"
            >
              Acceso Administrativo
            </Link>
          </div>
        </div>
      </footer>

      {/* =====================================================================
          8. BOTÓN FLOTANTE STICKY PARA MÓVIL (FÁCIL ACCESO A INSCRIPCIÓN)
      ===================================================================== */}
      <div className="lg:hidden fixed bottom-4 left-4 right-4 z-40">
        <button
          type="button"
          onClick={() => scrollToSection("registro-express")}
          className="w-full bg-[#f4730a] hover:bg-[#ef7922] text-white font-black py-3.5 px-4 rounded-2xl shadow-2xl shadow-[#f4730a]/40 flex items-center justify-center gap-2 text-sm uppercase tracking-wider transition-all"
        >
          <span>✍️ Inscribirme en la Capacitación</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* =====================================================================
          9. MODAL EJECUTIVO DE CONFIRMACIÓN POST-ENVÍO (PAGAS VS. GRATUITAS)
      ===================================================================== */}
      {showConfirmationModal && submissionResult?.success && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-white dark:bg-[#13182b] border-2 border-slate-300 dark:border-slate-700 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            {/* Header del Modal según si es cobrada o gratuita */}
            {isPaidCourse ? (
              <div className="text-center space-y-3">
                <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center shadow-inner">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-900 border border-emerald-300 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/40">
                  ✓ FORMALMENTE INSCRITO • CUPO VIP GARANTIZADO
                </span>
                <h3 className="text-2xl font-black text-[#2a285c] dark:text-white">
                  ¡Inscripción Formalmente Confirmada!
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                  Hemos recibido tus datos y tu reporte de pago exitosamente. Tu cupo en la Sala VIP (aforo estricto de 18 puestos) ha quedado reservado y formalmente garantizado al reportar tu comprobante.
                </p>
                <div className="p-3.5 bg-emerald-50/80 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 rounded-2xl text-left text-xs space-y-1">
                  <p className="font-extrabold text-emerald-900 dark:text-emerald-200">
                    ¿Qué sigue a continuación?
                  </p>
                  <p className="text-emerald-800 dark:text-emerald-300 text-[11px] leading-snug">
                    Nuestro equipo verificará el comprobante de pago. El equipo de OnProtec se comunicará contigo vía WhatsApp en breve para confirmar los detalles finales y enviarte las instrucciones privadas de acceso a la sala.
                  </p>
                </div>
              </div>
            ) : submissionResult.isWaitlist ? (
              <div className="text-center space-y-3">
                <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 mx-auto flex items-center justify-center">
                  <Clock className="w-10 h-10" />
                </div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300 dark:bg-amber-500/20 dark:text-amber-300">
                  🟠 REGISTRADO EN LISTA DE ESPERA
                </span>
                <h3 className="text-2xl font-black text-[#2a285c] dark:text-white">
                  Convocatoria al Límite
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                  La convocatoria para esta capacitación ha alcanzado su capacidad máxima. Has quedado registrado con prioridad en nuestra Lista de Espera.
                </p>
                <div className="p-3.5 bg-amber-50/80 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 rounded-2xl text-left text-xs">
                  <p className="text-amber-800 dark:text-amber-300 text-[11px] leading-snug">
                    Si algún participante cancela su asistencia o se abre una nueva fecha, el equipo de OnProtec te contactará prioritariamente.
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center space-y-3">
                <div className="w-16 h-16 rounded-full bg-orange-100 dark:bg-orange-500/20 text-[#f4730a] mx-auto flex items-center justify-center shadow-inner">
                  <Sparkles className="w-10 h-10" />
                </div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-orange-100 text-orange-900 border border-orange-300 dark:bg-orange-500/20 dark:text-orange-300 dark:border-orange-500/40">
                  📋 PRE-INSCRIPCIÓN REGISTRADA • EN PRESELECCIÓN
                </span>
                <h3 className="text-2xl font-black text-[#2a285c] dark:text-white">
                  ¡Pre-inscripción Recibida con Éxito!
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                  Tus datos han sido registrados en nuestro sistema de convocatoria. En OnProtec realizamos una preselección de los asistentes para asegurar la rotación de participantes y permitir que nuevos instaladores e integradores aprovechen los cupos en sala.
                </p>
                <div className="p-3.5 bg-orange-50/80 dark:bg-orange-500/10 border border-orange-200 dark:border-orange-500/30 rounded-2xl text-left text-xs space-y-1.5">
                  <p className="font-extrabold text-[#2a285c] dark:text-white">
                    Próximo Paso:
                  </p>
                  <p className="text-slate-700 dark:text-slate-300 text-[11px] leading-snug">
                    Pronto serás contactado por el equipo de OnProtec vía WhatsApp para confirmar tu invitación formal con mayores detalles.
                  </p>
                  <p className="text-[11px] text-[#f4730a] font-bold flex items-center gap-1">
                    <Lock className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>La dirección exacta y piso de la sede corporativa se suministrarán únicamente a los participantes con invitación formal confirmada.</span>
                  </p>
                </div>
              </div>
            )}

            {/* Ficha Resumen del Registro */}
            <div className="mt-4 p-3 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs space-y-1.5 font-medium">
              <div className="flex justify-between items-center text-slate-500 dark:text-slate-400 text-[11px]">
                <span>Nro. de Registro:</span>
                <strong className="font-mono text-slate-800 dark:text-white">
                  #{submissionResult.data?.id || "N/A"}
                </strong>
              </div>
              <div className="flex justify-between items-center text-slate-500 dark:text-slate-400 text-[11px]">
                <span>Participante:</span>
                <strong className="text-slate-800 dark:text-white">{form.name} ({form.docType}-{form.docNumber})</strong>
              </div>
              <div className="flex justify-between items-center text-slate-500 dark:text-slate-400 text-[11px]">
                <span>Capacitación:</span>
                <strong className="text-slate-800 dark:text-white truncate max-w-[240px]">
                  {selectedTraining?.code} • {selectedTraining?.name}
                </strong>
              </div>
              <div className="flex justify-between items-center text-slate-500 dark:text-slate-400 text-[11px]">
                <span>Fecha del Evento:</span>
                <strong className="text-[#f4730a]">
                  {selectedTraining ? fmtLocalDate(selectedTraining.eventDate) : ""}
                </strong>
              </div>
            </div>

            {/* Acciones */}
            <div className="mt-5 space-y-2">
              <a
                href={`https://wa.me/584129635648?text=${encodeURIComponent(
                  `Hola equipo de OnProtec, acabo de completar mi ${
                    isPaidCourse ? "inscripción" : "pre-inscripción"
                  } para la capacitación ${selectedTraining?.code} - ${selectedTraining?.name}. Mi nombre es ${form.name} (CI: ${form.docType}-${form.docNumber}).`
                )}`}
                target="_blank"
                rel="noreferrer"
                className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition cursor-pointer"
              >
                <Phone className="w-4 h-4" />
                <span>Contactar al Equipo de OnProtec por WhatsApp</span>
              </a>
              <button
                type="button"
                onClick={() => setShowConfirmationModal(false)}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs transition"
              >
                Aceptar y Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
