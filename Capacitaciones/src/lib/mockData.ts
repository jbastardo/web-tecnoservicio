import {
  Training,
  Participant,
  Registration,
  OdooProduct,
  DashboardMetrics,
  Survey,
  FormQuestion,
  SurveyQuestion,
  AdminUser,
} from "@/types";
import realForms from "./realFormsData.json";
import realOdooProducts from "./odooSampleProducts.json";

// =============================================================================
// PLANTILLAS DE PREGUNTAS POR DEFECTO (FORMULARIO Y ENCUESTA FINAL)
// =============================================================================

export const defaultFormQuestions: FormQuestion[] = [
  {
    id: "cargo",
    label: "Cargo o Rol Técnico en su Empresa",
    placeholder: "Ej. Integrador CCTV, Gerente de Proyectos, Instalador...",
    type: "text",
    required: false,
  },
  {
    id: "experienceLevel",
    label: "Nivel de experiencia con la marca / tecnología",
    type: "select",
    options: [
      "Básico / Iniciación",
      "Intermedio (Instalación y Configuración)",
      "Avanzado / Certificado",
      "Comercial / Ventas Técnicas",
    ],
    required: true,
  },
  {
    id: "referralSource",
    label: "¿Cómo te enteraste de esta capacitación OnProtec?",
    type: "select",
    options: [
      "Instagram (@onprotec)",
      "WhatsApp / Asesor de Ventas",
      "Página Web (www.onprotec.com)",
      "Recomendación de Colega",
      "Correo Electrónico",
    ],
    required: false,
  },
  {
    id: "specialExpectations",
    label: "¿Qué tema o necesidad puntual te gustaría resolver en esta sesión?",
    placeholder: "Escribe tu consulta o proyecto actual...",
    type: "textarea",
    required: false,
  },
];

export const defaultSurveyQuestions: SurveyQuestion[] = [
  {
    id: "ratingInstructor",
    label: "1. Dominio técnico, claridad y pedagogía del Instructor (1 a 5)",
    type: "rating",
    required: true,
  },
  {
    id: "ratingContent",
    label: "2. Calidad del contenido técnico y laboratorios prácticos (1 a 5)",
    type: "rating",
    required: true,
  },
  {
    id: "ratingFacilities",
    label: "3. Comodidad y atención en la Sala de Capacitaciones OnProtec (1 a 5)",
    type: "rating",
    required: true,
  },
  {
    id: "recommendationScore",
    label: "4. ¿Qué tan probable es que recomiendes las capacitaciones de OnProtec a un colega? (0 a 10)",
    type: "nps",
    required: true,
  },
  {
    id: "mostLiked",
    label: "5. ¿Qué fue lo que más te gustó de la capacitación?",
    type: "textarea",
    required: false,
  },
  {
    id: "hasActiveProjects",
    label: "6. ¿Tienes actualmente proyectos activos donde requieras cotizar equipos en OnProtec?",
    type: "select",
    options: [
      "Sí, requiero cotización inmediata con mi asesor",
      "Sí, a mediano plazo (próximos 30 días)",
      "Por ahora solo actualización técnica",
    ],
    required: true,
  },
  {
    id: "suggestions",
    label: "7. ¿Qué próximos cursos, marcas o certificaciones te gustaría ver en OnProtec?",
    type: "textarea",
    required: false,
  },
];

export const defaultAdminUsers: AdminUser[] = [
  {
    id: 1,
    username: "admin",
    email: "admin@onprotec.com",
    name: "Juan Carlos Bastardo",
    role: "Super Admin",
    department: "Gerencia de Tecnología OnProtec",
    password: "Onprotec2026*",
    isActive: true,
    lastLoginAt: "2026-10-28T16:00:00-04:00",
    createdAt: "2026-01-15T12:00:00Z",
  },
  {
    id: 2,
    username: "gerencia",
    email: "gerencia@onprotec.com",
    name: "Carlos Martins",
    role: "Gerencia General",
    department: "Gerencia General OnProtec",
    password: "Onprotec2026*",
    isActive: true,
    lastLoginAt: null,
    createdAt: "2026-01-15T12:00:00Z",
  },
  {
    id: 3,
    username: "operaciones",
    email: "operaciones@onprotec.com",
    name: "Julio Subero",
    role: "Coordinador de Sala",
    department: "Jefatura de Operaciones OnProtec",
    password: "Onprotec2026*",
    isActive: true,
    lastLoginAt: null,
    createdAt: "2026-01-15T12:00:00Z",
  },
  {
    id: 4,
    username: "capacitacion",
    email: "cursos@onprotec.com",
    name: "Coordinación Sala OnProtec",
    role: "Coordinador de Sala",
    department: "Sala de Capacitaciones (18 + 1)",
    password: "Sala2026*",
    isActive: true,
    lastLoginAt: null,
    createdAt: "2026-02-01T12:00:00Z",
  },
];

// =============================================================================
// DATOS REALES EXTRAÍDOS DE FORMULARIOS GOOGLE Y ODOO (ONPROTEC)
// =============================================================================

export const initialTrainings: Training[] = (realForms.trainings as any[]) || [];
export const initialParticipants: Participant[] = (realForms.participants as any[]) || [];
export const initialRegistrations: Registration[] = (realForms.registrations as any[]) || [];
export const initialSurveys: Survey[] = (realForms.surveys as any[]) || [];
export const initialAdminUsers: AdminUser[] =
  ((realForms as any).adminUsers as AdminUser[]) || [...defaultAdminUsers];
export const initialOdooSkus: OdooProduct[] = (realOdooProducts as any[]) || [];

export async function persistDataset(): Promise<void> {
  try {
    const fs = await import("fs");
    const path = await import("path");
    const filePath = path.join(process.cwd(), "src", "lib", "realFormsData.json");
    const payload = {
      trainings: initialTrainings,
      participants: initialParticipants,
      registrations: initialRegistrations,
      surveys: initialSurveys,
      adminUsers: initialAdminUsers,
    };
    fs.writeFileSync(filePath, JSON.stringify(payload, null, 2), "utf-8");
  } catch (err) {
    console.warn("[persistDataset] No se pudo escribir en realFormsData.json:", err);
  }
}

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
