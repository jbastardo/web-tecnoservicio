import {
  Training,
  Participant,
  Registration,
  Survey,
  AdminUser,
} from "@/types";
import realForms from "./realFormsData.json";
export * from "./constants";

export const initialTrainings: Training[] = (realForms.trainings as any[]) || [];
export const initialParticipants: Participant[] = (realForms.participants as any[]) || [];
export const initialRegistrations: Registration[] = (realForms.registrations as any[]) || [];
export const initialSurveys: Survey[] = (realForms.surveys as any[]) || [];
export const initialAdminUsers: AdminUser[] = (realForms as any).adminUsers || [];

// Fallback no-op en caso de invocación no server
export async function persistDataset(): Promise<void> {
  // En servidor, las rutas API usan serverStorage.ts
}
