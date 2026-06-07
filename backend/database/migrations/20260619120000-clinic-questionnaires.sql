-- vert-clinic-2.8.1: Generic clinic questionnaire engine (no journey milestones / plan hooks)

CREATE TABLE IF NOT EXISTS clinic_questionnaires (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  code VARCHAR(64) NOT NULL,
  internal_name VARCHAR(128) NOT NULL,
  title VARCHAR(255) NOT NULL,
  intro_title VARCHAR(255),
  intro_body TEXT,
  revision INTEGER NOT NULL DEFAULT 1,
  status VARCHAR(16) NOT NULL DEFAULT 'draft',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (business_id, code)
);

CREATE INDEX IF NOT EXISTS idx_clinic_questionnaires_business_status
  ON clinic_questionnaires(business_id, status, is_active);

CREATE TABLE IF NOT EXISTS clinic_questionnaire_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  questionnaire_id UUID NOT NULL REFERENCES clinic_questionnaires(id) ON DELETE CASCADE,
  parent_question_id UUID REFERENCES clinic_questionnaire_questions(id) ON DELETE CASCADE,
  sequence INTEGER NOT NULL,
  type VARCHAR(32) NOT NULL,
  text TEXT,
  sub_text TEXT,
  placeholder VARCHAR(255),
  required BOOLEAN NOT NULL DEFAULT TRUE,
  repeat_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  max_length INTEGER,
  max_count INTEGER,
  regex_pattern VARCHAR(255),
  validation_error_message VARCHAR(255),
  validation_max_date VARCHAR(16) NOT NULL DEFAULT 'none',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_clinic_questionnaire_questions_questionnaire_sequence
  ON clinic_questionnaire_questions(questionnaire_id, sequence);

CREATE TABLE IF NOT EXISTS clinic_questionnaire_answer_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES clinic_questionnaire_questions(id) ON DELETE CASCADE,
  display TEXT NOT NULL,
  value VARCHAR(255) NOT NULL,
  sequence INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_clinic_questionnaire_answer_options_question
  ON clinic_questionnaire_answer_options(question_id, sequence);

CREATE TABLE IF NOT EXISTS clinic_questionnaire_constraints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  questionnaire_id UUID NOT NULL REFERENCES clinic_questionnaires(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES clinic_questionnaire_questions(id) ON DELETE CASCADE,
  constraint_question_id UUID NOT NULL REFERENCES clinic_questionnaire_questions(id) ON DELETE CASCADE,
  answer_option_id UUID REFERENCES clinic_questionnaire_answer_options(id) ON DELETE CASCADE,
  static_answer VARCHAR(64),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_clinic_questionnaire_constraints_question
  ON clinic_questionnaire_constraints(questionnaire_id, question_id);

CREATE TABLE IF NOT EXISTS clinic_questionnaire_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  questionnaire_id UUID NOT NULL REFERENCES clinic_questionnaires(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  status VARCHAR(16) NOT NULL DEFAULT 'in_progress',
  current_question_id UUID REFERENCES clinic_questionnaire_questions(id) ON DELETE SET NULL,
  answers JSONB NOT NULL DEFAULT '{}'::jsonb,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_clinic_questionnaire_responses_business_customer
  ON clinic_questionnaire_responses(business_id, customer_id, status);
