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
    })
  )
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
    })
  )
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
    authError.value = error.message || "Google sign-in failed. Please try again.";
    isLoading.value = false;
  }
};
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-surface-ground p-4">
    <Card class="w-full max-w-md">
      <template #title>
        <div class="text-center">
          <h1 class="text-2xl font-bold">Meal Planner</h1>
          <p class="text-surface-500 mt-1">
            {{ mode === "login" ? "Sign in to your account" : "Create a new account" }}
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
          class="w-full mb-6"
        />

        <!-- Error message -->
        <Message v-if="authError" severity="error" class="mb-4" :closable="false">
          {{ authError }}
        </Message>

        <!-- Login form -->
        <form v-if="mode === 'login'" @submit.prevent="onLogin" class="flex flex-col gap-4">
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
        <form v-else @submit.prevent="onSignup" class="flex flex-col gap-4">
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
            label="Create Account"
            :loading="isLoading"
            class="w-full mt-2"
          />
        </form>

        <!-- Divider -->
        <Divider align="center" class="my-6">
          <span class="text-surface-500 text-sm">or continue with</span>
        </Divider>

        <!-- Google OAuth -->
        <Button
          @click="handleGoogleSignIn"
          :loading="isLoading"
          outlined
          class="w-full"
        >
          <template #icon>
            <svg class="w-5 h-5 mr-2" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
          </template>
          Sign in with Google
        </Button>
      </template>
    </Card>
  </div>
</template>
