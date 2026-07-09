/** ai-cmd-dashboard-6.12.3 — business location CRUD classifier rules. */
export const LOCATIONS_CLASSIFIER_RULES = `- create_location: MUTATE — add a new business location. Requires name; optional address, phone, timezone, isDefault. "Add a new location called Downtown at 123 Main St" → create_location, name=Downtown, address="123 Main St".
- update_location: MUTATE — edit an existing location's name/address/phone/timezone, or make it the default. Requires locationId or locationName plus at least one field to change. NOT create_location (new row).
- Examples:
  - "Create a location named Uptown Branch" → create_location, name="Uptown Branch"
  - "Set Downtown's phone number to 555-0100" → update_location, locationName=Downtown, phone=555-0100
  - "Make Uptown Branch the default location" → update_location, locationName="Uptown Branch", isDefault=true`;
