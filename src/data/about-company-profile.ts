type ProfileSegment = {
  readonly text: string;
  readonly highlight: boolean;
};

// English company profile translated from user-supplied Chinese copy.
export const glarivoCompanyProfile: readonly (readonly ProfileSegment[])[] = [
  [
    { text: "Established in 2008", highlight: true },
    { text: ", ", highlight: false },
    { text: "Glarivo Glass", highlight: true },
    { text: " is an integrated enterprise specializing in the research and development, design, production, and sales of household glassware.", highlight: false },
  ],
  [
    { text: "The company operates approximately ", highlight: false },
    { text: "60,000 square metres of production and warehousing facilities", highlight: true },
    { text: ", employs ", highlight: false },
    { text: "more than 500 people", highlight: true },
    { text: ", and generates ", highlight: false },
    { text: "an annual production value exceeding RMB 100 million", highlight: true },
    { text: ". Supported by well-established production and quality-control systems, together with extensive supply-chain resources, we provide customers worldwide with stable and efficient glassware supply services.", highlight: false },
  ],
  [
    { text: "Our product range includes drinking glasses, stemware, glass pitchers, glass jars, kitchen and tableware, and hospitality glassware. We also offer professional ", highlight: false },
    { text: "OEM/ODM customization services", highlight: true },
    { text: ", covering ", highlight: false },
    { text: "product design, sampling, logo application, packaging, and volume production", highlight: true },
    { text: ".", highlight: false },
  ],
  [
    { text: "Since establishing our ", highlight: false },
    { text: "international business department in 2011", highlight: true },
    { text: ", our products have been exported to ", highlight: false },
    { text: "Europe, North America, the Middle East, Southeast Asia", highlight: true },
    { text: ", and other international markets.", highlight: false },
  ],
  [
    { text: "With ", highlight: false },
    { text: "consistent quality, flexible customization capabilities, and a mature global supply chain", highlight: true },
    { text: ", Glarivo Glass is committed to becoming a ", highlight: false },
    { text: "reliable long-term glassware partner", highlight: true },
    { text: " for customers worldwide.", highlight: false },
  ],
];
