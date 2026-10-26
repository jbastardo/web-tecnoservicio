"use client";

import React, { useState } from "react";
import { useParams } from "next/navigation";
import { Star, CheckCircle, GraduationCap, Building, ThumbsUp, Send } from "lucide-react";

export default function SurveyPage() {
  const params = useParams();
  const trainingId = params?.id;

  const [ratingInstructor, setRatingInstructor] = useState(5);
  const [ratingContent, setRatingContent] = useState(5);
  const [ratingFacilities, setRatingFacilities] = useState(5);
  const [recommendationScore, setRecommendationScore] = useState(10);
  const [feedback, setFeedback] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center px-4 py-12">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-brand-500/10 border border-brand-500/30 rounded-2xl flex items-center justify-center mx-auto mb-3 text-brand-400">
            <GraduationCap className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Encuesta de Satisfacción Onprotec
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Tu opinión nos ayuda a elevar el nivel técnico de nuestras formaciones en la Sala de
            Capacitaciones.
          </p>
        </div>

        {submitted ? (
          <div className="text-center py-8 space-y-4">
            <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="w-10 h-10" />
            </div>
            <h2 className="text-xl font-bold text-white">¡Muchas Gracias por tu Evaluación!</h2>
            <p className="text-sm text-slate-300">
              Hemos registrado tus respuestas. Te enviaremos tu certificado de asistencia a tu
              correo y WhatsApp.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5 text-sm">
            {/* 1. Calificación Instructor */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2 flex items-center gap-1.5">
                <GraduationCap className="w-4 h-4 text-brand-400" />
                1. Dominio y pedagogía del Instructor (1 a 5)
              </label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setRatingInstructor(val)}
                    className={`flex-1 py-2 rounded-xl border flex items-center justify-center gap-1 transition ${
                      ratingInstructor >= val
                        ? "bg-brand-500/20 border-brand-500 text-yellow-400 font-bold"
                        : "bg-slate-950 border-slate-800 text-slate-500"
                    }`}
                  >
                    <Star className="w-4 h-4 fill-current" />
                    <span>{val}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Contenido Técnico y Laboratorios */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2 flex items-center gap-1.5">
                <ThumbsUp className="w-4 h-4 text-cyan-400" />
                2. Calidad del Contenido y Prácticas Técnicas (1 a 5)
              </label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setRatingContent(val)}
                    className={`flex-1 py-2 rounded-xl border flex items-center justify-center gap-1 transition ${
                      ratingContent >= val
                        ? "bg-brand-500/20 border-brand-500 text-yellow-400 font-bold"
                        : "bg-slate-950 border-slate-800 text-slate-500"
                    }`}
                  >
                    <Star className="w-4 h-4 fill-current" />
                    <span>{val}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 3. Instalaciones Sala Onprotec */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2 flex items-center gap-1.5">
                <Building className="w-4 h-4 text-emerald-400" />
                3. Instalaciones y Comodidad de la Sala (Aforo 18)
              </label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setRatingFacilities(val)}
                    className={`flex-1 py-2 rounded-xl border flex items-center justify-center gap-1 transition ${
                      ratingFacilities >= val
                        ? "bg-brand-500/20 border-brand-500 text-yellow-400 font-bold"
                        : "bg-slate-950 border-slate-800 text-slate-500"
                    }`}
                  >
                    <Star className="w-4 h-4 fill-current" />
                    <span>{val}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 4. NPS */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">
                4. ¿Recomendarías las capacitaciones de Onprotec a un colega? (0 = Nada, 10 = Totalmente)
              </label>
              <div className="grid grid-cols-11 gap-1">
                {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((score) => (
                  <button
                    key={score}
                    type="button"
                    onClick={() => setRecommendationScore(score)}
                    className={`py-2 text-xs rounded-lg border font-bold transition ${
                      recommendationScore === score
                        ? "bg-brand-500 border-brand-400 text-white"
                        : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                    }`}
                  >
                    {score}
                  </button>
                ))}
              </div>
            </div>

            {/* Comentarios */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                ¿Qué otros cursos o equipos te gustaría aprender en Onprotec?
              </label>
              <textarea
                rows={3}
                placeholder="Tus comentarios o sugerencias..."
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 text-sm"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-brand-600 to-cyan-500 hover:from-brand-500 hover:to-cyan-400 text-white font-bold py-3 px-4 rounded-xl shadow-lg shadow-brand-500/25 transition duration-150 flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" />
              <span>Enviar Encuesta</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
