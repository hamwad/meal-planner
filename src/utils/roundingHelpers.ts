import type { Unit } from "@/types";

export function smartRound(quantity: number, unit: Unit): number {
  if (unit === "pcs") {
    // Always round up to whole numbers for pieces
    return Math.ceil(quantity);
  }

  if (unit === "g") {
    if (quantity <= 10) {
      // Very small amounts (spices): round to nearest 5g
      return Math.ceil(quantity / 5) * 5;
    } else if (quantity <= 50) {
      // Small amounts: round to nearest 10g
      return Math.ceil(quantity / 10) * 10;
    } else if (quantity <= 200) {
      // Medium amounts: round to nearest 25g
      return Math.ceil(quantity / 25) * 25;
    } else if (quantity <= 500) {
      // Larger amounts: round to nearest 50g
      return Math.ceil(quantity / 50) * 50;
    } else {
      // Very large amounts: round to nearest 100g
      return Math.ceil(quantity / 100) * 100;
    }
  }

  if (unit === "kg") {
    // Round to nearest 0.5kg
    return Math.ceil(quantity * 2) / 2;
  }

  if (unit === "ml") {
    if (quantity <= 50) {
      // Small amounts: round to nearest 10ml
      return Math.ceil(quantity / 10) * 10;
    } else if (quantity <= 200) {
      // Medium amounts: round to nearest 25ml
      return Math.ceil(quantity / 25) * 25;
    } else {
      // Large amounts: round to nearest 50ml
      return Math.ceil(quantity / 50) * 50;
    }
  }

  if (unit === "l") {
    // Round to nearest 0.25l
    return Math.ceil(quantity * 4) / 4;
  }

  // Default: round to 1 decimal place
  return Math.round(quantity * 10) / 10;
}
