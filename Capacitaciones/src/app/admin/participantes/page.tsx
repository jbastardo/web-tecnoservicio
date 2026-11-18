"use client";

import React, { useState, useEffect } from "react";
import {
  Users,
  ShoppingBag,
  Search,
  CheckCircle,
  Calendar,
  Award,
  X,
  ExternalLink,
  RefreshCw,
  BookOpen,
  Clock,
  Edit3,
  Trash2,
  AlertTriangle,
  Check,
  Send,
} from "lucide-react";
import {
  formatCurrency,
  fmtLocalDate,
  buildParticipantWhatsAppUrl,
  ONPROTEC_WHATSAPP_DISPLAY,
} from "@/utils/formatUtils";

export default function ParticipantesAdminPage() {
  const [participants, setParticipants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<
    "all" | "recurring" | "store_clients" | "prospects"
  >("all");
  const [selectedParticipant, setSelectedParticipant] = useState<any | null>(null);
  const [toast, setToast] = useState("");

  // Estado Editar / Borrar Participante y Formularios Individuales
  const [editingParticipant, setEditingParticipant] = useState<any | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    docType: "V",
    docNumber: "",
    phone: "",
    email: "",
    company: "",
    cargo: "",
    city: "Caracas",
  });
  const [savingEdit, setSavingEdit] = useState(false);
  const [deletingParticipant, setDeletingParticipant] = useState<any | null>(null);
  const [isDeletingParticipant, setIsDeletingParticipant] = useState(false);
  const [confirmDeleteRegId, setConfirmDeleteRegId] = useState<number | null>(null);

  const notify = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 4500);
  };

  const fetchParticipants = () => {
    setLoading(true);
    fetch("/api/participantes")
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setParticipants(d.data);
      })
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchParticipants();
  }, []);

  useEffect(() => {
    if (!deletingParticipant && !editingParticipant && !selectedParticipant) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (deletingParticipant && !isDeletingParticipant) setDeletingParticipant(null);
      else if (editingParticipant) setEditingParticipant(null);
      else if (selectedParticipant) {
        setSelectedParticipant(null);
        setConfirmDeleteRegId(null);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [deletingParticipant, isDeletingParticipant, editingParticipant, selectedParticipant]);

  const openEditParticipant = (p: any) => {
    setEditingParticipant(p);
    setEditForm({
      name: p.name || "",
      docType: p.docType || "V",
      docNumber: p.docNumber || "",
      phone: p.phone || "",
      email: p.email || "",
      company: p.company || "",
      cargo: p.cargo || "",
      city: p.city || "Caracas",
    });
  };

  const handleSaveParticipant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingParticipant) return;
    setSavingEdit(true);
    try {
      const res = await fetch("/api/participantes", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editingParticipant.id, ...editForm }),
      });
      const data = await res.json();
      if (data.success) {
        setParticipants((prev) =>
          prev.map((p) => (p.id === editingParticipant.id ? { ...p, ...data.data } : p))
        );
        if (selectedParticipant && selectedParticipant.id === editingParticipant.id) {
          setSelectedParticipant((prev: any) => ({ ...prev, ...data.data }));
        }
        setEditingParticipant(null);
        notify("Datos del participante actualizados con éxito");
      } else {
        notify(data.error || "Error al actualizar participante");
      }
    } catch (err) {
      console.error("Error actualizando participante:", err);
      notify("Error de red al guardar cambios");
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDeleteParticipant = async () => {
    if (!deletingParticipant) return;
    setIsDeletingParticipant(true);
    try {
      const res = await fetch(`/api/participantes?id=${deletingParticipant.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        setParticipants((prev) =>
          prev.filter((p) => Number(p.id) !== Number(deletingParticipant.id))
        );
        if (
          selectedParticipant &&
          Number(selectedParticipant.id) === Number(deletingParticipant.id)
        ) {
          setSelectedParticipant(null);
        }
        notify("Participante y sus formularios eliminados con éxito");
        setDeletingParticipant(null);
      } else {
        notify(data.error || "No se pudo eliminar participante");
      }
    } catch (err) {
      console.error("Error eliminando participante:", err);
      notify("Error de red al eliminar");
    } finally {
      setIsDeletingParticipant(false);
    }
  };

  const handleDeleteSingleRegistration = async (registrationId: number, participantId: number) => {
    try {
      const res = await fetch(`/api/inscripciones?id=${registrationId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        setConfirmDeleteRegId(null);
        setParticipants((prev) =>
          prev
            .map((p) => {
              if (Number(p.id) !== Number(participantId)) return p;
              const nextParts = (p.participations || []).filter(
                (x: any) => Number(x.registrationId) !== Number(registrationId)
              );
              return { ...p, participations: nextParts };
            })
            .filter((p) => Number(p.id) !== Number(participantId) || (p.participations || []).length > 0)
        );
        setSelectedParticipant((prev: any) => {
          if (!prev) return null;
          const nextParts = (prev.participations || []).filter(
            (x: any) => Number(x.registrationId) !== Number(registrationId)
          );
          if (nextParts.length === 0) return null;
          return { ...prev, participations: nextParts };
        });
        notify("Formulario de capacitación eliminado");
      } else {
        notify(data.error || "Error al eliminar formulario");
      }
    } catch (err) {
      console.error("Error eliminando participación:", err);
      notify("Error de red al eliminar");
    }
  };

  const recurringCount = participants.filter(
    (p) => (p.participations?.length || 0) > 1
  ).length;

  const filtered = participants.filter((p) => {
    const q = search.toLowerCase();
    const matchesCourse = (p.participations || []).some(
      (part: any) =>
        part.trainingName?.toLowerCase().includes(q) ||
        part.trainingCode?.toLowerCase().includes(q) ||
        part.brand?.toLowerCase().includes(q)
    );

    const matchesSearch =
      p.name?.toLowerCase().includes(q) ||
      (p.docNumber || "").toLowerCase().includes(q) ||
      (p.phone || "").includes(search) ||
      (p.email || "").toLowerCase().includes(q) ||
      (p.company || "").toLowerCase().includes(q) ||
      (p.cargo || "").toLowerCase().includes(q) ||
      (p.city || "").toLowerCase().includes(q) ||
      matchesCourse;

    if (!matchesSearch) return false;
    if (filterType === "recurring") return (p.participations?.length || 0) > 1;
    if (filterType === "store_clients") return p.hasStorePurchases;
    if (filterType === "prospects") return !p.hasStorePurchases;
    return true;
  });

  const statusBadgeColor = (status: string) => {
    if (status === "Asistió")
      return "bg-emerald-100 text-emerald-900 border-emerald-300 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/40 font-bold";
    if (status === "Confirmado")
      return "bg-sky-100 text-sky-900 border-sky-300 dark:bg-cyan-500/20 dark:text-cyan-300 dark:border-cyan-500/40 font-bold";
    if (status === "Lista de Espera")
      return "bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/40 font-bold";
    if (status === "No Asistió")
      return "bg-rose-100 text-rose-900 border-rose-300 dark:bg-red-500/20 dark:text-red-300 dark:border-red-500/40 font-bold";
    return "bg-slate-100 text-slate-800 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 font-bold";
  };

  return (
    <div className="space-y-6">
      {toast && (
        <div className="fixed top-5 right-5 z-50 bg-emerald-950 border border-emerald-500 text-emerald-200 text-xs px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{toast}</span>
        </div>
      )}

      {/* Cintillo Widescreen de Cabecera y Filtros */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 pb-4 border-b border-slate-300 dark:border-slate-800">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-[#f4730a]" />
            <span>Directorio de Inscritos & Historial de Participación (CRM OnProtec)</span>
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 font-medium">
            Consulta en qué capacitaciones ha participado cada inscrito, su asistencia real y su
            historial de compras en tienda ({participants.length} inscritos únicos).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Buscar por nombre, cédula, empresa o curso..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-[#f4730a] w-72 shadow-sm"
            />
          </div>

          <div className="flex flex-wrap bg-slate-200/70 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl p-1 text-xs gap-1 shadow-sm">
            <button
              onClick={() => setFilterType("all")}
              className={`px-3 py-1 rounded-lg font-bold transition ${
                filterType === "all"
                  ? "bg-[#2a285c] text-white shadow-sm keep-white"
                  : "text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              Todos ({participants.length})
            </button>
            <button
              onClick={() => setFilterType("recurring")}
              className={`px-3 py-1 rounded-lg font-bold transition ${
                filterType === "recurring"
                  ? "bg-[#f4730a] text-white shadow-sm keep-white"
                  : "text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              Recurrentes 2+ Cursos ({recurringCount})
            </button>
            <button
              onClick={() => setFilterType("prospects")}
              className={`px-3 py-1 rounded-lg font-bold transition ${
                filterType === "prospects"
                  ? "bg-sky-600 text-white shadow-sm keep-white"
                  : "text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              Prospectos Vírgenes
            </button>
            <button
              onClick={() => setFilterType("store_clients")}
              className={`px-3 py-1 rounded-lg font-bold transition ${
                filterType === "store_clients"
                  ? "bg-emerald-600 text-white shadow-sm keep-white"
                  : "text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              Clientes Tienda
            </button>
          </div>

          <button
            onClick={fetchParticipants}
            className="p-2 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs shadow-sm transition"
            title="Actualizar lista"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Tabla Widescreen de Participantes con Historial de Cursos */}
      <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-800 dark:text-slate-300">
            <thead className="bg-slate-100 dark:bg-slate-950 text-slate-700 dark:text-slate-400 uppercase text-[10px] tracking-wider font-extrabold border-b border-slate-300 dark:border-slate-800">
              <tr>
                <th className="py-3.5 px-4">Participante / Contacto</th>
                <th className="py-3.5 px-4">Documento</th>
                <th className="py-3.5 px-4">Empresa / Rol</th>
                <th className="py-3.5 px-4">¿Dónde ha Participado? (Capacitaciones)</th>
                <th className="py-3.5 px-4">Historial Tienda</th>
                <th className="py-3.5 px-4">Monto Comprado</th>
                <th className="py-3.5 px-4 text-right">Expediente</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800/80">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500 font-semibold">
                    Cargando historial de participantes...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500 font-semibold">
                    No se encontraron participantes con ese criterio.
                  </td>
                </tr>
              ) : (
                filtered.slice(0, 100).map((p) => {
                  const parts = p.participations || [];
                  const attended = parts.filter((x: any) => x.status === "Asistió").length;

                  return (
                    <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                      <td className="py-3.5 px-4">
                        <span className="font-extrabold text-slate-900 dark:text-white text-sm block">
                          {p.name || "Sin Nombre"}
                        </span>
                        <span className="text-[#0e5cd7] dark:text-cyan-400 font-mono text-xs font-bold block mt-0.5">
                          {p.phone || "Sin Teléfono"}
                        </span>
                        <span className="text-slate-600 dark:text-slate-400 text-[11px] block truncate max-w-[180px]">
                          {p.email || "Sin Email"}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 font-mono font-bold text-slate-800 dark:text-slate-300 text-xs">
                        {p.docNumber || "S/D"}
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="block font-bold text-slate-900 dark:text-slate-200 text-xs">
                          {p.company || "Independiente"}
                        </span>
                        <span className="block text-[11px] text-slate-600 dark:text-slate-400 font-medium">
                          {p.cargo || p.city || "Caracas"}
                        </span>
                      </td>

                      {/* Columna Clave: A dónde ha participado cada inscrito */}
                      <td className="py-3.5 px-4 max-w-md">
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-900 border border-blue-300 dark:bg-brand-500/20 dark:text-brand-300 dark:border-brand-500/30">
                            {parts.length} {parts.length === 1 ? "curso" : "cursos"}
                          </span>
                          <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold">
                            ({attended} asistencias en sala)
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {parts.slice(0, 3).map((item: any) => (
                            <button
                              key={item.registrationId}
                              type="button"
                              onClick={() => setSelectedParticipant(p)}
                              className={`text-left px-2 py-0.5 rounded text-[10px] border truncate max-w-[220px] transition ${statusBadgeColor(
                                item.status
                              )}`}
                              title={`${item.trainingCode} - ${item.trainingName} (${item.status})`}
                            >
                              <strong className="font-mono">{item.trainingCode}:</strong>{" "}
                              {item.trainingName} ({item.status})
                            </button>
                          ))}
                          {parts.length > 3 && (
                            <button
                              type="button"
                              onClick={() => setSelectedParticipant(p)}
                              className="px-2 py-0.5 rounded text-[10px] font-bold bg-orange-100 text-[#f4730a] border border-[#f4730a]/40 dark:bg-[#e07b29]/20 dark:text-[#e07b29] dark:border-[#e07b29]/40"
                            >
                              +{parts.length - 3} más...
                            </button>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        {p.hasStorePurchases ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/30">
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
                            Cliente Tienda
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-sky-100 text-sky-900 border border-sky-300 dark:bg-cyan-500/20 dark:text-cyan-300 dark:border-cyan-500/30">
                            <ShoppingBag className="w-3.5 h-3.5 text-sky-700 dark:text-cyan-400" />
                            Prospecto Virgen
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 font-black text-slate-900 dark:text-white font-mono text-xs">
                        {p.hasStorePurchases ? formatCurrency(p.storePurchasesAmount) : "$0.00"}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <a
                            href={buildParticipantWhatsAppUrl(
                              p.phone,
                              `Hola ${p.name || "Participante"}, te escribimos del equipo de OnProtec (${ONPROTEC_WHATSAPP_DISPLAY}) respecto a nuestras próximas capacitaciones.`
                            )}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white border border-emerald-300 dark:bg-emerald-500/15 dark:border-emerald-500/40 dark:text-emerald-400 transition cursor-pointer"
                            title={`Enviar mensaje por WhatsApp a ${p.phone || ONPROTEC_WHATSAPP_DISPLAY}`}
                          >
                            <Send className="w-3.5 h-3.5" />
                          </a>
                          <button
                            type="button"
                            onClick={() => setSelectedParticipant(p)}
                            className="px-2.5 py-1.5 bg-orange-50 hover:bg-[#f4730a] text-[#f4730a] hover:text-white border border-[#f4730a]/40 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-cyan-300 dark:border-slate-700 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 transition shadow-sm cursor-pointer"
                          >
                            <BookOpen className="w-3.5 h-3.5" />
                            <span>Ver ({parts.length})</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => openEditParticipant(p)}
                            className="p-1.5 rounded-xl bg-slate-100 hover:bg-[#f4730a] text-slate-700 hover:text-white border border-slate-300 dark:bg-slate-800 dark:border-slate-700 dark:text-amber-300 transition cursor-pointer"
                            title="Editar datos del participante"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeletingParticipant(p)}
                            className="p-1.5 rounded-xl bg-rose-50 hover:bg-red-600 text-rose-600 hover:text-white border border-rose-300 dark:bg-red-500/15 dark:border-red-500/40 dark:text-red-400 transition cursor-pointer"
                            title="Borrar participante y sus formularios"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Historial Completo de Participaciones del Inscrito */}
      {selectedParticipant && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setSelectedParticipant(null);
              setConfirmDeleteRegId(null);
            }
          }}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
        >
          <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-3xl p-6 max-w-3xl w-full shadow-2xl relative my-8 text-slate-900 dark:text-white">
            <button
              onClick={() => {
                setSelectedParticipant(null);
                setConfirmDeleteRegId(null);
              }}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-800 dark:hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex flex-wrap items-start justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800 mb-4 pr-8">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-[#1a1b4b] border border-[#e07b29] flex items-center justify-center text-white font-black text-lg keep-white shadow-sm flex-shrink-0">
                  {selectedParticipant.name?.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">
                    {selectedParticipant.name}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                    Doc: <strong className="text-slate-900 dark:text-slate-200 font-bold">{selectedParticipant.docType || "V"}-{selectedParticipant.docNumber || "S/D"}</strong>{" "}
                    · WhatsApp: <strong className="text-[#0e5cd7] dark:text-cyan-400 font-bold">{selectedParticipant.phone}</strong> ·
                    Email: <span className="font-medium">{selectedParticipant.email}</span>
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                    Empresa:{" "}
                    <strong className="text-slate-900 dark:text-white font-bold">
                      {selectedParticipant.company || "Independiente"}
                    </strong>{" "}
                    {selectedParticipant.cargo ? `(${selectedParticipant.cargo})` : ""} · Ciudad:{" "}
                    <span className="font-medium">{selectedParticipant.city || "Caracas"}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={buildParticipantWhatsAppUrl(
                    selectedParticipant.phone,
                    `Hola ${selectedParticipant.name || "Participante"}, te escribimos del equipo de OnProtec (${ONPROTEC_WHATSAPP_DISPLAY}) respecto a tus participaciones en nuestra Sala VIP.`
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>WhatsApp</span>
                </a>
                <button
                  type="button"
                  onClick={() => openEditParticipant(selectedParticipant)}
                  className="px-3 py-1.5 rounded-xl bg-[#f4730a] hover:bg-[#ef7922] text-white text-xs font-extrabold inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Editar Datos</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDeletingParticipant(selectedParticipant)}
                  className="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-extrabold inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Borrar Participante</span>
                </button>
              </div>
            </div>

            {/* KPIs rápidos del participante */}
            <div className="grid grid-cols-3 gap-3 mb-5 text-center">
              <div className="bg-slate-100 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                <span className="text-[11px] text-slate-600 dark:text-slate-400 font-semibold block">Total Inscripciones</span>
                <span className="text-xl font-black text-slate-900 dark:text-white">
                  {selectedParticipant.participations?.length || 0}
                </span>
              </div>
              <div className="bg-slate-100 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                <span className="text-[11px] text-slate-600 dark:text-slate-400 font-semibold block">Asistencias Efectivas</span>
                <span className="text-xl font-black text-emerald-700 dark:text-emerald-400">
                  {(selectedParticipant.participations || []).filter(
                    (x: any) => x.status === "Asistió"
                  ).length}
                </span>
              </div>
              <div className="bg-slate-100 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                <span className="text-[11px] text-slate-600 dark:text-slate-400 font-semibold block">Compras en Tienda OnProtec</span>
                <span className="text-xl font-black text-[#0e5cd7] dark:text-cyan-400 font-mono">
                  {formatCurrency(selectedParticipant.storePurchasesAmount || 0)}
                </span>
              </div>
            </div>

            <h4 className="text-xs font-black uppercase tracking-wider text-[#f4730a] mb-3 flex items-center gap-1.5">
              <Award className="w-4 h-4" />
              <span>
                Capacitaciones donde se ha inscrito o participado (
                {selectedParticipant.participations?.length || 0})
              </span>
            </h4>

            <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
              {(selectedParticipant.participations || []).map((part: any) => (
                <div
                  key={part.registrationId}
                  className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono font-bold text-[#0e5cd7] dark:text-brand-300">
                        {part.trainingCode}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-orange-100 text-[#f4730a] dark:bg-[#e07b29]/15 dark:text-[#e07b29] text-[10px] font-bold">
                        {part.brand || part.trainingType}
                      </span>
                      <span className="text-slate-600 dark:text-slate-400 flex items-center gap-1 text-[11px]">
                        <Calendar className="w-3 h-3 text-cyan-400" />
                        {fmtLocalDate(part.eventDate)}
                      </span>
                    </div>
                    <p className="font-bold text-slate-900 dark:text-white text-sm">{part.trainingName}</p>
                    {part.specialNotes && (
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 italic font-medium">
                        Nota / Consulta: {part.specialNotes}
                      </p>
                    )}
                    {part.customAnswers && Object.keys(part.customAnswers).length > 0 && (
                      <div className="pt-1 flex flex-wrap gap-1.5">
                        {Object.entries(part.customAnswers).map(([k, v]) => (
                          <span
                            key={k}
                            className="text-[10px] bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 px-2 py-0.5 rounded text-slate-700 dark:text-slate-300 font-medium"
                          >
                            <strong>{k}:</strong>{" "}
                            {typeof v === "string" && v.startsWith("data:") ? (
                              <a
                                href={v}
                                target="_blank"
                                rel="noreferrer"
                                download={`adjunto-${part.trainingCode}.png`}
                                className="text-cyan-600 dark:text-cyan-400 font-bold underline"
                              >
                                📎 Ver Archivo / Comprobante
                              </a>
                            ) : (
                              String(v)
                            )}
                          </span>
                        ))}
                      </div>
                    )}
                    {part.paymentProofUrl && (
                      <div className="pt-1">
                        <a
                          href={part.paymentProofUrl}
                          target="_blank"
                          rel="noreferrer"
                          download={part.paymentProofUrl.startsWith("data:") ? `comprobante-${part.trainingCode}.png` : undefined}
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700 px-2 py-0.5 rounded hover:underline"
                        >
                          📎 Comprobante de Pago
                        </a>
                      </div>
                    )}
                  </div>

                  <div className="flex sm:flex-col items-end justify-between gap-1.5 flex-shrink-0">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${statusBadgeColor(
                        part.status
                      )}`}
                    >
                      {part.status}
                    </span>
                    <span className="text-[11px] text-slate-600 dark:text-slate-400 font-mono font-bold">
                      {Number(part.amount) > 0
                        ? `${formatCurrency(part.amount)} (${part.isPaid ? "Pagado" : "Pendiente"})`
                        : "Evento Gratuito"}
                    </span>
                    {confirmDeleteRegId === part.registrationId ? (
                      <div className="flex items-center gap-1 pt-1">
                        <button
                          type="button"
                          onClick={() =>
                            handleDeleteSingleRegistration(part.registrationId, selectedParticipant.id)
                          }
                          className="px-2 py-1 rounded-lg bg-red-600 hover:bg-red-500 text-white text-[10px] font-black cursor-pointer"
                        >
                          Confirmar Borrar
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteRegId(null)}
                          className="px-2 py-1 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-bold cursor-pointer"
                        >
                          No
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteRegId(part.registrationId)}
                        className="mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-rose-50 hover:bg-red-600 text-rose-600 hover:text-white border border-rose-300 dark:bg-red-500/15 dark:border-red-500/40 dark:text-red-400 text-[10px] font-bold transition cursor-pointer"
                        title="Borrar este formulario de capacitación"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Borrar Formulario</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Modal Editar Datos del Participante */}
      {editingParticipant && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={(e) => {
            if (e.target === e.currentTarget) setEditingParticipant(null);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
        >
          <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-xl p-6 shadow-2xl relative">
            <button
              onClick={() => setEditingParticipant(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-base font-black text-white mb-4 flex items-center gap-2">
              <Edit3 className="w-4 h-4 text-[#f4730a]" />
              <span>Editar Datos del Participante (#{editingParticipant.id})</span>
            </h3>
            <form onSubmit={handleSaveParticipant} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    Nombre Completo *
                  </label>
                  <input
                    type="text"
                    required
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
                <div className="grid grid-cols-12 gap-2">
                  <div className="col-span-4">
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">Tipo</label>
                    <select
                      value={editForm.docType}
                      onChange={(e) => setEditForm({ ...editForm, docType: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2 py-2 text-xs text-white"
                    >
                      <option value="V">V-</option>
                      <option value="E">E-</option>
                      <option value="J">J-</option>
                      <option value="P">P-</option>
                    </select>
                  </div>
                  <div className="col-span-8">
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">
                      Cédula / RIF *
                    </label>
                    <input
                      type="text"
                      required
                      value={editForm.docNumber}
                      onChange={(e) => setEditForm({ ...editForm, docNumber: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    WhatsApp / Teléfono *
                  </label>
                  <input
                    type="text"
                    required
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    Correo Electrónico *
                  </label>
                  <input
                    type="email"
                    required
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    Empresa / Integrador
                  </label>
                  <input
                    type="text"
                    value={editForm.company}
                    onChange={(e) => setEditForm({ ...editForm, company: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    Cargo / Rol
                  </label>
                  <input
                    type="text"
                    value={editForm.cargo}
                    onChange={(e) => setEditForm({ ...editForm, cargo: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    Ciudad
                  </label>
                  <input
                    type="text"
                    value={editForm.city}
                    onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingParticipant(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="px-4 py-2 bg-[#f4730a] hover:bg-[#ef7922] text-white text-xs font-black rounded-xl cursor-pointer"
                >
                  {savingEdit ? "Guardando..." : "Guardar Cambios"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Confirmación Eliminar Participante */}
      {deletingParticipant && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={(e) => {
            if (e.target === e.currentTarget && !isDeletingParticipant) setDeletingParticipant(null);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
        >
          <div className="bg-slate-900 border-2 border-red-500/40 rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-500/15 text-red-400 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-white">¿Eliminar Participante?</h3>
                <p className="text-xs text-slate-400">
                  {deletingParticipant.name} ({deletingParticipant.docType || "V"}-{deletingParticipant.docNumber || "S/D"})
                </p>
              </div>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Esta acción eliminará al participante del directorio CRM junto con sus{" "}
              <strong>{deletingParticipant.participations?.length || 0} formularios registrados</strong> en capacitaciones.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setDeletingParticipant(null)}
                disabled={isDeletingParticipant}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDeleteParticipant}
                disabled={isDeletingParticipant}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-black rounded-xl cursor-pointer"
              >
                {isDeletingParticipant ? "Eliminando..." : "Sí, Eliminar Participante"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
