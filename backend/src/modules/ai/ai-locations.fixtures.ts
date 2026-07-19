/** ai-cmd-dashboard-6.12.3 — business location CRUD classifier rules. */
export const LOCATIONS_CLASSIFIER_RULES = `- create_location: MUTATE — add a new business location. Requires name; optional address, phone, timezone, isDefault. "Add a new location called Downtown at 123 Main St" → create_location, name=Downtown, address="123 Main St".
- update_location: MUTATE — edit an existing location's name/address/phone/timezone, or make it the default. Requires locationId or locationName plus at least one field to change. "main"/"default"/"primary" means the default location. NOT create_location (new row). NOT explain_business_hours_and_location (read-only "what are my business hours / address" questions).
- Examples:
  - "Create a location named Uptown Branch" → create_location, name="Uptown Branch"
  - "Add a new business location called QA Test Branch at 123 Test St" → create_location, name="QA Test Branch", address="123 Test St"
  - "Update my main location's address to 456 New St" → update_location, locationName=main, address="456 New St"
  - "Set Downtown's phone number to 555-0100" → update_location, locationName=Downtown, phone=555-0100
  - "Make Uptown Branch the default location" → update_location, locationName="Uptown Branch", isDefault=true`;

/** e2e-bug.146 — NL prompts that must rescue to location mutates (not react_agent). */
export const LOCATIONS_RESCUE_SCENARIOS = [
  {
    id: 'e2e146-create-branch',
    prompt: 'Add a new business location called QA Test Branch at 123 Test St',
    expectedAction: 'create_location' as const,
    paramsPartial: {
      name: 'QA Test Branch',
      address: '123 Test St',
    },
  },
  {
    id: 'e2e146-update-main-address',
    prompt: "Update my main location's address to 456 New St",
    expectedAction: 'update_location' as const,
    paramsPartial: {
      locationName: 'main',
      address: '456 New St',
    },
  },
  {
    id: 'create-named-uptown',
    prompt: 'Create a location named Uptown Branch',
    expectedAction: 'create_location' as const,
    paramsPartial: { name: 'Uptown Branch' },
  },
  {
    id: 'update-downtown-phone',
    prompt: "Set Downtown's phone number to 555-0100",
    expectedAction: 'update_location' as const,
    paramsPartial: { locationName: 'Downtown', phone: '555-0100' },
  },
] as const;
