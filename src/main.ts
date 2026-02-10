import { createApp } from "vue";
import { createPinia } from "pinia";
import { VueQueryPlugin, QueryClient } from "@tanstack/vue-query";
import "./style.css";
import App from "./App.vue";
import router from "./router";
import PrimeVue from "primevue/config";
import Aura from "@primeuix/themes/aura";
import { definePreset } from "@primeuix/themes";

/**
 * Vue Query client instance configured with aggressive data fetching and caching strategies.
 *
 * **Query Configuration:**
 * - Data remains fresh for 30 seconds before being marked as stale
 * - Unused data is garbage collected after 5 minutes
 * - Automatically refetches data every 10 seconds (polling)
 * - Retries failed requests up to 3 times
 * - Refetches when browser window regains focus
 * - Refetches when network connection is restored
 * - Only executes queries when online
 *
 * **Mutation Configuration:**
 * - Retries failed mutations once
 * - Only executes mutations when online
 *
 * This configuration ensures near real-time data synchronization with the server
 * while maintaining a responsive user experience through client-side caching.
 */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30000, // 30s fresh
      gcTime: 5 * 60 * 1000, // 5min cache
      retry: 3,
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      networkMode: "online",
    },
    mutations: {
      retry: 1,
      networkMode: "online",
    },
  },
});

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
app.use(router);
const MealPlannerPreset = definePreset(Aura, {
  semantic: {
    primary: {
      50: "#FEF3E6",
      100: "#FDE0C0",
      200: "#FBCC96",
      300: "#F9B76C",
      400: "#F7A04A",
      500: "#F58426",
      600: "#E07020",
      700: "#B85A1A",
      800: "#904514",
      900: "#6B330F",
      950: "#48220A",
    },
  },
});

app.use(PrimeVue, {
  theme: {
    preset: MealPlannerPreset,
  },
});
app.use(VueQueryPlugin, { queryClient });
app.mount("#app");
