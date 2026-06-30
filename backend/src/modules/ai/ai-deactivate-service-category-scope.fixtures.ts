export type DeactivateServiceCategoryScopeFixture = {
  id: string;
  prompt: string;
  surface: 'dashboard';
  expectedAction: 'deactivate_service';
  paramsPartial?: {
    categoryName?: string;
    allInCategory?: boolean;
    serviceName?: string;
  };
  misclassifiedAction?: string;
};

export const DEACTIVATE_SERVICE_CATEGORY_SCOPE_PROMPTS: DeactivateServiceCategoryScopeFixture[] =
  [
    {
      id: 'deactivate-all-dental-en',
      prompt: 'Deactivate all dental services',
      surface: 'dashboard',
      expectedAction: 'deactivate_service',
      paramsPartial: { categoryName: 'dental', allInCategory: true },
      misclassifiedAction: 'unassign_employee_services',
    },
    {
      id: 'hide-all-hair-catalog-en',
      prompt: 'Hide all hair services from public catalog',
      surface: 'dashboard',
      expectedAction: 'deactivate_service',
      paramsPartial: { categoryName: 'hair', allInCategory: true },
      misclassifiedAction: 'list_services',
    },
    {
      id: 'disable-all-massage-offerings-en',
      prompt: 'Disable all massage offerings from the catalog',
      surface: 'dashboard',
      expectedAction: 'deactivate_service',
      paramsPartial: { categoryName: 'massage', allInCategory: true },
    },
    {
      id: 'remove-all-skin-category-en',
      prompt: 'Remove all services in Skin category from public booking',
      surface: 'dashboard',
      expectedAction: 'deactivate_service',
      paramsPartial: { categoryName: 'Skin', allInCategory: true },
      misclassifiedAction: 'bulk_assign_services_category',
    },
    {
      id: 'deactivate-all-color-category-services-en',
      prompt: 'Deactivate all Color category services',
      surface: 'dashboard',
      expectedAction: 'deactivate_service',
      paramsPartial: { categoryName: 'Color', allInCategory: true },
    },
    {
      id: 'hide-every-facial-service-en',
      prompt: 'Hide every facial service from our service menu',
      surface: 'dashboard',
      expectedAction: 'deactivate_service',
      paramsPartial: { categoryName: 'facial', allInCategory: true },
    },
    {
      id: 'disable-all-spa-services-en',
      prompt: 'Disable all spa services — hide from public catalog',
      surface: 'dashboard',
      expectedAction: 'deactivate_service',
      paramsPartial: { categoryName: 'spa', allInCategory: true },
    },
    {
      id: 'remove-all-nail-services-en',
      prompt: 'Remove all nail services from public booking page',
      surface: 'dashboard',
      expectedAction: 'deactivate_service',
      paramsPartial: { categoryName: 'nail', allInCategory: true },
    },
    {
      id: 'deactivate-all-wellness-en',
      prompt: 'Deactivate all wellness services from catalog',
      surface: 'dashboard',
      expectedAction: 'deactivate_service',
      paramsPartial: { categoryName: 'wellness', allInCategory: true },
    },
    {
      id: 'hide-single-balayage-en',
      prompt: 'Hide balayage from public catalog',
      surface: 'dashboard',
      expectedAction: 'deactivate_service',
      paramsPartial: { serviceName: 'balayage' },
    },
    {
      id: 'deactivate-neck-massage-en',
      prompt: 'Deactivate service Neck Massage from public booking',
      surface: 'dashboard',
      expectedAction: 'deactivate_service',
      paramsPartial: { serviceName: 'Neck Massage' },
    },
    {
      id: 'disable-deluxe-facial-en',
      prompt: 'Disable Deluxe Facial from the service catalog',
      surface: 'dashboard',
      expectedAction: 'deactivate_service',
      paramsPartial: { serviceName: 'Deluxe Facial' },
    },
  ];

export const DEACTIVATE_SERVICE_CATEGORY_SCOPE_RESCUE_SCENARIOS =
  DEACTIVATE_SERVICE_CATEGORY_SCOPE_PROMPTS.filter(
    (row) => row.misclassifiedAction && row.paramsPartial?.allInCategory,
  );
