import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import VueDevTools from "vite-plugin-vue-devtools";
import { PrimeVueResolver } from "@primevue/auto-import-resolver";
import Components from "unplugin-vue-components/vite";
import AutoImport from "unplugin-auto-import/vite";
import { VueRouterAutoImports } from "unplugin-vue-router";

export default defineConfig({
  plugins: [
    VueDevTools(),
    vue(),
    Components({
      resolvers: [PrimeVueResolver()],
      dirs: ["src/components", "src/pages/**/components"],
    }),
    tailwindcss(),
    AutoImport({
      imports: [
        VueRouterAutoImports,
        "vue",
        "@vueuse/core",
        {
          "vee-validate": ["useForm", "useField"],
          yup: [["*", "yup"]],
        },
      ],
      dirs: ["src/composables"],
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
