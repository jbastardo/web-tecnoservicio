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
  Copy,
  Loader2,
  X,
} from "lucide-react";
import { FormQuestion } from "@/types";
import {
  fmtLocalDate,
  fmtLocalHour,
  formatCurrency,
  ONPROTEC_WHATSAPP_DISPLAY,
  buildOnprotecWhatsAppUrl,
} from "@/utils/formatUtils";
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

  const getCaracasTodayYMD = () =>
    new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/Caracas",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());

  // Formulario de Fricción Cero con Etiquetas Flotantes
  const [form, setForm] = useState({
    name: "",
    docType: "V",
    docNumber: "",
    phone: "",
    email: "",
    company: "",
    city: "Caracas",
    paymentMethod: "Binance (Pabilo)",
    paymentReference: "",
    paymentProofUrl: "",
    specialNotes: "",
  });

  const [paymentDate, setPaymentDate] = useState<string>(() => getCaracasTodayYMD());
  const [verifyingPayment, setVerifyingPayment] = useState(false);
  const [pabiloVerification, setPabiloVerification] = useState<{
    verified: boolean;
    paymentId: string;
    verificationToken: string;
    amount: number;
    reference: string;
    message: string;
  } | null>(null);
  const [pabiloError, setPabiloError] = useState<string | null>(null);
  const [copiedBinanceId, setCopiedBinanceId] = useState(false);
  const [copiedZelleEmail, setCopiedZelleEmail] = useState(false);

  const [customAnswers, setCustomAnswers] = useState<Record<string, any>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<any | null>(null);

  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [isFormVisible, setIsFormVisible] = useState(false);

  useEffect(() => {
    if (!showConfirmationModal) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowConfirmationModal(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [showConfirmationModal]);

  useEffect(() => {
    if (typeof window === "undefined" || typeof IntersectionObserver === "undefined") return;
    const formEl = document.getElementById("formulario-oficial");
    if (!formEl) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsFormVisible(entry.isIntersecting);
      },
      { threshold: 0.15 }
    );
    observer.observe(formEl);
    return () => observer.disconnect();
  }, [loading]);

  useEffect(() => {
    fetch("/api/capacitaciones?order=desc")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data.length > 0) {
          setTrainings(data.data);
          const activeTrainings = data.data.filter(
            (t: any) => t.status === "Planificado" || t.status === "En Publicidad"
          );

          // Soporte para campañas de marketing vía URL (?curso=ezviz / ?curso=dahua / ?id=39 / ?id=40)
          let targetTraining: any = null;
          if (typeof window !== "undefined") {
            const urlParams = new URLSearchParams(window.location.search);
            const queryCurso = (urlParams.get("curso") || urlParams.get("c") || "").toLowerCase();
            const queryId = urlParams.get("id") || urlParams.get("cap");

            if (queryId) {
              targetTraining = data.data.find(
                (t: any) =>
                  String(t.id) === queryId ||
                  (t.code && t.code.toLowerCase().includes(queryId.toLowerCase()))
              );
            } else if (queryCurso) {
              targetTraining = data.data.find(
                (t: any) =>
                  (t.brand || "").toLowerCase().includes(queryCurso) ||
                  (t.name || "").toLowerCase().includes(queryCurso) ||
                  (t.code || "").toLowerCase().includes(queryCurso)
              );
            }
          }

          if (!targetTraining) {
            // Priorizar EZVIZ por defecto por solicitud del usuario
            targetTraining = activeTrainings.find(
              (t: any) =>
                (t.brand || "").toLowerCase().includes("ezviz") ||
                (t.name || "").toLowerCase().includes("ezviz") ||
                t.code === "CAP-2026-039"
            );
          }

          const planned =
            targetTraining ||
            activeTrainings[0] ||
            data.data[0];
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
    setPabiloVerification(null);
    setPabiloError(null);
    setForm((prev) => ({
      ...prev,
      paymentMethod: "Binance (Pabilo)",
      paymentReference: "",
      paymentProofUrl: "",
    }));
  }, [selectedTraining?.id]);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const handleSelectBannerTraining = (t: any) => {
    setSelectedTraining(t);
    scrollToSection("formulario-oficial");
    setTimeout(() => {
      const nameInput = document.getElementById("input-participant-name") as HTMLInputElement | null;
      if (nameInput) {
        nameInput.focus({ preventScroll: true });
      }
    }, 350);
  };

  const isSelectedTrainingOpen =
    selectedTraining &&
    (selectedTraining.status === "Planificado" || selectedTraining.status === "En Publicidad");

  const copyTextWithFeedback = (text: string, setFlag: (val: boolean) => void) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        setFlag(true);
        setTimeout(() => setFlag(false), 2500);
      });
    }
  };

  const handleCopyBinanceId = () => copyTextWithFeedback("1076181690", setCopiedBinanceId);
  const handleCopyZelleEmail = () => copyTextWithFeedback("zelle@onprotec.com", setCopiedZelleEmail);

  const handleVerifyPabiloPayment = async () => {
    if (!selectedTraining) return;
    const cleanRef = form.paymentReference.trim();
    if (cleanRef.length < 4) {
      setPabiloError("Ingresa el Nro. de Referencia / Order ID de Binance (mínimo 4 caracteres) para validar.");
      setPabiloVerification(null);
      return;
    }

    setVerifyingPayment(true);
    setPabiloError(null);
    setSubmissionResult(null);

    try {
      const res = await fetch("/api/pabilo/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trainingId: selectedTraining.id,
          reference: cleanRef,
          fechaPago: paymentDate,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success && data.verified) {
        setPabiloVerification({
          verified: true,
          paymentId: data.paymentId,
          verificationToken: data.verificationToken,
          amount: Number(data.amount || selectedTraining.price),
          reference: data.reference || cleanRef,
          message: data.message || "Pago real verificado con éxito vía Pabilo.",
        });
        setPabiloError(null);
      } else {
        setPabiloVerification(null);
        setPabiloError(data.error || "No se pudo verificar el pago en Binance.");
      }
    } catch {
      setPabiloVerification(null);
      setPabiloError("Error de red consultando Pabilo. Verifica tu conexión e intenta nuevamente.");
    } finally {
      setVerifyingPayment(false);
    }
  };

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

    if (isPaidCourse && isBinanceSelected && !pabiloVerification?.verified) {
      const msg =
        "Debes validar tu pago real de Binance con Pabilo antes de continuar con la inscripción.";
      setPabiloError(msg);
      setSubmissionResult({ success: false, error: msg });
      scrollToSection("pago-binance-pabilo");
      return;
    }

    if (
      isPaidCourse &&
      isZelleOrProofSelected &&
      (form.paymentReference.trim().length < 4 || !form.paymentProofUrl)
    ) {
      const msg = `Para pagos vía ${form.paymentMethod}, debes ingresar el número de referencia y adjuntar la imagen o PDF del comprobante para continuar.`;
      setSubmissionResult({ success: false, error: msg });
      scrollToSection("pago-binance-pabilo");
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
          paymentMethod: isPaidCourse ? form.paymentMethod || "Binance (Pabilo)" : "Gratuito",
          paymentDate,
          pabiloPaymentId: isBinanceSelected ? pabiloVerification?.paymentId || null : null,
          pabiloVerificationToken: isBinanceSelected
            ? pabiloVerification?.verificationToken || null
            : null,
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
        // En caso de error o rechazo de pago, mostrar alerta en el formulario
        scrollToSection("formulario-oficial");
      }
    } catch (err: any) {
      setSubmissionResult({
        success: false,
        error: "Error de red al procesar tu inscripción. Por favor intenta de nuevo.",
      });
      scrollToSection("formulario-oficial");
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

  // Preguntas dinámicas editables por Diana para la sección 2 (omite únicamente si se titula literalmente "Método de pago")
  const displayFormQuestions = activeFormQuestions.filter(
    (q) => !/^método de pago$|^metodo de pago$|^forma de pago$/i.test((q.label || "").trim())
  );

  // Métodos de pago habilitados en el curso (siempre incluye Binance y Zelle USD en eventos pagos)
  const rawMethods: string[] =
    Array.isArray(selectedTraining?.paymentMethods) && selectedTraining.paymentMethods.length > 0
      ? selectedTraining.paymentMethods
      : ["Binance (Pabilo)", "Zelle USD", "Efectivo en Tienda OnProtec"];

  const allowedPaymentMethods = React.useMemo(
    () =>
      Array.from(
        new Set([
          "Binance (Pabilo)",
          "Zelle USD",
          ...rawMethods.map((m) => (/binance/i.test(m) ? "Binance (Pabilo)" : m)),
        ])
      ),
    [selectedTraining?.id, rawMethods.join("|")]
  );

  const hoursUntilEvent = React.useMemo(() => {
    if (!selectedTraining) return 999;
    const targetDate = selectedTraining.eventDate || selectedTraining.startDate;
    if (!targetDate) return 999;
    const eventTime = new Date(targetDate).getTime();
    if (isNaN(eventTime)) return 999;
    return (eventTime - Date.now()) / (1000 * 60 * 60);
  }, [selectedTraining?.eventDate, selectedTraining?.startDate]);

  const isCashDisabledByDeadline = hoursUntilEvent <= 48;

  const isBinanceSelected = /binance/i.test(form.paymentMethod);
  const isCashSelected = /efectivo/i.test(form.paymentMethod);
  const isZelleOrProofSelected = isPaidCourse && !isBinanceSelected && !isCashSelected;

  const canSubmitPaidCourse = !isPaidCourse
    ? true
    : isBinanceSelected
    ? Boolean(pabiloVerification?.verified)
    : isZelleOrProofSelected
    ? form.paymentReference.trim().length >= 4 && Boolean(form.paymentProofUrl)
    : !isCashDisabledByDeadline;

  useEffect(() => {
    if (isCashSelected && isCashDisabledByDeadline) {
      setForm((prev) => ({ ...prev, paymentMethod: "Binance (Pabilo)" }));
    }
  }, [isCashSelected, isCashDisabledByDeadline]);

  const openTrainings = React.useMemo(() => {
    const list = trainings.filter(
      (t) => t.status === "Planificado" || t.status === "En Publicidad"
    );
    return [...list].sort((a, b) => {
      const aIsEzviz =
        (a.brand || "").toLowerCase().includes("ezviz") ||
        (a.name || "").toLowerCase().includes("ezviz") ||
        a.code === "CAP-2026-039";
      const bIsEzviz =
        (b.brand || "").toLowerCase().includes("ezviz") ||
        (b.name || "").toLowerCase().includes("ezviz") ||
        b.code === "CAP-2026-039";
      if (aIsEzviz && !bIsEzviz) return -1;
      if (!aIsEzviz && bIsEzviz) return 1;
      const dateA = new Date(a.eventDate || a.startDate).getTime();
      const dateB = new Date(b.eventDate || b.startDate).getTime();
      if (!isNaN(dateA) && !isNaN(dateB)) return dateA - dateB;
      return 0;
    });
  }, [trainings]);

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
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-[#f4730a]" />
                Sede Corporativa Caracas • Cupos Limitados (18 VIP)
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
          3. HERO CORPORATIVO CENTRADO: CARTA DE PRESENTACIÓN DE LA SALA VIP
      ===================================================================== */}
      <section className="relative onprotec-hex-bg border-b border-slate-200/80 dark:border-slate-800 py-7 lg:py-9 overflow-hidden">
        <div className="max-w-[1580px] mx-auto px-4 sm:px-8">
          <div className="max-w-4xl mx-auto text-center flex flex-col items-center space-y-4">
            <div className="inline-flex flex-wrap items-center justify-center gap-2 bg-white dark:bg-slate-900 border border-[#f4730a]/40 rounded-full pl-2.5 pr-4 py-1 shadow-sm">
              <span className="bg-[#f4730a] text-white text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full">
                SALA TÉCNICA VIP
              </span>
              <span className="text-xs font-extrabold text-[#2a285c] dark:text-slate-200 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-[#f4730a]" />
                Sede Corporativa OnProtec Caracas (Acceso Exclusivo con Invitación)
              </span>
            </div>

            <div>
              <p className="text-xs sm:text-sm font-extrabold uppercase tracking-[0.2em] text-[#f4730a] mb-1.5">
                CENTRO DE ENTRENAMIENTO & CERTIFICACIÓN TÉCNICA ONPROTEC®
              </p>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-[#1a1c29] dark:text-white leading-[1.1]">
                La formación práctica definitiva para{" "}
                <span className="text-[#f4730a]">Instaladores e Integradores</span> en Caracas
              </h1>
            </div>

            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 font-medium leading-relaxed max-w-3xl mx-auto">
              Nuestra sala de capacitaciones corporativa en Caracas está equipada con tecnología de punta para dominar tecnologías de CCTV, Redes, Control de Acceso y Energía con{" "}
              <strong className="text-[#f4730a]">equipos reales energizados en vivo</strong>. Aforo VIP limitado a 18 puestos de trabajo individuales para máxima interacción con instructores certificados.
            </p>

            {/* 3 Insignias de Prestigio Centradas */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-1 w-full max-w-3xl mx-auto text-left">
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
        </div>
      </section>

      {/* =====================================================================
          4. SECCIÓN PRINCIPAL: 2 BANNERS + CONVOCATORIA ACTIVA & FORMULARIO (WIDESCREEN 7 / 5)
      ===================================================================== */}
      <section id="registro-express" className="py-8 lg:py-12 flex-1">
        <div className="max-w-[1580px] mx-auto px-4 sm:px-8">
          {/* =============================================================
              BANNERS PRINCIPALES DE SELECCIÓN DE CAPACITACIÓN & FORMULARIO
          ============================================================= */}
          {loading ? (
            <div className="mb-8 p-5 sm:p-6 rounded-3xl bg-white dark:bg-[#13182b] border-2 border-slate-200 dark:border-slate-800 shadow-md animate-pulse">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
                <div className="space-y-2">
                  <div className="h-4 w-56 rounded-full bg-slate-200 dark:bg-slate-800" />
                  <div className="h-6 w-80 max-w-full rounded-lg bg-slate-200 dark:bg-slate-800" />
                </div>
                <div className="h-4 w-56 rounded-lg bg-slate-200 dark:bg-slate-800" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 lg:gap-6">
                {[0, 1].map((idx) => (
                  <div
                    key={idx}
                    className="rounded-3xl overflow-hidden border-2 border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-[#0b0e17]"
                  >
                    <div className="h-48 sm:h-52 w-full bg-slate-200 dark:bg-slate-800" />
                    <div className="p-4 sm:p-5 space-y-3">
                      <div className="h-5 w-3/4 rounded bg-slate-200 dark:bg-slate-800" />
                      <div className="h-4 w-1/2 rounded bg-slate-200 dark:bg-slate-800" />
                      <div className="h-10 w-full rounded-xl bg-slate-200 dark:bg-slate-800" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : openTrainings.length >= 1 && (
            <div className="mb-8 p-5 sm:p-6 rounded-3xl bg-white dark:bg-[#13182b] border-2 border-slate-200 dark:border-slate-800 shadow-md">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="bg-[#f4730a] text-white text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full shadow-sm">
                      PASO 1 • SELECCIONA TU CAPACITACIÓN
                    </span>
                    <span className="text-xs font-mono font-bold text-slate-500 dark:text-slate-400">
                      ({openTrainings.length} {openTrainings.length === 1 ? "Formación Activa" : "Formaciones Activas"} en Sala VIP)
                    </span>
                  </div>
                  <h2 className="text-lg sm:text-xl font-black text-[#2a285c] dark:text-white mt-1">
                    Haz clic en el curso de tu interés para abrir y llenar su formulario abajo:
                  </h2>
                </div>
                <div className="text-xs text-slate-600 dark:text-slate-300 font-semibold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  <span>Cada banner carga su temario y formulario dedicado</span>
                </div>
              </div>

              {/* Grid Dinámico de Banners (1 por cada capacitación activa) */}
              <div
                className={`grid grid-cols-1 gap-5 lg:gap-6 ${
                  openTrainings.length === 1
                    ? "max-w-2xl mx-auto"
                    : openTrainings.length === 2
                    ? "md:grid-cols-2"
                    : "md:grid-cols-2 lg:grid-cols-3"
                }`}
              >
                {openTrainings.map((t, idx) => {
                  const isSelected = selectedTraining?.id === t.id;
                  const tIsPaid = Boolean(t.isPaid || (t.price && Number(t.price) > 0) || t.isFree === false);
                  const photo =
                    t.coverImageUrl ||
                    (Array.isArray(t.coverPhotos) && t.coverPhotos[0]) ||
                    (idx % 2 === 0 ? "/brand/onprotec-hero-banner.avif" : "/brand/onprotec-hero-1920.webp");

                  return (
                    <div
                      key={t.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => handleSelectBannerTraining(t)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          handleSelectBannerTraining(t);
                        }
                      }}
                      className={`dark-banner-card relative rounded-3xl overflow-hidden cursor-pointer transition-all duration-300 border-2 flex flex-col justify-between bg-[#0b0e17] shadow-lg group ${
                        isSelected
                          ? "border-[#f4730a] ring-4 ring-[#f4730a]/30 shadow-[0_16px_45px_rgba(244,115,10,0.32)] scale-[1.01]"
                          : "border-slate-700/80 hover:border-[#f4730a] opacity-95 hover:opacity-100 hover:scale-[1.005]"
                      }`}
                    >
                      {/* Bloque Superior: Imagen Llamativa Protagonista a Todo Color (Medida Oficial 1080x550) */}
                      <div
                        className="relative w-full aspect-[1080/550] overflow-hidden bg-[#06080e]"
                        style={{ aspectRatio: "1080 / 550" }}
                      >
                        <img
                          src={photo}
                          alt={t.name}
                          width={1080}
                          height={550}
                          fetchPriority={idx === 0 ? "high" : "auto"}
                          decoding="async"
                          className="w-full h-full object-cover object-center opacity-100 group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-black/75 via-black/35 to-transparent" />

                        {/* Barra Flotante Superior de Badges */}
                        <div className="absolute top-3 left-3 right-3 z-10 flex items-center justify-between gap-2 flex-wrap">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[10px] font-mono font-black text-[#fdff00] bg-black/85 px-2.5 py-0.5 rounded-md border border-[#fdff00]/40">
                              {t.code}
                            </span>
                            {t.brand && (
                              <span className="text-[10px] font-black uppercase bg-[#2a285c] text-white px-2.5 py-0.5 rounded-full border border-white/25">
                                {t.brand}
                              </span>
                            )}
                            {isSelected && (
                              <span className="text-[10px] font-black uppercase bg-emerald-500 text-white px-2.5 py-0.5 rounded-full shadow-sm">
                                ✓ SELECCIONADO
                              </span>
                            )}
                          </div>
                          <span
                            className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full shadow-sm ${
                              tIsPaid ? "bg-amber-400" : "bg-emerald-400"
                            }`}
                          >
                            {tIsPaid ? `Inversión: ${formatCurrency(t.price)}` : "100% Gratuito"}
                          </span>
                        </div>
                      </div>

                      {/* Bloque Inferior: Información y CTA en Fondo Oscuro Sólido */}
                      <div className="p-4 sm:p-5 bg-[#0b0e17] border-t border-slate-800 flex-1 flex flex-col justify-between space-y-3">
                        <div className="space-y-2">
                          <h4
                            className="banner-title keep-white text-base sm:text-lg font-black text-white leading-snug drop-shadow-sm line-clamp-2"
                            style={{ color: "#ffffff" }}
                          >
                            {t.name}
                          </h4>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-bold">
                            <span className="banner-meta flex items-center gap-1.5 text-slate-100">
                              <Calendar className="w-3.5 h-3.5 text-[#f4730a] flex-shrink-0" />
                              <span className="keep-white" style={{ color: "#f8fafc" }}>
                                {fmtLocalDate(t.eventDate || t.startDate)}
                              </span>
                            </span>
                            <span
                              className="banner-time flex items-center gap-1.5 text-cyan-300"
                              style={{ color: "#67e8f9" }}
                            >
                              <Clock className="w-3.5 h-3.5 flex-shrink-0" />
                              <span style={{ color: "#67e8f9" }}>
                                {fmtLocalHour(t.eventDate || t.startDate)} (Caracas)
                              </span>
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-semibold pt-1.5 border-t border-white/15">
                            <span
                              className="banner-meta keep-white text-slate-200 truncate max-w-[60%]"
                              style={{ color: "#f8fafc" }}
                            >
                              Instructor: {t.instructor || "Especialista Certificado OnProtec"}
                            </span>
                            <span className="text-[#fdff00] font-extrabold" style={{ color: "#fdff00" }}>
                              Aforo: 18 puestos
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectBannerTraining(t);
                          }}
                          className={`w-full py-3 px-4 font-black text-xs uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
                            isSelected
                              ? "bg-[#f4730a] hover:bg-[#ef7922] text-white shadow-lg shadow-[#f4730a]/40"
                              : "bg-white/20 hover:bg-[#f4730a] group-hover:bg-[#f4730a] text-white border border-white/30 shadow-md"
                          }`}
                        >
                          <span>✍️ Clic para llenar formulario • {t.brand || t.code} ↓</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
            {/* -------------------------------------------------------------
                COLUMNA IZQUIERDA (7 cols): CONVOCATORIA ACTUAL EN SALA VIP
            ------------------------------------------------------------- */}
            <div className="lg:col-span-7 space-y-6">
              {/* Ficha Ejecutiva del Evento Seleccionado */}
              {selectedTraining ? (
                <div className="bg-white dark:bg-[#13182b] rounded-3xl border-2 border-slate-200/90 dark:border-slate-800 shadow-md overflow-hidden">
                  {/* Foto Llamativa de la Capacitación Seleccionada (1080x550) */}
                  {(selectedTraining.coverImageUrl ||
                    (Array.isArray(selectedTraining.coverPhotos) && selectedTraining.coverPhotos[0])) && (
                    <div
                      className="w-full aspect-[1080/550] overflow-hidden bg-[#070a14] border-b border-slate-200 dark:border-slate-800"
                      style={{ aspectRatio: "1080 / 550" }}
                    >
                      <img
                        src={selectedTraining.coverImageUrl || selectedTraining.coverPhotos[0]}
                        alt={selectedTraining.name || selectedTraining.title}
                        width={1080}
                        height={550}
                        fetchPriority="high"
                        decoding="async"
                        className="w-full h-full object-cover object-center"
                      />
                    </div>
                  )}

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

                    {/* Capacidad de Sala VIP */}
                    <div className="p-4 rounded-2xl bg-orange-50/70 dark:bg-orange-500/10 border border-[#f4730a]/30 space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span className="text-[#2a285c] dark:text-slate-200 flex items-center gap-1.5">
                          <Users className="w-4 h-4 text-[#f4730a]" />
                          Capacidad de Sala VIP
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300">
                          Aforo: 18 puestos
                        </span>
                      </div>

                      <div className="w-full h-2.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-[#f4730a] to-[#2a285c] rounded-full transition-all duration-500"
                          style={{ width: `${Math.max(15, occupancyPct)}%` }}
                        />
                      </div>

                      <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-snug">
                        Sala técnica corporativa equipada con <strong>18 puestos de trabajo individuales</strong> con equipos reales energizados en vivo.
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
              ) : loading ? (
                <div className="bg-white dark:bg-[#13182b] rounded-3xl border-2 border-slate-200 dark:border-slate-800 shadow-md overflow-hidden animate-pulse">
                  <div className="h-56 w-full bg-slate-200 dark:bg-slate-800" />
                  <div className="p-6 sm:p-7 space-y-4">
                    <div className="h-7 w-3/4 rounded-lg bg-slate-200 dark:bg-slate-800" />
                    <div className="h-4 w-1/2 rounded bg-slate-200 dark:bg-slate-800" />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
                      <div className="h-20 rounded-2xl bg-slate-200 dark:bg-slate-800" />
                      <div className="h-20 rounded-2xl bg-slate-200 dark:bg-slate-800" />
                    </div>
                    <div className="h-24 rounded-2xl bg-slate-200 dark:bg-slate-800" />
                  </div>
                </div>
              ) : (
                <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center text-slate-600 dark:text-slate-400">
                  No hay capacitaciones disponibles en este momento. Contáctanos por WhatsApp para próximas fechas.
                </div>
              )}
            </div>

            {/* -------------------------------------------------------------
                COLUMNA DERECHA (5 cols): FORMULARIO DE REGISTRO SIN FRICCIÓN
            ------------------------------------------------------------- */}
            <div id="formulario-oficial" className="lg:col-span-5 lg:sticky lg:top-24">
              <div className="bg-white dark:bg-[#13182b] rounded-3xl border-2 border-[#2a285c]/15 dark:border-slate-800 shadow-[0_20px_50px_rgba(42,40,92,0.10)] overflow-hidden">
                {/* Cabecera del Formulario con Fecha y Sede */}
                <div className="bg-gradient-to-r from-[#2a285c] to-[#1f1d47] text-white p-6 keep-white">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest bg-[#f4730a] text-white px-3 py-1 rounded-full keep-white shadow-sm">
                      <Lock className="w-3 h-3" /> FORMULARIO OFICIAL • {selectedTraining?.brand || "ONPROTEC"}
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

                  {/* Selector Rápido de Formularios Alternos */}
                  {openTrainings.length >= 2 && (
                    <div className="mt-3 pt-2.5 border-t border-white/20 flex items-center justify-between gap-2 flex-wrap text-xs">
                      <span className="text-[11px] text-slate-300 font-semibold">
                        ¿Deseas inscribirte en otro curso?
                      </span>
                      <div className="flex flex-wrap items-center gap-1.5">
                        {openTrainings
                          .filter((t) => t.id !== selectedTraining?.id)
                          .map((other) => (
                            <button
                              key={other.id}
                              type="button"
                              onClick={() => setSelectedTraining(other)}
                              className="bg-white/20 hover:bg-[#f4730a] text-white px-3 py-1 rounded-xl font-black text-[11px] transition-all flex items-center gap-1.5 border border-white/30 cursor-pointer shadow-sm"
                            >
                              <span>Cambiar a: {other.brand && other.brand !== "OnProtec" ? other.brand : other.code}</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="p-6">
                  {loading ? (
                    <div className="space-y-4 animate-pulse">
                      <div className="h-4 w-48 rounded bg-slate-200 dark:bg-slate-800" />
                      <div className="h-10 w-full rounded-xl bg-slate-200 dark:bg-slate-800" />
                      <div className="grid grid-cols-12 gap-2">
                        <div className="col-span-4 h-10 rounded-xl bg-slate-200 dark:bg-slate-800" />
                        <div className="col-span-8 h-10 rounded-xl bg-slate-200 dark:bg-slate-800" />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div className="h-10 rounded-xl bg-slate-200 dark:bg-slate-800" />
                        <div className="h-10 rounded-xl bg-slate-200 dark:bg-slate-800" />
                      </div>
                      <div className="h-10 w-full rounded-xl bg-slate-200 dark:bg-slate-800" />
                      <div className="h-12 w-full rounded-2xl bg-slate-200 dark:bg-slate-800 mt-2" />
                    </div>
                  ) : !selectedTraining ? (
                    <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 text-center space-y-3">
                      <Calendar className="w-8 h-8 text-[#f4730a] mx-auto" />
                      <h4 className="text-base font-extrabold text-[#2a285c] dark:text-white">
                        Selecciona una Capacitación
                      </h4>
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        Pronto publicaremos nuevas convocatorias en nuestra Sala Técnica VIP.
                      </p>
                    </div>
                  ) : !isSelectedTrainingOpen ? (
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
                          role="alert"
                          aria-live="polite"
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
                          <label
                            htmlFor="input-participant-name"
                            className="block text-xs font-black uppercase tracking-wider text-[#2a285c] dark:text-slate-200"
                          >
                            1. Datos del Instalador / Participante
                          </label>

                          <div>
                            <input
                              id="input-participant-name"
                              name="name"
                              type="text"
                              required
                              autoComplete="name"
                              placeholder="Nombre y Apellido Completo *"
                              value={form.name}
                              onChange={(e) => setForm({ ...form, name: e.target.value })}
                              className="w-full bg-[#f8f9fc] dark:bg-slate-900 border border-slate-300 dark:border-slate-700 focus:border-[#f4730a] rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-900 dark:text-white outline-none"
                            />
                          </div>

                          <div className="grid grid-cols-12 gap-2">
                            <div className="col-span-4">
                              <label htmlFor="input-participant-doctype" className="sr-only">
                                Tipo de Documento
                              </label>
                              <select
                                id="input-participant-doctype"
                                name="docType"
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
                              <label htmlFor="input-participant-doc" className="sr-only">
                                Cédula o RIF
                              </label>
                              <input
                                id="input-participant-doc"
                                name="docNumber"
                                type="text"
                                inputMode="numeric"
                                autoComplete="off"
                                autoCorrect="off"
                                required
                                placeholder="Cédula / RIF *"
                                value={form.docNumber}
                                onChange={(e) => setForm({ ...form, docNumber: e.target.value })}
                                className="w-full bg-[#f8f9fc] dark:bg-slate-900 border border-slate-300 dark:border-slate-700 focus:border-[#f4730a] rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-900 dark:text-white outline-none"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <div>
                              <label htmlFor="input-participant-phone" className="sr-only">
                                WhatsApp
                              </label>
                              <input
                                id="input-participant-phone"
                                name="phone"
                                type="tel"
                                inputMode="tel"
                                autoComplete="tel"
                                required
                                placeholder="WhatsApp (0412/0414) *"
                                value={form.phone}
                                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                                className="w-full bg-[#f8f9fc] dark:bg-slate-900 border border-slate-300 dark:border-slate-700 focus:border-[#f4730a] rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-900 dark:text-white outline-none"
                              />
                            </div>
                            <div>
                              <label htmlFor="input-participant-email" className="sr-only">
                                Correo Electrónico
                              </label>
                              <input
                                id="input-participant-email"
                                name="email"
                                type="email"
                                autoComplete="email"
                                autoCorrect="off"
                                autoCapitalize="none"
                                spellCheck={false}
                                required
                                placeholder="Correo Electrónico *"
                                value={form.email}
                                onChange={(e) => setForm({ ...form, email: e.target.value })}
                                className="w-full bg-[#f8f9fc] dark:bg-slate-900 border border-slate-300 dark:border-slate-700 focus:border-[#f4730a] rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-900 dark:text-white outline-none"
                              />
                            </div>
                          </div>

                          <div>
                            <label htmlFor="input-participant-company" className="sr-only">
                              Empresa o Emprendimiento
                            </label>
                            <input
                              id="input-participant-company"
                              name="company"
                              type="text"
                              autoComplete="organization"
                              placeholder="Empresa / Emprendimiento (Opcional)"
                              value={form.company}
                              onChange={(e) => setForm({ ...form, company: e.target.value })}
                              className="w-full bg-[#f8f9fc] dark:bg-slate-900 border border-slate-300 dark:border-slate-700 focus:border-[#f4730a] rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-900 dark:text-white outline-none"
                            />
                          </div>
                        </div>

                        {/* GRUPO 2: PREGUNTAS ESPECÍFICAS DE LA CAPACITACIÓN (TOTALMENTE EDITABLE) */}
                        {displayFormQuestions.length > 0 && (
                          <div className="space-y-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                            <div>
                              <span className="block text-xs font-black uppercase tracking-wider text-[#2a285c] dark:text-slate-200">
                                2. {selectedTraining?.formQuestionsTitle || "Preguntas Específicas del Curso"} ({displayFormQuestions.length})
                              </span>
                              {selectedTraining?.formQuestionsDescription && (
                                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                                  {selectedTraining.formQuestionsDescription}
                                </p>
                              )}
                            </div>

                            <div className="space-y-2.5 bg-slate-50 dark:bg-slate-900/90 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800">
                              {displayFormQuestions.map((q) => (
                                <div key={q.id}>
                                  <label
                                    htmlFor={`form-q-${q.id}`}
                                    className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 mb-1"
                                  >
                                    {q.label} {q.required && <span className="text-[#f4730a]">*</span>}
                                  </label>

                                  {q.type === "select" && Array.isArray(q.options) ? (
                                    <select
                                      id={`form-q-${q.id}`}
                                      name={`custom_${q.id}`}
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
                                  ) : q.type === "textarea" ? (
                                    <textarea
                                      id={`form-q-${q.id}`}
                                      name={`custom_${q.id}`}
                                      rows={2}
                                      required={q.required}
                                      placeholder={q.placeholder || "Escribe tu comentario..."}
                                      value={customAnswers[q.id] || ""}
                                      onChange={(e) =>
                                        setCustomAnswers({ ...customAnswers, [q.id]: e.target.value })
                                      }
                                      className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-white outline-none resize-none"
                                    />
                                  ) : q.type === "radio" && Array.isArray(q.options) ? (
                                    <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={q.label}>
                                      {q.options.map((opt, i) => {
                                        const checked = customAnswers[q.id] === opt;
                                        return (
                                          <label
                                            key={i}
                                            className={`px-3 py-1.5 rounded-xl border text-xs font-bold cursor-pointer transition ${
                                              checked
                                                ? "bg-[#f4730a] text-white border-[#f4730a]"
                                                : "bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                                            }`}
                                          >
                                            <input
                                              type="radio"
                                              name={`custom_${q.id}`}
                                              value={opt}
                                              required={q.required}
                                              checked={checked}
                                              onChange={(e) =>
                                                setCustomAnswers({
                                                  ...customAnswers,
                                                  [q.id]: e.target.value,
                                                })
                                              }
                                              className="hidden"
                                            />
                                            <span>{opt}</span>
                                          </label>
                                        );
                                      })}
                                    </div>
                                  ) : q.type === "checkbox" ? (
                                    <label
                                      htmlFor={`form-q-${q.id}`}
                                      className="flex items-center gap-2 p-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 cursor-pointer text-xs font-bold text-slate-800 dark:text-white"
                                    >
                                      <input
                                        id={`form-q-${q.id}`}
                                        name={`custom_${q.id}`}
                                        type="checkbox"
                                        required={q.required}
                                        checked={Boolean(customAnswers[q.id])}
                                        onChange={(e) =>
                                          setCustomAnswers({
                                            ...customAnswers,
                                            [q.id]: e.target.checked ? "Sí" : "",
                                          })
                                        }
                                        className="w-4 h-4 accent-[#f4730a]"
                                      />
                                      <span>{q.placeholder || "Sí, confirmo"}</span>
                                    </label>
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
                                        <label
                                          htmlFor={`form-q-${q.id}`}
                                          className="flex items-center justify-center gap-2 p-3 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl cursor-pointer hover:border-[#f4730a] text-xs font-bold text-slate-600 dark:text-slate-400"
                                        >
                                          <UploadCloud className="w-4 h-4 text-[#f4730a]" />
                                          <span>Clic para adjuntar archivo o comprobante (Máx 8MB)</span>
                                          <input
                                            id={`form-q-${q.id}`}
                                            name={`custom_${q.id}`}
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
                                                setForm((prev) => ({
                                                  ...prev,
                                                  paymentProofUrl: prev.paymentProofUrl || b64,
                                                }));
                                              };
                                              reader.readAsDataURL(f);
                                            }}
                                          />
                                        </label>
                                      )}
                                    </div>
                                  ) : (
                                    <input
                                      id={`form-q-${q.id}`}
                                      name={`custom_${q.id}`}
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

                        {/* GRUPO 3: PAGO Y VALIDACIÓN (BINANCE VIA PABILO, ZELLE USD + COMPROBANTE, O EFECTIVO 48H) */}
                        {isPaidCourse && (
                          <div
                            id="pago-binance-pabilo"
                            className="p-4 rounded-2xl bg-amber-50/95 dark:bg-amber-500/10 border-2 border-amber-300 dark:border-amber-500/40 space-y-3"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-xs font-black text-amber-950 dark:text-amber-200 flex items-center gap-1.5">
                                <CreditCard className="w-4 h-4 text-[#f4730a]" />
                                3. Reporte y Validación de Pago
                              </span>
                              <span className="text-base font-black text-amber-950 dark:text-amber-200">
                                {formatCurrency(selectedTraining.price)} USD
                              </span>
                            </div>

                            {/* Selector Visual de Método de Pago con Iconos Alusivos */}
                            <div>
                              <span
                                id="payment-method-group-label"
                                className="block text-[10px] font-black uppercase tracking-wider text-amber-950 dark:text-amber-300 mb-2"
                              >
                                Selecciona tu Método de Pago *
                              </span>
                              <div
                                role="radiogroup"
                                aria-labelledby="payment-method-group-label"
                                className="grid grid-cols-2 sm:grid-cols-3 gap-2.5"
                              >
                                {allowedPaymentMethods.map((m) => {
                                  const isBinanceOpt = /binance/i.test(m);
                                  const isZelleOpt = /zelle/i.test(m);
                                  const isCashOpt = /efectivo/i.test(m);
                                  const isPagoMovilOpt = /pago\s*m[oó]vil/i.test(m);
                                  const isTransferOpt = /transferencia/i.test(m);
                                  const disabled = isCashOpt && isCashDisabledByDeadline;
                                  const isSelected = form.paymentMethod === m;

                                  const shortTitle = isBinanceOpt
                                    ? "Binance"
                                    : isZelleOpt
                                    ? "Zelle USD"
                                    : isCashOpt
                                    ? "Efectivo Tienda"
                                    : isPagoMovilOpt
                                    ? "Pago Móvil"
                                    : isTransferOpt
                                    ? "Transferencia Bs"
                                    : m;

                                  const subtitle = disabled
                                    ? "Cerrado (<48h)"
                                    : isBinanceOpt
                                    ? "Validación en línea"
                                    : isCashOpt
                                    ? "Sede OnProtec (>48h)"
                                    : isPagoMovilOpt
                                    ? "Transferencia móvil"
                                    : "Subir comprobante";

                                  return (
                                    <button
                                      key={m}
                                      type="button"
                                      role="radio"
                                      aria-checked={isSelected}
                                      disabled={disabled}
                                      title={
                                        disabled
                                          ? `${m} (No disponible a menos de 48h del evento)`
                                          : m
                                      }
                                      onClick={() => {
                                        setForm((prev) => ({ ...prev, paymentMethod: m }));
                                        setPabiloError(null);
                                        setSubmissionResult(null);
                                      }}
                                      className={`relative flex flex-col items-center justify-center text-center gap-1.5 p-2.5 rounded-xl border-2 transition-all ${
                                        disabled
                                          ? "opacity-45 grayscale cursor-not-allowed bg-slate-100 dark:bg-slate-950 border-slate-200 dark:border-slate-800"
                                          : isSelected
                                          ? "cursor-pointer border-[#f4730a] ring-2 ring-[#f4730a]/25 bg-white dark:bg-slate-900 shadow-md"
                                          : "cursor-pointer bg-white/80 dark:bg-slate-900/70 border-slate-300 dark:border-slate-700 hover:border-[#f4730a]/60 hover:bg-white dark:hover:bg-slate-900"
                                      }`}
                                    >
                                      {isSelected && (
                                        <span
                                          aria-hidden="true"
                                          className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-[#f4730a] text-white flex items-center justify-center text-[9px] font-black shadow-sm"
                                        >
                                          ✓
                                        </span>
                                      )}

                                      {isBinanceOpt ? (
                                        <span className="w-9 h-9 rounded-xl bg-[#1E2026] text-[#F3BA2F] border border-[#F3BA2F]/40 flex items-center justify-center shadow-sm">
                                          <svg
                                            viewBox="0 0 24 24"
                                            fill="currentColor"
                                            className="w-5 h-5"
                                            aria-hidden="true"
                                          >
                                            <path d="M12 2L6.8 7.2l1.95 1.95L12 5.9l3.25 3.25 1.95-1.95L12 2zm-7.2 7.2L2.85 11.15 4.8 13.1l1.95-1.95-1.95-1.95zm14.4 0l-1.95 1.95 1.95 1.95 1.95-1.95L19.2 9.2zM12 9.05L9.05 12 12 14.95 14.95 12 12 9.05zM6.8 16.8L12 22l5.2-5.2-1.95-1.95L12 18.1l-3.25-3.25-1.95 1.95z" />
                                          </svg>
                                        </span>
                                      ) : isZelleOpt ? (
                                        <span className="w-9 h-9 rounded-xl bg-[#6D1ED4] text-white flex items-center justify-center shadow-sm">
                                          <svg
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2.4"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            className="w-5 h-5"
                                            aria-hidden="true"
                                          >
                                            <path d="M12 3v2.5M12 18.5V21" />
                                            <path d="M7.5 6.5h9l-9 11h9" />
                                          </svg>
                                        </span>
                                      ) : isCashOpt ? (
                                        <span className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-sm">
                                          <svg
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            className="w-5 h-5"
                                            aria-hidden="true"
                                          >
                                            <rect x="2" y="6" width="20" height="12" rx="2.5" />
                                            <circle cx="12" cy="12" r="2.75" />
                                            <path d="M6 12h.01M18 12h.01" />
                                          </svg>
                                        </span>
                                      ) : isPagoMovilOpt ? (
                                        <span className="w-9 h-9 rounded-xl bg-sky-600 text-white flex items-center justify-center shadow-sm">
                                          <svg
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            className="w-5 h-5"
                                            aria-hidden="true"
                                          >
                                            <rect x="7" y="2.5" width="10" height="19" rx="2.2" />
                                            <path d="M11 18h2" />
                                            <path d="M12.5 7.5L10 11h4l-2.5 3.5" />
                                          </svg>
                                        </span>
                                      ) : (
                                        <span className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-sm">
                                          <svg
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            className="w-5 h-5"
                                            aria-hidden="true"
                                          >
                                            <path d="M3 9.5L12 4l9 5.5H3z" />
                                            <path d="M5 10v7M9.5 10v7M14.5 10v7M19 10v7M3 20h18" />
                                          </svg>
                                        </span>
                                      )}

                                      <span className="text-[11px] font-black text-slate-900 dark:text-white leading-tight">
                                        {shortTitle}
                                      </span>
                                      <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400 leading-none">
                                        {subtitle}
                                      </span>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>

                            {/* Alerta si el efectivo está bloqueado por faltar <= 48 horas */}
                            {isCashDisabledByDeadline &&
                              allowedPaymentMethods.some((m) => /efectivo/i.test(m)) && (
                                <div className="p-2.5 rounded-xl bg-rose-500/15 border border-rose-400 text-rose-900 dark:text-rose-200 text-[11px] flex items-start gap-2">
                                  <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                                  <p className="leading-snug">
                                    <strong>Restricción 48h antes del evento:</strong> Ya no se aceptan pagos en efectivo en tienda. Selecciona Binance o Zelle USD.
                                  </p>
                                </div>
                              )}

                            {/* BLOQUE CONDICIONAL A: BINANCE CON VALIDACIÓN PABILO */}
                            {isBinanceSelected && (
                              <>
                                <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-amber-200 dark:border-slate-700 space-y-2 text-xs">
                                  <div className="flex items-center justify-between gap-2">
                                    <span className="text-[11px] text-slate-500 dark:text-slate-400 font-bold">
                                      Cuenta Oficial:
                                    </span>
                                    <span className="font-black text-[#2a285c] dark:text-white">
                                      Onprotec Binance
                                    </span>
                                  </div>
                                  <div className="flex items-center justify-between gap-2">
                                    <span className="text-[11px] text-slate-500 dark:text-slate-400 font-bold">
                                      Binance ID:
                                    </span>
                                    <div className="flex items-center gap-2">
                                      <code className="font-mono font-black text-sm text-[#f4730a] bg-orange-50 dark:bg-orange-500/15 px-2.5 py-0.5 rounded-lg border border-[#f4730a]/30">
                                        1076181690
                                      </code>
                                      <button
                                        type="button"
                                        onClick={handleCopyBinanceId}
                                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-[11px] transition cursor-pointer"
                                      >
                                        <Copy className="w-3 h-3" />
                                        <span>{copiedBinanceId ? "¡Copiado!" : "Copiar ID"}</span>
                                      </button>
                                    </div>
                                  </div>
                                  <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100 dark:border-slate-800">
                                    <span className="text-[11px] text-slate-500 dark:text-slate-400 font-bold">
                                      Monto Exacto Requerido:
                                    </span>
                                    <span className="font-black text-emerald-700 dark:text-emerald-400">
                                      {formatCurrency(selectedTraining.price)} USDT / USD
                                    </span>
                                  </div>
                                  <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-snug">
                                    Transfiere el monto exacto por Binance y valida abajo con los últimos dígitos de la referencia o el Order ID.
                                  </p>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                                  <div className="sm:col-span-7">
                                    <label
                                      htmlFor="input-payment-reference"
                                      className="block text-[10px] font-black uppercase tracking-wider text-amber-950 dark:text-amber-300 mb-1"
                                    >
                                      Nro. Referencia / Order ID Binance *
                                    </label>
                                    <input
                                      id="input-payment-reference"
                                      name="paymentReference"
                                      type="text"
                                      required={isPaidCourse}
                                      autoCorrect="off"
                                      autoCapitalize="none"
                                      spellCheck={false}
                                      placeholder="Ej. últimos 6-8 dígitos o Order ID"
                                      value={form.paymentReference}
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        setForm((prev) => ({ ...prev, paymentReference: val }));
                                        setPabiloVerification(null);
                                        setPabiloError(null);
                                      }}
                                      className="w-full bg-white dark:bg-slate-900 border border-amber-300 dark:border-slate-700 focus:border-[#f4730a] rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-white outline-none"
                                    />
                                  </div>

                                  <div className="sm:col-span-5">
                                    <label
                                      htmlFor="input-payment-date"
                                      className="block text-[10px] font-black uppercase tracking-wider text-amber-950 dark:text-amber-300 mb-1"
                                    >
                                      Fecha del Pago *
                                    </label>
                                    <input
                                      id="input-payment-date"
                                      name="paymentDate"
                                      type="date"
                                      required={isPaidCourse}
                                      value={paymentDate}
                                      onChange={(e) => {
                                        setPaymentDate(e.target.value);
                                        setPabiloVerification(null);
                                        setPabiloError(null);
                                      }}
                                      className="w-full bg-white dark:bg-slate-900 border border-amber-300 dark:border-slate-700 focus:border-[#f4730a] rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-white outline-none"
                                    />
                                  </div>
                                </div>

                                <button
                                  type="button"
                                  onClick={handleVerifyPabiloPayment}
                                  disabled={verifyingPayment || form.paymentReference.trim().length < 4}
                                  className="w-full py-2.5 px-4 rounded-xl bg-[#2a285c] hover:bg-[#3a377c] disabled:opacity-50 text-white font-black text-xs uppercase tracking-wider shadow-md transition flex items-center justify-center gap-2 cursor-pointer keep-white"
                                >
                                  {verifyingPayment ? (
                                    <>
                                      <Loader2 className="w-4 h-4 animate-spin" />
                                      <span>Consultando Binance en Pabilo...</span>
                                    </>
                                  ) : (
                                    <>
                                      <Zap className="w-4 h-4 text-[#fdff00]" />
                                      <span>⚡ Validar Pago en Binance con Pabilo</span>
                                    </>
                                  )}
                                </button>

                                {pabiloError && (
                                  <div
                                    role="alert"
                                    className="p-3 rounded-xl bg-rose-50 dark:bg-rose-500/15 border border-rose-400 text-rose-900 dark:text-rose-200 text-xs flex items-start gap-2"
                                  >
                                    <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                                    <div className="space-y-0.5">
                                      <p className="font-extrabold">Pago no validado en Pabilo</p>
                                      <p className="text-[11px] leading-snug">{pabiloError}</p>
                                    </div>
                                  </div>
                                )}

                                {!pabiloError && !pabiloVerification?.verified && (
                                  <div className="p-3 rounded-xl bg-amber-500/15 border border-amber-400 text-amber-950 dark:text-amber-200 text-[11px] flex items-start gap-2">
                                    <Lock className="w-4 h-4 text-[#f4730a] shrink-0 mt-0.5" />
                                    <p className="leading-snug font-semibold">
                                      <strong>Validación obligatoria:</strong> Debes validar tu pago real en Binance mediante Pabilo para desbloquear el envío (o cambiar a Zelle USD).
                                    </p>
                                  </div>
                                )}

                                {pabiloVerification?.verified && (
                                  <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-500/15 border-2 border-emerald-500 text-emerald-950 dark:text-emerald-200 text-xs space-y-1 shadow-sm">
                                    <div className="flex items-center gap-2 font-black text-emerald-800 dark:text-emerald-300">
                                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                                      <span>✅ PAGO REAL VERIFICADO EN BINANCE VÍA PABILO</span>
                                    </div>
                                    <div className="text-[11px] font-mono flex flex-wrap items-center gap-x-4 gap-y-1 text-emerald-900 dark:text-emerald-200">
                                      <span>ID Pabilo: #{pabiloVerification.paymentId}</span>
                                      <span>Ref: {pabiloVerification.reference}</span>
                                      <span>Monto: ${pabiloVerification.amount.toFixed(2)} USD</span>
                                    </div>
                                  </div>
                                )}
                              </>
                            )}

                            {/* BLOQUE CONDICIONAL B: ZELLE USD / TRANSFERENCIA / OTROS CON COMPROBANTE OBLIGATORIO */}
                            {isZelleOrProofSelected && (
                              <div className="space-y-3">
                                <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-amber-200 dark:border-slate-700 text-xs space-y-2">
                                  <div className="flex items-center justify-between gap-2">
                                    <span className="font-bold text-slate-600 dark:text-slate-300">
                                      Pago seleccionado:
                                    </span>
                                    <span className="font-black text-[#2a285c] dark:text-white">
                                      {form.paymentMethod}
                                    </span>
                                  </div>
                                  {/zelle/i.test(form.paymentMethod) && (
                                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1.5 border-t border-slate-100 dark:border-slate-800">
                                      <span className="font-bold text-slate-600 dark:text-slate-300">
                                        Correo Oficial Zelle:
                                      </span>
                                      <div className="flex items-center gap-2">
                                        <code className="font-mono font-black text-xs sm:text-sm text-[#6D1ED4] dark:text-purple-300 bg-purple-50 dark:bg-purple-500/15 px-2.5 py-0.5 rounded-lg border border-[#6D1ED4]/30">
                                          zelle@onprotec.com
                                        </code>
                                        <button
                                          type="button"
                                          onClick={handleCopyZelleEmail}
                                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-[11px] transition cursor-pointer"
                                        >
                                          <Copy className="w-3 h-3" />
                                          <span>{copiedZelleEmail ? "¡Copiado!" : "Copiar Correo"}</span>
                                        </button>
                                      </div>
                                    </div>
                                  )}
                                  <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100 dark:border-slate-800">
                                    <span className="font-bold text-slate-600 dark:text-slate-300">
                                      Monto Exacto a Transferir:
                                    </span>
                                    <span className="font-black text-emerald-700 dark:text-emerald-400">
                                      {formatCurrency(selectedTraining.price)} USD
                                    </span>
                                  </div>
                                  <p className="text-[10px] text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800">
                                    Ingresa el número de confirmación / referencia y adjunta obligatoriamente la captura o PDF del comprobante para que OnProtec valide tu cupo.
                                  </p>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                                  <div className="sm:col-span-7">
                                    <label
                                      htmlFor="input-payment-reference-manual"
                                      className="block text-[10px] font-black uppercase tracking-wider text-amber-950 dark:text-amber-300 mb-1"
                                    >
                                      Nro. Referencia / Confirmación {form.paymentMethod} *
                                    </label>
                                    <input
                                      id="input-payment-reference-manual"
                                      name="paymentReference"
                                      type="text"
                                      required
                                      autoCorrect="off"
                                      autoCapitalize="none"
                                      spellCheck={false}
                                      placeholder="Ej. código de confirmación"
                                      value={form.paymentReference}
                                      onChange={(e) =>
                                        setForm((prev) => ({
                                          ...prev,
                                          paymentReference: e.target.value,
                                        }))
                                      }
                                      className="w-full bg-white dark:bg-slate-900 border border-amber-300 dark:border-slate-700 focus:border-[#f4730a] rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-white outline-none"
                                    />
                                  </div>

                                  <div className="sm:col-span-5">
                                    <label
                                      htmlFor="input-payment-date-manual"
                                      className="block text-[10px] font-black uppercase tracking-wider text-amber-950 dark:text-amber-300 mb-1"
                                    >
                                      Fecha del Pago *
                                    </label>
                                    <input
                                      id="input-payment-date-manual"
                                      name="paymentDate"
                                      type="date"
                                      required
                                      value={paymentDate}
                                      onChange={(e) => setPaymentDate(e.target.value)}
                                      className="w-full bg-white dark:bg-slate-900 border border-amber-300 dark:border-slate-700 focus:border-[#f4730a] rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-white outline-none"
                                    />
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* BLOQUE CONDICIONAL C: EFECTIVO EN TIENDA (48H) */}
                            {isCashSelected && (
                              <div className="p-3.5 rounded-2xl bg-amber-500/20 border-2 border-amber-500 text-amber-950 dark:text-amber-200 text-xs space-y-1.5 shadow-sm">
                                <div className="flex items-center gap-2 font-black text-xs uppercase tracking-wide text-amber-900 dark:text-amber-300">
                                  <AlertTriangle className="w-4 h-4 text-[#f4730a] shrink-0" />
                                  <span>Condición Obligatoria de Pago en Efectivo</span>
                                </div>
                                <p className="text-[11px] leading-relaxed">
                                  Dispones de un <strong>lapso máximo de 48 horas continuas</strong> tras enviar este formulario para acudir a nuestra tienda OnProtec (Sede Corporativa) y formalizar tu pago en caja. De lo contrario, tu solicitud será <strong>automáticamente anulada</strong> y el cupo se liberará.
                                </p>
                              </div>
                            )}

                            {/* Carga de Comprobante de Pago (Obligatorio para Zelle/Transferencia, Opcional para Binance/Efectivo) */}
                            <div className="pt-2 border-t border-amber-200 dark:border-amber-500/20">
                              <label className="block text-[11px] font-extrabold text-amber-900 dark:text-amber-200 mb-1.5 flex items-center gap-1.5">
                                <UploadCloud className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                                {isZelleOrProofSelected ? (
                                  <span>
                                    Adjuntar Comprobante de Pago {form.paymentMethod}{" "}
                                    <strong className="text-rose-600 dark:text-rose-400">* Obligatorio</strong>
                                  </span>
                                ) : isBinanceSelected ? (
                                  <span>Adjuntar Captura de Binance (Opcional — Pabilo ya valida en línea)</span>
                                ) : (
                                  <span>Comprobante (Opcional — Formalizarás en caja en tienda)</span>
                                )}
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
                                    className="p-1.5 text-rose-500 hover:text-rose-700 cursor-pointer"
                                    title="Eliminar comprobante"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              ) : (
                                <label className="flex flex-col items-center justify-center p-2.5 border-2 border-dashed border-amber-300 dark:border-amber-500/40 hover:border-amber-500 rounded-xl bg-white/70 dark:bg-slate-900/60 cursor-pointer transition text-center">
                                  <UploadCloud className="w-4 h-4 text-amber-600 mb-0.5" />
                                  <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                                    Clic o arrastra para subir comprobante (JPG, PNG o PDF - Máx 8MB)
                                  </span>
                                  <input
                                    type="file"
                                    accept="image/*,application/pdf"
                                    required={isZelleOrProofSelected}
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
                          disabled={submitting || !selectedTraining || !canSubmitPaidCourse}
                          className={`w-full py-4 px-6 rounded-2xl text-white font-black text-xs sm:text-sm uppercase tracking-wider transition-all flex items-center justify-center gap-2 mt-2 ${
                            !canSubmitPaidCourse
                              ? "bg-slate-400 dark:bg-slate-700 cursor-not-allowed opacity-75"
                              : "bg-[#f4730a] hover:bg-[#ef7922] disabled:opacity-50 shadow-[0_12px_28px_rgba(244,115,10,0.35)] hover:shadow-[0_16px_32px_rgba(244,115,10,0.50)] cursor-pointer"
                          }`}
                        >
                          {submitting ? (
                            <span>Procesando Registro...</span>
                          ) : isPaidCourse && isBinanceSelected && !pabiloVerification?.verified ? (
                            <span>🔒 Valida tu Pago Real de Binance (Pabilo) para Continuar</span>
                          ) : isPaidCourse && isZelleOrProofSelected && !canSubmitPaidCourse ? (
                            <span>🔒 Ingresa Referencia y Sube Comprobante de {form.paymentMethod} para Continuar</span>
                          ) : isPaidCourse ? (
                            availableSeats === 0 ? (
                              <span>Ingresar a Lista de Espera</span>
                            ) : (
                              <span>Confirmar Reserva y Enviar Inscripción</span>
                            )
                          ) : availableSeats === 0 ? (
                            <span>Ingresar a Lista de Espera</span>
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
              RIF: J-40685449-2 • Contacto: ventas@onprotec.com | WhatsApp:{" "}
              <a
                href={buildOnprotecWhatsAppUrl(
                  "Hola equipo de OnProtec, deseo información sobre las capacitaciones."
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#25d366] hover:underline font-bold"
              >
                {ONPROTEC_WHATSAPP_DISPLAY} (+58 412 2318398)
              </a>
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
      {!isFormVisible && !showConfirmationModal && (
        <div className="lg:hidden fixed bottom-4 left-4 right-4 z-40">
          <button
            type="button"
            onClick={() => {
              scrollToSection("formulario-oficial");
              setTimeout(() => {
                document.getElementById("input-participant-name")?.focus({ preventScroll: true });
              }, 350);
            }}
            className="w-full bg-[#f4730a] hover:bg-[#ef7922] text-white font-black py-3.5 px-4 rounded-2xl shadow-2xl shadow-[#f4730a]/40 flex items-center justify-center gap-2 text-sm uppercase tracking-wider transition-all cursor-pointer"
          >
            <span>✍️ Inscribirme en la Capacitación</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* =====================================================================
          8.5 BOTÓN FLOTANTE DE CONTACTO WHATSAPP OFICIAL ONPROTEC (0412-2318398)
      ===================================================================== */}
      <a
        href={buildOnprotecWhatsAppUrl(
          "Hola equipo de OnProtec, tengo una consulta sobre las capacitaciones en Sala VIP."
        )}
        target="_blank"
        rel="noopener noreferrer"
        className={`fixed ${
          !isFormVisible && !showConfirmationModal ? "bottom-20" : "bottom-5"
        } lg:bottom-6 right-5 z-40 inline-flex items-center gap-2 bg-[#25d366] hover:bg-[#1ebe5d] text-white font-black text-xs px-4 py-3 rounded-full shadow-2xl shadow-emerald-600/40 transition-all hover:-translate-y-0.5 keep-white`}
        title={`Escribir al WhatsApp oficial de OnProtec (${ONPROTEC_WHATSAPP_DISPLAY})`}
      >
        <Phone className="w-4 h-4" />
        <span className="hidden sm:inline">WhatsApp {ONPROTEC_WHATSAPP_DISPLAY}</span>
      </a>

      {/* =====================================================================
          9. MODAL EJECUTIVO DE CONFIRMACIÓN POST-ENVÍO (PAGAS VS. GRATUITAS)
      ===================================================================== */}
      {showConfirmationModal && submissionResult?.success && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirmation-modal-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowConfirmationModal(false);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md"
        >
          <div className="bg-white dark:bg-[#13182b] border-2 border-slate-300 dark:border-slate-700 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200 max-h-[92vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setShowConfirmationModal(false)}
              aria-label="Cerrar confirmación"
              className="absolute top-4 right-4 p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            {/* Header del Modal según si es cobrada o gratuita */}
            {isPaidCourse ? (
              <div className="text-center space-y-3">
                <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center shadow-inner">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                {submissionResult.data?.isPaid ? (
                  <>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-900 border border-emerald-300 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/40">
                      ✓ FORMALMENTE INSCRITO • PAGO VERIFICADO EN PABILO
                    </span>
                    <h3 id="confirmation-modal-title" className="text-2xl font-black text-[#2a285c] dark:text-white">
                      ¡Inscripción Formalmente Confirmada!
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                      Hemos recibido tus datos y validado tu pago en Binance en tiempo real mediante Pabilo. Tu cupo en la Sala VIP (aforo de 18 puestos) ha quedado confirmado y garantizado.
                    </p>
                    <div className="p-3.5 bg-emerald-50/80 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 rounded-2xl text-left text-xs space-y-1">
                      <p className="font-extrabold text-emerald-900 dark:text-emerald-200">
                        ¿Qué sigue a continuación?
                      </p>
                      <p className="text-emerald-800 dark:text-emerald-300 text-[11px] leading-snug">
                        Tu pago en Binance ya fue conciliado automáticamente. El equipo de OnProtec se comunicará contigo vía WhatsApp en breve para enviarte las instrucciones privadas de acceso a la sala.
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-amber-100 text-amber-950 border border-amber-300 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/40">
                      ✓ SOLICITUD REGISTRADA • REVISIÓN DE COMPROBANTE
                    </span>
                    <h3 id="confirmation-modal-title" className="text-2xl font-black text-[#2a285c] dark:text-white">
                      ¡Registro y Comprobante Recibidos!
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                      Hemos recibido tus datos y tu comprobante de pago vía <strong>{form.paymentMethod}</strong>. Nuestro equipo administrativo validará tu transacción para formalizar tu cupo en Sala VIP (aforo de 18 puestos).
                    </p>
                    <div className="p-3.5 bg-amber-50/90 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 rounded-2xl text-left text-xs space-y-1">
                      <p className="font-extrabold text-amber-950 dark:text-amber-200">
                        {isCashSelected
                          ? "Plazo máximo de 48h para pago en tienda"
                          : "Validación administrativa de tu comprobante"}
                      </p>
                      <p className="text-amber-900 dark:text-amber-300 text-[11px] leading-snug">
                        {isCashSelected
                          ? "Dispones de 48 horas continuas para acudir a nuestra tienda OnProtec y formalizar el pago en caja; de lo contrario tu reserva será anulada."
                          : "Una vez conciliado el comprobante, el equipo de OnProtec te confirmará por WhatsApp con las instrucciones privadas de acceso."}
                      </p>
                    </div>
                  </>
                )}
              </div>
            ) : submissionResult.isWaitlist ? (
              <div className="text-center space-y-3">
                <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 mx-auto flex items-center justify-center">
                  <Clock className="w-10 h-10" />
                </div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300 dark:bg-amber-500/20 dark:text-amber-300">
                  🟠 REGISTRADO EN LISTA DE ESPERA
                </span>
                <h3 id="confirmation-modal-title" className="text-2xl font-black text-[#2a285c] dark:text-white">
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
                <h3 id="confirmation-modal-title" className="text-2xl font-black text-[#2a285c] dark:text-white">
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
              {isPaidCourse && (
                <>
                  <div className="flex justify-between items-center text-slate-500 dark:text-slate-400 text-[11px] pt-1 border-t border-slate-200 dark:border-slate-800">
                    <span>Método de Pago:</span>
                    <strong className="text-emerald-700 dark:text-emerald-400">
                      {submissionResult.data?.isPaid
                        ? "Binance (Verificado Pabilo)"
                        : `${form.paymentMethod} (En revisión)`}
                    </strong>
                  </div>
                  {(submissionResult.data?.pabiloTransactionId || pabiloVerification?.paymentId) && (
                    <div className="flex justify-between items-center text-slate-500 dark:text-slate-400 text-[11px]">
                      <span>ID Pabilo / Referencia:</span>
                      <strong className="font-mono text-slate-800 dark:text-white">
                        #{submissionResult.data?.pabiloTransactionId || pabiloVerification?.paymentId} • {form.paymentReference}
                      </strong>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Acciones */}
            <div className="mt-5 space-y-2">
              <a
                href={buildOnprotecWhatsAppUrl(
                  `Hola equipo de OnProtec, acabo de completar mi ${
                    isPaidCourse ? "inscripción" : "pre-inscripción"
                  } para la capacitación ${selectedTraining?.code} - ${selectedTraining?.name}. Mi nombre es ${form.name} (CI: ${form.docType}-${form.docNumber}).${
                    isPaidCourse
                      ? ` Método de pago: ${form.paymentMethod}${
                          form.paymentReference ? ` • Ref: ${form.paymentReference}` : ""
                        }.`
                      : ""
                  }`
                )}
                target="_blank"
                rel="noopener noreferrer"
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
