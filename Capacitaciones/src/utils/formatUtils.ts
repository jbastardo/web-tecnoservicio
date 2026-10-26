/**
 * Utilidades Centralizadas para Marcas Temporales en Zona Horaria Local (America/Caracas, UTC-4)
 * y Formateo Financiero/Monetario para Onprotec.
 * 
 * Regla Obligatoria: Toda vista, Server Action o reporte DEBE convertir explícitamente
 * a la zona horaria 'America/Caracas' (UTC-4) para evitar discrepancias de 4 horas.
 */

const VENEZUELA_TIMEZONE = "America/Caracas";
const LOCALE = "es-VE";

/**
 * Formatea una fecha a cadena local completa: "dd/MM/yyyy, hh:mm:ss a"
 * Ej: "26/10/2026, 04:15:30 p. m."
 */
export function fmtLocalTime(dateInput: string | number | Date | null | undefined): string {
  if (!dateInput) return "N/D";
  const date = typeof dateInput === "string" || typeof dateInput === "number" ? new Date(dateInput) : dateInput;
  if (isNaN(date.getTime())) return "Fecha inválida";

  return new Intl.DateTimeFormat(LOCALE, {
    timeZone: VENEZUELA_TIMEZONE,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  }).format(date);
}

/**
 * Formatea únicamente la fecha: "dd/MM/yyyy"
 */
export function fmtLocalDate(dateInput: string | number | Date | null | undefined): string {
  if (!dateInput) return "N/D";
  const date = typeof dateInput === "string" || typeof dateInput === "number" ? new Date(dateInput) : dateInput;
  if (isNaN(date.getTime())) return "Fecha inválida";

  return new Intl.DateTimeFormat(LOCALE, {
    timeZone: VENEZUELA_TIMEZONE,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

/**
 * Formatea únicamente la hora: "hh:mm a"
 */
export function fmtLocalHour(dateInput: string | number | Date | null | undefined): string {
  if (!dateInput) return "N/D";
  const date = typeof dateInput === "string" || typeof dateInput === "number" ? new Date(dateInput) : dateInput;
  if (isNaN(date.getTime())) return "Hora inválida";

  return new Intl.DateTimeFormat(LOCALE, {
    timeZone: VENEZUELA_TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}

/**
 * Formatea tiempo relativo o local inteligente
 */
export function fmtRelativeOrLocalTime(dateInput: string | number | Date | null | undefined): string {
  if (!dateInput) return "Nunca";
  const date = typeof dateInput === "string" || typeof dateInput === "number" ? new Date(dateInput) : dateInput;
  if (isNaN(date.getTime())) return "Fecha inválida";

  const diffMs = Date.now() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHours = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMin < 1) return "Justo ahora";
  if (diffMin < 60) return `Hace ${diffMin} min`;
  if (diffHours < 24) return `Hoy ${fmtLocalHour(date)} (hace ${diffHours}h)`;
  if (diffDays === 1) return `Ayer ${fmtLocalHour(date)}`;

  return fmtLocalTime(date);
}

/**
 * Formateador de moneda en USD ($) o Bolívares (Bs.)
 */
export function formatCurrency(amount: number | string | null | undefined, currency: "USD" | "BS" = "USD"): string {
  const numericAmount = typeof amount === "string" ? parseFloat(amount) : (amount ?? 0);
  const safeAmount = isNaN(numericAmount) ? 0 : numericAmount;

  if (currency === "BS") {
    return `Bs. ${new Intl.NumberFormat("es-VE", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(safeAmount)}`;
  }

  return `$${new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(safeAmount)}`;
}
