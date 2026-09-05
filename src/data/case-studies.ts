export type CaseStudy = {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  updatedAt: string;
  disclosure: string;
  reportedSummary: string;
  evidenceNote: string;
  decisions: Array<{ title: string; text: string }>;
  approvalSteps: Array<{ title: string; text: string }>;
  conclusion: string;
  sources: Array<{ id: string; title: string; url: string; note: string }>;
  relatedLinks: Array<{ href: string; label: string }>;
};

// Public-source reviews are editorial analysis, never Glarivo customer references.
// Keep supplier-reported facts separate from our recommendations and retain attribution.
export const caseStudies: CaseStudy[] = [
  {
    slug: "garbo-hotel-glassware-color-customization",
    title: "Hotel glassware customization: a review of Garbo’s published case",
    excerpt: "An industry case review exploring how to turn a hotel glassware concept into a clear brief for color, decoration and packaging.",
    category: "Hospitality · Custom glassware",
    updatedAt: "2026-09-05T08:00:00.000Z",
    disclosure: "Glarivo editorial review of a case reported by Garbo Glassware. This is not a Glarivo-delivered project. The customer is unnamed in the source, and the project has not been independently verified.",
    reportedSummary: "In an article dated August 29, 2025, Garbo describes a European hotel group seeking distinctive minibar glassware. Its account pairs region-inspired colors with decorated whiskey glasses and branded packaging. The article also describes engraved crests and silicone base rings. These are supplier-reported details, rather than a specification independently checked by Glarivo.",
    evidenceNote: "The source does not identify the hotel group or provide underlying order records or a customer confirmation. We therefore draw no verified conclusion about delivery or commercial performance. The useful focus of this review is the buying brief, not a claimed business result.",
    decisions: [
      {
        title: "Turn a color idea into an approval reference",
        text: "For a buyer planning a similar range, a mood board is only a starting point. Record the selected glass reference, the area to be colored and the intended appearance under the venue’s lighting. Compare a decorated physical sample against the agreed color reference. If several locations need different finishes, assign a separate reference to each version so that future orders can be checked against the correct sample.",
      },
      {
        title: "Review the complete glass in its service setting",
        text: "A logo and an accessory can change how a glass fits a tray, rack or shelf. Ask for a drawing showing the artwork position and review the finished sample with every proposed component attached. Check handling and cleaning instructions for that exact finished item. A catalog description of the base glass should not be treated as evidence for the performance of a later coating, decoration or added part.",
      },
      {
        title: "Specify packaging for the receiving team",
        text: "Start with the destination: individual hotel departments, a central warehouse or a retail display may need different identification and packing arrangements. Record how variants are separated, which references appear on labels and how the receiving team will recognize each version. Approve the unit pack and shipping carton together. Ask for documentation if a packaging certification is part of the purchasing requirement.",
      },
    ],
    approvalSteps: [
      { title: "Brief", text: "List the intended use, product references, finish variants, quantities per version and delivery destination. Mark unresolved requirements explicitly." },
      { title: "Finished sample", text: "Review the decorated glass and proposed pack together. Keep photographs, an approval date and a physical reference where practical." },
      { title: "Written order", text: "Record the accepted sample revision, packaging details, agreed tolerances and inspection requirements in the order documents." },
      { title: "Receiving review", text: "Compare arriving goods with the agreed reference. Log discrepancies by item and batch before making claims about the project’s outcome." },
    ],
    conclusion: "For your own project, the practical deliverable is a traceable set of decisions: which glass, which finish, which artwork and which pack. An attractive concept becomes easier to quote and review when those decisions are written down. Use the collections below to build a shortlist; their inclusion does not imply that those products were supplied to the hotel in Garbo’s account.",
    sources: [
      {
        id: "garbo-case",
        title: "Garbo: Capturing Global Drinkware Demand: The Competitive Edge of Spray-Colored Glassware",
        url: "https://www.garboglass.com/news/capturing-global-drinkware-demand-the-competitive-edge-of-spray-colored-glassware.html",
        note: "Published August 29, 2025. Primary source for the supplier-reported hotel case; reviewed September 5, 2026.",
      },
      {
        id: "garbo-service",
        title: "Garbo: Service",
        url: "https://www.garboglass.com/services/service/",
        note: "Reviewed September 5, 2026. Garbo describes design, pre-production samples, inspection and shipment support in general; this page does not verify the hotel project.",
      },
    ],
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
