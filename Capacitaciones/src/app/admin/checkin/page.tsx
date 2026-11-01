"use client";

import React, { useState, useEffect } from "react";
import {
  UserCheck,
  Users,
  CheckCircle2,
  Clock,
  Printer,
  Download,
  Search,
  Maximize2,
  Sparkles,
  Phone,
  Send,
  Building,
  Check,
  X,
  CreditCard,
  AlertCircle,
  ShieldCheck,
  FileSpreadsheet,
  Edit2,
} from "lucide-react";
import { fmtLocalTime, fmtLocalDate, formatCurrency } from "@/utils/formatUtils";
import { OnprotecBrand } from "@/components/OnprotecBrand";

export default function CheckinAdminPage() {
  const [trainings, setTrainings] = useState<any[]>([]);
  const [selectedTrainingId, setSelectedTrainingId] = useState<number | null>(null);
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterAttendance, setFilterAttendance] = useState<"all" | "pending" | "attended">("all");
  const [kioskMode, setKioskMode] = useState(false);
  const [printModalOpen, setPrintModalOpen] = useState(false);
  const [responsableMesa, setResponsableMesa] = useState("Diana Barrero");
  const [coordinadorEvento, setCoordinadorEvento] = useState("Coordinación OnProtec C.A.");
  const [toastMessage, setToastMessage] = useState("");

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 3500);
  };

  const fetchRegistrations = async () => {
    try {
      const res = await fetch("/api/inscripciones");
      const data = await res.json();
      if (data.success && data.data?.length > 0) {
        setRegistrations(data.data);
      }
    } catch (err) {
      console.error("Error cargando inscripciones:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetch("/api/capacitaciones?order=desc")
      .then((r) => r.json())
      .then((d) => {
        if (d.success && d.data?.length > 0) {
          setTrainings(d.data);
          // Priorizar el evento planificado o el más reciente
          const planned =
            d.data.find(
              (t: any) => t.status === "Planificado" || t.status === "En Publicidad"
            ) || d.data[0];
          setSelectedTrainingId(planned.id);
        }
      })
      .catch((e) => console.error("Error cargando capacitaciones:", e));

    fetchRegistrations();
  }, []);

  const currentTraining =
    trainings.find((t) => Number(t.id) === Number(selectedTrainingId)) || trainings[0];

  // Inscripciones del evento seleccionado
  const eventRegistrations = registrations
    .filter((r) => Number(r.trainingId) === Number(selectedTrainingId))
    .sort((a, b) => {
      // Ordenar por estatus: Asistió primero, luego Confirmado, luego Inscrito
      const order: Record<string, number> = {
        Asistió: 1,
        Confirmado: 2,
        Inscrito: 3,
        "Lista de Espera": 4,
        "No Asistió": 5,
      };
      return (order[a.status] || 9) - (order[b.status] || 9);
    });

  const maxCapacity = Number(currentTraining?.maxCapacity || 18);
  const attendedCount = eventRegistrations.filter((r) => r.status === "Asistió").length;
  const confirmedCount = eventRegistrations.filter(
    (r) => r.status === "Confirmado" || r.status === "Inscrito" || r.status === "Asistió"
  ).length;
  const pendingCount = Math.max(0, confirmedCount - attendedCount);
  const attendanceRate =
    confirmedCount > 0 ? Math.round((attendedCount / confirmedCount) * 100) : 0;

  // Filtrado en pantalla
  const filteredRegs = eventRegistrations.filter((r) => {
    const p = r.participant || {};
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      (p.name || "").toLowerCase().includes(q) ||
      (p.docNumber || "").toLowerCase().includes(q) ||
      (p.company || "").toLowerCase().includes(q) ||
      (p.phone || "").includes(q) ||
      (r.carnetNumber || "").toLowerCase().includes(q);

    if (!matchesSearch) return false;

    if (filterAttendance === "attended") return r.status === "Asistió";
    if (filterAttendance === "pending") return r.status !== "Asistió";
    return true;
  });

  // Check-in rápido de 1 solo clic (conmutar asistencia)
  const handleToggleAttendance = async (regId: number) => {
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

    showToast(
      nextStatus === "Asistió"
        ? `✓ Asistencia registrada: ${reg.participant?.name || "Participante"}`
        : `Asistencia desmarcada para: ${reg.participant?.name || "Participante"}`
    );

    // Persistir en servidor
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

  // Guardar número de carnet físico
  const handleSaveCarnet = async (regId: number, carnetNumber: string) => {
    const trimmed = carnetNumber.trim();
    setRegistrations((prev) =>
      prev.map((r) => (r.id === regId ? { ...r, carnetNumber: trimmed } : r))
    );
    try {
      await fetch("/api/inscripciones", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: regId,
          carnetNumber: trimmed,
        }),
      });
      showToast(`Nº de Carnet asignado: ${trimmed || "Sin carnet"}`);
    } catch (err) {
      console.error("Error guardando carnet:", err);
    }
  };

  // Exportar lista a CSV / Excel
  const exportToCSV = () => {
    if (!currentTraining || eventRegistrations.length === 0) return;

    const headers = [
      "Nº",
      "Nombre y Apellido",
      "Cédula",
      "Teléfono / WhatsApp",
      "Empresa / Proyecto",
      "Cargo",
      "Nº Carnet Físico",
      "Estatus",
      "Hora Check-in (Caracas)",
      "Pago Validado",
      "Monto",
      "Factura / Ref",
    ];

    const rows = eventRegistrations.map((r, idx) => {
      const p = r.participant || {};
      return [
        idx + 1,
        `"${(p.name || "").replace(/"/g, '""')}"`,
        `"${p.docType || "V"}-${p.docNumber || ""}"`,
        `"${p.phone || ""}"`,
        `"${(p.company || "Independiente").replace(/"/g, '""')}"`,
        `"${(p.cargo || "").replace(/"/g, '""')}"`,
        `"${r.carnetNumber || ""}"`,
        `"${r.status || ""}"`,
        `"${r.checkInAt ? fmtLocalTime(r.checkInAt) : "No ingresó"}"`,
        `"${r.isPaid ? "Sí" : "No"}"`,
        `"${r.amount || 0}"`,
        `"${r.invoiceNumber || r.paymentReference || ""}"`,
      ];
    });

    const csvContent =
      "data:text/csv;charset=utf-8,\uFEFF" +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `Lista_Asistencia_${currentTraining.code || "OnProtec"}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Toast de Notificación Rápida */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-emerald-950 border border-emerald-600 text-emerald-200 text-xs px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* =====================================================================
          1. CABECERA CORPORATIVA Y ACCIONES DE LISTA DE ASISTENCIA
      ===================================================================== */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#f4730a]/15 border border-[#f4730a]/40 text-[#f4730a] text-xs font-bold mb-1">
            <UserCheck className="w-3.5 h-3.5" />
            <span>Control de Asistencia Presencial & Registro en Mesa</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <span>Lista de Asistencia & Check-in en Tiempo Real</span>
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 font-medium">
            Toma de asistencia para el día del evento, asignación de carnet físico y generador de formato impreso oficial.
          </p>
        </div>

        {/* Acciones Superiores */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Selector de Capacitación */}
          <select
            value={selectedTrainingId || ""}
            onChange={(e) => setSelectedTrainingId(Number(e.target.value))}
            className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-[#f4730a] font-bold max-w-xs truncate shadow-sm"
          >
            {trainings.map((t) => (
              <option key={t.id} value={t.id}>
                [{fmtLocalDate(t.eventDate || t.startDate)}] {t.code} - {t.name || t.title}
              </option>
            ))}
          </select>

          {/* Botón Imprimir / Generar Lista de Asistencia Física */}
          <button
            type="button"
            onClick={() => setPrintModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#f4730a] hover:bg-[#ef7922] text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-md shadow-[#f4730a]/20 transition cursor-pointer"
            title="Generar la hoja física de lista de asistencia para imprimir o guardar como PDF"
          >
            <Printer className="w-4 h-4" />
            <span>Generar Lista de Asistencia (PDF / Imprimir)</span>
          </button>

          {/* Exportar CSV */}
          <button
            type="button"
            onClick={exportToCSV}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-bold text-slate-300 rounded-xl transition cursor-pointer"
            title="Descargar lista de asistencia en formato Excel / CSV"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            <span>CSV</span>
          </button>

          {/* Modo Proyector QR */}
          <button
            type="button"
            onClick={() => setKioskMode(!kioskMode)}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-bold text-cyan-300 rounded-xl transition cursor-pointer"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span>{kioskMode ? "Ocultar QR" : "Proyector QR"}</span>
          </button>
        </div>
      </div>

      {/* =====================================================================
          2. RESUMEN DE AFORO EN SALA (18 PUESTOS) & KPIS DE ASISTENCIA
      ===================================================================== */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Asistentes Presentes */}
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                Asistieron (Presentes en Sala)
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl font-black text-emerald-400">{attendedCount}</span>
                <span className="text-xs text-slate-500 font-bold">/ {maxCapacity} cupos VIP</span>
              </div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </div>

          {/* Card 2: Pendientes por Llegar */}
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                Pendientes por Llegar
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl font-black text-amber-400">{pendingCount}</span>
                <span className="text-xs text-slate-500 font-bold">de {confirmedCount} confirmados</span>
              </div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Clock className="w-6 h-6" />
            </div>
          </div>

          {/* Card 3: Asientos Libres en Sala */}
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                Asientos Físicos Libres
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl font-black text-cyan-400">
                  {Math.max(0, maxCapacity - attendedCount)}
                </span>
                <span className="text-xs text-slate-500 font-bold">sillas desocupadas</span>
              </div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Users className="w-6 h-6" />
            </div>
          </div>

          {/* Card 4: Tasa de Asistencia */}
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                Tasa de Asistencia Efectiva
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl font-black text-[#f4730a]">{attendanceRate}%</span>
                <span className="text-xs text-slate-500 font-bold">asistencia real</span>
              </div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-[#f4730a]/10 border border-[#f4730a]/30 flex items-center justify-center text-[#f4730a]">
              <Sparkles className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Visualización de los 18 Puestos Físicos */}
        <div className="mt-5 pt-4 border-t border-slate-800/80">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-xs text-slate-400 font-extrabold uppercase tracking-wider flex items-center gap-1.5">
              <span>Distribución en Sala OnProtec (18 Puestos + 1 Instructor en Tarima):</span>
            </span>
            <span className="text-[11px] font-mono text-emerald-400 font-bold">
              {attendedCount} puestos ocupados en este momento
            </span>
          </div>

          <div className="grid grid-cols-6 sm:grid-cols-9 lg:grid-cols-18 gap-2">
            {Array.from({ length: 18 }).map((_, index) => {
              const seatNumber = index + 1;
              const isOccupied = seatNumber <= attendedCount;
              return (
                <div
                  key={seatNumber}
                  className={`h-11 rounded-xl flex flex-col items-center justify-center border font-mono text-xs transition duration-200 ${
                    isOccupied
                      ? "bg-emerald-500/20 border-emerald-500/60 text-emerald-300 font-black shadow-sm shadow-emerald-500/20"
                      : "bg-slate-950 border-slate-800 text-slate-600 font-bold"
                  }`}
                >
                  <span className="text-[9px] text-slate-500 uppercase">Puesto</span>
                  <span>{seatNumber}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Modo Kiosk / Proyector para Encuesta */}
      {kioskMode && (
        <div className="bg-gradient-to-tr from-slate-900 via-indigo-950/40 to-slate-900 border-2 border-[#f4730a]/60 rounded-3xl p-8 text-center shadow-2xl relative">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#f4730a]/20 text-[#f4730a] border border-[#f4730a]/40 text-xs font-semibold mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Proyección para Asistentes en Sala OnProtec</span>
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
              <div className="w-64 h-64 bg-slate-100 flex items-center justify-center text-slate-800 text-xs font-mono font-bold">
                QR Activo Sala OnProtec
              </div>
            )}
          </div>

          <p className="mt-4 text-xs font-mono text-cyan-300">
            {currentTraining?.surveyUrl ||
              `https://capacitacion.tutecnoservicio.com/encuesta/${currentTraining?.id || 1}`}
          </p>
        </div>
      )}

      {/* =====================================================================
          3. TABLA INTERACTIVA DE TOMA DE ASISTENCIA ("DAR CHECK")
      ===================================================================== */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-sm">
        {/* Barra de Filtros y Búsqueda de Entrada */}
        <div className="p-5 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setFilterAttendance("all")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                filterAttendance === "all"
                  ? "bg-[#f4730a] text-white shadow-sm"
                  : "bg-slate-950 text-slate-400 hover:text-white border border-slate-800"
              }`}
            >
              Todos ({eventRegistrations.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterAttendance("pending")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                filterAttendance === "pending"
                  ? "bg-amber-600 text-white shadow-sm"
                  : "bg-slate-950 text-slate-400 hover:text-white border border-slate-800"
              }`}
            >
              Pendientes por Llegar ({pendingCount})
            </button>
            <button
              type="button"
              onClick={() => setFilterAttendance("attended")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                filterAttendance === "attended"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "bg-slate-950 text-slate-400 hover:text-white border border-slate-800"
              }`}
            >
              Presentes en Sala (✓ {attendedCount})
            </button>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Buscar por nombre, cédula o empresa..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#f4730a] w-64"
            />
          </div>
        </div>

        {/* Tabla Widescreen de Entrada */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800 font-extrabold">
              <tr>
                <th className="py-3.5 px-4 w-12 text-center">Nº</th>
                <th className="py-3.5 px-4">Participante / Contacto</th>
                <th className="py-3.5 px-4">Cédula de Identidad</th>
                <th className="py-3.5 px-4">Empresa / Proyecto</th>
                <th className="py-3.5 px-4">Nº de Carnet (Físico)</th>
                <th className="py-3.5 px-4">Hora de Ingreso</th>
                <th className="py-3.5 px-4 text-center">Toma de Asistencia (Check)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-500">
                    Cargando lista de participantes...
                  </td>
                </tr>
              ) : filteredRegs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-500">
                    No se encontraron participantes para este filtro.
                  </td>
                </tr>
              ) : (
                filteredRegs.map((r, idx) => {
                  const isPresent = r.status === "Asistió";
                  const p = r.participant || {};
                  const rowNum = String(idx + 1).padStart(2, "0");

                  return (
                    <tr
                      key={r.id}
                      className={`transition ${
                        isPresent
                          ? "bg-emerald-950/20 hover:bg-emerald-950/30"
                          : "hover:bg-slate-800/40"
                      }`}
                    >
                      {/* Nº de Fila */}
                      <td className="py-3.5 px-4 font-mono font-bold text-center text-slate-500">
                        {rowNum}
                      </td>

                      {/* Nombre & Contacto */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-slate-900 dark:text-white text-sm block">
                            {p.name || "Sin Nombre"}
                          </span>
                          {p.phone && (
                            <a
                              href={`https://wa.me/${p.phone.replace(/\D/g, "")}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-emerald-400 hover:text-emerald-300 p-1 rounded-md hover:bg-emerald-950 transition"
                              title="Enviar mensaje WhatsApp"
                            >
                              <Phone className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-mono">
                          {p.phone || "Sin teléfono"}
                        </span>
                      </td>

                      {/* Cédula */}
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900 dark:text-white text-xs">
                        {p.docType || "V"}-{p.docNumber || "S/D"}
                      </td>

                      {/* Empresa / Proyecto */}
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                          {p.company || "Independiente"}
                        </span>
                        {p.cargo && (
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 block">{p.cargo}</span>
                        )}
                      </td>

                      {/* Nº de Carnet (A Mano / Editable en Mesa) */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          <input
                            type="text"
                            defaultValue={r.carnetNumber || ""}
                            placeholder="Ej. 09"
                            onBlur={(e) => handleSaveCarnet(r.id, e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                handleSaveCarnet(r.id, (e.target as HTMLInputElement).value);
                              }
                            }}
                            className="w-20 bg-slate-100 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-900 dark:text-white font-mono font-bold text-center focus:border-[#f4730a] outline-none"
                            title="Escribe el número de carnet físico entregado en recepción"
                          />
                        </div>
                      </td>

                      {/* Hora de Ingreso */}
                      <td className="py-3.5 px-4 font-mono text-xs">
                        {r.checkInAt ? (
                          <span className="text-emerald-300 font-bold flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {fmtLocalTime(r.checkInAt)}
                          </span>
                        ) : (
                          <span className="text-slate-500 italic">No ha ingresado</span>
                        )}
                      </td>

                      {/* BOTÓN CHECK DE ASISTENCIA (1-TAP) */}
                      <td className="py-3.5 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleAttendance(r.id)}
                          className={`px-4 py-2 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 mx-auto cursor-pointer ${
                            isPresent
                              ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/30 ring-2 ring-emerald-400/50"
                              : "bg-slate-800 hover:bg-emerald-600 hover:text-white text-slate-300 border border-slate-700 hover:border-emerald-500"
                          }`}
                        >
                          {isPresent ? (
                            <>
                              <CheckCircle2 className="w-4 h-4 text-white" />
                              <span>✓ ASISTIÓ</span>
                            </>
                          ) : (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                              <span>Dar Check</span>
                            </>
                          )}
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

      {/* =====================================================================
          4. MODAL PRINT-READY: GENERADOR DE LISTA DE ASISTENCIA FÍSICA
          Idéntica a la hoja que fotografió Diana Barrero en recepción
      ===================================================================== */}
      {printModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
          <div className="bg-white text-black rounded-2xl w-full max-w-5xl p-6 sm:p-10 shadow-2xl relative my-8 print:p-0 print:m-0 print:shadow-none print:w-full">
            {/* Barra de Acciones del Modal (No se imprime) */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-6 border-b border-slate-300 print:hidden">
              <div>
                <span className="text-[11px] font-black uppercase text-[#f4730a] tracking-wider block">
                  VISTA PREVIA DE IMPRESIÓN OFICIAL
                </span>
                <h3 className="text-lg font-black text-slate-900">
                  Formato Oficial de Lista de Asistencia Presencial
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-2 bg-[#f4730a] hover:bg-[#ef7922] text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider shadow-md transition cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Imprimir Ahora (A4 / Carta)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPrintModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Cerrar
                </button>
              </div>
            </div>

            {/* HOJA IMPRESA OFICIAL (ESTILIZADA EXACTAMENTE COMO LA HOJA REAL) */}
            <div className="print-area font-sans text-black space-y-4">
              {/* Encabezado con Logo y Título */}
              <div className="flex items-start justify-between border-b-2 border-black pb-3">
                <div className="flex items-center gap-4">
                  <img
                    src="/brand/onprotec-logo-color.png"
                    alt="OnProtec"
                    className="h-10 w-auto object-contain"
                  />
                  <div>
                    <h2 className="text-base sm:text-lg font-black uppercase tracking-tight leading-tight">
                      {currentTraining?.title || currentTraining?.name || "WORKSHOP TÉCNICO"} —
                      LISTA DE ASISTENCIA PRESENCIAL
                    </h2>
                    <p className="text-[11px] font-bold text-slate-700">
                      Control de Entrada y Registro de Carnet Físico en Sala de Capacitaciones
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="inline-block bg-black text-white text-xs font-black uppercase px-3 py-1 rounded">
                    {confirmedCount} CONFIRMADOS
                  </span>
                  <p className="text-[10px] font-mono font-bold mt-1">
                    AFORO MÁX: {maxCapacity} PUESTOS
                  </p>
                </div>
              </div>

              {/* Tira de Metadatos del Evento */}
              <div className="grid grid-cols-4 gap-2 text-[11px] bg-slate-100 p-2.5 rounded border border-slate-300 font-semibold">
                <div>
                  <span className="text-[9px] uppercase font-bold text-slate-500 block">
                    EVENTO / CÓDIGO:
                  </span>
                  <span className="font-mono font-bold">
                    {currentTraining?.code} ({currentTraining?.brand || "OnProtec"})
                  </span>
                </div>
                <div>
                  <span className="text-[9px] uppercase font-bold text-slate-500 block">
                    FECHA:
                  </span>
                  <span className="font-bold">
                    {fmtLocalDate(currentTraining?.eventDate || currentTraining?.startDate)}
                  </span>
                </div>
                <div>
                  <span className="text-[9px] uppercase font-bold text-slate-500 block">
                    ESTATUS:
                  </span>
                  <span className="font-bold">Participantes Confirmados</span>
                </div>
                <div>
                  <span className="text-[9px] uppercase font-bold text-slate-500 block">
                    INSTRUCCIÓN MESA:
                  </span>
                  <span className="font-bold text-slate-900">Escribir Nº Carnet a mano</span>
                </div>
              </div>

              {/* Tabla de Asistencia para la Mesa de Recepción */}
              <div className="border border-black">
                <table className="w-full text-left text-[11px] border-collapse">
                  <thead>
                    <tr className="bg-slate-200 border-b border-black text-black font-black uppercase text-[10px]">
                      <th className="py-2 px-2.5 border-r border-black w-10 text-center">Nº</th>
                      <th className="py-2 px-3 border-r border-black">NOMBRE Y APELLIDO</th>
                      <th className="py-2 px-3 border-r border-black w-28">CÉDULA DE IDENTIDAD</th>
                      <th className="py-2 px-3 border-r border-black">EMPRESA / PROYECTO</th>
                      <th className="py-2 px-2.5 border-r border-black w-24 text-center">
                        Nº DE CARNET (A MANO)
                      </th>
                      <th className="py-2 px-2.5 border-r border-black w-16 text-center">HORA</th>
                      <th className="py-2 px-3 text-center w-20">FIRMA</th>
                    </tr>
                  </thead>
                  <tbody>
                    {eventRegistrations.map((r, idx) => {
                      const p = r.participant || {};
                      const rowNum = String(idx + 1).padStart(2, "0");
                      const isAttended = r.status === "Asistió";

                      return (
                        <tr key={r.id} className="border-b border-slate-300">
                          <td className="py-2 px-2.5 border-r border-black text-center font-mono font-bold">
                            {rowNum}
                          </td>
                          <td className="py-2 px-3 border-r border-black font-bold">
                            {p.name || "Sin Nombre"}
                          </td>
                          <td className="py-2 px-3 border-r border-black font-mono">
                            {p.docType || "V"}-{p.docNumber || "S/D"}
                          </td>
                          <td className="py-2 px-3 border-r border-black truncate max-w-[200px]">
                            {p.company || "Independiente"}
                          </td>
                          <td className="py-2 px-2.5 border-r border-black text-center font-mono font-bold">
                            {r.carnetNumber || ""}
                          </td>
                          <td className="py-2 px-2.5 border-r border-black text-center font-mono text-[10px]">
                            {r.checkInAt ? fmtLocalTime(r.checkInAt) : ""}
                          </td>
                          <td className="py-2 px-3 text-center font-bold text-base">
                            {isAttended ? "✓" : ""}
                          </td>
                        </tr>
                      );
                    })}

                    {/* Filas en blanco adicionales para registros de última hora (igual que en papel) */}
                    {[1, 2, 3, 4].map((extra) => {
                      const rowNum = String(eventRegistrations.length + extra).padStart(2, "0");
                      return (
                        <tr key={`extra-${extra}`} className="border-b border-slate-300 h-8">
                          <td className="py-2 px-2.5 border-r border-black text-center font-mono text-slate-400">
                            {rowNum}
                          </td>
                          <td className="py-2 px-3 border-r border-black"></td>
                          <td className="py-2 px-3 border-r border-black"></td>
                          <td className="py-2 px-3 border-r border-black"></td>
                          <td className="py-2 px-2.5 border-r border-black"></td>
                          <td className="py-2 px-2.5 border-r border-black"></td>
                          <td className="py-2 px-3 text-center"></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pie de Firma de Recepción y Coordinación (Idéntico a la hoja de Diana) */}
              <div className="pt-4 mt-6 border-t border-black space-y-4 text-xs">
                <span className="font-black uppercase tracking-wider block text-[10px] text-slate-700">
                  CONTROL Y VALIDACIÓN DE RECEPCIÓN
                </span>

                <div className="grid grid-cols-2 gap-8 items-end pt-4">
                  <div>
                    <div className="border-b border-black pb-1 mb-1 font-mono font-bold">
                      {responsableMesa}
                    </div>
                    <span className="text-[10px] text-slate-600 block">
                      Responsable del Registro en Mesa (Firma y Cédula)
                    </span>
                  </div>

                  <div className="text-right">
                    <div className="border-b border-black pb-1 mb-1 font-mono font-bold">
                      {coordinadorEvento}
                    </div>
                    <span className="text-[10px] text-slate-600 block">
                      Coordinador del Evento (Firma y Sello) • [ 18 ASISTENTES ]
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
