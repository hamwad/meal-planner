export const toSentenceCase = (str: string): string => {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

/**
 * Removes leading quantity/unit fragments from ingredient names.
 * e.g., "5oz rigatoni" -> "Rigatoni", "/1 pint milk" -> "Milk"
 */
export const cleanIngredientName = (name: string): string => {
  if (!name) return "";

  const cleaned = name
    // Remove leading fractions, numbers, slashes, and common units
    .replace(
      /^[\d\/\.\s]*(pint|cup|tablespoon|tbsp|tbs|teaspoon|tsp|oz|ounce|lb|pound|g|kg|ml|l|litre|liter)s?\s+/i,
      ""
    )
    .trim();

  return toSentenceCase(cleaned || name);
};
