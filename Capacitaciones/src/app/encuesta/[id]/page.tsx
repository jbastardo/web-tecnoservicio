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
} from "lucide-react";
import { SurveyQuestion } from "@/types";
import { defaultSurveyQuestions } from "@/lib/mockData";
import { ThemeToggle } from "@/components/ThemeToggle";
import { OnprotecBrand } from "@/components/OnprotecBrand";
import { fmtLocalDate } from "@/utils/formatUtils";

export default function SurveyPage() {
  const params = useParams();
  const trainingId = params?.id as string;

  const [training, setTraining] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
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

  useEffect(() => {
    if (!trainingId) return;
    fetch(`/api/capacitaciones?id=${trainingId}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success && d.data) {
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
        }
      })
      .finally(() => setLoading(false));
  }, [trainingId]);

  const questions: SurveyQuestion[] =
    training?.surveyQuestions && training.surveyQuestions.length > 0
      ? training.surveyQuestions
      : defaultSurveyQuestions;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/encuestas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trainingId: training?.id || trainingId,
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
      if (data.success) {
        setSubmitted(true);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <div className="h-1.5 bg-gradient-to-r from-[#1a1b4b] via-[#e07b29] to-brand-500 w-full" />

      <header className="max-w-5xl w-full mx-auto px-4 py-4 flex items-center justify-between">
        <OnprotecBrand subtitle="Encuesta de Satisfacción Fin de Curso" href="/" />
        <div className="flex items-center gap-2.5">
          <ThemeToggle />
          <Link
            href="/"
            className="text-xs bg-slate-900 hover:bg-slate-800 text-slate-300 px-3 py-1.5 rounded-xl border border-slate-800 flex items-center gap-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Portada</span>
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-6">
        <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
          {training?.coverImageUrl && (
            <div className="relative h-36 -mx-6 -mt-6 sm:-mx-8 sm:-mt-8 mb-6 overflow-hidden border-b border-slate-800">
              <img
                src={training.coverImageUrl}
                alt={training.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/50 to-transparent" />
              <div className="absolute bottom-3 left-6 right-6">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#e07b29] text-white keep-white">
                  {training.code} · {training.brand || "OnProtec"}
                </span>
              </div>
            </div>
          )}

          <div className="mb-6 pb-4 border-b border-slate-800">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#e07b29] mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Evaluación Final de Capacitación OnProtec</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
              {loading
                ? "Cargando encuesta..."
                : training?.name || "Encuesta de Satisfacción OnProtec"}
            </h1>
            {training && (
              <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-slate-400">
                <span className="flex items-center gap-1">
                  <UserCheck className="w-3.5 h-3.5 text-cyan-400" />
                  Instructor: <strong className="text-slate-200">{training.instructor}</strong>
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                  Fecha: <strong className="text-slate-200">{fmtLocalDate(training.eventDate)}</strong>
                </span>
              </div>
            )}
          </div>

          {submitted ? (
            <div className="text-center py-8 space-y-4">
              <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-10 h-10" />
              </div>
              <h2 className="text-xl font-bold text-white">
                ¡Muchas Gracias por Evaluar esta Capacitación!
              </h2>
              <p className="text-sm text-slate-300 max-w-md mx-auto">
                Tus respuestas han sido registradas exitosamente en el sistema de calidad de{" "}
                <strong>OnProtec C.A.</strong>
              </p>
              <div className="pt-4 flex justify-center gap-3">
                <Link
                  href="/"
                  className="onprotec-btn-primary px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold"
                >
                  Ver Próximas Capacitaciones
                </Link>
                <a
                  href="https://www.onprotec.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700"
                >
                  Visitar www.onprotec.com
                </a>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5 text-sm">
              {/* Datos opcionales del asistente */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-950 p-3.5 rounded-2xl border border-slate-800">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Tu Nombre y Apellido *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Carlos Pérez"
                    value={participantName}
                    onChange={(e) => setParticipantName(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Empresa / Integradora
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. Redes & CCTV C.A."
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Cargo / Especialidad
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. Integrador"
                    value={cargo}
                    onChange={(e) => setCargo(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>

              {/* Preguntas Dinámicas Configuradas para la Encuesta */}
              {questions.map((sq) => (
                <div key={sq.id} className="space-y-2">
                  <label className="block text-xs font-bold text-slate-200">
                    {sq.label} {sq.required && <span className="text-[#e07b29]">*</span>}
                  </label>

                  {sq.type === "rating" ? (
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((val) => {
                        const active = (Number(answers[sq.id]) || 5) >= val;
                        return (
                          <button
                            key={val}
                            type="button"
                            onClick={() => setAnswers({ ...answers, [sq.id]: val })}
                            className={`flex-1 py-2.5 rounded-xl border flex items-center justify-center gap-1 transition ${
                              active
                                ? "bg-brand-500/20 border-brand-500 text-amber-400 font-bold"
                                : "bg-slate-950 border-slate-800 text-slate-500"
                            }`}
                          >
                            <Star className="w-4 h-4 fill-current" />
                            <span>{val}</span>
                          </button>
                        );
                      })}
                    </div>
                  ) : sq.type === "nps" ? (
                    <div className="grid grid-cols-11 gap-1">
                      {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((score) => (
                        <button
                          key={score}
                          type="button"
                          onClick={() => setAnswers({ ...answers, [sq.id]: score })}
                          className={`py-2 text-xs rounded-lg border font-bold transition ${
                            Number(answers[sq.id] ?? 10) === score
                              ? "bg-[#e07b29] border-[#e07b29] text-white keep-white"
                              : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                          }`}
                        >
                          {score}
                        </button>
                      ))}
                    </div>
                  ) : sq.type === "select" ? (
                    <select
                      required={sq.required}
                      value={answers[sq.id] || ""}
                      onChange={(e) => setAnswers({ ...answers, [sq.id]: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white"
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
                      rows={2}
                      required={sq.required}
                      placeholder="Escribe tu comentario o respuesta..."
                      value={answers[sq.id] || ""}
                      onChange={(e) => setAnswers({ ...answers, [sq.id]: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white"
                    />
                  )}
                </div>
              ))}

              <button
                type="submit"
                disabled={submitting}
                className="onprotec-btn-primary w-full bg-gradient-to-r from-[#1a1b4b] via-brand-600 to-[#e07b29] hover:opacity-95 text-white font-bold py-3 px-4 rounded-xl shadow-lg transition flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                <span>{submitting ? "Enviando Evaluación..." : "Enviar Encuesta Final del Curso"}</span>
              </button>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}
