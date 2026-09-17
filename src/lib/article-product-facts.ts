type Field = { label: string; value: string; unit?: string | null };

// Bare catalog numbers do not establish the measurement unit.
export function articleProductFacts(fields: Field[]) {
  function find(labels: string[], unit?: RegExp) {
    for (const field of fields) {
      if (!labels.includes(field.label.trim().toLowerCase())) continue;
      const value = field.unit && !field.value.toLowerCase().includes(field.unit.toLowerCase())
        ? `${field.value} ${field.unit}` : field.value;
      if (value.trim() && (!unit || unit.test(value))) return value;
    }
    return null;
  }
  const lengthUnit = /\d\s*(?:mm|cm|inches|inch|in\b|″|")/i;
  const size = find(["product size", "dimensions"], lengthUnit);
  const dimensions = [
    ["Height", find(["height"], lengthUnit)],
    ["Top diameter", find(["top diameter"], lengthUnit)],
    ["Bottom diameter", find(["bottom diameter"], lengthUnit)],
  ].filter((entry) => entry[1]).map(([label, value]) => `${label}: ${value}`).join(" · ");
  return [
    { label: "Catalog capacity", value: find(["capacity"], /\d\s*(?:ml|cl|l\b|fl\.?\s*oz)/i) || "Confirm capacity in mL" },
    { label: "Dimensions", value: size || dimensions || "Confirm dimensions with sample" },
    { label: "Catalog packing", value: find(["package", "packaging", "packing"]) || "Confirm packing for your order" },
  ];
}
