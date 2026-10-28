import {
  pgTable,
  serial,
  varchar,
  text,
  integer,
  numeric,
  boolean,
  timestamp,
  jsonb,
  index,
} from "drizzle-orm/pg-core";
import { FormQuestion, SurveyQuestion } from "@/types";

// =============================================================================
// TABLA 1: CAPACITACIONES / EVENTOS
// Aforo Máximo Estricto: 18 participantes + 1 instructor
// =============================================================================
export const trainings = pgTable(
  "trainings",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    code: varchar("code", { length: 50 }).notNull().unique(),
    type: varchar("type", { length: 50 }).notNull(), // 'Curso', 'Workshop', 'Certificación', 'Interno', 'Otros'
    brand: varchar("brand", { length: 100 }), // Marca aliada: Dahua, Hikvision, TP-Link, Ubiquiti, OnProtec, etc.
    instructor: varchar("instructor", { length: 255 }).notNull(),
    eventDate: timestamp("event_date", { withTimezone: true }).notNull(),
    adStartDate: timestamp("ad_start_date", { withTimezone: true }),
    adCosts: numeric("ad_costs", { precision: 12, scale: 2 }).default("0.00").notNull(),
    associatedCosts: numeric("associated_costs", { precision: 12, scale: 2 }).default("0.00").notNull(), // Refrigerios, logística, materiales
    maxCapacity: integer("max_capacity").default(18).notNull(), // Sala Onprotec: 18 cupos
    instructorCapacity: integer("instructor_capacity").default(1).notNull(),
    relatedSkus: jsonb("related_skus").$type<string[]>().default([]).notNull(), // SKUs de Odoo
    price: numeric("price", { precision: 12, scale: 2 }).default("0.00").notNull(),
    currency: varchar("currency", { length: 10 }).default("USD").notNull(), // 'USD' o 'BS'
    status: varchar("status", { length: 50 }).default("Planificado").notNull(),
    surveyUrl: text("survey_url"),
    surveyQrCode: text("survey_qr_code"),
    description: text("description"),
    presentationNotes: text("presentation_notes"), // Nota para la presentación
    coverImageUrl: text("cover_image_url"), // Foto principal para la portada
    coverPhotos: jsonb("cover_photos").$type<string[]>().default([]).notNull(), // Galería de fotos para portada
    formQuestions: jsonb("form_questions").$type<FormQuestion[]>().default([]).notNull(), // Preguntas del formulario de inscripción
    surveyQuestions: jsonb("survey_questions").$type<SurveyQuestion[]>().default([]).notNull(), // Preguntas de la encuesta final
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    statusIdx: index("idx_trainings_status").on(table.status),
    eventDateIdx: index("idx_trainings_event_date").on(table.eventDate),
  })
);

// =============================================================================
// TABLA 2: PARTICIPANTES (CLIENTES / PROSPECTOS)
// Historial de compras en tienda y datos de contacto
// =============================================================================
export const participants = pgTable(
  "participants",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    docType: varchar("doc_type", { length: 10 }).default("V").notNull(), // V, E, J, G, P
    docNumber: varchar("doc_number", { length: 50 }), // Cédula/RIF (opcional en algunos formularios)
    phone: varchar("phone", { length: 50 }).notNull(), // WhatsApp normalizado (+58...)
    email: varchar("email", { length: 255 }).notNull(),
    hasStorePurchases: boolean("has_store_purchases").default(false).notNull(), // Booleano compra previa
    storePurchasesAmount: numeric("store_purchases_amount", { precision: 12, scale: 2 }).default("0.00").notNull(), // Monto $
    company: varchar("company", { length: 255 }),
    cargo: varchar("cargo", { length: 150 }), // Cargo / Rol profesional
    city: varchar("city", { length: 150 }), // Estado / Ciudad
    experienceLevel: varchar("experience_level", { length: 150 }), // Nivel de experiencia técnica
    referralSource: varchar("referral_source", { length: 150 }), // ¿Cómo se enteró de la capacitación?
    allowsContact: boolean("allows_contact").default(true).notNull(), // Autorización contacto WhatsApp/Email
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    docNumberIdx: index("idx_participants_doc_number").on(table.docNumber),
    phoneIdx: index("idx_participants_phone").on(table.phone),
    emailIdx: index("idx_participants_email").on(table.email),
  })
);

// =============================================================================
// TABLA 3: INSCRIPCIONES (TABLA PIVOTE CON CONTROL FINANCIERO Y ASISTENCIA)
// =============================================================================
export const registrations = pgTable(
  "registrations",
  {
    id: serial("id").primaryKey(),
    trainingId: integer("training_id")
      .references(() => trainings.id, { onDelete: "cascade" })
      .notNull(),
    participantId: integer("participant_id")
      .references(() => participants.id, { onDelete: "cascade" })
      .notNull(),
    status: varchar("status", { length: 50 }).default("Inscrito").notNull(), // 'Inscrito', 'Confirmado', 'Asistió', 'No Asistió', 'Lista de Espera', 'Cancelado'
    confirmationDate: timestamp("confirmation_date", { withTimezone: true }), // ~24h antes
    amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
    currency: varchar("currency", { length: 10 }).default("USD").notNull(), // BS o $
    isPaid: boolean("is_paid").default(false).notNull(), // Cobrado: Sí / No
    paymentDate: timestamp("payment_date", { withTimezone: true }),
    paymentMethod: varchar("payment_method", { length: 50 }), // Pabilo, Binance USDT, Transferencia, Pago Móvil, Efectivo
    paymentReference: varchar("payment_reference", { length: 100 }),
    pabiloTransactionId: varchar("pabilo_transaction_id", { length: 100 }),
    pabiloStatus: varchar("pabilo_status", { length: 50 }).default("pending").notNull(), // pending, approved, rejected, manual
    invoiceNumber: varchar("invoice_number", { length: 100 }), // Control Factura / Nota de Entrega
    paymentProofUrl: text("payment_proof_url"),
    paymentNotes: text("payment_notes"),
    specialNotes: text("special_notes"),
    experienceLevel: varchar("experience_level", { length: 150 }),
    customAnswers: jsonb("custom_answers").$type<Record<string, any>>().default({}).notNull(),
    originalFormName: varchar("original_form_name", { length: 255 }),
    formSubmittedAt: timestamp("form_submitted_at", { withTimezone: true }),
    reminderSentAt: timestamp("reminder_sent_at", { withTimezone: true }),
    surveySentAt: timestamp("survey_sent_at", { withTimezone: true }),
    checkInAt: timestamp("check_in_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    trainingIdIdx: index("idx_registrations_training_id").on(table.trainingId),
    participantIdIdx: index("idx_registrations_participant_id").on(table.participantId),
    statusIdx: index("idx_registrations_status").on(table.status),
    pabiloTxIdx: index("idx_registrations_pabilo_tx").on(table.pabiloTransactionId),
  })
);

// =============================================================================
// TABLA 4: CATÁLOGO DE PRODUCTOS / SKUS DE ODOO (CACHE)
// =============================================================================
export const odooProducts = pgTable(
  "odoo_products",
  {
    id: serial("id").primaryKey(),
    odooId: integer("odoo_id").unique().notNull(),
    sku: varchar("sku", { length: 100 }).unique().notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    listPrice: numeric("list_price", { precision: 12, scale: 2 }).default("0.00").notNull(),
    qtyAvailable: numeric("qty_available", { precision: 12, scale: 2 }).default("0.00").notNull(),
    category: varchar("category", { length: 100 }),
    lastSyncAt: timestamp("last_sync_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    skuIdx: index("idx_odoo_products_sku").on(table.sku),
  })
);

// =============================================================================
// TABLA 5: ENCUESTAS DE SATISFACCIÓN (POST-EVENTO / QR)
// =============================================================================
export const surveys = pgTable(
  "surveys",
  {
    id: serial("id").primaryKey(),
    trainingId: integer("training_id")
      .references(() => trainings.id, { onDelete: "cascade" })
      .notNull(),
    participantId: integer("participant_id").references(() => participants.id, {
      onDelete: "set null",
    }),
    participantName: varchar("participant_name", { length: 255 }),
    company: varchar("company", { length: 255 }),
    cargo: varchar("cargo", { length: 150 }),
    ratingInstructor: integer("rating_instructor").default(5), // 1 - 5
    ratingContent: integer("rating_content").default(5), // 1 - 5
    ratingFacilities: integer("rating_facilities").default(5), // 1 - 5 (Sala Onprotec)
    recommendationScore: integer("recommendation_score").default(10), // NPS 1 - 10
    feedback: text("feedback"),
    mostLiked: text("most_liked"),
    suggestions: text("suggestions"),
    wantsFutureCertifications: text("wants_future_certifications"),
    hasActiveProjects: text("has_active_projects"),
    customAnswers: jsonb("custom_answers").$type<Record<string, any>>().default({}).notNull(),
    submittedAt: timestamp("submitted_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    trainingSurveyIdx: index("idx_surveys_training_id").on(table.trainingId),
  })
);

// =============================================================================
// TABLA 6: BITÁCORA DE INTEGRACIONES (LOGS AUDITABLES)
// =============================================================================
export const integrationLogs = pgTable(
  "integration_logs",
  {
    id: serial("id").primaryKey(),
    service: varchar("service", { length: 50 }).notNull(), // 'Odoo', 'Pabilo', 'WhatsApp', 'Cloudflare'
    action: varchar("action", { length: 100 }).notNull(),
    status: varchar("status", { length: 20 }).notNull(), // 'success', 'failed', 'pending'
    payload: jsonb("payload"),
    response: jsonb("response"),
    errorMessage: text("error_message"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    serviceIdx: index("idx_integration_logs_service").on(table.service),
    createdAtIdx: index("idx_integration_logs_created_at").on(table.createdAt),
  })
);

// =============================================================================
// TABLA 7: CREDENCIALES DE ACCESO ADMINISTRATIVO (RBAC ONPROTEC)
// =============================================================================
export const adminUsers = pgTable(
  "admin_users",
  {
    id: serial("id").primaryKey(),
    username: varchar("username", { length: 100 }).notNull().unique(),
    email: varchar("email", { length: 255 }).notNull().unique(),
    name: varchar("name", { length: 255 }).notNull(),
    role: varchar("role", { length: 100 }).default("Coordinador de Sala").notNull(),
    department: varchar("department", { length: 150 }).default("OnProtec Capacitaciones").notNull(),
    passwordHash: text("password_hash").notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    usernameIdx: index("idx_admin_users_username").on(table.username),
    emailIdx: index("idx_admin_users_email").on(table.email),
  })
);
