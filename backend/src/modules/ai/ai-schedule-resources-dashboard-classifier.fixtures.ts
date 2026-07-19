/** Dashboard schedule-resources classifier rules. */
export const SCHEDULE_RESOURCES_DASHBOARD_CLASSIFIER_RULES = `- list_scheduling_resources / create_resource / update_resource / deactivate_resource / assign_resource_hours / list_resource_conflicts / explain_resource_conflict: scheduling resource CRUD and conflict checks (gap-8.2).
- list_service_resource_requirements: READ — list this business's configured scheduling resources (rooms/chairs/stations) required for a named catalog service. Triggers: what/which equipment/resources does {service} require, show/list resource requirements for {service}. Set serviceName. Answers from configured ServiceResourceRequirement rows only — NEVER invent typical spa equipment. NOT set_service_resource_requirements (mutate), NOT list_scheduling_resources (full catalog inventory), NOT assign_resource_hours.
- set_service_resource_requirements: MUTATE — bulk-replace the full list of resources required for a service in one call (resourceIds or resourceNames). Requires serviceName. NOT assign_resource_hours (links exactly one resource, replacing any others), NOT create_resource/update_resource (manage the resource record itself), NOT list_service_resource_requirements (read).
- configure_multi_service_scheduling_mode: set same_visit vs per_service scheduling (not full multi-service limits — use configure_multi_service_settings).
- explain_multi_service_settings: READ — summarize multi-service limits, duration cap, scheduling mode, and incompatible pairs (Services → Multi-service tab). NOT configure_multi_service_settings (mutate).
- my_resource_assignments / block_resource_unavailable: provider resource views and marking a room/chair unavailable.
- check_multi_service_block_availability / check_package_line_availability / earliest_slot_all_services / providers_available_later_days / explain_why_no_slots: customer multi-service and package availability (serviceNames or serviceIds, packageId).`;

/** e2e-bug.147 — NL prompts that must rescue to list_service_resource_requirements. */
export const LIST_SERVICE_RESOURCE_REQUIREMENTS_SCENARIOS = [
  {
    id: 'e2e147-equipment-does-service-require',
    prompt: 'What equipment does the deep tissue massage service require?',
    serviceName: 'deep tissue massage',
  },
  {
    id: 'e2e147-what-resources-required',
    prompt: 'What resources are required for Deep Tissue Massage?',
    serviceName: 'Deep Tissue Massage',
  },
  {
    id: 'e2e147-list-requirements-for',
    prompt: 'List resource requirements for facial',
    serviceName: 'facial',
  },
  {
    id: 'e2e147-show-requirements-for',
    prompt: 'Show resource requirements for the massage service',
    serviceName: 'massage',
  },
  {
    id: 'e2e147-which-rooms-needed',
    prompt: 'Which rooms are needed for color service?',
    serviceName: 'color',
  },
  {
    id: 'e2e147-does-service-require-equipment',
    prompt: 'Does the neck massage service require any equipment?',
    serviceName: 'neck massage',
  },
  {
    id: 'e2e147-what-chairs-required',
    prompt: 'What chairs does the haircut service require?',
    serviceName: 'haircut',
  },
  {
    id: 'e2e147-explain-requirements',
    prompt: 'Explain resource requirements for waxing',
    serviceName: 'waxing',
  },
  {
    id: 'e2e147-resources-needed-for',
    prompt: 'Resources needed for pedicure service',
    serviceName: 'pedicure',
  },
  {
    id: 'e2e147-which-stations-required',
    prompt: 'Which stations are required for manicure?',
    serviceName: 'manicure',
  },
] as const;
