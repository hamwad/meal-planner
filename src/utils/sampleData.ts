import { v4 as uuidv4 } from 'uuid';
import type { Meal } from '@/types';

export const sampleMeals: Meal[] = [
  {
    id: uuidv4(),
    name: 'Spaghetti Carbonara',
    defaultServings: 4,
    tags: ['Italian', 'Pasta', 'Quick'],
    ingredients: [
      { id: uuidv4(), name: 'Spaghetti', quantity: 400, unit: 'g' },
      { id: uuidv4(), name: 'Bacon', quantity: 200, unit: 'g' },
      { id: uuidv4(), name: 'Eggs', quantity: 4, unit: 'pcs' },
      { id: uuidv4(), name: 'Parmesan cheese', quantity: 100, unit: 'g' },
      { id: uuidv4(), name: 'Black pepper', quantity: 5, unit: 'g' },
    ],
    recipe: {
      steps: [
        'Cook spaghetti according to package instructions',
        'Fry bacon until crispy',
        'Beat eggs with parmesan',
        'Drain pasta, mix with bacon and egg mixture',
        'Season with black pepper and serve'
      ],
      prepTime: 10,
      cookTime: 20
    }
  },
  {
    id: uuidv4(),
    name: 'Chicken Stir-Fry',
    defaultServings: 3,
    tags: ['Asian', 'Healthy', 'Quick'],
    ingredients: [
      { id: uuidv4(), name: 'Chicken breast', quantity: 500, unit: 'g' },
      { id: uuidv4(), name: 'Bell peppers', quantity: 2, unit: 'pcs' },
      { id: uuidv4(), name: 'Broccoli', quantity: 300, unit: 'g' },
      { id: uuidv4(), name: 'Soy sauce', quantity: 50, unit: 'ml' },
      { id: uuidv4(), name: 'Garlic', quantity: 3, unit: 'pcs' },
      { id: uuidv4(), name: 'Ginger', quantity: 20, unit: 'g' },
      { id: uuidv4(), name: 'Rice', quantity: 300, unit: 'g' },
    ],
    recipe: {
      steps: [
        'Cook rice according to package instructions',
        'Cut chicken into bite-sized pieces',
        'Chop vegetables',
        'Stir-fry chicken until cooked',
        'Add vegetables and stir-fry',
        'Add soy sauce, garlic, and ginger',
        'Serve over rice'
      ],
      prepTime: 15,
      cookTime: 15
    }
  },
  {
    id: uuidv4(),
    name: 'Greek Salad',
    defaultServings: 2,
    tags: ['Greek', 'Salad', 'Vegetarian', 'Healthy'],
    ingredients: [
      { id: uuidv4(), name: 'Tomatoes', quantity: 3, unit: 'pcs' },
      { id: uuidv4(), name: 'Cucumber', quantity: 1, unit: 'pcs' },
      { id: uuidv4(), name: 'Red onion', quantity: 1, unit: 'pcs' },
      { id: uuidv4(), name: 'Feta cheese', quantity: 200, unit: 'g' },
      { id: uuidv4(), name: 'Olives', quantity: 100, unit: 'g' },
      { id: uuidv4(), name: 'Olive oil', quantity: 50, unit: 'ml' },
      { id: uuidv4(), name: 'Oregano', quantity: 5, unit: 'g' },
    ],
    recipe: {
      steps: [
        'Chop tomatoes, cucumber, and red onion',
        'Combine in a large bowl',
        'Add feta cheese and olives',
        'Drizzle with olive oil',
        'Sprinkle with oregano',
        'Toss and serve'
      ],
      prepTime: 10,
      cookTime: 0
    }
  },
  {
    id: uuidv4(),
    name: 'Beef Tacos',
    defaultServings: 4,
    tags: ['Mexican', 'Quick'],
    ingredients: [
      { id: uuidv4(), name: 'Ground beef', quantity: 500, unit: 'g' },
      { id: uuidv4(), name: 'Taco shells', quantity: 8, unit: 'pcs' },
      { id: uuidv4(), name: 'Lettuce', quantity: 200, unit: 'g' },
      { id: uuidv4(), name: 'Tomatoes', quantity: 2, unit: 'pcs' },
      { id: uuidv4(), name: 'Cheddar cheese', quantity: 150, unit: 'g' },
      { id: uuidv4(), name: 'Sour cream', quantity: 100, unit: 'ml' },
      { id: uuidv4(), name: 'Taco seasoning', quantity: 30, unit: 'g' },
    ],
    recipe: {
      steps: [
        'Brown ground beef in a pan',
        'Add taco seasoning and water, simmer',
        'Warm taco shells',
        'Chop lettuce and tomatoes',
        'Assemble tacos with beef and toppings',
        'Serve with sour cream'
      ],
      prepTime: 10,
      cookTime: 15
    }
  }
];
