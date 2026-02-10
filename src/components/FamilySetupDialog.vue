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

const { mutateAsync, isPending: isCreatingFamily } = useCreateFamily();

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
    // authStore.setActiveFamily(result.family.id);
    // emit("family-selected", result.family);
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

const handleContinue = () => {
  if (createdFamily.value) {
    authStore.setActiveFamily(createdFamily.value.id);
    emit("family-selected", createdFamily.value);
  }
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
    closable
    @update:visible="handleClose"
    @after-hide="$emit('close')"
  >
    <div>
      <div class="flex flex-col">
        <div class="flex flex-col">
          <p class="text font-semibold mb-2">Join an existing family</p>
          <p class="mb-2">
            Enter family code below to join existing family and access their
            shared meals and calendar
          </p>
          <div class="flex gap-4">
            <InputOtp
              v-model="joinCode"
              :length="6"
              :pt="{ pcInputText: { root: 'uppercase' } }"
              :invalid="!!error"
            />
            <small class="text-red-500" v-if="!!error">
              {{ error.message }}
            </small>
            <Button
              v-if="!joinedFamily"
              class="w-fit"
              label="Join family"
              :disabled="!validJoinCode"
              :loading="isJoiningFamily"
              @click="handleJoinFamily"
            />
            <div v-else class="flex items-center gap-4">
              <Button
                icon="pi pi-check"
                rounded
                class="bg-transparent"
                size="small"
              />
              <p>Successfully joined family</p>
            </div>
          </div>
        </div>
      </div>

      <Divider align="center" class="py-4!">
        <span class="text-surface-500 text-sm">or</span>
      </Divider>

      <div class="flex flex-col">
        <p class="text font-semibold mb-2">Create a new family</p>
        <p>
          Create a new family to share your meal library and weekly planner with
          family members
        </p>
        <Button
          v-if="!createdFamily"
          class="w-fit"
          label="Create new family"
          :loading="isCreatingFamily"
          @click="handleCreateFamily"
        />
        <div class="flex flex-col gap-2" v-else>
          <div class="flex items-center gap-2 mt-2 ml-4">
            <i class="pi pi-check-circle text-green-500" />
            <span>Family created!</span>
          </div>
          <div class="flex items-baseline gap-2">
            <p>Share this code with family members</p>
            <div
              class="flex items-center justify-center gap-2 px-2 rounded-lg bg-gray-300 cursor-pointer hover:bg-surface-100 transition-colors"
              @click="copy(createdFamily!.code)"
            >
              <span class="text-lg font-bold">
                {{ createdFamily!.code }}
              </span>
              <i
                :class="[
                  !copied ? 'pi pi-copy' : 'pi pi-check text-green-500',
                  'text-lg',
                ]"
              />
            </div>
            <small v-if="copied" class="text-green-500 text-center"
              >Copied to clipboard</small
            >
          </div>
        </div>
      </div>
    </div>
    <template #footer>
      <div class="flex gap-4">
        <Button
          label="Continue"
          @click="handleContinue"
          :disabled="!createdFamily && !joinedFamily"
        />
      </div>
    </template>
  </Dialog>
</template>
