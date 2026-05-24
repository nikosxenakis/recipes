import type { Recipe } from "recipes-shared";
import {
  contentHash,
  getCachedRecipe,
  setCachedRecipe,
  translateText,
  type Language,
} from "@/shared/utils/translator";

export type TranslatedRecipe = Recipe;

const inFlight = new Map<string, Promise<TranslatedRecipe>>();

function sourceHash(recipe: Recipe): string {
  // Hash only the fields we actually translate so that cosmetic edits to id /
  // category / photo / createdAt don't bust the cache.
  return contentHash(
    JSON.stringify({
      title: recipe.title,
      duration: recipe.duration,
      servings: recipe.servings,
      ingredients: recipe.ingredients,
      instructions: recipe.instructions,
      tips: recipe.tips,
      info: recipe.info,
      comments: recipe.comments?.map((c) => c.text),
    })
  );
}

/**
 * Translate a full recipe to `language`. Returns the source unchanged when
 * `language === "de"`. Reads/writes a per-recipe localStorage cache keyed by
 * id + content hash, and de-duplicates concurrent calls so that calling this
 * for the same recipe from multiple components only fires one network burst.
 */
export async function translateRecipe(recipe: Recipe, language: Language): Promise<TranslatedRecipe> {
  if (language === "de") {
    return recipe;
  }
  const hash = sourceHash(recipe);
  const cached = getCachedRecipe<TranslatedRecipe>(recipe.id, hash, language);
  if (cached) {
    return cached;
  }

  const dedupeKey = `${recipe.id}:${hash}:${language}`;
  const existing = inFlight.get(dedupeKey);
  if (existing) {
    return existing;
  }

  const job = (async () => {
    const [title, duration, servings] = await Promise.all([
      translateText(recipe.title, language),
      recipe.duration ? translateText(recipe.duration, language) : Promise.resolve(recipe.duration),
      recipe.servings ? translateText(recipe.servings, language) : Promise.resolve(recipe.servings),
    ]);

    const [ingredients, instructions, tips, info, comments] = await Promise.all([
      Promise.all(
        recipe.ingredients.map(async (section) => ({
          title: section.title ? await translateText(section.title, language) : undefined,
          items: await Promise.all(section.items.map((item) => translateText(item, language))),
        }))
      ),
      Promise.all(recipe.instructions.map((step) => translateText(step, language))),
      recipe.tips ? Promise.all(recipe.tips.map((tip) => translateText(tip, language))) : Promise.resolve(recipe.tips),
      recipe.info ? Promise.all(recipe.info.map((entry) => translateText(entry, language))) : Promise.resolve(recipe.info),
      recipe.comments
        ? Promise.all(
            recipe.comments.map(async (comment) => ({
              ...comment,
              text: await translateText(comment.text, language),
            }))
          )
        : Promise.resolve(recipe.comments),
    ]);

    const result: TranslatedRecipe = {
      ...recipe,
      title,
      duration,
      servings,
      ingredients,
      instructions,
      tips,
      info,
      comments,
    };
    setCachedRecipe(recipe.id, hash, language, result);
    return result;
  })();

  inFlight.set(dedupeKey, job);
  try {
    return await job;
  } finally {
    inFlight.delete(dedupeKey);
  }
}

/** Synchronous cache peek; returns null on miss. */
export function getCachedTranslatedRecipe(recipe: Recipe, language: Language): TranslatedRecipe | null {
  if (language === "de") {
    return recipe;
  }
  return getCachedRecipe<TranslatedRecipe>(recipe.id, sourceHash(recipe), language);
}
