import fs from "fs";
import path from "path";
import { google } from "googleapis";

export interface ExtractedFormData {
  fileId: string;
  fileName: string;
  headers: string[];
  rows: Record<string, string>[];
  isPaidTraining: boolean; // true si es "De Cero a UniFi"
}

export class GDriveService {
  private keyFilePath: string;

  constructor() {
    this.keyFilePath = path.join(process.cwd(), "service-account.json");
  }

  /**
   * Verifica si el archivo service-account.json existe en la raíz
   */
  hasServiceAccount(): boolean {
    return fs.existsSync(this.keyFilePath);
  }

  /**
   * Obtiene cliente autenticado con Google APIs
   */
  getAuthClient() {
    if (!this.hasServiceAccount()) {
      throw new Error(
        "No se encontró el archivo 'service-account.json' en la raíz del proyecto. Por favor sigue los pasos para generarlo."
      );
    }

    return new google.auth.GoogleAuth({
      keyFile: this.keyFilePath,
      scopes: [
        "https://www.googleapis.com/auth/drive.readonly",
        "https://www.googleapis.com/auth/spreadsheets.readonly",
        "https://www.googleapis.com/auth/forms.responses.readonly",
      ],
    });
  }

  /**
   * Lista todos los Formularios y Hojas de Cálculo (Spreadsheets) de respuestas en el Drive
   */
  async listFormsAndSheets(): Promise<any[]> {
    const auth = this.getAuthClient();
    const drive = google.drive({ version: "v3", auth });

    // Buscar archivos de tipo Formulario u Hojas de Cálculo
    const res = await drive.files.list({
      q: "mimeType = 'application/vnd.google-apps.spreadsheet' or mimeType = 'application/vnd.google-apps.form'",
      fields: "files(id, name, mimeType, webViewLink, createdTime, modifiedTime)",
      pageSize: 50,
    });

    return res.data.files || [];
  }

  /**
   * Extrae los datos y respuestas de una hoja de cálculo asociada a un Formulario
   */
  async extractSheetResponses(spreadsheetId: string, sheetTitle: string): Promise<ExtractedFormData> {
    const auth = this.getAuthClient();
    const sheets = google.sheets({ version: "v4", auth });

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: "A1:ZZ1000",
    });

    const values = response.data.values || [];
    if (values.length === 0) {
      return {
        fileId: spreadsheetId,
        fileName: sheetTitle,
        headers: [],
        rows: [],
        isPaidTraining: this.isPaidEvent(sheetTitle),
      };
    }

    const headers = values[0].map((h: string) => (h || "").trim());
    const dataRows = values.slice(1);

    const rows: Record<string, string>[] = [];
    for (const row of dataRows) {
      const record: Record<string, string> = {};
      headers.forEach((header: string, index: number) => {
        record[header] = (row[index] || "").trim();
      });
      rows.push(record);
    }

    return {
      fileId: spreadsheetId,
      fileName: sheetTitle,
      headers,
      rows,
      isPaidTraining: this.isPaidEvent(sheetTitle),
    };
  }

  /**
   * Identifica si la capacitación es la cobrada ("De Cero a UniFi")
   */
  isPaidEvent(name: string): boolean {
    const clean = name.toLowerCase();
    return (
      clean.includes("unifi") ||
      clean.includes("de cero a unifi") ||
      clean.includes("cero a unifi")
    );
  }
}

export const gdriveService = new GDriveService();
