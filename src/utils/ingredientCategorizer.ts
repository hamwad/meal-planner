export type IngredientCategory = "meat" | "fruit-veg" | "pantry" | "other";

// Pantry: exact match only (short words like "oil" would cause false positives with substring)
const PANTRY_KEYWORDS = new Set([
  "salt",
  "pepper",
  "black pepper",
  "olive oil",
  "vegetable oil",
  "cooking oil",
  "oil",
  "flour",
  "plain flour",
  "self-raising flour",
  "sugar",
  "brown sugar",
  "caster sugar",
  "icing sugar",
  "butter",
  "garlic",
  "onion",
  "baking powder",
  "baking soda",
  "bicarbonate of soda",
  "vinegar",
  "soy sauce",
  "fish sauce",
  "sesame oil",
  "cornflour",
  "stock",
  "chicken stock",
  "beef stock",
  "vegetable stock",
  "honey",
  "mustard",
  "cumin",
  "paprika",
  "oregano",
  "thyme",
  "cinnamon",
  "nutmeg",
  "chilli flakes",
  "bay leaves",
  "rice",
  "pasta",
  "noodles",
  "bread",
  "eggs",
  "sweet chilli sauce",
]);

// Meat & Seafood: substring match
const MEAT_KEYWORDS = [
  "chicken",
  "beef",
  "pork",
  "lamb",
  "mince",
  "minced",
  "steak",
  "turkey",
  "duck",
  "veal",
  "bacon",
  "sausage",
  "ham",
  "salami",
  "prosciutto",
  "chorizo",
  "salmon",
  "prawn",
  "shrimp",
  "fish",
  "tuna",
  "cod",
  "barramundi",
  "snapper",
  "crab",
  "mussel",
  "squid",
  "calamari",
  "anchov",
];

// Fruit & Veg: substring match
const FRUIT_VEG_KEYWORDS = [
  "tomato",
  "potato",
  "carrot",
  "broccoli",
  "spinach",
  "mushroom",
  "capsicum",
  "zucchini",
  "eggplant",
  "celery",
  "lettuce",
  "kale",
  "cabbage",
  "cauliflower",
  "pumpkin",
  "sweet potato",
  "corn",
  "pea",
  "bean",
  "lentil",
  "chickpea",
  "cucumber",
  "avocado",
  "asparagus",
  "leek",
  "spring onion",
  "red pepper",
  "green pepper",
  "chilli",
  "ginger",
  "coriander",
  "parsley",
  "basil",
  "mint",
  "rocket",
  "bok choy",
  "broccolini",
  "radish",
  "beetroot",
  "apple",
  "banana",
  "orange",
  "lemon",
  "lime",
  "berry",
  "blueberry",
  "strawberry",
  "raspberry",
  "grape",
  "mango",
  "pineapple",
  "pear",
  "peach",
  "watermelon",
  "kiwi",
  "passionfruit",
  "asian greens",
  "red onion",
  "white onion",
  "green onion",
  "spring onion",
];

export function categorizeIngredient(name: string): IngredientCategory {
  const lower = name.toLowerCase();

  // Priority 1: pantry (exact match)
  if (PANTRY_KEYWORDS.has(lower)) return "pantry";

  // Priority 2: meat & seafood (substring match)
  if (MEAT_KEYWORDS.some((keyword) => lower.includes(keyword))) return "meat";

  // Priority 3: fruit & veg (substring match)
  if (FRUIT_VEG_KEYWORDS.some((keyword) => lower.includes(keyword)))
    return "fruit-veg";

  // Priority 4: catch-all
  return "other";
}

export type CategorizedGroups<T> = Record<IngredientCategory, T[]>;

export function groupByCategory<T extends { ingredientName: string }>(
  items: T[],
): CategorizedGroups<T> {
  const groups: CategorizedGroups<T> = {
    meat: [],
    "fruit-veg": [],
    other: [],
    pantry: [],
  };

  for (const item of items) {
    const category = categorizeIngredient(item.ingredientName);
    groups[category].push(item);
  }

  return groups;
}

export const CATEGORY_ORDER: IngredientCategory[] = [
  "meat",
  "fruit-veg",
  "other",
  "pantry",
];

export const CATEGORY_META: Record<IngredientCategory, { label: string }> = {
  meat: { label: "Meat & Seafood" },
  "fruit-veg": { label: "Fruit & Veg" },
  other: { label: "Other" },
  pantry: { label: "Pantry" },
};
