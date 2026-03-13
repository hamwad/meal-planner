<script setup lang="ts">
import { useAuthStore } from "@/stores/auth";
import { useLeaveFamily } from "@/api/families";
import FamilySetupDialog from "@/components/FamilySetupDialog.vue";

const authStore = useAuthStore();
const router = useRouter();
const { mutateAsync: leaveFamily } = useLeaveFamily();

const confirmDialog = ref<HTMLDialogElement | null>(null);
const familySetupDialogVisible = ref(false);

const { copy } = useClipboard({
  source: computed(() => authStore.activeFamilyCode ?? ""),
});

const copyFamilyCode = () => copy(authStore.activeFamilyCode ?? "");
const openFamilySetupDialog = () => (familySetupDialogVisible.value = true);
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

const items = computed(() => [
  {
    label: "Copy family code",
    icon: "pi pi-copy",
    command: copyFamilyCode,
  },
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
  {
    label: "Leave this family",
    icon: "pi pi-sign-out",
    command: handleLeaveFamily,
    disabled: authStore.families.length <= 1,
  },
  { label: "Sign out", icon: "pi pi-power-off", command: handleSignOut },
]);
</script>

<template>
  <!-- <pre>{{ authStore }}</pre> -->
  <div class="bg-gray-300 rounded p-2 mb-4">
    <h3 class="font-bold">Current user</h3>
    <p>userId: {{ authStore.userId }}</p>
    <p>email: {{ authStore.userEmail }}</p>
    <p>activeFamilyCode: {{ authStore.activeFamilyCode }}</p>
    <h3 class="font-bold">Current user families</h3>
    <div v-for="(f, index) in authStore.families" :key="f.id">
      <p>{{ [index] }}</p>
      <p>familyId: {{ f.id }}</p>
      <p>code: {{ f.code }}</p>
    </div>
  </div>
  <div v-for="item in items" :key="item.label">
    <Button
      outlined
      :label="item.label"
      :icon="item.icon"
      :disabled="item.disabled"
      class="w-full mb-4"
      @click="item.command?.()"
    />
  </div>

  <FamilySetupDialog
    v-if="familySetupDialogVisible"
    @close="familySetupDialogVisible = false"
    @family-selected="familySetupDialogVisible = false"
  />

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
</template>
