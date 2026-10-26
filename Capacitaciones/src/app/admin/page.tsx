"use client";

import React, { useState, useEffect } from "react";
import {
  TrendingUp,
  Users,
  CreditCard,
  DollarSign,
  AlertCircle,
  PieChart,
  Target,
  ShoppingBag,
  CheckCircle2,
  Calendar,
  Layers,
  ArrowUpRight,
  RefreshCw,
} from "lucide-react";
import { DashboardMetrics } from "@/types";
import { formatCurrency } from "@/utils/formatUtils";
import { emptyDashboardMetrics } from "@/lib/mockData";

export default function AdminDashboardPage() {
  const [metrics, setMetrics] = useState<DashboardMetrics>(emptyDashboardMetrics);
  const [loading, setLoading] = useState(false);

  const fetchMetrics = () => {
    setLoading(true);
    fetch("/api/metrics")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setMetrics(data.data);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  const { attendanceRate, roiMetrics, fidelizationMap, paymentStatus } = metrics;

  return (
    <div className="space-y-6">
      {/* Cintillo de Título y Filtros Horizontales (Widescreen Toolbar) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <span>Panel de Control & Inteligencia Operativa</span>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-brand-500/20 text-brand-300 border border-brand-500/30">
              Sala Onprotec (Capacidad: 18)
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Métricas de conversión, aforo, rentabilidad ROI e integración de pagos en tiempo real.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchMetrics}
            disabled={loading}
            className="flex items-center gap-2 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-brand-400" : ""}`} />
            <span>Actualizar Métricas</span>
          </button>
        </div>
      </div>

      {/* KPI Cards: Fila Horizontal Compacta de 4 Columnas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: No-Show Rate */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Tasa de No-Show</span>
            <div className="w-8 h-8 rounded-lg bg-red-500/10 text-red-400 flex items-center justify-center">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-white">
              {attendanceRate.noShowRatePercent.toFixed(1)}%
            </span>
            <span className="text-xs text-slate-400">
              ({attendanceRate.totalNoShow} de {attendanceRate.totalConfirmed} confirmados)
            </span>
          </div>
          <div className="mt-2 text-[11px] text-emerald-400 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            <span>Asistencia efectiva: {attendanceRate.attendanceRatePercent.toFixed(1)}%</span>
          </div>
        </div>

        {/* KPI 2: ROI Financiero */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Retorno de Inversión (ROI)</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-400">
              +{roiMetrics.roiPercent.toFixed(1)}%
            </span>
            <span className="text-xs text-slate-400">
              (Neto: {formatCurrency(roiMetrics.netProfit)})
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400">
            Ingresos: <strong className="text-white">{formatCurrency(roiMetrics.totalRevenue)}</strong> vs Costos: {formatCurrency(roiMetrics.totalCosts)}
          </div>
        </div>

        {/* KPI 3: Fidelización / Prospectos Vírgenes */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Oportunidad Cross-Selling</span>
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-white">
              {fidelizationMap.prospectConversionOpportunityPercent.toFixed(1)}%
            </span>
            <span className="text-xs text-slate-400">
              ({fidelizationMap.prospectsCount} prospectos sin compras)
            </span>
          </div>
          <div className="mt-2 text-[11px] text-cyan-300">
            {fidelizationMap.recurringWithoutPurchasesPercent.toFixed(1)}% recurrentes aún sin compra en tienda
          </div>
        </div>

        {/* KPI 4: Validación Pabilo Pay */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Cobrado vía Pabilo Pay</span>
            <div className="w-8 h-8 rounded-lg bg-brand-500/10 text-brand-400 flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-white">
              {formatCurrency(paymentStatus.totalCollectedPabilo)}
            </span>
            <span className="text-xs text-slate-400">
              ({paymentStatus.pabiloApprovedCount} pagos auto)
            </span>
          </div>
          <div className="mt-2 text-[11px] text-amber-400">
            Pendiente por cobrar: {formatCurrency(paymentStatus.totalPending)}
          </div>
        </div>
      </div>

      {/* Gráficos y Desgloses Principales en Rejilla Widescreen (2x2) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico 1: Tasa de Asistencia vs. Inscripción (Funnel No-Show) */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-brand-400" />
                <span>1. Embudo: Inscritos vs. Confirmados vs. Asistentes Reales</span>
              </h2>
              <span className="text-xs text-slate-400">
                Comparativa de aforo para controlar sobrecupos y no-show (Meta: 18 cupos)
              </span>
            </div>
            <span className="text-xs font-mono bg-slate-800 px-2 py-1 rounded text-brand-300">
              Aforo Sala: 18
            </span>
          </div>

          <div className="space-y-4">
            {/* Paso 1: Inscritos Totales */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-300 font-medium">1. Inscritos Totales (Landing Web)</span>
                <span className="text-white font-bold">{attendanceRate.totalRegistered} personas</span>
              </div>
              <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden">
                <div className="bg-slate-600 h-full rounded-full w-full" />
              </div>
            </div>

            {/* Paso 2: Confirmados (Reconfirmación 24h WhatsApp) */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-cyan-300 font-medium">2. Confirmados 24h Antes (WhatsApp / Llamada)</span>
                <span className="text-cyan-400 font-bold">
                  {attendanceRate.totalConfirmed} personas (
                  {((attendanceRate.totalConfirmed / (attendanceRate.totalRegistered || 1)) * 100).toFixed(0)}%)
                </span>
              </div>
              <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden">
                <div
                  className="bg-cyan-500 h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(100, (attendanceRate.totalConfirmed / (attendanceRate.totalRegistered || 1)) * 100)}%`,
                  }}
                />
              </div>
            </div>

            {/* Paso 3: Asistentes Reales en Sala (Check-in) */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-emerald-300 font-medium">3. Asistentes Reales en Sala (Check-in)</span>
                <span className="text-emerald-400 font-bold">
                  {attendanceRate.totalAttended} presentes de 18 cupos
                </span>
              </div>
              <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(100, (attendanceRate.totalAttended / (attendanceRate.totalRegistered || 1)) * 100)}%`,
                  }}
                />
              </div>
            </div>

            {/* Paso 4: No-Show (Confirmaron pero no asistieron) */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-red-300 font-medium">4. No-Show (Confirmaron y Faltaron)</span>
                <span className="text-red-400 font-bold">
                  {attendanceRate.totalNoShow} faltantes ({attendanceRate.noShowRatePercent.toFixed(1)}%)
                </span>
              </div>
              <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden">
                <div
                  className="bg-red-500 h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(100, attendanceRate.noShowRatePercent)}%`,
                  }}
                />
              </div>
            </div>
          </div>

          <div className="mt-4 p-3 bg-slate-950/80 rounded-xl border border-slate-800 text-xs text-slate-400 flex items-center justify-between">
            <span>Diagnóstico de Operación:</span>
            <span className="text-emerald-400 font-semibold">
              Ocupación efectiva de la sala: {((attendanceRate.totalAttended / 18) * 100).toFixed(0)}%
            </span>
          </div>
        </div>

        {/* Gráfico 2: ROI Financiero de la Capacitación */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-400" />
                <span>2. Retorno de Inversión (ROI) y Estructura de Costos</span>
              </h2>
              <span className="text-xs text-slate-400">
                Ingresos cobrados vs. Costos de Publicidad y Logística/Refrigerios
              </span>
            </div>
            <span className="text-xs font-mono bg-emerald-500/20 text-emerald-300 px-2.5 py-1 rounded-full font-bold">
              ROI: +{roiMetrics.roiPercent.toFixed(1)}%
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
              <span className="text-xs text-slate-400 block">Ingresos Cobrados</span>
              <span className="text-xl font-black text-emerald-400 block mt-1">
                {formatCurrency(roiMetrics.totalRevenue)}
              </span>
              <span className="text-[10px] text-slate-500">Por concepto de inscripciones</span>
            </div>

            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
              <span className="text-xs text-slate-400 block">Costos Totales Incurridos</span>
              <span className="text-xl font-black text-red-400 block mt-1">
                {formatCurrency(roiMetrics.totalCosts)}
              </span>
              <span className="text-[10px] text-slate-500">Publicidad + Refrigerios/Material</span>
            </div>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1.5 border-b border-slate-800/80">
              <span className="text-slate-400">Costos de Pauta Publicitaria (Meta/Google Ads):</span>
              <span className="text-white font-semibold">{formatCurrency(roiMetrics.totalAdCosts)}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-800/80">
              <span className="text-slate-400">Costos Asociados (Refrigerios, certificados, logística):</span>
              <span className="text-white font-semibold">{formatCurrency(roiMetrics.totalAssociatedCosts)}</span>
            </div>
            <div className="flex justify-between py-1.5 text-slate-200 font-bold bg-slate-950 px-3 py-2 rounded-lg">
              <span>Ganancia Operativa Neta de la Sala:</span>
              <span className="text-emerald-400 text-sm">{formatCurrency(roiMetrics.netProfit)}</span>
            </div>
          </div>
        </div>

        {/* Gráfico 3: Mapa de Fidelización y Conversión de Hardware */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Target className="w-4 h-4 text-cyan-400" />
                <span>3. Mapa de Fidelización (Asistentes vs. Compras en Tienda)</span>
              </h2>
              <span className="text-xs text-slate-400">
                Identifica cuántos asistentes son prospectos vírgenes para vender equipos Odoo
              </span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 mb-4 text-center">
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
              <span className="text-[11px] text-slate-400 block">Clientes Existentes</span>
              <span className="text-lg font-bold text-emerald-400 block mt-1">
                {fidelizationMap.storeClientsCount}
              </span>
              <span className="text-[10px] text-slate-500">Ya compran en tienda</span>
            </div>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
              <span className="text-[11px] text-cyan-300 block font-medium">Nuevos Prospectos</span>
              <span className="text-lg font-bold text-cyan-400 block mt-1">
                {fidelizationMap.prospectsCount}
              </span>
              <span className="text-[10px] text-slate-500">Sin compras previas</span>
            </div>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
              <span className="text-[11px] text-amber-300 block font-medium">Recurrentes Sin Compra</span>
              <span className="text-lg font-bold text-amber-400 block mt-1">
                {fidelizationMap.recurringWithoutPurchasesPercent.toFixed(0)}%
              </span>
              <span className="text-[10px] text-slate-500">Frecuentes en sala</span>
            </div>
          </div>

          <div className="p-3.5 bg-gradient-to-r from-brand-950/60 to-cyan-950/60 rounded-xl border border-brand-800/40 text-xs">
            <div className="flex items-center gap-2 text-brand-300 font-bold mb-1">
              <ShoppingBag className="w-4 h-4" />
              <span>Oportunidad de Venta Cruzada Comercial</span>
            </div>
            <p className="text-slate-300 leading-relaxed">
              El <strong>{fidelizationMap.prospectConversionOpportunityPercent.toFixed(1)}%</strong> de
              los asistentes son técnicos o empresas que aún no adquieren suministros en la tienda de
              Onprotec. Puedes ofrecerles descuentos en los SKUs de Odoo utilizados durante la
              práctica.
            </p>
          </div>
        </div>

        {/* Gráfico 4: Conciliación de Pagos (Pabilo vs Manual) */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-brand-400" />
                <span>4. Conciliación de Pagos (Pabilo Pay vs. Manual)</span>
              </h2>
              <span className="text-xs text-slate-400">
                Pagos automáticos validados por webhook vs pendientes por conciliar
              </span>
            </div>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
                <div>
                  <span className="font-bold text-white block">Pabilo Pay (Automático)</span>
                  <span className="text-[10px] text-slate-500">
                    Conciliado al instante con API / Webhook
                  </span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-sm font-bold text-cyan-400 block">
                  {formatCurrency(paymentStatus.totalCollectedPabilo)}
                </span>
                <span className="text-[10px] text-slate-400">
                  {paymentStatus.pabiloApprovedCount} transacciones
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                <div>
                  <span className="font-bold text-white block">Pagos Manuales / Caja</span>
                  <span className="text-[10px] text-slate-500">
                    Transferencias o efectivo en sala Onprotec
                  </span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-sm font-bold text-emerald-400 block">
                  {formatCurrency(paymentStatus.totalCollectedManual)}
                </span>
                <span className="text-[10px] text-slate-400">Aprobados por admin</span>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-amber-900/40 bg-amber-950/10">
              <div className="flex items-center gap-2.5">
                <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                <div>
                  <span className="font-bold text-amber-200 block">Pendientes por Cobrar</span>
                  <span className="text-[10px] text-amber-400/80">
                    Inscritos sin comprobante validado
                  </span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-sm font-bold text-amber-400 block">
                  {formatCurrency(paymentStatus.totalPending)}
                </span>
                <span className="text-[10px] text-amber-300">
                  {paymentStatus.pendingCount} personas
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
