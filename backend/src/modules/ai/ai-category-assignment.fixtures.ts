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
