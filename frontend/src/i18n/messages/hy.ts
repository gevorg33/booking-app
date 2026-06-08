import type { MessageTree } from '../types';

const hy: MessageTree = {
  common: {
    save: 'Պահպանել',
    saved: 'Պահպանված է',
    cancel: 'Չեղարկել',
    delete: 'Ջնջել',
    edit: 'Խմբագրել',
    add: 'Ավելացնել',
    create: 'Ստեղծել',
    update: 'Թարմացնել',
    loading: 'Բեռնվում է…',
    saving: 'Պահպանվում է…',
    saveChanges: 'Պահպանել փոփոխությունները',
    search: 'Որոնել',
    back: 'Հետ',
    continue: 'Շարունակել',
    close: 'Փակել',
    yes: 'Այո',
    no: 'Ոչ',
    required: 'Պարտադիր',
    optional: 'Ընտրովի',
    none: 'Չկա',
    actions: 'Գործողություններ',
    status: 'Կարգավիճակ',
    name: 'Անուն',
    email: 'Էլ. փոստ',
    phone: 'Հեռախոս',
    password: 'Գաղտնաբառ',
    description: 'Նկարագրություն',
    address: 'Հասցե',
    notes: 'Նշումներ',
    price: 'Գին',
    duration: 'Տևողություն',
    minutes: 'ր',
    today: 'Այսօր',
    errorGeneric: 'Ինչ-որ բան սխալ գնաց։ Խնդրում ենք կրկին փորձել։',
    poweredBy: 'Մշակված է OptiSchedule-ի կողմից',
    duplicate: 'Կրկնօրինակել',
    remove: 'Հեռացնել',
    default: 'Լռելյայն',
    deactivate: 'Ապաակտիվացնել',
    deactivating: 'Ապաակտիվացվում է…',
    confirmCancel: 'Հաստատել չեղարկումը',
    keep: 'Պահել',
    provider: 'Մասնագետ',
    anonymous: 'Անանուն',
    available: 'Հասանելի',
    unavailable: 'Անհասանելի',
    booked: 'Ամրագրված',
    blocked: 'Արգելափակված',
    selectProvider: 'Ընտրեք մասնագետ…',
    selectEmployee: 'Ընտրեք աշխատակից…',
    addPeriod: 'Ավելացնել ժամանակահատված',
    type: 'Տեսակ',
    startTime: 'Սկիզբ',
    endTime: 'Ավարտ',
    label: 'Պիտակ',
    employee: 'Աշխատակից',
    date: 'Ամսաթիվ',
    repeatWeeks: 'Կրկնել շաբաթներ',
    startDate: 'Սկզբի ամսաթիվ',
    endDate: 'Ավարտի ամսաթիվ',
    timeFormat24h: '(24ժ)',
    creating: 'Ստեղծվում է…',
    applying: 'Կիրառվում է…',
    confirmingCancel: 'Չեղարկվում է…',
    popular: 'Հայտնի',
    renews: 'Երկարացում',
    noPlan: 'Պլան չկա',
    availablePlans: 'Հասանելի պլաններ',
    refreshStatus: 'Թարմացնել կարգավիճակը',
    notApplicable: 'N/A',
    inactive: 'Անգործուն',
    active: 'Ակտիվ',
    customer: 'Հաճախորդ',
    note: 'Նշում',
    percent: 'Տոկոս',
    flat: 'Ֆիքսված',
    revenue: 'Եկամուտ',
    revenueCurrency: 'Եկամուտ ({currency})',
    grossRevenueCurrency: 'Ընդհանուր եկամուտ ({currency})',
    taxCollectedCurrency: 'Հավաքված հարկ ({currency})',
    netRevenueCurrency: 'Զուտ եկամուտ ({currency})',
    expenses: 'Ծախսեր',
    expensesCurrency: 'Ծախսեր ({currency})',
    commissions: 'Հանձնաժողովներ',
    commissionsCurrency: 'Հանձնաժողովներ ({currency})',
    netProfit: 'Զուտ շահույթ',
    netProfitCurrency: 'Զուտ շահույթ ({currency})',
    hours: 'Ժամեր',
    utilization: 'Օգտագործում',
    completed: 'Ավարտված',
    noShows: 'Չներկայացած',
  },
  dialog: {
    confirmTitle: 'Հաստատել',
    promptTitle: 'Մուտքագրեք տվյալները',
  },
  datePicker: {
    selectDate: 'Ընտրել ամսաթիվ',
    formatHint: 'Օգտագործեք {format} ձևաչափը (օր. {example})',
    invalidDate: 'Մուտքագրեք վավեր ամսաթիվ {format} ձևաչափով',
    openCalendar: 'Բացել օրացույցը',
    today: 'Այսօր',
    clear: 'Մաքրել',
    prevMonth: 'Նախորդ ամիս',
    nextMonth: 'Հաջորդ ամիս',
    weekdays: {
      mon: 'Երկ',
      tue: 'Երք',
      wed: 'Չրք',
      thu: 'Հնգ',
      fri: 'Ուրբ',
      sat: 'Շբթ',
      sun: 'Կիր',
    },
  },
  feedback: {
    creating: 'Պահպանվում է…',
    updating: 'Պահպանվում է…',
    deleting: 'Ջնջվում է…',
    created: 'Հաջողությամբ ստեղծվեց։',
    updated: 'Հաջողությամբ պահպանվեց։',
    deleted: 'Հաջողությամբ ջնջվեց։',
    failed: 'Ինչ-որ բան սխալ գնաց։ Խնդրում ենք կրկին փորձել։',
    failedCreate: 'Չհաջողվեց ստեղծել։',
    failedUpdate: 'Չհաջողվեց պահպանել։',
    failedDelete: 'Չհաջողվեց ջնջել։',
    bookingCreated: 'Ձեր ամրագրումը հաստատված է։',
    bookingCancelled: 'Ձեր ամրագրումը չեղարկված է։',
    purchaseCompleted: 'Գնումը հաջողությամբ ավարտվեց։',
  },
  languages: {
    en: 'Անգլերեն',
    hy: 'Հայերեն',
    ru: 'Ռուսերեն',
    title: 'Լեզու',
    description: 'Ընտրեք վահանակի և ամրագրման էջերի լեզուն։',
    publicDescription: 'Հանրային ամրագրման էջի լեզուն։',
    saved: 'Լեզվի կարգավորումը պահպանված է։',
  },
  nav: {
    dashboard: 'Վահանակ',
    bookings: 'Ամրագրումներ և օրացույց',
    schedule: 'Ժամանակացույց',
    employees: 'Աշխատակիցներ',
    customers: 'Հաճախորդներ',
    appointments: 'Ամրագրումներ',
    services: 'Ծառայություններ',
    businessProfile: 'Բիզնեսի պրոֆիլ',
    billing: 'Վճարումներ',
    aiOps: 'AI գործառնություններ',
    settings: 'Կարգավորումներ',
    reports: 'Հաշվետվություններ',
    monetization: 'Եկամուտների կառավարում',
    operations: 'Գործառույթներ',
    reviews: 'Կարծիքներ',
    guide: 'Օգտագործման ուղեցույց',
    integrations: 'Ինտեգրացիաներ',
    crmIntegrations: 'CRM ինտեգրացիաներ',
    labQueue: 'Լաբորատոր հերթ',
    labSpecimens: 'Նմուշների աշխատանք',
    resizeSidebar: 'Փոխել կողային վահանակի լայնությունը',
    signOut: 'Դուրս գալ',
    signIn: 'Մուտք',
    register: 'Գրանցվել',
    getStarted: 'Սկսել',
  },
  auth: {
    welcomeBack: 'Բարի վերադարձ',
    signInSubtitle: 'Մուտք գործեք ձեր հաշիվ',
  
    signingIn: 'Մուտք է կատարվում…',
    signIn: 'Մուտք',
  
    loginFailed: 'Մուտքը չհաջողվեց',
    accountNotFound: 'Այս email-ով հաշիվ չի գտնվել',
    invalidCredentials: 'Սխալ գաղտնաբառ։ Խնդրում ենք փորձել կրկին',
  
    registerPrompt: 'Ստեղծեք հաշիվ՝ սկսելու համար',
    noAccount: 'Հաշիվ չունե՞ք',
    createAccount: 'Ստեղծել հաշիվ',
  
    registerSubtitle: 'Սկսեք ավելի խելացի ամրագրումներ այսօր',
  
    firstName: 'Անուն',
    lastName: 'Ազգանուն',
    businessName: 'Բիզնեսի անուն',
    businessNamePlaceholder: 'Ըստ ցանկության — լռելյայն՝ անձնական',
  
    creatingAccount: 'Հաշիվը ստեղծվում է…',
    createAccountBtn: 'Ստեղծել հաշիվ',
  
    registrationFailed: 'Գրանցումը չհաջողվեց',
  
    hasAccount: 'Արդեն ունե՞ք հաշիվ',
  
    forgotPassword: 'Մոռացե՞լ եք գաղտնաբառը',
    forgotPasswordHint: 'Մուտքագրեք ձեր email-ը, և մենք կուղարկենք նոր գաղտնաբառ սահմանելու հղում',
  
    sendResetLink: 'Ուղարկել վերականգնման հղում',
    resetEmailSent: 'Եթե այս email-ով հաշիվ կա, վերականգնման հղումը ուղարկվել է',
  
    setPasswordTitle: 'Սահմանեք գաղտնաբառ',
    setPasswordSubtitle: 'Ընտրեք գաղտնաբառ provider հավելվածի համար',
  
    newPassword: 'Նոր գաղտնաբառ',
    setPasswordBtn: 'Պահպանել գաղտնաբառը',
  
    passwordUpdated: 'Գաղտնաբառը թարմացվեց։ Այժմ կարող եք մուտք գործել',
  
    resetLinkInvalid: 'Այս հղումը սխալ է կամ ժամկետանց',
  
    selectBusiness: 'Ընտրեք բիզնես',
    selectBusinessHint: 'Այս email-ը կապված է մի քանի բիզնեսի հետ։ Ընտրեք, թե որը բացել',
  
    multiTenantHint: 'Փոխեք բիզնեսը առանց դուրս գալու',
  },
  landing: {
    badge: 'AI-հիմքով օպերացիոն հարթակ',
    title: 'Ժամանակացույց, որը մտածում է ձեր բիզնեսի փոխարեն',
  
    subtitle:
      'Արտահայտեք մտադրություն, ոչ թե հրահանգներ։ Մեր AI օպերատորը հասկանում է ձեր բիզնեսի նպատակները և ավտոմատ կերպով կազմակերպում է օպտիմալ ժամանակացույցներ, լուծում է կոնֆլիկտները և բարձրացնում է արդյունավետությունը։',
  
    startFree: 'Սկսել անվճար',
  
    featureAiTitle: 'Մտադրության վրա հիմնված AI',
    featureAiBody:
      'Ասեք «լրացնել դատարկ ժամերը վաղը», և AI-ը կկառուցի վավերացված պլան՝ առանց ձեռքով ժամանակացույց կազմելու',
  
    featureSafeTitle: 'Անվտանգ ըստ նախագծման',
    featureSafeBody:
      'AI-ն առաջարկում է, համակարգը վավերացնում է։ Յուրաքանչյուր գործողություն անցնում է կանոնների ստուգում, սահմանափակումների վալիդացիա և audit logging',
  
    featureCalendarTitle: 'Խելացի ժամանակացույց',
    featureCalendarBody:
      'Բազմամասնագետ օրացույցներ, ծառայությունների բլոկներ և իրական ժամանակի հասանելիություն — նախատեսված կլինիկաների, սալոնների և ծառայությունների բիզնեսների համար',
  },
  marketing: {
    nav: {
      home: 'Գլխավոր',
      pricing: 'Գնային պլաններ',
      trust: 'Անվտանգություն և վստահություն',
      testimonials: 'Կարծիքներ',
    },
  
    footer: {
      tagline: 'OptiSchedule — AI-հիմքով ժամանակացույցի հարթակ',
      rights: '© {year} OptiSchedule. Բոլոր իրավունքները պաշտպանված են',
    },
  
    cta: {
      title: 'Պատրա՞ստ եք արդիականացնել ձեր ժամանակացույցը',
      body: 'Սկսեք անվճար Solo պլանով կամ թարմացրեք թիմի աճի հետ միասին։ Քարտ անհրաժեշտ չէ փորձարկման համար',
      button: 'Սկսել անվճար',
    },
  
    pricing: {
      title: 'Պարզ և թափանցիկ գնագոյացում',
      subtitle:
        'Հիմնական պլան + մեկ օգտագործողի վճարում, որը աճում է ձեր թիմի հետ։ Owner seat-ը միշտ անվճար է',
  
      perMonth: '/ամիս հիմնական',
      providerSeat: 'յուրաքանչյուր մասնագետի համար',
      adminSeat: 'յուրաքանչյուր ադմինի համար',
  
      popular: 'Ամենահայտնի',
      startFree: 'Սկսել անվճար',
      startTrial: 'Սկսել փորձարկում',
      contactSales: 'Կապ վաճառքի հետ',
  
      seatNote: 'Owner seat-ը ներառված է անվճար բոլոր պլաններում',
      annualNote: 'Խնայեք ~20% տարեկան վճարման դեպքում',
  
      checkoutNoteTitle: 'Ինքնասպասարկվող վճարում',
      checkoutNoteBody:
        'Ներկայումս անմիջապես հասանելի են՝ {plan}։ Մյուս պլանները շուտով կլինեն — կապվեք մեզ կամ սկսեք Solo/Starter-ով',
  
      plans: {
        solo: {
          name: 'Solo',
          description: 'Միայնակ մասնագետների և փորձարկման համար',
  
          feature1: '1 մասնագետի seat',
          feature2: '25 AI հրաման ամսական',
          feature3: 'Հանրային ամրագրման էջ',
          feature4: 'Մասնագետի բջջային հավելված',
        },
  
        starter: {
          name: 'Starter',
          description: 'Փոքր սալոնների և կլինիկաների համար (2–5 աշխատակից)',
  
          feature1: 'Մինչև 5 մասնագետի seat',
          feature2: '150 AI հրաման ամսական',
          feature3: 'Waitlist և email աջակցություն',
          feature4: 'Ժամանակացույցի ձևանմուշներ',
          feature5: '2 ադմին dashboard seat',
        },
  
        growth: {
          name: 'Growth',
          description: 'Թիմերի համար, որոնք ամեն օր օգտագործում են AI և mobile',
  
          feature1: 'Մինչև 15 մասնագետի seat',
          feature2: '600 AI հրաման ամսական',
          feature3: 'Ընդլայնված ինտեգրացիաներ',
          feature4: 'Առաջնահերթ աջակցություն',
          feature5: '5 ադմին dashboard seat',
        },
  
        business: {
          name: 'Business',
          description: 'Բազմադերային օպերացիաներ և enterprise ինտեգրացիաներ',
  
          feature1: 'Անսահմանափակ մասնագետի seat',
          feature2: '2000 AI հրաման ամսական',
          feature3: 'Zapier, հաշվապահական export, API հասանելիություն',
          feature4: 'Նվիրված onboarding',
          feature5: 'Անսահմանափակ ադմին seat',
        },
      },
    },
  
    testimonials: {
      title: 'Վստահում են ծառայություն մատուցող բիզնեսները',
      subtitle:
        'Սալոններ, կլինիկաներ և ստուդիաներ օգտագործում են OptiSchedule-ը՝ օրացույցները լցնելու և բացակայությունները նվազեցնելու համար',
  
      items: {
        t1: {
          quote:
            'Առաջին ամսում մենք կիսով չափ նվազեցրինք ժամանակացույցի կոնֆլիկտները։ AI առաջարկները իսկապես հասկանում են մեր սալոնի աշխատանքը',
          author: 'Maria K.',
          role: 'Սեփականատեր',
          business: 'Lumière Hair Studio',
        },
  
        t2: {
          quote:
            'Հիվանդները 24/7 առցանց են ամրագրում, իսկ մեր մասնագետները ստանում են push հիշեցումներ։ GDPR գործիքները հեշտացրեցին համապատասխանությունը',
          author: 'Dr. Arman T.',
          role: 'Կլինիկայի տնօրեն',
          business: 'Yerevan Dental Care',
        },
  
        t3: {
          quote:
            'Excel-ից OptiSchedule անցումը տևեց մեկ կեսօր։ Հանրային ամրագրման էջը մեկ շաբաթում արդեն վերադարձրեց իր արժեքը',
          author: 'Sofia R.',
          role: 'Operations Lead',
          business: 'Balance Yoga & Wellness',
        },
      },
    },
  
    trust: {
      badge: 'Enterprise մակարդակի պրակտիկաներ',
      title: 'Անվտանգություն և վստահություն',
      subtitle:
        'Ձեր բիզնեսի տվյալները և հաճախորդների ամրագրումները պաշտպանված են գաղտնագրումով, audit logs-ով և privacy վերահսկումներով՝ առաջին օրվանից',
  
      commitmentTitle: 'Մեր պարտավորությունը',
      commitmentBody:
        'Մենք նախագծում ենք կարգավորվող ոլորտների համար՝ առողջապահական կլինիկաներ, ծառայողական բիզնեսներ և բազմամասնագիտական թիմեր։ Անվտանգությունը հավելում չէ, այլ յուրաքանչյուր AI գործողության և ինտեգրացիայի մաս',
  
      sections: {
        encryption: {
          title: 'Գաղտնագրում փոխանցման և պահման ընթացքում',
          body:
            'Բոլոր տրաֆիկը օգտագործում է TLS։ Sensitive credentials-ը և ինտեգրացիոն token-ները պահվում են գաղտնագրված։ Session token-ները ունեն ժամկետ և կարող են չեղարկվել',
        },
  
        privacy: {
          title: 'GDPR-համապատասխան գաղտնիության վերահսկում',
          body:
            'Հաճախորդները կարող են export կամ delete անել իրենց տվյալները հանրային ամրագրման ընթացքում։ Consent-ը հավաքվում է checkout-ում՝ տեղայնացված ծանուցումներով',
        },
  
        aiSafety: {
          title: 'AI՝ սահմանափակումներով',
          body:
            'AI օպերատորը առաջարկում է գործողություններ, իսկ համակարգը վավերացնում է դրանք քաղաքականությունների և սահմանափակումների հիման վրա։ Յուրաքանչյուր գործողություն ունի audit logging',
        },
  
        payments: {
          title: 'Անվտանգ վճարումներ Stripe-ով',
          body:
            'Subscription billing-ը իրականացվում է Stripe-ով։ Մենք չենք պահում քարտային տվյալներ մեր սերվերներում',
        },
  
        infrastructure: {
          title: 'Հուսալի ենթակառուցվածք',
          body:
            'Multi-tenant isolation յուրաքանչյուր բիզնեսի համար, health checks և structured logging՝ բարձր հասանելիության համար',
        },
  
        audit: {
          title: 'Audit logs և access վերահսկում',
          body:
            'Role-based իրավունքներ owner/admin/provider դերերի համար։ Բոլոր booking և AI գործողությունները traceable են compliance-ի համար',
        },
      },
    },
  },
  dashboard: {
    welcome: 'Բարի վերադարձ, {name}',
    welcomeThere: 'Բարի վերադարձ',
  
    overview: '{business}-ի ընդհանուր պատկեր',
  
    yourBusiness: 'ձեր բիզնեսը',
  
    todaysBookings: 'Այսօրվա ամրագրումները',
    activeEmployees: 'Ակտիվ աշխատակիցներ',
    services: 'Ծառայություններ',
    totalCustomers: 'Հաճախորդներ',
  
    utilization: 'Օգտագործման արդյունավետություն',
    revenueThisMonth: 'Եկամուտ (ամիս)',
    revenueThisMonthCurrency: 'Եկամուտ (ամիս, {currency})',
    bookingsThisMonth: 'Ամրագրումներ (ամիս)',
    noShowRate: 'Չներկայացման տոկոս',
  
    quickActions: 'Արագ գործողություններ',
  
    newBooking: 'Նոր ամրագրում',
    manageSchedule: 'Կառավարել ժամանակացույցը',
    aiOperations: 'AI գործառնություններ',
    addEmployee: 'Ավելացնել աշխատակից',
  
    aiOperator: 'AI օպերատոր',
    aiOperatorBody:
      'Արտահայտեք ձեր մտադրությունը, իսկ AI-ը կկառավարի գործողությունները։ Փորձեք հրամաններ՝ «օպտիմալացնել վաղվա ժամանակացույցը» կամ «լուծել հաջորդ շաբաթվա կոնֆլիկտները»',
  
    openAiOps: 'Բացել AI գործառնությունները',
  },
  bookings: {
    title: 'Ամրագրումներ և օրացույց',
    newBooking: 'Նոր ամրագրում',
  
    calendar: 'Օրացույց',
    list: 'Ցուցակ',
  
    noBookings: 'Ամրագրումներ չեն գտնվել',
  
    markPaidCash: 'Նշել որպես վճարված (կանխիկ)',
  
    filterAll: 'Բոլորը',
    filterToday: 'Այսօր',
    filterWeek: 'Այս շաբաթ',
  
    customer: 'Հաճախորդ',
    provider: 'Մասնագետ',
    service: 'Ծառայություն',
    time: 'Ժամ',
    payment: 'Վճարում',
    details: 'Մանրամասներ',
  
    changeStatus: 'Փոխել կարգավիճակը',
    cancelBooking: 'Չեղարկել ամրագրումը',
  
    selectCustomer: 'Ընտրեք հաճախորդ…',
    confirmBooking: 'Հաստատել ամրագրումը',
  
    unknownProvider: 'Անհայտ մասնագետ',
  
    statusPending: 'Ամրագրված',
    statusConfirmed: 'Հաստատված',
    statusInProgress: 'Ընթացքի մեջ',
    statusCompleted: 'Ավարտված',
    statusCancelled: 'Չեղարկված',
    statusNoShow: 'Չներկայացած',
  
    paymentPending: 'Սպասվող',
    paymentPartiallyPaid: 'Մասնակի վճարված',
    paymentPaid: 'Վճարված',
    paymentRefunded: 'Վերադարձված',
    paymentNa: 'N/A',
  
    confirmStatusChange: 'Հաստատել կարգավիճակի փոփոխությունը',
  
    statusUpdateSuccess: 'Ամրագրումը թարմացվել է',
    statusUpdateFailed: 'Չհաջողվեց թարմացնել ամրագրումը',
    subtitle: 'Ընտրեք մասնագետ և օր՝ նրա գրաֆիկը կառավարելու համար',
    aiInsightsTitle: 'Ամրագրման հնարավորություններ',
    selectProvider: 'Ընտրեք մասնագետ…',
    legendBooked: 'Ամրագրված',
    legendBlocked: 'Արգելափակված',
    legendUnavailable: 'Անհասանելի',
    selectProviderEmpty: 'Ընտրեք մասնագետ՝ գրաֆիկը տեսնելու համար',
    noScheduleDay: 'Այս օրվա համար գրաֆիկ չկա',
    newBookingTitle: 'Նոր ամրագրում',
    anyService: 'Ցանկացած ծառայություն',
    slotAvailable: 'Ժամանակահատված հասանելի է',
    noMatchingServices: 'Համապատասխան ծառայություններ չգտնվեցին',
    selectService: 'Ընտրեք ծառայություն…',
    periodServicesHint: 'Այս ժամանակահատվածի ծառայություններ՝ {services}',
    servicesInPeriodHint: 'Ցուցադրվում են միայն այս ժամանակահատվածում առաջարկվող ծառայությունները',
    internalNotesPlaceholder: 'Ներքին նշումներ…',
    bookingDescriptionPlaceholder: 'Ամրագրման նկարագրություն…',
    createFailed: 'Չհաջողվեց ստեղծել ամրագրումը',
    bookingCreated: 'Ամրագրումը ստեղծվել է',
    bookingCreating: 'Ամրագրում…',
    confirmBookingAction: 'Հաստատել ամրագրումը',
    providerBookings: '{name}ի ամրագրումները',
    allBookings: 'Բոլոր ամրագրումները',
    bookingsCount: '{count} ամրագրում',
    cancelDialogTitle: 'Չեղարկե՞լ այս ամրագրումը',
    cancelDialogBody: 'Ժամանակահատվածը կրկին հասանելի կդառնա։ Կարող եք ավելացնել պատճառը։',
    cancellationReasonPlaceholder: 'Չեղարկման պատճառ (ըստ ցանկության)',
    emptyDay: 'Այս օրվա համար ամրագրումներ չկան',
    errorsNoTime: 'Ժամ չի ընտրվել',
    errorsSelectCustomer: 'Ընտրեք հաճախորդ',
  },
  employees: {
    title: 'Աշխատակիցներ',
    addEmployee: 'Ավելացնել աշխատակից',
    editEmployee: 'Խմբագրել աշխատակցին',
    deactivate: 'Ապաակտիվացնել',
  
    active: 'Ակտիվ',
    inactive: 'Անգործուն',
  
    role: 'Դեր / պաշտոն',
  
    noEmployees: 'Դեռ աշխատակիցներ չկան',
  
    saveEmployee: 'Պահպանել աշխատակցին',
    profilePicture: 'Պրոֆիլի լուսանկար',
    uploadAvatar: 'Վերբեռնել լուսանկար',
    uploadingPhoto: 'Վերբեռնվում է…',
    removePhoto: 'Հեռացնել լուսանկարը',
    avatarFormatsHint: 'JPEG, PNG, WebP կամ GIF · առավելագույնը 5 MB',
  
    appAccessActive: 'Հավելվածի հասանելիություն',
    appAccessMissing: 'Մուտք չկա հավելվածում',
  
    sendAppAccess: 'Ուղարկել հավելվածի հասանելիություն',
    resendAppAccess: 'Կրկին ուղարկել հասանելիություն',
  
    appAccessSent: 'Կարգավորման email-ը ուղարկվել է',
    appAccessNeedsEmail: 'Ավելացրեք email՝ հավելվածի հասանելիություն ուղարկելու համար',
  
    accessRole: 'Մուտքի դեր',
    accessRoleHint: 'Կառավարում է dashboard-ի և բջջային հավելվածի իրավունքները',
  
    servicesOfferedHint: 'Ընտրեք առնվազն մեկ ծառայություն, որը կարող է մատուցել այս մասնագետը',
  
    servicesRequired: 'Պարտադիր է ընտրել առնվազն մեկ ծառայություն',
    loading: 'Բեռնվում է…',
    appAccessCardTitle: 'Մասնագետի բջջային հավելված',
    appAccessCardBody:
      'Ուղարկեք հավելվածի հասանելիություն՝ մասնագետները մուտք գործեն բջջայինից։ Նրանք տեսնում են միայն իրենց ամրագրումները, եթե manager դեր չունեն։',
    openProviderApp: 'Բացել մասնագետի հավելված →',
    deactivateModalTitle: 'Ապաակտիվացնե՞լ աշխատակցին',
    deactivateModalBody:
      '{name} այլևս չի երևա նոր ամրագրումների համար։ Պատմությունը մնում է հաշվետվություններում։',
    errorsLoadFailed: 'Չհաջողվեց բեռնել աշխատակիցներին',
    errorsSaveFailed: 'Չհաջողվեց պահպանել աշխատակցին',
    errorsDeactivateFailed: 'Չհաջողվեց ապաակտիվացնել',
    errorsInviteFailed: 'Չհաջողվեց ուղարկել հրավերը',
    namePlaceholderOptional: 'Ընտրովի ցուցադրման անուն',
    formSubtitle: 'Պրոֆիլի տվյալները ցուցադրվում են հանրային ամրագրման էջում։',
    titlePlaceholder: 'օր. մասաժիստի մասնագետ',
    servicesOffered: 'Մատուցվող ծառայություններ',
    createEmployee: 'Ստեղծել աշխատակից',
    invalidPhone: 'Մուտքագրեք վավեր հեռախոսահամար երկրի կոդով',
  },
  teamMembers: {
    title: 'Թիմի մուտքի դերեր',
    subtitle: 'Կառավարեք, թե ով կարող է օգտագործել dashboard-ը և տեսնել բոլոր ամրագրումները բջջային հավելվածում',
  
    linkedEmployee: 'Աշխատակցի պրոֆիլ',
    you: 'դուք',
  
    ownerOnlyHint: 'Միայն բիզնեսի սեփականատերը կարող է փոխել թիմի դերերը',
  
    updateFailed: 'Դերի թարմացումը չհաջողվեց',
  
    roles: {
      owner: 'Բիզնեսի սեփականատեր',
      admin: 'Ադմին',
      manager: 'Մենեջեր',
      staff: 'Աշխատակից',
      contributor: 'Մասնագետ',
    },
  },
  customers: {
    title: 'Հաճախորդներ',
    subtitle: 'Որոնեք և կառավարեք ձեր հաճախորդների բազան',
  
    statsTotal: 'Ընդհանուր հաճախորդներ',
    statsFiltered: 'Համապատասխան ֆիլտրերին',
    statsAppointments: 'Ամրագրումներ (ֆիլտրված)',
    statsConfirmed: 'Հաստատված (ֆիլտրված)',
  
    search: 'Որոնում',
    searchPlaceholder: 'Անուն, email կամ հեռախոս…',
    clearSelection: 'Մաքրել հաճախորդի ընտրությունը',
    emailPlaceholder: 'Ֆիլտրել ըստ email-ի…',
    phonePlaceholder: 'Ֆիլտրել ըստ հեռախոսի…',
  
    filterByStatus: 'Ամրագրման կարգավիճակ',
    allStatuses: 'Բոլոր կարգավիճակները',
    clearFilters: 'Մաքրել կարգավիճակի ֆիլտրերը',
  
    sortBy: 'Դասավորել ըստ',
    sortCreated: 'Ստեղծման ամսաթիվ',
    sortUpdated: 'Թարմացման ամսաթիվ',
    sortOrder: 'Դասավորություն',
    newestFirst: 'Նորերը սկզբում',
    oldestFirst: 'Հինները սկզբում',
  
    appointments: 'Ամրագրումներ',
    upcoming: 'Առաջիկա',
    lastVisit: 'Վերջին այց',
    created: 'Ստեղծված',
    updated: 'Թարմացված',
  
    noResults: 'Ոչ մի հաճախորդ չի համապատասխանում ֆիլտրերին',
    loadFailed: 'Չհաջողվեց բեռնել հաճախորդներին',
  
    segment: 'Սեգմենտ',
    allSegments: 'Բոլոր սեգմենտները',
  
    segmentVip: 'VIP',
    segmentAtRisk: 'Ռիսկային',
    segmentHighNoShow: 'Բարձր չներկայացում',
    segmentNew: 'Նոր',
    segmentRegular: 'Կանոնավոր',
  
    vipOnly: 'Միայն VIP',
  
    tags: 'Թեգեր',
    editTags: 'Խմբագրել թեգերը',
    customerTag: 'Հաճախորդի թեգ',
  
    tagNone: 'Չկա',
  
    tagAutoVipHint:
      'VIP կարգավիճակը հիմնված է այցելությունների պատմության վրա։ Պահպանեք՝ պահպանելու VIP թեգը',
  
    allTags: 'Բոլոր թեգերը',
  
    tag: {
      vip: 'VIP',
      regular: 'Կանոնավոր',
      persona: 'Պերսոնա',
      corporate: 'Կորպորատիվ',
      referral: 'Հրապարակում',
    },
  
    vip: 'VIP',
    aiInsightsTitle: 'Հաճախորդների վերլուծություն',
    columnNoShows: 'Չներկայացած',
    detailTitle: 'Հաճախորդ',
    detailLoadFailed: 'Չհաջողվեց բեռնել հաճախորդին',
    statVisits: 'Այցելություններ',
    subscriptionsSection: 'Բաժանորդագրություններ',
    noSubscriptions: 'Բաժանորդագրություններ չկան',
    subscriptionFallback: 'Բաժանորդագրություն',
    subscriptionAppointmentsLeft:
      '{remaining} / {included} ամրագրում մնաց · ավարտվում է {date}',
    hideUsage: 'Թաքցնել օգտագործումը',
    viewUsageHistory: 'Դիտել օգտագործման պատմությունը',
    noUsageYet: 'Դեռ օգտագործում չկա',
    usageRow: '{date} · {count} մնաց',
    appointmentHistorySection: 'Ամրագրումների պատմություն',
    noAppointmentsYet: 'Դեռ ամրագրումներ չկան',
    appointmentFallback: 'Ամրագրում',
    withProvider: '{name}-ի հետ',
  },
  support: {
    contactSupport: 'Կապ հաճախորդների աջակցության հետ',
    navLabel: 'Աջակցություն',
    modalHint:
      'Ստեղծում է Zendesk տիկետ ձեր բիզնեսի համատեքստով։ Zendesk-ը կարգավորեք Ինտեգրացիաներ → Growth բաժնում։',
    subject: 'Թեմա',
    subjectPlaceholder: 'Կարճ ամփոփում',
    message: 'Հաղորդագրություն',
    messagePlaceholder: 'Նկարագրեք խնդիրը…',
    submitTicket: 'Ուղարկել տիկետ',
    ticketCreated: 'Տիկետը հաջողությամբ ստեղծվեց։',
    openInZendesk: 'Բացել Zendesk-ում',
    createFailed: 'Չհաջողվեց ստեղծել աջակցության տիկետ',
  },
  reports: {
    title: 'Հաշվետվություններ',
    subtitle: 'Աշխատակիցների արդյունավետություն, ծառայությունների պոպուլյարություն և պիկ ժամեր',
    aiInsightsTitle: 'Հաշվետվության վերլուծություն',
    dateFrom: 'Սկսած',
    dateTo: 'Մինչև',
  
    staffPerformance: 'Աշխատակիցների արդյունավետություն',
    servicePopularity: 'Ծառայությունների պոպուլյարություն',
    peakHours: 'Պիկ ժամերի ջերմային քարտեզ',
  
    exportCsv: 'Արտահանել CSV',
    exportPdf: 'Արտահանել PDF',
  
    loadFailed: 'Չհաջողվեց բեռնել հաշվետվությունները',
    columnBookings: 'Ամրագրումներ',
    columnCompleted: 'Ավարտված',
    columnNoShows: 'Չներկայացած',
    columnRevenue: 'Եկամուտ',
    columnRevenueCurrency: 'Եկամուտ ({currency})',
    currencyNote:
      'Բոլոր գումարները {currency} արժույթով են։ Արժույթի փոխարկում չի կիրառվում (մեկ արժույթ մեկ բիզնեսի համար)։',
    columnHours: 'Ժամեր',
    columnUtilization: 'Օգտագործում',
  },
  monetization: {
    title: 'Եկամտայնացում',
    subtitle: 'Նվեր քարտեր, բաժանորդագրություններ, loyalty բոնուսներ և պրոմո կոդեր',
  
    giftCards: 'Նվեր քարտեր',
    memberships: 'Բաժանորդագրություններ',
    loyalty: 'Loyalty բոնուսներ',
    promoCodes: 'Պրոմո կոդեր',
  
    loyaltyEarnRate: 'Բոնուսների կուտակման տոկոս',
    loyaltyEarnRateHint:
      'Հաճախորդները յուրաքանչյուր վճարված ամրագրման համար ստանում են այս տոկոսի չափով բոնուս (1 բոնուս = $1 զեղչ)',
  
    loyaltyEarnPercent: 'Կուտակման տոկոս (%)',
  
    loyaltyExcludedServices: 'Բացառել ծառայություններ բոնուս կուտակումից',
    loyaltyExcludedServicesHint:
      'Նշված ծառայությունները չեն կուտակում բոնուս, նույնիսկ եթե տոկոսը > 0% է',
  
    loyaltyNoServices: 'Դեռ ծառայություններ չկան։ Ավելացրեք Services բաժնում',
  
    loyaltyEarnExample:
      'Օրինակ՝ $10 վճարում {percent}% → ${amount} բոնուս',
  
    saveSettings: 'Պահպանել կարգավորումները',
    saving: 'Պահպանվում է…',
  
    expirationDate: 'Վավերության ժամկետ',
    expirationOptional: 'Ընտրովի — դատարկ թողեք անսահման ժամկետի համար',
    noExpiration: 'Առանց ժամկետի',
    expired: 'Ժամկետն ավարտված է',
  
    bonusBalance: 'Բոնուսային հաշվեկշիռ',
    lifetimeEarned: 'Ընդհանուր կուտակված',
  
    adjustBonus: 'Կարգավորել բոնուս (+/- $)',
  
    subscriptionPlanStatusActive: 'Ակտիվ',
    subscriptionPlanStatusDeactivated: 'Ապաակտիվացված',
  
    subscriptionPlanDeactivateConfirm:
      'Ապաակտիվացնե՞լ այս բաժանորդագրությունը։ Հաճախորդները այլևս չեն կարողանա գնել կամ օգտագործել այն',
  
    subscriptionPlanDeleteConfirm:
      'Մշտապես ջնջե՞լ այս բաժանորդագրությունը։ Այս գործողությունը հետ չի վերադարձվում',
  
    subscriptionPlanDelete: 'Ջնջել',
    subscriptionPlanDeactivate: 'Ապաակտիվացնել',
    subscriptionPlanActivate: 'Ակտիվացնել',
  
    subscriptionPlanActivateConfirm:
      'Վերակտիվացնե՞լ այս բաժանորդագրությունը։ Հաճախորդները կրկին կկարողանան գնել այն',
  
    giftCardOrders: 'Պատվերներ և կատարում',
    giftCardSettings: 'Գնման կարգավորումներ',
    giftCardManual: 'Ձեռքով քարտեր',
  
    giftCardAllStatuses: 'Կատարողական բոլոր կարգավիճակները',
  
    giftCardStatusAwaitingCreation: 'Սպասում է ստեղծման',
    giftCardStatusReady: 'Պատրաստ է առաքման',
    giftCardStatusOutForDelivery: 'Առաքման ընթացքում',
    giftCardStatusShipped: 'Ուղարկված',
    giftCardStatusDelivered: 'Առաքված',
    giftCardStatusCancelled: 'Չեղարկված',
    giftCardStatusPending: 'Սպասվող',
  
    giftCardRefundRefunded: 'Վերադարձված',
    giftCardRefundFailed: 'Վերադարձը ձախողվել է',
    giftCardRefundSkipped: 'Առցանց վճարում չկա',
  
    giftCardCarrierPrompt: 'Առաքիչի անուն',
    giftCardTrackingPrompt: 'Հետևման համար',
    giftCardNeedsInfoPrompt: 'Հաղորդագրություն հաճախորդին',
    giftCardDenyPrompt: 'Մերժման պատճառ',
  
    giftCardNoOrders: 'Դեռ նվեր քարտերի պատվերներ չկան',
  
    giftCardOrderSearchPlaceholder:
      'Որոնել կոդով, ստացողի անունով կամ email-ով…',
  
    giftCardOrderDetails: 'Նվեր քարտի մանրամասներ',
    giftCardViewDetails: 'Դիտել մանրամասները',
  
    giftCardDetailCode: 'Կոդ',
    giftCardDetailType: 'Տեսակ',
    giftCardDetailDelivery: 'Առաքում',
    giftCardDetailStatus: 'Կարգավիճակ',
    giftCardDetailCreated: 'Ստեղծված',
  
    giftCardDetailRecipient: 'Ստացող',
    giftCardDetailRecipientEmail: 'Ստացողի email',
    giftCardDetailRecipientPhone: 'Ստացողի հեռախոս',
  
    giftCardDetailPurchaserEmail: 'Գնորդի email',
    giftCardDetailBalance: 'Մնացորդ',
    giftCardDetailPurchaseAmount: 'Գնման գումար',
  
    giftCardDetailTracking: 'Հետևում',
    giftCardDetailMessage: 'Անձնական հաղորդագրություն',
    giftCardDetailCredits: 'Ծառայության կրեդիտներ',
  
    giftCardPurchaseEnabled: 'Միացնել հանրային նվեր քարտերի վաճառք',
    giftCardDigitalDelivery: 'Թվային առաքում (email)',
    giftCardPhysicalDelivery: 'Ֆիզիկական առաքում (փոստ/կուրիեր)',
  
    giftCardPresetAmounts: 'Նախորոշված գումարներ (ստորակետով բաժանված)',
    giftCardDefaultExpiryMonths: 'Լռելյայն վավերություն (ամիս)',
  
    giftCardCreators: 'Քարտ ստեղծող աշխատակիցներ (provider app)',
    giftCardDrivers: 'Առաքիչ աշխատակիցներ (provider app)',
  
    giftCardProducts: 'Ապրանքներ և փաթեթներ',
  
    giftCardPurchasableServices:
      'Ծառայություններ՝ որպես նվեր քարտ վաճառքի համար',
  
    giftCardPurchasableServicesHint:
      'Միացրեք առանձին ծառայություններ, որոնք կարող են վաճառվել որպես նվեր քարտ',
  
    giftCardNoServices: 'Նախ ավելացրեք ծառայություններ Services բաժնում',
  
    giftCardOverridePrice: 'Գնի փոփոխում',
  
    giftCardBundles: 'Նվեր քարտերի փաթեթներ',
    giftCardBundlesHint:
      'Անվանված փաթեթներ, որոնք վաճառվում են որպես մեկ նվեր քարտ',
  
    giftCardAddBundle: 'Ավելացնել փաթեթ',
    giftCardSaveBundle: 'Պահպանել փաթեթը',
    giftCardCancelBundle: 'Չեղարկել',
  
    giftCardBundleName: 'Փաթեթի անուն',
    giftCardBundlePrice: 'Փաթեթի գին',
    giftCardBundleServices: 'Ներառված ծառայություններ',
  
    giftCardNoBundles: 'Դեռ փաթեթներ չկան',
  
    giftCardPurchasablePackages:
      'Ծառայությունների փաթեթներ՝ որպես նվեր քարտ',
  
    giftCardPurchasablePackagesHint:
      'Բոլոր ակտիվ փաթեթները հասանելի են որպես նվեր քարտ (կարգավորելի է)',
  
    giftCardNoPackages: 'Ստեղծեք փաթեթներ Services բաժնում',
  
    giftCardPurchasableSubscriptions:
      'Բաժանորդագրություններ՝ որպես նվեր քարտ',
  
    giftCardPurchasableSubscriptionsHint:
      'Բոլոր ակտիվ պլանները հասանելի են որպես նվեր քարտ',
  
    giftCardNoSubscriptionPlans:
      'Ստեղծեք բաժանորդագրություններ Monetization բաժնում',
  
    giftCardEditExpiration: 'Խմբագրել ժամկետը',
    giftCardExtendMonths: 'Երկարացնել (ամիս)',
    giftCardExtendDays: 'Երկարացնել (օր)',
  
    giftCardClearExpiration: 'Հեռացնել ժամկետը',
    giftCardExpirationNote: 'Նշում (ընտրովի)',
    giftCardExpirationAudit: 'Ժամկետի պատմություն',
  
    giftCardSaveExpiration: 'Պահպանել ժամկետը',
  
    giftCardExtendBy: 'Երկարացնելով',
    giftCardCancelModifyEnabled:
      'Թույլ տալ հաճախորդի կողմից չեղարկման հարցումներ',
  
    giftCardCancelModifyWindow:
      'Չեղարկման պատուհան (ժամ՝ գնումից հետո)',
  
    giftCardPhysicalCancelBeforeReady:
      'Արգելել չեղարկում/փոփոխում՝ ֆիզիկական քարտի ստեղծումից հետո',
  
    giftCardChangeRequests: 'Չեղարկման / փոփոխման հարցումներ',
    giftCardNoChangeRequests: 'Հարցումներ չկան',
  
    giftCardApproveRequest: 'Հաստատել',
    giftCardDenyRequest: 'Մերժել',
    giftCardNeedsInfo: 'Լրացուցիչ տեղեկատվություն պետք է',
    planName: 'Պլանի անուն',
    selectService: 'Ընտրեք ծառայություն…',
    discountCustom: 'Հատուկ',
    percentOff: 'Տոկոսային զեղչ',
    customerSaves: 'Հաճախորդը խնայում է՝ ${amount}',
    updatePlan: 'Թարմացնել բաժանորդագրության պլանը',
    createPlan: 'Ստեղծել բաժանորդագրության պլան',
    cancelEdit: 'Չեղարկել խմբագրումը',
    plansEmpty: 'Բաժանորդագրության պլաններ դեռ չկան',
    tablePlan: 'Պլան',
    tableService: 'Ծառայություն',
    tablePrice: 'Գին',
    tableStatus: 'Կարգավիճակ',
    assignTitle: 'Նշանակել բաժանորդագրություն հաճախորդին',
    assignSelectPlan: 'Ընտրեք պլան…',
    assignNoPlansForService: 'Այս ծառայության համար պլաններ չկան',
    assignSelectServiceFirst: 'Նախ ընտրեք ծառայություն',
    assignAction: 'Նշանակել բաժանորդագրություն',
    inactiveService: '(Անգործուն)',
    loyaltyNote: 'Նշում',
    loyaltyAdjustPoints: 'Ճշտել միավորները',
    loyaltyTableDate: 'Ամսաթիվ',
    loyaltyTableChange: 'Փոփոխություն',
    loyaltyTableBalance: 'Մնացորդ',
    loyaltyTableReason: 'Պատճառ',
    loyaltyEmptyHint: 'Ընտրեք հաճախորդ՝ հավատարմության պատմությունը տեսնելու համար',
    promoCreate: 'Ստեղծել պրոմո կոդ',
    promoEmpty: 'Պրոմո կոդեր դեռ չկան',
    promoTableCode: 'Կոդ',
    promoTableDiscount: 'Զեղչ',
    promoTableUses: 'Օգտագործումներ',
    promoTableExpires: 'Ժամկետ',
    promoDeactivate: 'Ապաակտիվացնել',
    customMonths: 'Պատվերով ամիսներ',
    includedAppointments: 'Ներառված ամրագրումներ',
    discountType: 'Զեղչի տեսակ',
    discountValue: 'Զեղչի արժեք',
    fixedAmountOff: 'Ֆիքսված գումարով զեղչ',
    regularTotal: 'Սովորական ընդամենը՝ ${amount}',
    subscriptionPriceLabel: 'Բաժանորդագրության գին՝ ${amount}',
    tableDuration: 'Տևողություն',
    tableAppointments: 'Ամրագրումներ',
    tableSavings: 'Խնայողություն',
    planLabel: 'Պլան',
    assignMultiPlanHint:
      'Այս ծառայության {count} բաժանորդագրության պլան կա — ընտրեք նշանակելու համար։',
    adjustPoints: 'Խմբագրել միավորները',
    loyaltyBalanceHint: 'Ընտրեք հաճախորդ՝ բոնուսի մնացորդը տեսնելու համար։',
    promoType: 'Տեսակ',
    promoValue: 'Արժեք',
    promoMinOrder: 'Նվազ. պատվեր',
    promoMaxUses: 'Օգտ. սահման',
    promoDescription: 'Նկարագրություն',
    promoPercent: 'Տոկոս',
    promoFixedAmount: 'Ֆիքսված գումար',
    promoStatusInactive: 'Անակտիվ',
    promoStatusActive: 'Ակտիվ',
    loyaltyTableType: 'Տեսակ',
    loyaltyTablePoints: 'Միավորներ',
    durationMonthsShort: '{count} ամիս',
  },
  operations: {
    title: 'Օպերացիաներ',
    subtitle: 'Լոկացիաներ, սենյակներ և աթոռներ, պահեստ, ծախսեր և միջնորդավճարներ',
  
    locations: 'Լոկացիաներ',
  
    resources: 'Ռեսուրսներ',
    resourceName: 'Ռեսուրսի անուն',
    resourceNamePlaceholder: 'Սենյակ A',
    removeResourceAria: 'Հեռացնել ռեսուրսը',
    resourceType: 'Տեսակ',
    resourceTypeRoom: 'Սենյակ',
    resourceTypeChair: 'Աթոռ',
    resourceTypeEquipment: 'Սարքավորում',
  
    addResource: 'Ավելացնել ռեսուրս',
    noResources: 'Դեռ սահմանի ռեսուրսներ չկան',
  
    serviceResourceRequirements: 'Ծառայության ռեսուրսային պահանջներ',
  
    service: 'Ծառայություն',
    requiredResources: 'Պահանջվող ռեսուրսներ',
    currentRequirements: 'Ընթացիկ կապեր',
  
    inventory: 'Պահեստ',
    expenses: 'Ծախսեր',
    commissions: 'Միջնորդավճարներ',
    plSummary: 'Շահույթ/կորուստ հաշվետվություն',
  
    viewGuide: 'Ինչպես օգտագործել Operations-ը',
  
    linkProductsTitle: 'Կապել ապրանքները ծառայություններին',
    linkProductsBody:
      'Ընտրեք, թե որ սպառվող նյութերն են հանվում պահեստից՝ երբ ամրագրումը նշվում է որպես ավարտված',
  
    linkService: 'Ծառայություն',
    linkProduct: 'Ապրանք',
  
    selectService: 'Ընտրեք ծառայություն',
    selectProduct: 'Ընտրեք ապրանք',
  
    quantityPerService: 'Քանակ յուրաքանչյուր ամրագրման համար',
  
    linkProductsAction: 'Կապել ապրանքը',
  
    noServiceLinks: 'Դեռ կապեր չկան',
  
    removeServiceLink: 'Հեռացնել կապը',
    addLocation: 'Ավելացնել մասնաճյուղ',
    locationsEmpty: 'Մասնաճյուղեր դեռ չկան',
    addProduct: 'Ավելացնել ապրանք',
    inventoryEmpty: 'Ապրանքներ դեռ չկան',
    tableProduct: 'Ապրանք',
    tableQty: 'Քանակ',
    tableUnitCost: 'Միավորի արժեք',
    addExpense: 'Ավելացնել ծախս',
    expensesEmpty: 'Ծախսեր դեռ չկան',
    tableCategory: 'Կատեգորիա',
    tableAmount: 'Գումար',
    addCommissionRule: 'Ավելացնել կանոն',
    commissionsEmpty: 'Հանձնաժողովի կանոններ դեռ չկան',
    tableRule: 'Կանոն',
    tableRate: 'Տոկոս',
    fieldProductName: 'Ապրանքի անուն',
    fieldQuantityOnHand: 'Մնացորդ',
    fieldUnitCost: 'Միավորի արժեք',
    fieldRetailPrice: 'Մանրածախ գին',
    tableRetail: 'Մանրածախ',
    fieldValue: 'Արժեք',
    fieldAmount: 'Գումար',
    durationMonths: 'Տևողություն (ամիս)',
    months3: '3 ամիս',
    months6: '6 ամիս',
    months12: '12 ամիս',
  },
  helpCenter: {
    buttonLabel: 'Օգնություն այս էջի համար',
    openFullGuide: 'Բացել ամբողջ ուղեցույցը',
    close: 'Փակել',
    navLabel: 'Հիմնական ֆունկցիաներ',
  
    topics: {
      schedule: {
        title: 'Ժամանակացույց',
        summary:
          'Ստեղծեք աշխատանքային ժամեր, վերօգտագործվող ձևանմուշներ և արգելված ժամանակ յուրաքանչյուր մասնագետի համար',
  
        step1:
          'Ստեղծել ժամանակացույց — ընտրեք մասնագետ և օր, ավելացրեք ժամանակահատվածներ ծառայությունների համար',
  
        step2:
          'Ձևանմուշներ — պահեք կրկնվող շաբաթական կառուցվածքներ և կիրառեք մի քանի շաբաթների վրա',
  
        step3:
          'Արգելափակել ժամանակացույցը — նշեք ճաշ, հանդիպումներ կամ արձակուրդներ',
  
        step4:
          'Ստուգեք համընկնումների նախազգուշացումները — կոնֆլիկտային ժամանակահատվածները չեն դառնա հասանելի ամրագրման համար',
      },
  
      calendar: {
        title: 'Մասնագետի օրացույց',
        summary:
          'Տեսեք մեկ մասնագետի շաբաթը՝ գունային կոդավորմամբ ծառայություններով և ազատ ժամերով',
  
        step1: 'Ընտրեք մասնագետ dropdown-ից՝ նրա ժամանակացույցը բեռնելու համար',
  
        step2:
          'Օգտագործեք շաբաթվա նավիգացիան՝ առաջ կամ հետ շարժվելու համար. այսօրը ընդգծված է',
  
        step3:
          'Քաշեք ցանցի վրա ժամանակ ընտրելու համար, ապա օգտագործեք AI կամ ամրագրման գործողությունները',
  
        step4:
          'Բացեք Bookings՝ ամրագրումներ ստեղծելու կամ խմբագրելու համար հասանելի ժամերի մեջ',
      },
  
      employees: {
        title: 'Աշխատակիցներ և թիմի հասանելիություն',
        summary:
          'Ավելացրեք մասնագետներ, նշանակեք ծառայություններ և կառավարեք dashboard և mobile հասանելիությունը',
  
        step1:
          'Ավելացնել աշխատակից — անուն, կոնտակտ, ծառայություններ և ցանկության դեպքում լուսանկար',
  
        step2:
          'Ուղարկեք հավելվածի հասանելիություն, որպեսզի մասնագետը մուտք գործի mobile app',
  
        step3:
          'Թիմի դերեր — owner/admin/manager տեսնում են բոլոր ամրագրումները, provider-ը՝ միայն իրենը',
  
        step4:
          'Ապաակտիվացված աշխատակիցների տվյալները պահպանվում են հաշվետվություններում',
      },
  
      'operations-inventory': {
        title: 'Պահեստի կապում',
        summary:
          'Կապեք ապրանքները ծառայություններին, որպեսզի պահեստը ավտոմատ նվազի այցելությունից հետո',
  
        step1:
          'Ավելացրեք ապրանքներ Inventory-ում՝ սկզբնական քանակով և արժեքով',
  
        step2:
          'Կապեք յուրաքանչյուր ապրանք համապատասխան ծառայությունների հետ և սահմանեք օգտագործման քանակը',
  
        step3:
          'Երբ ամրագրումը նշվում է որպես ավարտված, կապված ապրանքները ավտոմատ հանվում են պահեստից',
      },
    },
  },
  guide: {
    title: 'Օգտագործողի ուղեցույց',
    subtitle: 'Սովորեք Operations back-office-ը և Orchestrix AI-ը OptiSchedule-ում։',
  
    operations: {
      navLabel: 'Operations ուղեցույց',
      openOperations: 'Բացել Operations',
      heroTitle: 'Operations — սալոնների ցանցերի back-office',
      heroBody:
        'Operations-ը պարզապես ամրագրումներից ավելին է։ Այն օգնում է կառավարել մի քանի մասնաճյուղեր, հետևել պաշարներին, գրանցել ծախսերը, գնահատել աշխատակիցների կոմիսիաները և հասկանալ՝ արդյոք բիզնեսը իրականում շահութաբեր է։',
  
      overviewTitle: 'Ի՞նչ է Operations-ը',
      overviewBody:
        'Operations էջը ձեր back-office կենտրոնն է։ Մինչ Reports-ը ցույց է տալիս որքան զբաղված եք, Operations-ը ցույց է տալիս ինչպես է աշխատում բիզնեսը՝ պահեստի մակարդակներ, օվերհեդ ծախսեր, աշխատակիցների վճարումներ և զուտ շահույթ։',
  
      overviewPoint1: 'Կառավարեք մի քանի սալոն կամ կլինիկա մեկ հաշվի տակ',
      overviewPoint2: 'Հետևեք ծառայությունների ընթացքում օգտագործվող արտադրանքներին և ծախսվող նյութերին',
      overviewPoint3: 'Գրանցեք վարձավճարներ, պաշարներ, մարքեթինգ և այլ ծախսեր',
      overviewPoint4: 'Սահմանեք կոմիսիոն կանոններ և դիտեք պարզ P&L ամփոփում',
  
      problemsTitle: 'Ի՞նչ խնդիրներ է լուծում',
      problemsIntro:
        'Սալոնների սեփականատերերը հաճախ դուրս են գալիս միայն ամրագրումների պարզ համակարգերից։ Operations-ը լուծում է հիմնական խնդիրները՝',
  
      problem1: '«Ես ղեկավարում եմ երկու մասնաճյուղ, բայց չեմ կարող համեմատել դրանք»։',
      solution1:
        'Ավելացրեք յուրաքանչյուր մասնաճյուղ Locations-ում, ապա ֆիլտրեք պահեստը, ծախսերը և P&L-ը ըստ վայրի։',
  
      problem2: '«Մենք առանց նախազգուշացման վերջանում ենք ներկը կամ նյութերը»։',
      solution2:
        'Հետևեք պահեստի արտադրանքներին և կապեք դրանք ծառայություններին։ Պաշարը ավտոմատ նվազում է ամրագրման ավարտից հետո։',
  
      problem3: '«Չգիտեմ ինչքան վճարել վարսահարդարներին ամեն ամիս»։',
      solution3:
        'Ստեղծեք կոմիսիոն կանոններ (% կամ ֆիքսված գումար)։ P&L-ը գնահատում է ընդհանուր կոմիսիաները ավարտված և վճարված ամրագրումների հիման վրա։',
  
      problem4: '«Եկամուտը լավ է, բայց վստահ չեմ՝ շահութաբեր ենք, թե ոչ»։',
      solution4:
        'Միավորեք ամրագրումների եկամուտը ծախսերի և կոմիսիաների հետ՝ ցանկացած ժամանակահատվածի համար զուտ շահույթը տեսնելու համար։',
  
      workflowTitle: 'Խորհուրդ տրվող կարգավորման հերթականություն',
      workflowTipTitle: 'Սկսեք այստեղ, եթե նոր եք',
      workflowTipBody:
        'Պարտադիր չէ բոլոր բաժինները առաջին օրը կարգավորել։ Մի մասնաճյուղ ունեցող սալոնները կարող են բաց թողնել Locations-ը և դեռ օգտագործել Inventory, Expenses և Commissions-ը։',
  
      workflowStep1: 'Locations — ավելացրեք յուրաքանչյուր մասնաճյուղ (բաց թողեք, եթե միայն մեկ site ունեք)',
      workflowStep2: 'Inventory — ավելացրեք հաճախ օգտագործվող ապրանքները (շամպուն, ներկ, ձեռնոցներ և այլն)',
      workflowStep3: 'Կապեք ապրանքները ծառայություններին Inventory-ում → Կապել ապրանքները ծառայություններին',
      workflowStep4: 'Commissions — սահմանեք, թե ինչպես են վճարվում աշխատակիցները յուրաքանչյուր ծառայության համար',
      workflowStep5: 'Expenses — գրանցեք պարբերական ծախսերը (վարձ, կոմունալներ, ապրանքների պատվերներ)',
      workflowStep6: 'P&L ամփոփում — շաբաթական կամ ամսական վերանայեք եկամուտներն ու ծախսերը',
  
      locationsTitle: 'Locations',
      locationsBody:
        'Յուրաքանչյուր location ներկայացնում է ֆիզիկական մասնաճյուղ՝ սալոն, վարսավիրանոց կամ կլինիկա։',
  
      locationsStep1: 'Բացեք Locations բաժինը և սեղմեք Ավելացնել location։',
      locationsStep2:
        'Մուտքագրեք անունը, հասցեն և հեռախոսահամարը։ Անհրաժեշտության դեպքում նշեք default location։',
      locationsStep3:
        'Կապեք պահեստը և ծախսերը location-ի հետ, որպեսզի հաշվետվությունները ֆիլտրվեն ըստ մասնաճյուղի։',
  
      locationsNoteTitle: 'Միակ location՞',
      locationsNoteBody:
        'Եթե ունեք միայն մեկ սրահ, կարող եք բաց թողնել այս բաժինը։ Մնացած ամեն ինչ աշխատում է առանց բազմակի default location-ի։',
  
      inventoryTitle: 'Inventory',
      inventoryBody:
        'Հետևեք ծախսվող նյութերին և վաճառվող ապրանքներին՝ ներկեր, բուժման նյութեր, մեկանգամյա պարագաներ և այլն։',
  
      inventoryStep1:
        'Գնացեք Inventory և ավելացրեք ապրանք՝ անուն, SKU (ըստ ցանկության), սկզբնական քանակ և միավորի արժեք։',
      inventoryStep2: 'Սահմանեք reorder մակարդակներ, որպեսզի իմանաք երբ պաշարը ցածր է։',
      inventoryStep3: 'Կապեք ապրանքները ծառայություններին՝ ավտոմատ նվազեցման համար։',
      inventoryStep4: 'Թարմացրեք պաշարը ձեռքով՝ առաքում կամ հաշվարկ կատարելիս։',
  
      inventoryAutoTitle: 'Ավտոմատ նվազեցում',
      inventoryAutoBody:
        'Երբ ամրագրումը նշվում է որպես Ավարտված, կապված ապրանքները ավտոմատ նվազեցվում են պահեստից։',
  
      expensesTitle: 'Ծախսեր',
      expensesBody:
        'Գրանցեք բոլոր ծախսերը՝ վարձ, կոմունալներ, մարքեթինգ, ապահովագրություն և այլն։',
  
      expensesStep1: 'Բացեք Expenses և ավելացրեք կատեգորիա, գումար և ամսաթիվ։',
      expensesStep2: 'Ավելացրեք նկարագրություն (օր. «Մարտի վարձ — կենտրոն»)։',
      expensesStep3: 'Պարբերաբար ստուգեք և ուղղեք կրկնությունները։',
  
      expensesExamples:
        'Հաճախ օգտագործվող կատեգորիաներ՝ Վարձ, Կոմունալներ, Պաշարներ, Մարքեթինգ, Աշխատավարձ (ոչ կոմիսիոն), Ապահովագրություն։',
  
      commissionsTitle: 'Կոմիսիաներ',
      commissionsBody:
        'Սահմանեք աշխատակիցների վճարման կանոններ՝ տոկոս կամ ֆիքսված գումար։',
  
      commissionsStep1: 'Բացեք Commissions և ընտրեք Percent կամ Flat։',
      commissionsStep2: 'Մուտքագրեք արժեքը (օր. 40 կամ 15)։',
      commissionsStep3: 'Ավելացրեք հատուկ կանոններ ըստ աշխատակցի կամ ծառայության։',
  
      commissionsRuleTitle: 'Ինչպես են ընտրվում կանոնները',
      commissionsRuleBody:
        'Համակարգը ընտրում է ամենասպեցիֆիկ կանոնը՝ աշխատակից+ծառայություն → աշխատակից → ծառայություն → business default։',
  
      plTitle: 'P&L ամփոփում',
      plBody:
        'Միավորում է եկամուտները, ծախսերը և կոմիսիաները՝ ցույց տալու իրական շահույթը։',
  
      plRevenue: 'Եկամուտ',
      plExpenses: 'Ծախսեր',
      plCommissions: 'Կոմիսիաներ',
      plNet: 'Զուտ շահույթ',
      plFormula: 'Զուտ շահույթ = Եկամուտ − Ծախսեր − Կոմիսիաներ',
  
      plStep1: 'Ընտրեք ժամանակահատված (լռելյայն՝ վերջին 30 օր)',
      plStep2: 'Համեմատեք եկամուտներն ու ծախսերը',
  
      tipsTitle: 'Լավ փորձառություններ',
      tip1: 'Ծախսերը գրանցեք շաբաթական',
      tip2: 'P&L-ը վերանայեք ամեն ամիս',
      tip3: 'Reports-ը օգտագործեք զբաղվածության համար',
      tip4: 'Թարմացրեք կոմիսիոն կանոնները',
  
      limitationsTitle: 'Կարևոր է իմանալ',
      limitationsBody:
        'Սա հաշվապահական համակարգ չէ և չի փոխարինում QuickBooks կամ Xero-ին։',
  
      readyTitle: 'Պատրա՞ստ եք սկսել',
      readyBody: 'Բացեք Operations էջը և անցեք քայլերով։',
    },
  
    core: {
      navLabel: 'Հիմնական ֆունկցիաներ',
      scheduleTitle: 'Ժամանակացույց',
      scheduleBody:
        'Schedule էջում սահմանում եք աշխատակիցների հասանելիությունը։',
  
      scheduleStep1: 'Սկսեք Templates-ից, եթե աշխատանքը կրկնվող է',
      scheduleStep2: 'Կիրառեք template շաբաթների վրա',
      scheduleStep3: 'Օգտագործեք Block Schedule՝ ժամանակ փակելու համար',
      scheduleStep4: 'Բախումները պետք է ուղղվեն',
  
      calendarTitle: 'Օրացույց',
      calendarBody: 'Ցույց է տալիս աշխատակցի շաբաթական գրաֆիկը',
  
      calendarStep1: 'Ընտրեք աշխատակից',
      calendarStep2: 'Նավարկեք շաբաթների միջև',
      calendarStep3: 'Ստուգեք ամրագրումները',
      calendarStep4: 'Մենեջերները տեսնում են բոլոր աշխատակիցներին',
  
      employeesTitle: 'Աշխատակիցներ և հասանելիություն',
      employeesBody: 'Աշխատակիցները մատուցում են ծառայություններ',
  
      employeesStep1: 'Յուրաքանչյուր աշխատակից պետք է ունենա ծառայություն',
      employeesStep2: 'Ուղարկեք մուտքի email',
      employeesStep3: 'Սահմանեք դերեր',
      employeesStep4: 'Թարմացրեք պրոֆիլները',
    },
  
    ai: {
      navLabel: 'AI ուղեցույց',
      openAiOps: 'Բացել AI Operations',
      openSettings: 'Բացել կարգավորումներ',
  
      heroTitle: 'Orchestrix AI — ժամանակացույցի օգնական',
      heroBody:
        'Orchestrix-ը հասկանում է ձեր համակարգը և օգնում է ավտոմատացնել աշխատանքները',
  
      overviewTitle: 'Ի՞նչ է Orchestrix AI-ն',
      overviewBody:
        'AI համակարգ, որը առաջարկում է գործողություններ և ավտոմատացնում գործընթացներ',
  
      overviewPoint1: 'Բնական լեզվով հրամաններ',
      overviewPoint2: 'Խելացի առաջարկներ',
      overviewPoint3: 'Multi-step agent գործողություններ',
      overviewPoint4: 'Աուդիտ և վերահսկում',
  
      gettingStartedTitle: 'Սկսել',
      gettingStartedBody: 'Պետք է OpenAI կապ',
  
      gettingStartedStep1: 'Settings → Integrations',
      gettingStartedStep2: 'default կամ Custom API key',
      gettingStartedStep3: 'Օգտագործեք command bar',
  
      commandBarTitle: 'Command bar',
      commandBarBody: 'Գրեք բնական լեզվով հրամաններ',
  
      commandBarStep1: 'Սեղմեք sparkle',
      commandBarStep2: 'Գրեք հրաման',
      commandBarStep3: 'Հաստատեք արդյունքը',
  
      dashboardTitle: 'Dashboard ֆունկցիաներ',
      dashboardBody: 'AI-ն աշխատում է background-ում',
  
      approvalTitle: 'Հաստատում',
      approvalBody: 'Բոլոր փոփոխությունները պահանջում են հաստատում',
  
      aiOpsTitle: 'AI Operations',
      aiOpsBody: 'Agent-ների կառավարում',
  
      mobileTitle: 'Mobile app',
      mobileBody: 'AI-ն հասանելի է նաև բջջայինում',
  
      examplesTitle: 'Օրինակներ',
      example1Command: 'Լրացրու ազատ ժամերը',
      example1Desc: 'Գտնում է բաց slots',
  
      tipsTitle: 'Լավ փորձառություններ',
      tip1: 'Սկսեք պարզ հարցերից',
      tip2: 'Օգտագործեք առաջարկները',
  
      limitationsTitle: 'Կարևոր է',
      limitationsBody: 'AI-ն օգնական է, ոչ փոխարինող',
  
      readyTitle: 'Պատրա՞ստ եք փորձել',
      readyBody: 'Բացեք AI Operations կամ command bar',
    },
  },
  reviewsPage: {
    title: 'Կարծիքներ',
    subtitle: 'Հաճախորդների գնահատականներ և մասնագետների ամփոփումներ։',
    providerSummary: 'Մասնագետի ամփոփում',
    noReviews: 'Դեռ կարծիքներ չկան։',
    noRatings: 'Դեռ մասնագետների գնահատականներ չկան',
    providerFallback: 'Մասնագետ',
    anonymous: 'Անանուն',
  },
  invite: {
    title: 'Հրավերի ընդունում',
    subtitle: 'Ստեղծեք ձեր հաշիվը՝ որպես մասնակից միանալու համար։',
    employeeName: 'Ցուցադրվող անուն',
    accessRole: 'Dashboard-ի դեր',
    sendInvite: 'Ուղարկել հրավեր',
    inviteSent: 'Հրավերը ուղարկված է։',
    accept: 'Ընդունել հրավերը',
    accepting: 'Ընդունվում է…',
    success: 'Բարի գալուստ։ Այժմ կարող եք մուտք գործել։',
    appAccessTitle: 'Կարգավորել provider հավելվածը',
    appAccessSubtitle: 'Ստեղծեք գաղտնաբառ՝ հեռախոսից մուտք գործելու համար։',
    phone: 'Բջջային հեռախոս',
    phoneHint: 'Ներառեք երկրի կոդը։ Օգտագործվում է թիմային կապի և ծանուցումների համար։',
    existingAccountHint:
      'Դուք արդեն ունեք հաշիվ — կարգավորումից հետո մուտք գործեք ձեր գոյություն ունեցող գաղտնաբառով։',
    sendInviteModalBody:
      'Հրավիրեք մեկին ձեր dashboard։ Ընտրեք դերը — ադմիններն ու մենեջերները բջջային հավելվածում տեսնում են բոլոր ամրագրումները։',
  },
  embed: {
    title: 'Ամրագրման widget',
    subtitle: 'Ներդրեք առցանց ամրագրումը ձեր կայքում։',
    publicLink: 'Հանրային ամրագրման հղում',
    iframeSnippet: 'Iframe ներդրում',
    scriptSnippet: 'Script ներդրում',
    preview: 'Նախադիտում',
    bookNow: 'Ամրագրել հիմա',
    fullFlow: 'Ամբողջ ամրագրման ընթացքը՝',
  },
  integrations: {
    title: 'CRM ինտեգրացիաներ',
    subtitle: 'API keys, outbound webhooks, CRM գործիքներ և REST API փաստաթղթավորում։',
    tabGrowth: 'Աճ և տարածում',
    tabMaturity: 'Հարթակի հասունություն',
    tabKeys: 'API բանալիներ',
    tabWebhooks: 'Webhook-ներ',
    tabDocs: 'API փաստաթղթեր',
    createKey: 'Ստեղծել API բանալի',
    keyNamePlaceholder: 'օր. Zapier, custom CRM',
    createKeyBtn: 'Ստեղծել բանալի',
    keyCreatedWarning: 'Պահպանեք այս բանալին հիմա — այն այլևս չի ցուցադրվի։',
    activeKeys: 'Ակտիվ API բանալիներ',
    noKeys: 'Դեռ API բանալիներ չկան։',
    addWebhook: 'Ավելացնել webhook endpoint',
    addWebhookBtn: 'Ավելացնել webhook',
    webhookSecretWarning: 'Պահպանեք այս signing secret-ը հիմա — այն այլևս չի ցուցադրվի։',
    activeWebhooks: 'Ակտիվ webhook-ներ',
    noWebhooks: 'Webhook-ներ չեն կարգավորված։',
    authTitle: 'Աուտենտիկացիա',
    baseUrl: 'Base URL',
    publicApiTitle: 'Հանրային ամրագրման API (առանց key-ի)',
    businessApiTitle: 'Բիզնես API (պահանջում է API key)',
    webhooksDocTitle: 'Outbound webhook-ներ',
    saveZendesk: 'Պահպանել Zendesk',
    saveDistribution: 'Պահպանել տարածման կարգավորումները',
    saveZapier: 'Պահպանել Zapier կարգավորումները',
    saveAccounting: 'Պահպանել հաշվառման կարգավորումները',
  },
  provider: {
    appTitle: 'Մասնագետի հավելված',
    loginTitle: 'Մասնագետի մուտք',
    loginSubtitle: 'Ծառայություն մատուցողների համար — դիտեք օրվա ամրագրումները և ստացեք ծանուցումներ։',
    noEmployeeProfile:
      'Ձեր հաշիվը կապված չէ մասնագետի պրոֆիլի հետ։ Խնդրեք բիզնեսի ադմինին ձեզ հրավիրել։',
    accountNotFoundHint:
      'Դեռ մուտք չկա։ Խնդրեք ձեր բիզնեսի ադմինին ուղարկել հավելվածի մուտքի email Employees էջից։',
    networkError:
      'Չհաջողվեց կապ հաստատել սերվերի հետ։ Ստուգեք կապը և API հասանելիությունը։',
    adminPortal: 'Բիզնեսի ադմին՞',
    today: 'Այսօր',
    hello: 'Բարև',
    noAppointmentsToday: 'Այսօր ամրագրումներ չկան։',
  
    scheduleTitle: 'Իմ գրաֆիկը',
    scheduleSubtitle: 'Ձեր հասանելիությունը և առաջիկա ամրագրումները։',
  
    availability: 'Հասանելիություն (առաջիկա 2 շաբաթ)',
    booked: 'զբաղված',
    open: 'ազատ',
  
    upcomingAppointments: 'Առաջիկա ամրագրումներ',
    noUpcoming: 'Առաջիկա ամրագրումներ չկան։',
  
    profileTitle: 'Պրոֆիլ',
    profilePublicTitle: 'Հանրային պրոֆիլ',
    profileEditTitle: 'Պաշտոն',
    profileTitlePlaceholder: 'օր. Senior stylist',
    profileSave: 'Պահպանել պրոֆիլը',
    profileUploadPhoto: 'Փոխել լուսանկարը',
    profileReviewsTitle: 'Ձեր ակնարկները',
    profileNoReviews: 'Դեռ ակնարկներ չկան։',
    profileAverageRating: '{rating} միջին · {count} ակնարկ',
    profileNoEmployee: 'Կապեք provider պրոֆիլը ձեր հաշվին՝ լուսանկար, պաշտոն և ակնարկներ խմբագրելու համար։',
    profileSaveFailed: 'Չհաջողվեց պահպանել պրոֆիլը։',
    profilePhotoFailed: 'Չհաջողվեց վերբեռնել լուսանկարը։',
    profileAnonymousReview: 'Հաճախորդ',
    calendarTitle: 'Օրացույց',
    calendarSelectDay: 'Սեղմեք օրը՝ ամրագրումները տեսնելու համար։',
    calendarNoAppointments: 'Այս օրը ամրագրումներ չկան։',
    calendarPreviousMonth: 'Նախորդ ամիս',
    calendarNextMonth: 'Հաջորդ ամիս',
    appSection: 'Բջջային հավելված',
    installApp: 'Տեղադրել մասնագետի հավելվածը',
  
    enablePush: 'Միացնել ամրագրումների ծանուցումները',
    pushEnabled: 'Ծանուցումները միացված են',
    pushUnsupported: 'Push ծանուցումները չեն աջակցվում այս բրաուզերում։',
    pushHint: 'Ստացեք ծանուցում նոր ամրագրման դեպքում։',
    nativePushHint:
      'Օգտագործում է native push (Capacitor, պահանջում է Firebase/APNs կարգավորում)։',
    pushDenied: 'Ծանուցումների թույլտվությունը մերժված է։',
    pushSetupFailed:
      'Չհաջողվեց միացնել ծանուցումները։ Փորձեք կրկին կամ ստուգեք backend կարգավորումները։',
    pushSimulatorHint:
      'iOS Simulator-ում push-ը հաճախ չի աշխատում։ Օգտագործեք իրական iPhone՝ APNs/Firebase կարգավորմամբ։',
  
    openFullDashboard: 'Բացել ամբողջ dashboard-ը',
  
    navToday: 'Այսօր',
    navCalendar: 'Օրացույց',
    navSchedule: 'Ժամանակացույց',
    navProfile: 'Պրոֆիլ',
    navGiftCards: 'Նվեր քարտեր',
    helloName: 'Բարև, {name}',
    signInPageTitle: 'Մուտք',
    signInPageSubtitle: 'Ծառայություն մատուցողների և գրաֆիկի մենեջերների համար (սեփականատեր, ադմին, մենեջեր)։',
    analyticsConsentTitle: 'Վերլուծության համաձայնություն',
    analyticsConsentMessage:
      'Օգնեք բարելավել provider հավելվածը անանուն վերլուծությամբ։ Անձնական տվյալներ չեն հավաքվում։',
    analyticsConsentAccept: 'Ընդունել',
    analyticsConsentDecline: 'Մերժել',
    continueWithGoogle: 'Շարունակել Google-ով',
    orSignInWithEmail: 'կամ մուտք էլ. փոստով',
    accessDenied: 'Ձեր հաշիվը չունի մասնագետի կամ մենեջերի մուտք։ Խնդրեք բիզնեսի սեփականատիրոջից հրավիրել։',
    loginFailedRetry: 'Մուտքը ձախողվեց։ Փորձեք կրկին։',
    loginFailedNetwork: 'Մուտքը ձախողվեց։ Ստուգեք API հասցեն և ցանցը։',
    googleSignInFailed: 'Google մուտքը ձախողվեց։',
    signInCancelled: 'Մուտքը չեղարկվեց։',
    googleTokenInvalid: 'Google token-ը անվավեր էր։ Փորձեք կրկին։',
    scheduleAllAppointments: 'Բոլոր ամրագրումները',
    pushHintTeam: 'Ստացեք ծանուցում, երբ ցանկացած մասնագետին նոր ամրագրում է գալիս։',
    assistantTitle: 'AI օգնական',
    assistantEmptyHint:
      'Գրեք պարզ լեզվով՝ չեղարկել, նշել ավարտված, թարմացնել վճարումը կամ տեսնել գրաֆիկը։',
    assistantInputPlaceholder: 'Ասեք, թե ինչ անել…',
    assistantErrorGeneric: 'Ինչ-որ բան սխալ գնաց։ Փորձեք կրկին։',
    assistantConfirmFailed: 'Չհաջողվեց հաստատել գործողությունը։',
    assistantClarifyTry: 'Փորձեք՝',
    assistantPreviewMore: '…և ևս {count}',
    assistantSwipeHint: 'Հաստատելու համար սահեցրեք տողը ձախ',
    assistantConfirmChanges: 'Հաստատել {count} փոփոխություն',
    assistantSwipeConfirm: 'Սահեցրեք ձախ → Հաստատել',
    assistantWorking: 'Աշխատում է…',
    assistantConfirm: 'Հաստատել',
    assistantConfirmAll: 'Հաստատել բոլորը',
    suggestionsTitle: 'AI առաջարկներ',
    suggestionsTapToRun: 'Հպեք գործարկելու համար',
    offlineCommandQueued: 'Պահված է անցանց — կսինխրոնացվի, երբ կապը վերականգնվի։',
    offlineCommandNeedsNetwork: 'Նոր հրամանները մեկնաբանելու համար անհրաժեշտ է կապ։ Հաստատված գործողությունները կարող են հերթագրվել անցանց։',
    offlineSuggestionsStale: 'Ցուցադրվում են վերջին պահված առաջարկները։',
    offlineRefreshWhenOnline: 'Թարմացրեք, երբ առցանց լինեք։',
    offlineStatusOffline: 'Անցանց — փոփոխությունները հերթի մեջ են մինչև կապի վերադարձը։',
    offlineStatusSyncing: '{count} փոփոխություն սպասում է սինխրոնացման…',
    optimisticRollback: 'Չհաջողվեց պահել — փոփոխությունը հետարկվել է։',
    openAssistantFab: 'Բացել AI օգնականը',
    pushForegroundAction: 'Ավելացնել բուֆեր AI-ով',
    voiceStart: 'Ձայնային մուտք',
    voiceStop: 'Դադարեցնել',
    voiceUnsupported: 'Ձայնային մուտքը այս սարքում չի աջակցվում։',
    voiceDenied: 'Խոսափողի թույլտվությունը մերժված է։',
    voiceNoSpeech: 'Խոսք չի հայտնաբերվել։ Կրկին փորձեք։',
    voiceError: 'Ձայնային մուտքը ձախողվեց։',
    seedPromptToday: 'Ինչ կա իմ գրաֆիկում այսօր?',
    exampleSickCancel: 'Չեղարկիր այսօրվա բոլոր ամրագրումները — հիվանդ եմ',
    exampleMarkJohn: 'Նշիր John-ի ամրագրումը 13:00-ին որպես ավարտված և վճարված',
    exampleMarkAllPaid: 'Նշիր այսօրվա բոլոր ամրագրումները որպես ավարտված և վճարված',
    exampleScheduleToday: 'Ինչ կա իմ գրաֆիկում այսօր?',
    exampleExplainPushSetup: 'Ինչպե՞ս են աշխատում push ծանուցումները provider հավելվածում',
    exampleEnablePush: 'Միացնել push ծանուցումները նոր ամրագրումների համար',
    exampleCountAppointmentsTomorrow: 'Քանի ամրագրում ունեմ վաղը',
    exampleRevenueLastWeek: 'Քանի եմ վաստակել անցած շաբաթ',
    giftCardOrderFallback: 'Նվեր քարտի պատվեր',
    inviteInvalidLink: 'Հրավերի հղումը անվավեր է',
    inviteNotFound: 'Հրավերը չգտվեց',
    invitePhoneInvalid: 'Մուտքագրեք վավեր հեռախոսահամար երկրի կոդով',
    inviteSetupFailed: 'Չհաջողվեց ավարտել կարգավորումը',
    inviteMobilePhone: 'Բջջային հեռախոս',
    inviteCompleteSetup: 'Ավարտել կարգավորումը',
    phonePlaceholder: 'Հեռախոսահամար',
    pushBlockedInSettings: 'Ծանուցումները արգելափակված են համակարգի կարգավորումներում։',
    pushStatusLoadFailed: 'Չհաջողվեց բեռնել ծանուցումների կարգավիճակը։',
    pushTokenTimeout: 'Push token-ի սպասման ժամանակը լրացավ։ Ստուգեք Firebase-ը։',
    pushFirebaseRebuild: 'Չհաջողվեց միացնել ծանուցումները։ Ստուգեք google-services.json-ը։',
    pushNotAvailable: 'Push ծանուցումները հասանելի չեն։',
    cancelledByProvider: 'Չեղարկվել է մասնագետի կողմից',
    paymentBreakdownPromo: 'Պրոմո',
    paymentBreakdownGiftCard: 'Նվեր քարտ',
    paymentBreakdownLoyalty: 'Հավատարմության բոնուսներ',
    saveNewTime: 'Պահպանել նոր ժամը',
    helpWriteCancelNote: 'Օգնել գրել նշումը',
    versionConflictHint:
      'Այս ամրագրումը թարմացվել է այլ տեղից։ Տվյալները թարմացվել են — ստուգեք և պահպանեք կրկին։',
    saveNotes: 'Պահպանել նշումները',
    dismiss: 'Փակել',
    emailLabel: 'Էլ. փոստ',
    passwordLabel: 'Գաղտնաբառ',
    back: 'Հետ',
    tapToManage: 'Հպեք կառավարելու համար',
    teamTodayLabel: 'Բոլոր մասնագետներ — այսօր',
    alertsTitle: 'Ծանուցումներ',
    signOut: 'Դուրս գալ',
    close: 'Փակել',
    loadAppointmentFailed: 'Չհաջողվեց բեռնել ամրագրումը։',
    aiActionsTitle: 'AI գործողություններ',
    aiCancelSickChip: 'Չեղարկել — հիվանդ եմ',
    aiMarkDonePaidChip: 'Նշել ավարտված + վճարված',
    aiReschedule4pmChip: 'Տեղափոխել 16:00-ին',
    keepAppointment: 'Պահել ամրագրումը',
    cancelledPrefix: 'Չեղարկված՝',
    cancellationNote: 'Չեղարկման նշում',
    giftCardCreationTab: 'Քարտի ստեղծում',
    giftCardDeliveryTab: 'Առաքում',
    giftCardQueueEmpty: 'Այս հերթում պատվերներ չկան։',
    giftCardMarkReady: 'Քարտը պատրաստ է',
    giftCardAcceptPickup: 'Ընդունել վերցումը',
    giftCardMarkDelivered: 'Նշել առաքված',
    inviteSetupTitle: 'Հաշվի կարգավորում',
    inviteJoinBusiness: 'Միանալ {business}-ին որպես {role}',
    inviteSuccessRedirect: 'Հաշիվը պատրաստ է։ Վերահղում մուտքի…',
    invitePhoneHint: 'Ներառեք երկրի կոդը թիմի կապի և ծանուցումների համար։',
    inviteExistingPasswordHint: 'Մուտքի ժամանակ օգտագործեք ձեր գոյություն ունեցող գաղտնաբառը։',
    navLabCollection: 'Լաբորատոր հավաքում',
    labCollectionTitle: 'Հավաքման հերթ',
    labCollectionSubtitle: 'Այսօրվա լաբորատոր հավաքումները ձեր ամրագրումներով։',
    labCollectionEmpty: 'Այսօր հավաքումներ չկան։',
    labCollectionTeamLabel: 'Բոլոր մասնագետները — այսօր',
    labCollectionTapBooking: 'Սեղմեք՝ ամրագրումը բացելու համար',
    navLabResults: 'Արդյունքներ',
    labResultsTitle: 'Պացիենտի արդյունքներ',
    labResultsSubtitle: 'Լաբորատոր արդյունքներ ձեր պացիենտների համար (վերջին 30 օր)։',
    labResultsEmpty: 'Այս ժամանակահատվածում ձեր պացիենտների արդյունքներ չկան։',
    labResultsTeamLabel: 'Բոլոր մասնագետները — վերջին 30 օր',
    labResultsTapBooking: 'Սեղմեք՝ ամրագրումը բացելու համար',
    navClinicTasks: 'Առաջադրանքներ',
    clinicTasksTitle: 'Կլինիկական առաջադրանքներ',
    clinicTasksSubtitle: 'Բաց լաբորատոր և հետադարձ զանգերի առաջադրանքներ՝ ձեր կամ թիմի համար։',
    clinicTasksEmpty: 'Բաց կլինիկական առաջադրանքներ չկան։',
    clinicTasksTeamLabel: 'Բոլոր մատակարարները — բաց առաջադրանքներ',
    clinicTasksTypeResultReview: 'Արդյունքի ստուգում',
    clinicTasksTypeSpecimenCollection: 'Նմուշի հավաքում',
    clinicTasksTypePatientCallback: 'Պացիենտին հետադարձ զանգ',
    clinicTasksTypeUnknown: 'Կլինիկական առաջադրանք',
    clinicTasksPriorityHigh: 'Բարձր առաջնահերթություն',
    clinicTasksAutoManaged: 'Ավտո',
    clinicTasksDue: 'Ժամկետ',
    clinicTasksUnassigned: 'Չնհանացված',
    clinicTasksClaim: 'Վերցնել',
    clinicTasksComplete: 'Ավարտել',
    navPatients: 'Պացիենտներ',
    patientLookupTitle: 'Պացիենտի որոնում',
    patientLookupSubtitle: 'Որոնեք անունով, էլ. փոստով կամ հեռախոսով՝ քարտի ամփոփումը բացելու համար։',
    patientLookupPlaceholder: 'Որոնել պացիենտներ…',
    patientLookupMinChars: 'Մուտքագրեք առնվազն 2 նիշ։',
    patientLookupEmpty: 'Համապատասխան պացիենտներ չեն գտնվել։',
    patientChartTitle: 'Քարտի ամփոփում',
    patientChartLoadFailed: 'Չհաջողվեց բեռնել պացիենտի քարտը։',
    patientChartTodaysOrders: 'Այսօրվա պատվերներ',
    patientChartTodaysResults: 'Այսօրվա արդյունքներ',
  },
  appointments: {
    title: 'Ամրագրումներ',
    subtitle: 'Որոնեք, ֆիլտրեք և կառավարեք բոլոր ամրագրումները։',
    aiInsightsTitle: 'Ամրագրումների վերլուծություն',
    total: 'Ընդհանուր ամրագրումներ',
    searchPlaceholder: 'Հաճախորդ, ծառայություն, մասնագետ…',
  
    filterByStatus: 'Կարգավիճակ',
    allStatuses: 'Բոլոր կարգավիճակները',
    filterToday: 'Միայն այսօր',
  
    dateTime: 'Ամսաթիվ և ժամ',
    customer: 'Հաճախորդ',
    service: 'Ծառայություն',
    specialist: 'Մասնագետ',
    status: 'Կարգավիճակ',
  
    noResults: 'Չկան ամրագրումներ ըստ ձեր ֆիլտրերի։',
    loadFailed: 'Չհաջողվեց բեռնել ամրագրումները։',
  
    paymentBreakdown: 'Վճարման բաժանում',
    paymentServicePrice: 'Ծառայության արժեք',
    paymentChargedAmount: 'Վճարված գումար (checkout)',
    paymentPromoDiscount: 'Promo զեղչ',
    paymentLoyaltyDiscount: 'Loyalty բոնուսներ',
    paymentCashPaid: 'Վճարված կանխիկ/քարտով',
    paymentFullyCovered: 'Ամբողջությամբ ծածկված զեղչերով',
    paymentLoyaltyPoints: '{points} բոնուս օգտագործված',
    detailTitle: 'Ամրագրման մանրամասներ',
    detailLoadFailed: 'Չհաջողվեց բեռնել ամրագրման մանրամասները։',
    detailFallbackTitle: 'Ամրագրում',
    reschedule: 'Վերաժամանակացնել',
    startTime24h: 'Սկզբի ժամ',
    noServicesForBlock: 'Այս ժամանակահատվածի համար ծառայություններ չկան',
    servicesInBlockHint: 'Ցուցադրվում են միայն այս գրաֆիկի բլոկի ծառայությունները։',
    noServiceBlockHint:
      'Այս ժամին ծառայության բլոկ չկա — ընտրեք այլ ժամանակահատված կամ մասնագետ։',
    rescheduleSaveHint:
      'Պահպանելիս ստուգվում են հասանելիությունը, ծառայության ժամանակահատվածը և կոնֆլիկտները։',
    paymentStatus: 'Վճարման կարգավիճակ',
    searchCustomerOrWalkIn: 'Որոնել հաճախորդ կամ նշել անհայտ հաճախորդ…',
    walkIn: 'Անհայտ հաճախորդ',
    descriptionPlaceholder: 'Ամրագրման նկարագրություն…',
    internalNotesPlaceholder: 'Ներքին նշումներ…',
    cancellationReason: 'Չեղարկման պատճառ',
    confirmAction: 'Հաստատել',
    markStatusConfirm: 'Նշե՞լ այս ամրագրումը որպես «{status}»։',
    cancelConfirmTitle: 'Չեղարկե՞լ այս ամրագրումը։',
    cancelReasonPlaceholder: 'Չեղարկման պատճառ (ընտրովի)',
    confirmCancel: 'Հաստատել չեղարկումը',
    versionConflict:
      'Ամրագրումը թարմացվել է այլ տեղից։ Տվյալները թարմացվել են — ստուգեք և կրկին պահպանեք։',
    saveFailed: 'Չհաջողվեց պահպանել փոփոխությունները',
    serviceDurationMin: '({minutes} ր)',
  },
  pagination: {
    showing: 'Ցուցադրվում է {from}–{to} / {total}',
    pageOf: 'Էջ {page} / {total}',
    previous: 'Նախորդ',
    next: 'Հաջորդ',
  },
  servicesPage: {
    title: 'Ծառայություններ',
    subtitle: 'Սահմանեք ձեր առաջարկները և օնլայն նախավճարի հնարավորությունը հանրային ամրագրման համար',
  
    addService: 'Ավելացնել ծառայություն',
    newService: 'Նոր ծառայություն',
    editService: 'Խմբագրել ծառայությունը',
  
    name: 'Անուն',
    description: 'Նկարագրություն',
    durationMinutes: 'Տևողություն (րոպե)',
    bufferMinutes: 'Բուֆեր (րոպե)',
    price: 'Գին',
    taxRateOverride: 'Հարկի դրույքի գերակայում (%)',
    taxRateOverridePlaceholder: 'Ժառանգել բիզնեսի լռելյայնը',
    taxRateOverrideHint: 'Դատարկ թողեք բիզնեսի լռելյայն դրույքի համար։ 0 — հարկից ազատ։',
    noServices: 'Դեռ ծառայություններ չկան',
    currency: 'Արժույթ',
  
    onlinePayment: 'Ընդունել օնլայն վճարում հանրային ամրագրման ժամանակ',
    stripeRequired: 'Միացրեք Stripe Billing-ում՝ օնլայն վճարումը միացնելու համար',
  
    paymentType: 'Վճարման տեսակ',
    prepayFull: 'Ամբողջական նախավճար օնլայն',
    prepayDeposit: 'Ավանդ օնլայն',
    depositAmount: 'Ավանդի գումար (թողեք 0՝ 50% դեֆոլտի համար)',
  
    badgeFullPrepay: 'Օնլայն նախավճար',
    badgeDeposit: 'Օնլայն ավանդ',
  
    create: 'Ստեղծել',
    save: 'Պահպանել',
    saving: 'Պահպանվում է…',
  
    categoriesTitle: 'Ծառայությունների կատեգորիաներ',
    categoriesSubtitle:
      'Խմբավորեք ծառայությունները կատեգորիաներով (օր. Մազերի խնամք → Մազերի ներկում)',
  
    addCategory: 'Ավելացնել կատեգորիա',
    categoryName: 'Կատեգորիայի անուն',
    categorySortOrder: 'Ցուցադրման հերթականություն',
  
    noCategories: 'Դեռ կատեգորիաներ չկան — ավելացրեք մեկը կազմակերպելու համար',
    serviceCategory: 'Կատեգորիա',
    noCategory: 'Առանց կատեգորիայի',
    uncategorizedGroup: 'Այլ ծառայություններ',
  
    tabCategories: 'Ծառայությունների կատեգորիաներ',
    tabServiceTypes: 'Ծառայությունների տեսակներ',
  
    serviceTypesTitle: 'Ծառայությունների տեսակներ',
    serviceTypesSubtitle: 'Ամրագրվող անհատական ծառայություններ՝ կապված կատեգորիայի հետ',
    serviceTypesCount: 'Ծառայությունների տեսակներ',
  
    createCategoryFirst: 'Խորհուրդ․ նախ ստեղծեք կատեգորիաներ, հետո ավելացրեք ծառայությունները',
    localizedNamesTitle: 'Տեղայնացված ցուցադրման անուններ',
    localizedNamesHint:
      'Լրացուցիչ անուններ յուրաքանչյուր լեզվով (մինչև 3)։ Հանրային ամրագրումը դրանք օգտագործում է, երբ այցելուի լեզուն համընկնում է․ վերևի հիմնական անունը պահես է պահուստային։',
    localizedNamesLocaleEn: 'Անգլերեն',
    localizedNamesLocaleHy: 'Հայերեն',
    localizedNamesLocaleRu: 'Ռուսերեն',
    localizedNamesSlot: 'Անուն {n}',
    localizedNamesOptional: 'Ընտրովի',
    editCategory: 'Խմբագրել կատեգորիան',
    saveCategory: 'Պահպանել կատեգորիան',
  
    tabPackages: 'Փաթեթներ',
  
    packagesTitle: 'Ծառայությունների փաթեթներ',
    packagesSubtitle:
      'Միավորեք մի քանի ծառայություն զեղչված գնով հանրային Services բաժնի համար',
  
    packagesAdd: 'Ավելացնել փաթեթ',
    packagesCreate: 'Ստեղծել փաթեթ',
  
    packagesName: 'Փաթեթի անուն',
    packagesDisplayOrder: 'Ցուցադրման հերթականություն',
    packagesImageUrl: 'Նկարի URL (ըստ ցանկության)',
  
    packagesDiscountType: 'Զեղչի տեսակ',
    packagesDiscountPercent: 'Տոկոսային զեղչ ընդհանուրից',
    packagesDiscountFixed: 'Ֆիքսված զեղչ ընդհանուրից',
    packagesDiscountValue: 'Զեղչի արժեք',
  
    packagesExpiresAt: 'Առաջարկի ավարտ',
    packagesExpiresOptional: 'Ըստ ցանկության — այս ամսաթվից հետո չի երևա հանրային ամրագրման մեջ',
  
    packagesIncludedServices: 'Ներառված ծառայություններ',
    packagesQty: 'Քանակ',
  
    packagesPricingPreview: 'Գնային նախադիտում',
    packagesRegularTotal: 'Սովորական ընդհանուր',
    packagesPrice: 'Փաթեթի գին',
    packagesSavings: 'Խնայողություն',
  
    packagesEmpty: 'Դեռ փաթեթներ չկան — ստեղծեք մեկը ծառայությունների համակցման համար',
    packagesIncludes: 'Ներառում է',
    packagesStatus: 'Կարգավիճակ',
    packagesActions: 'Գործողություններ',
  
    packagesNoExpiration: 'Ժամկետ չկա',
  
    packagesStatusActive: 'Ակտիվ',
    packagesStatusInactive: 'Ապաակտիվացված',
    packagesStatusExpired: 'Ժամկետանց',
  
    packagesSave: 'Պահպանել',
    packagesEdit: 'Խմբագրել',
    packagesDuplicate: 'Կրկնօրինակել',
    packagesActivate: 'Ակտիվացնել',
    packagesDeactivate: 'Ապաակտիվացնել',
    packagesDelete: 'Ջնջել',
  
    packagesDeactivateConfirm:
      'Ապաակտիվացնե՞լ այս փաթեթը։ Այն կթաքցվի հանրային ամրագրումից։',
  
    packagesDeleteConfirm:
      'Մշտապես ջնջե՞լ այս փաթեթը։ Այս գործողությունը հետարկել չի լինի։',
  
    packagesFilterAll: 'Բոլորը',
    packagesFilterActive: 'Ակտիվ',
    packagesFilterInactive: 'Ապաակտիվ',
    packagesFilterExpired: 'Ժամկետանց',
  
    packagesCheckoutGrace: 'Checkout-ի արտոնյալ ժամանակ (ժամ)',
    packagesCheckoutGraceHint:
      'Փաթեթի ժամկետի ավարտից հետո օգտատերերը կարող են ավարտել վճարումը այսքան ժամվա ընթացքում',
  
    packagesSaveGrace: 'Պահպանել արտոնության կանոնը',
  
    tabMultiService: 'Մուլտի ծառայություն',
  
    multiServiceTitle: 'Մի քանի ծառայության ամրագրում',
    multiServiceSubtitle:
      'Թույլ տվեք հաճախորդներին մեկ այցի ընթացքում համատեղել ծառայությունները (առանձին փաթեթներից)',
  
    multiServiceEnabled:
      'Միացնել բազմածառայություն ամրագրումը հանրային Services բաժնում',
  
    multiServiceMaxCount: 'Առավելագույն ծառայություններ մեկ ամրագրման մեջ',
    multiServiceMaxDuration: 'Առավելագույն ընդհանուր տևողություն (րոպե)',
  
    multiServiceTurnover: 'Ծառայությունների միջև բուֆեր (րոպե)',
  
    multiServiceSchedulingMode: 'Ժամանակացույցի ռեժիմ',
    multiServiceModeSameVisit: 'Միասնական այց (block)',
    multiServiceModePerService: 'Առանձին օրեր ըստ ծառայության',
  
    multiServiceIncompatible: 'Անհամատեղելի ծառայությունների զույգեր',
    multiServiceIncompatibleHint:
      'Արգելեք որոշ ծառայությունների միասին ամրագրումը մեկ այցի ընթացքում',
  
    multiServiceIncompatibleMode: 'Անհամատեղելիության տեսակ',
    multiServiceIncompatibleByService: 'Անհատական ծառայություններ',
    multiServiceIncompatibleByCategory: 'Կատեգորիաներ',
  
    multiServiceServiceA: 'Ծառայություն A',
    multiServiceServiceB: 'Ծառայություն B',
  
    multiServiceCategoryA: 'Կատեգորիա A',
    multiServiceCategoryB: 'Կատեգորիա B',
  
    multiServiceUncategorized: 'Առանց կատեգորիայի ծառայություններ',
  
    multiServiceAddPair: 'Ավելացնել զույգ',
  },
  catalogNotify: {
    title: 'Հաճախորդների ծանուցում',
    subtitle:
      'Ցանկության դեպքում ուղարկեք էլ. փոստ և push հաճախորդներին։ Յուրաքանչյուրը ստանում է իր հավելվածի լեզվով։',
    modeSkipTitle: 'Չծանուցել',
    modeSkipHint: 'Պահպանել առանց հայտարարության ուղարկելու։',
    modeNotifyTitle: 'Ծանուցել հաճախորդներին',
    modeNotifyHint: 'Պահպանելուց հետո ուղարկել հաղորդագրություն բոլոր միացված լեզուներով։',
    templateHint: 'Գրեք վերնագիր և տեքստ յուրաքանչյուր միացված լեզվի համար։',
    subjectLabel: 'Email / push վերնագիր',
    bodyLabel: 'Հաղորդագրության տեքստ',
    subjectPlaceholder: 'Նոր առաջարկ {{businessName}}-ում',
    bodyPlaceholder: 'Ողջույն {{customerName}}, …',
    packageVariables:
      'Փոփոխականներ՝ {{customerName}}, {{packageName}}, {{discount}}, {{businessName}}, {{bookUrl}}',
    planVariables:
      'Փոփոխականներ՝ {{customerName}}, {{planName}}, {{discount}}, {{businessName}}, {{bookUrl}}',
    incompleteTemplate: 'Լրացրեք վերնագիրն ու տեքստը բոլոր միացված լեզուների համար։',
    previewButton: 'Նախադիտում',
    previewTitle: 'Հաղորդագրության նախադիտում',
    previewSubtitle:
      'Նմուշ արժեքները փոխարինում են փոփոխականները — հաճախորդները տեսնում են իրենց անունն ու լեզուն։',
    previewSampleHint: 'Նմուշ հաճախորդ և կատալոգի արժեքներ ձեր ընթացիկ ձևից։',
    previewEmpty: 'Նախադիտման համար լրացրեք վերնագիր կամ հաղորդագրություն։',
    previewEmptyField: '(դատարկ)',
    previewBookUrlLabel: 'Գրանցման հղում',
    previewSampleBusiness: 'Ձեր սալոն',
    previewSamplePackageName: 'Սպա օր',
    previewSamplePlanName: 'Nail Club',
    previewWhatsAppNote:
      'Կատալոգի հայտարարությունները ուղարկվում են email-ով և consumer push-ով։ WhatsApp-ը չի օգտագործվում փաթեթների կամ անդամակցությունների համար։',
  },
  notificationPreview: {
    previewButton: 'Նախադիտում',
    emailTemplateTitle: 'Հաղորդագրության նախադիտում',
    emailTemplateSubtitle: 'Նմուշ արժեքները փոխարինում են փոփոխականները։',
    localeLabel: 'Լեզու',
    channelEmail: 'Email',
    channelPush: 'App push',
    channelWhatsApp: 'WhatsApp',
    emailFrom: 'Ումից',
    emailSubject: 'Վերնագիր',
    emailPlainBody: 'Պարզ տեքստ',
    emailHtmlBody: 'HTML',
    pushDeviceHint: 'Consumer app ծանուցում',
    whatsAppChatHint: 'Chat նախադիտում',
    whatsAppTemplate: 'Meta template',
    whatsAppLanguage: 'Լեզուի կոդ',
    whatsAppParams: 'Template պարամետրեր',
    whatsAppMetaNote:
      'WhatsApp-ը օգտագործում է Meta-ի հաստատված template-ներ (Settings → Notifications)։',
    whatsAppLoading: 'Բեռնվում է WhatsApp կարգավորումը…',
    emptyField: '(դատարկ)',
  },
  clinicTestCatalog: {
    tabLabel: 'Լաբորատոր կատալոգ',
    typesTitle: 'Լաբորատոր թեստերի տեսակներ',
    typesSubtitle:
      'Կառուցվածքային թեստեր, կապված ամրագրելի lab_test ծառայությունների հետ։ Ծոմապահությունը և պատրաստումը կարող են ժառակվել կապված ծառայությունից։',
    panelsTitle: 'Թեստային պանելներ',
    panelsSubtitle: 'Միավորեք մի քանի թեստեր պանելների մեջ։',
    addType: 'Ավելացնել թեստ',
    addPanel: 'Ավելացնել պանել',
    typeTitle: 'Թեստի անվանում',
    typeCode: 'Կոդ',
    panelTitle: 'Պանելի անվանում',
    panelCode: 'Պանելի կոդ',
    panelItems: 'Ներառված թեստեր',
    linkedService: 'Կապված ծառայություն',
    noLinkedService: 'Առանց կապված ծառայության',
    optionalCodeHint: 'Դատարկ թողնելու դեպքում ստեղծվում է վերնագրից',
    requiresFasting: 'Պահանջում է ծոմ պահել',
    preparationNotes: 'Պատրաստման հրահանգներ',
    fastingBadge: 'Ծոմ',
    noTypes: 'Դեռ լաբորատոր թեստեր չկան։',
    noPanels: 'Դեռ պանելներ չկան։',
    importTitle: 'Կատալոգի ներմուծում',
    importSubtitle:
      'Ստեղծեք թեստեր կլինիկական playbook-ից կամ ներմուծեք CSV տողերով։',
    seedPlaybook: 'Ստեղծել playbook-ից',
    importCsv: 'Ներմուծել CSV',
    csvLabel: 'CSV տողեր',
    csvPlaceholder:
      'kind,title,code,serviceName,price,requiresFasting,preparationNotes,unit,abbreviation,description,panelItems',
    csvHint:
      'kind=type կամ panel։ panelItems-ում թեստի կոդերը բաժանեք | նշանով։',
    importSummaryTypes: 'Թեստեր — ստեղծված {created}, բաց թողնված {skipped}։',
    importSummaryPanels: 'Պանելներ — ստեղծված {created}, բաց թողնված {skipped}։',
    importUnmatchedServices: 'Չհամընկնող ծառայություններ՝ {names}',
    importCsvErrors: 'Ներմուծման սխալներ՝ {errors}',
    seedSuccess: 'Լաբորատոր կատալոգը ստեղծվել է playbook-ից։',
    importSuccess: 'CSV ներմուծումն ավարտված է։',
  },
  clinicLis: {
    tabLabel: 'LIS ինտեգրացիա',
    registry: {
      title: 'Լաբորատորիայի տեղեկատու',
      subtitle:
        'Գրանցեք ներքին և արտաքին լաբորատորիաները, վերլուծիչները և նմուշների մեքենայի նշանակումները։',
      addLab: 'Ավելացնել լաբորատորիա',
      editLab: 'Խմբագրել լաբորատորիան',
      addMachine: 'Ավելացնել վերլուծիչ',
      editMachine: 'Խմբագրել վերլուծիչը',
      emptyLabs: 'Դեռ գրանցված լաբորատորիաներ չկան։',
      emptyMachines: 'Դեռ վերլուծիչներ չկան։',
      inactiveBadge: 'Ոչ ակտիվ',
      internalLabBadge: 'Ներքին',
      externalLabBadge: 'Արտաքին',
      formRequired: 'Պարտադիր են անունը, տեղադրությունը և հեռախոսը։',
      saveFailed: 'Չհաջողվեց պահպանել լաբորատորիայի գրառումը։',
      duplicateInternalLab: 'Այս բիզնեսի համար արդեն գրանցված է ներքին լաբորատորիա։',
      assignMachine: 'Նշանակել վերլուծիչ',
      clearMachine: 'Հեռացնել վերլուծիչը',
      fields: {
        name: 'Լաբորատորիայի անուն',
        location: 'Տեղադրություն',
        phone: 'Հեռախոս',
        labLocation: 'Լաբորատորիայի տեսակ',
        labType: 'Տեղեկատուի դերը',
        integrationVendorCode: 'Ինտեգրացիայի մատակարարի կոդ',
        active: 'Ակտիվ է տեղեկատուում',
        machineName: 'Վերլուծիչի անուն',
        parentLab: 'Ծննդավոր լաբորատորիա',
      },
      labLocations: {
        InHouse: 'Ներքին',
        External: 'Արտաքին հղում',
      },
      labTypes: {
        Internal: 'Ներքին (in-house)',
      },
    },
    sync: {
      title: 'Լաբորատոր սինխ',
      subtitle:
        'Հետևեք մուտքային HL7, FHIR և vendor webhook դիտարկումների հարցումներին և կապեք դրանք կլինիկայի արդյունքների հետ։',
      emptyRequests: 'Դեռ սինխ դիտարկման հարցումներ չկան։',
      emptyInbound: 'Հերթում մուտքային հաղորդագրություններ չկան։',
      linkToResult: 'Կապել թեստի արդյունքի հետ',
      ingestSuccess: 'Դիտարկման հարցումը ընդունված է։',
      linkSuccess: 'Կապված է կլինիկայի թեստի արդյունքի հետ։',
      columns: {
        testName: 'Թեստ',
        patient: 'Հիվանդ',
        status: 'Կարգավիճակ',
        received: 'Ստացվել է',
        vendor: 'Մատակարար',
        source: 'Աղբյուր',
        error: 'Սխալ',
      },
      observationStatus: {
        Unlinked: 'Չկապված',
        Linked: 'Կապված',
        Void: 'Անվավեր',
      },
      inboundStatus: {
        Pending: 'Սպասում',
        Processing: 'Մշակում',
        Completed: 'Ավարտված',
        Failed: 'Ձախողված',
      },
      inboundSource: {
        hl7: 'HL7',
        fhir: 'FHIR',
        vendor_json: 'Vendor JSON',
      },
      linkMethod: {
        Manual: 'Ձեռքով',
        Sync: 'Ավտոմատ սինխ',
      },
      webhook: {
        title: 'Մուտքային webhook',
        subtitle:
          'Կարգավորեք webhook գաղտնիքը կլինիկայի կարգավորումներում՝ մատակարարները արդյունքներ ուղարկելուց առաջ։',
        secretMissing: 'Մուտքային webhook-ը կարգավորված չէ։',
        signatureHeader: 'Ստորագրության վերնագիր',
        deliveryIdHeader: 'Առաքման ID վերնագիր',
      },
    },
    workerErrors: {
      processFailed: 'Չհաջողվեց մշակել մուտքային LIS հաղորդագրությունը։',
      parseFailed: 'Չհաջողվեց վերլուծել մուտքային հաղորդագրության բեռը։',
      webhookNotConfigured: 'Այս բիզնեսի համար LIS մուտքային webhook-ը կարգավորված չէ։',
      invalidSignature: 'Սխալ մուտքային webhook ստորագրություն։',
      unknownSource: 'Չհաջողվեց որոշել մուտքային հաղորդագրության ձևաչափը։',
      accessDenied: 'Դուք մուտք չունեք կլինիկայի լաբորատոր սինխին։',
      registryAccessDenied: 'Դուք մուտք չունեք կլինիկայի լաբորատորի տեղեկատուին։',
      manageDenied: 'Դուք թույլատրություն չունեք կառավարելու լաբորատորի տեղեկատուն։',
      labNotFound: 'Լաբորատորիան չի գտնվել։',
      specimenNotFound: 'Նմուշը չի գտնվել։',
      observationNotFound: 'Լաբորատոր սինխ դիտարկման հարցումը չի գտնվել։',
      alreadyLinked: 'Այս դիտարկման հարցումն արդեն կապված է։',
      linkRequiresMeasurements: 'Կապեք չափումներ ունեցող թեստի արդյունքի հետ։',
      ingestDenied: 'Դուք թույլատրություն չունեք ընդունելու լաբորատոր սինխ դիտարկումներ։',
      linkDenied: 'Դուք թույլատրություն չունեք կապելու լաբորատոր սինխ դիտարկումներ։',
      invalidMachineName: 'Սխալ վերլուծիչի անուն։',
      invalidPayload: 'Սխալ լաբորատոր սինխ դիտարկման բեռ։',
      retryQueued: 'Ձախողված հաղորդագրությունները մնում են հերթում կրկնման համար։',
    },
    toasts: {
      labSaved: 'Լաբորատորիայի գրառումը պահպանված է։',
      machineSaved: 'Վերլուծիչը պահպանված է։',
      machineAssigned: 'Վերլուծիչը նշանակված է նմուշին։',
      machineCleared: 'Վերլուծիչը հեռացված է նմուշից։',
      syncProcessed: 'Մշակված է {count} մուտքային հաղորդագրություն։',
    },
  },
  clinicDiagnosticCodes: {
    tabLabel: 'Հաշվարկային կոդեր',
    title: 'Ախտորոշիչ և պրոցեդուրայի կոդեր',
    subtitle:
      'Տարածաշրջանից անկախ հաշվարկային կոդերի տեղեկատու ծառայությունների և լաբորատոր թեստերի համար։',
    searchPlaceholder: 'Որոնել կոդով կամ նկարագրությամբ…',
    addCode: 'Ավելացնել հաշվարկային կոդ',
    editCode: 'Խմբագրել հաշվարկային կոդը',
    empty: 'Դեռ հաշվարկային կոդեր չկան։',
    inactiveBadge: 'Ոչ ակտիվ',
    formRequired: 'Պարտադիր են կոդի տեսակը, համակարգը, կոդը և նկարագրությունը։',
    saveFailed: 'Չհաջողվեց պահպանել հաշվարկային կոդը։',
    duplicateCode: 'Այս կոդն արդեն կա տեղեկատուում։',
    filters: {
      allKinds: 'Բոլոր տեսակները',
      allSystems: 'Բոլոր համակարգերը',
      activeOnly: 'Միայն ակտիվ',
    },
    codeKinds: {
      diagnostic: 'Ախտորոշիչ',
      procedure: 'Պրոցեդուրա',
    },
    codeSystems: {
      'ICD-10-CM': 'ICD-10-CM',
      'ICD-10': 'ICD-10',
      CPT: 'CPT',
      HCPCS: 'HCPCS',
      'SNOMED-CT': 'SNOMED-CT',
      LOCAL: 'Տեղական',
      OTHER: 'Այլ',
    },
    fields: {
      codeKind: 'Կոդի տեսակ',
      codeSystem: 'Կոդի համակարգ',
      code: 'Կոդ',
      description: 'Նկարագրություն',
      searchDescription: 'Որոնման նկարագրություն (ընտրովի)',
      active: 'Ակտիվ է տեղեկատուում',
    },
    linkOnService: 'Հաշվարկային կոդ (ընտրովի)',
    linkOnTestType: 'Հաշվարկային կոդ (ընտրովի)',
  },
  externalDoctors: {
    tabLabel: 'Ուղղորդող բժիշկներ',
    title: 'Արտաքին / ուղղորդող բժիշկներ',
    subtitle:
      'Ուղղորդող բժիշկների տեղեկատու պոլիկլինիկական ուղղորդումների և պացիենտի քարտի համար։',
    searchPlaceholder: 'Որոնել անունով, կլինիկայով կամ մասնագիտությամբ…',
    addDoctor: 'Ավելացնել ուղղորդող բժիշկ',
    editDoctor: 'Խմբագրել ուղղորդող բժիշկին',
    empty: 'Դեռ ուղղորդող բժիշկներ չկան։',
    inactiveBadge: 'Ոչ ակտիվ',
    formRequired: 'Պարտադիր են անունը, փողոցը և քաղաքը։',
    saveFailed: 'Չհաջողվեց պահպանել ուղղորդող բժիշկին։',
    fields: {
      name: 'Բժշկի անուն',
      clinicName: 'Կլինիկա / պրակտիկա',
      specialty: 'Մասնագիտություն',
      street: 'Փողոց',
      unit: 'Suite',
      city: 'Քաղաք',
      province: 'Մարզ / նահանգ',
      postalCode: 'Փոստային կոդ',
      country: 'Երկիր',
      fax: 'Ֆաքս',
      phone: 'Հեռախոս',
      email: 'Էլ. փոստ',
      active: 'Ակտիվ է տեղեկատուում',
    },
  },
  clinicQuestionnaires: {
    tabLabel: 'Հարցաթերթիկներ',
    title: 'Կլինիկական հարցաթերթիկներ',
    subtitle:
      'Կառուցեք ճյուղավոր intake հարցաթերթիկներ կլինիկայի համար։ Առանց journey milestone-ների և plan trigger-ների։',
    addQuestionnaire: 'Ավելացնել հարցաթերթիկ',
    empty: 'Դեռ հարցաթերթիկներ չկան։',
    selectPrompt: 'Ընտրեք հարցաթերթիկ՝ նախագծի սահմանումը դիտելու համար։',
    statusDraft: 'Նախագիծ',
    statusPublished: 'Հրապարակված',
    revisionLabel: 'Տարբերակ {revision}',
    untitledQuestion: 'Անվերնագիր հարց',
    noQuestionsYet: 'Դեռ հարցեր չկան։ Բեռնեք օրինակի կաղապարը։',
    loadSampleTemplate: 'Բեռնել ուղղորդման intake օրինակ',
    publish: 'Հրապարակել հարցաթերթիկը',
    formRequired: 'Պարտադիր են կոդը, ներքին անունը և վերնագիրը։',
    saveFailed: 'Չհաջողվեց պահպանել հարցաթերթիկը։',
    fields: {
      code: 'Կոդ',
      internalName: 'Ներքին անուն',
      title: 'Վերնագիր պացիենտի համար',
      introTitle: 'Ներածության վերնագիր',
      introBody: 'Ներածության տեքստ',
    },
  },
  onboarding: {
    title: 'Կարգավորեք ձեր բիզնեսը',
    subtitle:
      'Ծառայություններ, ժամանակացույց և հանրային ամրագրման հղում — մենք ձեզ կուղեկցենք յուրաքանչյուր քայլում։',
  
    stepServices: '1. Ծառայություններ',
    stepSchedule: '2. Ժամանակացույց',
    stepLink: '3. Ամրագրման հղում',
  
    businessTypeTitle: 'Ինչպիսի՞ բիզնես եք վարում',
    businessTypeSubtitle:
      'Սրա հիման վրա մենք կառաջարկենք մեկնարկային կատալոգ, որը կարող եք հետագայում փոխել',
  
    notesOptional: 'Ուրիշ ինչ-որ բան կա՞, որ պետք է իմանանք (ըստ ցանկության)',
    notesPlaceholder:
      'օր. Մենք կենտրոնացած ենք լյուքս color ծառայությունների և bridal styling-ի վրա…',
  
    skip: 'Բաց թողնել',
    aiPanelTitle: 'Արագ կարգավորում AI-ով',
    aiAssistantTitle: 'Կարգավորման օգնական',
    aiGuidedTitle: 'Ուղղորդված հրամաններ',
    aiGuidedHint: 'Սեղմեք հրամանը՝ օգնականը բացելու, կամ օգտագործեք փայլիկ կոճակը ամբողջական զրույցի համար։',
    generateCatalog: 'Ստեղծել առաջարկներ',
    aiGenerated: 'Ստեղծված է AI-ի միջոցով՝ ըստ ձեր բիզնեսի տեսակի',
    templateGenerated: 'Մեկնարկային ձևանմուշ ձեր բիզնեսի համար',
  
    back: 'Հետ',
  
    createCatalog: 'Ստեղծել {categories} կատեգորիա և {services} ծառայություն',
  
    scheduleTitle: 'Սահմանեք ձեր հասանելիությունը',
    scheduleSubtitle:
      'Մենք կկիրառենք ձեր ոլորտի playbook ժամանակացույցը առաջիկա 4 շաբաթվա համար',
  
    scheduleDetail1: 'Կիրառվում է ձեզ որպես default provider',
    scheduleDetail2:
      'Դուք կարող եք ցանկացած պահի փոխել template-ները Schedule էջում',
  
    applySchedule: 'Կիրառել շաբաթական ժամանակացույց',
    scheduleFailed: 'Չհաջողվեց կարգավորել ժամանակացույցը։',
  
    linkTitle: 'Կիսվեք ձեր ամրագրման հղումով',
    linkSubtitle:
      'Ուղարկեք հաճախորդներին ձեր հանրային էջ կամ embed արեք կայքում',
  
    finishSetup: 'Ավարտել կարգավորումը',
  
    doneTitle: 'Դուք պատրաստ եք',
    doneSubtitle:
      'Կատեգորիաներն ու ծառայությունները ստեղծված են։ Կարող եք ցանկացած պահի փոխել գները և տևողությունները։',
    doneSubtitleFull:
      'Ձեր ծառայությունները, ժամանակացույցը և ամրագրման հղումը պատրաստ են։ Կիսվեք հաճախորդների հետ կամ embed արեք կայքում։',
  
    goToServices: 'Անցնել Services',
    goToDashboard: 'Անցնել Dashboard',
  
    saveTypeFailed: 'Չհաջողվեց պահպանել բիզնեսի տեսակը։',
    recommendFailed: 'Չհաջողվեց ստեղծել առաջարկներ։',
    applyFailed: 'Չհաջողվեց ստեղծել ծառայությունները։',
  
    types: {
      hairSalon: 'Մազերի սրահ',
      hairSalonDesc: 'Կտրում, ներկում, styling, խնամք',
  
      barbershop: 'Վարսավիրանոց',
      barbershopDesc: 'Կտրում, fade, մորուքի խնամք',
  
      nailSalon: 'Եղունգների սրահ',
      nailSalonDesc: 'Մանիկյուր, պեդիկյուր, դիզայն',
  
      spa: 'Սպա և wellness',
      spaDesc: 'Դեմքի խնամք, մերսում, մարմնի պրոցեդուրաներ',
  
      clinic: 'Կլինիկա',
      clinicDesc: 'Ընդհանուր պրակտիկա, լաբորատորիա և մասնագիտացված բաժիններ',
      polyclinic: 'Պոլիկլինիկա',
      polyclinicDesc: 'Բազմաբաժին բժշկական կենտրոն լաբորատորիայով',
      beautyClinic: 'Գեղեցկության կլինիկա',
      beautyClinicDesc: 'Աստետիկա, լազեր, մաշկի խնամք',
  
      massage: 'Մերսման ծառայություն',
      massageDesc: 'Շվեդական, deep tissue, սպորտային մերսում',
  
      dental: 'Ատամնաբուժարան',
      dentalDesc: 'Ստուգում, մաքրում, սպիտակեցում',

      tourOperator: 'Տուր օպերատոր',
      tourOperatorDesc: 'Օրական տուրեր, բազմօրյա արշավներ և անհատական փորձ',
  
      other: 'Այլ ծառայողական բիզնես',
      otherDesc: 'Ընդհանուր ամրագրումներ և խորհրդատվություններ',
    },
  
    playbooks: {
      salon: 'Սալոնի playbook',
      salonDesc: 'Մազեր, եղունգներ և գեղեցկություն՝ աշխատանքային և շաբաթ օրերի գրաֆիկով',
  
      clinic: 'Կլինիկայի playbook',
      clinicDesc:
        'Ընդհանուր պրակտիկա, լաբորատորիա և կարդիոլոգիա՝ աշխատանքային և շաբաթ օրերի ժամերով',
      clinicSampleTitle: 'Այս playbook-ի բաժինները',
      clinicType: {
        consultation: 'Խորհրդատվություն',
        lab_test: 'Լաբորատոր թեստ',
        procedure: 'Գործընթաց',
      },

      tour: 'Տուր օպերատորի playbook',
      tourDesc: 'Օրական և բազմօրյա տուրեր՝ 08:00–18:00 աշխատանքային ժամերով',
      tourSampleTitle: 'Նմուշ տուրեր այս playbook-ում',
      tourDurationDay: 'Ամբողջ օր',
      tourDurationDays: '{count} օր',
      tourTypeBadge: 'Տուր',
  
      previewTitle: 'Ձեր ոլորտային playbook-ը',
      templateCount: '{count} ժամանակացույցի template',
      servicesIncluded: '{count} մեկնարկային ծառայություն',
  
      applyFullPlaybook: 'Կիրառել ամբողջ playbook (ծառայություններ + ժամանակացույց)',
      playbookFailed: 'Չհաջողվեց կիրառել playbook-ը',
  
      periodUnavailable: 'Անհասանելի',
      periodService: 'Բաց է ամրագրումների համար',
    },
  },
  marketingAutomation: {
    title: 'Մարքեթինգային ավտոմատացում',
    subtitle:
      'Վերակապեք ոչ ակտիվ հաճախորդներին և կառավարեք այցից հետո կարծիքների հարցումները',
  
    eligibleInactive: 'Ոչ ակտիվ հաճախորդներ (իրավասու)',
    sentLast30Days: 'Վերակապման հաղորդագրություններ (30 օր)',
  
    postVisitTitle: 'Այցից հետո հետևում',
    postVisitReview: 'Ուղարկել կարծիք թողնելու հարցում այցի ավարտից հետո',
  
    reEngagementTitle: 'Վերադարձման (win-back) արշավներ',
    reEngagementHint:
      'Միայն այն հաճախորդների համար, ովքեր տվել են մարքեթինգային համաձայնություն և վերջերս չեն այցելել',
  
    reEngagementEnabled: 'Միացնել ավտոմատ վերակապումը',
  
    inactiveDays: 'Ոչ ակտիվ է (օր)',
    minDaysBetween: 'Նվազագույն օրեր հաղորդագրությունների միջև',
  
    channelEmail: 'Email',
    channelSms: 'SMS',
    channelPush: 'Push',
    promoCodeOptional: 'Կամայական promo կոդ',
    loyaltyBonusOptional: 'Կամայական loyalty բոնուս ($)',
  },
  retailPos: {
    title: 'Մանրածախ վաճառք (աթոռի մոտ)',
    subtitle:
      'Ավելացրեք ապրանքներ վաճառքի համար checkout-ի ժամանակ։ Պահեստը նվազում է պահպանելուց հետո',
  
    noProducts:
      'Մանրածախ ապրանքներ չկան։ Սահմանեք վաճառքի գին Operations → Inventory-ում',
  
    inStock: 'պահեստում',
    retailTotal: 'Մանրածախ ապրանքներ',
    grandTotal: 'Ընդհանուր վճար',
  
    saveCart: 'Պահպանել վաճառքի զամբյուղը',
  },
  enterpriseTrust: {
    tabLabel: 'Enterprise վստահություն',
    title: 'Enterprise վստահություն և համապատասխանություն',
    subtitle:
      'DPA և գաղտնիության քաղաքականության ձևանմուշներ EU հաճախորդների համար, ինչպես նաև անվտանգության ընդհանուր նկարագիր',
  
    settingsTitle: 'Իրավական պրոֆիլ',
    legalName: 'Իրավաբանական անվանում',
    country: 'Երկիր',
    registeredAddress: 'Գրանցված հասցե',
    dpoEmail: 'DPO / գաղտնիության email',
    euRepresentative: 'EU ներկայացուցիչ (ըստ ցանկության)',
    customNotes: 'Լրացուցիչ DPA պայմաններ (ըստ ցանկության)',
  
    documentsTitle: 'Փաստաթղթերի ձևանմուշներ',
    privacyPolicy: 'Գաղտնիության քաղաքականություն',
    downloadMarkdown: 'Ներբեռնել Markdown',
    lastUpdated: 'Վերջին թարմացում',
  },
  strategyEval: {
    tabLabel: 'Strategy գնահատում',
    title: 'Strategy և compliance գնահատում',
    subtitle:
      'Գնահատեք HIPAA BAA պատրաստվածությունը բժշկական դիրքավորման համար և marketplace vs software-only ռազմավարությունը՝ նախքան կառուցելը',
  
    summaryTitle: 'Որոշման ամփոփում',
    medicalVertical: 'Բժշկական / կլինիկական ուղղություն',
    marketplacePositioning: 'Discovery և marketplace',
  
    notes: 'Նշումներ (ըստ ցանկության)',
    saveHipaa: 'Պահպանել HIPAA գնահատումը',
    saveMarketplace: 'Պահպանել marketplace գնահատումը',
  
    hipaa: {
      title: 'HIPAA BAA պատրաստվածություն (gap-5.6)',
      subtitle:
        'Գնահատեք արդյոք պետք է անցնել բժշկական/կլինիկական դիրքավորման՝ HIPAA Business Associate Agreement-ներով',
  
      notStarted: 'Դեռ չի գնահատվել',
      readiness: 'Տեխնիկական և օպերացիոն պատրաստվածություն',
      blockers: 'Հայտնաբերված խնդիրներ',
  
      decisionLabel: 'Գրանցել որոշում',
      decisionPending: 'Սպասում է — նախ գործարկեք գնահատումը',
  
      answer: { yes: 'Այո', no: 'Ոչ', unsure: 'Անորոշ' },
  
      decision: {
        defer: 'Հետաձգել բժշկական դիրքավորումը',
        wellness_only: 'Միայն wellness / գեղեցկություն (առանց PHI)',
        pursue_baa: 'Շարժվել դեպի HIPAA BAA',
      },
  
      recDefer:
        'Հետաձգեք բժշկական դիրքավորումը մինչև խնդիրները լուծվեն և պատրաստվածությունը բարձրանա',
  
      recWellnessOnly:
        'Մնացեք wellness/beauty ուղղության մեջ — PHI workflows պետք չեն',
  
      recPursueBaa:
        'Պատրաստվածությունը բավարար է HIPAA BAA և բժշկական դիրքավորման համար',
  
      questions: {
        handles_phi: 'Պահո՞ւմ կամ մշակում եք պաշտպանված առողջական տվյալներ (PHI)',
        us_patients: 'Ծառայում եք ԱՄՆ-ի հիվանդներին',
        diagnosis_documentation: 'Գրանցո՞ւմ եք ախտորոշումներ կամ բուժման պլաններ',
        baa_with_vendors:
          'Ունե՞ք ստորագրված BAA բոլոր ենթամատակարարների հետ, որոնք աշխատում են PHI-ի հետ',
        privacy_officer: 'Նշանակե՞լ եք գաղտնիության/անվտանգության պատասխանատու',
        encryption_at_rest: 'PHI-ն գաղտնագրվա՞ծ է պահեստում (at rest)',
        encryption_in_transit: 'PHI-ն գաղտնագրվա՞ծ է փոխանցման ժամանակ (TLS)',
        access_audit_logs: 'Կա՞ն PHI համակարգերի access audit logs',
        mfa_admin_access: 'Կիրառվա՞ծ է MFA admin հասանելիության համար',
        staff_hipaa_training: 'Անձնակազմը անցե՞լ է HIPAA ուսուցում',
        incident_response_plan: 'Կա՞ արձագանքման/խախտման plan',
        minimum_necessary_policy:
          'Կիրառվո՞ւմ է նվազագույն անհրաժեշտ հասանելիության սկզբունքը',
      },
    },
  
    marketplace: {
      title: 'Marketplace դիրքավորում (gap-1.6)',
      subtitle:
        'Համեմատեք software-only SaaS, partner directory և full marketplace մոդելները՝ նախքան client discovery ներդրումը',
  
      notStarted: 'Դեռ չի գնահատվել',
      scoresTitle: 'Կշռված համապատասխանության միավորներ',
  
      directoryOptIn:
        'Ընտրել ապագա partner directory-ում ներառվել (ոչ պարտադիր)',
  
      decisionLabel: 'Գրանցել դիրքավորման որոշում',
      decisionPending: 'Սպասում է — նախ գործարկեք գնահատումը',
  
      decision: {
        software_only: 'Software-only (tenant booking links)',
        partner_directory: 'Partner directory (opt-in ցուցակներ)',
        full_marketplace: 'Full marketplace (կենտրոնացված discovery)',
        undecided: 'Անորոշ — միավորները շատ մոտ են',
      },
  
      recSoftwareOnly:
        'Software-only մոդելը լավագույնն է — կենտրոնացեք արագ ներդրման և tenant autonomy-ի վրա',
  
      recPartnerDirectory:
        'Partner directory մոդելը լավագույնն է — հավասարակշռված SEO առանց ամբողջական marketplace բարդության',
  
      recFullMarketplace:
        'Full marketplace մոդելը լավագույնն է — կենտրոնացեք նոր հաճախորդների ձեռքբերման վրա',
  
      recUndecided:
        'Միավորները մոտ են — հավաքեք լրացուցիչ տվյալներ որոշում կայացնելու համար',
  
      option: {
        software_only: 'Software-only',
        partner_directory: 'Partner directory',
        full_marketplace: 'Full marketplace',
      },
  
      criteria: {
        tenant_autonomy: 'Tenant-ի բրենդային անկախություն',
        new_client_acquisition: 'Նոր հաճախորդների ներգրավում',
        implementation_speed: 'Իրականացման արագություն',
        brand_control: 'Platform բրենդի վերահսկում',
        seo_discoverability: 'SEO / հայտնաբերելիություն',
        operational_complexity: 'Ցածր օպերացիոն բարդություն',
        marketplace_fees_tolerance: 'Marketplace վճարների հանդուրժողականություն',
        support_burden: 'Ցածր support բեռ',
      },
    },
  },
  schedule: {
    title: 'Ժամանակացույց',
    templates: 'Շաբլոններ',
    applyTemplate: 'Կիրառել շաբլոն',
    createTemplate: 'Ստեղծել շաբլոն',
    editTemplate: 'Խմբագրել շաբլոնը',
    saveTemplate: 'Պահպանել շաբլոնը',
    saveChanges: 'Պահպանել փոփոխությունները',
    saving: 'Պահպանվում է…',
    saveFailed: 'Չհաջողվեց պահպանել շաբլոնը',
  
    editTemplateNote:
      'Փոփոխությունները կկիրառվեն ապագա կիրառումների վրա։ Վերակիրառեք շաբլոնը՝ արդեն գոյություն ունեցող աշխատակիցների գրաֆիկները թարմացնելու համար',
  
    serviceBlock: 'Ծառայության բլոկ',
    blocked: 'Արգելափակված',
    unavailable: 'Անհասանելի',
  
    blockTabCreate: 'Ստեղծել բլոկ',
    blockTabActive: 'Ակտիվ բլոկներ',
  
    createBlockSchedule: 'Ստեղծել բլոկային ժամանակացույց',
    createBlockScheduleHint:
      'Արգելափակեք ժամանակը գոյություն ունեցող գրաֆիկների վրա։ Ծառայության ժամերը ավտոմատ բաժանվում են (օր. 14:00–18:00-ի մեջ 15:00–16:00 բլոկը բաժանում է 14:00–15:00 և 16:00–18:00)',
  
    activeBlockSchedules: 'Ակտիվ բլոկային ժամանակացույցներ',
    searchBlockByProvider: 'Որոնել ըստ մասնագետի անվան',
    noBlockSchedules: 'Դեռ բլոկային ժամանակացույցներ չկան',
    noBlockSchedulesMatch: 'Որոնմանը համապատասխան բլոկներ չկան',
    blockRepetitive: 'Կրկնվող',
    blockOneTime: 'Միանվագ',
    blockFromDate: 'Սկզբի ամսաթիվ',
    blockToDate: 'Ավարտի ամսաթիվ',
    blockStartTime: 'Բլոկի սկիզբ',
    blockEndTime: 'Բլոկի ավարտ',
    applyBlockSchedule: 'Կիրառել բլոկային ժամանակացույց',
    blockApplying: 'Բլոկը կիրառվում է…',
    blockCreateFailed: 'Չհաջողվեց ստեղծել բլոկային ժամանակացույց',
    blockSaveFailed: 'Չհաջողվեց պահպանել բլոկային ժամանակացույցը',
    blockAppliedSuccess: 'Բլոկային ժամանակացույցը կիրառվել է',
    removeBlockSchedule: 'Հեռացնել բլոկային ժամանակացույցը',
    blockSummaryDaily: 'ամեն օր',
    subtitle: 'Ստեղծեք օրվա գրաֆիկներ, կառավարեք շաբլոններ կամ արգելափակեք ժամանակը',
    aiInsightsTitle: 'Ժամանակացույցի հնարավորություններ',
    tabCreate: 'Ստեղծել գրաֆիկ',
    tabTemplates: 'Գրաֆիկի շաբլոններ',
    tabBlock: 'Արգելափակման գրաֆիկ',
    periodAvailable: 'Հասանելի',
    periodUnavailable: 'Անհասանելի',
    timePeriods: 'Ժամանակահատվածներ',
    periodNumber: 'ժամանակահատված {n}',
    overlapWarning:
      'Այս ժամանակահատվածը հատվում է մյուսի հետ։ Ժամանակահատվածները պետք է լինեն անկախ։',
    placeholderShiftLabel: 'օր. Առավոտյան հերթափոխ',
    noServicesHint: 'Ծառայություններ չեն գտնվել։ Նախ ավելացրեք ծառայություններ։',
    maxAppointmentsPerSlot: 'Առավելագույն ամրագրումներ մեկ ժամանակահատվածում',
    activeDays: 'Ակտիվ օրեր',
    createFailed: 'Չհաջողվեց ստեղծել գրաֆիկը',
    createdTitle: 'Գրաֆիկը ստեղծվել է',
    slotsGeneratedOne: '{count} ժամանակահատված ստեղծվել է {date} համար',
    slotsGeneratedMany: '{count} ժամանակահատված ստեղծվել է {date} համար',
    createAnother: 'Ստեղծել ևս մեկ',
    createForDayTitle: 'Ստեղծել գրաֆիկ մեկ օրվա համար',
    createForDayDesc:
      'Սահմանեք ժամանակահատվածներ աշխատակցի համար կոնկրետ ամսաթվի վրա՝ առանց շաբլոնի։',
    overlapSaveTitle: 'Պահպանելուց առաջ շտկեք հատող ժամանակահատվածները',
    createSchedule: 'Ստեղծել գրաֆիկ',
    overlapFixFirst: 'Նախ շտկեք հատող ժամանակահատվածները',
    searchTemplates: 'Որոնել շաբլոններ…',
    deleteSelected: 'Ջնջել ({count})',
    templateName: 'Շաբլոնի անուն',
    placeholderTemplateName: 'օր. Առավոտյան գրաֆիկ',
    templatePeriodsHelp:
      'Սահմանեք ժամանակահատվածները ներքևում։ Կիրառելիս ժամանակահատվածները ստեղծվում են միայն համապատասխան օրերին։',
    applyTemplateTitle: 'Կիրառել շաբլոն',
    applyOnDays: 'Կիրառել օրերին',
    applySuccess: 'Շաբլոնը կիրառվել է — ստեղծվել է {slots} ժամանակահատված',
    loadingTemplates: 'Շաբլոնները բեռնվում են…',
    templatesEmpty: 'Գրաֆիկի շաբլոններ դեռ չկան',
    templatesNoMatch: '«{search}»-ին համապատասխան շաբլոններ չկան',
    templatesEmptyHint:
      'Ստեղծեք շաբլոն ժամանակահատվածներով, ապա կիրառեք աշխատակցի վրա ամսաթվերի միջակայքում',
    periodsCount: '{count} ժամանակահատված',
    daysCount: '{count} օր',
  },
  calendarPage: {
    title: 'Մասնագետի օրացույց',
    subtitle: 'Տեսեք մասնագետի շաբաթը՝ գունավոր ծառայություններով և ազատ ժամերով',
    aiInsightsTitle: 'Օրացույցի հնարավորություններ',
    selectProvider: 'Ընտրեք մասնագետ…',
    selectProviderEmpty: 'Ընտրեք մասնագետ՝ օրացույցը տեսնելու համար',
    noSchedule: 'Գրաֆիկ չկա',
    slotDetails: 'Ժամանակահատվածի մանրամասներ',
    slotDate: 'Ամսաթիվ',
    slotTime: 'Ժամ',
    slotStatus: 'Կարգավիճակ',
    slotService: 'Ծառայություն',
    slotLabel: 'Պիտակ',
    slotCapacity: 'Տարողություն',
    slotProvider: 'Մասնագետ',
    bookedCount: '{count} ամրագրված',
    statusAvailable: 'Հասանելի',
    statusBooked: 'Ամրագրված',
    statusBlocked: 'Արգելափակված',
    statusUnavailable: 'Անհասանելի',
    tourDepartures: 'Տուրեր',
    tourDetails: 'Տուրի ամրագրում',
    tourDates: 'Ամսաթվեր',
    tourPax: 'Խմբի չափ',
    tourCustomer: 'Հաճախորդ',
    tourNotes: 'Հատուկ պահանջներ',
    tourSpanPax: '{count} մարդ',
  },
  business: {
    title: 'Բիզնեսի պրոֆիլ',
    subtitle: 'Կառավարեք, թե ինչպես է ձեր բիզնեսը երևում հանրային ամրագրման էջում',
    viewPublicPage: 'Բացել հանրային էջը',
    logo: 'Լոգո',
    uploadingLogo: 'Վերբեռնվում է…',
    uploadLogo: 'Վերբեռնել լոգոն',
    removeLogo: 'Հեռացնել լոգոն',
    tagline: 'Կարգախոս',
    primaryColor: 'Հիմնական գույն',
    socialLinks: 'Սոցիալական հղումներ',
    website: 'Կայք',
    instagram: 'Instagram',
    facebook: 'Facebook',
    x: 'X (Twitter)',
    tiktok: 'TikTok',
    linkedin: 'LinkedIn',
    youtube: 'YouTube',
    mapEmbed: 'Google Maps ներդիր',
    mapEmbedHelp: 'Տեղադրեք iframe կոդը Google Maps → Կիսվել → Ներդիր քարտեզ',
    publicLanguage: 'Հանրային էջի լեզու',
    saveProfile: 'Պահպանել պրոֆիլը',
    profileSaved: 'Պրոֆիլը պահպանվել է',
    branding: 'Բրենդինգ',
    businessName: 'Բիզնեսի անուն',
    contact: 'Կոնտակտ',
    socialHint: 'Ցուցադրվում է հանրային պրոֆիլում և ամրագրման էջում',
    mapsTitle: 'Google Maps',
    mapsEmbedInstructions: 'Տեղադրեք iframe կոդը Google Maps → Կիսվել → Ներդիր քարտեզ',
    saveFailed: 'Չհաջողվեց պահպանել պրոֆիլը',
    saveSuccess: 'Պրոֆիլը հաջողությամբ պահպանվել է',
    placeholderTagline: 'Կարճ կարգախոս ձեր բիզնեսի համար',
    placeholderDescription: 'Նկարագրեք բիզնեսը հաճախորդների համար…',
    internalName: 'Վահանակի անուն',
    internalNameHint:
      'Օգտագործվում է ադմին վահանակում և նամակներում։ Հաճախորդին երևացող անունը սահմանվում է ստորև՝ ըստ լեզվի։',
    publicContentTitle: 'Հանրային ամրագրման բովանդակություն ըստ լեզվի',
    publicContentSectionHint:
      'Նույն սկուտչը, ինչ ծառայության կատեգորիաներում՝ լրացրեք, թե ինչպես է բիզնեսը երևում հանրային ամրագրման էջում յուրաքանչյուր լեզվով։',
    publicContentHint:
      'Ցուցադրվող անուն, կարգախոս, նկարագրություն և հասցե՝ այդ լեզվով հաճախորդների համար։',
    publicContentLocaleEn: 'Անգլերեն',
    publicContentLocaleHy: 'Հայերեն',
    publicContentLocaleRu: 'Ռուսերեն',
    publicContentName: 'Ցուցադրվող անուն',
    publicContentOptional: 'Ընտրովի',
  },
  billing: {
    title: 'Վճարումներ',
    subtitle: 'Platform բաժանորդագրություն և Stripe Connect՝ հաճախորդների վճարումների համար',
  
    currentPlan: 'Ընթացիկ պլան',
    subscribe: 'Բաժանորդագրվել',
    manage: 'Կառավարել բաժանորդագրությունը',
  
    clientPayments: 'Հաճախորդների ամրագրումների վճարումներ',
    clientPaymentsDescription:
      'Կապեք ձեր tenant Stripe հաշիվը (Armenia, EU, US, UK, UAE և այլն)։ Ամրագրման վճարները գնում են tenant-ին, իսկ platform-ի բաժանորդագրությունը մնում է ձեր UAE Stripe հաշվին',
  
    stripeConnectOAuth: 'Կապել Stripe հաշիվը',
    stripeConnectContinueOAuth: 'Վերակապել Stripe հաշիվը',
  
    stripeConnectExpress: 'Ստեղծել managed Express հաշիվ',
    stripeConnectExpressCountry: 'Բիզնեսի երկիր (ISO կոդ)',
  
    stripeConnectExpressHint:
      'Նախընտրելի է OAuth՝ միջազգային tenants-ի համար։ Express-ը ստեղծում է platform-managed հաշիվ, եթե Stripe-ը թույլ է տալիս այդ երկրում',
  
    stripeConnectAccountId: 'Stripe Connect հաշվի ID',
    stripeConnectPlaceholder: 'acct_...',
  
    stripeConnectStart: 'Կապել Stripe-ով',
    stripeConnectContinue: 'Շարունակել կարգավորումը',
    stripeConnectManage: 'Բացել Stripe Dashboard',
    stripeConnectRefresh: 'Թարմացնել կարգավիճակը',
  
    stripeConnectSave: 'Պահպանել Stripe կապը',
    stripeConnectSaveManual: 'Պահպանել account ID-ն',
  
    stripeConnectSaved: 'Stripe հաշիվը կապված է',
    stripeConnectSynced: 'Stripe կապը թարմացված է',
  
    stripeConnectDisconnect: 'Անջատել',
  
    stripeConnectConfigured: 'Կապված է — վճարումները միացված են',
    stripeConnectPending: 'Կարգավորումը սկսված է — ավարտեք Stripe-ում',
  
    stripeConnectNotConfigured:
      'Կապված չէ — օնլայն վճարումները անջատված կմնան',
  
    stripeConnectRequired: 'Պարտադիր է account ID-ն',
  
    stripeConnectShowAdvanced: 'Ընդլայնված՝ ձեռքով մուտքագրել account ID',
    stripeConnectHideAdvanced: 'Թաքցնել ընդլայնվածը',
  
    stripeDisplayName: 'Հաշիվ',
  
    payAtVenueConnectStripeFirst:
      'Կապեք Stripe-ը՝ տեղում վճարումը և համապատասխան calendar տարբերակները միացնելու համար',
  
    billingIntervalMonthly: 'Ամսական',
    billingIntervalAnnual: 'Տարեկան',
  
    annualSaveBadge: 'Խնայեք ~20%',
    perMonth: '/ ամիս',
    perYear: '/ տարի',
    billedAnnually: 'Վճարվում է տարեկան մեկ անգամ',
    equivalentMonthly: '≈ {amount}/ամիս',
  
    upgradeTitle: 'Թարմացրեք ձեր պլանը',
    upgradeDefaultMessage:
      'Այս ֆունկցիան պահանջում է ավելի բարձր պլան։ Թարմացրեք Billing-ում',
  
    upgradeCta: 'Դիտել պլանները',
  
    upgradeSeatsHint: 'Starter-ը ներառում է մինչև 5 մասնագետ',
    upgradeAiHint: 'Starter-ը ներառում է ամսական 150 AI հրաման',
  
    upgradeFeatureStripeConnect:
      'Միացրեք Stripe և ընդունեք օնլայն վճարումներ Starter պլանով',
  
    upgradeFeaturePromoCodes:
      'Ստեղծեք promo կոդեր Starter բաժանորդագրությամբ',
  
    upgradeFeatureLoyalty:
      'Loyalty համակարգը հասանելի է Growth և բարձր պլաններում (շուտով)',
  
    upgradeFeatureMemberships:
      'Անդամակցության պլանները հասանելի են Growth և բարձր պլաններում (շուտով)',
  
    upgradeFeatureGiftCards:
      'Gift card-երը հասանելի են Business և բարձր պլաններում (շուտով)',
  
    currentTier: 'Պլանի մակարդակ',
    usageSeats: 'Մասնագետների քանակ',
    usageAi: 'AI հրամաններ այս ամիս',
  
    aiUsageNearLimit: 'Դուք մոտենում եք ամսական AI սահմանաչափին',
    statusActive: 'Ակտիվ',
    statusTrial: 'Փորձարկում',
    statusPastDue: 'Ժամկետանց',
    statusCanceled: 'Չեղարկված',
    statusNotSubscribed: 'Բաժանորդագրված չէ',
    checkoutSuccess: 'Վճարումը հաջող էր։ Բաժանորդագրությունը թարմացվում է։',
    checkoutCanceled: 'Վճարումը չեղարկվել է։ Գանձում չի կատարվել։',
    currentPlanSection: 'Ընթացիկ պլան',
    planButtonCurrent: 'Ընթացիկ պլան',
    checkoutFailed: 'Չհաջողվեց սկսել վճարումը',
    testModeHint: 'Stripe-ը փորձարկման ռեժիմում է — փորձեք 4242 4242 4242 4242 քարտը։',
  },
  ai: {
    commandPlaceholder: 'Հարցրեք AI-ին կառավարել ամրագրումները, ժամանակացույցը կամ օպերացիաները…',
    thinking: 'Մտածում…',
    clarifySubmit: 'Շարունակել',
    clarifyWizardTitle: 'Լրացրեք բացակայող տվյալները',
    clarifyWhichProvider: 'Ո՞ր մասնագետի մասին է խոսքը',
    clarifyWhichService: 'Ո՞ր ծառայության մասին է խոսքը',
    clarifyWhichCustomer: 'Ո՞ր հաճախորդի մասին է խոսքը',
    clarifyPickFromOptions: 'Ընտրեք տարբերակներից մեկը — անունը կրկին մուտքագրելու կարիք չկա։',
    availableProvidersTitle: 'Հասանելի մասնագետներ',
    bookProvider: 'Ամրագրել',
    assistantClarifyTry: 'Փորձեք՝',
    suggestionRun: 'Գործարկել',
    suggestionEdit: 'Խմբագրել',
    undoPromptBanner: 'Հրամանը կատարվեց։ Կարող եք հետարկել վերջին փոփոխությունը։',
    undoNow: 'Հետարկել հիմա',
    postExecAutoReverted: 'Մենք ավտոմատ հետարկեցինք փոփոխությունը։',
    riskLevelLabel: '{level} ռիսկ',
    wizardTitle: 'Ուղեցված պլան',
    wizardStepOf: 'Քայլ {current}/{total}',
    wizardNext: 'Հաջորդ քայլի նախադիտում',
    wizardApproveAll: 'Հաստատել բոլոր քայլերը',
    macrosTitle: 'Պահված հրամաններ',
    macrosEmpty: 'Դեռ պահված հրամաններ չկան։ Ավելացրեք AI Ops-ում։',
    macroAddHint: 'Պահեք հաճախակի հրամանը որպես մակրո։',
    macroNamePlaceholder: 'Անուն',
    macroPromptPlaceholder: 'Բնական լեզվի հրաման…',
    macroSave: 'Պահել մակրոն',
    macroDelete: 'Ջնջել',
    weeklyReportTitle: 'Շաբաթական գործառնական հաշվետվություն',
    weeklyReportLoading: 'Հաշվետվության պատրաստում…',
    weeklyReportRefresh: 'Թարմացնել',
    weeklyReportFallback: 'Կանոնային ամփոփում (AI-ն հասանելի չէ)։',
    weeklyReportActionGaps: 'Լրացնել բացերը այս շաբաթ',
    notificationsTitle: 'AI ազդարարումներ',
    notificationsEmpty: 'Ազդարարումներ չկան։',
    notificationTapResolve: 'Հպեք լուծելու համար',
    executionTimeline: 'Կատարման քայլեր',
    retryStep: 'Կրկին փորձել',
    commandBarDragTitle: 'AI հրաման (տեղափոխելու համար քաշեք)',
    briefingPreparing: 'Պատրաստվում է առավոտյան ամփոփում…',
    briefingTitle: 'Առավոտյան ամփոփում · {date}',
    briefingSummary: '{bookings} ամրագրում · {utilization}% բեռնվածություն',
    briefingConflicts: ' · {count} կոնֆլիկտ',
    briefingStatBookings: 'Ամրագրումներ',
    briefingStatUtilization: 'Բեռնվածություն',
    briefingStatCancellations: 'Չեղարկումներ',
    briefingStatUnpaidDone: 'Չվճարված ավարտված',
    briefingSuggestedActions: 'Առաջարկված գործողություններ',
    calendarSelectionLabel: 'Ընտրություն · {employeeName}',
    calendarClearSelection: 'Մաքրել ընտրությունը',
    calendarBlock: 'Արգելափակել',
    calendarFillGaps: 'Լրացնել բացերը',
    calendarApplyTemplate: 'Կիրառել շաբլոն',
    calendarPromptBlock: 'Արգելափակել {employeeName} {date} {timeFrom}–{timeTo}',
    calendarPromptFill:
      'Լրացնել բացերը {employeeName} համար {date} {timeFrom}–{timeTo} միջակայքում',
    calendarPromptApply: 'Կիրառել շաբաթվա շաբլոն {employeeName} համար {date}',
    autopilotLoading: 'Բեռնվում են AI կարգավորումները…',
    autopilotTitle: 'Autopilot և playbooks',
    autopilotEnable: 'Միացնել autopilot (ժամանակացույցային AI կանոններ, UTC cron)',
    autopilotLastRun: 'Վերջին գործարկում՝ {at}',
    autopilotPlaybooks: 'Playbooks (բնական լեզվի տրիգերներ)',
    autopilotSave: 'Պահպանել autopilot կարգավորումները',
    auditTitle: 'AI աուդիտի մատյան',
    auditEmpty: 'Դեռևս AI փոփոխություններ չեն գրանցվել։',
    auditApprovedBy: 'Հաստատվել է օգտատիրոջ {id}…',
    planPreviewTitle: 'Պլանի նախադիտում',
    planPolicy: 'Քաղաքականություն՝ {decision} · ռիսկ {risk}',
    conflictWorkspaceTitle: 'Կոնֆլիկտների լուծման տարածք',
    providerFallback: 'Մատակարար',
    overlapMinutes: ' · {minutes} ր օվերլապ',
    applying: 'Կատարվում է…',
    applySuggestedFix: 'Կիրառել առաջարկված ուղղումը',
    recoveryTitle: 'Չեղարկվածների վերականգնում',
    rebooking: 'Վերամրագրում…',
    rebookAll: 'Վերամրագրել բոլորը',
    freedSlots: 'Ազատված սլոտներ',
    recoveryCandidates: 'Սպասացուցակ / վերամրագրման թեկնածուներ',
    appointmentFallback: 'Ամրագրում',
    walkIn: 'Անհրավեր',
    recoveryNoMatch: 'Ավտոմատ համընկնում չկա — պետք է ձեռքով կապ',
    recoveryCustomerScore: '{name} ({source}, միավոր {score})',
    send: 'Ուղարկել',
    examples: 'Փորձեք հարցնել՝',
  
    opsTitle: 'AI Operations',
  
    undoLatest: 'Չեղարկել վերջին հրամանը',
    undoLatestHint: 'Հետարկել AI-ի վերջին կատարված հրամանը',
    undoLatestNone: 'Հետարկման համար հրաման չկա',
    undoLatestConfirm: 'Հետարկել՝ {intent}',
    tasksSection: 'Գործակալի առաջադրանքներ',
    loadingTasks: 'Առաջադրանքները բեռնվում են…',
    tasksEmptyTitle: 'Դեռ առաջադրանքներ չկան',
    tasksEmptyBody:
      'Գործարկեք AI հրաման dashboard-ից կամ ամրագրման էջերից՝ այստեղ տեսնելու համար։',
    taskMeta: '{steps} քայլ · {risk} ռիսկ',
    approve: 'Հաստատել',
    hide: 'Թաքցնել',
    preview: 'Նախադիտում',
    undoing: 'Հետարկվում է…',
    undoSuccess: 'Վերջին հրամանը հետարկված է',
    undoFailed: 'Չհաջողվեց հետարկել հրամանը',
  
    unavailable: 'AI օգնականը հասանելի չէ',
  
    voiceStart: 'Սկսել ձայնային մուտք',
    voiceStop: 'Դադարեցնել լսումը',
  
    voiceUnsupported:
      'Ձայնային մուտքը չի աջակցվում այս բրաուզերում։ Օգտագործեք Chrome կամ Safari',
  
    voiceDenied:
      'Միկրոֆոնի հասանելիությունը մերժվել է։ Թույլատրեք այն բրաուզերի կարգավորումներում',
  
    voiceNoSpeech: 'Խոսք չի հայտնաբերվել։ Փորձեք կրկին',
    voiceError: 'Ձայնային մուտքը ձախողվեց։ Փորձեք կրկին',
  
    speakReply: 'Լսել',
    feedbackPrompt: 'Օգտակար եղավ?',
    feedbackUp: 'Այո',
    feedbackDown: 'Ոչ',
    feedbackThanks: 'Շնորհակալություն — դա օգնում է բարելավել օգնականին։',
    feedbackReasonSkip: 'Բաց թողնել',
    'feedbackReason.wrong_action': 'Սխալ գործողություն',
    'feedbackReason.wrong_date': 'Սխալ ամսաթիվ',
    'feedbackReason.wrong_person': 'Սխալ անձ',
    'feedbackReason.wrong_service': 'Սխալ ծառայություն',
    'feedbackReason.did_not_understand': 'Չհասկացավ',
    voiceHint: 'Սեղմեք միկրոֆոնը՝ սկսելու համար, կրկին սեղմեք՝ ավարտելու համար, Enter՝ ուղարկելու համար',
    approvePlanFailed: 'Չհաջողվեց հաստատել պլանը',
    confirmActionFailed: 'Չհաջողվեց հաստատել գործողությունը',
    assistantTitle: 'Orchestrix AI',
    emptyHint:
      'Նկարագրեք գործառնական մտադիրությունը — AI-ն պլանավորում է, քաղաքականությունը ստուգում, աշխատանքները կատարվում են',
    inputPlaceholderExample: 'օր. Չեղարկել {provider}-ի բոլոր ամրագրումները վաղը…',
    fallbackProvider: 'ձեր մատակարարը',
    fallbackService: 'ծառայություն',
    showDetails: 'Ցույց տալ մանրամասները',
    hideDetails: 'Թաքցնել մանրամասները',
    confirmExecute: 'Հաստատել և կատարել',
    approveExecutePlan: 'Հաստատել և կատարել պլանը',
    executing: 'Կատարվում է…',
    needsInfo: 'պետք է լրացուցիչ տեղեկություն',
    escToClose: 'Esc՝ փակելու համար',
    closeAssistant: 'Փակել AI օգնականը',
    panelTitle: 'Orchestrix առաջարկներ',
    quickCommands: 'Արագ հրամաններ',
    runWithAi: 'Գործարկել Orchestrix AI-ով',
    opportunitiesTitle: 'AI-ն հայտնաբերել է հնարավորություններ',
    opportunitiesOnPage: 'AI հնարավորություններ այս էջում',
    groupLabels: {
      bookingsOverview: 'Այսօր և ընդհանուր',
      bookingsCancelled: 'Չեղարկված և տեսանելիություն',
      bookingsActions: 'Ամրագրել, չեղարկել, թարմացնել',
      calendarAvailability: 'Հասանելիություն և ժամանակացույց',
      calendarOptimize: 'Բացեր և կոնֆլիկտներ',
      scheduleTemplates: 'Շաբլոններ և կարգավորում',
      scheduleBlocks: 'Բլոկներ և բացեր',
      customersRetention: 'Պահպանում և վերադարձ',
      customersSegments: 'Խմբեր և վարկանիշ',
      reportsInsights: 'Բեռնվածություն և եկամուտ',
      reportsRankings: 'Լավագույն ցուցանիշներ',
    },
    prompts: {
      weekdayTemplateAll: 'Կիրառել շաբաթվա շաբլոնը բոլոր մատակարարների համար այս շաբաթ',
      blockLunchWeek: 'Արգելափակել 12:00–13:00 ընտրովի ճաշը բոլորի համար երկ–ուրբ',
      fillGapsProviderWeek: 'Լրացնել 9–19:00 բացերը {provider}-ի համար այս շաբաթ',
      howManyToday: 'Քանի ամրագրում կա այսօր?',
      weeklyTeamSchedule:
        'Կիրառել ժամանակացույցը բոլոր աշխատակիցների համար այս շաբաթ 9–19:00; 12:00–13:00 դարձնել անհասանելի',
      cancelBookingSlotProvider: 'Չեղարկել այսօրվա ամրագրումը {provider}-ի համար 13:00–14:00',
      bookNearestSlot: 'Ամրագրել {service} այսօր {provider}-ի համար ամենամոտ հասանելի ժամին',
      summarizeUtilizationWeek: 'Ամփոփել բեռնվածությունը այս շաբաթ',
      top10CustomersPaid: 'Գումար վճարած 10 լավագույն հաճախորդները',
      whatsComingUpToday: 'Ի՞նչ է սպասվում այսօր',
      resolveConflictsWeek: 'Լուծել ժամանակացույցի կոնֆլիկտները այս շաբաթ',
      applyWeekdayTemplateProvider: 'Կիրառել շաբաթվա շաբլոնը մատակարարի համար այս շաբաթ',
      listScheduleTemplates: 'Ցուցակագրել ժամանակացույցի շաբլոնները',
      blockLunchAllProviders: 'Արգելափակել 12:00–13:00 ընտրովի ճաշը երկ–ուրբ բոլոր մատակարարների համար',
      fillGapsToday: 'Լրացնել ժամանակացույցի բացերը 9–19:00 այսօր',
      setupWeekScheduleTeam: 'Կարգավորել այս շաբաթի ժամանակացույցը թիմի համար',
      openSlotsThisWeek: 'Ով ունի բաց սլոտներ այս շաբաթ?',
      showProviderScheduleTomorrow: 'Ցույց տալ մատակարարի ժամանակացույցը վաղը',
      availableSlotsTomorrow: 'Ո՞ր սլոտներն են հասանելի վաղը մատակարարի համար',
      fillGapsAllProvidersWeek: 'Լրացնել բացերը բոլոր մատակարարների համար այս շաբաթ',
      conflictsThisWeek: 'Ով ունի կոնֆլիկտներ այս շաբաթ?',
      mostExpensiveToday: 'Ո՞ր ամրագրումն է ամենաթանկը այսօր',
      showAllAppointmentsToday: 'Ցույց տալ բոլոր ամրագրումները այսօր',
      showCancelledToday: 'Ցույց տալ չեղարկված ամրագրումները այսօր',
      hideCancelledToday: 'Թաքցնել բոլոր չեղարկված ամրագրումները օրացույցից այսօր',
      unhideCancelledProviderToday: 'Վերականգնել թաքցված չեղարկված ամրագրումները մատակարարի համար այսօր',
      restoreHiddenWeek: 'Վերականգնել թաքցված ամրագրումները բոլոր մատակարարների համար այս շաբաթ',
      bookServiceTomorrow: 'Ամրագրել ծառայություն վաղը 10:00 հասանելի մատակարարով',
      cancelAllTomorrow: 'Չեղարկել բոլոր ամրագրումները վաղը',
      changeServiceAppointment: 'Փոխել ծառայությունը 14:00 ամրագրման համար այսօր',
      longestAppointmentToday: 'Ո՞րն է ամենաերկար ամրագրումը այսօր',
      noShowsToday: 'Քանի չենք եկել այսօր?',
      summarizeTodayAllProviders: 'Ամփոփել այսօրվա ամրագրումները բոլոր մատակարարների համար',
      busiestProviderToday: 'Ով է ամենաբեռնված մատակարարը այսօր?',
      customerMostNoShows: 'Ո՞ր հաճախորդն ունի ամենաշատ չեկայքները',
      showAtRiskCustomers: 'Ցույց տալ ռիսկային հաճախորդներին',
      showNewCustomers: 'Ցույց տալ նոր հաճախորդներին',
      vipCustomers: 'Ովքեր են մեր VIP հաճախորդները?',
      customersCancelMost: 'Ո՞ր հաճախորդներն են ամենաշատ չեղարկում',
      waitlistCount: 'Քանի հաճախորդ կա սպասացուցակում?',
      showWaitlistCustomers: 'Ցույց տալ սպասացուցակի հաճախորդներին',
      assignServicesProvider: 'Նշանակել մասաժիքի ծառայություններ մատակարարին',
      topProvidersRevenueWeek: 'Գումար վաստակած լավագույն մատակարարները այս շաբաթ',
      listTeamMembers: 'Ցուցակագրել թիմի անդամներին',
      servicesProviderPerforms: 'Ի՞նչ ծառայություններ կարող է մատուցել մատակարարը',
      whoCanDoServiceTomorrow: 'Ով կարող է մատուցել ծառայություն վաղը?',
      whatServicesOffered: 'Ի՞նչ ծառայություններ ենք առաջարկում',
      popularServiceMonth: 'Ամենահայտնի ծառայությունը այս ամիս',
      howMuchService: 'Որքա՞ն է արժե ծառայությունը',
      addServicesBulk: 'Ավելացնել ծառայություններ՝ մասաժ 60 ր 5000, սանրվածք 30 ր 2500',
      whoCanDoService: 'Ով կարող է մատուցել այս ծառայությունը?',
      howManyAppointmentsWeek: 'Քանի ամրագրում այս շաբաթ?',
      revenueMonth: 'Ընդհանուր եկամուտ այս ամիս',
      topServicesRevenueMonth: 'Գումար վաստակած լավագույն ծառայությունները այս ամիս',
      revenueWeek: 'Ընդհանուր եկամուտ այս շաբաթ',
      optimizeNextWeek: 'Օպտիմալացնել հաջորդ շաբաթի ժամանակացույցը',
      fillEmptySlotsWeek: 'Լրացնել բոլոր դատարկ սլոտները այս շաբաթ',
      mostScheduleGaps: 'Ով ունի ամենաշատ բացեր ժամանակացույցում?',
      reassignCancelledWeek: 'Վերանշանակել չեղարկված ամրագրումները այս շաբաթ',
      findNoShowsCustomers: 'Գտնել ամենաշատ չհայտնված հաճախորդներին',
      reengageInactiveCustomers: 'Վերադարձնել անգործուն հաճախորդներին',
      explainUtilizationDrop: 'Բացատրել այս շաբաթվա բեռնվածության նվազումը',
      onboardingSuggestCatalog: 'Առաջարկել մեկնարկային ծառայություններ իմ բիզնեսի տեսակի համար',
      onboardingDescribeServices: 'Ինչ ծառայություններ պետք է առաջարկի նոր սրահը',
      onboardingApplyWeekdayTemplate: 'Կիրառել շաբաթվա շաբլոնը բոլոր մատակարարների համար այս շաբաթ',
      onboardingRefineCatalog: 'Լրացնել մեկնարկային ծառայությունների կատալոգը և գները',
      onboardingAddPopularServices: 'Ավելացնել հայտնի ծառայություններ, որոնք կարող եմ բաց թողնել',
      onboardingAdjustPricing: 'Առաջարկել իրական գներ իմ ծառայությունների համար',
      onboardingBookingLinkTips: 'Ինչպե՞ս կիսվել ամրագրման հղումով հաճախորդների հետ',
      onboardingEmbedBookingWidget: 'Ինչպե՞ս տեղադրել առցանց ամրագրումը կայքում',
    },
  },
  consumerApp: {
    bannerAria: 'Բջջային հավելված',
    bannerTitle: 'Ամրագրեք ավելի արագ OptiSchedule հավելվածով',
    openInApp: 'Բացել հավելվածում',
    downloadIos: 'Ներբեռնել iPhone-ի համար',
    downloadAndroid: 'Ստանալ Google Play-ից',
    dismiss: 'Փակել',
  },
  growthDistribution: {
    appInstallQrTitle: 'Հավելվածի տեղադրման QR կոդ',
    appInstallQrHint:
      'Տպեք կամ ցուցադրեք սրահում։ Սканավորումը բացում է ձեր սրահը հավելվածում՝ տեղադրման attribución-ով։',
    appInstallQrAlt: 'QR կոդ OptiSchedule հավելվածը տեղադրելու համար',
    appInstallLinkLabel: 'Attribución-ով հավելվածի հղում',
    appInstallQrDownload: 'Ներբեռնել QR (PNG)',
  },
  errors: {
    requestFailed: 'Հարցումը ձախողվեց',
    loginFailed: 'Մուտքը ձախողվեց',
    registrationFailed: 'Գրանցումը ձախողվեց',
    saveFailed: 'Պահպանումը ձախողվեց',
    loadFailed: 'Չհաջողվեց բեռնել տվյալները',
    uploadImageFailed: 'Չհաջողվեց վերբեռնել լուսանկարը',
    uploadLogoFailed: 'Չհաջողվեց վերբեռնել լոգոն',
    invitationNotFound: 'Հրավերը չի գտնվել',
    zendeskSaveFailed: 'Չհաջողվեց պահպանել Zendesk կարգավորումները',
  },
  settings: {
    title: 'Կարգավորումներ',
    subtitle: 'Կառավարեք ձեր հաշիվը և հավելվածի նախապատվությունները',
  
    account: 'Հաշիվ',
    preferences: 'Նախապատվություններ',
  
    themeSection: 'Տեսք',
    themeDescription: 'Ընտրեք բաց կամ մուգ ռեժիմ dashboard-ի համար',
    themeLight: 'Բաց',
    themeDark: 'Մուգ',
  
    appearance: 'Տեսք',
  
    notificationsSection: 'Ծանուցումներ',
    notificationsDescription:
      'Email և WhatsApp հիշեցումներ՝ ամրագրումների հաստատման և առաջիկա այցերի համար',
  
    emailReminders: 'Email հիշեցումներ',
    smsReminders: 'SMS հիշեցումներ',
  
    confirmationEmail: 'Հաստատման email',
    confirmationWhatsapp: 'Հաստատման WhatsApp',
  
    reminderImmediateWhatsapp:
      'Անմիջական WhatsApp հիշեցում (թեստ — ուղարկվում է ամրագրման պահին)',
  
    reminder24hEmail: '24ժ հիշեցում (email)',
    reminder1hEmail: '1ժ հիշեցում (email)',
  
    reminder24hWhatsapp: '24ժ հիշեցում (WhatsApp)',
    reminder1hWhatsapp: '1ժ հիշեցում (WhatsApp)',
  
    reminder24hSms: '24ժ հիշեցում (SMS)',
    reminder1hSms: '1ժ հիշեցում (SMS)',
  
    saveNotifications: 'Պահպանել ծանուցումների կարգավորումները',
    notificationsSaved: 'Ծանուցումների կարգավորումները պահպանված են',
  
    allowCustomerReminderChoice:
      'Թույլ տալ հաճախորդներին ընտրել հիշեցման ժամանակը checkout-ի ժամանակ',
  
    customerReminderOptions:
      'Հիշեցման տարբերակներ (ժամերով՝ մինչև այցը)',
  
    customerReminderOptionsHint:
      'Comma-ով բաժանված ժամեր՝ 1-ից 168, օրինակ՝ 24, 12, 6, 1',
  
    defaultCustomerReminder: 'Դեֆոլտ ընտրություն checkout-ի ժամանակ',
  
    emailTemplatesSection: 'Email ձևանմուշներ',
    emailTemplatesDescription:
      'Կարգավորեք հաստատման, հիշեցման և gift card email-ները։ Օգտագործեք {{variable}} փոփոխականներ',
  
    emailTemplateSelect: 'Ձևանմուշ',
    emailTemplateEnabled: 'Ուղարկել այս email-ը',
  
    emailTemplateVariables: 'Փոփոխականներ',
    emailTemplateSubject: 'Թեմա',
    emailTemplateBodyText: 'Plain text բովանդակություն',
    emailTemplateBodyHtml: 'HTML բովանդակություն',
  
    emailTemplateSave: 'Պահպանել ձևանմուշը',
    emailTemplateReset: 'Վերականգնել դեֆոլտին',
    emailTemplateSaved: 'Email ձևանմուշը պահպանված է',
  
    emailTemplateKeys: {
      booking_confirmation: {
        label: 'Ամրագրման հաստատում',
        description: 'Ուղարկվում է, երբ մեկ այցը հաստատվում է',
      },
      booking_confirmation_grouped: {
        label: 'Բազմակի ամրագրման հաստատում',
        description:
          'Ուղարկվում է package կամ multi-service ամրագրման դեպքում',
      },
      booking_reminder: {
        label: 'Հիշեցում',
        description: 'Ուղարկվում է առաջիկա այցից առաջ',
      },
      booking_cancellation: {
        label: 'Չեղարկման ծանուցում',
        description: 'Ուղարկվում է այցի չեղարկման դեպքում',
      },
      review_request: {
        label: 'Կարծիք թողնելու հարցում',
        description: 'Ուղարկվում է այցից հետո',
      },
      gift_card_recipient: {
        label: 'Gift card — ստացող',
        description: 'Ուղարկվում է gift card ստացողին',
      },
      gift_card_purchaser_receipt: {
        label: 'Gift card — գնորդի receipt',
        description: 'Ուղարկվում է գնորդին',
      },
    },
  
    emailTemplateVars: {
      customerName: {
        label: 'Հաճախորդի անուն',
        description: 'Անուն կամ "there"',
      },
      businessName: {
        label: 'Բիզնեսի անուն',
        description: 'Ձեր սալոնի կամ կլինիկայի անուն',
      },
      serviceName: {
        label: 'Ծառայության անուն',
        description: 'Ամրագրված ծառայություն',
      },
      providerName: {
        label: 'Մասնագետի անուն',
        description: 'Աշխատակիցի անուն',
      },
      dateLabel: {
        label: 'Ամսաթիվ',
        description: 'Այցի ամսաթիվ',
      },
      timeLabel: {
        label: 'Ժամ',
        description: 'Ժամային միջակայք',
      },
  
      manageLinkText: {
        label: 'Կառավարման հղում (text)',
        description: 'Reschedule/cancel տեքստային email-ի համար',
      },
      manageLinkHtml: {
        label: 'Կառավարման հղում (HTML)',
        description: '"here" հղում HTML email-ի համար',
      },
  
      footerNote: {
        label: 'Footer նշում',
        description: 'Վերջաբան տող',
      },
  
      appointmentCount: {
        label: 'Այցերի քանակ',
        description: 'Քանակը',
      },
      appointmentWord: {
        label: 'Բառ (appointment)',
        description: '"appointment" կամ "appointments"',
      },
  
      groupLabelSuffix: {
        label: 'Խմբի suffix',
        description: 'օր. " (Package name)"',
      },
  
      appointmentsListText: {
        label: 'Այցերի ցուցակ (text)',
        description: 'Bullet list',
      },
      appointmentsListHtml: {
        label: 'Այցերի ցուցակ (HTML)',
        description: 'HTML list',
      },
  
      reminderLabel: {
        label: 'Հիշեցման ժամանակ',
        description: 'օր. "24 hours"',
      },
  
      cancelReason: {
        label: 'Չեղարկման պատճառ',
        description: 'Ինչու է չեղարկվել',
      },
  
      reviewUrl: {
        label: 'Review հղում',
        description: 'Կարծիք թողնելու link',
      },
  
      starRatingHtml: {
        label: 'Stars (HTML)',
        description: 'Star rating block',
      },
  
      recipientName: {
        label: 'Ստացողի անուն',
        description: 'Gift ստացող',
      },
      senderName: {
        label: 'Ուղարկողի անուն',
        description: 'Gift գնորդ',
      },
  
      giftCardCode: {
        label: 'Gift card կոդ',
        description: 'Կոդ',
      },
  
      personalMessageSection: {
        label: 'Անձնական հաղորդագրություն (text)',
        description: 'Sender message',
      },
      personalMessageHtml: {
        label: 'Անձնական հաղորդագրություն (HTML)',
        description: 'HTML message',
      },
  
      giftCardDetails: {
        label: 'Gift մանրամասներ (text)',
        description: 'Value կամ service credits',
      },
      giftCardDetailsHtml: {
        label: 'Gift մանրամասներ (HTML)',
        description: 'HTML details',
      },
  
      redemptionInstructions: {
        label: 'Օգտագործման հրահանգներ (text)',
        description: 'Ինչպես օգտագործել',
      },
      redemptionInstructionsHtml: {
        label: 'Օգտագործման հրահանգներ (HTML)',
        description: 'HTML steps',
      },
  
      recipientEmail: {
        label: 'Ստացողի email',
        description: 'Ուղարկման հասցե',
      },
  
      accountLinksText: {
        label: 'Account հղումներ (text)',
        description: 'Booking/account links',
      },
      accountLinksHtml: {
        label: 'Account հղումներ (HTML)',
        description: 'HTML links',
      },
    },
  
    emailCustomVariables: 'Կաստոմ փոփոխականներ',
    emailCustomVariablesHint:
      'Սահմանեք reusable placeholders (օր. footerNote)',
  
    emailVarKey: 'Բանալի (օր. footerNote)',
    emailVarLabel: 'Անուն',
    emailVarDefault: 'Դեֆոլտ արժեք',
  
    emailVarAdd: 'Ավելացնել փոփոխական',
    emailVarSave: 'Պահպանել փոփոխականները',
  
    notifyBusinessOnCustomerBookingChange:
      'Ուղարկել email բիզնեսին, երբ հաճախորդը փոխում կամ չեղարկում է ամրագրումը',
  
    emailOnNewCustomerRegistration:
      'Ուղարկել email marketing թիմին նոր հաճախորդի գրանցման դեպքում',
  
    marketingTeamEmails: 'Marketing թիմի email(ներ)',
    marketingTeamEmailsHint:
      'Comma-ով բաժանված հասցեներ',
  
    providerStatus: 'Մասնագետի կարգավիճակ',
  
    emailConfigured: 'Email-ը կարգավորված է',
    emailDevMode: 'Email (dev mode — console)',
  
    smsConfigured: 'SMS-ը կարգավորված է',
    smsDevMode: 'SMS (dev mode — console)',
  
    whatsappConfigured: 'WhatsApp-ը կարգավորված է',
    whatsappDevMode: 'WhatsApp (dev mode — console)',
  
    whatsappUsingPlatformDefault: 'Օգտագործվում է platform WhatsApp',
    whatsappUsingOwnAccount: 'Օգտագործվում է ձեր WhatsApp Business հաշիվը',
  
    whatsappIntegrationSection: 'WhatsApp ինտեգրում',
    whatsappIntegrationDescription:
      'Ընտրեք platform default կամ ձեր Meta WhatsApp Business հաշիվը',
  
    whatsappPhoneNumberId: 'Phone number ID',
    whatsappBusinessAccountId: 'WABA ID',
    whatsappAccessToken: 'Access token',
    whatsappAccessTokenHint: 'Պահված token',
  
    whatsappAccessTokenPlaceholder: 'Թողեք դատարկ՝ պահպանելու համար',
    whatsappAccessTokenRequiredPlaceholder: 'Տեղադրեք token',
  
    whatsappPhoneNumberIdRequired: 'Phone number ID պարտադիր է',
    whatsappBusinessAccountIdRequired: 'WABA ID պարտադիր է',
    whatsappAccessTokenRequired: 'Token պարտադիր է',
  
    whatsappTemplateConfirmation: 'Հաստատման template',
    whatsappTemplateReminder: 'Հիշեցման template',
    whatsappTemplateLanguage: 'Template լեզու',
  
    whatsappConnectionMode: 'Կապ',
    whatsappModePlatform: 'Platform default',
    whatsappModeCustom: 'Custom account',
  
    saveWhatsAppIntegration: 'Պահպանել WhatsApp կարգավորումները',
    whatsappIntegrationSaved: 'Պահպանված է',
  
    openAiSection: 'API Keys — OpenAI',
    openAiDescription:
      'AI ֆունկցիաներ dashboard-ում և provider app-ում',
  
    openAiUsingPlatformDefault: 'Օգտագործվում է platform OpenAI key',
    openAiUsingOwnKey: 'Օգտագործվում է ձեր OpenAI key',
    openAiNotConfigured: 'OpenAI կարգավորված չէ',
  
    openAiConnectionMode: 'Կապ',
    openAiModePlatform: 'Platform default',
    openAiModeCustom: 'Իմ OpenAI key',
  
    openAiApiKey: 'OpenAI API key',
    openAiApiKeyHint: 'Պահված է',
    openAiApiKeyPlaceholder: 'Թողեք դատարկ՝ պահպանելու համար',
    openAiApiKeyRequiredPlaceholder: 'sk-…',
  
    openAiApiKeyRequired: 'OpenAI key պարտադիր է',
  
    saveOpenAiIntegration: 'Պահպանել OpenAI կարգավորումները',
    openAiIntegrationSaved: 'Պահպանված է',
  
    openAiSaving: 'Փոխվում է platform default-ի…',
  
    openAiUsageTitle: 'AI օգտագործում այս ամիս',
    openAiUsagePeriod: 'Ժամանակահատված',
    openAiUsageRequests: 'Հարցումներ',
    openAiUsageTokens: 'Ընդհանուր tokens',
    openAiUsageTokensShort: 'tokens',
  
    openAiUsagePlatformCost: 'Platform AI ծախս (գնահատական)',
    openAiUsagePlatformCostHint:
      'Միայն platform key-ով հարցումներն են հաշվում',
  
    openAiUsageBySurface: 'Ըստ հատվածների',
  
    openAiSurface_dashboard: 'Dashboard',
    openAiSurface_provider_mobile: 'Provider mobile',
    openAiSurface_public_booking: 'Public booking',
    openAiSurface_onboarding: 'Onboarding',
    openAiSurface_agent: 'AI agents',
  
    customerSelfServiceTitle: 'Հանրային booking — ինքնասպասարկում',
    customerSelfServiceDescription:
      'Թույլ տվեք հաճախորդներին ինքնուրույն չեղարկել կամ փոխել ամրագրումները',
  
    allowCustomerCancel: 'Թույլ տալ չեղարկում',
    allowCustomerReschedule: 'Թույլ տալ փոփոխություն',
  
    minimumNoticeHours: 'Նվազագույն ժամ (մինչ այցը)',
    maxReschedulesPerBooking: 'Փոփոխությունների max քանակ',
  
    allowProviderChangeOnReschedule:
      'Թույլ տալ փոխել մասնագետը փոփոխման ժամանակ',
  
    businessProfileSection: 'Բիզնես պրոֆիլ',
    businessProfileSectionDescription:
      'Լոգո, կոնտակտ, գույներ, սոցիալական հղումներ',
  
    editBusinessProfile: 'Խմբագրել պրոֆիլը',
  
    payAtVenueTitle: 'Վճարում տեղում',
    payAtVenueDescription:
      'Թույլ տվեք վճարում տեղում տարբերակը',
  
    payAtVenueRequiresStripeDescription:
      'Stripe չունենալու դեպքում միայն տեղում վճարում',
  
    payAtVenueGoToBilling: 'Կարգավորել Stripe',
  
    acceptCashPayments: 'Թույլ տալ cash վճարում',
    acceptCashPaymentsHint:
      'Հաճախորդը կարող է ընտրել վճարում տեղում',
  
    payAtVenueSaved: 'Պահպանված է',
    publicBookingSaved: 'Պահպանված է',
  
    generalSection: 'Ընդհանուր',
    businessCurrency: 'Լռելյայն արժույթ',
    currencyDescription:
      'Գները, վճարումը և արտահանումները օգտագործում են այս արժույթը։ Գոյություն ունեցող ծառայությունները պահպանում են իրենց արժույթը մինչև խմբագրումը։',
    currencyHint: 'Մեկ արժույթ մեկ բիզնեսի համար (v1)։ Ավտոմատ փոխարկում չկա։',
    saveCurrency: 'Պահպանել արժույթը',
    currencySaved: 'Արժույթը պահպանված է',
    currencyStripeWarning:
      'Այս արժույթը հնարավոր է չլինի աջակցված Stripe օնլայն վճարումների համար։',
    dashboardLanguageDescription:
      'Ձեր անձնական dashboard-ի լեզուն։ Չի փոխում հաճախորդների տեսնող լեզուները booking էջում։',
    tenantLanguagesSection: 'Բիզնեսի լեզուներ',
    tenantLanguagesDescription:
      'Ընտրեք, թե որ լեզուներն են աջակցվում։ Թարգմանության դաշտերն ու լեզվի ընտրիչը ցուցադրվում են միայն միացված լեզուների համար։',
    enabledLocalesLabel: 'Միացված լեզուներ',
    enabledLocalesHint: 'Պետք է միացված լինի առնվազն մեկ լեզու։',
    defaultTenantLocale: 'Լռելյայն լեզու',
    defaultTenantLocaleHint:
      'Օգտագործվում է, երբ այցելուն չի ընտրել լեզու (հանրային booking և consumer հավելված)։',
    saveTenantLanguages: 'Պահպանել լեզուները',
    tenantLanguagesSaved: 'Բիզնեսի լեզուները պահպանված են',
    dateFormatSection: 'Ամսաթվի և ժամի ձևաչափ',
    dateFormatDescription:
      'Ամսաթվերի և ժամերի ցուցադրումը դաշտբորդում, մատակարարի հավելվածում, սպառողի հավելվածում և հանրային ամրագրման էջում։',
    businessDateFormat: 'Ամսաթվի ձևաչափ',
    businessTimeFormat: 'Ժամի ձևաչափ',
    timeFormat24h: '24-ժամ (13:30)',
    timeFormat12h: '12-ժամ AM/PM (1:30 PM)',
    dateFormatHint: 'Լռելյայն՝ DD/MM/YYYY և 24-ժամյա ժամաչափ։',
    saveDateFormat: 'Պահպանել ամսաթվի ձևաչափը',
    dateFormatSaved: 'Ամսաթվի ձևաչափը պահպանված է',
    taxSection: 'Հարկ / ԱԱՀ',
    taxDescription:
      'Կարգավորեք, թե ինչպես է հարկը հաշվարկվում և ցուցադրվում վճարման ժամանակ։',
    taxEnabled: 'Միացնել հարկը ամրագրումներում',
    taxName: 'Հարկի անվանում',
    taxRate: 'Հարկի դրույք (%)',
    taxModel: 'Գնման մոդել',
    taxModelExclusive: 'Բացառիկ — հարկը ավելացվում է վճարման ժամանակ',
    taxModelInclusive: 'Ներառական — գները ներառում են հարկը',
    taxNumber: 'Հարկային գրանցման համար',
    taxHint:
      'Ցուցադրվում է անդորրագրերում։ Մեկ դրույք կամ մի քանի կանոն (օր.՝ դաշնային + նահանգային)։',
    taxStackedEnabled: 'Օգտագործել մի քանի հարկային կանոն',
    taxStackedDescription:
      'Յուրաքանչյուր կանոն կիրառվում է նույն հարկվող գումարի վրա։',
    taxAddRule: 'Ավելացնել հարկային կանոն',
    taxRemoveRule: 'Հեռացնել հարկային կանոն',
    taxStackedEffectiveRate: 'Ընդհանուր դրույք՝ {rate}%',
    taxStackedRateRequired: 'Մուտքագրեք 0-ից մեծ դրույք առնվազն մեկ կանոնի համար։',
    taxRateRequired: 'Միացված հարկի դեպքում մուտքագրեք 0-ից մեծ դրույք։',
    saveTax: 'Պահպանել հարկի կարգավորումները',
    taxSaved: 'Հարկի կարգավորումները պահպանված են',
    enabledLocalesRequired: 'Միացրեք առնվազն մեկ լեզու։',
    defaultLocaleMustBeEnabled: 'Լռելյայն լեզուն պետք է լինի միացված լեզուներից մեկը։',
    emailTemplateLocaleTab: 'Նամակի լեզու',
    languageSection: 'Լեզու',
    dashboardLanguage: 'Dashboard լեզու',
  
    saveSettings: 'Պահպանել կարգավորումները',
  },
  clinic: {
    serviceType: {
      consultation: 'Խորհրդատվություն',
      lab_test: 'Լաբորատոր թեստ',
      procedure: 'Գործընթաց',
    },
    fastingRequired: 'Պահանջվում է ծոմապահություն',
    symptoms: 'Ախտանիշներ կամ այցի պատճառ',
    symptomsPlaceholder: 'Նկարագրեք ախտանիշները (ընտրովի)',
    referralNotes: 'Ուղղորդման նշումներ',
    referralNotesPlaceholder: 'Ուղղորդող բժիշկ կամ նախորդ թեստեր (ընտրովի)',
    admin: {
      enableClinic: 'Կլինիկական ծառայություն',
      serviceType: 'Այցի տեսակ',
      requiresFasting: 'Պահանջում է ծոմապահություն',
      preparationNotes: 'Պատրաստման հրահանգներ',
    },
    labState: {
      gate: {
        disabledReason:
          'Լաբորատոր պատվերները, արդյունքները և նմուշները հասանելի են միայն կլինիկական բիզնես տեսակների համար (clinic, polyclinic, beauty_clinic, dental)։',
      },
      order: {
        NotCollected: 'Չի հավաքվել',
        Collecting: 'Հավաքում',
        AwaitingResults: 'Սպասում է արդյունքներին',
        Completed: 'Ավարտված',
        Cancelled: 'Չեղարկված',
      },
      result: {
        NotReceived: 'Չի ստացվել',
        Pending: 'Սպասման մեջ',
        WaitingCompletion: 'Սպասում է ավարտին',
        Completed: 'Ավարտված',
        Reviewed: 'Վերանայված',
        AutomaticallyReviewed: 'Ավտոմատ վերանայված',
        Released: 'Հրապարակված',
        Rejected: 'Մերժված',
      },
      specimen: {
        NotCollected: 'Չի հավաքվել',
        Collected: 'Հավաքված',
        ReadyForTransport: 'Պատրաստ է փոխադրման',
        InTransit: 'Ճանապարհին',
        ReceivedInLab: 'Ստացվել է լաբորատորիայում',
        Completed: 'Ավարտված',
        RecollectRequired: 'Պահանջվում է կրկին հավաք',
        RetestRequired: 'Պահանջվում է կրկին թեստ',
        Rejected: 'Մերժված',
      },
      measurement: {
        Normal: 'Նորմալ',
        Abnormal: 'Աննորմալ',
        High: 'Բարձր',
        Low: 'Ցածր',
        Inconclusive: 'Անորոշելի',
        Indeterminate: 'Անորոշ',
        TestNotComplete: 'Թեստը ավարտված չէ',
        NotApplicable: 'Կիրառելի չէ',
        SeeDetails: 'Տես մանրամասները',
      },
      patientVisibility: {
        New: 'Նոր',
        Pending: 'Սպասման մեջ',
        Read: 'Կարդացված',
      },
      resultsTab: {
        title: 'Լաբորատոր արդյունքներ',
        tabLabel: 'Արդյունքներ',
        empty: 'Այս ամրագրումը դեռ կապված լաբորատոր պատվերներ չունի։',
        createOrder: 'Ստեղծել լաբ. պատվեր',
        order: 'Պատվեր',
        result: 'Արդյունք',
        specimen: 'Նմուշ',
        measurement: 'Դրոշ',
        unnamedResult: 'Լաբորատոր արդյունք',
      },
      ordersTab: {
        title: 'Լաբորատոր պատվերներ',
        tabLabel: 'Պատվերներ',
        empty: 'Այս ամրագրումը դեռ լաբորատոր պատվերներ չունի։',
        createOrder: 'Ստեղծել լաբ. պատվեր',
        unnamedOrder: 'Լաբորատոր պատվեր',
        catalogPickerTitle: 'Ավելացնել կատալոգից',
        catalogTestsLabel: 'Թեստերի տեսակներ',
        catalogPanelsLabel: 'Պանելներ',
        noCatalogItems:
          'Կատալոգում ակտիվ թեստեր կամ պանելներ չկան։ Ավելացրեք Clinic admin-ում։',
        placeCatalogOrder: 'Տեղադրել կատալոգային պատվեր',
        selectCatalogItems: 'Ընտրեք առնվազն մեկ թեստ կամ պանել։',
        selectedCount: '{count} ընտրված',
        createFromService: 'Ստեղծել ամրագրումի ծառայությունից',
      },
    },
    labBookingRequest: {
      pushToPatient: 'Ուղարկել հիվանդին',
      pushed: 'Ամրագրումի հարցումն ուղարկված է',
      collectionBooked: 'Հավաքման ամրագրումը կատարված է',
      collectionService: 'Հավաքման ծառայություն',
      staffBookTitle: 'Ամրագրել հավաքումը հիվանդի համար',
      staffBookDateLabel: 'Հավաքման ամսաթիվ',
      staffBookSlotsLabel: 'Հասանելի ժամեր',
      staffBookNoSlots: 'Այս ամսաթվին հավաքման սլոտներ չկան։',
      staffBookCollection: 'Ամրագրել հավաքում',
    },
    labQueue: {
      title: 'Լաբորատոր հերթ',
      subtitle: 'Բաց լաբորատոր պատվերներ ամրագրումներով։',
      empty: 'Ընթացիկ ֆիլտրերով պատվերներ չկան։',
      openBooking: 'Բացել ամրագրումը',
      filters: {
        status: 'Պատվերի կարգավիճակ',
        department: 'Բաժին',
        from: 'Սկսած',
        to: 'Մինչև',
        allStatuses: 'Բոլոր կարգավիճակները',
        allDepartments: 'Բոլոր բաժինները',
        awaitingPatientBooking: 'Սպասում է հիվանդի ամրագրման',
      },
      badges: {
        awaitingPatientBooking: 'Սպասում է հիվանդի ամրագրման',
      },
      columns: {
        test: 'Թեստ',
        status: 'Կարգավիճակ',
        customer: 'Հաճախորդ',
        appointment: 'Այց',
        pushSent: 'Ուղարկված է',
        collection: 'Հավաքում',
        department: 'Բաժին',
        provider: 'Մասնագետ',
      },
    },
    patientChart: {
      title: 'Հիվանդի քարտ',
      unknownPatient: 'Հիվանդ',
      backToCustomers: 'Հաճախորդներ',
      openChart: 'Բացել հիվանդի քարտը',
      tabListLabel: 'Հիվանդի քարտի բաժիններ',
      tabsComingSoon: 'Շուտով',
      loadFailed: 'Չհաջողվեց բեռնել հիվանդի տվյալները։',
      intakeEmpty: 'Դեռ նախապոստ այցի հարցաթերթիկ նշանակված չէ։',
      demographicsTitle: 'Հիմնական տվյալներ',
      clinicalProfileTitle: 'Կլինիկական պրոֆիլ',
      phiMaskedNotice:
        'Պրոֆիլի տվյալները թաքցված են — այս հիվանդի քարտին մուտք չունեք։',
      visitsEmpty: 'Այցերի պատմություն դեռ չկա։',
      ordersEmpty: 'Լաբորատոր պատվերներ չեն գտնվել։',
      catalogOrder: {
        title: 'Պատվիրել լաբորատոր թեստեր կատալոգից',
        visitLabel: 'Կապակցել հաստատված այցի հետ',
        noConfirmedVisits:
          'Հաստատված այցեր չկան։ Կատալոգային պատվեր տալուց առաջ հաստատեք նշանակումը։',
        testsLabel: 'Թեստերի տեսակներ',
        panelsLabel: 'Պանելներ',
        noCatalogItems:
          'Կատալոգում ակտիվ թեստեր կամ պանելներ չկան։ Ավելացրեք Clinic admin-ում։',
        placeOrder: 'Տեղադրել կատալոգային պատվեր',
        selectItems: 'Ընտրեք առնվազն մեկ թեստ կամ պանել։',
        selectedCount: '{count} ընտրված',
        ordersListTitle: 'Լաբորատոր պատվերներ',
      },
      resultsEmpty: 'Լաբորատոր արդյունքներ չեն գտնվել։',
      tabs: {
        profile: 'Պրոֆիլ',
        visits: 'Այցեր',
        results: 'Արդյունքներ',
        orders: 'Պատվերներ',
        encounters: 'Հանդիպումներ',
        documents: 'Փաստաթղթեր',
        staffNotes: 'Անձնակազմի նշումներ',
        intake: 'Հարցաշար',
      },
      fields: {
        name: 'Անուն',
        email: 'Email',
        phone: 'Հեռախոս',
        segment: 'Սեգմենտ',
        customerSince: 'Հաճախորդ է՝',
        allergies: 'Ալերգիաներ',
        chronicProblems: 'Քրոնիկ խնդիրներ',
        bloodType: 'Արյան խումբ',
        emergencyContactName: 'Արտակարգ կապի անուն',
        emergencyContactPhone: 'Արտակարգ կապի հեռախոս',
        emergencyContactRelationship: 'Կապը',
        referringDoctor: 'Ուղղորդող բժիշկ',
      },
      referringDoctorNone: 'Ուղղորդող բժիշկ նշված չէ',
      columns: {
        service: 'Ծառայություն',
        when: 'Երբ',
        provider: 'Մասնագետ',
        status: 'Կարգավիճակ',
        appointment: 'Ամրագրում',
        created: 'Ստեղծված',
        released: 'Հրապարակված',
      },
      encountersEmpty: 'Ավարտված խորհրդատվություններ դեռ չկան։',
      encountersListTitle: 'Ավարտված խորհրդատվություններ',
      encounterHasNote: 'Այցի նշում կա',
      encounterNeedsNote: 'Այցի նշում չկա',
      addendaCount: '{count} լրացում',
      visitNoteLabel: 'Այցի նշում',
      saveVisitNote: 'Պահպանել նշումը',
      createVisitNote: 'Ստեղծել նշում',
      addendaTitle: 'Լրացումներ',
      addendaEmpty: 'Լրացումներ չկան։',
      addendumLabel: 'Լրացում',
      appendAddendum: 'Ավելացնել լրացում',
      unknownAuthor: 'Մասնագետ',
      staffNotesInternalNotice:
        'Միայն անձնակազմի ներքին նշումներ — հիվանդները և հանրային ամրագրումը դրանք չեն տեսնում։',
      staffNotesForbidden:
        'Դուք մուտք չունեք այս հիվանդի անձնակազմի ներքին նշումներին։',
      staffNotesEmpty: 'Անձնակազմի ներքին նշումներ դեռ չկան։',
      addStaffNoteTitle: 'Ավելացնել ներքին նշում',
      staffNoteLabel: 'Անձնակազմի նշում',
      addStaffNote: 'Ավելացնել նշում',
      documentsEmpty: 'Այս հիվանդի համար փաստաթղթեր դեռ չեն վերբեռնվել։',
      documentsForbidden: 'Դուք մուտք չունեք այս հիվանդի փաստաթղթերին։',
      documentFilterLabel: 'Կատեգորիա',
      documentCategoryLabel: 'Փաստաթղթի կատեգորիա',
      documentTitleLabel: 'Անվանում (ընտրովի)',
      documentTitlePlaceholder: 'օր.՝ CBC արդյունքներ 2026-ի մարտ',
      documentFileLabel: 'PDF ֆայլ',
      uploadDocumentTitle: 'Վերբեռնել փաստաթուղթ',
      uploadDocument: 'Վերբեռնել PDF',
      openDocument: 'Բացել PDF',
      documentUntitled: 'Անվերնագիր փաստաթուղթ',
      documentReleasedBadge: 'Հասանելի է հիվանդին',
      releaseDocumentToPatient: 'Հրապարակել հիվանդի համար',
      revokeDocumentRelease: 'Չեղարկել հիվանդի մուտքը',
      documentCategories: {
        all: 'Բոլոր կատեգորիաները',
        lab_report: 'Լաբորատոր հաշվետվություն',
        referral_letter: 'Ուղղորդում',
        imaging_report: 'Ուղղորդված պատկեր',
        other: 'Այլ',
      },
    },
    publicIntake: {
      checkoutTitle: 'Նախապոստ այցի ընտրովի հարցաթերթիկ',
      checkoutSubtitle:
        'Պատասխանեք մի քանի հարցի՝ գրանցումից առաջ, որպեսզի լաբորատորիան պատրաստվի ձեր այցին։',
      skip: 'Բաց թողնել',
      signInPrompt:
        'Մուտք գործեք՝ գրանցումից առաջ լրացնելու ընտրովի նախապոստ այցի հարցաթերթիկը։',
      continueToCheckout: 'Շարունակել գրանցումը',
    },
    patientAlerts: {
      regionLabel: 'Հիվանդի քարտի ազդարարումներ',
      loading: 'Ազդարարումները բեռնվում են…',
      viewAction: 'Դիտել',
      dismiss: 'Թաքցնել',
      titles: {
        TestResultReleased: 'Նոր լաբորատոր արդյունք',
        IntakeIncomplete: 'Նախապոստ այցի հարցաթերթիկը ավարտված չէ',
        LabBookingRequestPending: 'Լաբորատոր հավաքման ամրագրումը սպասման մեջ է',
      },
      bodies: {
        TestResultReleased: '{testName}-ը հասանելի է դիտման համար։',
        IntakeIncomplete: '«{questionnaireTitle}» հարցաթերթիկը դեռ լրացված չէ։',
        LabBookingRequestPending:
          '{orderDisplayNames} — հիվանդը դեռ չի ամրագրել հավաքումը։',
      },
    },
    intakeForm: {
      chartTitle: 'Նախապոստ այցի հարցաթերթիկ',
      chartSubtitle: 'Կառուցվածքային հարցաթերթիկներ՝ կապված պացիենտի քարտի հետ։',
      chartEmpty:
        'Դեռ նախապոստ այցի հարցաթերթիկներ չկան։ Նշանակեք մեկը այցից առաջ։',
      assignChartIntake: 'Նշանակել հարցաթերթիկ',
      assignBookingIntake: 'Նշանակել նախապոստ այցի հարցաթերթիկ',
      bookingTitle: 'Նախապոստ այցի հարցաթերթիկ',
      bookingSubtitle: 'Հավաքեք պատասխաններ այս ամրագրումից առաջ։',
      bookingEmpty: 'Այս ամրագրին դեռ հարցաթերթիկ չի նշանակվել։',
      linkedToBooking: 'Կապված է ամրագրի հետ',
      chartLevelIntake: 'Պացիենտի քարտի հարցաթերթիկ',
      selectIntakePrompt: 'Ընտրեք հարցաթերթիկը դիտելու կամ շարունակելու համար։',
      startPrompt: 'Սկսեք հարցաթերթիկը՝ պատասխաններ հավաքելու համար։',
      start: 'Սկսել հարցաթերթիկը',
      continue: 'Շարունակել',
      completed: 'Հարցաթերթիկը ավարտված է',
      completedBody: 'Բոլոր պարտադիր հարցերին տրվել են պատասխաններ։',
      noActiveQuestion: 'Այս հարցաթերթիկի համար ակտիվ հարց չկա։',
      untitledQuestion: 'Անվերնագիր հարց',
      loadFailed: 'Չհաջողվեց բեռնել հարցաթերթիկը։',
      submitFailed: 'Չհաջողվեց պահպանել պատասխանը։',
      status: {
        assigned: 'Նշանակված',
        in_progress: 'Ընթացքում',
        completed: 'Ավարտված',
      },
    },
    afterVisitSummary: {
      title: 'Հետայցային ամփոփում',
      subtitle: 'Այցից հետո ամփոփում, որը հիվանդին հասանելի է դառնում պատրաստ լինելուն պես։',
      empty: 'Դեռ հետայցային ամփոփում չի ստեղծվել։',
      authorLabel: 'Ամփոփման տեքստ',
      saveSummary: 'Պահպանել ամփոփումը',
      releaseToPatient: 'Հրապարակել հիվանդին',
      revokeRelease: 'Չեղարկել հիվանդի մուտքը',
      exportPdf: 'Արտահանել PDF',
      releasedBadge: 'Հրապարակված է հիվանդին',
      draftBadge: 'Նախագիծ',
      loadFailed: 'Չհաջողվեց բեռնել հետայցային ամփոփումը։',
      saveFailed: 'Չհաջողվեց պահպանել հետայցային ամփոփումը։',
      releaseFailed: 'Չհաջողվեց թարմացնել հրապարակման կարգավիճակը։',
      exportFailed: 'Չհաջողվեց արտահանել հետայցային ամփոփումը։',
      noContent: 'Արտահանելուց առաջ ստեղծեք ամփոփում։',
    },
    labSpecimens: {
      tabs: { collection: 'Հավաքում', tracking: 'Հետևում' },
      filters: { status: 'Նմուշի կարգավիճակ', allStatuses: 'Բոլոր կարգավիճակները' },
      columns: {
        test: 'Թեստ',
        status: 'Կարգավիճակ',
        customer: 'Հաճախորդ',
        appointment: 'Ամրագրում',
        tracking: 'Պահեստ / տրանսպորտ',
        actions: 'Գործողություններ',
      },
      trackingDetails: {
        collected: 'Հավաքված',
        storage: 'Պահեստ',
        folder: 'Տրանսպортային թղթապանակ',
      },
      actions: {
        markCollected: 'Նշել հավաքված',
        markReceivedInLab: 'Ստացվել է լաբ.',
        markReadyForTransport: 'Պատրաստ է տրանսպորտի',
        markInTransit: 'Ճանապարհին',
        markComplete: 'Ավարտված',
        markRecollectRequired: 'Կրկին հավաքում',
        markRetestRequired: 'Կրկին թեստ',
        reject: 'Մերժել',
      },
      collection: {
        title: 'Նմուշների հավաքում',
        subtitle: 'Այսօրվա լաբորատոր ամրագրումների աշխատանքային ցանկ։',
        empty: 'Ընթացիկ ֆիլտրերով հավաքման նմուշներ չկան։',
      },
      tracking: {
        title: 'Նմուշների հետևում',
        subtitle: 'Պահեստավորում, տրանսպորտ և լաբ. ստացում։',
        empty: 'Տրանսպորտի կամ լաբ. մշակման նմուշներ չկան։',
      },
      label: {
        title: 'Նմուշի պիտակ',
        subtitle: 'Տպել Code128 շտրիխ կոդով պիտակ փորձանոթային հավաքման համար։',
        print: 'Տպել պիտակ',
        printShort: 'Պիտակ',
        loadError: 'Չհաջողվեց բեռնել պիտակի տվյալները։',
        fields: {
          specimenId: 'Նմուշի ID',
          customer: 'Հիվանդ',
          test: 'Թեստ',
          appointment: 'Ամրագրում',
          department: 'Բաժին',
          status: 'Կարգավիճակ',
          collected: 'Հավաքված',
        },
      },
    },
    labResults: {
      actions: {
        markPending: 'Նշել սպասման',
        markCompleted: 'Նշել ավարտված',
        markReviewed: 'Նշել վերանայված',
        markReleased: 'Ազատել հիվանդին',
        viewResultHistory: 'Պատմություն',
        viewBookingHistory: 'Աудитի պատմություն',
      },
      timestamps: {
        completedAt: 'Ավարտված',
        reviewedAt: 'Վերանայված',
        releasedAt: 'Ազատված',
      },
      changeHistory: {
        bookingTitle: 'Լաբորատորի аудитի պատմություն',
        resultTitle: 'Արդյունքի գործողությունների պատմություն',
        empty: 'Կարգավիճակի փոփոխություններ դեռ չեն գրանցվել։',
        systemActor: 'Համակարգ',
        columns: {
          editedBy: 'Խմբագրող',
          changed: 'Փոփոխություն',
          from: 'Սկզբից',
          to: 'Դեպի',
          date: 'Ամսաթիվ',
        },
        actions: {
          Created: 'Ստեղծված',
          StatusChanged: 'Կարգավիճակը փոխվել է',
          ResultReviewed: 'Արդյունքը վերանայվել է',
          ResultReleased: 'Արդյունքը ազատվել է',
          OrderCancelled: 'Պատվերը չեղարկվել է',
        },
        properties: {
          status: 'Կարգավիճակ',
        },
      },
    },
  },

  recommendations: {
    youMightAlsoLike: 'Դուք կարող եք նաև հավանել',
    dismiss: 'Թաքցնել առաջարկները',
    learnMore: 'Իմանալ ավելին',
    admin: {
      description: 'Նկարագրություն',
      imageUrl: 'Պատկերի հղում',
      externalLink: 'Արտաքին հղում',
      isActive: 'Ակտիվ է առաջարկների համար',
      recommendedProducts: 'Առաջարկվող ապրանքներ',
      recommendedProductsHint:
        'Ցուցադրվում է վճարումից հետո այս ծառայության կամ կատեգորիայի համար։',
      noProductsYet: 'Նախ ավելացրեք ապրանքներ Գործառնություններ → Պահեստ բաժնում։',
    },
  },

  tours: {
    tourImagePlaceholder: 'Տուր',
    pricePerPerson: '{price} / անձ',
    perPersonSuffix: 'մեկ անձի համար',
    maxGroup: 'Մինչև {count}',
    groupSize: 'Խմբի չափ',
    travelersHint: '1–{max} ճանապարհորդ',
    lineTotal: '{unit} × {count} = {total}',
    difficulty: {
      easy: 'Հեշտ',
      moderate: 'Միջին',
      challenging: 'Բարդ',
    },
    admin: {
      enableTour: 'Տուրային ծառայություն',
      coverImage: 'Շապիկի նկարի URL',
      maxGroupSize: 'Խմբի առավելագույն չափ',
      difficulty: 'Բարդություն',
      meetingPoint: 'Հանդիպման վայր',
      includedItems: 'Ներառված է',
      durationDays: 'Տևողություն (օր)',
    },
    remainingSpots: '{count} տեղ մնաց',
    tourDates: '{start} – {end}',
    paxLabel: '{count} ճանապարհորդ',
  },
  public: {
    chooseSpecialist: 'Ընտրել մասնագետ',
specialistAiHint: 'Կամ օգտագործեք AI օգնականը ստորև՝ ցանկալի ծառայությունն ու ժամանակը գտնելու համար։',
chooseSpecialistShort: 'Ընտրել մասնագետ',
specialistAiHintShort: 'Կամ օգտագործեք AI օգնականը ծառայությունն ու ժամանակը գտնելու համար',
anySpecialist: 'Ցանկացած հասանելի մասնագետ',
anySpecialistHint: 'Սկզբում ընտրեք ծառայություն — մենք կկցենք հասանելի մասնագետի',
orSelectService: 'Կամ ընտրեք ծառայություն',
selectDateTime: 'Ընտրեք ամսաթիվ և ժամ',
availableSlots: 'Հասանելի ժամեր',
noSlotsThisDay: 'Այս օրը հասանելի ժամեր չկան',
noServicesAvailable: 'Ամրագրման համար ծառայություններ չկան',
assignedAutomatically: 'Մասնագետը նշանակվում է ավտոմատ',
selectSpecialist: 'Ընտրել մասնագետ',
noSpecialistsForSlot: 'Այս ժամին հասանելի մասնագետ չկա',
today: 'Այսօր',
todayInline: 'այսօր',
nearestSlots: 'Ամենամոտ հասանելի ժամ՝ — {date}:',
noSlots: 'Վերջին երկու շաբաթում հասանելի ժամեր չկան',
selectService: 'Ընտրել ծառայություն',
bookAppointment: 'Ամրագրել',
followUs: 'Հետևեք մեզ',
location: 'Գտնվելու վայր',
selectProviderInfo: 'Մասնագետի տեղեկություն',
submitReviewWithGoogle: 'Թողնել կարծիք Google-ով',
reviewGoogleHint: 'Մուտք գործեք Google-ով՝ այցելությունը հաստատելու համար',
googleSignInUnavailable: 'Google մուտքը կարծիքների համար դեռ կարգավորված չէ',
chooseThisProfessional: 'Ընտրել այս մասնագետին',
commentsTitle: 'Մեկնաբանություններ',
rateAndReview: 'Գնահատել և գրել կարծիք',
rateAfterVisitHint: 'Կարող եք կարծիք թողնել այցելությունից հետո',
reviewCountLabel: '{count} կարծիք',
providerReviewsTitle: 'Հաճախորդների կարծիքներ',
providerReviewSummary: '{rating} ({count} կարծիք)',
showProviderReviews: 'Ցուցադրել կարծիքները',
hideProviderReviews: 'Թաքցնել կարծիքները',
seeMoreReviews: 'Դիտել բոլոր կարծիքները',
reviewsPageTitle: '{name}-ի կարծիքներ',
reviewsPageNotFound: 'Մասնագետը կամ կարծիքները չեն գտնվել',
reviewsPageOf: 'Էջ {page} / {total}',
reviewsPreviousPage: 'Նախորդ',
reviewsNextPage: 'Հաջորդ',
noProviderReviews: 'Դեռևս կարծիքներ չկան',
servicesTitle: 'Ընտրեք ծառայություն',
checkoutTitle: 'Ամրագրման մանրամասներ',
appointmentBooked: 'Ամրագրումը կատարված է',
bookAnother: 'Ամրագրել ևս մեկը',
reviewAfterVisitHint: 'Այցից հետո մենք կուղարկենք հղում կարծիք թողնելու համար',
appInstallQrTitle: 'Ներբեռնեք հավելվածը հեշտ վերամրագրման համար',
appInstallQrHint: 'Սканավորեք՝ տեղադրելու կամ բացելու համար — արդեն այս սրահի համար։',
appInstallQrAlt: 'QR կոդ OptiSchedule հավելվածը տեղադրելու համար',
appInstallOpenLink: 'Բացել տեղադրման հղումը',
reviewTitle: 'Գնահատեք ձեր փորձը',
reviewSubtitle: 'Ձեր կարծիքը օգնում է մեզ բարելավել',
reviewRatingLabel: 'Ինչպե՞ս կգնահատեք ձեր այցը',
reviewCommentLabel: 'Մեկնաբանություն (ըստ ցանկության)',
reviewCommentPlaceholder: 'Պատմեք ձեր փորձի մասին…',
reviewSubmit: 'Ուղարկել կարծիք',
reviewSubmitFailed: 'Չհաջողվեց ուղարկել կարծիքը',
reviewRatingRequired: 'Խնդրում ենք ընտրել գնահատական',
reviewThankYou: 'Շնորհակալություն ձեր կարծիքի համար!',
reviewThankYouDetail: 'Մենք գնահատում ենք ձեր արձագանքը',
reviewInvalidLink: 'Այս կարծիքի հղումը անվավեր է կամ ժամկետանց',
nameRequired: 'Անունը պարտադիր է',
contactRequired: 'Պարտադիր է էլ. փոստ կամ հեռախոսահամար',
phone: 'Հեռախոս',
phonePlaceholder: 'Մուտքագրեք հեռախոսահամարը',
phoneCountrySearch: 'Փնտրեք երկիր կամ կոդ (օր. +37)',
phoneCountryNotFound: 'Երկիր չի գտնվել',
phoneInvalid: 'Մուտքագրեք վավեր հեռախոսահամար',
consentRequired: 'Խնդրում ենք ընդունել գաղտնիության քաղաքականությունը',
bookingFailed: 'Ամրագրումը ձախողվեց',
missingAppointmentSchedule: 'Բացակայում է ամրագրման ժամանակացույցը',
validateServiceSelectionFailed: 'Չհաջողվեց ստուգել ծառայության ընտրությունը',
loadAvailableTimesFailed: 'Չհաջողվեց բեռնել հասանելի ժամերը',
findAvailableBlockFailed: 'Չհաջողվեց գտնել հասանելի բլոկ',
privacyConsent: 'Համաձայն եմ իմ տվյալների մշակմանը',
marketingOptIn: 'Ուղարկել առաջարկներ և մարքեթինգային հաղորդագրություններ (ըստ ցանկության)',
exportMyData: 'Ներբեռնել իմ տվյալները',
deleteMyData: 'Ջնջել իմ հաշվի տվյալները',
dataExportSuccess: 'Ձեր տվյալների արտահանումը սկսվել է',
dataDeleteConfirm: 'Սա ընդմիշտ կհեռացնի ձեր պրոֆիլը այս բիզնեսից։ Շարունակե՞լ',
dataDeleteSuccess: 'Ձեր տվյալները ջնջվել են',
reminderTimingHint: 'Մենք կուղարկենք հիշեցում ձեր միացված ալիքներով (էլ. փոստ կամ WhatsApp)',
reminderTimingNone: 'Հիշեցում չկա',
reminderTimingLabel: 'Հիշեցնել իմ այցից առաջ',
reminderBeforeOption: '{unit} առաջ',
personalInformation: 'Անձնական տվյալներ',
nameLabel: 'Անուն *',
emailLabel: 'Էլ. փոստ *',
commentLabel: 'Մեկնաբանություն',
enterNamePlaceholder: 'Մուտքագրեք անունը',
enterEmailPlaceholder: 'Մուտքագրեք էլ. փոստը',
commentPlaceholder: 'Մեկնաբանություն',
emailRemindersCheckout: 'Ուղարկել էլ. փոստով հիշեցումներ այս ամրագրման մասին',
regularPrice: 'Սովորական գին',
noServicesFitSlot: 'Ընտրված ժամանակին համապատասխան ծառայություններ չկան',
chooseAnotherTime: 'Ընտրել այլ ժամանակ',
oneTimeVisit: 'Մեկ այց՝ {price}',
subscriptionPlansAtCheckout: 'Հասանելի են բաժանորդագրության պլաններ — ընտրեք Subscribe & save',
whatsappReminders: 'Ուղարկել WhatsApp հիշեցումներ (պահանջում է հեռախոսահամար)',
whatsappPhoneRequired: 'WhatsApp հիշեցումների համար անհրաժեշտ է հեռախոսահամար',
confirmBooking: 'Հաստատել ամրագրումը',
submitting: 'Ուղարկվում է…',
total: 'Ընդհանուր',
assistantTitle: 'Ամրագրման օգնական',
assistantHint: 'Հարցրեք հասանելիության, ծառայությունների կամ ամրագրման մասին',
assistantPlaceholder: 'Հարցրեք ցանկացած բան ամրագրման մասին…',
thinking: 'Մտածում…',
continueBooking: 'Շարունակել ամրագրումը',
uncategorizedServices: 'Այլ ծառայություններ',
packagesTitle: 'Փաթեթներ',
packageBadge: 'Փաթեթ · Խնայել {percent}%',
packageIncludes: 'Ներառում է՝ {list}',
packageValidUntil: 'Առաջարկը գործում է մինչև {date}',
packageShowDetails: 'Դիտել ներառված ծառայությունները',
packageHideDetails: 'Թաքցնել մանրամասները',
packageItemSave: 'Խնայել {amount}',
packageSavePercent: 'Խնայել {percent}%',
packageScheduleEach: 'Բոլոր ծառայությունները կատարվում են մեկ այցի ընթացքում՝ հաջորդաբար',
packageIncludedServices: 'Ներառված ծառայություններ',
packageNoBlock: 'Այս փաթեթի համար հասանելի այց չի գտնվել',
packageContinueCheckout: 'Շարունակել վճարումը',
packageConfirmTitle: 'Հաստատել փաթեթը',
packageBookedTitle: 'Փաթեթը ամրագրված է',
packageBookedHint: 'Ձեր հանդիպումները հաստատված են',
packagePayAndBook: 'Վճարել և ամրագրել փաթեթը',
packageBook: 'Ամրագրել փաթեթը',
schedulePackage: 'Պլանավորել փաթեթը',
packageFindingSlots: 'Փնտրում ենք ամենամոտ հասանելի ժամերը…',
multiServiceCart: '{count} ծառայություն ընտրված',
multiServiceTotal: '{duration} · {price}',
multiServiceContinue: 'Շարունակել ընտրված ծառայություններով',
multiServiceSelectHint: 'Ընտրեք մեկ ծառայություն կամ երկու և ավելի՝ մեկ այցով ամրագրելու համար։',
multiServiceCheckoutTitle: 'Հաստատեք ձեր այցը',
multiServiceConfirmTitle: 'Պլանավորեք ձեր ծառայությունները',
multiServiceBookedTitle: 'Ամրագրումները կատարված են',
multiServiceBookedHint: 'Ձեր բազմածառայութային այցը հաստատված է։',
multiServiceWithProvider: '{name}-ի հետ',
multiServicePayAndBook: 'Վճարել և ամրագրել այցը',
multiServiceBook: 'Ամրագրել այցը',
multiServicePickBlock: 'Ընտրեք ժամանակային բլոկ',
multiServicePickBlockHint: 'Ընտրեք, թե երբ է սկսվում ձեր համակցված այցը։ Բոլոր ծառայությունները կատարվում են հաջորդաբար։',
servicesSection: 'Ծառայություններ',
dateLabel: 'Ամսաթիվ',
multiServiceFindingBlock: 'Փնտրում ենք ամենամոտ հասանելի ժամանակը…',
multiServiceLaterProviders: 'Ցուցադրել ավելի ուշ օրերի հասանելի մասնագետներին',
multiServiceEditServices: 'Խմբագրել ընտրված ծառայությունները',
multiServiceEditProvider: 'Փոխել մասնագետին',
multiServiceEditSchedule: 'Խմբագրել ամրագրման ժամանակը',
multiServiceRemoveService: '{name}-ը հեռացնել',
multiServiceIncompatibleDisabled: 'Չի կարող համակցվել ձեր ընտրության հետ',
exampleAvailable: 'Ազատ ժամեր երկուշաբթի և ուրբաթ՝ մերսման համար',
exampleServices: 'Լավագույն գնահատված մասնագետներ մերսման համար այս շաբաթ',
exampleBook: 'Ամրագրել մերսում վաղը ժամը 10:00-ին',
exampleLocation: 'Որտե՞ղ եք գտնվում',
signIn: 'Մուտք գործել',
signInWithGoogle: 'Մուտք գործել Google-ով',
signingIn: 'Մուտք է կատարվում…',
signOut: 'Դուրս գալ',
accountTitle: 'Իմ հաշիվը',
accountSignInPrompt: 'Մուտք գործեք Google-ով՝ ձեր ամրագրումները տեսնելու և պրոֆիլը կառավարելու համար',
myBookings: 'Իմ ամրագրումները',
myResults: {
  title: 'Իմ արդյունքները',
  empty: 'Ազատված լաբորատոր արդյունքներ դեռ չկան։ Դրանք կհայտնվեն այստեղ, երբ կլինիկան ազատի արդյունքները։',
  releasedOn: 'Ազատված',
  unnamedResult: 'Լաբորատոր արդյունք',
  loadFailed: 'Չհաջողվեց բեռնել լաբորատոր արդյունքները',
  measurement: 'Թեստ',
  value: 'Արդյունք',
  referenceRange: 'Նորմայի միջակայք',
  flag: 'Դրոշ',
},
myLabRequests: {
  title: 'Ամրագրելիք լաբորատոր հավաքումներ',
  empty: 'Սպասող լաբորատոր հավաքման ամրագրումներ չկան։',
  collectionService: 'Ամրագրել՝ {service}',
  requestedOn: 'Հարցում՝ {date}',
  bookCollection: 'Ամրագրել հավաքում',
  loadFailed: 'Չհաջողվեց բեռնել լաբորատոր ամրագրումների հարցումները',
},
patientAlerts: {
  regionLabel: 'Կլինիկայի ծանուցումներ',
  viewAction: 'Դիտել',
  dismiss: 'Փակել',
  titles: {
    TestResultReleased: 'Նոր լաբորատոր արդյունք',
    IntakeIncomplete: 'Նախայցային հարցաթերթիկը incomplete է',
    LabBookingRequestPending: 'Լաբորատոր հավաքում ամրագրել',
  },
  bodies: {
    TestResultReleased: '{testName}-ը պատրաստ է դիտման համար։',
    IntakeIncomplete: '{questionnaireTitle}-ը դեռ պահանջում է պատասխաններ այցից առաջ։',
    LabBookingRequestPending:
      'Ամրագրեք {collectionServiceName} պատվիրած թեստերի համար ({orderDisplayNames})։',
  },
},
myDocuments: {
  title: 'Իմ փաստաթղթերը',
  empty: 'Դեռ փաստաթղթեր չեն հրապարակվել։ Դրանք կհայտնվեն այստեղ, երբ կլինիկան ազատի դրանք։',
  openDocument: 'Բացել PDF',
  unnamedDocument: 'Փաստաթուղթ',
  loadFailed: 'Չհաջողվեց բեռնել փաստաթղթերը',
  categories: {
    lab_report: 'Լաբորատոր հաշվետվություն',
    referral_letter: 'Ուղղորդում',
    imaging_report: 'Ուղղորդված պատկեր',
    other: 'Այլ',
  },
},
noBookingsYet: 'Դուք դեռ ամրագրումներ չունեք',
bookingsLoadFailed: 'Չհաջողվեց բեռնել ձեր ամրագրումները',
bookingStatusCompleted: 'Ավարտված',
bookingStatusCancelled: 'Չեղարկված',
bookingStatusConfirmed: 'Հաստատված',
leaveReview: 'Թողնել կարծիք',
cancelBooking: 'Չեղարկել ամրագրումը',
cancelBookingConfirm: 'Չեղարկել այս հանդիպումը՞։ Սա չի կարող հետարկվել։',
cancelBookingFailed: 'Չհաջողվեց չեղարկել հանդիպումը',
rescheduleBooking: 'Փոխել ժամանակը',
rescheduleBookingFailed: 'Չհաջողվեց փոխել ժամանակը',
packageVisitTitle: 'Փաթեթային այց՝ {name}',
packageVisitAppointmentCount: '{count} հանդիպում այս այցում',
cancelPackageVisit: 'Չեղարկել ամբողջ փաթեթային այցը',
cancelPackageVisitConfirm: 'Չեղարկել այս փաթեթային այցի բոլոր հանդիպումները՞։ Սա չի կարող հետարկվել։',
cancelPackageVisitFailed: 'Չհաջողվեց չեղարկել փաթեթային այցը',
reschedulePackageVisit: 'Վերապլանավորել ամբողջ այցը',
reschedulePackageVisitHint: 'Ընտրեք նոր օր և մեկնարկի ժամ — բոլոր ծառայությունները տեղափոխվում են միասին',
reschedulePackageVisitSummary: 'Տեղափոխել բոլոր {count} ծառայությունները դեպի {date}՝ սկսած {time}-ից',
confirmReschedulePackageVisit: 'Հաստատել այցի վերապլանավորումը',
reschedulePackageVisitFailed: 'Չհաջողվեց վերապլանավորել փաթեթային այցը',
reschedulePackageVisitSuccess: 'Այցը տեղափոխվեց {from}-ից դեպի {to}',
packageVisitRescheduleUnavailable: 'Այս այցը չի կարող վերապլանավորվել առցանց (փաթեթի կատալոգի հղումը բացակայում է). կապվեք բիզնեսի հետ',
confirmReschedule: 'Հաստատել նոր ժամանակը',
pickNewTime: 'Ընտրեք նոր ամսաթիվ և ժամ',
loadingSlots: 'Բեռնվում են հասանելի ժամերը…',
rescheduleSummary: 'Նոր ժամ՝ {date} ժամը {time}',
rescheduleSuccessDetail: 'Տեղափոխվել է {from}-ից դեպի {to}',
rescheduleCountHint: '{count}/{max} վերապլանավորում օգտագործված է',
manageBooking: 'Կառավարել ամրագրումը',
manageBookingTitle: 'Կառավարեք ձեր հանդիպումը',
manageBookingInvalidLink: 'Այս հղումը անվավեր է կամ ժամկետանց',
manageBookingSignInHint: 'Մուտք գործեք նույն էլ. փոստով, որով կատարել եք ամրագրումը',
manageBookingSignInPrompt: 'Մուտք գործեք Google-ով՝ {email}-ով այս հանդիպումը կառավարելու համար',
manageBookingEmailHint: 'Մուտք գործեք {email}-ով “Իմ հաշիվ”-ում՝ բոլոր ամրագրումները կառավարելու համար',
paymentMethod: 'Վճարման եղանակ',
payOnline: 'Վճարել առցանց',
payCashAtVisitShort: 'Վճարել տեղում',
payCashAtVisit: 'Վճարեք {amount} տեղում՝ այցի ժամանակ',
confirmCashBooking: 'Հաստատել ամրագրումը (վճարում տեղում)',
reviewSignedInHint: 'Ձեր կարծիքը կկապվի ձեր հաշվի հետ',
signInCancelled: 'Մուտքը չեղարկվեց',
signInFailed: 'Չհաջողվեց մուտք գործել. ստուգեք սերվերը և փորձեք կրկին',
promoCode: 'Պրոմո կոդ',
promoCodePlaceholder: 'Պրոմո կամ նվեր քարտ (GC-...)',
applyPromo: 'Կիրառել',
discountGiftCard: 'Նվեր քարտ',
loyaltyPoints: 'Բոնուսային միավորներ',
loyaltyBalance: '{points} բոնուս ({value})',
useMaxPoints: 'Օգտագործել առավելագույնը',
discountPromo: 'Պրոմո զեղչ',
discountLoyalty: 'Միավորների զեղչ',
pointsToEarn: 'Դուք կստանաք {points} միավոր այցից հետո',
totalDue: 'Վճարման ենթակա',
    taxIncluded: 'ներառված',
freeAfterDiscounts: 'Անվճար զեղչերից հետո',
promoInvalid: 'Պրոմո կոդը անվավեր է կամ ժամկետանց',
quoteFailed: 'Չհաջողվեց թարմացնել գինը. փորձեք կրկին',
giftCards: {
  title: 'Գնել նվեր քարտ',
  subtitle: 'Նվիրեք ինքնախնամք՝ թվային կամ ֆիզիկական ձևով',
  chooseType: 'Ի՞նչ եք ցանկանում նվիրել',
  type: {
    monetary: 'Գումար',
    service: 'Ծառայություն',
    bundle: 'Փաթեթ',
    package: 'Ծառայությունների փաթեթ',
    subscription: 'Բաժանորդագրություն',
  },
  typeDescription: {
    monetary: 'Դոլարային գումար, որը կարող են օգտագործել ցանկացած ամրագրման համար։',
    service: 'Մեկ կամ մի քանի առանձին ծառայություններ։',
    bundle: 'Բիզնեսի կողմից կազմված ծառայությունների համադրություն։',
    package: 'Այս բիզնեսի գոյություն ունեցող փաթեթ (նույնը՝ Փաթեթներ էջում)։',
    subscription: 'Այս բիզնեսի գոյություն ունեցող բաժանորդագրության պլան (նույնը՝ ծառայության «Subscribe & save»-ում)։',
  },
  packagePurchaseHint: 'Ստորև ընտրեք փաթեթ։ Ստացողը կօգտագործի կոդը՝ ներառված այցելությունները ամրագրելու համար։',
  subscriptionPurchaseHint: 'Ստորև ընտրեք պլան։ Ստացողը մուտք կգործի և կօգտագործի կոդը՝ իր բաժանորդագրությունն ակտիվացնելու համար։',
  packageBadge: 'Փաթեթ',
  packageSaveBadge: 'Խնայեք {percent}%',
  subscribeAndSaveBadge: 'Բաժանորդագրվեք և խնայեք',
  subscriptionAppointments: 'այցելություններ',
  subscriptionMonths: 'ամիս',
  redeemSectionTitle: 'Ստացված նվերի կոդի ակտիվացում',
  claimTitle: 'Մարել նվերի կոդը ձեր հաշվում',
  claimHint:
    'Միայն ստացողների համար է՝ ոչ գնման համար։ Տեղադրեք ձեր էլ. փոստով ստացած կոդը: GCP-… կամ GCU-… ավելացնում է փաթեթ կամ բաժանորդագրություն, իսկ GCS-… կամ GCB-… ծառայության կրեդիտներ է ավելացնում այստեղ՝ օգտագործելու համար վճարման պահին։',
  claimNotBuying: 'Եթե ցանկանում եք նվեր քարտ գնել ուրիշի համար, օգտագործեք «Գնել նվեր քարտ» տարբերակը ձեր պրոֆիլից։',
  claimPlaceholder: 'Նվերի կոդ էլ. փոստից',
  claimSubmit: 'Ակտիվացնել կոդը',
  claimSuccess: 'Նվերը հաջողությամբ ակտիվացվեց։',
  claimPackageSuccess: 'Փաթեթը ավելացվել է ձեր հաշվին։ Ձեր այցելությունները կարող եք ամրագրել ամրագրման էջից։',
  claimSubscriptionSuccess: 'Բաժանորդագրությունը ավելացվել է ձեր հաշվին։',
  claimServiceSuccess:
    'Ծառայության նվերը պահպանվել է ձեր հաշվին։ Օգտագործեք այս կոդը ամրագրման ժամանակ համապատասխան ծառայությունների համար։',
  claimBundleSuccess:
    'Փաթեթային նվերը պահպանվել է ձեր հաշվին։ Օգտագործեք այս կոդը ամրագրման ժամանակ համապատասխան ծառայությունների համար։',
  amountHint: 'Ընտրեք պատրաստի գումար կամ մուտքագրեք ձեր սեփականը։',
  selectService: 'Ընտրեք ծառայություն',
  selectServicesHint: 'Ընտրեք մեկ կամ մի քանի ծառայություն՝ նվեր քարտի մեջ ներառելու համար։',
  selectedServices: '{count} ծառայություն ընտրված է',
  bundleSelected: 'Փաթեթը ընտրված է',
  continueCheckout: 'Շարունակել վճարմանը',
  checkoutTitle: 'Նվեր քարտի վճարում',
  yourDetailsSection: 'Ձեր տվյալները',
  recipientSection: 'Ստացող',
  buyForSelf: 'Ինձ համար',
  buyAsGift: 'Որպես նվեր',
  purchaserName: 'Ձեր անունը',
  purchaserNameRequired: 'Խնդրում ենք մուտքագրել ձեր անունը։',
  purchaserEmail: 'Ձեր էլ. փոստը (կտրոնի համար)',
  recipientName: 'Ստացողի անունը',
  recipientEmail: 'Ստացողի էլ. փոստը',
  personalMessage: 'Անհատական հաղորդագրություն (ըստ ցանկության)',
  deliverySection: 'Առաքում',
  delivery: {
    digital: 'Թվային',
    physical: 'Ֆիզիկական',
  },
  addressLine1: 'Հասցե 1-ին տող',
  addressLine2: 'Հասցե 2-րդ տող (ըստ ցանկության)',
  city: 'Քաղաք',
  postalCode: 'Փոստային ինդեքս',
  country: 'Երկիր',
  deliveryInstructions: 'Առաքման հրահանգներ (ըստ ցանկության)',
  shipping: 'Առաքում',
  payNow: 'Վճարել քարտով',
  successTitle: 'Նվեր քարտը գնված է',
  successBody:
    'Մենք ուղարկել ենք ձեր նվեր քարտի տվյալները էլ. փոստով։ Ֆիզիկական պատվերների դեպքում մենք կտեղեկացնենք պատրաստման և առաքման ընթացքի մասին։',
  paymentFailed: 'Վճարման հաստատումը ձախողվեց։ Եթե գումարը գանձվել է, կապվեք բիզնեսի հետ։',
  quoteFailed: 'Չհաջողվեց հաշվարկել գինը։',
  checkoutFailed: 'Չհաջողվեց սկսել վճարումը։',
  emailRequired: 'Գնորդի էլ. փոստը պարտադիր է։',
  buyGiftCard: 'Գնել նվեր քարտ',
  nav: 'Նվեր քարտեր',
  myGiftCards: 'Իմ նվեր քարտերը',
  myOrderedGiftCards: 'Իմ գնած նվեր քարտերը',
  myRedeemedGiftCards: 'Իմ ակտիվացրած նվեր քարտերը',
  noOrders: 'Դեռևս նվեր քարտերի գնումներ չկան։',
  noRedeemed:
    'Դեռևս ակտիվացված նվեր քարտեր չկան։ Տեղադրեք կոդը վերևում, երբ ինչ-որ մեկը ձեզ նվիրում է փաթեթ, բաժանորդագրություն կամ ծառայությունների փաթեթ։',
  redeemedHint: 'Կոդով ակտիվացված նվերներ՝ փաթեթներ, բաժանորդագրություններ կամ ծառայությունների կրեդիտներ։',
  claimedOn: 'Ակտիվացվել է {date}',
  redeemedPackageHint: 'Այս փաթեթը ձեր հաշվին է՝ ստորև կարող եք ամրագրել ներառված այցելությունները։',
  redeemedSubscriptionHint: 'Այս բաժանորդագրությունը ակտիվ է ձեր հաշվին։',
  redeemedServiceHint:
    'Օգտագործեք այս կոդը ամրագրման ժամանակ՝ համապատասխան ծառայությունները ծածկված են ձեր կրեդիտներով։',
  creditsRemaining: 'մնացորդ',
  bookToUse: 'Ամրագրել այցելություն →',
  balance: 'մնացորդ',
  active: 'Ակտիվ',
  inactive: 'Ակտիվ չէ',
  statusCancelled: 'Չեղարկված',
  cancelOrder: 'Չեղարկել պատվերը',
  cancelSuccess: 'Ձեր նվեր քարտի պատվերը չեղարկվեց։',
  cancelRefunded: 'Ձեր պատվերը չեղարկվեց, և գումարը վերադարձվել է ձեր վճարման եղանակին։',
  cancelRefundFailed:
    'Պատվերը չեղարկվել է, բայց ավտոմատ վերադարձը չի հաջողվել։ Խնդրում ենք կապվել բիզնեսի հետ։',
  modifyOrder: 'Փոփոխել պատվերը',
  cancelConfirm: 'Հաստատե՞լ այս նվեր քարտի պատվերի չեղարկումը։',
  cancelModalTitle: 'Նվեր քարտի պատվերի չեղարկում',
  confirmCancellation: 'Հաստատել չեղարկումը',
  requestNotesPlaceholder: 'Ըստ ցանկության՝ պատճառ կամ նշումներ մեր թիմի համար',
  cancelWindow: 'Չեղարկման ժամանակահատված',
  modifyWindow: 'Չեղարկման ժամանակահատված',
  requestStatus: 'Հարցման կարգավիճակ',
  requestNotes: 'Նշումներ մեր թիմի համար (ըստ ցանկության)',
  submitModify: 'Ուղարկել փոփոխման հարցում',
  confirmCashPurchase: 'Հաստատել կանխիկ գնումը',
  payCashAtVisit: '{amount} վճարել կանխիկ՝ ստանալու կամ առաքման պահին։',
  noPointsToEarn: 'Բոնուսային կրեդիտ չի կուտակվում — վճարված է loyalty բոնուսներով',
howToBook: 'Ինչպե՞ս եք ցանկանում ամրագրել',
useSubscription: 'Օգտագործել բաժանորդագրություն',
appointmentsLeft: 'այցելություն մնացել է',
expiresOn: 'ավարտվում է',
freeThisVisit: 'Այս այցելությունը՝ $0',
oneTimeAppointment: 'Միանվագ այցելություն',
subscribeAndSave: 'Բաժանորդագրվեք և խնայեք',
chooseSubscriptionPlan: 'Ընտրեք բաժանորդագրության պլան',
saveAmount: 'խնայեք {amount}',
subscriptionPlanRequired: 'Խնդրում ենք ընտրել բաժանորդագրության պլան',
},
}
};

export default hy;
