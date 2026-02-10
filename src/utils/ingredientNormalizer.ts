import type { Unit } from "@/types";

type UnitGroup = "mass" | "volume" | "count";

interface BaseUnitResult {
  quantity: number;
  group: UnitGroup;
}

const UNIT_TO_GROUP: Record<Unit, UnitGroup> = {
  g: "mass",
  kg: "mass",
  ml: "volume",
  l: "volume",
  cup: "volume",
  pcs: "count",
};

const TO_BASE_CONVERSIONS: Partial<Record<Unit, number>> = {
  kg: 1000,   // 1kg = 1000g
  l: 1000,    // 1l = 1000ml
  cup: 250,   // 1cup = 250ml
};

const GROUP_BASE_UNIT: Record<UnitGroup, Unit> = {
  mass: "g",
  volume: "ml",
  count: "pcs",
};

const UNIT_PREFIX_PATTERN =
  /^[\d\/\.\s]*(tbs|tbsp|tablespoon|teaspoon|tsp|pint|cup|oz|ounce|lb|pound|g|kg|ml|l|litre|liter)s?\s+/i;

/**
 * Strips leading unit fragments from ingredient names and lowercases for use as aggregation key.
 * e.g., "Tbs soy sauce" → "soy sauce", "  Butter  " → "butter"
 */
export function normalizeIngredientName(name: string): string {
  if (!name) return "";
  return name.replace(UNIT_PREFIX_PATTERN, "").trim().toLowerCase();
}

/**
 * Converts a quantity+unit to the base unit within its compatibility group.
 * e.g., (0.1, "kg") → { quantity: 100, group: "mass" }
 *       (1, "cup")  → { quantity: 250, group: "volume" }
 *       (2, "pcs")  → { quantity: 2, group: "count" }
 */
export function toBaseUnit(quantity: number, unit: Unit): BaseUnitResult {
  const group = UNIT_TO_GROUP[unit];
  const conversionFactor = TO_BASE_CONVERSIONS[unit];

  return {
    quantity: conversionFactor ? quantity * conversionFactor : quantity,
    group,
  };
}

/**
 * Converts an aggregated base-unit quantity back to a human-friendly display unit.
 * Rules: ≥1000g → kg, ≥1000ml → l. Count stays as pcs.
 */
export function toDisplayUnit(
  quantity: number,
  group: UnitGroup,
): { quantity: number; unit: Unit } {
  if (group === "mass" && quantity >= 1000) {
    return { quantity: quantity / 1000, unit: "kg" };
  }
  if (group === "volume" && quantity >= 1000) {
    return { quantity: quantity / 1000, unit: "l" };
  }

  return { quantity, unit: GROUP_BASE_UNIT[group] };
}
