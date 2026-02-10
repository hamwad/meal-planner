import type { Unit } from "@/types";

// =============================================================================
// Types
// =============================================================================

interface ParsedRecipe {
  name: string;
  servings: number;
  ingredients: ParsedIngredient[];
  steps: string[];
  prepTime?: number;
  cookTime?: number;
  tags?: string[];
  imageUrl?: string;
}

interface ParsedIngredient {
  name: string;
  quantity: number;
  unit: Unit;
}

// =============================================================================
// Constants
// =============================================================================

const LIQUID_ITEMS = [
  "sauce",
  "oil",
  "vinegar",
  "soy",
  "cream",
  "milk",
  "water",
  "stock",
  "broth",
  "juice",
  "wine",
  "paste",
  "honey",
  "syrup",
];

const MEAT_ITEMS = [
  "mince",
  "minced",
  "ground beef",
  "ground pork",
  "ground chicken",
  "beef",
  "pork",
  "chicken",
  "lamb",
  "turkey",
  "fish",
  "salmon",
  "bacon",
  "sausage",
  "ham",
];

const UNIT_MAP: Record<string, Unit> = {
  g: "g",
  gram: "g",
  grams: "g",
  kg: "kg",
  kilogram: "kg",
  kilograms: "kg",
  ml: "ml",
  milliliter: "ml",
  milliliters: "ml",
  l: "l",
  liter: "l",
  liters: "l",
  cup: "cup",
  cups: "cup",
  piece: "pcs",
  pieces: "pcs",
  pcs: "pcs",
  unit: "pcs",
  units: "pcs",
  clove: "pcs",
  cloves: "pcs",
  bunch: "pcs",
  bunches: "pcs",
};

const FRACTION_MAP: Record<string, number> = {
  "½": 0.5,
  "¼": 0.25,
  "¾": 0.75,
  "⅓": 0.33,
  "⅔": 0.67,
  "⅛": 0.125,
  "⅜": 0.375,
  "⅝": 0.625,
  "⅞": 0.875,
};

const INGREDIENT_PATTERN =
  /^(\d+(?:\.\d+)?)\s*(g|kg|ml|l|gram|grams|kilogram|kilograms|milliliter|milliliters|liter|liters|piece|pieces|pcs|unit|units|clove|cloves|packet|packets|bag|bags|bunch|bunches|cup|cups|tablespoon|tablespoons|tbsp|teaspoon|teaspoons|tsp)?\s*(.+)$/i;

const CORS_PROXIES = [
  (url: string) =>
    `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
  (url: string) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
  (url: string) =>
    `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`,
];

const DEFAULT_TIMEOUT_MS = 15000;
const DEFAULT_SERVINGS = 4;

// =============================================================================
// Helper Functions - Ingredient Parsing
// =============================================================================

const replaceFractions = (text: string): string => {
  let result = text;
  for (const [fraction, decimal] of Object.entries(FRACTION_MAP)) {
    result = result.replace(fraction, decimal.toString());
  }
  return result;
};

const isLiquidItem = (name: string): boolean =>
  LIQUID_ITEMS.some((liquid) => name.includes(liquid));

const isMeatItem = (name: string): boolean =>
  MEAT_ITEMS.some((meat) => name.includes(meat));

const convertVolumeUnit = (
  quantity: number,
  unitStr: string,
  name: string,
): ParsedIngredient | null => {
  if (["tablespoon", "tablespoons", "tbsp"].includes(unitStr)) {
    return { quantity: quantity * 15, unit: "ml", name };
  }
  if (["teaspoon", "teaspoons", "tsp"].includes(unitStr)) {
    return { quantity: quantity * 5, unit: "ml", name };
  }
  return null;
};

const convertPacketUnit = (
  quantity: number,
  name: string,
): ParsedIngredient => {
  const lowerName = name.toLowerCase();

  if (isLiquidItem(lowerName)) {
    return { quantity: quantity * 50, unit: "ml", name };
  }
  if (isMeatItem(lowerName)) {
    return { quantity: quantity * 200, unit: "g", name };
  }
  return { quantity: quantity * 100, unit: "g", name };
};

const cleanIngredientName = (name: string): string => {
  // Remove leading quantity/unit fragments like "/1 pint", "1/2 cup", etc.
  // that got incorrectly included in the name
  return name
    .replace(/^[\/\d\s]*(pint|cup|tablespoon|tbsp|teaspoon|tsp|oz|ounce|lb|pound|g|kg|ml|l)s?\s+/i, "")
    .trim();
};

const parseQuantity = (text: string): ParsedIngredient => {
  const cleanText = replaceFractions(text);
  const match = cleanText.match(INGREDIENT_PATTERN);

  if (match) {
    const quantity = parseFloat(match[1] ?? "");
    const unitStr = match[2]?.toLowerCase() || "";
    const name = cleanIngredientName((match[3] || "").trim());

    // Handle volume conversions (cups, tablespoons, teaspoons)
    const volumeResult = convertVolumeUnit(quantity, unitStr, name);
    if (volumeResult) return volumeResult;

    // Handle packet/bag items
    if (["packet", "packets", "bag", "bags"].includes(unitStr)) {
      return convertPacketUnit(quantity, name);
    }

    const unit = UNIT_MAP[unitStr] || "pcs";
    return { quantity, unit, name };
  }

  // No quantity specified - clean up and apply intelligent defaults
  const cleanedName = cleanIngredientName(text.trim());
  const lowerText = cleanedName.toLowerCase();

  if (isLiquidItem(lowerText)) {
    return { quantity: 50, unit: "ml", name: cleanedName };
  }
  if (isMeatItem(lowerText)) {
    return { quantity: 200, unit: "g", name: cleanedName };
  }

  return { quantity: 1, unit: "pcs", name: cleanedName };
};

// =============================================================================
// Helper Functions - Time Parsing
// =============================================================================

const parseIso8601Duration = (timeStr: string) => {
  let totalMinutes = 0;
  const hourMatch = timeStr.match(/(\d+)H/);
  const minuteMatch = timeStr.match(/(\d+)M/);

  if (hourMatch?.[1]) totalMinutes += parseInt(hourMatch[1]) * 60;
  if (minuteMatch?.[1]) totalMinutes += parseInt(minuteMatch[1]);

  return totalMinutes > 0 ? totalMinutes : undefined;
};

const parseTime = (timeStr: string) => {
  if (!timeStr) return undefined;

  // Handle ISO 8601 duration format (e.g., PT30M, PT1H30M)
  if (timeStr.startsWith("PT")) {
    return parseIso8601Duration(timeStr);
  }

  // Handle plain text format
  const match = timeStr.match(/(\d+)\s*(min|minute|minutes|hour|hours|h)/i);
  if (!match) return undefined;

  const value = parseInt(match[1]!);
  const unit = match[2]!.toLowerCase();

  return unit.startsWith("h") ? value * 60 : value;
};

// =============================================================================
// Helper Functions - Network
// =============================================================================

const fetchWithTimeout = async (
  url: string,
  timeoutMs: number = DEFAULT_TIMEOUT_MS,
) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(timeoutId);
  }
};

const fetchWithCorsProxy = async (url: string) => {
  const errors: string[] = [];

  for (const buildProxyUrl of CORS_PROXIES) {
    const proxyUrl = buildProxyUrl(url);
    try {
      const response = await fetchWithTimeout(proxyUrl);
      if (response.ok) {
        return await response.text();
      }
      errors.push(`Proxy returned ${response.status}`);
    } catch (error) {
      if (error instanceof Error) {
        errors.push(
          error.name === "AbortError" ? "Request timed out" : error.message,
        );
      }
    }
  }

  throw new Error(
    `All CORS proxies failed. The recipe website may be blocking automated access. Errors: ${errors.join(", ")}`,
  );
};

// =============================================================================
// Helper Functions - JSON-LD Parsing
// =============================================================================

const extractImageUrl = (image: unknown) => {
  if (typeof image === "string") {
    return image;
  }

  if (Array.isArray(image) && image.length > 0) {
    const firstImage = image[0];
    return typeof firstImage === "string" ? firstImage : firstImage?.url;
  }

  if (typeof image === "object" && image !== null) {
    const imgObj = image as Record<string, unknown>;
    const url = imgObj.url || imgObj.contentUrl;
    return typeof url === "string" ? url : undefined;
  }

  return undefined;
};

const MAX_TAGS = 3;

const extractTags = (recipe: Record<string, unknown>) => {
  const tags: string[] = [];

  if (recipe.recipeCategory) tags.push(String(recipe.recipeCategory));
  if (recipe.recipeCuisine) tags.push(String(recipe.recipeCuisine));

  if (recipe.keywords) {
    const keywords = Array.isArray(recipe.keywords)
      ? recipe.keywords
      : String(recipe.keywords)
          .split(",")
          .map((k) => k.trim());
    tags.push(...keywords);
  }

  return tags.slice(0, MAX_TAGS);
};

const extractServings = (recipeYield: unknown) => {
  if (!recipeYield) return DEFAULT_SERVINGS;

  const match = String(recipeYield).match(/(\d+)/);
  return match?.[1] ? parseInt(match[1]) : DEFAULT_SERVINGS;
};

const extractSteps = (instructions: unknown[]): string[] => {
  return instructions
    .map((instruction) => {
      if (typeof instruction === "string") return instruction;
      if (typeof instruction === "object" && instruction !== null) {
        const obj = instruction as Record<string, unknown>;
        if (obj.text) return String(obj.text);
      }
      return "";
    })
    .filter((s) => s.length > 0);
};

const parseJsonLdRecipe = (recipe: Record<string, unknown>): ParsedRecipe => {
  const ingredients = ((recipe.recipeIngredient as string[]) || []).map(
    parseQuantity,
  );
  const steps = extractSteps((recipe.recipeInstructions as unknown[]) || []);
  const tags = extractTags(recipe);
  const imageUrl = extractImageUrl(recipe.image);

  return {
    name: String(recipe.name || "Imported Recipe"),
    servings: extractServings(recipe.recipeYield),
    ingredients,
    steps,
    prepTime: parseTime(String(recipe.prepTime || "")),
    cookTime: parseTime(String(recipe.cookTime || "")),
    tags: tags.length > 0 ? tags : undefined,
    imageUrl: typeof imageUrl === "string" ? imageUrl : undefined,
  };
};

const findRecipeInJsonLd = (data: unknown): Record<string, unknown> | null => {
  if (Array.isArray(data)) {
    return data.find((item) => item?.["@type"] === "Recipe") || null;
  }

  if (typeof data === "object" && data !== null) {
    const obj = data as Record<string, unknown>;
    if (obj["@type"] === "Recipe") return obj;

    // Check for @graph structure
    if (Array.isArray(obj["@graph"])) {
      return obj["@graph"].find((item) => item?.["@type"] === "Recipe") || null;
    }
  }

  return null;
};

const parseJsonLdFromHtml = (html: string): ParsedRecipe | null => {
  const jsonLdPattern =
    /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  const matches = html.match(jsonLdPattern);

  if (!matches) return null;

  for (const script of matches) {
    const jsonContent = script.replace(/<script[^>]*>|<\/script>/gi, "");
    try {
      const data = JSON.parse(jsonContent);
      const recipe = findRecipeInJsonLd(data);
      if (recipe) {
        return parseJsonLdRecipe(recipe);
      }
    } catch {
      // Continue to next script tag
    }
  }

  return null;
};

// =============================================================================
// Helper Functions - HTML Fallback Parsing
// =============================================================================

const parseHtmlFallback = (html: string): ParsedRecipe | null => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");

  const nameEl = doc.querySelector(
    'h1[itemprop="name"], h1.recipe-title, [class*="recipe-name"], [class*="recipe-title"]',
  );
  const name = nameEl?.textContent?.trim() || "Imported Recipe";

  const ingredientEls = doc.querySelectorAll(
    '[itemprop="recipeIngredient"], .ingredient, [class*="ingredient"]',
  );
  const ingredients = Array.from(ingredientEls)
    .map((el) => parseQuantity(el.textContent?.trim() || ""))
    .filter((ing) => ing.name.length > 0);

  const stepEls = doc.querySelectorAll(
    '[itemprop="recipeInstructions"] li, .instruction, [class*="instruction"]',
  );
  const steps = Array.from(stepEls)
    .map((el) => el.textContent?.trim() || "")
    .filter((s) => s.length > 0);

  if (ingredients.length === 0 && steps.length === 0) {
    return null;
  }

  return {
    name,
    servings: DEFAULT_SERVINGS,
    ingredients:
      ingredients.length > 0
        ? ingredients
        : [{ name: "", quantity: 0, unit: "g" }],
    steps: steps.length > 0 ? steps : [""],
    tags: undefined,
  };
};

// =============================================================================
// Helper Functions - Error Handling
// =============================================================================

const createUserFriendlyError = (error: unknown): Error => {
  if (!(error instanceof Error)) {
    return new Error(
      "Failed to import recipe. Please check the URL or enter the recipe manually.",
    );
  }

  const message = error.message;

  if (message.includes("Failed to fetch") || message.includes("NetworkError")) {
    return new Error(
      "Could not access the recipe URL. The website may be blocking automated access, or the URL may be incorrect. Try a different recipe site.",
    );
  }

  if (
    message.includes("CORS proxies failed") ||
    message.includes("timed out")
  ) {
    return error;
  }

  return error;
};

// =============================================================================
// Main Export
// =============================================================================

export const fetchRecipeFromUrl = async (url: string) => {
  try {
    const needsProxy = !url.startsWith(window.location.origin);

    const html = needsProxy
      ? await fetchWithCorsProxy(url)
      : await fetchWithTimeout(url).then((res) => {
          if (!res.ok) throw new Error("Failed to fetch recipe");
          return res.text();
        });

    // Try JSON-LD first (most reliable)
    const jsonLdResult = parseJsonLdFromHtml(html);
    if (jsonLdResult) return jsonLdResult;

    // Fall back to HTML parsing
    return parseHtmlFallback(html);
  } catch (error) {
    console.error("Error fetching recipe:", error);
    throw createUserFriendlyError(error);
  }
};
