import { createRouter, createWebHistory } from "vue-router";
import { useAuthStore } from "@/stores/auth";

import AuthenticatedLayout from "@/components/layouts/AuthenticatedLayout.vue";
import HomeView from "@/pages/index.vue";
import MealsView from "@/pages/meals/index.vue";
import AuthView from "@/pages/auth.vue";
import ShoppingListView from "@/pages/shopping-list/index.vue";
import SettingsView from "@/pages/settings/index.vue";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      component: AuthenticatedLayout,
      meta: { requiresAuth: true },
      children: [
        { path: "", component: HomeView },
        { path: "meals", component: MealsView },
        { path: "shopping-list", component: ShoppingListView },
        { path: "settings", component: SettingsView },
      ],
    },
    {
      path: "/auth",
      component: AuthView,
      meta: { requiresGuest: true },
    },
  ],
});

router.beforeEach(async (to, _from, next) => {
  const authStore = useAuthStore();

  // Wait for auth to initialize if not already done
  if (!authStore.isInitialized) {
    await authStore.initialize();
  }

  // Redirect authenticated users away from auth page
  if (to.meta.requiresGuest && authStore.isAuthenticated) {
    return next("/");
  }

  // Redirect unauthenticated users to auth page
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    return next("/auth");
  }

  next();
});

export default router;
