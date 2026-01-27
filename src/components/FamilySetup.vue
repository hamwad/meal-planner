<template>
  <dialog ref="dialog" class="modal" :class="{ 'modal-open': isOpen }">
    <div class="modal-box max-w-2xl">
      <h3 class="font-bold text-2xl mb-4">Family Setup</h3>

      <div role="tablist" class="tabs tabs-bordered">
        <a
          role="tab"
          class="tab"
          :class="{ 'tab-active': activeTab === 'create' }"
          @click="activeTab = 'create'"
        >
          Create Family
        </a>
        <a
          role="tab"
          class="tab"
          :class="{ 'tab-active': activeTab === 'join' }"
          @click="activeTab = 'join'"
        >
          Join Family
        </a>
      </div>

      <!-- Create Family Tab -->
      <div v-if="activeTab === 'create'" class="py-6">
        <div v-if="!createdFamily" class="space-y-4">
          <p class="text-base-content/70">
            Create a new family to share your meal library and weekly planner with family members.
          </p>

          <button
            class="btn btn-primary w-full"
            :disabled="isCreating"
            @click="handleCreateFamily"
          >
            <span v-if="isCreating" class="loading loading-spinner"></span>
            {{ isCreating ? 'Creating...' : 'Create New Family' }}
          </button>

          <div v-if="error" class="alert alert-error">
            <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{{ error }}</span>
          </div>
        </div>

        <div v-else class="space-y-6">
          <div class="alert alert-success">
            <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Family created successfully!</span>
          </div>

          <div class="space-y-2">
            <label class="text-sm font-semibold">Your Family Code</label>
            <div class="flex gap-2">
              <input
                type="text"
                :value="createdFamily.code"
                readonly
                class="input input-bordered flex-1 font-mono text-2xl text-center font-bold"
              />
              <button class="btn btn-square" @click="copyCode">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </button>
            </div>
            <p class="text-sm text-base-content/60">
              Share this code with family members so they can join your family.
            </p>
          </div>

          <button class="btn btn-primary w-full" @click="finishSetup">
            Done
          </button>
        </div>
      </div>

      <!-- Join Family Tab -->
      <div v-if="activeTab === 'join'" class="py-6">
        <div class="space-y-4">
          <p class="text-base-content/70">
            Enter a family code to join an existing family and access their shared meals and calendar.
          </p>

          <div class="alert alert-warning">
            <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span class="text-sm">Joining a family will replace your local meal library and calendar.</span>
          </div>

          <div class="form-control">
            <label class="label">
              <span class="label-text font-semibold">Family Code</span>
            </label>
            <input
              v-model="joinCode"
              type="text"
              placeholder="ABC123"
              class="input input-bordered font-mono text-lg text-center uppercase"
              maxlength="6"
              @input="joinCode = joinCode.toUpperCase()"
            />
          </div>

          <button
            class="btn btn-primary w-full"
            :disabled="!joinCode || joinCode.length !== 6 || isJoining"
            @click="handleJoinFamily"
          >
            <span v-if="isJoining" class="loading loading-spinner"></span>
            {{ isJoining ? 'Joining...' : 'Join Family' }}
          </button>

          <div v-if="error" class="alert alert-error">
            <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{{ error }}</span>
          </div>
        </div>
      </div>
    </div>
  </dialog>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { useMealsStore } from '@/stores/meals';
import { useCalendarStore } from '@/stores/calendar';
import { familyService } from '@/services/familyService';
import { isSupabaseConfigured } from '@/services/supabase';
import type { Family } from '@/types';

const emit = defineEmits<{
  familyCreated: [];
  familyJoined: [];
}>();

const authStore = useAuthStore();
const mealsStore = useMealsStore();
const calendarStore = useCalendarStore();

const dialog = ref<HTMLDialogElement | null>(null);
const isOpen = ref(false);
const activeTab = ref<'create' | 'join'>('create');
const isCreating = ref(false);
const isJoining = ref(false);
const error = ref<string | null>(null);
const createdFamily = ref<Family | null>(null);
const joinCode = ref('');

const openDialog = () => {
  if (!isSupabaseConfigured()) {
    return;
  }

  isOpen.value = true;
  dialog.value?.showModal();
};

const closeDialog = () => {
  isOpen.value = false;
  dialog.value?.close();
};

const handleCreateFamily = async () => {
  isCreating.value = true;
  error.value = null;

  try {
    // Create family
    const { family, error: createError } = await familyService.createFamily();

    if (createError || !family) {
      throw createError || new Error('Failed to create family');
    }

    // Set family in auth store
    authStore.setFamily(family);

    // Upload existing meals and calendar to Supabase
    await Promise.all([
      mealsStore.uploadAllMealsToSupabase(),
      calendarStore.uploadAllCalendarToSupabase(),
    ]);

    createdFamily.value = family;
  } catch (err: any) {
    error.value = err.message || 'Failed to create family';
    console.error('Error creating family:', err);
  } finally {
    isCreating.value = false;
  }
};

const handleJoinFamily = async () => {
  if (!joinCode.value || joinCode.value.length !== 6) return;

  isJoining.value = true;
  error.value = null;

  try {
    // Join family
    const { family, error: joinError } = await familyService.joinFamily(joinCode.value);

    if (joinError || !family) {
      throw joinError || new Error('Family code not found');
    }

    // Set family in auth store
    authStore.setFamily(family);

    // Clear local data
    mealsStore.clearMeals();
    calendarStore.clearCalendar();

    // Emit event and close
    emit('familyJoined');
    closeDialog();

    // Reload page to sync data
    window.location.reload();
  } catch (err: any) {
    error.value = err.message || 'Failed to join family';
    console.error('Error joining family:', err);
  } finally {
    isJoining.value = false;
  }
};

const copyCode = async () => {
  if (createdFamily.value) {
    try {
      await navigator.clipboard.writeText(createdFamily.value.code);
      // Could add a toast notification here
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  }
};

const finishSetup = () => {
  emit('familyCreated');
  closeDialog();

  // Reload page to start syncing
  window.location.reload();
};

defineExpose({
  openDialog,
  closeDialog,
});
</script>

<style scoped>
.modal-box {
  max-height: 90vh;
  overflow-y: auto;
}
</style>
