export type GuideCluster = {
  slug: string;
  title: string;
  eyebrow: string;
  description: string;
  audience: string;
  categories: Array<{ slug: string; label: string }>;
  decisions: Array<{ title: string; text: string }>;
  checklist: string[];
};

// Editorial groupings follow buying decisions; they do not change catalog taxonomy.
export const guideClusters: GuideCluster[] = [
  {
    slug: "shot-glass-sourcing", title: "Shot Glass Sourcing", eyebrow: "Bars · promotions · souvenirs",
    description: "Choose shot glasses around the pour, the presentation and the packing. Compare capacity, shape and decoration before preparing a wholesale order.",
    audience: "For bar buyers, promotional distributors and gift shops building a repeatable shot glass assortment.",
    categories: [{ slug: "shot-glass", label: "Shot glasses" }],
    decisions: [
      { title: "Define the capacity", text: "Separate the intended serving volume from brimful capacity. Ask for milliliters, the fluid-ounce convention and a physical sample; a size in the product title is not a calibrated pour mark." },
      { title: "Match shape to the channel", text: "Compare a short thick-base glass for bar service with a taller profile for souvenir artwork. Check the actual outside dimensions against trays, display shelves and carton dividers." },
      { title: "Approve the finished piece", text: "Review the glass, artwork placement and retail pack together. Confirm decoration care, assortment quantities and the approved sample revision before accepting the final quotation." },
    ],
    checklist: ["Intended serving volume and destination market", "Selected product references and quantities per design", "Artwork size, placement and color references", "Unit pack, inner pack and master-carton requirements"],
  },
  {
    slug: "restaurant-bar-glassware", title: "Restaurant & Bar Glassware", eyebrow: "Drink service · everyday operations",
    description: "Build a practical drinking-glass range for restaurants, bars and hotels. Start with the menu, then compare size, handling and storage requirements.",
    audience: "For hospitality buyers and distributors balancing presentation with day-to-day service.",
    categories: [{ slug: "glass-tumblers", label: "Drinking glasses" }, { slug: "engraved-glass-cups", label: "Patterned glass cups" }, { slug: "glass-beer-mugs", label: "Beer mugs" }],
    decisions: [
      { title: "Map glasses to the menu", text: "Shortlist by drink volume, ice and headspace rather than choosing every available shape. A rocks glass and a tall highball can serve different roles even when their listed capacities are similar." },
      { title: "Check the service setup", text: "Compare rim diameter, height, weight and base against serving trays, dishwasher racks and shelf clearance. Treat stackability as a feature to confirm on the exact model, not an assumption from its shape." },
      { title: "Keep the range replaceable", text: "Record product references, finish and agreed dimensional tolerances. Confirm reorder conditions so that future deliveries can be compared with the original assortment and sample." },
    ],
    checklist: ["Drinks, serving volumes and ice requirements", "Rack, tray and shelf dimensions", "Actual pattern or decoration process", "Replacement quantities and reorder expectations"],
  },
  {
    slug: "coffee-tea-glassware", title: "Coffee & Tea Glassware", eyebrow: "Cafés · tea service · retail",
    description: "Compare glass mugs, double-wall cups, teapots and pitchers for a coordinated coffee or tea range. Check the whole serving setup, from cup to lid.",
    audience: "For cafés, tea retailers and buyers assembling beverage-service collections.",
    categories: [{ slug: "glass-coffee-mugs", label: "Coffee mugs" }, { slug: "double-wall-glass-mug", label: "Double-wall mugs" }, { slug: "glass-tea-mug", label: "Tea cups" }, { slug: "borosilicate-glass-teapot", label: "Borosilicate teapots" }, { slug: "glass-pitchers-teapot", label: "Pitchers & teapots" }, { slug: "glass-coffee-maker", label: "Coffee makers" }],
    decisions: [
      { title: "Size the complete drink", text: "Allow room for the finished beverage, including milk or foam where relevant. Check machine clearance and handle space with a sample instead of selecting cups from capacity alone." },
      { title: "Compare the construction", text: "Single- and double-wall cups have different profiles and handling characteristics. Confirm model-specific care instructions for the finished item; the glass material alone does not establish microwave or dishwasher suitability." },
      { title: "Review lids and filters", text: "For tea service, inspect the infuser fit, lid retention and pouring behavior. Record the materials of removable components and check whether replacement parts can be ordered." },
    ],
    checklist: ["Finished drink volume and equipment clearance", "Cup, handle and saucer dimensions", "Lid and infuser materials and fit", "Written care instructions for every component"],
  },
  {
    slug: "wine-spirits-gifting", title: "Wine, Spirits & Gift Sets", eyebrow: "Hospitality · gifting · retail",
    description: "Select decanters, stemware and coordinated gift sets by how they will be used, displayed and delivered. Compare the set contents as carefully as the glass.",
    audience: "For wine-service buyers, gift distributors and retailers preparing boxed glassware collections.",
    categories: [{ slug: "glass-wine-decanter", label: "Wine decanters" }, { slug: "glass-whiskey-decanter", label: "Whiskey decanters" }, { slug: "whiskey-decanter-set", label: "Whiskey decanter sets" }, { slug: "glass-stemware", label: "Stemware" }],
    decisions: [
      { title: "Separate serving from storage", text: "A serving decanter and a stoppered bottle answer different needs. Confirm the closure design and intended use; a decorative stopper should not be assumed to provide an airtight storage seal." },
      { title: "Specify the full set", text: "List every component, its capacity and its quantity. Compare the decanter and glasses together, including finish, proportions and the arrangement inside the gift box." },
      { title: "Evaluate the retail pack", text: "Check the assembled set for movement inside the insert and protection around stems, rims and stoppers. Approve the retail box and transport carton as separate packaging layers." },
    ],
    checklist: ["Serving or storage use and closure requirements", "Component list with capacities and quantities", "Gift-box artwork and insert layout", "Packed sample and transport protection"],
  },
  {
    slug: "kitchen-storage-bakeware", title: "Kitchen Storage & Bakeware", eyebrow: "Food storage · preparation · retail",
    description: "Compare storage jars, food containers and baking dishes by capacity, shape and component fit. Keep the glass body and lid requirements separate.",
    audience: "For kitchenware distributors and retailers building storage or bakeware assortments.",
    categories: [{ slug: "glass-storage-jars", label: "Storage jars" }, { slug: "glass-food-containers", label: "Food containers" }, { slug: "baking-glassware", label: "Bakeware" }],
    decisions: [
      { title: "Choose usable dimensions", text: "Compare opening width, external dimensions and usable capacity with the intended food and storage location. Check nesting and lid storage on samples before planning a space-saving set." },
      { title: "Treat closures as components", text: "Specify the lid, gasket and locking mechanism separately from the glass body. Request evidence for any leak-resistance claim and confirm that replacement parts fit the selected model." },
      { title: "Confirm the use conditions", text: "Obtain written instructions for the exact glass and lid combination. Oven, microwave, freezer and dishwasher suitability need model-specific confirmation, including limits and any parts that must be removed." },
    ],
    checklist: ["Usable capacity, external size and set composition", "Lid and seal specifications", "Model-specific instructions and relevant test documents", "Packed dimensions, carton weight and transit protection"],
  },
];

export function getGuideCluster(slug: string) {
  return guideClusters.find((cluster) => cluster.slug === slug);
}

export function getClustersForCategory(slug: string) {
  return guideClusters.filter((cluster) => cluster.categories.some((category) => category.slug === slug));
}
