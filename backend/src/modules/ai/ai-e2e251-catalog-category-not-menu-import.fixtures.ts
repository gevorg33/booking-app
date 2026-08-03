/**
 * e2e-bug.251 — "catalog category" create must not route to import_services_from_menu.
 */
export type E2e251CatalogCategoryScenario = {
  id: string;
  prompt: string;
  categoryName?: string;
  expectCreateCategory: boolean;
  expectImportMenu: boolean;
};

/** Must resolve to create_service_category (not menu import). */
export const E2E251_CREATE_CATEGORY_SCENARIOS: readonly E2e251CatalogCategoryScenario[] =
  [
    {
      id: 'canon-catalog-category-named',
      prompt: 'Add a new catalog category named QA Nails',
      categoryName: 'QA Nails',
      expectCreateCategory: true,
      expectImportMenu: false,
    },
    {
      id: 'catalog-category-called',
      prompt: 'Add a new catalog category called Wellness',
      categoryName: 'Wellness',
      expectCreateCategory: true,
      expectImportMenu: false,
    },
    {
      id: 'create-catalog-category-named',
      prompt: 'Create a catalog category named Spa Treatments',
      categoryName: 'Spa Treatments',
      expectCreateCategory: true,
      expectImportMenu: false,
    },
    {
      id: 'service-category-still-ok',
      prompt: 'Add a new service category called Color',
      categoryName: 'Color',
      expectCreateCategory: true,
      expectImportMenu: false,
    },
    {
      id: 'bare-new-category-named',
      prompt: 'Add a new category named Pedicure',
      categoryName: 'Pedicure',
      expectCreateCategory: true,
      expectImportMenu: false,
    },
    {
      id: 'create-category-quotes',
      prompt: 'Create catalog category "QA E2E251 Cats"',
      categoryName: 'QA E2E251 Cats',
      expectCreateCategory: true,
      expectImportMenu: false,
    },
    {
      id: 'voice-add-catalog-category',
      prompt: 'add catalog category named brows please',
      categoryName: 'brows',
      expectCreateCategory: true,
      expectImportMenu: false,
    },
    {
      id: 'question-can-you-add-catalog-category',
      prompt: 'Can you add a new catalog category named Lash Lift?',
      categoryName: 'Lash Lift',
      expectCreateCategory: true,
      expectImportMenu: false,
    },
    {
      id: 'create-new-catalog-category',
      prompt: 'Create a new catalog category named Makeup',
      categoryName: 'Makeup',
      expectCreateCategory: true,
      expectImportMenu: false,
    },
    {
      id: 'add-catalog-category-no-article',
      prompt: 'Add catalog category named Extensions',
      categoryName: 'Extensions',
      expectCreateCategory: true,
      expectImportMenu: false,
    },
  ];

/** True menu/OCR import prompts must still match import. */
export const E2E251_KEEP_IMPORT_SCENARIOS: readonly E2e251CatalogCategoryScenario[] =
  [
    {
      id: 'import-from-menu-photo',
      prompt: 'Import services from the menu photo',
      expectCreateCategory: false,
      expectImportMenu: true,
    },
    {
      id: 'scan-the-menu',
      prompt: 'scan the menu',
      expectCreateCategory: false,
      expectImportMenu: true,
    },
    {
      id: 'add-from-the-menu',
      prompt: 'add from the menu',
      expectCreateCategory: false,
      expectImportMenu: true,
    },
    {
      id: 'import-menu-text-lines',
      prompt:
        'Import this menu: Facial 60min $50, Haircut 30min $25',
      expectCreateCategory: false,
      expectImportMenu: true,
    },
    {
      id: 'create-catalog-from-ocr',
      prompt: 'Create catalog from OCR of the menu photo',
      expectCreateCategory: false,
      expectImportMenu: true,
    },
  ];
