export type ProjectSection = {
  id: string;
  title: string;
  navLabel: string;
  paragraphs: string[];
  image?: { url: string; alt: string; caption: string };
  points?: Array<{ title: string; text: string }>;
  table?: { caption: string; headings: string[]; rows: string[][] };
};

export type CustomerCaseStudy = {
  kind: "customer-project";
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  updatedAt: string;
  introduction: string;
  coverImage?: string;
  coverImageAlt?: string;
  stats: Array<{ value: string; label: string }>;
  sections: ProjectSection[];
  conclusion: string;
  relatedLinks: Array<{ href: string; label: string }>;
};

// Adapted from the owner's Chinese project account, confirmed as a real project.
export const shangriLaCaseStudy: CustomerCaseStudy = {
  kind: "customer-project",
  slug: "shangri-la-hotel-guestroom-glassware",
  title: "Shangri-La Hotel Guestroom Glassware Customization: From Brief to Delivery",
  excerpt: "How Glarivo developed four types of guestroom glassware for a 420-room Shangri-La resort, refining samples, coordinating three shipments and supporting repeat procurement.",
  category: "Hospitality · Guestroom glassware",
  updatedAt: "2026-09-19T00:00:00.000Z",
  introduction: "A customer project for a Shangri-La resort renovating its guestrooms. Glarivo coordinated glass selection, discreet logo decoration, sample revisions, testing and delivery for an initial order of approximately 3,700 pieces.",
  stats: [
    { value: "420", label: "Guestrooms covered" },
    { value: "~3,700", label: "Pieces in the initial order" },
    { value: "4", label: "Glassware types" },
    { value: "3", label: "Delivery batches" },
  ],
  sections: [
    {
      id: "project-brief",
      title: "The brief: a coordinated collection for daily guestroom use",
      navLabel: "Project brief",
      paragraphs: [
        "The hotel wanted to upgrade the glasses used at the washbasin, on the refreshment tray and in the minibar. The collection needed to reflect the property's understated style while meeting the housekeeping team's practical requirements: comfortable rims, stable bases, frequent dishwasher cleaning and unobtrusive branding.",
        "We responded to the RFQ on the same day and clarified the brief with purchasing, housekeeping, food and beverage, and brand representatives. The discussion covered capacity, weight, dishwasher temperature, detergent, storage, logo treatment, protective packaging and replacement stock. This turned a visual brief into decisions that the hotel could review against physical samples.",
      ],
    },
    {
      id: "product-selection",
      title: "Product selection: four glass types, one consistent direction",
      navLabel: "Product selection",
      paragraphs: [
        "We presented three design directions: a classic straight-sided tumbler collection, a slightly waisted bathroom option, and a minibar selection. The hotel chose the classic straight-sided glasses together with the minibar glasses for their ease of cleaning, replenishment and fit with the guestrooms' wood and stone surfaces.",
        "The specification called for lead-free crystal glass, smooth rims and a discreet 8 mm logo at the center of the base. Drawings brought the glass proportions, rim details, base dimensions and logo placement into the same review. The four capacities below describe the selected project brief.",
      ],
      table: {
        caption: "Glassware selected for the guestroom collection",
        headings: ["Glass type", "Capacity", "Service setting"],
        rows: [
          ["Rinse tumbler", "220 mL", "Bathroom washbasin"],
          ["Water tumbler", "300 mL", "Guestroom refreshment tray"],
          ["Red wine glass", "350 mL", "Minibar wine service"],
          ["Whisky glass", "300 mL", "Minibar spirits service"],
        ],
      },
    },
    {
      id: "sample-revisions",
      title: "Sample approval: changes driven by the people using the glasses",
      navLabel: "Sample revisions",
      paragraphs: [
        "The first round of samples was prepared within seven days of design confirmation. We checked rim feel, capacity, weight and logo clarity before the hotel compared the samples with its existing glassware. Housekeeping staff and the food and beverage manager took part in the handling review.",
        "The feedback led to specific changes rather than a new visual direction. After reviewing the second round of samples, the hotel signed the sample approval record and the project moved into testing.",
      ],
      points: [
        { title: "A smoother rinse-tumbler rim", text: "The rim profile was refined following a request for an additional 0.2 mm rounding adjustment to improve contact at the lip." },
        { title: "More grip at the water-tumbler base", text: "The anti-slip texture was deepened following the hotel's handling review." },
        { title: "A stronger wine-glass stem", text: "Stem thickness was increased by 0.5 mm in response to service-team feedback." },
        { title: "A quieter logo finish", text: "The reflective logo treatment was changed to a frosted etched finish, keeping the brand detail visible without drawing attention away from the glass." },
      ],
    },
    {
      id: "testing-quality",
      title: "Testing and quality control before release",
      navLabel: "Testing & quality",
      paragraphs: [
        "The sample test results included 500 dishwasher cycles without haze or cracking and a thermal-shock check from 80°C to 20°C without breakage. Lead and cadmium migration and rim-edge stress were also checked. The reports were supplied with the contract documentation and reviewed by the hotel's engineering team before production was scheduled.",
        "During production, inspections covered visible defects, dimensions and capacity, logo position and clarity, and glass stress. The project contract specified AQL 2.5 sampling. Retained samples and batch references supported traceability through receiving and replenishment.",
        "These results relate to the samples and testing carried out for this project. The selected glass, decoration and agreed test conditions formed part of the approval process.",
      ],
    },
    {
      id: "packing-delivery",
      title: "Packaging and delivery planned around the room rollout",
      navLabel: "Packaging & delivery",
      paragraphs: [
        "The initial order was arranged in three deliveries: stock for the model rooms, a second shipment covering approximately half the guestrooms, and the remaining stock. The contract set the first dispatch at 45 days after sample confirmation. This dispatch milestone was separate from transport, receiving and the hotel's room-opening schedule.",
        "Five-ply corrugated cartons and EPE protection separated the glasses during transit. Outer cartons identified the hotel, glass type, quantity and fragile contents. The shipment traveled by sea and road to the hotel warehouse, where the receiving team carried out a 10% inspection.",
        "The reported arrival breakage rate was 0.3%, below the contract's 1% threshold. Replacement pieces were arranged to support the model-room opening. At handover, housekeeping received care guidance covering cleaning, handling, damage checks and the use of batch references when requesting replenishment.",
      ],
      points: [
        { title: "Design confirmation → first samples", text: "First-round samples prepared within seven days, followed by the hotel's review and a second sample round." },
        { title: "Sample confirmation → first dispatch", text: "A 45-day first-dispatch milestone specified in the project contract, with delivery divided into three batches." },
        { title: "In-service use → six-month review", text: "A follow-up review with the hotel covered breakage, housekeeping feedback and ongoing purchasing needs." },
      ],
    },
    {
      id: "results-repeat-orders",
      title: "Six-month feedback and repeat procurement",
      navLabel: "Results & repeat orders",
      paragraphs: [
        "Once the collection was in service, housekeeping reported positive feedback on rim comfort, base grip, clarity after washing and the restrained logo treatment. At the six-month project review, the hotel reported 0.8% breakage attributed to causes other than handling damage and a housekeeping satisfaction score of 4.7 out of 5.",
        "The hotel decided to enter an annual framework agreement for continued room supply, extending the selection to champagne glasses and glass vases. Follow-up refinements included a recessed logo treatment, further wine-stem reinforcement and recycling markings on the packaging.",
      ],
      table: {
        caption: "Outcomes from the project delivery and six-month review",
        headings: ["Measure", "Result", "Scope"],
        rows: [
          ["Arrival breakage", "0.3%", "Reported at receiving; contract threshold: 1%"],
          ["In-service breakage", "0.8%", "Six-month review; excluding handling damage"],
          ["Housekeeping satisfaction", "4.7 / 5", "Housekeeping feedback at the project review"],
          ["Repeat procurement", "Annual framework agreement", "Continued room supply, plus champagne glasses and vases"],
        ],
      },
    },
  ],
  conclusion: "This project connected the hotel's visual requirements with the details that mattered in daily service: rim comfort, base grip, logo finish and replacement planning. Share your room count, glass types, artwork, quantities and delivery schedule with Glarivo to discuss a collection for your property.",
  relatedLinks: [
    { href: "/products/category/glass-tumblers", label: "Explore drinking glasses" },
    { href: "/guides/restaurant-bar-glassware", label: "Restaurant & bar buying guide" },
    { href: "/case-studies/glarivo-hotel-glassware-customization", label: "Hotel glassware design study" },
  ],
};
