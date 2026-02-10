<script setup lang="ts">
import { useCreateFamily, useJoinFamily } from "@/api/families";
import { useAuthStore } from "@/stores/auth";
import type { Family } from "@/types";

const props = defineProps<{
  required?: boolean;
}>();

const emit = defineEmits<{
  (e: "close"): void;
  (e: "family-selected", family: Family): void;
}>();

const authStore = useAuthStore();

const visible = ref(true);
const mode = ref("Create");
const joinCode = ref("");

const createdFamily = ref<Family | null>(null);

const code = computed(() => createdFamily.value?.code ?? "");
const validJoinCode = computed(() => joinCode.value.length === 6);

const { copy, copied } = useClipboard({ source: code });

watch(mode, (newMode) => {
  if (!newMode) return;
  joinCode.value = "";
});

const {
  mutateAsync,
  isPending: isCreatingFamily,
  isSuccess,
} = useCreateFamily();

const {
  mutateAsync: joinFamilyMutation,
  isPending: isJoiningFamily,
  isSuccess: joinedFamily,
  error,
} = useJoinFamily();

const handleCreateFamily = async () => {
  const result = await mutateAsync();
  if (result?.family) {
    createdFamily.value = result.family;
    authStore.setActiveFamily(result.family.id);
    emit("family-selected", result.family);
  }
};

const handleJoinFamily = async () => {
  const result = await joinFamilyMutation(joinCode.value);
  if (result?.family) {
    authStore.setActiveFamily(result.family.id);
    emit("family-selected", result.family);
  }
};

const handleClose = () => {
  if (!props.required) {
    visible.value = false;
    emit("close");
  }
};

const handleDone = () => {
  visible.value = false;
  emit("close");
};
</script>

<template>
  <Dialog
    :visible="visible"
    modal
    header="Create or join family"
    class="w-200"
    :closable="!required"
    :closeOnEscape="!required"
    @update:visible="handleClose"
    @after-hide="$emit('close')"
  >
    <div>
      <SelectButton
        :allow-empty="false"
        class="mb-3"
        v-model="mode"
        :options="['Create', 'Join']"
      />
      <div v-if="mode === 'Create'" class="flex flex-col gap-4">
        <p>
          Create a new family to share your meal library and weekly planner with
          family members
        </p>
        <Button
          v-if="!createdFamily"
          class="w-fit"
          :label="isSuccess ? 'success' : 'Create new family'"
          :loading="isCreatingFamily"
          @click="handleCreateFamily"
        />
        <div class="flex gap-4 items-center" v-else>
          <Button icon="pi pi-check" rounded class="bg-transparent" />
          <p
            class="px-4 py-1 rounded border-dashed border cursor-pointer"
            @click="copy(createdFamily.code)"
          >
            {{ createdFamily.code }}
            <i :class="[!copied ? 'pi pi-copy' : 'pi pi-check', 'ml-2']"></i>
          </p>
          Share this code with family members so they can join your family
        </div>
      </div>
      <div v-else class="flex flex-col gap-4">
        <p>
          Enter a family code below to join an existing family and access their
          shared meals and calendar
        </p>
        <div class="flex flex-col gap-1">
          <InputOtp
            v-model="joinCode"
            :length="6"
            :pt="{ pcInputText: { root: 'uppercase' } }"
            :invalid="!!error"
          />
          <small class="text-red-500" v-if="!!error">{{ error.message }}</small>
        </div>
        <Button
          v-if="!joinedFamily"
          class="w-fit"
          label="Join family"
          :disabled="!validJoinCode"
          :loading="isJoiningFamily"
          @click="handleJoinFamily"
        />
        <div v-else class="flex items-center gap-4">
          <Button icon="pi pi-check" rounded class="bg-transparent" />
          <p>Successfully joined family</p>
        </div>
      </div>
    </div>
    <template #footer v-if="createdFamily || joinedFamily">
      <div class="flex gap-4">
        <Button label="Done" @click="handleDone" />
      </div>
    </template>
  </Dialog>
</template>
