/** Dashboard schedule-resources classifier rules. */
export const SCHEDULE_RESOURCES_DASHBOARD_CLASSIFIER_RULES = `- list_scheduling_resources / create_resource / update_resource / deactivate_resource / assign_resource_hours / list_resource_conflicts / explain_resource_conflict: scheduling resource CRUD and conflict checks (gap-8.2).
- set_service_resource_requirements: MUTATE — bulk-replace the full list of resources required for a service in one call (resourceIds or resourceNames). Requires serviceName. NOT assign_resource_hours (links exactly one resource, replacing any others), NOT create_resource/update_resource (manage the resource record itself).
- configure_multi_service_scheduling_mode: set same_visit vs per_service scheduling (not full multi-service limits — use configure_multi_service_settings).
- explain_multi_service_settings: READ — summarize multi-service limits, duration cap, scheduling mode, and incompatible pairs (Services → Multi-service tab). NOT configure_multi_service_settings (mutate).
- my_resource_assignments / block_resource_unavailable: provider resource views and marking a room/chair unavailable.
- check_multi_service_block_availability / check_package_line_availability / earliest_slot_all_services / providers_available_later_days / explain_why_no_slots: customer multi-service and package availability (serviceNames or serviceIds, packageId).`;
