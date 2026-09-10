export type CategoryBuyingContent = {
  seoTitle: string;
  seoDescription: string;
  introduction: string;
  useCases: string[];
  comparisonPoints: string[];
  inquiryChecklist: string[];
};

type FamilyKey =
  | "drinkware"
  | "mugs"
  | "serveware"
  | "decanters"
  | "tableware"
  | "storage"
  | "bakeware"
  | "borosilicate"
  | "stemware"
  | "accessories"
  | "decorative";

type CategoryDefinition = {
  label: string;
  family: FamilyKey;
  focus: string;
  useCase: string;
  comparison: string;
  inquiry: string;
  seoTitle?: string;
};

const familyContent: Record<FamilyKey, {
  useCases: [string, string];
  comparisonPoints: [string, string, string];
  inquiryChecklist: [string, string, string];
}> = {
  drinkware: {
    useCases: [
      "Hospitality and food-service ranges planned around defined drink portions",
      "Retail and distribution assortments that need coordinated capacities or finishes",
    ],
    comparisonPoints: [
      "Compare capacity together with height, rim diameter and base size; a number in a title is not a calibrated pour mark.",
      "Review the rim, base and overall proportions against trays, shelving and the intended presentation.",
      "Confirm decoration, color and packing on the selected model rather than assuming them from category images.",
    ],
    inquiryChecklist: [
      "Required quantity for each selected product",
      "Destination, target timing and any sample requirement",
      "Unit pack, inner pack and master-carton requirements",
    ],
  },
  mugs: {
    useCases: [
      "Café, restaurant and hospitality beverage service",
      "Retail mug programs organized by drink type, capacity or decoration",
    ],
    comparisonPoints: [
      "Check capacity, rim diameter, height and handle clearance together with the intended beverage and service equipment.",
      "Compare the mug weight and base with handling, storage and repeated service needs.",
      "Treat lids, saucers, double-wall construction and decoration as model-specific details that require confirmation.",
    ],
    inquiryChecklist: [
      "Target beverage, capacity and quantity per design",
      "Logo, pattern, color or other decoration requirements",
      "Packing, destination, timing and sample expectations",
    ],
  },
  serveware: {
    useCases: [
      "Table service for hospitality, catering and food-service programs",
      "Retail serveware ranges coordinated by capacity, shape or finish",
    ],
    comparisonPoints: [
      "Compare usable capacity and external dimensions with table space, storage and the planned serving quantity.",
      "Review the rim, base, handle, spout or lid details that affect pouring and handling for the selected model.",
      "Confirm included components and packing configuration instead of inferring a set from the product image.",
    ],
    inquiryChecklist: [
      "Selected model and required quantity per shape or size",
      "Any lid, handle, spout, accessory or decoration requirement",
      "Unit protection, carton format, destination and timing",
    ],
  },
  decanters: {
    useCases: [
      "Hospitality beverage presentation and table-service programs",
      "Retail or gift assortments planned as individual pieces or coordinated sets",
    ],
    comparisonPoints: [
      "Compare stated capacity with the body profile, neck opening, stopper fit and overall height.",
      "Review handling, pouring and shelf clearance using the exact selected model and sample.",
      "Confirm whether glasses, stoppers or gift packing are included rather than relying on staged photography.",
    ],
    inquiryChecklist: [
      "Decanter model, capacity and quantity",
      "Stopper, matching-glass, logo or decoration requirements",
      "Gift box or protective packing, destination and timing",
    ],
  },
  tableware: {
    useCases: [
      "Restaurant, hotel, catering and buffet presentation",
      "Retail tabletop assortments coordinated by size, shape or surface finish",
    ],
    comparisonPoints: [
      "Check the diameter, height, depth and usable volume against the intended serving portion.",
      "Compare rim, foot and stacking profile with storage, handling and table presentation needs.",
      "Confirm piece count, decoration and packing for the exact item or set selected.",
    ],
    inquiryChecklist: [
      "Selected sizes, shapes and quantity per model",
      "Required set composition, color, pattern or logo",
      "Divider protection, carton format, destination and timing",
    ],
  },
  storage: {
    useCases: [
      "Kitchen, pantry, retail and food-display assortments",
      "Coordinated storage ranges covering multiple capacities or lid styles",
    ],
    comparisonPoints: [
      "Compare usable capacity, opening diameter and external height with the intended contents and shelf space.",
      "Review lid material, closure method and included accessories on the selected model.",
      "Do not assume an airtight or leakproof performance claim unless it is supported for that exact item.",
    ],
    inquiryChecklist: [
      "Capacity mix and quantity for each jar or bottle",
      "Lid, closure, label, logo or accessory requirements",
      "Individual protection, master carton, destination and timing",
    ],
  },
  bakeware: {
    useCases: [
      "Retail and food-service programs that need defined dish sizes and shapes",
      "Coordinated preparation, baking or serving assortments where intended use is verified",
    ],
    comparisonPoints: [
      "Compare internal and external dimensions, depth and stated capacity with the recipe, portion and appliance space.",
      "Confirm the glass composition and the intended temperature or appliance use for the exact model before ordering.",
      "Review handles, lids, nesting and packing as separate model-specific requirements.",
    ],
    inquiryChecklist: [
      "Selected shape, dimensions, capacity and quantity",
      "Required use conditions and any test or compliance documentation",
      "Lid or handle requirements, packing, destination and timing",
    ],
  },
  borosilicate: {
    useCases: [
      "Retail and hospitality ranges where the specified glass composition matters",
      "Drinkware, storage or preparation programs organized by capacity and component design",
    ],
    comparisonPoints: [
      "Confirm the stated material, capacity, wall construction and dimensions on the selected item.",
      "Review lids, handles, filters, spouts and seals as individual components rather than category-wide features.",
      "Temperature resistance, appliance use and food-contact claims require model-specific evidence.",
    ],
    inquiryChecklist: [
      "Selected model, capacity and quantity",
      "Component materials and required use conditions",
      "Testing needs, packing, destination, sample and timing",
    ],
  },
  stemware: {
    useCases: [
      "Restaurant, hotel, bar and event beverage presentation",
      "Retail or gift collections coordinated by drink style and piece count",
    ],
    comparisonPoints: [
      "Compare bowl capacity, rim diameter, stem height, foot size and overall balance.",
      "Match the profile to the intended beverage and available rack, tray and shelf clearance.",
      "Confirm decoration, color, set composition and packing for the exact selected design.",
    ],
    inquiryChecklist: [
      "Glass profile, capacity and quantity per design",
      "Set composition, logo, color or decoration requirements",
      "Protective packing, destination, sample and timing",
    ],
  },
  accessories: {
    useCases: [
      "Hospitality, tabletop and venue accessory programs",
      "Retail accessory assortments selected by size, function and finish",
    ],
    comparisonPoints: [
      "Compare external dimensions, weight and contact surfaces with the intended placement and handling.",
      "Review openings, rests, bases, lids or inserts that affect the selected item's function.",
      "Confirm decoration and protective packing on the exact model before quotation.",
    ],
    inquiryChecklist: [
      "Selected model, dimensions and required quantity",
      "Color, logo, accessory or surface-finish requirements",
      "Packing, destination, sample and timing",
    ],
  },
  decorative: {
    useCases: [
      "Retail, hospitality and event décor assortments",
      "Gift and seasonal programs coordinated by size, color or surface treatment",
    ],
    comparisonPoints: [
      "Compare height, opening, base and overall proportions with the intended display location.",
      "Review color, texture, decoration and handmade variation using the selected sample.",
      "Confirm inserts, candles, flowers or other display items separately when they are not stated as included.",
    ],
    inquiryChecklist: [
      "Selected shape, size and quantity per design",
      "Color, pattern, finish, logo or accessory requirements",
      "Protective packing, destination, sample and timing",
    ],
  },
};

const categoryDefinitions: Record<string, CategoryDefinition> = {
  "glass-tumblers": { label: "glass cups and tumblers", family: "drinkware", focus: "capacity, rim shape, base proportions and packing", useCase: "Everyday beverage service across hospitality, retail and distribution programs", comparison: "Match the tumbler profile to the finished drink, including space for ice, garnish, milk or foam.", inquiry: "Target drink types and capacity range" },
  "engraved-glass-cups": { label: "engraved glass cups", family: "drinkware", focus: "engraved pattern, capacity, dimensions and surface finish", useCase: "Decorated drinkware collections where the molded or engraved pattern is part of the range", comparison: "Review pattern depth, repeat, clarity and undecorated areas on an approved sample.", inquiry: "Selected engraving or pattern reference" },
  "shot-glass": { label: "shot glasses", family: "drinkware", focus: "serving volume, profile, base construction and decoration", useCase: "Bar, restaurant, event and promotional programs for small drink servings", comparison: "Compare the intended fill level with the stated capacity and the glass's top, base and height measurements.", inquiry: "Intended serving volume and destination market", seoTitle: "Wholesale Shot Glasses | Sizes, Shapes & Custom Options" },
  "glass-mugs": { label: "glass mugs", family: "mugs", focus: "capacity, handle clearance, shape and coordinated accessories", useCase: "Beverage programs that need handled glassware across several drink formats", comparison: "Decide whether the range needs matching saucers, lids or double-wall options before comparing individual models.", inquiry: "Required mug types and capacity range" },
  "glass-coffee-mugs": { label: "glass coffee mugs", family: "mugs", focus: "drink capacity, handle comfort, rim and heat-use requirements", useCase: "Café and hospitality coffee service planned around defined beverage sizes", comparison: "Allow for milk or foam when matching the listed capacity to the finished coffee serving.", inquiry: "Coffee style, finished serving size and quantity" },
  "glass-beer-mugs": { label: "glass beer mugs", family: "mugs", focus: "usable volume, handle, wall profile and base stability", useCase: "Pub, restaurant and event beer service", comparison: "Compare the stated capacity with the intended pour, head space and overall filled weight.", inquiry: "Beer serving size and required quantity per design" },
  "glass-cup-and-saucer": { label: "glass cup and saucer sets", family: "mugs", focus: "cup capacity, saucer fit, set composition and packing", useCase: "Coordinated tea and coffee presentation for hospitality or retail", comparison: "Confirm cup-to-saucer fit and the number of each component included in one set.", inquiry: "Cup capacity, saucer requirement and set quantity" },
  "double-wall-glass-mug": { label: "double-wall glass mugs", family: "mugs", focus: "wall construction, capacity, external size and handle design", useCase: "Beverage ranges where visual presentation and external handling are considered together", comparison: "Compare internal capacity with external dimensions because double-wall construction changes the overall footprint.", inquiry: "Capacity, wall style and handle requirement" },
  "glass-tea-mug": { label: "glass tea mugs", family: "mugs", focus: "tea capacity, handle, lid or infuser compatibility and packing", useCase: "Tea service for cafés, hospitality, gifting and retail", comparison: "Confirm whether a lid, infuser or spoon is included and review each component's material.", inquiry: "Tea format, required components and serving size" },
  "glass-pitchers-teapot": { label: "glass pitchers and teapots", family: "serveware", focus: "capacity, pouring design, handles, lids and component materials", useCase: "Table-service ranges combining cold-drink pitchers and tea-serving formats", comparison: "Separate pitcher and teapot requirements before comparing capacity, spout and lid designs.", inquiry: "Required pitcher or teapot types and capacity range" },
  "glass-pitchers": { label: "glass pitchers", family: "serveware", focus: "usable capacity, spout control, handle clearance and refrigerator fit", useCase: "Water, juice and shared beverage service for hospitality or retail", comparison: "Check the pitcher height and base against refrigerator shelves, service trays and storage space.", inquiry: "Beverage type, capacity and lid requirement" },
  "glass-teapots": { label: "glass teapots", family: "serveware", focus: "pot capacity, spout, handle, lid and filter configuration", useCase: "Hospitality, gifting and retail tea-service programs", comparison: "Confirm the filter type, lid fit and component materials on the exact teapot selected.", inquiry: "Tea format, capacity, filter and lid requirements" },
  "borosilicate-glass-teapot": { label: "borosilicate glass teapots", family: "borosilicate", focus: "pot capacity, glass composition, filter, lid and intended temperature use", useCase: "Tea programs where a stated borosilicate construction is part of the specification", comparison: "Review body, lid and infuser materials separately and request evidence for any temperature-use requirement.", inquiry: "Capacity, filter style and intended use conditions" },
  "borosilicate-glass-pitcher": { label: "borosilicate glass pitchers", family: "borosilicate", focus: "capacity, wall construction, spout, handle and lid materials", useCase: "Beverage-service ranges where lightweight glass construction and component choice matter", comparison: "Compare the body dimensions and handle clearance with the filled weight and service setup.", inquiry: "Capacity, lid option and intended beverage conditions" },
  "glass-decanters": { label: "glass decanters", family: "decanters", focus: "capacity, body profile, neck, stopper and set composition", useCase: "Wine and spirits presentation across hospitality, retail and gift programs", comparison: "Separate wine-aeration profiles from stoppered spirits decanters before building a shortlist.", inquiry: "Beverage type, decanter capacity and set requirement" },
  "glass-wine-decanter": { label: "glass wine decanters", family: "decanters", focus: "bowl profile, neck opening, capacity and pouring balance", useCase: "Restaurant, hotel and retail wine-presentation programs", comparison: "Compare the bowl surface area and overall height with serving, cleaning and shelf requirements.", inquiry: "Wine-service capacity and preferred body profile" },
  "glass-whiskey-decanter": { label: "glass whiskey decanters", family: "decanters", focus: "capacity, stopper fit, neck, base and decoration", useCase: "Spirits presentation and gift programs", comparison: "Review stopper contact, filled weight and pouring grip using an approved sample.", inquiry: "Spirits capacity, stopper and decoration requirements" },
  "whiskey-decanter-set": { label: "whiskey decanter sets", family: "decanters", focus: "decanter capacity, glass count, stopper and gift packing", useCase: "Coordinated spirits gift and retail sets", comparison: "Confirm the exact number and size of glasses, decanter and accessories included in each set.", inquiry: "Required set composition and quantity" },
  "glassware-set": { label: "glassware sets", family: "tableware", focus: "piece count, coordinated shapes, capacities and packing", useCase: "Retail, gifting and hospitality programs requiring a defined multi-piece assortment", comparison: "List every component and quantity in the set before comparing total pack and carton data.", inquiry: "Required piece count and component mix" },
  "glass-bowls": { label: "glass bowls", family: "tableware", focus: "diameter, depth, capacity, rim and base", useCase: "Food service, buffet, preparation and retail tabletop ranges", comparison: "Match bowl diameter and depth to the intended portion, display and storage method.", inquiry: "Bowl sizes, intended serving use and quantity" },
  "glass-plates": { label: "glass plates", family: "tableware", focus: "diameter, rim profile, surface pattern and stacking", useCase: "Restaurant, catering and retail tabletop collections", comparison: "Compare usable center area and rim height, not only the overall diameter.", inquiry: "Plate diameter, course type and quantity per design" },
  "glass-candy-jars": { label: "glass candy jars", family: "storage", focus: "opening, capacity, lid fit, display angle and packing", useCase: "Countertop confectionery display, gifting and retail storage", comparison: "Check access through the opening and the stability of the jar at its intended display angle.", inquiry: "Candy type, capacity, lid and display requirements" },
  "glass-vases": { label: "glass vases", family: "decorative", focus: "height, opening, base, color and surface treatment", useCase: "Retail, hospitality, event and floral display programs", comparison: "Match the opening and height to the intended stems or arrangement rather than selecting by appearance alone.", inquiry: "Target arrangement, vase dimensions and quantity" },
  "glass-ice-cream-cups": { label: "glass ice cream cups", family: "tableware", focus: "serving volume, bowl shape, foot, spoon access and set packing", useCase: "Dessert service for restaurants, hotels, cafés and retail sets", comparison: "Compare bowl depth and opening with the planned scoop count, toppings and spoon size.", inquiry: "Dessert portion, required cup size and quantity" },
  "glass-ice-buckets": { label: "glass ice buckets", family: "serveware", focus: "capacity, opening, handle, tongs and filled weight", useCase: "Hotel, bar, restaurant and tabletop beverage service", comparison: "Review the filled weight, grip and opening size together with any tong or lid requirement.", inquiry: "Ice volume, handle, tong and lid requirements" },
  "glass-bottles-wholesale": { label: "glass bottles", family: "storage", focus: "fill capacity, neck finish, closure, body dimensions and packing", useCase: "Beverage, tabletop and retail bottle programs where closure compatibility is defined", comparison: "Match the neck finish and opening to the selected cap, stopper or dispensing component.", inquiry: "Fill volume, closure type and quantity" },
  "glass-jars": { label: "glass jars", family: "storage", focus: "capacity, opening, lid system and coordinated size range", useCase: "Storage and display programs covering several jar formats", comparison: "Group requirements by contents and closure performance before selecting individual jar shapes.", inquiry: "Required jar types, capacity range and lid systems" },
  "glass-storage-jars": { label: "glass storage jars", family: "storage", focus: "usable capacity, opening, lid, seal and shelf footprint", useCase: "Pantry, kitchen, hospitality and retail storage ranges", comparison: "Compare opening diameter with filling, scooping and cleaning requirements.", inquiry: "Contents, capacity, closure and quantity per size" },
  "glass-storage-jars-set": { label: "glass storage jar sets", family: "storage", focus: "capacity mix, lid consistency, set composition and packing", useCase: "Coordinated pantry and countertop storage sets", comparison: "Confirm each jar size and lid count rather than relying on the total number of pieces.", inquiry: "Required capacity mix and jars per set" },
  "mason-jar-glasses": { label: "mason jar glasses", family: "drinkware", focus: "capacity, handle, lid, straw opening and beverage use", useCase: "Casual beverage service, events and retail drinkware programs", comparison: "Confirm whether handles, lids and straws are included and review their materials separately.", inquiry: "Beverage type, lid or straw requirement and quantity" },
  "glass-bathroom-accessory": { label: "glass bathroom accessories", family: "accessories", focus: "component mix, footprint, dispenser parts and surface finish", useCase: "Hotel, residential and retail bathroom accessory sets", comparison: "Confirm the pump, lid, tray or holder components included with each selected item.", inquiry: "Required accessory types, finish and set composition" },
  "baking-glassware": { label: "baking glassware", family: "bakeware", focus: "dish type, dimensions, depth, handles, lids and verified use conditions", useCase: "Preparation, baking and serving programs organized by dish format", comparison: "Define the appliance and temperature-use requirement before comparing individual dishes.", inquiry: "Required dish types, size range and intended use" },
  "glass-baking-dish": { label: "glass baking dishes", family: "bakeware", focus: "internal dimensions, depth, handles and intended appliance use", useCase: "Retail and food-service baking or serving programs", comparison: "Measure the usable interior and handle-to-handle width against the intended appliance and portion.", inquiry: "Dish dimensions, shape and intended use conditions" },
  "glass-baking-bowls": { label: "glass baking bowls", family: "bakeware", focus: "diameter, depth, capacity, nesting and verified temperature use", useCase: "Preparation, mixing, baking or serving ranges where each use is confirmed", comparison: "Compare bowl depth and nesting profile with mixing, storage and portion requirements.", inquiry: "Bowl size mix, intended use and set composition" },
  "glass-casserole-dish": { label: "glass casserole dishes", family: "bakeware", focus: "capacity, internal dimensions, lid, handles and verified use conditions", useCase: "Covered preparation and serving programs for retail or food service", comparison: "Confirm lid fit and total handle-to-handle dimensions before approving the selected casserole shape.", inquiry: "Casserole size, lid requirement and intended use" },
  "borosilicate-glassware": { label: "borosilicate glassware", family: "borosilicate", focus: "glass composition, capacity, construction, components and verified use conditions", useCase: "Drinkware, storage and preparation ranges where material specification is important", comparison: "Separate the required item types and operating conditions before comparing models.", inquiry: "Required product types, capacities and use conditions" },
  "borosilicate-glass-bottle": { label: "borosilicate glass bottles", family: "borosilicate", focus: "capacity, neck, lid, sleeve and intended beverage conditions", useCase: "Retail and promotional drink-bottle programs", comparison: "Review bottle, lid, seal and sleeve materials as separate components.", inquiry: "Fill capacity, lid, sleeve and logo requirements" },
  "borosilicate-glass-jar": { label: "borosilicate glass jars", family: "borosilicate", focus: "capacity, opening, lid system, wall construction and intended contents", useCase: "Storage and display ranges where the stated glass composition matters", comparison: "Check opening and closure details against filling, access and shelf requirements.", inquiry: "Contents, capacity, lid and use conditions" },
  "borosilicate-glass-cup": { label: "borosilicate glass cups", family: "borosilicate", focus: "capacity, single- or double-wall construction, rim and external dimensions", useCase: "Retail and beverage-service ranges organized by construction and capacity", comparison: "Compare internal volume with external footprint when evaluating double-wall designs.", inquiry: "Beverage type, capacity and wall construction" },
  "glass-coffee-maker": { label: "glass coffee makers", family: "borosilicate", focus: "brewing capacity, filter or press components, handle, lid and replacement parts", useCase: "Retail, hospitality and promotional coffee-brewing programs", comparison: "Confirm every brewing component and its material before comparing nominal capacity.", inquiry: "Brewing method, cup yield and required components" },
  "pyrex-glassware": { label: "heat-use glassware", family: "borosilicate", focus: "verified glass composition, dimensions, capacity and intended temperature conditions", useCase: "Preparation and serving programs that require documented use conditions", comparison: "Treat Pyrex as a trademark rather than a generic material claim; confirm the actual glass specification for each product.", inquiry: "Material evidence, intended use conditions and capacity" },
  "glass-stemware": { label: "glass stemware", family: "stemware", focus: "bowl profile, capacity, stem height, foot and coordinated drink types", useCase: "Hospitality, event and retail beverage ranges covering several stemmed-glass formats", comparison: "Define the drink types and rack clearances before selecting individual profiles.", inquiry: "Required stemware types, capacities and piece counts" },
  "cheap-wine-glasses": { label: "wine glasses", family: "stemware", focus: "bowl shape, capacity, rim, stem and service durability", useCase: "Restaurant, hotel, event and retail wine-service programs", comparison: "Match bowl and opening proportions to the intended wine style and serving volume.", inquiry: "Wine styles, serving capacity and quantity per design", seoTitle: "Wholesale Wine Glasses | Shapes, Sizes & Packing" },
  "cheap-champagne-glasses": { label: "champagne glasses", family: "stemware", focus: "flute, coupe or tulip profile, capacity, stem and rim", useCase: "Hospitality, event, gifting and retail sparkling-wine programs", comparison: "Choose the required profile before comparing capacity, height and rack clearance.", inquiry: "Preferred glass profile, serving volume and quantity", seoTitle: "Wholesale Champagne Glasses | Profiles & Packing" },
  "vintage-wine-glasses": { label: "vintage-style goblets", family: "stemware", focus: "bowl pattern, color, capacity, stem and handmade variation", useCase: "Decorative hospitality, event and retail tabletop collections", comparison: "Review pattern, color consistency and acceptable variation on the approved sample.", inquiry: "Pattern, color, capacity and quantity per design" },
  "cocktail-glassware": { label: "cocktail glassware", family: "stemware", focus: "drink profile, bowl or cone shape, capacity, rim and stem", useCase: "Bar, restaurant, event and retail cocktail programs", comparison: "Match the glass profile and usable capacity to the finished cocktail, garnish and ice format.", inquiry: "Cocktail types, serving volumes and required profiles" },
  "glass-ashtray": { label: "glass ashtrays", family: "accessories", focus: "diameter, depth, rest layout, base and cleaning access", useCase: "Hospitality, venue and retail smoking-accessory programs where permitted", comparison: "Compare the number and shape of rests with the intended placement and cleaning routine.", inquiry: "Ashtray dimensions, rest count and quantity" },
  "glass-napkin-holders": { label: "glass napkin holders", family: "accessories", focus: "opening, base footprint, napkin size and tabletop stability", useCase: "Restaurant, hotel and tabletop accessory programs", comparison: "Match the holder opening and depth to the folded napkin size and refill method.", inquiry: "Napkin dimensions, holder format and quantity" },
  "glass-fruit-bowl-plates": { label: "glass fruit bowls and plates", family: "tableware", focus: "serving format, diameter, depth, foot and coordinated presentation", useCase: "Hospitality, gifting and retail fruit-service collections", comparison: "Separate bowl and plate requirements before comparing dimensions and set composition.", inquiry: "Required bowl or plate types, sizes and quantities" },
  "glass-fruit-bowl": { label: "glass fruit bowls", family: "tableware", focus: "diameter, depth, foot, capacity and display profile", useCase: "Buffet, tabletop, gifting and retail fruit presentation", comparison: "Compare usable bowl depth and base stability with the intended quantity and display location.", inquiry: "Fruit-bowl diameter, depth and quantity" },
  "glass-fruit-plate": { label: "glass fruit plates", family: "tableware", focus: "diameter, rim, sections, foot and surface pattern", useCase: "Tabletop, buffet, gifting and retail fruit presentation", comparison: "Confirm whether the plate is flat, divided or raised and compare the usable serving area.", inquiry: "Plate format, diameter and quantity" },
  "glass-candle-holders": { label: "glass candle holders", family: "decorative", focus: "candle opening, height, base, wall clearance and heat-use evidence", useCase: "Hospitality, event, seasonal and retail décor programs", comparison: "Match the opening and internal clearance to the intended candle; request evidence for any heat-use claim.", inquiry: "Candle dimensions, holder size and quantity" },
  "glass-food-containers": { label: "glass food containers", family: "storage", focus: "usable volume, lid, seal, shape, stacking and verified use conditions", useCase: "Retail, hospitality and food-storage programs", comparison: "Confirm container and lid materials, closure performance and intended temperature use separately.", inquiry: "Food type, capacity, lid and use conditions" },
  "opal-glassware": { label: "opal glassware", family: "tableware", focus: "material specification, piece type, dimensions, decoration and set composition", useCase: "Hospitality and retail tabletop collections using an opal-glass specification", comparison: "Confirm the material, color, rim finish and decoration on the selected item or sample.", inquiry: "Required pieces, dimensions, color and set composition" },
  "colored-glassware": { label: "colored glassware", family: "decorative", focus: "base glass, color method, shade consistency, dimensions and packing", useCase: "Retail, hospitality, event and gift programs organized by color", comparison: "Confirm whether color is integral, sprayed or otherwise applied and approve a physical color reference.", inquiry: "Selected products, color references and quantity per shade" },
  "glass-beverage-dispenser": { label: "glass beverage dispensers", family: "serveware", focus: "usable capacity, opening, lid, stand and dispensing tap", useCase: "Buffet, catering, hospitality and event beverage service", comparison: "Review tap material and clearance, stand height, lid fit and filled weight on the selected setup.", inquiry: "Beverage type, capacity, tap and stand requirements" },
};

function titleCase(value: string) {
  return value.split(" ").map((word, index) =>
    index > 0 && ["and", "or", "with"].includes(word) ? word : word.charAt(0).toUpperCase() + word.slice(1),
  ).join(" ");
}

function truncateAtWord(value: string, maximum: number) {
  if (value.length <= maximum) return value;
  const shortened = value.slice(0, maximum - 1).replace(/\s+\S*$/, "").replace(/[,:;\s-]+$/, "");
  return `${shortened}…`;
}

function buildCategoryBuyingContent(definition: CategoryDefinition): CategoryBuyingContent {
  const family = familyContent[definition.family];
  return {
    seoTitle: definition.seoTitle ?? `Wholesale ${titleCase(definition.label)} | Sourcing Guide`,
    seoDescription: truncateAtWord(`Compare ${definition.label} by ${definition.focus}. Review current models and prepare a product-specific wholesale inquiry with Glarivo.`, 158),
    introduction: `Build a ${definition.label} shortlist around ${definition.focus}, not appearance alone. Use the published product data for initial comparison, then reconfirm the exact model, sample and carton details before quotation.`,
    useCases: [definition.useCase, ...family.useCases],
    comparisonPoints: [definition.comparison, ...family.comparisonPoints],
    inquiryChecklist: [definition.inquiry, ...family.inquiryChecklist],
  };
}

const categoryBuyingContent = Object.fromEntries(
  Object.entries(categoryDefinitions).map(([slug, definition]) => [slug, buildCategoryBuyingContent(definition)]),
) as Record<string, CategoryBuyingContent>;

export function getCategoryBuyingContent(slug: string) {
  return categoryBuyingContent[slug] ?? null;
}

export function getCategoryBuyingContentSlugs() {
  return Object.keys(categoryBuyingContent);
}
