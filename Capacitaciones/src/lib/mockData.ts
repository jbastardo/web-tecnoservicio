import { Training, Participant, Registration, OdooProduct, DashboardMetrics, Survey } from "@/types";
import realForms from "./realFormsData.json";
import realOdooProducts from "./odooSampleProducts.json";

// =============================================================================
// DATOS REALES EXTRAÍDOS DE FORMULARIOS GOOGLE Y ODOO (ONPROTEC)
// =============================================================================

export const initialTrainings: Training[] = (realForms.trainings as any[]) || [];
export const initialParticipants: Participant[] = (realForms.participants as any[]) || [];
export const initialRegistrations: Registration[] = (realForms.registrations as any[]) || [];
export const initialSurveys: Survey[] = (realForms.surveys as any[]) || [];
export const initialOdooSkus: OdooProduct[] = (realOdooProducts as any[]) || [];

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
