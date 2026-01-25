import type { Unit } from "@/types";

interface ParsedRecipe {
  name: string;
  servings: number;
  ingredients: Array<{ name: string; quantity: number; unit: Unit }>;
  steps: string[];
  prepTime?: number;
  cookTime?: number;
  tags?: string[];
  imageUrl?: string;
}

// Parse quantity from ingredient string
function parseQuantity(text: string): { quantity: number; unit: Unit; name: string } {
  // Items that should never be measured in pieces (default to grams or ml)
  const liquidItems = [
    'sauce', 'oil', 'vinegar', 'soy', 'cream', 'milk', 'water',
    'stock', 'broth', 'juice', 'wine', 'paste', 'honey', 'syrup'
  ];

  const meatItems = [
    'mince', 'minced', 'ground beef', 'ground pork', 'ground chicken',
    'beef', 'pork', 'chicken', 'lamb', 'turkey', 'fish', 'salmon',
    'bacon', 'sausage', 'ham'
  ];

  // Common unit mappings
  const unitMap: Record<string, Unit> = {
    'g': 'g',
    'gram': 'g',
    'grams': 'g',
    'kg': 'kg',
    'kilogram': 'kg',
    'kilograms': 'kg',
    'ml': 'ml',
    'milliliter': 'ml',
    'milliliters': 'ml',
    'l': 'l',
    'liter': 'l',
    'liters': 'l',
    'piece': 'pcs',
    'pieces': 'pcs',
    'pcs': 'pcs',
    'unit': 'pcs',
    'units': 'pcs',
    'clove': 'pcs',
    'cloves': 'pcs',
    'bunch': 'pcs',
    'bunches': 'pcs',
  };

  // Handle fractions (½, ¼, etc.)
  const fractionMap: Record<string, number> = {
    '½': 0.5,
    '¼': 0.25,
    '¾': 0.75,
    '⅓': 0.33,
    '⅔': 0.67,
    '⅛': 0.125,
    '⅜': 0.375,
    '⅝': 0.625,
    '⅞': 0.875,
  };

  // Replace fractions with decimal
  let cleanText = text;
  for (const [fraction, decimal] of Object.entries(fractionMap)) {
    cleanText = cleanText.replace(fraction, decimal.toString());
  }

  // Try to match pattern: number + unit + name
  const match = cleanText.match(/^(\d+(?:\.\d+)?)\s*(g|kg|ml|l|gram|grams|kilogram|kilograms|milliliter|milliliters|liter|liters|piece|pieces|pcs|unit|units|clove|cloves|packet|packets|bag|bags|bunch|bunches|cup|cups|tablespoon|tablespoons|tbsp|teaspoon|teaspoons|tsp)?\s*(.+)$/i);

  if (match) {
    const quantity = parseFloat(match[1]);
    const unitStr = match[2]?.toLowerCase();
    const name = match[3].trim();
    const lowerName = name.toLowerCase();

    // Convert cup/tablespoon/teaspoon to ml
    if (unitStr === 'cup' || unitStr === 'cups') {
      return { quantity: quantity * 250, unit: 'ml', name };
    }
    if (unitStr === 'tablespoon' || unitStr === 'tablespoons' || unitStr === 'tbsp') {
      return { quantity: quantity * 15, unit: 'ml', name };
    }
    if (unitStr === 'teaspoon' || unitStr === 'teaspoons' || unitStr === 'tsp') {
      return { quantity: quantity * 5, unit: 'ml', name };
    }

    // Handle packet/bag items - convert to sensible defaults
    if (unitStr === 'packet' || unitStr === 'packets' || unitStr === 'bag' || unitStr === 'bags') {
      // Check if it's a liquid/sauce item
      if (liquidItems.some(liquid => lowerName.includes(liquid))) {
        return { quantity: quantity * 50, unit: 'ml', name }; // Assume 50ml per packet
      }
      // Check if it's a meat item
      if (meatItems.some(meat => lowerName.includes(meat))) {
        return { quantity: quantity * 200, unit: 'g', name }; // Assume 200g per packet/serving
      }
      // Default for packets: 100g
      return { quantity: quantity * 100, unit: 'g', name };
    }

    const unit = unitMap[unitStr || ''] || 'pcs';
    return { quantity, unit, name };
  }

  // No quantity specified - apply intelligent defaults
  const lowerText = text.trim().toLowerCase();

  // Check for liquid items - default to 50ml
  if (liquidItems.some(liquid => lowerText.includes(liquid))) {
    return { quantity: 50, unit: 'ml', name: text.trim() };
  }

  // Check for meat items - default to 200g per serving (800g for 4 servings)
  if (meatItems.some(meat => lowerText.includes(meat))) {
    return { quantity: 200, unit: 'g', name: text.trim() };
  }

  // Default: treat as 1 piece
  return { quantity: 1, unit: 'pcs', name: text.trim() };
}

// Convert time string to minutes (handles both ISO 8601 duration and plain text)
function parseTime(timeStr: string): number | undefined {
  if (!timeStr) return undefined;

  // Handle ISO 8601 duration format (e.g., PT30M, PT1H30M)
  if (timeStr.startsWith('PT')) {
    let totalMinutes = 0;
    const hourMatch = timeStr.match(/(\d+)H/);
    const minuteMatch = timeStr.match(/(\d+)M/);

    if (hourMatch) totalMinutes += parseInt(hourMatch[1]) * 60;
    if (minuteMatch) totalMinutes += parseInt(minuteMatch[1]);

    return totalMinutes > 0 ? totalMinutes : undefined;
  }

  // Handle plain text format
  const match = timeStr.match(/(\d+)\s*(min|minute|minutes|hour|hours|h)/i);
  if (!match) return undefined;

  const value = parseInt(match[1]);
  const unit = match[2].toLowerCase();

  if (unit.startsWith('h')) {
    return value * 60;
  }
  return value;
}

export async function fetchRecipeFromUrl(url: string): Promise<ParsedRecipe | null> {
  try {
    // Try direct fetch first
    let html: string;
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch recipe');
      html = await response.text();
    } catch (error) {
      // If CORS blocks it, try with a CORS proxy
      const corsProxy = 'https://api.allorigins.win/raw?url=';
      const proxyUrl = corsProxy + encodeURIComponent(url);
      const response = await fetch(proxyUrl);
      if (!response.ok) throw new Error('Failed to fetch recipe via proxy');
      html = await response.text();
    }

    // Try to find JSON-LD structured data (schema.org Recipe)
    const jsonLdMatch = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);

    if (jsonLdMatch) {
      for (const script of jsonLdMatch) {
        const jsonContent = script.replace(/<script[^>]*>|<\/script>/gi, '');
        try {
          const data = JSON.parse(jsonContent);

          // Handle both single recipe and array of items
          const recipe = Array.isArray(data)
            ? data.find((item: any) => item['@type'] === 'Recipe')
            : data['@type'] === 'Recipe' ? data : null;

          if (recipe) {
            const ingredients = (recipe.recipeIngredient || []).map((ing: string) => {
              return parseQuantity(ing);
            });

            const steps = (recipe.recipeInstructions || []).map((instruction: any) => {
              if (typeof instruction === 'string') return instruction;
              if (instruction.text) return instruction.text;
              if (instruction['@type'] === 'HowToStep' && instruction.text) return instruction.text;
              return '';
            }).filter((s: string) => s.length > 0);

            const tags: string[] = [];
            if (recipe.recipeCategory) tags.push(recipe.recipeCategory);
            if (recipe.recipeCuisine) tags.push(recipe.recipeCuisine);
            if (recipe.keywords) {
              const keywords = Array.isArray(recipe.keywords)
                ? recipe.keywords
                : recipe.keywords.split(',').map((k: string) => k.trim());
              tags.push(...keywords);
            }

            // Parse servings - handle both numbers and strings like "2 people"
            let servings = 4;
            if (recipe.recipeYield) {
              const yieldMatch = String(recipe.recipeYield).match(/(\d+)/);
              servings = yieldMatch ? parseInt(yieldMatch[1]) : 4;
            }

            // Extract image URL
            let imageUrl: string | undefined;
            if (recipe.image) {
              if (typeof recipe.image === 'string') {
                imageUrl = recipe.image;
              } else if (Array.isArray(recipe.image) && recipe.image.length > 0) {
                const firstImage = recipe.image[0];
                imageUrl = typeof firstImage === 'string' ? firstImage : firstImage?.url;
              } else if (typeof recipe.image === 'object' && recipe.image !== null) {
                imageUrl = recipe.image.url || recipe.image.contentUrl || undefined;
              }
            }

            // Ensure imageUrl is actually a string, not an object
            if (imageUrl && typeof imageUrl !== 'string') {
              imageUrl = undefined;
            }

            return {
              name: recipe.name || 'Imported Recipe',
              servings,
              ingredients,
              steps,
              prepTime: parseTime(recipe.prepTime),
              cookTime: parseTime(recipe.cookTime),
              tags: tags.length > 0 ? tags : undefined,
              imageUrl,
            };
          }
        } catch (e) {
          console.error('Error parsing JSON-LD:', e);
        }
      }
    }

    // If no JSON-LD found, try common HTML patterns
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    // Try to find recipe name
    const nameEl = doc.querySelector('h1[itemprop="name"], h1.recipe-title, [class*="recipe-name"], [class*="recipe-title"]');
    const name = nameEl?.textContent?.trim() || 'Imported Recipe';

    // Try to find ingredients
    const ingredientEls = doc.querySelectorAll('[itemprop="recipeIngredient"], .ingredient, [class*="ingredient"]');
    const ingredients = Array.from(ingredientEls)
      .map(el => parseQuantity(el.textContent?.trim() || ''))
      .filter(ing => ing.name.length > 0);

    // Try to find steps
    const stepEls = doc.querySelectorAll('[itemprop="recipeInstructions"] li, .instruction, [class*="instruction"]');
    const steps = Array.from(stepEls)
      .map(el => el.textContent?.trim() || '')
      .filter(s => s.length > 0);

    if (ingredients.length > 0 || steps.length > 0) {
      return {
        name,
        servings: 4,
        ingredients: ingredients.length > 0 ? ingredients : [{ name: '', quantity: 0, unit: 'g' }],
        steps: steps.length > 0 ? steps : [''],
        tags: undefined,
      };
    }

    return null;
  } catch (error) {
    console.error('Error fetching recipe:', error);
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('Unable to access recipe URL. The website may be blocking automated access.');
    }
    throw new Error('Failed to fetch recipe. Please check the URL and try again, or enter the recipe manually.');
  }
}
