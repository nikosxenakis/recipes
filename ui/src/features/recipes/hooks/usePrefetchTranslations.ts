import { useEffect } from "react";
import type { Recipe } from "recipes-shared";
import type { Language } from "@/shared/utils/translator";
import {
  getCachedTranslatedRecipe,
  translateRecipe,
} from "@/features/recipes/utils/translateRecipe";

const MAX_CONCURRENT = 2;

/**
 * Warm the per-recipe translation cache for every recipe in `items` so that
 * expanding any of them is instant. Skips recipes that are already cached.
 * Capped to MAX_CONCURRENT in-flight translations so we don't hammer Google
 * Translate when a page first lands in a non-DE language.
 */
export function usePrefetchTranslations(items: Recipe[], language: Language): void {
  useEffect(() => {
    if (language === "de" || items.length === 0) {
      return;
    }
    let cancelled = false;
    const queue = items.filter((r) => !getCachedTranslatedRecipe(r, language));
    if (queue.length === 0) {
      return;
    }

    const worker = async () => {
      while (!cancelled && queue.length > 0) {
        const next = queue.shift();
        if (!next) {
          return;
        }
        try {
          await translateRecipe(next, language);
        } catch {
          /* per-recipe failure is logged inside translateRecipe; keep draining */
        }
      }
    };

    const workers = Array.from({ length: Math.min(MAX_CONCURRENT, queue.length) }, () => worker());
    void Promise.all(workers);

    return () => {
      cancelled = true;
    };
  }, [items, language]);
}
