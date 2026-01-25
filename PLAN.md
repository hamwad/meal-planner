# Meal Planner - Project Plan & Progress

## Project Overview

A desktop-first meal planning web application that allows users to manage a meal library, plan weekly meals via drag-and-drop, and automatically generate shopping lists based on planned meals.

**Tech Stack:**
- Vue 3 + TypeScript (Vite)
- Tailwind CSS v4 + DaisyUI
- Pinia (state management)
- VueUse (@vueuse/core) for utilities
- localStorage for persistence
- uuid for ID generation

---

## ✅ Completed Features

### Core Infrastructure
- [x] Vue 3 + TypeScript project setup with Vite
- [x] Tailwind CSS v4 + DaisyUI integration
- [x] Pinia store configuration
- [x] TypeScript type definitions (Meal, Ingredient, CalendarMeal, ShoppingListItem)
- [x] localStorage persistence helpers
- [x] Date utility functions

### Meal Library
- [x] **Full-screen library dialog** (modal approach)
  - Browse mode: Grid view of all meals with scheduling
  - Form mode: Inline add/edit meal form (no nested modals)
- [x] **Recipe import from URLs**
  - Auto-extract: name, servings, ingredients, steps, times, tags, images
  - Support for HelloFresh, BBC Good Food, and schema.org Recipe sites
  - CORS proxy fallback for blocked requests
- [x] **Smart ingredient parsing**
  - Handles fractions (½, ¼, ¾)
  - Converts cups/tablespoons/teaspoons to ml
  - Intelligent defaults for meats (200g/serving) and sauces (50ml)
  - Packet/bag conversion to weight/volume
- [x] **Manual meal creation**
  - Dynamic ingredient list (add/remove)
  - Recipe steps with numbered fields
  - Prep/cook time
  - Tag management
  - Image URL support
- [x] **Automatic ingredient scaling**
  - Change servings → ingredients auto-scale proportionally
  - Works for both imported and manually created recipes
- [x] **Meal editing & deletion**
  - Edit any meal from library or planner
  - Two-step delete confirmation (no nested modals)
  - Changes persist to localStorage
- [x] **Search & filter**
  - Search by meal name, tags, or ingredients
  - Real-time filtering with result count
  - Clear button for quick reset
- [x] **Meal images**
  - Auto-extracted from recipe URLs
  - Manual image URL input
  - Gradient placeholder with emoji for meals without images
- [x] **Sample data**
  - 4 pre-loaded recipes: Spaghetti Carbonara, Chicken Stir-Fry, Greek Salad, Beef Tacos

### Weekly Planner
- [x] **Two-week view** (current week + next week)
  - Each week displays 7-day grid (Mon-Sun)
  - Section headers for clarity
- [x] **Week navigation**
  - Previous/Next buttons (shifts both weeks)
  - "Today" button returns to current week
  - Date range display in header
- [x] **Meal scheduling from library**
  - Click day buttons under each meal in library
  - Toggle on/off (blue = scheduled, outline = not scheduled)
  - Visual feedback for scheduled state
- [x] **Planned meal cards**
  - Display meal name and servings
  - Click card to edit underlying meal
  - Remove button (X) to unschedule from specific day
- [x] **Drop zones** (legacy drag-drop support retained)
  - Meals can still be dragged from library cards
  - Drop zones highlight on dragover

### Shopping List
- [x] **Auto-generated from planned meals**
  - Aggregates ingredients across all scheduled meals
  - Combines quantities for duplicate ingredients (case-insensitive)
  - Tracks which meals contribute to each ingredient
- [x] **Week filter**
  - "This Week" / "Next Week" / "Both" toggle buttons
  - Only shows ingredients for selected timeframe
  - Perfect for weekly shopping trips
- [x] **Smart rounding**
  - Pieces (pcs): Always round up to whole numbers
  - Small amounts (≤10g): Round to nearest 5g
  - Medium amounts (10-200g): Round to nearest 10-25g
  - Large amounts (>500g): Round to nearest 100g
  - Liquids: Similar tiered rounding for ml
- [x] **Interactive list**
  - Checkbox for each ingredient (visual feedback only)
  - Shows quantity, unit, and contributing meal names
  - Item count display
- [x] **Copy to clipboard**
  - One-click copy of full shopping list
  - Format: "Ingredient: quantity (meal1, meal2)"

### Data Persistence
- [x] **Meals store** → localStorage (`meal-planner-meals`)
- [x] **Calendar store** → localStorage (`meal-planner-calendar`)
- [x] **Shopping list** → Computed (NEVER persisted, always derived)
- [x] Auto-save on all changes

---

## 📋 Deferred Features (TODOs)

### High Priority
- [ ] **Recipe viewing modal**
  - Click planned meal to see full recipe (steps, times, ingredients)
  - Separate from edit mode
- [ ] **Servings override UI**
  - Inline editor on planned meals to adjust servings per instance
  - Currently uses meal's default servings
- [ ] **Mobile responsive layout**
  - Currently desktop-only (grid layout doesn't adapt)
  - Consider drawer/tabs for mobile
- [ ] **Meal categories/filtering**
  - Filter by tags in library (Quick, Vegetarian, etc.)
  - Category chips for better organization

### Medium Priority
- [ ] **Monthly calendar view**
  - See full month at a glance
  - Navigate to different months
- [ ] **Batch operations**
  - Duplicate a week's plan to next week
  - Clear all meals from a week
  - Template weeks
- [ ] **Print shopping list**
  - Printer-friendly format
  - Group by category (produce, meat, dairy)
- [ ] **Meal notes/ratings**
  - Add personal notes to meals
  - Star rating system
- [ ] **Advanced search**
  - Filter by prep/cook time
  - Filter by ingredient availability
  - Exclude certain ingredients

### Low Priority / Future
- [ ] **Backend API** (replace localStorage)
  - User accounts
  - Cloud sync across devices
- [ ] **Pantry tracking**
  - Mark ingredients you already have
  - Shopping list excludes pantry items
- [ ] **AI meal suggestions**
  - Suggest meals based on ingredients you have
  - Suggest weekly meal plans
- [ ] **Social features**
  - Share meals with friends
  - Public meal library
  - Import meals from others
- [ ] **Nutritional information**
  - Calorie tracking
  - Macro breakdown
- [ ] **Meal prep mode**
  - Batch cooking suggestions
  - Ingredient overlap optimization

---

## 🏗️ Project Structure

```
src/
├── types/
│   └── index.ts                  # TypeScript interfaces (Meal, Ingredient, etc.)
│
├── stores/                       # Pinia state management
│   ├── meals.ts                  # Meal library (persisted)
│   ├── calendar.ts               # Planned meals (persisted)
│   └── shoppingList.ts           # Derived shopping list (computed, NOT persisted)
│
├── composables/
│   ├── useDragAndDrop.ts         # Shared drag state
│   └── useLocalStorage.ts        # localStorage helpers
│
├── utils/
│   ├── dateHelpers.ts            # getWeekStart, addDays, formatDate, etc.
│   ├── sampleData.ts             # Initial 4 sample recipes
│   ├── recipeParser.ts           # URL import + ingredient parsing
│   └── roundingHelpers.ts        # Smart rounding for shopping list
│
├── components/
│   ├── MealLibrary/
│   │   └── MealLibraryDialog.vue # Full-screen library (browse + form modes)
│   │
│   ├── Planner/
│   │   ├── Planner.vue           # Main planner container + navigation
│   │   ├── WeekView.vue          # 7-day grid
│   │   ├── DayColumn.vue         # Single day drop zone
│   │   └── PlannedMealCard.vue   # Meal in calendar (with remove/edit)
│   │
│   └── ShoppingList/
│       ├── ShoppingList.vue      # List container + week filter
│       └── IngredientItem.vue    # Single ingredient with checkbox
│
├── App.vue                       # 2-column layout: Planner + Shopping List
├── main.ts                       # App entry + Pinia setup
└── style.css                     # Tailwind + DaisyUI imports
```

---

## 🎯 Design Decisions

### State Architecture
- **Meals store**: Source of truth for recipes (CRUD operations)
- **Calendar store**: References meals by ID (no data duplication)
- **Shopping list**: 100% derived from calendar + meals (never stored)
- **Data flow**: Calendar references → Meals data → Aggregated shopping list

### UX Improvements Made
1. **No nested modals**: Library form is inline (browse/form view toggle)
2. **Two-step delete**: Confirm button instead of browser confirm()
3. **Smart defaults**: Meats = 200g/serving, sauces = 50ml
4. **Case-insensitive aggregation**: "Cucumber" + "cucumber" = single item
5. **Week filtering**: Shop for one week at a time
6. **Search everywhere**: Name, tags, ingredients

### Drag-and-Drop Evolution
- **Original plan**: Drag meals from library sidebar to calendar
- **Current implementation**: Click day buttons in library dialog (primary)
  - More intuitive for batch scheduling
  - Toggle on/off visual feedback
  - Drag-drop still works (legacy support)

---

## 🚀 Getting Started

### Installation
```bash
npm install
```

### Development
```bash
npm run dev
# Open http://localhost:5173
```

### Build
```bash
npm run build
```

---

## 📝 Manual Testing Checklist

### Meal Library
- [ ] Import recipe from URL (HelloFresh, BBC Good Food)
- [ ] Manually create meal with ingredients
- [ ] Edit existing meal
- [ ] Delete meal (two-step confirmation)
- [ ] Search for meal by name/tag/ingredient
- [ ] Add image URL to meal

### Weekly Planner
- [ ] Schedule meal for specific day (click day button in library)
- [ ] Toggle meal off (click blue day button)
- [ ] Navigate weeks (Previous/Next/Today)
- [ ] Click meal card to edit recipe
- [ ] Remove meal from specific day (X button)
- [ ] Verify both weeks display correctly

### Shopping List
- [ ] Filter by "This Week" / "Next Week" / "Both"
- [ ] Verify ingredient aggregation (same ingredient from multiple meals)
- [ ] Verify smart rounding (666.7g → 700g, 26.7g → 30g)
- [ ] Check/uncheck items
- [ ] Copy to clipboard

### Data Persistence
- [ ] Create meal → refresh page → meal persists
- [ ] Schedule meal → refresh page → calendar persists
- [ ] Shopping list regenerates correctly after refresh

---

## 🐛 Known Issues

- None currently tracked

---

## 🔧 Technical Debt

- [ ] Add proper error boundaries for fetch failures
- [ ] Add loading states for async operations
- [ ] Consider optimistic UI updates
- [ ] Add unit tests for stores
- [ ] Add E2E tests for critical flows
- [ ] Accessibility audit (keyboard navigation, ARIA labels)
- [ ] Performance optimization for large meal libraries (virtualization?)

---

## 📚 Resources

- [Vite Documentation](https://vitejs.dev/)
- [Vue 3 Documentation](https://vuejs.org/)
- [Pinia Documentation](https://pinia.vuejs.org/)
- [Tailwind CSS v4](https://tailwindcss.com/)
- [DaisyUI Components](https://daisyui.com/)
- [Schema.org Recipe](https://schema.org/Recipe) - For URL import

---

## 🎨 Future UI Enhancements

- Dark mode toggle
- Custom color themes
- Print-friendly layouts
- Export to PDF
- Animations/transitions for better UX
- Skeleton loaders
- Toast notifications instead of alerts

---

Last Updated: 2026-01-26
