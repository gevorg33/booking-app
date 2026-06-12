export interface CategoryAssignmentScenario {
  id: string;
  prompt: string;
  expectedAction: string;
  rescueReason: string;
  categoryName: string;
  employeeName: string;
  paramsAssert?: (params: Record<string, unknown>) => void;
}

export const CATEGORY_TO_PROVIDER_SCENARIOS: CategoryAssignmentScenario[] = [
  {
    id: 'from-category-to-full-name',
    prompt: 'Assign all services from Color category to Gevorg Gasparyan',
    expectedAction: 'assign_employee_services',
    rescueReason: 'assign_category_to_provider',
    categoryName: 'Color',
    employeeName: 'Gevorg Gasparyan',
    paramsAssert: (p) => expect(p.assignFromCategory).toBe(true),
  },
  {
    id: 'from-category-to-first-name',
    prompt: 'Assign all services from Hair category to Maria',
    expectedAction: 'assign_employee_services',
    rescueReason: 'assign_category_to_provider',
    categoryName: 'Hair',
    employeeName: 'Maria',
  },
  {
    id: 'all-category-services-to-provider',
    prompt: 'Assign all Color services to Gevorg Gasparyan',
    expectedAction: 'assign_employee_services',
    rescueReason: 'assign_category_to_provider',
    categoryName: 'Color',
    employeeName: 'Gevorg Gasparyan',
  },
  {
    id: 'services-in-category',
    prompt: 'Assign all services in the Nails category to Anna Smith',
    expectedAction: 'assign_employee_services',
    rescueReason: 'assign_category_to_provider',
    categoryName: 'Nails',
    employeeName: 'Anna Smith',
  },
  {
    id: 'services-under-category',
    prompt: 'Give all services under Spa category to provider Mary Torgomyan',
    expectedAction: 'assign_employee_services',
    rescueReason: 'assign_category_to_provider',
    categoryName: 'Spa',
    employeeName: 'Mary Torgomyan',
  },
  {
    id: 'service-category-keyword',
    prompt: 'Assign service category Wax to provider Gevorg',
    expectedAction: 'assign_employee_services',
    rescueReason: 'assign_category_to_provider',
    categoryName: 'Wax',
    employeeName: 'Gevorg',
  },
  {
    id: 'assign-category-keyword',
    prompt: 'Assign category Brow to Maria Lopez',
    expectedAction: 'assign_employee_services',
    rescueReason: 'assign_category_to_provider',
    categoryName: 'Brow',
    employeeName: 'Maria Lopez',
  },
  {
    id: 'grant-skills-phrasing',
    prompt: 'Add all services from Massage category to service provider James',
    expectedAction: 'assign_employee_services',
    rescueReason: 'assign_category_to_provider',
    categoryName: 'Massage',
    employeeName: 'James',
  },
  {
    id: 'from-the-category',
    prompt: 'Assign all the services from the Color category to Gevorg',
    expectedAction: 'assign_employee_services',
    rescueReason: 'assign_category_to_provider',
    categoryName: 'Color',
    employeeName: 'Gevorg',
  },
  {
    id: 'services-from-category',
    prompt: 'Assign services from Hair category to Maria Lopez',
    expectedAction: 'assign_employee_services',
    rescueReason: 'assign_category_to_provider',
    categoryName: 'Hair',
    employeeName: 'Maria Lopez',
  },
];

export const CATEGORY_ASSIGNMENT_NEGATIVE_SCENARIOS: {
  id: string;
  prompt: string;
}[] = [
  {
    id: 'senior-matrix',
    prompt: 'Assign all color services to senior stylists only',
  },
  {
    id: 'junior-matrix',
    prompt: 'Assign all massage services to junior staff only',
  },
  { id: 'named-services', prompt: 'Assign facemassage and haircut to Gevorg' },
  { id: 'bulk-catalog', prompt: 'Create category Hair with 5 linked services' },
  { id: 'lookup-assignment', prompt: 'Who can do facemassage today' },
];

export const CATEGORY_ASSIGNMENT_MISCLASSIFICATION_SCENARIOS: {
  id: string;
  wrongAction: string;
  prompt: string;
  expectedAction: string;
  rescueReason: string;
}[] = [
  {
    id: 'matrix-to-category-provider',
    wrongAction: 'staff_service_matrix',
    prompt: 'Assign all services from Color category to Gevorg Gasparyan',
    expectedAction: 'assign_employee_services',
    rescueReason: 'assign_category_to_provider',
  },
  {
    id: 'unknown-to-category-provider',
    wrongAction: 'unknown',
    prompt: 'Assign all Hair services to Maria Lopez',
    expectedAction: 'assign_employee_services',
    rescueReason: 'assign_category_to_provider',
  },
];

export const ALL_CATEGORY_ASSIGNMENT_SCENARIOS: CategoryAssignmentScenario[] = [
  ...CATEGORY_TO_PROVIDER_SCENARIOS,
];

export interface CategoryUnassignScenario {
  id: string;
  prompt: string;
  expectedAction: string;
  rescueReason: string;
  categoryName?: string;
  employeeName: string;
  unassignAllServices?: boolean;
}

export const CATEGORY_UNASSIGN_FROM_PROVIDER_SCENARIOS: CategoryUnassignScenario[] =
  [
    {
      id: 'unassign-category-from-full-name',
      prompt: 'Unassign all services from Color category from Gevorg Gasparyan',
      expectedAction: 'unassign_employee_services',
      rescueReason: 'unassign_services_from_provider',
      categoryName: 'Color',
      employeeName: 'Gevorg Gasparyan',
    },
    {
      id: 'remove-category-from-provider',
      prompt: 'Remove all Color services from Maria Lopez',
      expectedAction: 'unassign_employee_services',
      rescueReason: 'unassign_services_from_provider',
      categoryName: 'Color',
      employeeName: 'Maria Lopez',
    },
    {
      id: 'strip-category-skills',
      prompt: 'Strip all services in Hair category from Anna Smith',
      expectedAction: 'unassign_employee_services',
      rescueReason: 'unassign_services_from_provider',
      categoryName: 'Hair',
      employeeName: 'Anna Smith',
    },
    {
      id: 'remove-all-services-from-provider',
      prompt: 'Remove all services from James',
      expectedAction: 'unassign_employee_services',
      rescueReason: 'unassign_services_from_provider',
      employeeName: 'James',
      unassignAllServices: true,
    },
    {
      id: 'clear-provider-skills',
      prompt: 'Clear all services from service provider Mary Torgomyan',
      expectedAction: 'unassign_employee_services',
      rescueReason: 'unassign_services_from_provider',
      employeeName: 'Mary Torgomyan',
      unassignAllServices: true,
    },
    {
      id: 'revoke-category-from-provider',
      prompt: 'Revoke all Massage category services from Gevorg',
      expectedAction: 'unassign_employee_services',
      rescueReason: 'unassign_services_from_provider',
      categoryName: 'Massage',
      employeeName: 'Gevorg',
    },
    {
      id: 'drop-nails-from-provider',
      prompt: 'Drop all Nails services from Maria',
      expectedAction: 'unassign_employee_services',
      rescueReason: 'unassign_services_from_provider',
      categoryName: 'Nails',
      employeeName: 'Maria',
    },
    {
      id: 'unassign-spa-category',
      prompt: 'Unassign all services under Spa category from James',
      expectedAction: 'unassign_employee_services',
      rescueReason: 'unassign_services_from_provider',
      categoryName: 'Spa',
      employeeName: 'James',
    },
    {
      id: 'remove-specific-service-from-provider',
      prompt: 'Remove Spa Service A from Gevorg Gasparyan',
      expectedAction: 'unassign_employee_services',
      rescueReason: 'unassign_services_from_provider',
      employeeName: 'Gevorg Gasparyan',
    },
    {
      id: 'take-away-wax-services',
      prompt: 'Take away all Wax services from Anna Smith',
      expectedAction: 'unassign_employee_services',
      rescueReason: 'unassign_services_from_provider',
      categoryName: 'Wax',
      employeeName: 'Anna Smith',
    },
  ];

export interface TransferServicesScenario {
  id: string;
  prompt: string;
  expectedAction: string;
  rescueReason: string;
  categoryName?: string;
  serviceName?: string;
  fromEmployeeName: string;
  toEmployeeName: string;
  unassignAllServices?: boolean;
}

export const TRANSFER_SERVICES_BETWEEN_PROVIDERS_SCENARIOS: TransferServicesScenario[] =
  [
    {
      id: 'move-category-between-providers',
      prompt: 'Move all Color services from Maria Lopez to Gevorg Gasparyan',
      expectedAction: 'transfer_employee_services',
      rescueReason: 'transfer_services_between_providers',
      categoryName: 'Color',
      fromEmployeeName: 'Maria Lopez',
      toEmployeeName: 'Gevorg Gasparyan',
    },
    {
      id: 'transfer-hair-category',
      prompt: 'Transfer all Hair category services from Anna Smith to Maria',
      expectedAction: 'transfer_employee_services',
      rescueReason: 'transfer_services_between_providers',
      categoryName: 'Hair',
      fromEmployeeName: 'Anna Smith',
      toEmployeeName: 'Maria',
    },
    {
      id: 'reassign-massage-skills',
      prompt: 'Reassign all Massage services from Gevorg to James',
      expectedAction: 'transfer_employee_services',
      rescueReason: 'transfer_services_between_providers',
      categoryName: 'Massage',
      fromEmployeeName: 'Gevorg',
      toEmployeeName: 'James',
    },
    {
      id: 'move-all-services-between-providers',
      prompt: 'Move all services from Maria Lopez to Anna Smith',
      expectedAction: 'transfer_employee_services',
      rescueReason: 'transfer_services_between_providers',
      fromEmployeeName: 'Maria Lopez',
      toEmployeeName: 'Anna Smith',
      unassignAllServices: true,
    },
    {
      id: 'transfer-specific-service',
      prompt: 'Transfer Spa Service A from Gevorg Gasparyan to Maria Lopez',
      expectedAction: 'transfer_employee_services',
      rescueReason: 'transfer_services_between_providers',
      serviceName: 'Spa Service A',
      fromEmployeeName: 'Gevorg Gasparyan',
      toEmployeeName: 'Maria Lopez',
    },
    {
      id: 'move-nails-between-providers',
      prompt: 'Move all Nails services from James to Mary Torgomyan',
      expectedAction: 'transfer_employee_services',
      rescueReason: 'transfer_services_between_providers',
      categoryName: 'Nails',
      fromEmployeeName: 'James',
      toEmployeeName: 'Mary Torgomyan',
    },
    {
      id: 'transfer-from-provider-keyword',
      prompt:
        'Transfer all Wax services from service provider Anna to service provider Gevorg',
      expectedAction: 'transfer_employee_services',
      rescueReason: 'transfer_services_between_providers',
      categoryName: 'Wax',
      fromEmployeeName: 'Anna',
      toEmployeeName: 'Gevorg',
    },
    {
      id: 'move-spa-category-services',
      prompt: 'Move all services in Spa category from Maria to James',
      expectedAction: 'transfer_employee_services',
      rescueReason: 'transfer_services_between_providers',
      categoryName: 'Spa',
      fromEmployeeName: 'Maria',
      toEmployeeName: 'James',
    },
    {
      id: 'reassign-brow-services',
      prompt: 'Reassign all Brow services from Gevorg Gasparyan to Anna Smith',
      expectedAction: 'transfer_employee_services',
      rescueReason: 'transfer_services_between_providers',
      categoryName: 'Brow',
      fromEmployeeName: 'Gevorg Gasparyan',
      toEmployeeName: 'Anna Smith',
    },
    {
      id: 'move-color-to-maria',
      prompt: 'Move all Color category services from Gevorg Gasparyan to Maria Lopez',
      expectedAction: 'transfer_employee_services',
      rescueReason: 'transfer_services_between_providers',
      categoryName: 'Color',
      fromEmployeeName: 'Gevorg Gasparyan',
      toEmployeeName: 'Maria Lopez',
    },
  ];
