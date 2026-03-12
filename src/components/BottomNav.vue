<script setup lang="ts">
const router = useRouter();
const route = useRoute();

const navItems = [
  { label: "Schedule", icon: "pi-calendar", path: "/" },
  { label: "Library", icon: "pi-book", path: "/meals" },
  { label: "List", icon: "pi-shopping-cart", path: "/shopping-list" },
  { label: "Settings", icon: "pi-cog", path: "/settings" },
];

function isActive(path: string) {
  return route.path === path;
}
</script>

<template>
  <nav
    class="fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-gray-200 flex items-center"
  >
    <button
      v-for="item in navItems"
      :key="item.path"
      class="flex-1 flex flex-col items-center justify-center gap-1 h-full text-xs transition-colors"
      :class="isActive(item.path) ? 'text-amber-500' : 'text-gray-400'"
      @click="router.push(item.path)"
    >
      <i class="pi text-xl" :class="item.icon" />
      <span>{{ item.label }}</span>
    </button>
  </nav>
</template>
