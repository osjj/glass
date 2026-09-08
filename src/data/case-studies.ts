export type CaseStudy = {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  updatedAt: string;
  introduction: string;
  brief: string;
  objective: string;
  decisions: Array<{ title: string; text: string }>;
  approvalSteps: Array<{ title: string; text: string }>;
  conclusion: string;
  relatedLinks: Array<{ href: string; label: string }>;
};

// Original Glarivo design studies. Completed customer projects require supporting records.
export const caseStudies: CaseStudy[] = [
  {
    slug: "glarivo-hotel-glassware-customization",
    title: "Glarivo hotel glassware: a coordinated concept for rooms and lounges",
    excerpt: "Our hotel glassware design study brings together a versatile tumbler, a considered color palette and packaging planned around daily service.",
    category: "Hospitality · Custom glassware",
    updatedAt: "2026-09-07T00:00:00.000Z",
    introduction: "A Glarivo design study showing how we would approach a hotel glassware brief, from product selection to sample approval.",
    brief: "For this concept, we set a brief around two hotel settings: a guest-room refreshment tray and a relaxed lounge table. The glassware should feel like part of the same collection while leaving room for a different finish in each setting. We start with one tumbler silhouette and consider its proportions alongside the tray, serving area and available storage. Color and a small brand detail provide the visual connection; the exact glass and decoration method remain subject to sample review.",
    objective: "Our aim is to develop a collection that is coherent for guests and clearly specified for the purchasing and receiving teams. The proposal brings the glass, artwork, finish references and packing instructions into one brief so that each choice can be reviewed before an order is agreed.",
    decisions: [
      {
        title: "One silhouette, two service settings",
        text: "We begin with a compact tumbler as the common element across the concept. For the room tray, we explore a quiet, understated finish; for the lounge, a colored option adds a more distinctive accent. The shortlist would be reviewed against the intended drinks, tray dimensions and storage layout. Capacity, dimensions and handling suitability would be confirmed for the selected item before the specification is finalized.",
      },
      {
        title: "Make the brand detail part of the glass",
        text: "Our proposed visual direction pairs a restrained color palette with a small logo placement, leaving the shape of the glass as the focus. We would prepare artwork references showing the logo size, position and proposed finish, then review a decorated sample under the venue’s lighting. The selected decoration method and care instructions need to be confirmed for the finished glass, including any coating or printed detail.",
      },
      {
        title: "Plan the pack around hotel receiving",
        text: "We separate the presentation decision from the delivery requirements: a guest-facing pack may need a different treatment from stock going directly into service. The packing brief would identify each finish, the agreed pack quantity and the destination department. We would review the proposed inner protection, unit pack and shipping carton together, with clear item references to help staff sort the collection on arrival.",
      },
    ],
    approvalSteps: [
      { title: "Define the brief", text: "Confirm the service settings, shortlisted glass, quantities by finish, artwork files and delivery destination. Record the points that still need a decision." },
      { title: "Review the sample", text: "Check the finished glass and proposed packaging together. Review proportions, color and logo placement, and record any requested revisions." },
      { title: "Agree the specification", text: "Reference the approved sample and artwork revision in the order documents, alongside packing details, inspection requirements and the agreed schedule." },
      { title: "Check on arrival", text: "Use the agreed specification to check item references, finish variants and packing. Record any discrepancies by item and batch for follow-up." },
    ],
    conclusion: "This Glarivo concept sets out a coordinated direction for hotel glassware and a practical route to an order-ready specification. For your project, share the service setting, preferred glass style, artwork and planned quantities with us. These details form the starting point for discussing product options, customization and packaging.",
    relatedLinks: [
      { href: "/products/category/glass-tumblers", label: "Explore drinking glasses" },
      { href: "/products/category/colored-glassware", label: "Explore colored glassware" },
      { href: "/guides/restaurant-bar-glassware", label: "Restaurant & bar buying guide" },
    ],
  },
];

export function getCaseStudy(slug: string) {
  return caseStudies.find((study) => study.slug === slug);
}
