import { z } from "zod";
import { CATEGORY_KEYS, mapToCategoryKey } from "./categories.ts";

export const categorySchema = z.enum(CATEGORY_KEYS);

const categoryField = z.preprocess((value) => {
  if (typeof value !== "string") {
    return value;
  }
  return mapToCategoryKey(value);
}, categorySchema);

// A user is just a name string. Accept the legacy object form `{name}` and
// flatten it so older payloads / older Atlas docs validate cleanly.
export const userSchema = z.preprocess((value) => {
  if (value && typeof value === "object" && "name" in value && typeof (value as { name: unknown }).name === "string") {
    return (value as { name: string }).name;
  }
  return value;
}, z.string().min(1));

export const commentSchema = z.object({
  user: userSchema.optional(),
  text: z.string().min(1),
});

export const ingredientSectionSchema = z.object({
  title: z.string().optional(),
  items: z.array(z.string()),
});

export const difficultySchema = z.enum(["einfach", "mittel", "schwer"]);

export const recipeSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  category: categoryField,
  duration: z.string().optional(),
  servings: z.string().optional(),
  difficulty: difficultySchema.optional(),
  tags: z.array(z.string()).optional(),
  creator: userSchema.optional(),
  createdAt: z.string().optional(),
  photo: z.string().optional(),
  ingredients: z.array(ingredientSectionSchema),
  instructions: z.array(z.string()),
  tips: z.array(z.string()).optional(),
  info: z.array(z.string()).optional(),
  comments: z.array(commentSchema).optional(),
});

export const recipeInputSchema = recipeSchema.omit({ id: true }).extend({
  id: z.string().min(1).optional(),
});

export const recipeCollectionSchema = z.object({
  version: z.string(),
  totalRecipes: z.number(),
  categories: z.array(z.string()),
  recipes: z.array(recipeSchema),
  generatedAt: z.string(),
});

export type Recipe = z.infer<typeof recipeSchema>;
export type RecipeInput = z.infer<typeof recipeInputSchema>;
export type User = z.infer<typeof userSchema>;
export type Comment = z.infer<typeof commentSchema>;
export type IngredientSection = z.infer<typeof ingredientSectionSchema>;
export type Difficulty = z.infer<typeof difficultySchema>;
export type RecipeCollection = z.infer<typeof recipeCollectionSchema>;
