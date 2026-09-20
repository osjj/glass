import type { CustomerCaseStudy } from "./shangri-la-case-study";

export type DesignCaseStudy = {
  kind: "design-study";
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

export type CaseStudy = DesignCaseStudy | CustomerCaseStudy;

// Customer projects are managed in the CMS. The former hotel concept now lives in Blog.
export const caseStudies: CaseStudy[] = [];
// Keep retired addresses reserved: their permanent redirects take precedence over pages.
export const retiredCaseStudySlugs = [
  "glarivo-hotel-glassware-customization",
  "garbo-hotel-glassware-color-customization",
];

export function getCaseStudy(slug: string) {
  return caseStudies.find((study) => study.slug === slug);
}
