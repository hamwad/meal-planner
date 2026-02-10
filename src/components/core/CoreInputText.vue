<script setup lang="ts">
import type { InputTextProps } from "primevue/inputtext";
import { v4 as uuidv4 } from "uuid";
import type { InputHTMLAttributes } from "vue";
defineOptions({ inheritAttrs: false });

defineProps<{
  loading?: boolean;
  error?: string;
  label?: string;
  required?: boolean;
  icon?: string;
  placeholder?: string;
  autofocus?: boolean;
  hint?: string;
  disabled?: boolean;
}>();

const model = defineModel<string | undefined | null>({ default: "" });

const labelId = computed(() => `label=${uuidv4()}`);

const { ...attrs } = useAttrs() as InputTextProps & InputHTMLAttributes;

const requiredSymbol = "*";
</script>

<template>
  <div v-if="loading" class="flex flex-col gap-1">
    <Skeleton height="1.5rem" width="10rem" />
    <Skeleton height="2.65rem" />
  </div>
  <div v-else class="flex flex-col">
    <label v-if="label" :for="attrs.id ?? labelId" class="flex gap-1">
      <span v-if="required" class="text-error">
        {{ requiredSymbol }}
      </span>
      <p>{{ label }}</p>
    </label>
    <IconField v-if="icon" :icon="icon" class="flex">
      <InputText
        v-bind="attrs"
        :id="attrs.id ?? labelId"
        ref="input"
        v-model="model"
        :pt="{ root: 'w-full' }"
        :invalid="!!error"
        :disabled="disabled"
        :placeholder="placeholder"
      />
    </IconField>
    <InputText
      v-else
      v-bind="attrs"
      :id="attrs.id ?? labelId"
      ref="input"
      v-model="model"
      :pt="{ root: 'w-full' }"
      :invalid="!!error"
      :disabled="disabled"
      :placeholder="placeholder"
    />
    <small v-if="error" class="text-error mt-1">{{ error }}</small>
    <small v-if="hint" class="mt-1">{{ hint }}</small>
  </div>
</template>
