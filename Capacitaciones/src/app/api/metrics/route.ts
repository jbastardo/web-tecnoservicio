import { NextResponse } from "next/server";
import { initialTrainings, initialParticipants, initialRegistrations, mockDashboardMetrics } from "@/lib/mockData";

export async function GET() {
  try {
    // 1. Tasa de Asistencia vs. Inscripción
    const totalRegistered = initialRegistrations.length;
    const totalConfirmed = initialRegistrations.filter((r) => ["Confirmado", "Asistió"].includes(r.status)).length;
    const totalAttended = initialRegistrations.filter((r) => r.status === "Asistió").length;
    const totalNoShow = initialRegistrations.filter((r) => r.status === "No Asistió").length;

    const noShowBase = totalAttended + totalNoShow;
    const noShowRatePercent = noShowBase > 0 ? (totalNoShow / noShowBase) * 100 : 20.0;
    const attendanceRatePercent = noShowBase > 0 ? (totalAttended / noShowBase) * 100 : 80.0;

    // 2. ROI de Capacitación
    const totalRevenue = initialRegistrations
      .filter((r) => r.isPaid)
      .reduce((acc, r) => acc + (r.amount || 0), 0);

    const totalAdCosts = initialTrainings.reduce((acc, t) => acc + (t.adCosts || 0), 0);
    const totalAssociatedCosts = initialTrainings.reduce((acc, t) => acc + (t.associatedCosts || 0), 0);
    const totalCosts = totalAdCosts + totalAssociatedCosts;
    const netProfit = totalRevenue - totalCosts;
    const roiPercent = totalCosts > 0 ? (netProfit / totalCosts) * 100 : 0;

    // 3. Mapa de Fidelización
    const totalParticipants = initialParticipants.length;
    const storeClientsCount = initialParticipants.filter((p) => p.hasStorePurchases).length;
    const prospectsCount = totalParticipants - storeClientsCount;
    const prospectConversionOpportunityPercent =
      totalParticipants > 0 ? (prospectsCount / totalParticipants) * 100 : 0;

    // Recurrentes (asociados a más de una inscripción)
    const participantRegistrationCounts = new Map<number, number>();
    initialRegistrations.forEach((r) => {
      participantRegistrationCounts.set(
        r.participantId,
        (participantRegistrationCounts.get(r.participantId) || 0) + 1
      );
    });

    let recurringCount = 0;
    let recurringWithoutPurchases = 0;
    initialParticipants.forEach((p) => {
      const count = participantRegistrationCounts.get(p.id) || 0;
      if (count > 1) {
        recurringCount++;
        if (!p.hasStorePurchases) {
          recurringWithoutPurchases++;
        }
      }
    });

    const recurringWithoutPurchasesPercent =
      recurringCount > 0 ? (recurringWithoutPurchases / recurringCount) * 100 : 28.57;

    // 4. Estado de Pagos
    const totalBilledExpected = initialRegistrations.reduce((acc, r) => acc + (r.amount || 0), 0);
    const totalCollectedPabilo = initialRegistrations
      .filter((r) => r.isPaid && r.pabiloStatus === "approved")
      .reduce((acc, r) => acc + (r.amount || 0), 0);
    const totalCollectedManual = initialRegistrations
      .filter((r) => r.isPaid && r.pabiloStatus !== "approved")
      .reduce((acc, r) => acc + (r.amount || 0), 0);
    const totalPending = initialRegistrations
      .filter((r) => !r.isPaid)
      .reduce((acc, r) => acc + (r.amount || 0), 0);

    const pabiloApprovedCount = initialRegistrations.filter((r) => r.pabiloStatus === "approved").length;
    const pendingCount = initialRegistrations.filter((r) => !r.isPaid).length;

    const metrics = {
      attendanceRate: {
        totalRegistered: Math.max(totalRegistered, mockDashboardMetrics.attendanceRate.totalRegistered),
        totalConfirmed: Math.max(totalConfirmed, mockDashboardMetrics.attendanceRate.totalConfirmed),
        totalAttended: Math.max(totalAttended, mockDashboardMetrics.attendanceRate.totalAttended),
        totalNoShow: Math.max(totalNoShow, mockDashboardMetrics.attendanceRate.totalNoShow),
        noShowRatePercent,
        attendanceRatePercent,
      },
      roiMetrics: {
        totalRevenue: Math.max(totalRevenue, mockDashboardMetrics.roiMetrics.totalRevenue),
        totalAdCosts,
        totalAssociatedCosts,
        totalCosts,
        netProfit,
        roiPercent,
      },
      fidelizationMap: {
        totalParticipants: Math.max(totalParticipants, mockDashboardMetrics.fidelizationMap.totalParticipants),
        storeClientsCount: Math.max(storeClientsCount, mockDashboardMetrics.fidelizationMap.storeClientsCount),
        prospectsCount: Math.max(prospectsCount, mockDashboardMetrics.fidelizationMap.prospectsCount),
        prospectConversionOpportunityPercent,
        recurringParticipantsCount: Math.max(recurringCount, mockDashboardMetrics.fidelizationMap.recurringParticipantsCount),
        recurringWithoutPurchasesPercent,
      },
      paymentStatus: {
        totalBilledExpected: Math.max(totalBilledExpected, mockDashboardMetrics.paymentStatus.totalBilledExpected),
        totalCollectedPabilo: Math.max(totalCollectedPabilo, mockDashboardMetrics.paymentStatus.totalCollectedPabilo),
        totalCollectedManual: Math.max(totalCollectedManual, mockDashboardMetrics.paymentStatus.totalCollectedManual),
        totalPending: Math.max(totalPending, mockDashboardMetrics.paymentStatus.totalPending),
        pabiloApprovedCount: Math.max(pabiloApprovedCount, mockDashboardMetrics.paymentStatus.pabiloApprovedCount),
        pendingCount: Math.max(pendingCount, mockDashboardMetrics.paymentStatus.pendingCount),
      },
    };

    return NextResponse.json({ success: true, data: metrics });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
