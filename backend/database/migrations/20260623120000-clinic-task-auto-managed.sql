-- vert-clinic-2.9.2: Auto-managed clinic tasks (result review + overdue specimen collection)

ALTER TABLE clinic_tasks
  ADD COLUMN IF NOT EXISTS is_auto_managed BOOLEAN NOT NULL DEFAULT false;

CREATE UNIQUE INDEX IF NOT EXISTS idx_clinic_tasks_auto_result_review_open
  ON clinic_tasks(business_id, test_result_id)
  WHERE is_auto_managed = true
    AND task_type = 'ResultReview'
    AND status IN ('open', 'in_progress')
    AND test_result_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_clinic_tasks_auto_specimen_collection_open
  ON clinic_tasks(business_id, specimen_id)
  WHERE is_auto_managed = true
    AND task_type = 'SpecimenCollection'
    AND status IN ('open', 'in_progress')
    AND specimen_id IS NOT NULL;
