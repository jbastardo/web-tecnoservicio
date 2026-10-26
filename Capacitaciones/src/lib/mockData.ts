import { Training, Participant, Registration, OdooProduct, DashboardMetrics } from "@/types";

// =============================================================================
// DATOS REALES LIMPIOS (Eliminados datos de muestra ficticios)
// =============================================================================

// La única capacitación cobrada realizada hasta la fecha es "De Cero a UniFi"
export const initialTrainings: Training[] = [
  {
    id: 1,
    name: "De Cero a UniFi: Redes Inalámbricas y Routing Corporativo",
    code: "CAP-UNIFI-01",
    type: "Curso",
    instructor: "Ing. Especialista Onprotec",
    eventDate: "2026-10-15T13:00:00.000Z", // Hora de referencia local Caracas
    adStartDate: null,
    adCosts: 0.0,
    associatedCosts: 0.0,
    maxCapacity: 18,
    instructorCapacity: 1,
    relatedSkus: ["UACC-G4-INS", "U6-PLUS", "USW-24-POE"],
    price: 35.0, // Capacitación cobrada
    currency: "USD",
    status: "Finalizado",
    surveyUrl: "https://capacitacion.tutecnoservicio.com/encuesta/1",
    surveyQrCode: null,
    description: "Configuración integral de controladores UniFi Network, adopción de APs, switches PoE, VLANs y portales cautivos.",
  },
];

export const initialParticipants: Participant[] = [];

export const initialRegistrations: Registration[] = [];

export const initialOdooSkus: OdooProduct[] = [];

export const emptyDashboardMetrics: DashboardMetrics = {
  attendanceRate: {
    totalRegistered: 0,
    totalConfirmed: 0,
    totalAttended: 0,
    totalNoShow: 0,
    noShowRatePercent: 0,
    attendanceRatePercent: 0,
  },
  roiMetrics: {
    totalRevenue: 0,
    totalAdCosts: 0,
    totalAssociatedCosts: 0,
    totalCosts: 0,
    netProfit: 0,
    roiPercent: 0,
  },
  fidelizationMap: {
    totalParticipants: 0,
    storeClientsCount: 0,
    prospectsCount: 0,
    prospectConversionOpportunityPercent: 0,
    recurringParticipantsCount: 0,
    recurringWithoutPurchasesPercent: 0,
  },
  paymentStatus: {
    totalBilledExpected: 0,
    totalCollectedPabilo: 0,
    totalCollectedManual: 0,
    totalPending: 0,
    pabiloApprovedCount: 0,
    pendingCount: 0,
  },
};
