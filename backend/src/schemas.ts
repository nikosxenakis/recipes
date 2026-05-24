import { z } from 'zod';

export const userSchema = z.union([
  z.string(),
  z.object({
    name: z.string().min(1),
    photo: z.string().optional()
  })
]);

export const commentSchema = z.object({
  user: userSchema.optional(),
  text: z.string().min(1)
});

export const ingredientSectionSchema = z.object({
  title: z.string().optional(),
  items: z.array(z.string())
});

export const recipeSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  category: z.string().min(1),
  duration: z.string().optional(),
  servings: z.string().optional(),
  difficulty: z.enum(['einfach', 'mittel', 'schwer']).optional(),
  tags: z.array(z.string()).optional(),
  creator: userSchema.optional(),
  createdAt: z.string().optional(),
  photo: z.string().optional(),
  ingredients: z.array(ingredientSectionSchema),
  instructions: z.array(z.string()),
  tips: z.array(z.string()).optional(),
  info: z.array(z.string()).optional(),
  comments: z.array(commentSchema).optional()
});

export const recipeInputSchema = recipeSchema.omit({ id: true }).extend({
  id: z.string().min(1).optional()
});

export type Recipe = z.infer<typeof recipeSchema>;
export type RecipeInput = z.infer<typeof recipeInputSchema>;
