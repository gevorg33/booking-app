/**
 * AI-ROADMAP Phase 1 — second pilot domain: `catalog`.
 *
 * Chosen deliberately to stress the shape in ways the appointment pilot could
 * not:
 *   - it has genuine READ commands (T0); all 8 appointment specs were mutating,
 *     so the read tier was untested;
 *   - `bulk_create_catalog` takes a NESTED draft (a category plus its service
 *     lines), which the original `string | number | boolean | string[]` variable
 *     types could not express — it forced `object` / `object[]` into the
 *     contract;
 *   - it is the domain of e2e-bug.347, where one prompt hit five independent
 *     parsing defects because the service-line shape lived only inside a regex.
 *     Declaring that shape here is what makes it checkable.
 *
 * `surfaces` and `handler` are copied from the live registry; the conformance
 * suite fails if they drift.
 */
import type {
  CommandSpec,
  CommandVariableSpec,
} from './ai-command-spec.types.js';

/**
 * One catalog service line. This is the shape e2e-bug.347's regex was trying to
 * recover from free text ("service A, 30 minutes, $50"); as a declared schema
 * the planner can fill it directly instead of the parser guessing.
 */
const SERVICE_LINE_PROPERTIES: Readonly<Record<string, CommandVariableSpec>> = {
  serviceName: {
    type: 'string',
    description: 'Name of the service to create.',
    required: true,
    resolver: 'none',
  },
  durationMinutes: {
    type: 'number',
    description: 'How long the service takes, in minutes.',
    required: true,
    resolver: 'none',
  },
  price: {
    type: 'number',
    description: 'Service price in the business currency.',
    required: true,
    resolver: 'money',
  },
};

export const CATALOG_COMMAND_SPECS: readonly CommandSpec[] = [
  {
    id: 'catalog.create_category',
    aliases: ['create_service_category'],
    domain: 'catalog',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['staff', 'manager', 'owner'] },
    risk: 'T1',
    description:
      'Create a new, empty service category to group services under in the catalog.',
    variables: {
      categoryName: {
        type: 'string',
        description: 'Name of the new category.',
        required: true,
        resolver: 'none',
      },
    },
    examples: [
      'add a new service category called Wellness',
      'create a catalog category named Hair Care',
    ],
    confirm: 'if-ambiguous',
    // §47 declared this `manual` on the grounds that "no delete-category command
    // exists". That was wrong: `delete_service_category` is in the registry and
    // always was — §47 searched the 16 *specced* commands rather than the 696
    // registry entries. Porting the catalog slice (§56) surfaced it.
    compensation: {
      kind: 'inverse',
      command: 'catalog.delete_category',
      captures: ['categoryId'],
    },
    handler: 'AiCatalogService',
  },
  {
    id: 'catalog.create_with_services',
    aliases: ['bulk_create_catalog'],
    domain: 'catalog',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['staff', 'manager', 'owner'] },
    // T3: creates a category AND an unbounded list of services in one command.
    risk: 'T3',
    description:
      'Create a service category together with the services that belong to it, in one step.',
    variables: {
      catalogDraft: {
        type: 'object',
        description: 'The category and the services to create under it.',
        required: true,
        resolver: 'none',
        properties: {
          categoryName: {
            type: 'string',
            description: 'Name of the category to create or reuse.',
            required: true,
            resolver: 'none',
          },
          services: {
            type: 'object[]',
            description: 'Services to create under the category.',
            required: true,
            resolver: 'none',
            properties: SERVICE_LINE_PROPERTIES,
          },
        },
      },
    },
    examples: [
      'create a category Y with three services: service A, 30 minutes, $50; service B, 45 minutes, $45',
      "create category Hair with Women's cut 60m $65, Men's cut 30m $35",
    ],
    confirm: 'always',
    // T3 and multi-entity: it creates a category and N services in one call, so
    // undoing it means knowing exactly which rows it made.
    compensation: {
      kind: 'manual',
      reason:
        'Creates a category and its services together; unwinding needs the created ids, which the executor does not capture.',
    },
    handler: 'AiCatalogService',
  },
  {
    id: 'catalog.update_service',
    aliases: ['update_service'],
    domain: 'catalog',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['staff', 'manager', 'owner'] },
    risk: 'T1',
    description:
      'Change an existing service — its name, price, duration, or category.',
    variables: {
      serviceName: {
        type: 'string',
        description: 'Service to change.',
        required: true,
        resolver: 'service',
      },
      newName: {
        type: 'string',
        description: 'Rename the service.',
        required: false,
        resolver: 'none',
      },
      price: {
        type: 'number',
        description: 'New price.',
        required: false,
        resolver: 'money',
      },
      durationMinutes: {
        type: 'number',
        description: 'New duration in minutes.',
        required: false,
        resolver: 'none',
      },
      categoryName: {
        type: 'string',
        description: 'Move the service into this category.',
        required: false,
        resolver: 'none',
      },
    },
    examples: [
      'change the price of a deep tissue massage to 130',
      'make the facial 45 minutes instead of 30',
    ],
    confirm: 'if-ambiguous',
    // Restorable, but only against the values the row held beforehand.
    compensation: {
      kind: 'inverse',
      command: 'catalog.update_service',
      captures: ['serviceId', 'previousValues'],
    },
    handler: 'AiCatalogService',
  },
  {
    id: 'catalog.deactivate_service',
    aliases: ['deactivate_service'],
    domain: 'catalog',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['staff', 'manager', 'owner'] },
    risk: 'T1',
    description:
      'Retire a service so it can no longer be booked, keeping its history intact.',
    variables: {
      serviceName: {
        type: 'string',
        description: 'Service to retire.',
        required: true,
        resolver: 'service',
      },
    },
    examples: [
      'remove the QA Test Trim service from my catalog',
      'stop offering hot stone massage',
    ],
    confirm: 'always',
    // Reactivation would be the obvious inverse, but `catalog.update_service`
    // only takes name, price, duration and category — it has no activation
    // variable, so it cannot turn a retired service back on.
    compensation: {
      kind: 'manual',
      reason:
        'No command can reactivate a retired service; update_service has no activation variable.',
    },
    handler: 'AiCatalogService',
  },
  {
    id: 'catalog.create_package',
    aliases: ['create_package'],
    domain: 'catalog',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['staff', 'manager', 'owner'] },
    risk: 'T1',
    description:
      'Create a bundle of services sold together at a package price.',
    variables: {
      // §308 (`e2e-bug.462` reverse census). `handleCreatePackageLogic` reads
      // `packageName`, `serviceNames`, `description`, `discountType`,
      // `discountValue`, `expiresAt` and `notifyCustomers`. It never mentions
      // `price` or `discountPercent`, both of which were declared here.
      packageName: {
        type: 'string',
        description: 'Name of the package.',
        required: true,
        resolver: 'none',
      },
      serviceNames: {
        type: 'string[]',
        description: 'Services bundled into the package.',
        required: true,
        resolver: 'service',
      },
      discountType: {
        type: 'string',
        description: 'How the discount is expressed — a percentage or a fixed amount.',
        required: false,
        resolver: 'none',
      },
      discountValue: {
        type: 'number',
        description: 'Size of the discount, interpreted according to discountType.',
        required: false,
        resolver: 'none',
      },
      description: {
        type: 'string',
        description: 'Customer-facing description of the package.',
        required: false,
        resolver: 'none',
      },
      expiresAt: {
        type: 'string',
        description: 'Date the package stops being sellable, ISO 8601.',
        required: false,
        resolver: 'date',
      },
      notifyCustomers: {
        type: 'boolean',
        description: 'Announce the new package to customers.',
        required: false,
        resolver: 'none',
      },
    },
    examples: [
      'create a Spa Day package with massage and facial',
      'bundle haircut and beard trim at 15% off',
    ],
    confirm: 'if-ambiguous',
    compensation: {
      kind: 'manual',
      reason:
        'Packages may already be purchasable; removing one needs a check for existing purchases.',
    },
    handler: 'AiCatalogService',
  },
  {
    id: 'catalog.assign_services_category_bulk',
    aliases: ['bulk_assign_services_category'],
    domain: 'catalog',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['staff', 'manager', 'owner'] },
    risk: 'T3',
    description: 'Move several existing services into a category at once.',
    variables: {
      serviceNames: {
        type: 'string[]',
        description: 'Services to move.',
        required: true,
        resolver: 'service',
      },
      categoryName: {
        type: 'string',
        description: 'Destination category.',
        required: true,
        resolver: 'none',
      },
    },
    examples: [
      'put all the massages under the Massage category',
      'move haircut and blow dry into Hair Care',
    ],
    confirm: 'always',
    compensation: {
      kind: 'manual',
      reason:
        'Restoring each service to its prior category needs per-row pre-state the executor does not capture.',
    },
    handler: 'AiCatalogService',
    bulkOf: 'catalog.update_service',
  },
  {
    id: 'catalog.list_packages',
    aliases: ['list_packages'],
    domain: 'catalog',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['staff', 'manager', 'owner'] },
    // First T0 in the pilots: read-only, so no confirmation and no gates
    // beyond classification.
    risk: 'T0',
    description: 'List the service packages this business offers.',
    variables: {
      // §309 (`e2e-bug.462` reverse census): declared `includeInactive`, which
      // nothing can read — `handleListPackagesLogic(deps, businessId)` takes no
      // `params` argument at all. That is §190's documented no-input shape, so
      // `{}` is the correct declaration and the command is a named exemption.
    },
    examples: [
      'what packages do we sell',
      'list our packages',
      'What packages do I currently offer?',
    ],
    confirm: 'never',
    handler: 'AiCatalogService',
  },
  {
    id: 'catalog.list_subscription_plans',
    aliases: ['list_subscription_plans'],
    domain: 'catalog',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['staff', 'manager', 'owner'] },
    risk: 'T0',
    description: 'List the subscription/membership plans this business offers.',
    variables: {
      // §309 (`e2e-bug.462` reverse census): declared `includeInactive`, which
      // `handleListSubscriptionPlansLogic` never reads, and omitted
      // `serviceName`, which it does. Wrong in both directions on one command.
      serviceName: {
        type: 'string',
        description: 'Only list plans that include this service.',
        required: false,
        resolver: 'service',
      },
    },
    examples: ['show our membership plans', 'what subscriptions do we offer'],
    confirm: 'never',
    handler: 'AiCatalogService',
  },
  {
    id: 'catalog.delete_category',
    aliases: ['delete_service_category'],
    domain: 'catalog',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['staff', 'manager', 'owner'] },
    risk: 'T1',
    description:
      'Delete a service category. Services in it are not deleted; they lose the category.',
    variables: {
      name: {
        type: 'string',
        description: 'Category to delete.',
        required: true,
        resolver: 'none',
      },
    },
    examples: [
      'delete the Wellness category',
      'remove the Hair Care service category',
    ],
    confirm: 'always',
    compensation: {
      kind: 'manual',
      reason:
        'Recreating the category would not restore which services were assigned to it.',
    },
    handler: 'AiCatalogService',
  },
  {
    id: 'catalog.update_category',
    aliases: ['update_service_category'],
    domain: 'catalog',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['staff', 'manager', 'owner'] },
    risk: 'T1',
    description: 'Rename a service category or change its display settings.',
    variables: {
      name: {
        type: 'string',
        description: 'Category to change.',
        required: true,
        resolver: 'none',
      },
      newName: {
        type: 'string',
        description: 'New category name.',
        required: false,
        resolver: 'none',
      },
    },
    examples: [
      'rename the Wellness category to Spa',
      'change the Hair category name',
    ],
    confirm: 'if-ambiguous',
    compensation: {
      kind: 'inverse',
      command: 'catalog.update_category',
      captures: ['categoryId', 'previousName'],
    },
    handler: 'AiCatalogService',
  },
  {
    id: 'catalog.activate_package',
    aliases: ['activate_package'],
    domain: 'catalog',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['staff', 'manager', 'owner'] },
    risk: 'T1',
    description: 'Make an existing package purchasable again.',
    variables: {
      name: {
        type: 'string',
        description: 'Package to activate.',
        required: true,
        resolver: 'none',
      },
    },
    examples: [
      'activate the Bridal package',
      'turn the Summer package back on',
    ],
    confirm: 'if-ambiguous',
    compensation: {
      kind: 'inverse',
      command: 'catalog.deactivate_package',
      captures: ['packageId'],
    },
    handler: 'AiCatalogService',
  },
  {
    id: 'catalog.deactivate_package',
    aliases: ['deactivate_package'],
    domain: 'catalog',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['staff', 'manager', 'owner'] },
    risk: 'T1',
    description: 'Stop offering a package without deleting it.',
    variables: {
      name: {
        type: 'string',
        description: 'Package to deactivate.',
        required: true,
        resolver: 'none',
      },
    },
    examples: [
      'stop selling the Bridal package',
      'deactivate the Summer bundle',
    ],
    confirm: 'always',
    compensation: {
      kind: 'inverse',
      command: 'catalog.activate_package',
      captures: ['packageId'],
    },
    handler: 'AiCatalogService',
  },
  {
    id: 'catalog.duplicate_package',
    aliases: ['duplicate_package'],
    domain: 'catalog',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['staff', 'manager', 'owner'] },
    risk: 'T1',
    description: 'Copy an existing package as the basis for a new one.',
    variables: {
      name: {
        type: 'string',
        description: 'Package to duplicate.',
        required: true,
        resolver: 'none',
      },
    },
    examples: [
      'duplicate the Bridal package',
      'copy the Summer bundle as a new one',
    ],
    confirm: 'if-ambiguous',
    compensation: {
      kind: 'manual',
      reason:
        'The copy may already have been edited or sold; removing it needs a purchase check.',
    },
    handler: 'AiCatalogService',
  },
  {
    id: 'catalog.update_package',
    aliases: ['update_package'],
    domain: 'catalog',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['staff', 'manager', 'owner'] },
    risk: 'T1',
    description:
      'Change an existing package — its name, price, or the services it contains.',
    variables: {
      name: {
        type: 'string',
        description: 'Package to change.',
        required: true,
        resolver: 'none',
      },
      price: {
        type: 'number',
        description: 'New package price.',
        required: false,
        resolver: 'money',
      },
    },
    examples: [
      'change the Bridal package price to 300',
      'update the Summer bundle',
    ],
    confirm: 'if-ambiguous',
    compensation: {
      kind: 'inverse',
      command: 'catalog.update_package',
      captures: ['packageId', 'previousValues'],
    },
    handler: 'AiCatalogService',
  },
  {
    id: 'catalog.configure_package_online_payment',
    aliases: ['configure_package_online_payment'],
    domain: 'catalog',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['staff', 'manager', 'owner'] },
    risk: 'T1',
    description: 'Turn online payment on or off for a package.',
    variables: {
      name: {
        type: 'string',
        description: 'Package to configure.',
        required: true,
        resolver: 'none',
      },
      enabled: {
        type: 'boolean',
        description: 'Whether online payment is allowed.',
        required: true,
        resolver: 'none',
      },
    },
    examples: [
      'allow online payment for the Bridal package',
      'disable card payment on the Summer bundle',
    ],
    confirm: 'if-ambiguous',
    compensation: {
      kind: 'inverse',
      command: 'catalog.configure_package_online_payment',
      captures: ['packageId', 'previousEnabled'],
    },
    handler: 'AiCatalogService',
  },
  {
    id: 'catalog.activate_subscription_plan',
    aliases: ['activate_subscription_plan'],
    domain: 'catalog',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['staff', 'manager', 'owner'] },
    risk: 'T1',
    description: 'Make a subscription plan available for customers to join.',
    variables: {
      name: {
        type: 'string',
        description: 'Plan to activate.',
        required: true,
        resolver: 'none',
      },
    },
    examples: ['activate the Gold membership', 'turn the monthly plan back on'],
    confirm: 'if-ambiguous',
    compensation: {
      kind: 'inverse',
      command: 'catalog.deactivate_subscription_plan',
      captures: ['planId'],
    },
    handler: 'AiCatalogService',
  },
  {
    id: 'catalog.deactivate_subscription_plan',
    aliases: ['deactivate_subscription_plan'],
    domain: 'catalog',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['staff', 'manager', 'owner'] },
    risk: 'T1',
    description: 'Stop offering a subscription plan to new customers.',
    variables: {
      name: {
        type: 'string',
        description: 'Plan to deactivate.',
        required: true,
        resolver: 'none',
      },
    },
    examples: [
      'stop offering the Gold membership',
      'deactivate the monthly plan',
    ],
    confirm: 'always',
    compensation: {
      kind: 'inverse',
      command: 'catalog.activate_subscription_plan',
      captures: ['planId'],
    },
    handler: 'AiCatalogService',
  },
  {
    id: 'catalog.create_subscription_plan',
    aliases: ['create_subscription_plan'],
    domain: 'catalog',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['staff', 'manager', 'owner'] },
    risk: 'T1',
    description: 'Create a new subscription plan customers can join.',
    variables: {
      name: {
        type: 'string',
        description: 'Name of the new plan.',
        required: true,
        resolver: 'none',
      },
      price: {
        type: 'number',
        description: 'Recurring price.',
        required: true,
        resolver: 'money',
      },
    },
    examples: [
      'create a Gold membership at 50 a month',
      'add a monthly subscription plan',
    ],
    confirm: 'if-ambiguous',
    compensation: {
      kind: 'manual',
      reason:
        'A plan may already have subscribers; removing one needs a subscription check.',
    },
    handler: 'AiCatalogService',
  },
  {
    id: 'catalog.update_subscription_plan',
    aliases: ['update_subscription_plan'],
    domain: 'catalog',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['staff', 'manager', 'owner'] },
    risk: 'T1',
    description:
      'Change an existing subscription plan — its name, price, or benefits.',
    variables: {
      name: {
        type: 'string',
        description: 'Plan to change.',
        required: true,
        resolver: 'none',
      },
      price: {
        type: 'number',
        description: 'New recurring price.',
        required: false,
        resolver: 'money',
      },
    },
    examples: [
      'change the Gold membership to 60 a month',
      'update the monthly plan price',
    ],
    confirm: 'always',
    compensation: {
      kind: 'inverse',
      command: 'catalog.update_subscription_plan',
      captures: ['planId', 'previousValues'],
    },
    handler: 'AiCatalogService',
  },
  {
    id: 'catalog.assign_subscription_to_customer',
    aliases: ['assign_subscription_to_customer'],
    domain: 'catalog',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['staff', 'manager', 'owner'] },
    risk: 'T2',
    description: 'Put a specific customer onto a subscription plan.',
    variables: {
      customerName: {
        type: 'string',
        description: 'Customer to subscribe.',
        required: true,
        resolver: 'customer',
      },
      planName: {
        type: 'string',
        description: 'Plan to assign.',
        required: true,
        resolver: 'none',
      },
    },
    examples: [
      'put Gevorg on the Gold membership',
      'subscribe Mary to the monthly plan',
    ],
    confirm: 'always',
    compensation: {
      kind: 'manual',
      reason:
        'Assigning a subscription may start billing; unwinding it is a billing operation.',
    },
    handler: 'AiCatalogService',
  },
  {
    id: 'catalog.create_gift_card_bundle',
    aliases: ['create_gift_card_bundle'],
    domain: 'catalog',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['staff', 'manager', 'owner'] },
    risk: 'T1',
    description: 'Create a gift card bundle customers can buy.',
    variables: {
      name: {
        type: 'string',
        description: 'Name of the bundle.',
        required: true,
        resolver: 'none',
      },
      amount: {
        type: 'number',
        description: 'Gift card value.',
        required: true,
        resolver: 'money',
      },
    },
    examples: [
      'create a 100 dollar gift card bundle',
      'add a gift bundle worth 50',
    ],
    confirm: 'if-ambiguous',
    compensation: {
      kind: 'manual',
      reason:
        'A bundle may already have been purchased; removing one needs a purchase check.',
    },
    handler: 'AiCatalogService',
  },
  {
    id: 'catalog.configure_gift_card_products',
    aliases: ['configure_gift_card_products'],
    domain: 'catalog',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['staff', 'manager', 'owner'] },
    risk: 'T1',
    description:
      'Change which gift card products are offered and at what values.',
    variables: {
      name: {
        type: 'string',
        description: 'Gift card product to configure.',
        required: true,
        resolver: 'none',
      },
    },
    examples: [
      'change our gift card amounts',
      'configure the gift card products we sell',
    ],
    confirm: 'if-ambiguous',
    compensation: {
      kind: 'inverse',
      command: 'catalog.configure_gift_card_products',
      captures: ['productId', 'previousValues'],
    },
    handler: 'AiCatalogService',
  },
  {
    id: 'catalog.configure_service_featured',
    aliases: ['configure_service_featured'],
    domain: 'catalog',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['staff', 'manager', 'owner'] },
    risk: 'T1',
    description:
      'Feature or unfeature a service so it is highlighted to customers.',
    variables: {
      serviceName: {
        type: 'string',
        description: 'Service to feature.',
        required: true,
        resolver: 'service',
      },
      featured: {
        type: 'boolean',
        description: 'Whether the service is featured.',
        required: true,
        resolver: 'none',
      },
    },
    examples: ['feature the hot stone massage', 'stop featuring the facial'],
    confirm: 'never',
    compensation: {
      kind: 'inverse',
      command: 'catalog.configure_service_featured',
      captures: ['serviceId', 'previousFeatured'],
    },
    handler: 'AiCatalogService',
  },
  {
    id: 'catalog.update_service_duration_buffer',
    aliases: ['update_service_duration_buffer'],
    domain: 'catalog',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['staff', 'manager', 'owner'] },
    risk: 'T1',
    description:
      'Change the gap booked after a service before the next appointment can start.',
    variables: {
      serviceName: {
        type: 'string',
        description: 'Service to change.',
        required: true,
        resolver: 'service',
      },
      bufferMinutes: {
        type: 'number',
        description: 'Minutes of buffer after the service.',
        required: true,
        resolver: 'none',
      },
    },
    examples: [
      'add 15 minutes buffer after a massage',
      'set the facial cleanup gap to 10 minutes',
    ],
    confirm: 'if-ambiguous',
    compensation: {
      kind: 'inverse',
      command: 'catalog.update_service_duration_buffer',
      captures: ['serviceId', 'previousBufferMinutes'],
    },
    handler: 'AiCatalogService',
  },
  {
    id: 'catalog.set_service_compatibility',
    aliases: ['set_service_compatibility'],
    domain: 'catalog',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['staff', 'manager', 'owner'] },
    risk: 'T1',
    description: 'Declare which services can be booked together in one visit.',
    variables: {
      // §308 (`e2e-bug.462` reverse census). This spec was wrong in **name and
      // meaning**. `handleSetServiceCompatibilityLogic` reads
      // `params.incompatibleServiceNames ?? params.serviceNames`, takes the
      // first two, and records an *incompatible* pair — its own failure text is
      // "Name two services that cannot be booked same visit" and its `missing`
      // is `['incompatibleServiceNames']`.
      //
      // What was here: `serviceName` (singular — never read; the handler reads
      // the plural) and `compatibleWith`, `required: true`, described as
      // "Services bookable alongside it" — a required input no handler reads,
      // documenting the opposite of what the command does.
      //
      // The command's `description` is inverted the same way and is NOT fixed
      // here: descriptions feed `commandMatchText`, so editing one invalidates
      // the committed embedding cache and needs `OPENAI_API_KEY`. Tracked
      // separately.
      incompatibleServiceNames: {
        type: 'string[]',
        description:
          'The two services that cannot be booked in the same visit. Exactly two are used.',
        required: true,
        resolver: 'service',
      },
      serviceNames: {
        type: 'string[]',
        description:
          'Fallback spelling the handler also accepts when incompatibleServiceNames is absent.',
        required: false,
        resolver: 'service',
      },
    },
    examples: [
      'allow massage and facial together',
      'set which services can be combined',
    ],
    confirm: 'if-ambiguous',
    compensation: {
      kind: 'inverse',
      command: 'catalog.set_service_compatibility',
      captures: ['serviceId', 'previousCompatibility'],
    },
    handler: 'AiCatalogService',
  },
  {
    id: 'catalog.configure_multi_service_settings',
    aliases: ['configure_multi_service_settings'],
    domain: 'catalog',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['staff', 'manager', 'owner'] },
    risk: 'T1',
    description: 'Change how multi-service visits are scheduled and priced.',
    variables: {
      name: {
        type: 'string',
        description: 'Setting to change.',
        required: true,
        resolver: 'none',
      },
    },
    examples: [
      'change our multi service booking rules',
      'configure spa day settings',
    ],
    confirm: 'if-ambiguous',
    compensation: {
      kind: 'inverse',
      command: 'catalog.configure_multi_service_settings',
      captures: ['settingKey', 'previousValue'],
    },
    handler: 'AiCatalogService',
  },
] as const;
