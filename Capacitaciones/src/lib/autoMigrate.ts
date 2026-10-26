import { Pool } from "pg";

/**
 * Script de Auto-Migración Idempotente
 * Regla de Oro: database-schema-auto-migrate
 * 
 * Este script se ejecuta proactivamente al inicializar la base de datos o en el arranque.
 * Ejecuta sentencias DDL con protección `IF NOT EXISTS` para garantizar que la base de datos
 * física siempre esté perfectamente sincronizada con el esquema de TypeScript (schema.ts).
 */

const ddlStatements = [
  // 1. Tabla: Trainings (Capacitaciones)
  `CREATE TABLE IF NOT EXISTS "trainings" (
    "id" SERIAL PRIMARY KEY,
    "name" VARCHAR(255) NOT NULL,
    "code" VARCHAR(50) NOT NULL UNIQUE,
    "type" VARCHAR(50) NOT NULL,
    "instructor" VARCHAR(255) NOT NULL,
    "event_date" TIMESTAMP WITH TIME ZONE NOT NULL,
    "ad_start_date" TIMESTAMP WITH TIME ZONE,
    "ad_costs" NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    "associated_costs" NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    "max_capacity" INTEGER NOT NULL DEFAULT 18,
    "instructor_capacity" INTEGER NOT NULL DEFAULT 1,
    "related_skus" JSONB NOT NULL DEFAULT '[]'::jsonb,
    "price" NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    "currency" VARCHAR(10) NOT NULL DEFAULT 'USD',
    "status" VARCHAR(50) NOT NULL DEFAULT 'Planificado',
    "survey_url" TEXT,
    "survey_qr_code" TEXT,
    "description" TEXT,
    "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
  );`,

  // Columnas preventivas en Trainings
  `ALTER TABLE "trainings" ADD COLUMN IF NOT EXISTS "code" VARCHAR(50);`,
  `ALTER TABLE "trainings" ADD COLUMN IF NOT EXISTS "ad_costs" NUMERIC(12, 2) DEFAULT 0.00;`,
  `ALTER TABLE "trainings" ADD COLUMN IF NOT EXISTS "associated_costs" NUMERIC(12, 2) DEFAULT 0.00;`,
  `ALTER TABLE "trainings" ADD COLUMN IF NOT EXISTS "max_capacity" INTEGER DEFAULT 18;`,
  `ALTER TABLE "trainings" ADD COLUMN IF NOT EXISTS "instructor_capacity" INTEGER DEFAULT 1;`,
  `ALTER TABLE "trainings" ADD COLUMN IF NOT EXISTS "related_skus" JSONB DEFAULT '[]'::jsonb;`,
  `ALTER TABLE "trainings" ADD COLUMN IF NOT EXISTS "survey_qr_code" TEXT;`,

  // 2. Tabla: Participants (Participantes)
  `CREATE TABLE IF NOT EXISTS "participants" (
    "id" SERIAL PRIMARY KEY,
    "name" VARCHAR(255) NOT NULL,
    "doc_type" VARCHAR(10) NOT NULL DEFAULT 'V',
    "doc_number" VARCHAR(50) NOT NULL UNIQUE,
    "phone" VARCHAR(50) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "has_store_purchases" BOOLEAN NOT NULL DEFAULT FALSE,
    "store_purchases_amount" NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    "company" VARCHAR(255),
    "notes" TEXT,
    "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
  );`,

  // Columnas preventivas en Participants
  `ALTER TABLE "participants" ADD COLUMN IF NOT EXISTS "has_store_purchases" BOOLEAN DEFAULT FALSE;`,
  `ALTER TABLE "participants" ADD COLUMN IF NOT EXISTS "store_purchases_amount" NUMERIC(12, 2) DEFAULT 0.00;`,
  `ALTER TABLE "participants" ADD COLUMN IF NOT EXISTS "company" VARCHAR(255);`,
  `ALTER TABLE "participants" ADD COLUMN IF NOT EXISTS "cargo" VARCHAR(150);`,
  `ALTER TABLE "participants" ADD COLUMN IF NOT EXISTS "city" VARCHAR(150);`,
  `ALTER TABLE "participants" ADD COLUMN IF NOT EXISTS "experience_level" VARCHAR(150);`,
  `ALTER TABLE "participants" ADD COLUMN IF NOT EXISTS "referral_source" VARCHAR(150);`,
  `ALTER TABLE "participants" ADD COLUMN IF NOT EXISTS "allows_contact" BOOLEAN DEFAULT TRUE;`,
  `ALTER TABLE "participants" ALTER COLUMN "doc_number" DROP NOT NULL;`,

  // 3. Tabla: Registrations (Inscripciones)
  `CREATE TABLE IF NOT EXISTS "registrations" (
    "id" SERIAL PRIMARY KEY,
    "training_id" INTEGER NOT NULL REFERENCES "trainings"("id") ON DELETE CASCADE,
    "participant_id" INTEGER NOT NULL REFERENCES "participants"("id") ON DELETE CASCADE,
    "status" VARCHAR(50) NOT NULL DEFAULT 'Inscrito',
    "confirmation_date" TIMESTAMP WITH TIME ZONE,
    "amount" NUMERIC(12, 2) NOT NULL,
    "currency" VARCHAR(10) NOT NULL DEFAULT 'USD',
    "is_paid" BOOLEAN NOT NULL DEFAULT FALSE,
    "payment_date" TIMESTAMP WITH TIME ZONE,
    "payment_method" VARCHAR(50),
    "payment_reference" VARCHAR(100),
    "pabilo_transaction_id" VARCHAR(100),
    "pabilo_status" VARCHAR(50) NOT NULL DEFAULT 'pending',
    "invoice_number" VARCHAR(100),
    "payment_proof_url" TEXT,
    "special_notes" TEXT,
    "reminder_sent_at" TIMESTAMP WITH TIME ZONE,
    "survey_sent_at" TIMESTAMP WITH TIME ZONE,
    "check_in_at" TIMESTAMP WITH TIME ZONE,
    "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
  );`,

  // Columnas preventivas en Registrations
  `ALTER TABLE "registrations" ADD COLUMN IF NOT EXISTS "pabilo_transaction_id" VARCHAR(100);`,
  `ALTER TABLE "registrations" ADD COLUMN IF NOT EXISTS "pabilo_status" VARCHAR(50) DEFAULT 'pending';`,
  `ALTER TABLE "registrations" ADD COLUMN IF NOT EXISTS "invoice_number" VARCHAR(100);`,
  `ALTER TABLE "registrations" ADD COLUMN IF NOT EXISTS "payment_notes" TEXT;`,
  `ALTER TABLE "registrations" ADD COLUMN IF NOT EXISTS "experience_level" VARCHAR(150);`,
  `ALTER TABLE "registrations" ADD COLUMN IF NOT EXISTS "original_form_name" VARCHAR(255);`,
  `ALTER TABLE "registrations" ADD COLUMN IF NOT EXISTS "form_submitted_at" TIMESTAMP WITH TIME ZONE;`,
  `ALTER TABLE "registrations" ADD COLUMN IF NOT EXISTS "check_in_at" TIMESTAMP WITH TIME ZONE;`,
  `ALTER TABLE "registrations" ADD COLUMN IF NOT EXISTS "reminder_sent_at" TIMESTAMP WITH TIME ZONE;`,
  `ALTER TABLE "registrations" ADD COLUMN IF NOT EXISTS "survey_sent_at" TIMESTAMP WITH TIME ZONE;`,

  // 4. Tabla: Odoo Products Cache
  `CREATE TABLE IF NOT EXISTS "odoo_products" (
    "id" SERIAL PRIMARY KEY,
    "odoo_id" INTEGER NOT NULL UNIQUE,
    "sku" VARCHAR(100) NOT NULL UNIQUE,
    "name" VARCHAR(255) NOT NULL,
    "list_price" NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    "qty_available" NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    "category" VARCHAR(100),
    "last_sync_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
  );`,

  // 5. Tabla: Surveys
  `CREATE TABLE IF NOT EXISTS "surveys" (
    "id" SERIAL PRIMARY KEY,
    "training_id" INTEGER NOT NULL REFERENCES "trainings"("id") ON DELETE CASCADE,
    "participant_id" INTEGER REFERENCES "participants"("id") ON DELETE SET NULL,
    "rating_instructor" INTEGER NOT NULL DEFAULT 5,
    "rating_content" INTEGER NOT NULL DEFAULT 5,
    "rating_facilities" INTEGER NOT NULL DEFAULT 5,
    "recommendation_score" INTEGER NOT NULL DEFAULT 10,
    "feedback" TEXT,
    "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
  );`,

  // Columnas preventivas en Surveys
  `ALTER TABLE "surveys" ADD COLUMN IF NOT EXISTS "participant_name" VARCHAR(255);`,
  `ALTER TABLE "surveys" ADD COLUMN IF NOT EXISTS "company" VARCHAR(255);`,
  `ALTER TABLE "surveys" ADD COLUMN IF NOT EXISTS "cargo" VARCHAR(150);`,
  `ALTER TABLE "surveys" ADD COLUMN IF NOT EXISTS "most_liked" TEXT;`,
  `ALTER TABLE "surveys" ADD COLUMN IF NOT EXISTS "suggestions" TEXT;`,
  `ALTER TABLE "surveys" ADD COLUMN IF NOT EXISTS "wants_future_certifications" TEXT;`,
  `ALTER TABLE "surveys" ADD COLUMN IF NOT EXISTS "has_active_projects" TEXT;`,
  `ALTER TABLE "surveys" ADD COLUMN IF NOT EXISTS "submitted_at" TIMESTAMP WITH TIME ZONE;`,
  `ALTER TABLE "surveys" ALTER COLUMN "rating_instructor" DROP NOT NULL;`,
  `ALTER TABLE "surveys" ALTER COLUMN "rating_content" DROP NOT NULL;`,
  `ALTER TABLE "surveys" ALTER COLUMN "rating_facilities" DROP NOT NULL;`,
  `ALTER TABLE "surveys" ALTER COLUMN "recommendation_score" DROP NOT NULL;`,

  // 6. Tabla: Integration Logs
  `CREATE TABLE IF NOT EXISTS "integration_logs" (
    "id" SERIAL PRIMARY KEY,
    "service" VARCHAR(50) NOT NULL,
    "action" VARCHAR(100) NOT NULL,
    "status" VARCHAR(20) NOT NULL,
    "payload" JSONB,
    "response" JSONB,
    "error_message" TEXT,
    "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
  );`,

  // Índices para máximo rendimiento
  `CREATE INDEX IF NOT EXISTS "idx_trainings_status" ON "trainings"("status");`,
  `CREATE INDEX IF NOT EXISTS "idx_trainings_event_date" ON "trainings"("event_date");`,
  `CREATE INDEX IF NOT EXISTS "idx_participants_doc_number" ON "participants"("doc_number");`,
  `CREATE INDEX IF NOT EXISTS "idx_participants_phone" ON "participants"("phone");`,
  `CREATE INDEX IF NOT EXISTS "idx_participants_email" ON "participants"("email");`,
  `CREATE INDEX IF NOT EXISTS "idx_registrations_training_id" ON "registrations"("training_id");`,
  `CREATE INDEX IF NOT EXISTS "idx_registrations_participant_id" ON "registrations"("participant_id");`,
  `CREATE INDEX IF NOT EXISTS "idx_registrations_status" ON "registrations"("status");`,
  `CREATE INDEX IF NOT EXISTS "idx_registrations_pabilo_tx" ON "registrations"("pabilo_transaction_id");`,
  `CREATE INDEX IF NOT EXISTS "idx_odoo_products_sku" ON "odoo_products"("sku");`,
  `CREATE INDEX IF NOT EXISTS "idx_surveys_training_id" ON "surveys"("training_id");`,
  `CREATE INDEX IF NOT EXISTS "idx_integration_logs_service" ON "integration_logs"("service");`,
  `CREATE INDEX IF NOT EXISTS "idx_integration_logs_created_at" ON "integration_logs"("created_at");`
];

let migrationDone = false;

export async function runAutoMigrate(force = false): Promise<boolean> {
  if (migrationDone && !force) {
    return true;
  }

  // Si estamos en fase de compilación estática (next build) sin base de datos activa, omitir
  if (process.env.NEXT_PHASE === "phase-production-build") {
    return true;
  }

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.warn("[autoMigrate] No DATABASE_URL configured. Running in in-memory/mock fallback mode.");
    return false;
  }

  const pool = new Pool({
    connectionString,
    connectionTimeoutMillis: 5000,
  });

  try {
    const client = await pool.connect();
    try {
      console.log("[autoMigrate] Verificando y aplicando DDL idempotente en PostgreSQL...");
      for (const sql of ddlStatements) {
        await client.query(sql);
      }
      migrationDone = true;
      console.log("[autoMigrate] Esquema de base de datos verificado con éxito.");
      return true;
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error("[autoMigrate] Error ejecutando auto-migración:", error?.message || error);
    return false;
  } finally {
    await pool.end();
  }
}
