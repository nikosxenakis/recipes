import { useEffect, useReducer } from "react";
import type { Recipe } from "recipes-shared";
import type { Language } from "@/shared/utils/translator";
import {
  getCachedTranslatedRecipe,
  translateRecipe,
  type TranslatedRecipe as Translated,
} from "@/features/recipes/utils/translateRecipe";

interface UseTranslatedRecipeResult extends Recipe {
  isTranslating: boolean;
}

const noopReducer = (x: number): number => x + 1;

export function useTranslatedRecipe(recipe: Recipe, language: Language, isExpanded: boolean): UseTranslatedRecipeResult {
  const [, rerender] = useReducer(noopReducer, 0);

  const shouldTranslate = isExpanded && language !== "de";
  const cached: Translated | null = shouldTranslate ? getCachedTranslatedRecipe(recipe, language) : null;

  useEffect(() => {
    if (!shouldTranslate || cached) {
      return;
    }
    let cancelled = false;
    translateRecipe(recipe, language)
      .then(() => {
        if (!cancelled) {
          rerender();
        }
      })
      .catch((err) => {
        console.error(`Translation failed for recipe ${recipe.id}:`, err);
      });
    return () => {
      cancelled = true;
    };
  }, [recipe, language, shouldTranslate, cached]);

  const base = cached ?? recipe;
  const isTranslating = shouldTranslate && !cached;
  return { ...base, isTranslating };
}
