import { toTypedSchema } from "@vee-validate/yup";
import type { Meal, Unit } from "@/types";

export type AddMealForm = {
  mealName: string;
  defaultServings: number;
  originalServings: number | null;
  ingredients?: Array<{ name: string; quantity: number; unit: Unit }>;
  recipeSteps: string[];
  prepTime?: number;
  cookTime?: number;
  tags: string[];
  imageUrl?: string;
};

export const useAddMealForm = () => {
  const schema = computed(() =>
    toTypedSchema(
      yup.object({
        mealName: yup.string().trim().required("Meal name required"),
        defaultServings: yup
          .number()
          .min(1, "Must be at least 1")
          .max(20, "Maximum 20 servings")
          .required("Required"),
        originalServings: yup.number().nullable(),
        ingredients: yup
          .array()
          .of(
            yup.object().shape({
              name: yup.string().trim(),
              quantity: yup
                .number()
                .min(0, "Must be positive")
                .required("Quantity required"),
              unit: yup
                .string()
                .oneOf(["g", "kg", "ml", "l", "pcs", "cup"], "Invalid unit")
                .required("Unit required"),
            }),
          )
          .transform((value) =>
            // Filter out empty/incomplete ingredients before validation
            value?.filter(
              (ing: { name?: string; quantity?: number }) =>
                ing.name?.trim() || (ing.quantity && ing.quantity > 0),
            ),
          )
          .optional(),
        recipeSteps: yup.array().of(yup.string()),
        prepTime: yup.number().min(0, "Must be positive").optional(),
        cookTime: yup.number().min(0, "Must be positive").optional(),
        tags: yup.array().of(yup.string()),
        imageUrl: yup.string().url("Must be a valid URL").optional(),
      }),
    ),
  );

  const {
    handleSubmit,
    errors,
    resetForm,
    setValues,
    values,
    defineField,
    setFieldValue,
  } = useForm<AddMealForm>({
    validationSchema: schema,
    validateOnMount: false,
    initialValues: {
      mealName: "",
      defaultServings: 4,
      originalServings: null,
      ingredients: [{ name: "", quantity: 1, unit: "pcs" as Unit }],
      recipeSteps: [""],
      prepTime: undefined,
      cookTime: undefined,
      tags: [],
      imageUrl: "",
    },
  });

  // Create field bindings for simple fields
  const [mealName] = defineField("mealName");
  const [defaultServings] = defineField("defaultServings");
  const [originalServings] = defineField("originalServings");
  const [prepTime] = defineField("prepTime");
  const [cookTime] = defineField("cookTime");
  const [imageUrl] = defineField("imageUrl");

  // Helper to update ingredient field
  const updateIngredientField = (
    index: number,
    field: keyof NonNullable<AddMealForm["ingredients"]>[0],
    value: string | number | undefined | null,
  ) => {
    const newIngredients: AddMealForm["ingredients"] = (
      values.ingredients ?? []
    ).map((ing) => ({
      name: ing.name ?? "",
      quantity: ing.quantity ?? 1,
      unit: ing.unit ?? "pcs",
    }));
    // Apply update with proper defaults
    const current = newIngredients?.[index];
    if (field === "name" && current) {
      newIngredients[index] = {
        name: (value as string) ?? "",
        quantity: current.quantity,
        unit: current.unit,
      };
    } else if (field === "quantity" && current) {
      newIngredients[index] = {
        name: current.name,
        quantity: (value as number) ?? 1,
        unit: current.unit,
      };
    } else if (field === "unit" && current) {
      newIngredients[index] = {
        name: current.name,
        quantity: current.quantity,
        unit: (value as Unit) ?? "pcs",
      };
    }
    setFieldValue("ingredients", newIngredients);
  };

  // Helper to update recipe step
  const updateRecipeStep = (index: number, value: string) => {
    const newSteps = [...values.recipeSteps];
    newSteps[index] = value;
    setFieldValue("recipeSteps", newSteps);
  };

  // Helper methods for dynamic arrays
  const addIngredient = () => {
    const currentIngredients: AddMealForm["ingredients"] = (
      values.ingredients ?? []
    ).map((ing) => ({
      name: ing.name ?? "",
      quantity: ing.quantity ?? 1,
      unit: ing.unit ?? "pcs",
    }));
    setFieldValue("ingredients", [
      ...currentIngredients,
      { name: "", quantity: 1, unit: "pcs" as Unit },
    ]);
  };

  const removeIngredient = (index: number) => {
    const ingredients = values.ingredients ?? [];
    if (ingredients.length > 0) {
      const newIngredients = ingredients.filter((_, i) => i !== index);
      setFieldValue("ingredients", newIngredients);
    }
  };

  const addRecipeStep = () => {
    const newSteps = [...values.recipeSteps, ""];
    setFieldValue("recipeSteps", newSteps);
  };

  const removeRecipeStep = (index: number) => {
    if (values.recipeSteps.length > 1) {
      const newSteps = values.recipeSteps.filter((_, i) => i !== index);
      setFieldValue("recipeSteps", newSteps);
    }
  };

  const addTag = (tag: string) => {
    setFieldValue("tags", [...values.tags, tag]);
  };

  const removeTag = (tag: string) => {
    setFieldValue(
      "tags",
      values.tags.filter((t) => t !== tag),
    );
  };

  // Populate form for editing
  const populateForm = (meal: Meal) => {
    setValues({
      mealName: meal.name,
      defaultServings: meal.defaultServings,
      originalServings: meal.defaultServings,
      ingredients: meal.ingredients?.map((ing) => ({
        name: ing.name,
        quantity: ing.quantity,
        unit: ing.unit,
      })),
      recipeSteps: meal.recipe?.steps.length ? meal.recipe.steps : [""],
      prepTime: meal.recipe?.prepTime,
      cookTime: meal.recipe?.cookTime,
      tags: meal.tags || [],
      imageUrl: meal.imageUrl || "",
    });
  };

  return {
    handleSubmit,
    errors,
    resetForm,
    values,
    setValues,
    setFieldValue,
    // Field bindings
    mealName,
    defaultServings,
    originalServings,
    prepTime,
    cookTime,
    imageUrl,
    // Array helpers
    addIngredient,
    removeIngredient,
    addRecipeStep,
    removeRecipeStep,
    addTag,
    removeTag,
    updateIngredientField,
    updateRecipeStep,
    populateForm,
  };
};
