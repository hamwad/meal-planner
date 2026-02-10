<script setup lang="ts">
import { toTypedSchema } from "@vee-validate/yup";
import { useAuthStore } from "@/stores/auth";

const authStore = useAuthStore();
const router = useRouter();

const mode = ref<"login" | "signup">("login");
const isLoading = ref(false);
const authError = ref<string | null>(null);

// Login schema
const loginSchema = computed(() =>
  toTypedSchema(
    yup.object({
      email: yup.string().email("Invalid email").required("Email is required"),
      password: yup
        .string()
        .min(8, "Password must be at least 8 characters")
        .required("Password is required"),
    }),
  ),
);

// Signup schema
const signupSchema = computed(() =>
  toTypedSchema(
    yup.object({
      email: yup.string().email("Invalid email").required("Email is required"),
      password: yup
        .string()
        .min(8, "Password must be at least 8 characters")
        .required("Password is required"),
      confirmPassword: yup
        .string()
        .oneOf([yup.ref("password")], "Passwords must match")
        .required("Please confirm your password"),
    }),
  ),
);

// Login form
const {
  handleSubmit: handleLoginSubmit,
  errors: loginErrors,
  defineField: defineLoginField,
  resetForm: resetLoginForm,
} = useForm({
  validationSchema: loginSchema,
});

const [loginEmail] = defineLoginField("email");
const [loginPassword] = defineLoginField("password");

// Signup form
const {
  handleSubmit: handleSignupSubmit,
  errors: signupErrors,
  defineField: defineSignupField,
  resetForm: resetSignupForm,
} = useForm({
  validationSchema: signupSchema,
});

const [signupEmail] = defineSignupField("email");
const [signupPassword] = defineSignupField("password");
const [signupConfirmPassword] = defineSignupField("confirmPassword");

// Switch mode and reset forms
const switchMode = (newMode: "login" | "signup") => {
  mode.value = newMode;
  authError.value = null;
  resetLoginForm();
  resetSignupForm();
};

// Login handler
const onLogin = handleLoginSubmit(async (values) => {
  isLoading.value = true;
  authError.value = null;
  try {
    await authStore.signIn(values.email, values.password);
    router.push("/");
  } catch (error: any) {
    authError.value = error.message || "Login failed. Please try again.";
  } finally {
    isLoading.value = false;
  }
});

// Signup handler
const onSignup = handleSignupSubmit(async (values) => {
  isLoading.value = true;
  authError.value = null;
  try {
    await authStore.signUp(values.email, values.password);
    router.push("/");
  } catch (error: any) {
    authError.value = error.message || "Sign up failed. Please try again.";
  } finally {
    isLoading.value = false;
  }
});

// Google OAuth handler
const handleGoogleSignIn = async () => {
  isLoading.value = true;
  authError.value = null;
  try {
    await authStore.signInWithGoogle();
    // OAuth redirects, so we don't need to handle navigation here
  } catch (error: any) {
    authError.value =
      error.message || "Google sign-in failed. Please try again.";
    isLoading.value = false;
  }
};
</script>

<template>
  <div
    class="min-h-screen flex items-center justify-center bg-surface-ground p-4"
  >
    <Card class="w-full max-w-md">
      <template #title>
        <div class="text-center">
          <h1 class="text-2xl font-bold">Meal Planner</h1>
          <p class="text-surface-500 mt-1">
            {{
              mode === "login"
                ? "Sign in to your account"
                : "Create a new account"
            }}
          </p>
        </div>
      </template>

      <template #content>
        <!-- Mode toggle -->
        <SelectButton
          :modelValue="mode"
          @update:modelValue="switchMode"
          :options="[
            { label: 'Login', value: 'login' },
            { label: 'Sign Up', value: 'signup' },
          ]"
          optionLabel="label"
          optionValue="value"
          :allowEmpty="false"
          class="w-full mb-6 flex justify-center"
        />

        <!-- Error message -->
        <Message
          v-if="authError"
          severity="error"
          class="mb-4"
          :closable="false"
        >
          {{ authError }}
        </Message>

        <!-- Login form -->
        <form
          v-if="mode === 'login'"
          @submit.prevent="onLogin"
          class="flex flex-col gap-4"
        >
          <div class="flex flex-col gap-1">
            <label for="login-email">Email</label>
            <InputText
              id="login-email"
              v-model="loginEmail"
              type="email"
              placeholder="you@example.com"
              :invalid="!!loginErrors.email"
              :disabled="isLoading"
            />
            <small v-if="loginErrors.email" class="text-red-500">
              {{ loginErrors.email }}
            </small>
          </div>

          <div class="flex flex-col gap-1">
            <label for="login-password">Password</label>
            <Password
              id="login-password"
              v-model="loginPassword"
              :feedback="false"
              toggleMask
              :invalid="!!loginErrors.password"
              :disabled="isLoading"
              inputClass="w-full"
              class="w-full"
            />
            <small v-if="loginErrors.password" class="text-red-500">
              {{ loginErrors.password }}
            </small>
          </div>

          <Button
            type="submit"
            label="Sign In"
            :loading="isLoading"
            class="w-full mt-2"
          />
        </form>

        <!-- Signup form -->
        <form
          v-else
          id="signup-form"
          @submit.prevent="onSignup"
          class="flex flex-col gap-4"
        >
          <div class="flex flex-col gap-1">
            <label for="signup-email">Email</label>
            <InputText
              id="signup-email"
              v-model="signupEmail"
              type="email"
              placeholder="you@example.com"
              :invalid="!!signupErrors.email"
              :disabled="isLoading"
            />
            <small v-if="signupErrors.email" class="text-red-500">
              {{ signupErrors.email }}
            </small>
          </div>

          <div class="flex flex-col gap-1">
            <label for="signup-password">Password</label>
            <Password
              id="signup-password"
              v-model="signupPassword"
              toggleMask
              :invalid="!!signupErrors.password"
              :disabled="isLoading"
              inputClass="w-full"
              class="w-full"
            />
            <small v-if="signupErrors.password" class="text-red-500">
              {{ signupErrors.password }}
            </small>
          </div>

          <div class="flex flex-col gap-1">
            <label for="signup-confirm-password">Confirm Password</label>
            <Password
              id="signup-confirm-password"
              v-model="signupConfirmPassword"
              :feedback="false"
              toggleMask
              :invalid="!!signupErrors.confirmPassword"
              :disabled="isLoading"
              inputClass="w-full"
              class="w-full"
            />
            <small v-if="signupErrors.confirmPassword" class="text-red-500">
              {{ signupErrors.confirmPassword }}
            </small>
          </div>

          <Button
            type="submit"
            form="signup-form"
            label="Create Account"
            :loading="isLoading"
            class="w-full mt-2"
          />
        </form>

        <!-- Divider -->
        <Divider align="center" class="my-6">
          <span class="text-surface-500 text-sm">or</span>
        </Divider>

        <!-- Google OAuth -->
        <Button
          @click="handleGoogleSignIn"
          :loading="isLoading"
          label="Sign in with Google"
          outlined
          icon="pi pi-google"
          fluid
        />
      </template>
    </Card>
  </div>
</template>
