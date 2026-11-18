"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  Star,
  CheckCircle,
  Send,
  ArrowLeft,
  Calendar,
  UserCheck,
  Sparkles,
  Phone,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { SurveyQuestion } from "@/types";
import { defaultSurveyQuestions } from "@/lib/mockData";
import { ThemeToggle } from "@/components/ThemeToggle";
import { OnprotecBrand } from "@/components/OnprotecBrand";
import {
  fmtLocalDate,
  ONPROTEC_WHATSAPP_DISPLAY,
  buildOnprotecWhatsAppUrl,
} from "@/utils/formatUtils";

export default function SurveyPage() {
  const params = useParams();
  const trainingId = params?.id as string;

  const [training, setTraining] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFoundError, setNotFoundError] = useState(false);
  const [participantName, setParticipantName] = useState("");
  const [company, setCompany] = useState("");
  const [cargo, setCargo] = useState("");
  const [answers, setAnswers] = useState<Record<string, any>>({
    ratingInstructor: 5,
    ratingContent: 5,
    ratingFacilities: 5,
    recommendationScore: 10,
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (!trainingId) return;
    setLoading(true);
    setNotFoundError(false);
    fetch(`/api/capacitaciones?id=${encodeURIComponent(trainingId)}`)
      .then(async (r) => {
        const d = await r.json();
        if (r.ok && d.success && d.data) {
          setTraining(d.data);
          // Inicializar valores por defecto para preguntas rating/nps
          const initAns: Record<string, any> = {
            ratingInstructor: 5,
            ratingContent: 5,
            ratingFacilities: 5,
            recommendationScore: 10,
          };
          (d.data.surveyQuestions || defaultSurveyQuestions).forEach((sq: SurveyQuestion) => {
            if (sq.type === "rating" && initAns[sq.id] === undefined) initAns[sq.id] = 5;
            if (sq.type === "nps" && initAns[sq.id] === undefined) initAns[sq.id] = 10;
          });
          setAnswers(initAns);
        } else {
          setNotFoundError(true);
        }
      })
      .catch(() => {
        setNotFoundError(true);
      })
      .finally(() => setLoading(false));
  }, [trainingId]);

  const questions: SurveyQuestion[] =
    training?.surveyQuestions && training.surveyQuestions.length > 0
      ? training.surveyQuestions
      : defaultSurveyQuestions;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!training) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch("/api/encuestas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trainingId: training.id,
          participantName,
          company,
          cargo,
          ratingInstructor: answers.ratingInstructor ?? 5,
          ratingContent: answers.ratingContent ?? 5,
          ratingFacilities: answers.ratingFacilities ?? 5,
          recommendationScore: answers.recommendationScore ?? 10,
          mostLiked: answers.mostLiked || "",
          suggestions: answers.suggestions || "",
          hasActiveProjects: answers.hasActiveProjects || "",
          feedback: answers.suggestions || answers.feedback || "",
          customAnswers: answers,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSubmitted(true);
      } else {
        setSubmitError(data.error || "No se pudo registrar la encuesta. Intenta nuevamente.");
      }
    } catch (err) {
      console.error(err);
      setSubmitError("Error de conexión al enviar tu evaluación. Verifica tu internet e intenta de nuevo.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9fc] dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col">
      <div className="h-1.5 bg-gradient-to-r from-[#2a285c] via-[#f4730a] to-brand-500 w-full" />

      <header className="max-w-5xl w-full mx-auto px-4 py-4 flex items-center justify-between gap-3">
        <OnprotecBrand subtitle="Encuesta de Satisfacción Fin de Curso" href="/" variant="auto" />
        <div className="flex items-center gap-2.5">
          <ThemeToggle />
          <Link
            href="/"
            className="text-xs font-bold bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-[#2a285c] dark:text-slate-200 px-3.5 py-2 rounded-full border border-slate-300 dark:border-slate-700 flex items-center gap-1.5 shadow-sm transition"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-[#f4730a]" />
            <span>Portada</span>
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-6">
        <div className="w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
          {loading ? (
            <div className="space-y-4 py-6 animate-pulse">
              <div className="h-32 w-full rounded-2xl bg-slate-200 dark:bg-slate-800" />
              <div className="h-6 w-2/3 rounded-lg bg-slate-200 dark:bg-slate-800" />
              <div className="h-4 w-1/2 rounded-lg bg-slate-200 dark:bg-slate-800" />
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div className="h-12 rounded-xl bg-slate-200 dark:bg-slate-800" />
                <div className="h-12 rounded-xl bg-slate-200 dark:bg-slate-800" />
                <div className="h-12 rounded-xl bg-slate-200 dark:bg-slate-800" />
              </div>
              <div className="h-24 rounded-xl bg-slate-200 dark:bg-slate-800" />
            </div>
          ) : notFoundError || !training ? (
            <div className="text-center py-8 space-y-4">
              <div className="w-16 h-16 bg-amber-500/15 text-[#f4730a] rounded-full flex items-center justify-center mx-auto border border-[#f4730a]/30">
                <AlertTriangle className="w-8 h-8" />
              </div>
              <h1 className="text-xl font-black text-[#2a285c] dark:text-white">
                Encuesta No Disponible
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-300 max-w-md mx-auto">
                No encontramos la capacitación solicitada o el enlace de encuesta ya no está vigente.
              </p>
              <div className="pt-2 flex flex-wrap justify-center gap-3">
                <Link
                  href="/"
                  className="px-5 py-2.5 rounded-xl bg-[#f4730a] hover:bg-[#ef7922] text-white text-xs font-black inline-flex items-center gap-1.5 keep-white"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Ir a Próximas Capacitaciones</span>
                </Link>
              </div>
            </div>
          ) : (
            <>
              {training.coverImageUrl && (
                <div className="relative h-36 -mx-6 -mt-6 sm:-mx-8 sm:-mt-8 mb-6 overflow-hidden border-b border-slate-200 dark:border-slate-800 bg-[#0b0e17]">
                  <img
                    src={training.coverImageUrl}
                    alt={training.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/35 to-transparent" />
                  <div className="absolute bottom-3 left-6 right-6">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#f4730a] text-white keep-white shadow">
                      {training.code} · {training.brand || "OnProtec"}
                    </span>
                  </div>
                </div>
              )}

              <div className="mb-6 pb-4 border-b border-slate-200 dark:border-slate-800">
                <div className="inline-flex items-center gap-1.5 text-xs font-extrabold text-[#f4730a] mb-1 uppercase tracking-wider">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Evaluación Final de Capacitación OnProtec</span>
                </div>
                <h1 className="text-xl sm:text-2xl font-black text-[#2a285c] dark:text-white tracking-tight">
                  {training.name || "Encuesta de Satisfacción OnProtec"}
                </h1>
                <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-slate-600 dark:text-slate-400">
                  <span className="flex items-center gap-1">
                    <UserCheck className="w-3.5 h-3.5 text-[#f4730a]" />
                    Instructor: <strong className="text-slate-900 dark:text-slate-200">{training.instructor}</strong>
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-[#f4730a]" />
                    Fecha: <strong className="text-slate-900 dark:text-slate-200">{fmtLocalDate(training.eventDate)}</strong>
                  </span>
                </div>
              </div>

              {submitted ? (
                <div className="text-center py-8 space-y-4">
                  <div className="w-16 h-16 bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle className="w-10 h-10" />
                  </div>
                  <h2 className="text-xl font-black text-[#2a285c] dark:text-white">
                    ¡Muchas Gracias por Evaluar esta Capacitación!
                  </h2>
                  <p className="text-sm text-slate-600 dark:text-slate-300 max-w-md mx-auto">
                    Tus respuestas han sido registradas exitosamente en el sistema de calidad de{" "}
                    <strong>OnProtec C.A.</strong>
                  </p>
                  <div className="pt-4 flex flex-wrap justify-center gap-3">
                    <Link
                      href="/"
                      className="onprotec-btn-primary px-5 py-2.5 rounded-xl bg-[#f4730a] hover:bg-[#ef7922] text-white text-xs font-black keep-white"
                    >
                      Ver Próximas Capacitaciones
                    </Link>
                    <a
                      href={buildOnprotecWhatsAppUrl(
                        `Hola equipo de OnProtec, acabo de completar la encuesta de satisfacción de "${training.name || "capacitación"}".`
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-5 py-2.5 rounded-xl bg-[#25d366] hover:bg-[#1ebe5d] text-white text-xs font-bold inline-flex items-center gap-1.5 keep-white"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>WhatsApp ({ONPROTEC_WHATSAPP_DISPLAY})</span>
                    </a>
                    <a
                      href="https://www.onprotec.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold border border-slate-300 dark:border-slate-700"
                    >
                      Visitar www.onprotec.com
                    </a>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5 text-sm">
                  {submitError && (
                    <div
                      role="alert"
                      className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-500/15 border border-rose-300 dark:border-rose-500/40 text-rose-800 dark:text-rose-200 text-xs flex items-start gap-2"
                    >
                      <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                      <span className="font-semibold">{submitError}</span>
                    </div>
                  )}

                  {/* Datos del asistente */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 dark:bg-slate-950 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800">
                    <div>
                      <label htmlFor="survey-name" className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Tu Nombre y Apellido *
                      </label>
                      <input
                        id="survey-name"
                        name="participantName"
                        type="text"
                        required
                        autoComplete="name"
                        placeholder="Ej. Carlos Pérez"
                        value={participantName}
                        onChange={(e) => setParticipantName(e.target.value)}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label htmlFor="survey-company" className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Empresa / Integradora
                      </label>
                      <input
                        id="survey-company"
                        name="company"
                        type="text"
                        autoComplete="organization"
                        placeholder="Ej. Redes & CCTV C.A."
                        value={company}
                        onChange={(e) => setCompany(e.target.value)}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label htmlFor="survey-cargo" className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Cargo / Especialidad
                      </label>
                      <input
                        id="survey-cargo"
                        name="cargo"
                        type="text"
                        autoComplete="organization-title"
                        placeholder="Ej. Integrador"
                        value={cargo}
                        onChange={(e) => setCargo(e.target.value)}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>

                  {/* Preguntas Dinámicas Configuradas para la Encuesta */}
                  {questions.map((sq) => (
                    <div key={sq.id} className="space-y-2">
                      <label htmlFor={`sq-${sq.id}`} className="block text-xs font-bold text-[#2a285c] dark:text-slate-200">
                        {sq.label} {sq.required && <span className="text-[#f4730a]">*</span>}
                      </label>

                      {sq.type === "rating" ? (
                        <div className="flex gap-2" role="group" aria-label={sq.label}>
                          {[1, 2, 3, 4, 5].map((val) => {
                            const active = (Number(answers[sq.id]) || 5) >= val;
                            return (
                              <button
                                key={val}
                                type="button"
                                aria-pressed={Number(answers[sq.id] || 5) === val}
                                onClick={() => setAnswers({ ...answers, [sq.id]: val })}
                                className={`flex-1 py-2.5 rounded-xl border flex items-center justify-center gap-1 transition cursor-pointer ${
                                  active
                                    ? "bg-amber-50 dark:bg-amber-500/20 border-[#f4730a] text-[#f4730a] dark:text-amber-400 font-black"
                                    : "bg-slate-100 dark:bg-slate-950 border-slate-300 dark:border-slate-800 text-slate-500"
                                }`}
                              >
                                <Star className="w-4 h-4 fill-current" />
                                <span>{val}</span>
                              </button>
                            );
                          })}
                        </div>
                      ) : sq.type === "nps" ? (
                        <div className="grid grid-cols-6 sm:grid-cols-11 gap-1.5" role="group" aria-label={sq.label}>
                          {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((score) => {
                            const isSelected = Number(answers[sq.id] ?? 10) === score;
                            return (
                              <button
                                key={score}
                                type="button"
                                aria-pressed={isSelected}
                                onClick={() => setAnswers({ ...answers, [sq.id]: score })}
                                className={`py-2 text-xs rounded-lg border font-bold transition cursor-pointer ${
                                  isSelected
                                    ? "bg-[#f4730a] border-[#f4730a] text-white keep-white shadow-sm"
                                    : "bg-slate-100 dark:bg-slate-950 border-slate-300 dark:border-slate-800 text-slate-700 dark:text-slate-400 hover:border-[#f4730a]"
                                }`}
                              >
                                {score}
                              </button>
                            );
                          })}
                        </div>
                      ) : sq.type === "select" ? (
                        <select
                          id={`sq-${sq.id}`}
                          required={sq.required}
                          value={answers[sq.id] || ""}
                          onChange={(e) => setAnswers({ ...answers, [sq.id]: e.target.value })}
                          className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white"
                        >
                          <option value="">Selecciona una opción...</option>
                          {(sq.options || []).map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <textarea
                          id={`sq-${sq.id}`}
                          rows={2}
                          required={sq.required}
                          placeholder="Escribe tu comentario o respuesta..."
                          value={answers[sq.id] || ""}
                          onChange={(e) => setAnswers({ ...answers, [sq.id]: e.target.value })}
                          className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl p-3 text-xs text-slate-900 dark:text-white"
                        />
                      )}
                    </div>
                  ))}

                  <button
                    type="submit"
                    disabled={submitting}
                    className="onprotec-btn-primary w-full bg-gradient-to-r from-[#2a285c] to-[#f4730a] hover:opacity-95 disabled:opacity-60 text-white font-black py-3.5 px-4 rounded-xl shadow-lg transition flex items-center justify-center gap-2 cursor-pointer keep-white"
                  >
                    {submitting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                    <span>{submitting ? "Enviando Evaluación..." : "Enviar Encuesta Final del Curso"}</span>
                  </button>
                </form>
              )}
            </>
          )}
        </div>
      </main>

      <footer className="py-4 text-center text-xs text-slate-600 dark:text-slate-400 border-t border-slate-200 dark:border-slate-800/70">
        ¿Consultas o requerimientos técnicos? Escríbenos por WhatsApp:{" "}
        <a
          href={buildOnprotecWhatsAppUrl("Hola equipo de OnProtec, tengo una consulta post-capacitación.")}
          target="_blank"
          rel="noopener noreferrer"
          className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline"
        >
          {ONPROTEC_WHATSAPP_DISPLAY} (+58 412 2318398)
        </a>
      </footer>
    </div>
  );
}
