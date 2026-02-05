# AI Context: Menu Planner App

> This file provides context for AI assistants working on this project. It documents architectural decisions, coding patterns, and common tasks.

## Project Overview

A family meal planning application built with Vue 3, TypeScript, and Supabase. Users can create meals, plan weekly menus, and generate shopping lists. Families can share data by joining with a family code.

## Core Architecture Decisions

### 1. Authentication & Family Model

**Decision: Auto-Created Personal Families**

Every user automatically gets a personal family upon first authentication. No setup required.

- User visits app → anonymous auth → family auto-created → ready to use
- Personal families become shared when others join using the family code
- Current limitation: Users can belong to max 1 family (may expand later)
- No local storage: All data persists to Supabase

**Why:** Removes friction from onboarding while maintaining family-sharing architecture. Simpler than managing personal vs. family data separately.

### 2. State Management Strategy

**Pinia for UI/Auth State + TanStack Query for Server State**

- **Pinia stores** (`src/stores/`): Authentication, UI state
- **TanStack Query** (`src/composables/queries/`, `src/composables/mutations/`): Server data fetching, caching, mutations

**Why:** Separation of concerns. TanStack Query provides optimistic updates, automatic refetching, and cache management for server data.

### 3. Data Flow

```
User Action → Mutation (optimistic update) → Supabase → Query Invalidation → UI Update
```

- Mutations use TanStack Query's `useMutation`
- Optimistic updates for instant UI feedback
- Automatic rollback on error
- Query invalidation triggers refetch for all family members

### 4. Database Schema

All tables include `family_id` to scope data:
- `families` - Family groups with unique 6-char codes
- `family_members` - User-to-family relationships
- `meals` - Meal library (name, ingredients, servings)
- `calendar_meals` - Planned meals with dates
- `shopping_list_items` - Shopping list entries

**Security:** Row Level Security (RLS) policies ensure users only access their family's data.

## Key Files & Patterns

### Auth Store (`src/stores/auth.ts`)

Manages authentication and family membership:

```typescript
// Auto-creates family on initialization
const initialize = async () => {
  // Sign in user
  // Check if family exists
  // If not, auto-create personal family
  // Set familyId
}
```

**Pattern:** Always check `authStore.familyId` before data operations. Should never be null after initialization.

### Queries (`src/composables/queries/`)

Use TanStack Query for data fetching:

```typescript
export function useMealsQuery() {
  const authStore = useAuthStore();

  return useQuery({
    queryKey: ["meals", authStore.familyId],
    queryFn: async () => {
      // Fetch from Supabase
      // Transform to app format
    },
    enabled: computed(() => !!authStore.familyId),
  });
}
```

**Pattern:**
- Query keys include `familyId` for proper scoping
- Use `enabled` to prevent queries before auth initializes
- Transform data between DB format and app format

### Mutations (`src/composables/mutations/`)

Use TanStack Query for data mutations:

```typescript
const addMeal = useMutation({
  mutationFn: async (meal: Meal) => {
    if (!authStore.familyId) {
      throw new Error("Family not initialized...");
    }
    // Transform and insert to Supabase
  },
  onMutate: async (newMeal) => {
    // Cancel queries
    // Snapshot previous data
    // Optimistically update cache
    return { previousMeals };
  },
  onError: (err, variables, context) => {
    // Rollback on error
    queryClient.setQueryData(['meals', familyId], context.previousMeals);
  },
  onSettled: () => {
    // Always refetch to ensure consistency
    queryClient.invalidateQueries(['meals', familyId]);
  },
});
```

**Pattern:**
- Optimistic updates in `onMutate`
- Rollback in `onError`
- Invalidate queries in `onSettled` to sync across devices

### Data Transformers (`src/utils/transformers.ts`)

Convert between app format and database format:

```typescript
// App uses camelCase, DB uses snake_case
export function transformToMeal(dbMeal: DbMeal): Meal {
  return {
    id: dbMeal.meal_id,
    name: dbMeal.name,
    // ...
  };
}

export function transformMealToSupabase(meal: Meal, familyId: string): DbMeal {
  return {
    meal_id: meal.id,
    family_id: familyId,
    name: meal.name,
    // ...
  };
}
```

**Pattern:** Always use transformers when reading/writing to Supabase.

## Component Patterns

### Auto-Imports

Components and composables are auto-imported:

```vue
<script setup lang="ts">
// No need to import ref, computed, etc.
const count = ref(0)

// No need to import useMealsQuery
const { data: meals } = useMealsQuery()
</script>
```

**Configured in:** `vite.config.ts` with `unplugin-auto-import` and `unplugin-vue-components`

### Reactive Data from Queries

```vue
<script setup lang="ts">
const { data: meals, isLoading, error } = useMealsQuery();

// meals is a Ref, automatically reactive
</script>

<template>
  <div v-if="isLoading">Loading...</div>
  <div v-else-if="error">Error: {{ error.message }}</div>
  <div v-else>
    <div v-for="meal in meals" :key="meal.id">
      {{ meal.name }}
    </div>
  </div>
</template>
```

## Common Tasks

### Adding a New Feature

1. **Add database table** (if needed) in Supabase with `family_id` column
2. **Add RLS policies** to secure the table
3. **Create TypeScript types** in `src/types/index.ts`
4. **Add transformers** in `src/utils/transformers.ts`
5. **Create queries** in `src/composables/queries/`
6. **Create mutations** in `src/composables/mutations/`
7. **Create/update components** to use the new queries/mutations

### Debugging Sync Issues

1. Check browser console for Supabase errors
2. Verify `familyId` is set in auth store
3. Check RLS policies in Supabase dashboard
4. Use TanStack Query DevTools to inspect cache
5. Check query keys match between queries and invalidations

### Testing Family Sharing

1. Open app in two different browsers (or incognito)
2. Note family code from first browser
3. In second browser, join family using the code
4. Make changes in one browser, verify they appear in the other

## Coding Conventions

- **File naming:** camelCase for composables, PascalCase for components
- **Component structure:** `<script setup>` with TypeScript
- **Styling:** TailwindCSS utility classes, DaisyUI components
- **Error handling:** User-friendly error messages, console.error for debugging
- **Comments:** Only where logic isn't self-evident

## Environment Setup

Required environment variables in `.env`:

```env
VITE_SUPABASE_URL=your_project_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

See `SUPABASE_SETUP.md` for detailed setup instructions.

## Known Limitations

1. **Single family per user** - Users can only belong to one family at a time
2. **No offline queue** - Changes made offline will fail (not queued)
3. **No conflict resolution UI** - Last write wins
4. **No real-time subscriptions** - Uses query refetching instead of WebSocket subscriptions

## Future Considerations

- Multi-family support per user
- Offline mutation queue
- Real-time subscriptions (replace polling)
- Meal categories/tags
- Recipe scaling
- Nutritional information

---

**Last Updated:** 2026-02-01
**Primary AI Assistant:** Claude Code
