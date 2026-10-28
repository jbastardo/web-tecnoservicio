"use client";

import React, { useState, useEffect } from "react";
import {
  KeyRound,
  ShieldCheck,
  UserPlus,
  Edit3,
  Trash2,
  CheckCircle2,
  XCircle,
  Lock,
  Mail,
  User,
  Building2,
  X,
  Check,
  Clock,
} from "lucide-react";
import { fmtLocalTime } from "@/utils/formatUtils";

export default function CredencialesAdminPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState("");

  // Modal Crear / Editar Credencial
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [form, setForm] = useState({
    username: "",
    email: "",
    name: "",
    role: "Coordinador de Sala",
    department: "OnProtec Capacitaciones",
    password: "",
    isActive: true,
  });

  const notify = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 4000);
  };

  const fetchUsers = () => {
    setLoading(true);
    fetch("/api/auth?list=true")
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setUsers(d.data);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const openCreateModal = () => {
    setEditingUser(null);
    setForm({
      username: "",
      email: "",
      name: "",
      role: "Coordinador de Sala",
      department: "Sala de Capacitaciones OnProtec",
      password: "",
      isActive: true,
    });
    setShowModal(true);
  };

  const openEditModal = (u: any) => {
    setEditingUser(u);
    setForm({
      username: u.username || "",
      email: u.email || "",
      name: u.name || "",
      role: u.role || "Coordinador de Sala",
      department: u.department || "OnProtec Capacitaciones",
      password: "",
      isActive: u.isActive !== false,
    });
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingUser) {
        const res = await fetch("/api/auth", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: editingUser.id,
            ...form,
          }),
        });
        const data = await res.json();
        if (data.success) {
          notify(`Credencial de ${form.name} actualizada.`);
          setShowModal(false);
          fetchUsers();
        } else {
          alert(data.error || "Error al actualizar");
        }
      } else {
        const res = await fetch("/api/auth", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "create",
            ...form,
          }),
        });
        const data = await res.json();
        if (data.success) {
          notify(`Nueva credencial creada para ${form.name}.`);
          setShowModal(false);
          fetchUsers();
        } else {
          alert(data.error || "Error al crear credencial");
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const toggleActive = async (u: any) => {
    const res = await fetch("/api/auth", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: u.id, isActive: !u.isActive }),
    });
    const d = await res.json();
    if (d.success) {
      notify(`Estado de ${u.name} actualizado.`);
      fetchUsers();
    }
  };

  const handleDelete = async (u: any) => {
    if (!confirm(`¿Seguro que deseas eliminar la credencial de ${u.name}?`)) return;
    const res = await fetch(`/api/auth?id=${u.id}`, { method: "DELETE" });
    const d = await res.json();
    if (d.success) {
      notify("Credencial eliminada.");
      fetchUsers();
    } else {
      alert(d.error || "No se pudo eliminar");
    }
  };

  return (
    <div className="space-y-6">
      {toast && (
        <div className="fixed top-5 right-5 z-50 bg-emerald-950 border border-emerald-500 text-emerald-200 text-xs px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toast}</span>
        </div>
      )}

      {/* Cabecera Widescreen */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <KeyRound className="w-6 h-6 text-[#e07b29]" />
            <span>Sistema de Credenciales y Accesos Administrativos</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Control de usuarios autorizados, roles operativos y contraseñas para la gestión de
            OnProtec Capacitaciones.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="onprotec-btn-primary flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-brand-500/20 transition"
        >
          <UserPlus className="w-4 h-4" />
          <span>Nueva Credencial de Acceso</span>
        </button>
      </div>

      {/* Tarjetas de Roles Corporativos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#e07b29]">
            Super Admin / TI
          </span>
          <p className="text-sm font-bold text-white mt-1">Control Total del Sistema</p>
          <p className="text-xs text-slate-400 mt-1">
            Configuración de cursos, edición de formularios, encuestas, Odoo ERP y credenciales.
          </p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <span className="text-[11px] font-bold uppercase tracking-wider text-brand-400">
            Gerencia General
          </span>
          <p className="text-sm font-bold text-white mt-1">Auditoría ROI & KPIs</p>
          <p className="text-xs text-slate-400 mt-1">
            Supervisión de ingresos, costos de pauta, tasa de No-Show y conversión en tienda.
          </p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-400">
            Coordinador de Sala
          </span>
          <p className="text-sm font-bold text-white mt-1">Gestión de Eventos (18+1)</p>
          <p className="text-xs text-slate-400 mt-1">
            Creación y edición de capacitaciones, fotos de portada, notas de presentación y QR.
          </p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
            Finanzas & Recepción
          </span>
          <p className="text-sm font-bold text-white mt-1">Conciliación & Check-in</p>
          <p className="text-xs text-slate-400 mt-1">
            Validación manual/Pabilo de pagos y registro de asistencia el día del evento.
          </p>
        </div>
      </div>

      {/* Tabla Widescreen de Usuarios Administrativos */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4">Responsable</th>
                <th className="py-3.5 px-4">Usuario / Correo</th>
                <th className="py-3.5 px-4">Rol Administrativo</th>
                <th className="py-3.5 px-4">Departamento / Área</th>
                <th className="py-3.5 px-4">Último Acceso (Caracas)</th>
                <th className="py-3.5 px-4">Estado</th>
                <th className="py-3.5 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    Cargando credenciales...
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3.5 px-4 font-bold text-white">{u.name}</td>
                    <td className="py-3.5 px-4">
                      <span className="font-mono text-cyan-300 block font-semibold">
                        {u.username}
                      </span>
                      <span className="text-[11px] text-slate-400">{u.email}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-brand-500/20 text-brand-300 border border-brand-500/30">
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-300">{u.department}</td>
                    <td className="py-3.5 px-4 text-slate-400 font-mono text-[11px]">
                      {u.lastLoginAt ? fmtLocalTime(u.lastLoginAt) : "Sin ingresos recientes"}
                    </td>
                    <td className="py-3.5 px-4">
                      <button
                        type="button"
                        onClick={() => toggleActive(u)}
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border transition ${
                          u.isActive
                            ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                            : "bg-red-500/20 text-red-300 border-red-500/30"
                        }`}
                      >
                        {u.isActive ? (
                          <>
                            <CheckCircle2 className="w-3 h-3" /> Activo
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3 h-3" /> Inactivo
                          </>
                        )}
                      </button>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => openEditModal(u)}
                          className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded-lg text-xs font-semibold border border-slate-700 flex items-center gap-1 transition"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Editar / Clave</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(u)}
                          className="p-1.5 bg-slate-800 hover:bg-red-950/60 text-red-400 rounded-lg border border-slate-700 transition"
                          title="Eliminar credencial"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Crear / Editar Credencial */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 max-w-md w-full shadow-2xl relative">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-4 pb-3 border-b border-slate-800">
              <KeyRound className="w-5 h-5 text-[#e07b29]" />
              <span>
                {editingUser ? "Editar Credencial Administrativa" : "Crear Nueva Credencial"}
              </span>
            </h3>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Nombre y Apellido del Responsable *
                </label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Ej. Ing. Alejandro Quijada"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Usuario *</label>
                  <input
                    type="text"
                    required
                    value={form.username}
                    onChange={(e) => setForm({ ...form, username: e.target.value })}
                    placeholder="ej. aquijada"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Correo Corporativo *
                  </label>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="usuario@onprotec.com"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Rol de Acceso</label>
                  <select
                    value={form.role}
                    onChange={(e) => setForm({ ...form, role: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white"
                  >
                    <option value="Super Admin">Super Admin</option>
                    <option value="Gerencia General">Gerencia General</option>
                    <option value="Coordinador de Sala">Coordinador de Sala</option>
                    <option value="Finanzas y Pagos">Finanzas y Pagos</option>
                    <option value="Recepción Check-in">Recepción Check-in</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Departamento</label>
                  <input
                    type="text"
                    value={form.department}
                    onChange={(e) => setForm({ ...form, department: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  {editingUser
                    ? "Nueva Contraseña (dejar en blanco para mantener actual)"
                    : "Contraseña de Acceso *"}
                </label>
                <input
                  type="text"
                  required={!editingUser}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder={editingUser ? "Sin cambios..." : "Ej. Onprotec2026*"}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="onprotec-btn-primary px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Guardar Credencial</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
