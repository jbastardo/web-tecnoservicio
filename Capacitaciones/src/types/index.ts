/**
 * Tipos y Modelos de Dominio para Onprotec Capacitaciones
 * Sala de Capacitaciones: Aforo Máximo = 18 Participantes + 1 Instructor
 */

export type TrainingType = "Curso" | "Workshop" | "Certificación" | "Interno" | "Otros";

export type TrainingStatus =
  | "Planificado"
  | "En Publicidad"
  | "Cupos Llenos"
  | "En Curso"
  | "Finalizado"
  | "Cancelado";

export type RegistrationStatus =
  | "Inscrito"
  | "Confirmado"
  | "Asistió"
  | "No Asistió"
  | "Lista de Espera"
  | "Cancelado";

export type PaymentCurrency = "USD" | "BS";

export type PabiloStatus = "pending" | "approved" | "rejected" | "manual";

export interface Training {
  id: number;
  name: string;
  code: string;
  type: TrainingType;
  instructor: string;
  eventDate: string; // ISO String (America/Caracas presentation)
  adStartDate: string | null;
  adCosts: number; // Costos de Publicidad
  associatedCosts: number; // Refrigerios, logística, materiales
  maxCapacity: number; // 18 cupos
  instructorCapacity: number; // 1
  relatedSkus: string[]; // SKUs de Odoo vinculados
  price: number;
  currency: PaymentCurrency;
  status: TrainingStatus;
  surveyUrl: string | null;
  surveyQrCode: string | null;
  description?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface Participant {
  id: number;
  name: string;
  docType: "V" | "E" | "J" | "G" | "P";
  docNumber?: string | null; // Cédula o RIF
  phone: string; // WhatsApp
  email: string;
  hasStorePurchases: boolean; // Historial de compras en tienda Onprotec
  storePurchasesAmount: number; // Monto acumulado en tienda ($)
  company?: string | null;
  cargo?: string | null;
  city?: string | null;
  experienceLevel?: string | null;
  referralSource?: string | null;
  allowsContact?: boolean;
  notes?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface Registration {
  id: number;
  trainingId: number;
  participantId: number;
  status: RegistrationStatus;
  confirmationDate: string | null; // 24h antes
  amount: number;
  currency: PaymentCurrency;
  isPaid: boolean; // Cobrado (Sí / No)
  paymentDate: string | null;
  paymentMethod: string | null; // Pabilo, Binance USDT, Transferencia, Pago Móvil, Efectivo
  paymentReference: string | null;
  pabiloTransactionId: string | null;
  pabiloStatus: PabiloStatus;
  invoiceNumber: string | null; // Control de Factura o Nota de Entrega
  paymentProofUrl: string | null;
  paymentNotes?: string | null;
  specialNotes?: string | null;
  experienceLevel?: string | null;
  originalFormName?: string | null;
  formSubmittedAt?: string | null;
  reminderSentAt: string | null;
  surveySentAt: string | null;
  checkInAt: string | null;
  createdAt?: string;
  updatedAt?: string;

  // Relaciones pobladas (Joins)
  training?: Training;
  participant?: Participant;
}

export interface Survey {
  id: number;
  trainingId: number;
  participantId?: number | null;
  participantName?: string | null;
  company?: string | null;
  cargo?: string | null;
  ratingInstructor?: number | null;
  ratingContent?: number | null;
  ratingFacilities?: number | null;
  recommendationScore?: number | null;
  feedback?: string | null;
  mostLiked?: string | null;
  suggestions?: string | null;
  wantsFutureCertifications?: string | null;
  hasActiveProjects?: string | null;
  submittedAt?: string | null;
  createdAt?: string;
}

export interface OdooProduct {
  id: number;
  odooId: number;
  sku: string;
  name: string;
  listPrice: number;
  qtyAvailable: number;
  category: string;
  lastSyncAt: string;
}

export interface DashboardMetrics {
  // 1. Tasa de Asistencia vs. Inscripción (No-show rate)
  attendanceRate: {
    totalRegistered: number;
    totalConfirmed: number;
    totalAttended: number;
    totalNoShow: number;
    noShowRatePercent: number; // Ej: 35 inscritos vs 20 confirmados vs 15 asistieron
    attendanceRatePercent: number;
  };

  // 2. ROI de Capacitación
  roiMetrics: {
    totalRevenue: number; // Ingresos cobrados por inscripciones
    totalAdCosts: number; // Costos de Publicidad
    totalAssociatedCosts: number; // Refrigerios, logística, etc.
    totalCosts: number; // Publicidad + Asociados
    netProfit: number; // Ingresos - Costos
    roiPercent: number; // (Ingresos - Costos) / Costos * 100
  };

  // 3. Mapa de Fidelización
  fidelizationMap: {
    totalParticipants: number;
    storeClientsCount: number; // Clientes con compras previas en tienda
    prospectsCount: number; // Asistentes que NO han comprado en tienda
    prospectConversionOpportunityPercent: number; // % prospectos vírgenes para ventas cruzadas
    recurringParticipantsCount: number; // Participantes con más de 1 curso
    recurringWithoutPurchasesPercent: number; // Asistentes recurrentes que NO han comprado en tienda
  };

  // 4. Estado de Pagos
  paymentStatus: {
    totalBilledExpected: number;
    totalCollectedPabilo: number; // Validados automáticamente por Pabilo
    totalCollectedManual: number; // Validados manualmente (efectivo/transferencia)
    totalPending: number; // Montos pendientes por cobrar
    pabiloApprovedCount: number;
    pendingCount: number;
  };
}
