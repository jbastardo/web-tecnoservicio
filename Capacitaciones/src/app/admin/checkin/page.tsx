"use client";

import React, { useState, useEffect } from "react";
import {
  UserCheck,
  Users,
  CheckCircle2,
  Clock,
  QrCode,
  ShieldCheck,
  Maximize2,
  Minimize2,
  Sparkles,
} from "lucide-react";
import { fmtLocalTime, fmtLocalDate } from "@/utils/formatUtils";
import { initialTrainings, initialRegistrations } from "@/lib/mockData";

export default function CheckinAdminPage() {
  const sortedInitial = [...initialTrainings].sort(
    (a, b) => new Date(b.eventDate || 0).getTime() - new Date(a.eventDate || 0).getTime()
  );
  const [trainings, setTrainings] = useState<any[]>(sortedInitial);
  const [selectedTrainingId, setSelectedTrainingId] = useState<number>(sortedInitial[0]?.id || 1);
  const [registrations, setRegistrations] = useState<any[]>(initialRegistrations);
  const [kioskMode, setKioskMode] = useState(false);

  const fetchRegistrations = async () => {
    try {
      const res = await fetch("/api/inscripciones");
      const data = await res.json();
      if (data.success && data.data?.length > 0) {
        setRegistrations(data.data);
      }
    } catch (err) {
      console.error("Error cargando inscripciones:", err);
    }
  };

  useEffect(() => {
    fetch("/api/capacitaciones")
      .then((r) => r.json())
      .then((d) => {
        if (d.success && d.data?.length > 0) {
          setTrainings(d.data);
          if (!selectedTrainingId) {
            setSelectedTrainingId(d.data[0].id);
          }
        }
      })
      .catch((e) => console.error("Error cargando capacitaciones:", e));

    fetchRegistrations();
  }, []);

  const currentTraining = trainings.find((t) => t.id === selectedTrainingId) || trainings[0];
  const trainingRegs = registrations.filter((r) => r.trainingId === selectedTrainingId);

  const attendedCount = trainingRegs.filter((r) => r.status === "Asistió").length;
  const confirmedCount = trainingRegs.filter((r) => r.status === "Confirmado").length;
  const maxCapacity = 18;

  const handleCheckIn = async (regId: number) => {
    const reg = registrations.find((r) => r.id === regId);
    if (!reg) return;

    const nextStatus = reg.status === "Asistió" ? "Confirmado" : "Asistió";
    const nextCheckInAt = nextStatus === "Asistió" ? new Date().toISOString() : null;

    // Actualización optimista inmediata en la UI
    setRegistrations((prev) =>
      prev.map((r) =>
        r.id === regId
          ? {
              ...r,
              status: nextStatus,
              checkInAt: nextCheckInAt,
            }
          : r
      )
    );

    // Persistir estado en el servidor
    try {
      await fetch("/api/inscripciones", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: regId,
          status: nextStatus,
          checkInAt: nextCheckInAt,
        }),
      });
    } catch (err) {
      console.error("Error persistiendo check-in:", err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Cintillo Widescreen de Cabecera */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <UserCheck className="w-6 h-6 text-brand-400" />
            <span>Módulo de Check-in en Tiempo Real (Día del Evento)</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Recepción en sala, conteo de aforo (1 a 18 cupos) y proyección de QR de encuesta.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedTrainingId}
            onChange={(e) => setSelectedTrainingId(parseInt(e.target.value))}
            className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500 font-semibold max-w-sm truncate"
          >
            {trainings.map((t) => (
              <option key={t.id} value={t.id}>
                [{fmtLocalDate(t.eventDate)}] {t.code} - {t.name}
              </option>
            ))}
          </select>

          <button
            onClick={() => setKioskMode(!kioskMode)}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-bold text-cyan-300 rounded-xl transition"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span>{kioskMode ? "Salir de Pantalla Completa" : "Modo Proyector / QR"}</span>
          </button>
        </div>
      </div>

      {/* Indicador de Aforo en Sala (18 Puestos) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-brand-500/10 border border-brand-500/30 flex items-center justify-center text-brand-400">
              <Users className="w-8 h-8" />
            </div>
            <div>
              <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold block">
                Ocupación Actual de la Sala
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-4xl font-black text-white">{attendedCount}</span>
                <span className="text-lg text-slate-500 font-bold">/ 18 Asistentes Presentes</span>
                <span className="text-xs text-slate-400">(+1 Instructor en Tarima)</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 text-center">
            <div className="bg-slate-950 px-4 py-2.5 rounded-xl border border-slate-800">
              <span className="text-[11px] text-slate-400 block">Confirmados en Espera</span>
              <span className="text-xl font-bold text-cyan-400">{confirmedCount}</span>
            </div>
            <div className="bg-slate-950 px-4 py-2.5 rounded-xl border border-slate-800">
              <span className="text-[11px] text-slate-400 block">Asientos Disponibles</span>
              <span className="text-xl font-bold text-emerald-400">
                {Math.max(0, maxCapacity - attendedCount)}
              </span>
            </div>
          </div>
        </div>

        {/* Visualización de los 18 Puestos Físicos de la Sala Onprotec */}
        <div className="mt-6 pt-5 border-t border-slate-800">
          <span className="text-xs text-slate-400 font-semibold mb-3 block">
            Distribución Física de la Sala (18 Puestos):
          </span>
          <div className="grid grid-cols-6 sm:grid-cols-9 md:grid-cols-18 gap-2">
            {Array.from({ length: 18 }).map((_, index) => {
              const seatNumber = index + 1;
              const isOccupied = seatNumber <= attendedCount;
              return (
                <div
                  key={seatNumber}
                  className={`h-12 rounded-xl flex flex-col items-center justify-center border font-mono text-xs transition duration-200 ${
                    isOccupied
                      ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-300 font-bold shadow-sm shadow-emerald-500/20"
                      : "bg-slate-950 border-slate-800 text-slate-600"
                  }`}
                >
                  <span className="text-[10px] text-slate-500">Puesto</span>
                  <span>{seatNumber}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Modo Kiosk / Proyector para Encuesta */}
      {kioskMode && (
        <div className="bg-gradient-to-tr from-slate-900 via-brand-950/40 to-slate-900 border-2 border-brand-500/60 rounded-3xl p-8 text-center shadow-2xl relative">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/20 text-brand-300 border border-brand-500/40 text-xs font-semibold mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Proyección para Asistentes en Sala Onprotec</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
            Escanea para Calificar la Capacitación y Recibir tu Certificado
          </h2>
          <p className="text-slate-400 text-sm max-w-xl mx-auto mt-2">
            Apunta con la cámara de tu celular al código QR para completar la encuesta de satisfacción
            de 1 minuto.
          </p>

          <div className="mt-6 p-5 bg-white rounded-3xl inline-block shadow-2xl">
            {currentTraining?.surveyQrCode ? (
              <img
                src={currentTraining.surveyQrCode}
                alt="QR Encuesta"
                className="w-64 h-64 mx-auto"
              />
            ) : (
              <div className="w-64 h-64 bg-slate-100 flex items-center justify-center text-slate-800 text-xs font-mono">
                QR Code Activo
              </div>
            )}
          </div>

          <p className="mt-4 text-xs font-mono text-cyan-300">
            {currentTraining?.surveyUrl || "https://capacitacion.tutecnoservicio.com/encuesta/1"}
          </p>
        </div>
      )}

      {/* Lista de Participantes para Check-in */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-slate-800 flex justify-between items-center">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
            <span>Lista de Asistencia del Evento</span>
          </h3>
          <span className="text-xs text-slate-400">
            Haz clic en "Registrar Ingreso" para marcar la entrada a la sala
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Participante</th>
                <th className="py-3 px-4">Cédula / WhatsApp</th>
                <th className="py-3 px-4">Pago</th>
                <th className="py-3 px-4">Hora de Check-in</th>
                <th className="py-3 px-4">Estado</th>
                <th className="py-3 px-4 text-right">Acción Entrada</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {trainingRegs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    No hay participantes registrados en este evento.
                  </td>
                </tr>
              ) : (
                trainingRegs.map((r) => {
                  const isPresent = r.status === "Asistió";
                  return (
                    <tr
                      key={r.id}
                      className={`transition ${isPresent ? "bg-emerald-950/20" : "hover:bg-slate-800/40"}`}
                    >
                      <td className="py-3 px-4 font-bold text-white">
                        {r.participant?.name || "Participante"}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-400">
                        {r.participant?.docType}-{r.participant?.docNumber} | {r.participant?.phone}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            r.isPaid
                              ? "bg-emerald-500/20 text-emerald-300"
                              : "bg-amber-500/20 text-amber-300"
                          }`}
                        >
                          {r.isPaid ? "Pagado" : "Pendiente"}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-400">
                        {r.checkInAt ? fmtLocalTime(r.checkInAt) : "Aún no ingresa"}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            isPresent
                              ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                              : "bg-slate-800 text-slate-400"
                          }`}
                        >
                          {r.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleCheckIn(r.id)}
                          className={`px-3 py-1.5 rounded-xl font-bold text-xs transition ${
                            isPresent
                              ? "bg-slate-800 hover:bg-slate-700 text-slate-300"
                              : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-500/20"
                          }`}
                        >
                          {isPresent ? "Cancelar Ingreso" : "Registrar Ingreso (Check-in)"}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
