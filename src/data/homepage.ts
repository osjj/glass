// Homepage presentation content. Keep statements focused on the catalog and
// sourcing workflow rather than unsupported company or customer claims.
export const homeCollections = [
  { label: "Drinkware", image: "drinkware", category: "glass-tumblers", query: "glass cup" },
  { label: "Tableware", image: "tableware", category: "glass-bowls", query: "glass bowl" },
  { label: "Serveware", image: "serveware", category: "glass-pitchers-teapot", query: "glass pitcher" },
  { label: "Storage", image: "storage", category: "glass-jars", query: "glass storage" },
  { label: "Bakeware", image: "bakeware", category: "baking-glassware", query: "glass baking" },
  { label: "Colored Glass", image: "colored", category: "colored-glassware", query: "colored glass" },
] as const;
export const homeSourcingSteps = [
  { title: "Share your idea", description: "Tell us your concept, market, and requirements." },
  { title: "Design & sample", description: "Review the shape, decoration, and finished sample." },
  { title: "Plan production", description: "Turn the approved brief into a clear production plan." },
  { title: "Confirm delivery", description: "Align packing and destination requirements." },
] as const;
export const homeTopicDescriptions = [
  "Bars, promotions and souvenirs", "Service, size and handling",
  "Cups, teapots and serving sets", "Decanters, stemware and gift packing",
  "Capacity, shapes and lid fit",
] as const;
export const homeSourcingPrinciples = [
  { value: "Explore", label: "Curated collections" }, { value: "Compare", label: "Structured details" },
  { value: "Plan", label: "Customization options" }, { value: "Inquire", label: "Project requirements" },
] as const;
export const homeSourcingStrengths = [
  { title: "Catalog-led discovery", description: "Browse focused glassware collections and move quickly from category to product." },
  { title: "Structured product review", description: "Compare the model, material, capacity, decoration and packing details that matter." },
  { title: "Customization planning", description: "Shape a clearer brief around form, finish, branding and intended market." },
  { title: "Sample-focused decisions", description: "Use samples to review proportions, decoration and presentation before confirmation." },
  { title: "Packing and delivery alignment", description: "Bring packing, destination and timing requirements into the discussion early." },
] as const;
export const homeServices = [
  { title: "Pattern Design", description: "Explore patterns, shapes and sizes for your collection.", image: "service-pattern-design", alt: "Pattern sketches and decorated glass cups on a design table" },
  { title: "Custom Model", description: "Develop shapes and sizes around your product idea.", image: "service-custom-model", alt: "Glass forming moulds and drawings on a workshop table" },
  { title: "Production Planning", description: "Coordinate production requirements for wholesale glassware projects.", image: "service-bulk-manufacturing", alt: "Glassware production equipment in warm furnace light" },
  { title: "Delivery Planning", description: "Align packing, timing and destination requirements before confirmation.", image: "service-fast-delivery", alt: "Packed glassware cartons in a shipping container" },
  { title: "Sample Review", description: "Confirm materials, proportions and decoration before production.", image: "service-free-samples", alt: "Clear and colored glassware samples on showroom shelves" },
  { title: "Product Design", description: "Laser engraving or logo printing for your glassware.", image: "service-product-design", alt: "Precision decoration of a clear glass tumbler" },
] as const;
export const homeExhibitions = [
  { image: "exhibition-display-v3", aspectRatio: "500 / 460", title: "Exhibition displays", description: "Glassware collections presented in person.", alt: "AI-generated Canton Fair-style glassware booth with Glarivo signage" },
  { image: "exhibition-meeting-v3", aspectRatio: "500 / 240", title: "Trade-show meetings", description: "Product conversations around the table.", alt: "AI-generated two-photo collage of fictional buyers and densely stocked glassware exhibition displays" },
  { image: "market-research-v3", aspectRatio: "500 / 208", title: "Market research", description: "Listening to customers and local markets.", alt: "AI-generated three-photo collage of fictional international buyers and representatives at glassware booths" },
  { image: "customer-visit-v3", aspectRatio: "500 / 460", title: "Customer visits", description: "Building understanding through direct contact.", alt: "AI-generated seven-photo collage of fictional customer visits, meetings and glassware exhibition groups" },
] as const;
export const homeBuyerScenarios = [
  { segment: "Retail", title: "Build a coordinated shelf range", summary: "Compare shapes, sizes and finishes across a focused collection.", focus: "Range planning", image: "category-drinkware", alt: "Editorial drinkware collection arranged for range planning" },
  { segment: "Foodservice", title: "Plan glassware for service needs", summary: "Review formats, handling needs and presentation for the intended setting.", focus: "Use-case review", image: "category-tableware", alt: "Editorial tableware collection arranged for foodservice planning" },
  { segment: "Gifting", title: "Shape a presentation-ready set", summary: "Consider decoration, coordinated pieces and packaging as one brief.", focus: "Decoration and packing", image: "category-colored", alt: "Editorial colored glassware collection arranged for gifting" },
  { segment: "Wholesale", title: "Organize a clear buying shortlist", summary: "Group products by category and compare the key details before inquiry.", focus: "Catalog comparison", image: "category-storage", alt: "Editorial storage glassware collection arranged for wholesale review" },
  { segment: "Custom projects", title: "Turn an idea into a sample brief", summary: "Outline shape, finish, branding and packing requirements for review.", focus: "Sample preparation", image: "category-serveware", alt: "Editorial serveware collection arranged for a custom project" },
] as const;
