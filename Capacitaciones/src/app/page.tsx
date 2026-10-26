"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  GraduationCap,
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
} from "lucide-react";
import { Training } from "@/types";
import { fmtLocalDate, fmtLocalHour, formatCurrency } from "@/utils/formatUtils";

export default function HomePage() {
  const [trainings, setTrainings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTraining, setSelectedTraining] = useState<any | null>(null);

  // Formulario
  const [form, setForm] = useState({
    name: "",
    docType: "V",
    docNumber: "",
    phone: "",
    email: "",
    company: "",
    paymentMethod: "Pabilo",
    paymentReference: "",
    specialNotes: "",
  });

  const [submitting, setSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<any | null>(null);

  useEffect(() => {
    fetch("/api/capacitaciones")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setTrainings(data.data);
          if (data.data.length > 0) {
            setSelectedTraining(data.data[0]);
          }
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

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
        }),
      });

      const data = await res.json();
      setSubmissionResult(data);
      if (data.success) {
        // Refrescar cursos para ver aforo actualizado
        const refreshed = await fetch("/api/capacitaciones").then((r) => r.json());
        if (refreshed.success) setTrainings(refreshed.data);
      }
    } catch (err: any) {
      setSubmissionResult({ success: false, error: err.message || "Error al registrar" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Barra de Navegación Superior */}
      <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-cyan-400 flex items-center justify-center font-bold text-white shadow-lg shadow-brand-500/20">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <span className="font-bold text-lg text-white tracking-tight">ONPROTEC</span>
              <span className="text-xs text-brand-400 block font-medium">
                Sala de Capacitaciones Especializada
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 bg-slate-800/80 px-3 py-1.5 rounded-full border border-slate-700 text-xs">
              <Users className="w-3.5 h-3.5 text-cyan-400" />
              <span>Aforo Sala: <strong className="text-white">18 Participantes</strong> + 1 Instructor</span>
            </div>
            <Link
              href="/admin"
              className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 px-3.5 py-2 rounded-lg border border-slate-700 transition flex items-center gap-1.5"
            >
              <span>Acceso Administrativo</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-16 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950 border-b border-slate-800/80">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(42,146,247,0.12),transparent_50%)]" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/30 text-brand-300 text-xs font-medium mb-4">
              <Sparkles className="w-3.5 h-3.5" />
              Formación Técnica y Práctica en Seguridad Electrónica & Telecomunicaciones
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight">
              Aprende con Expertos en la Sala de Capacitaciones{" "}
              <span className="bg-gradient-to-r from-brand-400 to-cyan-300 bg-clip-text text-transparent">
                Onprotec
              </span>
            </h1>
            <p className="mt-4 text-slate-400 text-base sm:text-lg">
              Cupos limitados a solo 18 puestos por evento para garantizar laboratorios prácticos
              reales con equipos de última generación importados y certificados.
            </p>
          </div>
        </div>
      </section>

      {/* Contenido Principal: Widescreen Horizontal Layout */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-1 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Columna Izquierda: Cursos Disponibles y Aforo (7 columnas) */}
          <div className="lg:col-span-7 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Calendar className="w-5 h-5 text-brand-400" />
                <span>Próximas Capacitaciones</span>
              </h2>
              <span className="text-xs text-slate-400">
                Selecciona un evento para registrarte
              </span>
            </div>

            {loading ? (
              <div className="p-12 text-center text-slate-400">Cargando eventos...</div>
            ) : (
              <div className="space-y-4">
                {trainings.map((training) => {
                  const isSelected = selectedTraining?.id === training.id;
                  const stats = training.stats || {
                    totalOccupied: 16,
                    availableSeats: 2,
                    isFull: false,
                  };

                  return (
                    <div
                      key={training.id}
                      onClick={() => setSelectedTraining(training)}
                      className={`cursor-pointer rounded-2xl border p-5 transition-all duration-200 relative overflow-hidden ${
                        isSelected
                          ? "bg-slate-900 border-brand-500 shadow-xl shadow-brand-500/10 ring-1 ring-brand-500"
                          : "bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900/90"
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap mb-2">
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-brand-500/20 text-brand-300 border border-brand-500/30">
                              {training.type}
                            </span>
                            <span className="text-xs text-slate-400 font-mono">
                              {training.code}
                            </span>
                            {stats.isFull ? (
                              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3" />
                                18/18 Cupos Llenos (Lista de Espera)
                              </span>
                            ) : (
                              <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                                {stats.availableSeats} cupos disponibles de 18
                              </span>
                            )}
                          </div>

                          <h3 className="text-lg font-bold text-white leading-snug">
                            {training.name}
                          </h3>

                          <p className="text-sm text-slate-400 mt-2 line-clamp-2">
                            {training.description}
                          </p>

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
                              <MapPin className="w-4 h-4 text-cyan-400" />
                              <span>Sede Onprotec</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <ShieldCheck className="w-4 h-4 text-cyan-400" />
                              <span>{training.instructor}</span>
                            </div>
                          </div>

                          {/* Barra de Ocupación de la Sala (Aforo 18) */}
                          <div className="mt-4 pt-3 border-t border-slate-800">
                            <div className="flex justify-between items-center text-xs mb-1.5">
                              <span className="text-slate-400">Ocupación de la Sala:</span>
                              <span className="font-semibold text-slate-200">
                                {stats.totalOccupied} / 18 personas
                              </span>
                            </div>
                            <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-500 ${
                                  stats.isFull
                                    ? "bg-amber-500"
                                    : stats.totalOccupied >= 15
                                    ? "bg-gradient-to-r from-brand-500 to-amber-500"
                                    : "bg-gradient-to-r from-cyan-400 to-brand-500"
                                }`}
                                style={{
                                  width: `${Math.min(100, (stats.totalOccupied / 18) * 100)}%`,
                                }}
                              />
                            </div>
                          </div>

                          {/* SKUs de Odoo vinculados */}
                          {training.relatedSkus && training.relatedSkus.length > 0 && (
                            <div className="mt-3 flex items-center gap-2 flex-wrap">
                              <span className="text-xs text-slate-500 flex items-center gap-1">
                                <Layers className="w-3 h-3" /> Hardware Odoo:
                              </span>
                              {training.relatedSkus.map((sku: string) => (
                                <span
                                  key={sku}
                                  className="text-[11px] bg-slate-800 px-2 py-0.5 rounded text-cyan-300 font-mono border border-slate-700"
                                >
                                  {sku}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Precio */}
                        <div className="text-right sm:min-w-[100px]">
                          <span className="text-xs text-slate-400 block">Inversión</span>
                          <span className="text-2xl font-black text-white">
                            {formatCurrency(training.price, training.currency)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Columna Derecha: Formulario de Registro e Integración de Pago (5 columnas) */}
          <div className="lg:col-span-5 sticky top-24">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
              <div className="border-b border-slate-800 pb-4 mb-5">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-brand-400" />
                  <span>Formulario de Inscripción</span>
                </h3>
                {selectedTraining && (
                  <p className="text-xs text-slate-400 mt-1">
                    Inscripción para:{" "}
                    <strong className="text-brand-300">{selectedTraining.name}</strong>
                  </p>
                )}
              </div>

              {selectedTraining?.stats?.isFull && (
                <div className="mb-5 bg-amber-500/10 border border-amber-500/30 rounded-xl p-3.5 text-xs text-amber-200 flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <strong className="font-semibold block text-amber-300">
                      Aforo de la sala completo (18 participantes)
                    </strong>
                    Al completar este formulario entrarás directamente en nuestra{" "}
                    <strong>Lista de Espera prioritaria</strong>. Si se libera una plaza te
                    notificaremos automáticamente por WhatsApp.
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
                      {submissionResult.success ? "¡Registro Exitoso!" : "Atención"}
                    </strong>
                    {submissionResult.message || submissionResult.error}
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4 text-sm">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Nombre Completo *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Juan Bastardo"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 text-sm"
                  />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-1">
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Tipo Doc *
                    </label>
                    <select
                      value={form.docType}
                      onChange={(e) => setForm({ ...form, docType: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-2 text-white focus:outline-none focus:border-brand-500 text-sm"
                    >
                      <option value="V">V - Venezolano</option>
                      <option value="E">E - Extranjero</option>
                      <option value="J">J - Jurídico</option>
                      <option value="G">G - Gobierno</option>
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Cédula / RIF *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ej. 18456123"
                      value={form.docNumber}
                      onChange={(e) => setForm({ ...form, docNumber: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      WhatsApp (Celular) *
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="+584121234567"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Correo Electrónico *
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="usuario@empresa.com"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Empresa / Razón Social (Opcional)
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. Tecnoservicio C.A."
                    value={form.company}
                    onChange={(e) => setForm({ ...form, company: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 text-sm"
                  />
                </div>

                {/* Métodos de Pago */}
                <div className="pt-2 border-t border-slate-800">
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Método de Pago
                  </label>
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, paymentMethod: "Pabilo" })}
                      className={`p-2.5 rounded-lg border text-xs text-left transition ${
                        form.paymentMethod === "Pabilo"
                          ? "bg-brand-500/20 border-brand-500 text-white font-semibold"
                          : "bg-slate-950 border-slate-700 text-slate-400 hover:border-slate-600"
                      }`}
                    >
                      <strong className="block text-brand-300">Pabilo Pay</strong>
                      <span>Pago Móvil / Tarjeta</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, paymentMethod: "Transferencia" })}
                      className={`p-2.5 rounded-lg border text-xs text-left transition ${
                        form.paymentMethod === "Transferencia"
                          ? "bg-brand-500/20 border-brand-500 text-white font-semibold"
                          : "bg-slate-950 border-slate-700 text-slate-400 hover:border-slate-600"
                      }`}
                    >
                      <strong className="block text-slate-200">Transferencia</strong>
                      <span>Conciliación Manual</span>
                    </button>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Referencia de Pago / ID Pabilo (Si ya pagaste)
                    </label>
                    <input
                      type="text"
                      placeholder="Ej. PAB-884920 o 019283"
                      value={form.paymentReference}
                      onChange={(e) => setForm({ ...form, paymentReference: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 text-sm font-mono"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting || !selectedTraining}
                  className="w-full mt-3 bg-gradient-to-r from-brand-600 to-cyan-500 hover:from-brand-500 hover:to-cyan-400 text-white font-bold py-3 px-4 rounded-xl shadow-lg shadow-brand-500/25 transition duration-150 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {submitting ? (
                    "Procesando..."
                  ) : selectedTraining?.stats?.isFull ? (
                    <>
                      <span>Unirme a la Lista de Espera</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  ) : (
                    <>
                      <span>Completar Inscripción</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-slate-950 border-t border-slate-800/80 py-8 text-xs text-slate-500 text-center">
        <div className="max-w-7xl mx-auto px-4">
          <p>© 2026 Onprotec C.A. Todos los derechos reservados.</p>
          <p className="mt-1">
            Sistema Integral de Control de Aforo y Gestión de Capacitaciones. Diseñado para
            Coolify + Cloudflare Tunnel.
          </p>
        </div>
      </footer>
    </div>
  );
}
