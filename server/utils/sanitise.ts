// Enhanced criterion name cleaning with better quote handling
export function cleanCriterionName(s: string): string {
  return String(s)
    .trim()
    // Remove all types of quotes (straight, smart, single, double) from start and end
    .replace(/^[\s"'`""""''``]+/, "")
    .replace(/[\s"'`""""''``]+$/, "")
    .trim();
}

export function cleanDescription(s: string): string {
  const txt = String(s).trim();
  // If someone pasted a JSON object, keep it as plain text instead of JSON
  // (or extract a "description" if you prefer)
  if (/^\s*[\{\[]/.test(txt)) {
    return txt; // keep as-is (plain text); do NOT JSON.parse here
  }
  return txt;
}

// New comprehensive rubric cleaning function
export function cleanRubricData(rubric: any[]): Array<{ name: string; description: string; weight: number }> | null {
  if (!Array.isArray(rubric) || rubric.length === 0) {
    return null;
  }
  
  const cleanedRubric: Array<{ name: string; description: string; weight: number }> = [];
  let totalWeight = 0;
  
  for (const item of rubric) {
    // Validate required fields
    if (
      typeof item?.name === "string" &&
      typeof item?.description === "string" &&
      typeof item?.weight === "number" &&
      item.weight > 0 &&
      item.weight <= 1
    ) {
      const cleanedName = cleanCriterionName(item.name);
      const cleanedDescription = cleanDescription(item.description);
      
      // Skip if name becomes empty after cleaning
      if (cleanedName && cleanedName.length > 0) {
        cleanedRubric.push({
          name: cleanedName,
          description: cleanedDescription,
          weight: item.weight
        });
        totalWeight += item.weight;
      } else {
        console.warn(`⚠️ Skipping rubric item with empty name after cleaning`);
      }
    } else {
      console.warn(`⚠️ Invalid rubric item format`);
      return null;
    }
  }
  
  // Validate total weight equals 1.0
  if (Math.abs(totalWeight - 1.0) >= 0.001) {
    console.warn(`⚠️ Invalid rubric weights sum: ${totalWeight}, expected 1.0`);
    return null;
  }
  
  return cleanedRubric;
}
  