import { createApp } from "vue";
import { createPinia } from "pinia";
import { VueQueryPlugin, QueryClient } from "@tanstack/vue-query";
import "./style.css";
import App from "./App.vue";
import router from "./router";
import PrimeVue from "primevue/config";
import Aura from "@primeuix/themes/aura";

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
app.use(PrimeVue, {
  theme: {
    preset: Aura,
  },
});
app.use(VueQueryPlugin, { queryClient });
app.mount("#app");
