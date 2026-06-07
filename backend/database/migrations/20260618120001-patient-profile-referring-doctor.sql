-- vert-clinic-2.5.8: Link patient clinical profile to referring external doctor

ALTER TABLE patient_clinical_profiles
  ADD COLUMN IF NOT EXISTS referring_external_doctor_id UUID
    REFERENCES external_doctors(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_patient_clinical_profiles_referring_doctor
  ON patient_clinical_profiles(referring_external_doctor_id)
  WHERE referring_external_doctor_id IS NOT NULL;
