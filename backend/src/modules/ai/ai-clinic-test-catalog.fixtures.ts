/** ai-cmd-dashboard-6.9.1/6.9.2 — clinic lab catalog CRUD + CSV import classifier rules. */
export const CLINIC_TEST_CATALOG_CLASSIFIER_RULES = `- create_test_type: MUTATE — clinic only, manager+: add a new lab test type to the catalog. Requires title; optional code, unit, price, requiresFasting, normalLow, normalHigh. "Add a lab test type called CBC, requires fasting" → create_test_type, title=CBC, requiresFasting=true.
- update_test_type: MUTATE — clinic only, manager+: edit an existing test type's title/price/reference range/fasting requirement/active status. Requires testTypeId or testTypeCode/testTypeName plus at least one field to change.
- delete_test_type: MUTATE — clinic only, manager+: deactivate a lab test type (soft delete — unlinks it from its service). Requires testTypeId or testTypeCode/testTypeName.
- create_test_panel: MUTATE — clinic only, manager+: create a new lab test panel (a named bundle of test types). Requires title; optional code, price.
- update_test_panel: MUTATE — clinic only, manager+: edit an existing panel's title/price/active status. Requires panelId or panelCode/panelName plus at least one field.
- set_test_panel_items: MUTATE — clinic only, manager+: replace the full list of test types included in a panel. Requires panelId or panelCode/panelName, plus testTypeIds or testTypeNames. NOT create_test_panel/update_test_panel (those manage the panel record itself, not its member tests).
- import_clinic_catalog_csv: MUTATE — clinic only, manager+: bulk-import lab test types and panels from pasted CSV text. Requires csv (raw CSV content). NOT apply_clinic_playbook (that seeds a fixed starter catalog, this imports arbitrary CSV rows).
- Examples:
  - "Create a CBC lab test type" → create_test_type, title=CBC
  - "Deactivate the CBC test type" → delete_test_type, testTypeCode=CBC
  - "Create a Lipid Panel test panel" → create_test_panel, title="Lipid Panel"
  - "Set the Lipid Panel's tests to CBC and Glucose" → set_test_panel_items, panelName="Lipid Panel", testTypeNames=["CBC","Glucose"]`;
