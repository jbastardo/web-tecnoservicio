/**
 * Motor de Reputación y Prioridad de Cupos para Capacitaciones Gratuitas OnProtec
 * Regla de negocio:
 * - Sala física: 18 puestos + 1 instructor.
 * - Capacitaciones gratuitas: hasta 40 pre-inscritos para reconfirmar a los 18 asistentes.
 * - Prioridad:
 *   1. Clientes Compradores fieles de tienda OnProtec (sin faltas)
 *   2. Nuevos Prospectos que nunca han asistido (captación de nuevos clientes)
 *   3. Asistentes Cumplidores recurrentes (sin faltas)
 *   4. Clientes Compradores con alguna inasistencia previa
 *   5. Incumplidos (1 falta previa) -> evaluar ceder cupo a nuevos prospectos
 *   6. Reincidentes (2+ faltas previas) -> recomendar ceder cupo en capacitaciones gratuitas
 */

export type PriorityTier =
  | "vip_buyer"
  | "new_prospect"
  | "reliable"
  | "buyer_with_noshow"
  | "noshow_warning"
  | "noshow_repeat";

export type PriorityFilter =
  | "all"
  | "new_prospect"
  | "store_client"
  | "reliable"
  | "noshow";

export interface ParticipantPriorityProfile {
  tier: PriorityTier;
  priorityRank: number; // 1 = mayor prioridad, 6 = menor prioridad
  label: string;
  shortLabel: string;
  tooltip: string;
  badgeClass: string;
  attendedCount: number;
  noShowCount: number;
  totalHistoryCount: number;
  isStoreClient: boolean;
  isFirstTimer: boolean;
  isUnreliable: boolean;
  noShowCourses: string[];
}

export function evaluateParticipantPriority(
  participant: any,
  excludeRegistrationId?: number | null
): ParticipantPriorityProfile {
  const allParts: any[] = Array.isArray(participant?.participations)
    ? participant.participations
    : [];

  // Evaluar historial (si se pasa excludeRegistrationId, excluimos la inscripción actual para medir reputación previa;
  // si el registro actual ya está marcado como "No Asistió", también se toma en cuenta cuando no se excluye).
  const history = excludeRegistrationId
    ? allParts.filter((x) => Number(x.registrationId) !== Number(excludeRegistrationId))
    : allParts;

  const attendedCount = history.filter((x) => x.status === "Asistió").length;
  const noShowItems = history.filter((x) => x.status === "No Asistió");
  const noShowCount = noShowItems.length;
  const noShowCourses = noShowItems.map(
    (x) => `${x.trainingCode || `CAP-${x.trainingId}`} (${x.trainingName || "Capacitación"})`
  );

  const isStoreClient = Boolean(
    participant?.hasStorePurchases || Number(participant?.storePurchasesAmount || 0) > 0
  );
  const isFirstTimer = attendedCount === 0 && noShowCount === 0;
  const isUnreliable = noShowCount >= 1;

  const noShowDetail =
    noShowCourses.length > 0 ? ` Faltó en: ${noShowCourses.slice(0, 3).join(", ")}.` : "";

  if (isStoreClient && noShowCount === 0) {
    return {
      tier: "vip_buyer",
      priorityRank: 1,
      label: "👑 Cliente Comprador",
      shortLabel: "👑 Cliente VIP",
      tooltip: `Cliente comprador de OnProtec (${attendedCount} asistencia${attendedCount === 1 ? "" : "s"}, 0 faltas). Prioridad máxima de atención.`,
      badgeClass:
        "bg-emerald-100 text-emerald-900 border-emerald-300 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/40",
      attendedCount,
      noShowCount,
      totalHistoryCount: history.length,
      isStoreClient,
      isFirstTimer,
      isUnreliable: false,
      noShowCourses,
    };
  }

  if (!isStoreClient && isFirstTimer) {
    return {
      tier: "new_prospect",
      priorityRank: 2,
      label: "🌟 Nuevo Prospecto",
      shortLabel: "🌟 Nuevo",
      tooltip:
        "Nunca ha asistido a una capacitación OnProtec y no tiene faltas. Alta prioridad para captar nuevos clientes.",
      badgeClass:
        "bg-sky-100 text-sky-900 border-sky-300 dark:bg-cyan-500/20 dark:text-cyan-300 dark:border-cyan-500/40",
      attendedCount,
      noShowCount,
      totalHistoryCount: history.length,
      isStoreClient,
      isFirstTimer: true,
      isUnreliable: false,
      noShowCourses,
    };
  }

  if (!isStoreClient && attendedCount > 0 && noShowCount === 0) {
    return {
      tier: "reliable",
      priorityRank: 3,
      label: `✅ Cumplidor (${attendedCount})`,
      shortLabel: `✅ Cumplidor`,
      tooltip: `Ha asistido puntualmente a ${attendedCount} capacitación${attendedCount === 1 ? "" : "es"} previa${attendedCount === 1 ? "" : "s"} sin faltas.`,
      badgeClass:
        "bg-teal-100 text-teal-900 border-teal-300 dark:bg-teal-500/20 dark:text-teal-300 dark:border-teal-500/40",
      attendedCount,
      noShowCount,
      totalHistoryCount: history.length,
      isStoreClient,
      isFirstTimer: false,
      isUnreliable: false,
      noShowCourses,
    };
  }

  if (isStoreClient && noShowCount >= 1) {
    return {
      tier: "buyer_with_noshow",
      priorityRank: 4,
      label: `👑 Cliente · ⚠️ ${noShowCount} falta${noShowCount === 1 ? "" : "s"}`,
      shortLabel: `👑⚠️ ${noShowCount}F`,
      tooltip: `Cliente comprador de OnProtec pero registra ${noShowCount} inasistencia${noShowCount === 1 ? "" : "s"}.${noShowDetail} Reconfirmar antes de ceder cupo.`,
      badgeClass:
        "bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/40",
      attendedCount,
      noShowCount,
      totalHistoryCount: history.length,
      isStoreClient,
      isFirstTimer: false,
      isUnreliable: true,
      noShowCourses,
    };
  }

  if (noShowCount === 1) {
    return {
      tier: "noshow_warning",
      priorityRank: 5,
      label: "⚠️ Incumplido (1 falta)",
      shortLabel: "⚠️ 1 Falta",
      tooltip: `Registró 1 inasistencia previa (${attendedCount} asistencia${attendedCount === 1 ? "" : "s"}).${noShowDetail} Evaluar ceder cupo a un Nuevo Prospecto en capacitaciones gratuitas.`,
      badgeClass:
        "bg-orange-100 text-orange-900 border-orange-300 dark:bg-orange-500/20 dark:text-orange-300 dark:border-orange-500/40",
      attendedCount,
      noShowCount,
      totalHistoryCount: history.length,
      isStoreClient,
      isFirstTimer: false,
      isUnreliable: true,
      noShowCourses,
    };
  }

  return {
    tier: "noshow_repeat",
    priorityRank: 6,
    label: `🚫 Reincidente (${noShowCount} faltas)`,
    shortLabel: `🚫 ${noShowCount} Faltas`,
    tooltip: `Persona incumplida reincidente con ${noShowCount} inasistencias (${attendedCount} asistencia${attendedCount === 1 ? "" : "s"}).${noShowDetail} Recomendado ceder su cupo gratuito a un Nuevo Prospecto o Cliente Fiel.`,
    badgeClass:
      "bg-rose-100 text-rose-900 border-rose-300 dark:bg-red-500/20 dark:text-red-300 dark:border-red-500/40",
    attendedCount,
    noShowCount,
    totalHistoryCount: history.length,
    isStoreClient,
    isFirstTimer: false,
    isUnreliable: true,
    noShowCourses,
  };
}

export function matchesPriorityFilter(
  profile: ParticipantPriorityProfile,
  filter: PriorityFilter
): boolean {
  if (filter === "all") return true;
  if (filter === "new_prospect") return profile.tier === "new_prospect";
  if (filter === "store_client") return profile.isStoreClient;
  if (filter === "reliable") return !profile.isUnreliable;
  if (filter === "noshow") return profile.isUnreliable;
  return true;
}
