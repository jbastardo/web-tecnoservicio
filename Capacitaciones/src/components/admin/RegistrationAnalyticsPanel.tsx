"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  PieChart,
  Users,
  CheckCircle2,
  Star,
  MessageSquare,
  Sparkles,
  Download,
  Printer,
  FileText,
  Award,
  TrendingUp,
  Eye,
  Filter,
  Loader2,
  MapPin,
  Briefcase,
  CreditCard,
} from "lucide-react";
import { fmtLocalDate, fmtLocalTime } from "@/utils/formatUtils";

interface RegistrationAnalyticsPanelProps {
  trainings: any[];
  registrations: any[];
  selectedTrainingId: string;
  onSelectTrainingId: (id: string) => void;
  onInspectRegistration: (reg: any) => void;
  onNotify?: (msg: string) => void;
}

interface AggregatedOption {
  label: string;
  count: number;
  percentage: number;
}

interface QuestionAnalytics {
  id: string;
  label: string;
  type: string;
  totalAnswered: number;
  responseRate: number;
  isOpenText: boolean;
  options: AggregatedOption[];
  openResponses: {
    regId: number;
    participantName: string;
    company: string;
    value: string;
    reg: any;
  }[];
}

function normalizeAnswerText(val: unknown): string {
  if (val === null || val === undefined) return "";
  if (typeof val === "boolean") return val ? "Sí" : "No";
  const str = String(val).trim();
  if (!str) return "";
  if (str.startsWith("data:image/") || str.startsWith("data:application/pdf")) {
    return "__FILE_ATTACHED__";
  }
  return str;
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
  return `"${String(val ?? "").replace(/"/g, '""')}"`;
}

function buildDistribution(
  values: string[],
  denominator: number
): AggregatedOption[] {
  const counts = new Map<string, { display: string; count: number }>();
  for (const raw of values) {
    const clean = raw.trim();
    if (!clean) continue;
    const key = clean.toLowerCase();
    const existing = counts.get(key);
    if (existing) {
      existing.count += 1;
    } else {
      counts.set(key, { display: clean, count: 1 });
    }
  }
  const base = denominator > 0 ? denominator : values.length || 1;
  return Array.from(counts.values())
    .sort((a, b) => b.count - a.count)
    .map((item) => ({
      label: item.display,
      count: item.count,
      percentage: Number(((item.count / base) * 100).toFixed(1)),
    }));
}

export function RegistrationAnalyticsPanel({
  trainings,
  registrations,
  selectedTrainingId,
  onSelectTrainingId,
  onInspectRegistration,
  onNotify,
}: RegistrationAnalyticsPanelProps) {
  const [surveyData, setSurveyData] = useState<any[]>([]);
  const [surveySummary, setSurveySummary] = useState<any | null>(null);
  const [loadingSurveys, setLoadingSurveys] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<"formulario" | "encuesta">("formulario");

  // Ordenar capacitaciones: primero las que tienen inscritos recientes
  const trainingsWithCounts = useMemo(() => {
    const countMap = new Map<number, number>();
    for (const r of registrations) {
      const tid = Number(r.trainingId);
      countMap.set(tid, (countMap.get(tid) || 0) + 1);
    }
    return [...trainings]
      .map((t) => ({
        ...t,
        regCount: countMap.get(Number(t.id)) || 0,
      }))
      .sort((a, b) => {
        const dateB = new Date(b.eventDate || 0).getTime();
        const dateA = new Date(a.eventDate || 0).getTime();
        return dateB - dateA;
      });
  }, [trainings, registrations]);

  // Capacitación activa efectiva (si está en "all", elegir automáticamente la más reciente con inscripciones)
  const effectiveTrainingId = useMemo(() => {
    if (selectedTrainingId && selectedTrainingId !== "all") {
      return selectedTrainingId;
    }
    const firstWithRegs = trainingsWithCounts.find((t) => t.regCount > 0);
    return firstWithRegs
      ? String(firstWithRegs.id)
      : trainingsWithCounts[0]
      ? String(trainingsWithCounts[0].id)
      : "";
  }, [selectedTrainingId, trainingsWithCounts]);

  const activeTraining = useMemo(
    () => trainingsWithCounts.find((t) => String(t.id) === effectiveTrainingId) || null,
    [trainingsWithCounts, effectiveTrainingId]
  );

  const courseRegistrations = useMemo(
    () =>
      registrations.filter(
        (r) => String(r.trainingId) === effectiveTrainingId && r.status !== "Cancelado"
      ),
    [registrations, effectiveTrainingId]
  );

  // Cargar encuestas post-curso (QR) de la capacitación seleccionada
  useEffect(() => {
    if (!effectiveTrainingId) {
      setSurveyData([]);
      setSurveySummary(null);
      return;
    }
    let cancelled = false;
    setLoadingSurveys(true);
    fetch(`/api/encuestas?trainingId=${effectiveTrainingId}`)
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled && d.success) {
          setSurveyData(d.data || []);
          setSurveySummary(d.summary || null);
        }
      })
      .catch((err) => console.error("Error cargando encuestas post-curso:", err))
      .finally(() => {
        if (!cancelled) setLoadingSurveys(false);
      });
    return () => {
      cancelled = true;
    };
  }, [effectiveTrainingId]);

  // Analítica consolidada de TODAS las preguntas del formulario de inscripción
  const formAnalytics = useMemo(() => {
    const total = courseRegistrations.length;
    const confirmedOrAttended = courseRegistrations.filter(
      (r) => r.status === "Confirmado" || r.status === "Asistió"
    ).length;
    const withCustomAnswers = courseRegistrations.filter(
      (r) => r.customAnswers && Object.keys(r.customAnswers).length > 0
    ).length;

    // 1. Recolectar definiciones de preguntas del curso + claves dinámicas presentes en los inscritos
    const definedQuestions: { id: string; label: string; type: string }[] = Array.isArray(
      activeTraining?.formQuestions
    )
      ? activeTraining.formQuestions.map((fq: any) => ({
          id: String(fq.id),
          label: String(fq.label || fq.id),
          type: String(fq.type || "text"),
        }))
      : [];

    const qMap = new Map<string, { id: string; label: string; type: string }>();
    for (const q of definedQuestions) {
      if (q.type !== "file") {
        qMap.set(q.id, q);
      }
    }

    for (const r of courseRegistrations) {
      const ca = r.customAnswers || {};
      for (const key of Object.keys(ca)) {
        if (!qMap.has(key)) {
          const sample = normalizeAnswerText(ca[key]);
          if (sample === "__FILE_ATTACHED__") continue;
          qMap.set(key, {
            id: key,
            label: key,
            type: "text",
          });
        }
      }
    }

    // 2. Agregar respuestas por pregunta
    const questions: QuestionAnalytics[] = [];
    for (const q of qMap.values()) {
      const rawValues: string[] = [];
      const openResponses: QuestionAnalytics["openResponses"] = [];

      for (const r of courseRegistrations) {
        const val = normalizeAnswerText(r.customAnswers?.[q.id]);
        if (!val || val === "__FILE_ATTACHED__") continue;
        rawValues.push(val);
        openResponses.push({
          regId: r.id,
          participantName: r.participant?.name || "Sin Nombre",
          company: r.participant?.company || "Independiente",
          value: val,
          reg: r,
        });
      }

      if (rawValues.length === 0) continue;

      const distribution = buildDistribution(rawValues, rawValues.length);
      const avgLength =
        rawValues.reduce((acc, s) => acc + s.length, 0) / rawValues.length;
      const uniqueRatio = distribution.length / rawValues.length;
      const isOpenText =
        q.type === "textarea" ||
        (q.type === "text" && avgLength > 38 && uniqueRatio > 0.7 && distribution.length > 5);

      questions.push({
        id: q.id,
        label: q.label,
        type: q.type,
        totalAnswered: rawValues.length,
        responseRate: total > 0 ? Number(((rawValues.length / total) * 100).toFixed(1)) : 0,
        isOpenText,
        options: distribution,
        openResponses,
      });
    }

    // 3. Perfiles demográficos / comerciales agregados
    const experienceDist = buildDistribution(
      courseRegistrations
        .map((r) => normalizeAnswerText(r.participant?.experienceLevel || r.experienceLevel))
        .filter(Boolean),
      total
    );
    const referralDist = buildDistribution(
      courseRegistrations
        .map((r) => normalizeAnswerText(r.participant?.referralSource))
        .filter(Boolean),
      total
    );
    const cityDist = buildDistribution(
      courseRegistrations
        .map((r) => normalizeAnswerText(r.participant?.city))
        .filter(Boolean),
      total
    );
    const cargoDist = buildDistribution(
      courseRegistrations
        .map((r) => normalizeAnswerText(r.participant?.cargo || r.customAnswers?.cargo))
        .filter(Boolean),
      total
    );
    const paymentDist = buildDistribution(
      courseRegistrations
        .map((r) =>
          normalizeAnswerText(
            r.paymentMethod || (Number(r.amount) > 0 ? "Sin especificar" : "Gratuito")
          )
        )
        .filter(Boolean),
      total
    );

    const specialNotesList = courseRegistrations
      .filter((r) => r.specialNotes && String(r.specialNotes).trim().length > 0)
      .map((r) => ({
        regId: r.id,
        participantName: r.participant?.name || "Sin Nombre",
        company: r.participant?.company || "Independiente",
        note: String(r.specialNotes).trim(),
        reg: r,
      }));

    return {
      total,
      confirmedOrAttended,
      withCustomAnswers,
      questions,
      experienceDist,
      referralDist,
      cityDist,
      cargoDist,
      paymentDist,
      specialNotesList,
    };
  }, [courseRegistrations, activeTraining]);

  // Analítica de Encuesta Post-Curso (QR)
  const postSurveyAnalytics = useMemo(() => {
    const total = surveyData.length;
    if (total === 0) {
      return {
        total: 0,
        promotersPct: 0,
        passivesPct: 0,
        detractorsPct: 0,
        npsNet: 0,
        futureCerts: [] as AggregatedOption[],
        activeProjects: [] as AggregatedOption[],
        comments: [] as { name: string; company: string; mostLiked?: string; suggestions?: string; rating: number }[],
      };
    }

    const promoters = surveyData.filter((s) => Number(s.recommendationScore || 10) >= 9).length;
    const passives = surveyData.filter((s) => {
      const score = Number(s.recommendationScore || 10);
      return score >= 7 && score <= 8;
    }).length;
    const detractors = surveyData.filter((s) => Number(s.recommendationScore || 10) <= 6).length;

    const promotersPct = Math.round((promoters / total) * 100);
    const passivesPct = Math.round((passives / total) * 100);
    const detractorsPct = Math.round((detractors / total) * 100);
    const npsNet = promotersPct - detractorsPct;

    const futureCerts = buildDistribution(
      surveyData.map((s) => normalizeAnswerText(s.wantsFutureCertifications)).filter(Boolean),
      total
    );
    const activeProjects = buildDistribution(
      surveyData.map((s) => normalizeAnswerText(s.hasActiveProjects)).filter(Boolean),
      total
    );

    const comments = surveyData
      .filter((s) => s.mostLiked || s.suggestions || s.feedback)
      .map((s) => ({
        name: s.participantName || "Participante",
        company: s.company || "Independiente",
        mostLiked: s.mostLiked || undefined,
        suggestions: s.suggestions || s.feedback || undefined,
        rating: Number(s.ratingInstructor) || 5,
      }));

    return {
      total,
      promotersPct,
      passivesPct,
      detractorsPct,
      npsNet,
      futureCerts,
      activeProjects,
      comments,
    };
  }, [surveyData]);

  const handleExportAnalyticsCsv = () => {
    if (!activeTraining) return;
    const lines: string[] = [
      ["Sección", "Pregunta / Dimensión", "Respuesta / Opción", "Cantidad", "Porcentaje (%)"].map(csvCell).join(","),
    ];

    for (const q of formAnalytics.questions) {
      for (const opt of q.options) {
        lines.push(
          ["Formulario Inscripción", q.label, opt.label, opt.count, `${opt.percentage}%`]
            .map(csvCell)
            .join(",")
        );
      }
    }
    for (const opt of formAnalytics.experienceDist) {
      lines.push(["Perfil Técnico", "Nivel de Experiencia", opt.label, opt.count, `${opt.percentage}%`].map(csvCell).join(","));
    }
    for (const opt of formAnalytics.referralDist) {
      lines.push(["Perfil Técnico", "¿Cómo se enteró?", opt.label, opt.count, `${opt.percentage}%`].map(csvCell).join(","));
    }
    for (const opt of formAnalytics.paymentDist) {
      lines.push(["Pagos", "Método de Pago", opt.label, opt.count, `${opt.percentage}%`].map(csvCell).join(","));
    }

    const csvContent = "\uFEFF" + lines.join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `resumen-analitico-${activeTraining.code || activeTraining.id}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    onNotify?.(`Resumen analítico CSV exportado para ${activeTraining.code}.`);
  };

  const handlePrintAnalytics = () => {
    if (!activeTraining) return;
    const printWin = window.open("", "_blank", "width=1100,height=800");
    if (!printWin) {
      onNotify?.("Permite ventanas emergentes para imprimir el resumen analítico.");
      return;
    }

    const questionsHtml = formAnalytics.questions
      .map(
        (q) => `
        <div class="card">
          <h3>${escapeHtml(q.label)} <span class="muted">(${q.totalAnswered} respuestas • ${q.responseRate}%)</span></h3>
          <table>
            <thead><tr><th>Respuesta</th><th style="width:80px;text-align:center">Cant.</th><th style="width:90px;text-align:right">%</th></tr></thead>
            <tbody>
              ${q.options
                .slice(0, 15)
                .map(
                  (o) => `<tr><td>${escapeHtml(o.label)}</td><td style="text-align:center"><strong>${o.count}</strong></td><td style="text-align:right">${o.percentage}%</td></tr>`
                )
                .join("")}
            </tbody>
          </table>
        </div>`
      )
      .join("");

    const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <title>Resumen Analítico — ${escapeHtml(activeTraining.code)}</title>
  <style>
    body { font-family: Arial, Helvetica, sans-serif; color: #0f172a; margin: 24px; font-size: 12px; }
    .header { border-bottom: 3px solid #2a285c; padding-bottom: 12px; margin-bottom: 18px; display: flex; justify-content: space-between; }
    h1 { font-size: 18px; color: #2a285c; margin: 0; }
    .sub { color: #f4730a; font-weight: 700; font-size: 11px; margin-top: 4px; }
    .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 14px; }
    .card { border: 1px solid #cbd5e1; border-radius: 10px; padding: 12px; break-inside: avoid; background: #fff; }
    h3 { font-size: 12px; color: #2a285c; margin: 0 0 8px; }
    .muted { color: #64748b; font-weight: normal; font-size: 10px; }
    table { width: 100%; border-collapse: collapse; font-size: 11px; }
    th { background: #f1f5f9; color: #334155; text-align: left; padding: 5px 6px; font-size: 10px; }
    td { border-bottom: 1px solid #e2e8f0; padding: 5px 6px; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <h1>Resumen Analítico de Respuestas — ${escapeHtml(activeTraining.code)}</h1>
      <div class="sub">${escapeHtml(activeTraining.name)} • ${fmtLocalDate(activeTraining.eventDate)}</div>
    </div>
    <div style="text-align:right;font-size:11px;color:#475569">
      <div><strong>Inscritos analizados:</strong> ${formAnalytics.total}</div>
      <div>Generado (Caracas): ${escapeHtml(fmtLocalTime(new Date()))}</div>
    </div>
  </div>
  <div class="grid">${questionsHtml || "<p>No hay respuestas personalizadas registradas para esta capacitación.</p>"}</div>
</body>
</html>`;

    printWin.document.open();
    printWin.document.write(html);
    printWin.document.close();
    setTimeout(() => {
      printWin.focus();
      printWin.print();
    }, 300);
  };

  const renderBarList = (items: AggregatedOption[], barColorClass: string, maxItems = 8) => {
    if (items.length === 0) {
      return (
        <p className="text-xs text-slate-500 dark:text-slate-400 italic py-2">
          Sin datos registrados para esta dimensión.
        </p>
      );
    }
    return (
      <div className="space-y-2.5">
        {items.slice(0, maxItems).map((item, idx) => (
          <div key={`${item.label}-${idx}`} className="space-y-1">
            <div className="flex items-center justify-between gap-2 text-xs">
              <span
                className="font-semibold text-slate-800 dark:text-slate-100 truncate"
                title={item.label}
              >
                {idx === 0 && items.length > 1 ? (
                  <span className="inline-block mr-1.5 text-[10px] font-black px-1.5 py-0.5 rounded bg-orange-100 text-orange-800 dark:bg-orange-500/20 dark:text-orange-300">
                    TOP
                  </span>
                ) : null}
                {item.label}
              </span>
              <span className="font-mono font-bold text-slate-700 dark:text-slate-200 whitespace-nowrap flex-shrink-0">
                {item.count}{" "}
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                  ({item.percentage}%)
                </span>
              </span>
            </div>
            <div className="w-full h-2.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${barColorClass}`}
                style={{ width: `${Math.max(4, Math.min(100, item.percentage))}%` }}
              />
            </div>
          </div>
        ))}
        {items.length > maxItems && (
          <p className="text-[11px] text-slate-500 dark:text-slate-400 pt-1">
            + {items.length - maxItems} opciones adicionales registradas.
          </p>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-5">
      {/* Barra Superior de Selección de Capacitación + Acciones de Exportación */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-[#f4730a]/15 text-[#c25e0a] dark:text-[#f4730a] flex items-center justify-center flex-shrink-0">
            <PieChart className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <label
              htmlFor="analytics-training-select"
              className="block text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400"
            >
              Capacitación Analizada
            </label>
            <select
              id="analytics-training-select"
              value={effectiveTrainingId}
              onChange={(e) => onSelectTrainingId(e.target.value)}
              className="mt-0.5 w-full max-w-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs sm:text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:border-[#f4730a]"
            >
              {trainingsWithCounts.map((t) => (
                <option
                  key={t.id}
                  value={String(t.id)}
                  className="bg-white text-slate-900 dark:bg-slate-900 dark:text-white"
                >
                  [{t.code}] {t.name} ({t.regCount} inscritos • {fmtLocalDate(t.eventDate)})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleExportAnalyticsCsv}
            disabled={!activeTraining || formAnalytics.total === 0}
            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-45 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition cursor-pointer keep-white"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Exportar Resumen CSV</span>
          </button>
          <button
            type="button"
            onClick={handlePrintAnalytics}
            disabled={!activeTraining || formAnalytics.total === 0}
            className="px-3.5 py-2 rounded-xl bg-[#2a285c] hover:bg-[#3a377c] disabled:opacity-45 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition cursor-pointer keep-white"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Imprimir PDF</span>
          </button>
        </div>
      </div>

      {/* KPIs Horizontales Widescreen */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Inscritos Analizados
            </span>
            <Users className="w-4 h-4 text-[#f4730a]" />
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-1.5">
            {formAnalytics.total}
          </p>
          <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1">
            Confirmados / Asistieron:{" "}
            <strong className="text-emerald-700 dark:text-emerald-400">
              {formAnalytics.confirmedOrAttended}
            </strong>
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Preguntas con Respuestas
            </span>
            <FileText className="w-4 h-4 text-sky-600 dark:text-cyan-400" />
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-1.5">
            {formAnalytics.questions.length}
          </p>
          <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1">
            Formularios con detalle:{" "}
            <strong className="text-sky-700 dark:text-cyan-300">
              {formAnalytics.withCustomAnswers} de {formAnalytics.total}
            </strong>
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Encuesta Post-Curso (QR)
            </span>
            <Star className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-1.5">
            {loadingSurveys ? (
              <Loader2 className="w-5 h-5 animate-spin text-slate-400 inline" />
            ) : (
              `${postSurveyAnalytics.total} eval.`
            )}
          </p>
          <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1">
            {postSurveyAnalytics.total > 0 && surveySummary ? (
              <>
                Instructor:{" "}
                <strong className="text-amber-700 dark:text-amber-300">
                  {surveySummary.avgInstructor}/5
                </strong>{" "}
                • NPS:{" "}
                <strong className="text-emerald-700 dark:text-emerald-400">
                  {surveySummary.avgNps}/10
                </strong>
              </>
            ) : (
              "Sin evaluaciones QR aún"
            )}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Tendencia Principal
            </span>
            <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <p
            className="text-sm font-black text-slate-900 dark:text-white mt-2 truncate"
            title={
              formAnalytics.questions[0]?.options[0]?.label ||
              formAnalytics.experienceDist[0]?.label ||
              "Sin datos"
            }
          >
            {formAnalytics.questions[0]?.options[0]?.label ||
              formAnalytics.experienceDist[0]?.label ||
              formAnalytics.paymentDist[0]?.label ||
              "Sin respuestas aún"}
          </p>
          <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 truncate">
            {formAnalytics.questions[0]
              ? `${formAnalytics.questions[0].options[0]?.percentage || 0}% en "${formAnalytics.questions[0].label}"`
              : "Perfil predominante del curso"}
          </p>
        </div>
      </div>

      {/* Selector de Sub-Vista: Respuestas del Formulario vs Encuesta Post-Curso */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
        <button
          type="button"
          onClick={() => setActiveSubTab("formulario")}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold border transition cursor-pointer flex items-center gap-2 ${
            activeSubTab === "formulario"
              ? "bg-[#2a285c] text-white border-[#2a285c] shadow-sm keep-white"
              : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Respuestas del Formulario de Inscripción ({formAnalytics.questions.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab("encuesta")}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold border transition cursor-pointer flex items-center gap-2 ${
            activeSubTab === "encuesta"
              ? "bg-[#2a285c] text-white border-[#2a285c] shadow-sm keep-white"
              : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
          }`}
        >
          <Star className="w-4 h-4" />
          <span>Encuesta de Satisfacción Post-Curso ({postSurveyAnalytics.total})</span>
        </button>
      </div>

      {activeSubTab === "formulario" ? (
        formAnalytics.total === 0 ? (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-10 text-center">
            <Filter className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
              Esta capacitación todavía no tiene inscripciones activas para analizar.
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Selecciona otra capacitación en el selector superior para ver su resumen analítico.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Grid Widescreen de Preguntas Dinámicas del Formulario */}
            {formAnalytics.questions.length > 0 ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#f4730a]" />
                    <span>Resumen Agregado por Pregunta del Formulario</span>
                  </h2>
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                    Consolidado de {formAnalytics.total} participantes
                  </span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {formAnalytics.questions.map((q) => (
                    <div
                      key={q.id}
                      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col justify-between space-y-4"
                    >
                      <div className="flex items-start justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                        <h3 className="text-sm font-extrabold text-slate-900 dark:text-white leading-snug">
                          {q.label}
                        </h3>
                        <span className="text-[11px] font-mono font-bold px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 whitespace-nowrap flex-shrink-0">
                          {q.totalAnswered} resp. ({q.responseRate}%)
                        </span>
                      </div>

                      {!q.isOpenText ? (
                        renderBarList(q.options, "bg-gradient-to-r from-[#f4730a] to-amber-500", 8)
                      ) : (
                        <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                          {q.openResponses.map((resp) => (
                            <div
                              key={`${q.id}-${resp.regId}`}
                              className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs flex items-start justify-between gap-2"
                            >
                              <div className="min-w-0">
                                <p className="font-semibold text-slate-800 dark:text-slate-100 leading-snug">
                                  “{resp.value}”
                                </p>
                                <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 block mt-0.5">
                                  {resp.participantName} · {resp.company}
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={() => onInspectRegistration(resp.reg)}
                                className="p-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-[#f4730a] hover:border-[#f4730a] transition cursor-pointer flex-shrink-0"
                                title="Abrir ficha individual"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-300 dark:border-amber-500/30 rounded-2xl p-4 text-xs text-amber-900 dark:text-amber-200 font-medium">
                Los inscritos de esta capacitación completaron el formulario base sin preguntas personalizadas adicionales. A continuación se muestra el resumen consolidado de su perfil y método de pago.
              </div>
            )}

            {/* Grid Widescreen de Perfil del Participante & Pagos */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Distribución por Método de Pago</span>
                </h3>
                {renderBarList(formAnalytics.paymentDist, "bg-emerald-500", 6)}
              </div>

              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-sky-600 dark:text-cyan-400" />
                  <span>Cargo / Nivel Técnico</span>
                </h3>
                {renderBarList(
                  formAnalytics.experienceDist.length > 0
                    ? formAnalytics.experienceDist
                    : formAnalytics.cargoDist,
                  "bg-sky-600",
                  6
                )}
              </div>

              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-[#2a285c] dark:text-indigo-400" />
                  <span>Origen / Ciudad</span>
                </h3>
                {renderBarList(
                  formAnalytics.referralDist.length > 0
                    ? formAnalytics.referralDist
                    : formAnalytics.cityDist,
                  "bg-[#2a285c] dark:bg-indigo-500",
                  6
                )}
              </div>
            </div>

            {/* Notas Especiales / Expectativas Consolidadas */}
            {formAnalytics.specialNotesList.length > 0 && (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-[#f4730a]" />
                  <span>
                    Expectativas y Notas Especiales de los Participantes (
                    {formAnalytics.specialNotesList.length})
                  </span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-64 overflow-y-auto pr-1">
                  {formAnalytics.specialNotesList.map((item) => (
                    <div
                      key={item.regId}
                      className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs flex items-start justify-between gap-2"
                    >
                      <div className="min-w-0">
                        <p className="text-slate-800 dark:text-slate-100 font-medium leading-relaxed">
                          “{item.note}”
                        </p>
                        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block mt-1">
                          {item.participantName} · {item.company}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => onInspectRegistration(item.reg)}
                        className="p-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-[#f4730a] transition cursor-pointer flex-shrink-0"
                        title="Ver ficha"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )
      ) : loadingSurveys ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-10 text-center text-xs text-slate-600 dark:text-slate-400">
          <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-[#f4730a]" />
          Cargando resultados de la encuesta post-curso...
        </div>
      ) : postSurveyAnalytics.total === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-10 text-center">
          <Star className="w-8 h-8 text-amber-400 mx-auto mb-2" />
          <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
            Aún no hay evaluaciones post-curso (QR) registradas para esta capacitación.
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Cuando los asistentes escaneen el código QR al finalizar la sesión, aquí verás los promedios de satisfacción, NPS y sugerencias agrupadas.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {/* Calificaciones Promedio y NPS */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {[
              { label: "Instructor", val: surveySummary?.avgInstructor ?? 5, max: 5, color: "bg-amber-500" },
              { label: "Contenido Técnico", val: surveySummary?.avgContent ?? 5, max: 5, color: "bg-sky-600" },
              { label: "Instalaciones Sala VIP", val: surveySummary?.avgFacilities ?? 5, max: 5, color: "bg-emerald-500" },
              { label: "Recomendación (NPS)", val: surveySummary?.avgNps ?? 10, max: 10, color: "bg-[#f4730a]" },
            ].map((m) => (
              <div
                key={m.label}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm space-y-2"
              >
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  {m.label}
                </span>
                <p className="text-2xl font-black text-slate-900 dark:text-white">
                  {m.val} <span className="text-sm font-bold text-slate-400">/ {m.max}</span>
                </p>
                <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${m.color}`}
                    style={{ width: `${Math.min(100, (Number(m.val) / m.max) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <Award className="w-4 h-4 text-[#f4730a]" />
                <span>Certificaciones Futuras Solicitadas</span>
              </h3>
              {renderBarList(postSurveyAnalytics.futureCerts, "bg-[#f4730a]", 8)}
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Proyectos Activos / Intención Comercial</span>
              </h3>
              {renderBarList(postSurveyAnalytics.activeProjects, "bg-emerald-500", 6)}
            </div>
          </div>

          {postSurveyAnalytics.comments.length > 0 && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-sky-600 dark:text-cyan-400" />
                <span>Comentarios y Sugerencias de los Asistentes ({postSurveyAnalytics.comments.length})</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-72 overflow-y-auto pr-1">
                {postSurveyAnalytics.comments.map((c, i) => (
                  <div
                    key={i}
                    className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-slate-900 dark:text-white">
                        {c.name}{" "}
                        <span className="font-normal text-slate-500 dark:text-slate-400">
                          · {c.company}
                        </span>
                      </span>
                      <span className="font-mono font-bold text-amber-700 dark:text-amber-300">
                        ★ {c.rating}/5
                      </span>
                    </div>
                    {c.mostLiked && (
                      <p className="text-slate-700 dark:text-slate-200">
                        <strong className="text-emerald-700 dark:text-emerald-400">Lo mejor:</strong>{" "}
                        {c.mostLiked}
                      </p>
                    )}
                    {c.suggestions && (
                      <p className="text-slate-700 dark:text-slate-200">
                        <strong className="text-sky-700 dark:text-cyan-300">Sugerencia:</strong>{" "}
                        {c.suggestions}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
