import { OdooProduct } from "@/types";
import { initialOdooSkus } from "@/lib/mockData";

export interface OdooConfig {
  url: string;
  db: string;
  username: string;
  apiKey: string;
}

export class OdooService {
  private config: OdooConfig;

  constructor() {
    this.config = {
      url: process.env.ODOO_URL || "https://erp.onprotec.com",
      db: process.env.ODOO_DB || "onprotec_production",
      username: process.env.ODOO_USERNAME || "",
      apiKey: process.env.ODOO_PASSWORD || "",
    };
  }

  /**
   * Extrae y sincroniza el catálogo de productos (SKUs) desde Odoo ERP
   * Conecta vía JSON-RPC / XML-RPC al modelo `product.template` o `product.product`.
   */
  async syncCatalog(filterSkus?: string[]): Promise<{
    success: boolean;
    syncedCount: number;
    products: OdooProduct[];
    error?: string;
  }> {
    try {
      console.log(`[OdooService] Sincronizando catálogo con Odoo ERP en ${this.config.url}...`);

      // Si no hay credenciales activas o estamos en entorno local, retorna el catálogo cacheado
      if (!this.config.apiKey || this.config.apiKey === "test_password" || this.config.apiKey.includes("token")) {
        console.log("[OdooService] Utilizando catálogo simulado/cacheado de Odoo.");
        const products = filterSkus
          ? initialOdooSkus.filter((p) => filterSkus.includes(p.sku))
          : initialOdooSkus;

        return {
          success: true,
          syncedCount: products.length,
          products,
        };
      }

      // En producción con credenciales Odoo:
      // Llamada JSON-RPC a Odoo endpoint /jsonrpc
      const payload = {
        jsonrpc: "2.0",
        method: "call",
        params: {
          service: "object",
          method: "execute_kw",
          args: [
            this.config.db,
            2, // User ID autenticado
            this.config.apiKey,
            "product.template",
            "search_read",
            [
              [
                ["sale_ok", "=", true],
                ...(filterSkus && filterSkus.length > 0
                  ? [["default_code", "in", filterSkus]]
                  : []),
              ],
            ],
            ["id", "name", "default_code", "list_price", "qty_available", "categ_id"],
          ],
        },
      };

      const res = await fetch(`${this.config.url}/jsonrpc`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error(`HTTP Error ${res.status}: ${res.statusText}`);
      }

      const json = await res.json();
      if (json.error) {
        throw new Error(json.error.data?.message || json.error.message);
      }

      const rawProducts = json.result || [];
      const products: OdooProduct[] = rawProducts.map((p: any) => ({
        id: p.id,
        odooId: p.id,
        sku: p.default_code || `SKU-${p.id}`,
        name: p.name,
        listPrice: parseFloat(p.list_price) || 0,
        qtyAvailable: parseFloat(p.qty_available) || 0,
        category: Array.isArray(p.categ_id) ? p.categ_id[1] : "General",
        lastSyncAt: new Date().toISOString(),
      }));

      return {
        success: true,
        syncedCount: products.length,
        products,
      };
    } catch (error: any) {
      console.error("[OdooService] Error en sincronización con Odoo:", error?.message || error);
      return {
        success: false,
        syncedCount: 0,
        products: initialOdooSkus,
        error: error?.message || "Error desconocido en Odoo",
      };
    }
  }
}

export const odooService = new OdooService();
