<script setup lang="ts">
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import { useLeaveFamily } from "@/api/families";
import FamilySetupDialog from "@/components/FamilySetupDialog.vue";
import FamilyChip from "@/components/FamilyChip.vue";
import logoImage from "@/assets/images/logo_navbar.png";

const emit = defineEmits<{
  showShoppingList: [visible: boolean];
}>();

const router = useRouter();
const authStore = useAuthStore();
const { mutateAsync: leaveFamily } = useLeaveFamily();

const settingsMenu = ref();
const confirmDialog = ref<HTMLDialogElement | null>(null);
const familySetupDialogVisible = ref(false);
const shoppingListVisible = ref(true);

const { copy } = useClipboard({
  source: computed(() => authStore.activeFamilyCode ?? ""),
});

const copyFamilyCode = () => {
  copy(authStore.activeFamilyCode ?? "");
};

const handleLeaveFamily = () => confirmDialog.value?.showModal();
const closeConfirmDialog = () => confirmDialog.value?.close();

const confirmLeaveFamily = async () => {
  if (!authStore.activeFamilyId) return;

  try {
    await leaveFamily(authStore.activeFamilyId);
    closeConfirmDialog();
  } catch (error) {
    console.error("Error leaving family:", error);
    alert("Failed to leave family. Please try again.");
  }
};

const handleSignOut = async () => {
  await authStore.signOut();
  router.push("/auth");
};

const openFamilySetupDialog = () => {
  familySetupDialogVisible.value = true;
};

const toggleSettingsMenu = (event: Event) => {
  settingsMenu.value?.toggle(event);
};

const handleShowShoppingList = () => {
  shoppingListVisible.value = !shoppingListVisible.value;
  emit("showShoppingList", shoppingListVisible.value);
};

const menuItems = computed(() => [
  { label: "Copy family code", icon: "pi pi-copy", command: copyFamilyCode },
  {
    label: "Create new family",
    icon: "pi pi-plus",
    command: openFamilySetupDialog,
  },
  {
    label: "Join another family",
    icon: "pi pi-users",
    command: openFamilySetupDialog,
  },
  { separator: true },
  {
    label: "Leave this family",
    icon: "pi pi-sign-out",
    command: handleLeaveFamily,
    disabled: authStore.families.length <= 1,
  },
  { separator: true },
  { label: "Sign out", icon: "pi pi-power-off", command: handleSignOut },
]);
</script>

<template>
  <div class="flex items-center p-2 shrink-0">
    <img :src="logoImage" alt="logo" class="h-20 object-fit" />
    <div class="flex gap-4 ml-28">
      <Button
        label="Planner"
        icon="pi pi-calendar"
        text
        :pt="{
          label: {
            class: { 'border-b-2! border-b-primary!': $route.path === '/' },
          },
        }"
        @click="$router.push('/')"
      />
      <Button
        label="Library"
        icon="pi pi-book"
        text
        :pt="{
          label: {
            class: {
              'border-b-2! border-b-primary!': $route.path.startsWith('/meals'),
            },
          },
        }"
        @click="$router.push('/meals')"
      />
    </div>
    <div class="flex items-center gap-2 ml-auto mr-8">
      <FamilyChip />
      <Button
        v-if="authStore.hasAnyFamily && $route.path === '/'"
        icon="pi pi-list-check"
        text
        size="large"
        :severity="shoppingListVisible ? 'primary' : 'secondary'"
        @click="handleShowShoppingList"
      />
      <Button
        v-if="authStore.hasAnyFamily"
        icon="pi pi-cog"
        text
        size="large"
        @click="toggleSettingsMenu"
      />
      <Button
        v-else
        label="Create or join family"
        @click="openFamilySetupDialog"
      />
      <Menu ref="settingsMenu" :model="menuItems" :popup="true" />
    </div>

    <FamilySetupDialog
      v-if="familySetupDialogVisible"
      @close="familySetupDialogVisible = false"
      @family-selected="familySetupDialogVisible = false"
    />

    <!-- Leave Family Confirmation Dialog -->
    <dialog ref="confirmDialog" class="p-6 rounded-lg shadow-xl">
      <div class="flex flex-col gap-4">
        <h3 class="text-lg font-semibold">Leave Family?</h3>
        <p>
          Are you sure you want to leave this family? You will lose access to
          shared meals and calendar.
        </p>
        <div class="flex gap-2 justify-end">
          <Button
            label="Cancel"
            severity="secondary"
            @click="closeConfirmDialog"
          />
          <Button label="Leave" severity="danger" @click="confirmLeaveFamily" />
        </div>
      </div>
    </dialog>
  </div>
</template>
