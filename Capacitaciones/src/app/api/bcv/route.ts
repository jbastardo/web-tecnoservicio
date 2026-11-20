import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

async function fetchJsonWithTimeout(url: string, timeoutMs = 6000): Promise<any> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      cache: "no-store",
      signal: controller.signal,
      headers: { Accept: "application/json" },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

export async function GET() {
  // 1. Fuente principal: DolarAPI Oficial BCV Venezuela
  try {
    const data = await fetchJsonWithTimeout("https://ve.dolarapi.com/v1/dolares/oficial");
    const rate = Number(data?.promedio ?? data?.venta ?? data?.compra);
    if (Number.isFinite(rate) && rate > 0) {
      return NextResponse.json({
        success: true,
        rate,
        updatedAt: data?.fechaActualizacion || new Date().toISOString(),
        source: "BCV Oficial (dolarapi)",
      });
    }
  } catch (err) {
    console.warn("[BCV API] Falló ve.dolarapi.com:", err);
  }

  // 2. Respaldo secundario: PyDolarVE BCV
  try {
    const data = await fetchJsonWithTimeout("https://pydolarve.org/api/v1/dollar?page=bcv");
    const rate = Number(data?.monitors?.usd?.price);
    if (Number.isFinite(rate) && rate > 0) {
      return NextResponse.json({
        success: true,
        rate,
        updatedAt: data?.datetime?.date || new Date().toISOString(),
        source: "BCV Oficial (pydolarve)",
      });
    }
  } catch (err) {
    console.warn("[BCV API] Falló pydolarve.org:", err);
  }

  // 3. Respaldo terciario: Open ExchangeRate VES
  try {
    const data = await fetchJsonWithTimeout("https://open.er-api.com/v6/latest/USD");
    const rate = Number(data?.rates?.VES);
    if (Number.isFinite(rate) && rate > 0) {
      return NextResponse.json({
        success: true,
        rate,
        updatedAt: data?.time_last_update_utc || new Date().toISOString(),
        source: "Tasa Referencial VES (open.er-api)",
      });
    }
  } catch (err) {
    console.warn("[BCV API] Falló open.er-api.com:", err);
  }

  return NextResponse.json(
    {
      success: false,
      error: "No fue posible consultar la tasa oficial BCV en este momento. Intenta refrescar nuevamente.",
    },
    { status: 503 }
  );
}
