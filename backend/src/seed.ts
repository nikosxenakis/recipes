import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { z } from 'zod';
import { getRecipesCollection, closeDb } from './db.ts';
import { recipeSchema, slugify, type Recipe } from 'recipes-shared';

const looseRecipeSchema = recipeSchema.extend({
  id: z.string().optional()
});

const collectionSchema = z.object({
  recipes: z.array(looseRecipeSchema)
});

async function loadRecipesFromBuild(): Promise<Recipe[]> {
  const path = resolve(process.cwd(), '..', 'ui', 'public', 'recipes.json');
  const raw = readFileSync(path, 'utf8');
  const parsed = collectionSchema.parse(JSON.parse(raw));

  const assigned = new Set<string>();
  return parsed.recipes.map((recipe, index) => {
    if (recipe.id && recipe.id.length > 0 && !assigned.has(recipe.id)) {
      assigned.add(recipe.id);
      return { ...recipe, id: recipe.id };
    }
    const slug = slugify(recipe.title);
    const base = slug.length > 0 ? slug : `untitled-${index}`;
    let id = base;
    let n = 2;
    while (assigned.has(id)) {
      id = `${base}-${n}`;
      n += 1;
    }
    assigned.add(id);
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
