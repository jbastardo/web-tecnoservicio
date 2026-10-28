"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CalendarCheck,
  ClipboardList,
  UserCheck,
  Users,
  ExternalLink,
  Clock,
  Shield,
  Lock,
  LogOut,
  Eye,
  EyeOff,
  KeyRound,
  AlertCircle,
  CheckCircle2,
  Globe,
} from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { OnprotecBrand } from "@/components/OnprotecBrand";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [authUser, setAuthUser] = useState<any | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  // Estado formulario Login
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [loggingIn, setLoggingIn] = useState(false);

  useEffect(() => {
    // Verificar sesión local y cookie del servidor
    try {
      const cached = localStorage.getItem("onprotec_admin_user");
      if (cached) {
        setAuthUser(JSON.parse(cached));
      }
    } catch {
      // ignore
    }

    fetch("/api/auth")
      .then((r) => r.json())
      .then((d) => {
        if (d.authenticated && d.user) {
          setAuthUser(d.user);
          try {
            localStorage.setItem("onprotec_admin_user", JSON.stringify(d.user));
          } catch {}
        }
      })
      .catch(() => {})
      .finally(() => setCheckingAuth(false));
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoggingIn(true);
    setLoginError("");
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, password }),
      });
      const data = await res.json();
      if (data.success && data.user) {
        setAuthUser(data.user);
        try {
          localStorage.setItem("onprotec_admin_user", JSON.stringify(data.user));
        } catch {}
      } else {
        setLoginError(data.error || "Credenciales incorrectas");
      }
    } catch (err: any) {
      setLoginError("Error de conexión al verificar credenciales.");
    } finally {
      setLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth", { method: "DELETE" });
      localStorage.removeItem("onprotec_admin_user");
    } catch {}
    setAuthUser(null);
    setIdentifier("");
    setPassword("");
  };

  const navItems = [
    { href: "/admin", label: "Dashboard & KPIs", icon: LayoutDashboard },
    { href: "/admin/capacitaciones", label: "Capacitaciones", icon: CalendarCheck },
    { href: "/admin/inscripciones", label: "Inscripciones & Pagos", icon: ClipboardList },
    { href: "/admin/checkin", label: "Check-in (Día Evento)", icon: UserCheck },
    { href: "/admin/participantes", label: "Participantes (CRM)", icon: Users },
    { href: "/admin/credenciales", label: "Credenciales & Accesos", icon: KeyRound },
  ];

  if (!checkingAuth && !authUser) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between relative overflow-hidden">
        {/* Barra Superior Corporativa */}
        <div className="h-2 bg-gradient-to-r from-[#1a1b4b] via-[#e07b29] to-brand-500 w-full" />

        <header className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <OnprotecBrand subtitle="Portal de Gestión Administrativa · www.onprotec.com" href="/" />
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link
              href="/"
              className="text-xs bg-slate-900 hover:bg-slate-800 text-slate-300 px-3.5 py-2 rounded-xl border border-slate-800 flex items-center gap-1.5 transition"
            >
              <span>Volver a Portada Pública</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        </header>

        {/* Contenedor Central de Credenciales Widescreen (2 Columnas) */}
        <div className="max-w-5xl w-full mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Panel Izquierdo: Identidad Corporativa OnProtec */}
          <div className="lg:col-span-6 space-y-5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#e07b29]/15 border border-[#e07b29]/40 text-[#e07b29] text-xs font-bold">
              <Shield className="w-3.5 h-3.5" />
              <span>Acceso Administrativo Seguro · OnProtec C.A.</span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
              Control Integral de la{" "}
              <span className="text-[#e07b29]">Sala de Capacitaciones</span>
            </h1>

            <p className="text-sm text-slate-400 leading-relaxed">
              Plataforma corporativa de <strong>OnProtec («La Tienda del Instalador»)</strong> para
              la administración de cursos, workshops, control de aforo (18 participantes + 1
              instructor), validación de pagos, encuestas QR y fidelización comercial con Odoo ERP.
            </p>

            {/* Credenciales Rápidas de Acceso Directo para Pruebas / Administración */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <KeyRound className="w-4 h-4 text-[#e07b29]" />
                  Credenciales Corporativas Autorizadas (Clic para autocompletar):
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {[
                  {
                    label: "Gerencia TI (Super Admin)",
                    user: "admin@onprotec.com",
                    pass: "Onprotec2026*",
                    person: "Juan Carlos Bastardo",
                  },
                  {
                    label: "Gerencia General",
                    user: "gerencia@onprotec.com",
                    pass: "Onprotec2026*",
                    person: "Carlos Martins",
                  },
                  {
                    label: "Jefatura Operaciones",
                    user: "operaciones@onprotec.com",
                    pass: "Onprotec2026*",
                    person: "Julio Subero",
                  },
                  {
                    label: "Coordinación Sala",
                    user: "cursos@onprotec.com",
                    pass: "Sala2026*",
                    person: "Recepción / Check-in",
                  },
                ].map((cred) => (
                  <button
                    key={cred.user}
                    type="button"
                    onClick={() => {
                      setIdentifier(cred.user);
                      setPassword(cred.pass);
                      setLoginError("");
                    }}
                    className="text-left p-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-[#e07b29]/50 transition group"
                  >
                    <span className="font-bold text-white block group-hover:text-[#e07b29] transition">
                      {cred.label}
                    </span>
                    <span className="text-[11px] text-slate-400 block">{cred.person}</span>
                    <span className="text-[10px] font-mono text-cyan-400 block mt-0.5">
                      {cred.user}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Panel Derecho: Formulario de Autenticación */}
          <div className="lg:col-span-6">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
              <div className="h-1.5 bg-gradient-to-r from-[#1a1b4b] via-[#e07b29] to-brand-500 absolute top-0 left-0 right-0" />

              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-800">
                <div className="w-12 h-12 rounded-2xl bg-[#1a1b4b] border border-[#e07b29]/50 flex items-center justify-center p-2 shadow-md">
                  <img
                    src="/brand/onprotec-icon.png"
                    alt="OnProtec"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div>
                  <h2 className="text-lg font-extrabold text-white">Iniciar Sesión Administrativa</h2>
                  <p className="text-xs text-slate-400">
                    Ingrese sus credenciales de OnProtec Capacitaciones
                  </p>
                </div>
              </div>

              {loginError && (
                <div className="mb-4 p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                  <span>{loginError}</span>
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Usuario o Correo Corporativo *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="admin@onprotec.com o admin"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#e07b29]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Contraseña de Acceso *
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      placeholder="••••••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 pr-10 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#e07b29]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-white"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loggingIn}
                  className="onprotec-btn-primary w-full bg-gradient-to-r from-[#1a1b4b] via-brand-700 to-[#e07b29] hover:opacity-95 text-white font-bold py-3 px-4 rounded-xl shadow-lg transition flex items-center justify-center gap-2 text-sm disabled:opacity-50"
                >
                  <Lock className="w-4 h-4" />
                  <span>{loggingIn ? "Verificando credenciales..." : "Ingresar al Panel Administrativo"}</span>
                </button>
              </form>

              <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                <span className="flex items-center gap-1">
                  <Globe className="w-3.5 h-3.5 text-[#e07b29]" />
                  www.onprotec.com
                </span>
                <span>Caracas, Venezuela (UTC-4)</span>
              </div>
            </div>
          </div>
        </div>

        <footer className="py-4 text-center text-xs text-slate-500 border-t border-slate-900">
          © 2026 OnProtec C.A. («La Tienda del Instalador») · Seguridad Electrónica, Redes y Telecomunicaciones.
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Franja Corporativa OnProtec Navy + Naranja */}
      <div className="h-1 bg-gradient-to-r from-[#1a1b4b] via-[#e07b29] to-brand-500 w-full" />

      {/* Cintillo de Navegación Fijo Superior (Sticky Widescreen Navbar) */}
      <nav className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 px-4 sm:px-6 lg:px-8">
        <div className="h-16 flex items-center justify-between gap-3">
          {/* Logo Oficial OnProtec */}
          <OnprotecBrand subtitle="Gestión Sala (Aforo 18 + 1)" href="/admin" compact />

          {/* Menú de Navegación Horizontal Widescreen */}
          <div className="hidden xl:flex items-center gap-1 overflow-x-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition whitespace-nowrap ${
                    isActive
                      ? "bg-brand-500/20 text-brand-300 border border-brand-500/40 shadow-sm"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>

          {/* Controles Derecha: Tema Claro/Oscuro, Usuario Activo, Ver Landing, Salir */}
          <div className="flex items-center gap-2.5">
            <ThemeToggle />

            {authUser && (
              <Link
                href="/admin/credenciales"
                className="hidden md:flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 hover:border-[#e07b29]/50 transition text-xs"
                title="Gestionar Credenciales Administrativas"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <div className="text-left leading-tight">
                  <span className="font-bold text-white block text-[11px]">{authUser.name}</span>
                  <span className="text-[10px] text-[#e07b29] font-semibold block">
                    {authUser.role}
                  </span>
                </div>
              </Link>
            )}

            <Link
              href="/"
              className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-xl border border-slate-700 flex items-center gap-1 transition"
              title="Ver Portada Pública de Inscripciones"
            >
              <span>Portada</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>

            {authUser && (
              <button
                type="button"
                onClick={handleLogout}
                className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl border border-red-500/30 transition"
                title="Cerrar Sesión Administrativa"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Barra de navegación secundaria para pantallas medianas / móviles */}
        <div className="xl:hidden flex items-center gap-1 overflow-x-auto py-2 border-t border-slate-800">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs whitespace-nowrap ${
                  isActive
                    ? "bg-brand-500/20 text-brand-300 font-bold border border-brand-500/30"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Contenido Widescreen */}
      <main className="flex-1 w-full max-w-[1700px] mx-auto p-4 sm:p-6 lg:p-8">
        {children}
      </main>
    </div>
  );
}
