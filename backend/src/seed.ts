import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { z } from 'zod';
import { getRecipesCollection, closeDb } from './db.ts';
import { recipeSchema, type Recipe } from './schemas.ts';

const looseRecipeSchema = recipeSchema.extend({
  id: z.string().optional()
});

const collectionSchema = z.object({
  recipes: z.array(looseRecipeSchema)
});

const COMBINING_MARKS = /\p{M}/gu;

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(COMBINING_MARKS, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function loadRecipesFromBuild(): Promise<Recipe[]> {
  const path = resolve(process.cwd(), '..', 'ui', 'public', 'recipes.json');
  const raw = readFileSync(path, 'utf8');
  const parsed = collectionSchema.parse(JSON.parse(raw));

  const seen = new Map<string, number>();
  return parsed.recipes.map((recipe) => {
    const baseId = recipe.id && recipe.id.length > 0 ? recipe.id : slugify(recipe.title);
    const safeBase = baseId.length > 0 ? baseId : 'recipe';
    const count = seen.get(safeBase) ?? 0;
    seen.set(safeBase, count + 1);
    const id = count === 0 ? safeBase : `${safeBase}-${count + 1}`;
    return { ...recipe, id };
  });
}

async function main(): Promise<void> {
  const recipes = await loadRecipesFromBuild();
  console.log(`Loaded ${recipes.length} recipes from ui/public/recipes.json`);

  const collection = await getRecipesCollection();
  await collection.createIndex({ id: 1 }, { unique: true });

  const ops = recipes.map((recipe) => ({
    replaceOne: {
      filter: { id: recipe.id },
      replacement: recipe,
      upsert: true
    }
  }));

  if (ops.length === 0) {
    console.log('Nothing to seed.');
    return;
  }

  const result = await collection.bulkWrite(ops, { ordered: false });
  console.log(`Upserted ${result.upsertedCount}, modified ${result.modifiedCount}`);
}

main()
  .catch((err) => {
    console.error('Seed failed:', err);
    process.exitCode = 1;
  })
  .finally(() => {
    void closeDb();
  });
