import { useState, useEffect, useMemo } from 'react';
import type { Recipe } from '../types/recipe';
import type { Language } from '../utils/translator';
import { translateText } from '../utils/translator';

interface TranslatedRecipe extends Recipe {
  isTranslating?: boolean;
}

function readCachedTranslation(
  recipe: Recipe,
  language: Language,
  shouldTranslate: boolean,
): TranslatedRecipe | null {
  if (!shouldTranslate) {
    return null;
  }
  const cached = sessionStorage.getItem(`recipe_${recipe.title}_${language}`);
  if (!cached) {
    return null;
  }
  try {
    return JSON.parse(cached);
  } catch {
    return null;
  }
}

export function useTranslatedRecipe(recipe: Recipe, language: Language, isExpanded: boolean): TranslatedRecipe {
  const [translated, setTranslated] = useState<TranslatedRecipe | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);

  const shouldTranslate = isExpanded && language !== 'de';
  const cached = useMemo(
    () => readCachedTranslation(recipe, language, shouldTranslate),
    [recipe, language, shouldTranslate],
  );

  useEffect(() => {
    if (!shouldTranslate || cached) {
      return;
    }

    let cancelled = false;

    const translateRecipe = async () => {
      setIsTranslating(true);

      try {
        const result: TranslatedRecipe = {
          ...recipe,
          title: await translateText(recipe.title, language),
          duration: recipe.duration ? await translateText(recipe.duration, language) : recipe.duration,
          servings: recipe.servings ? await translateText(recipe.servings, language) : recipe.servings,
          ingredients: await Promise.all(recipe.ingredients.map(async (section) => ({
            title: section.title ? await translateText(section.title, language) : undefined,
            items: await Promise.all(section.items.map(item => translateText(item, language)))
          }))),
          instructions: await Promise.all(recipe.instructions.map(inst => translateText(inst, language))),
          tips: recipe.tips ? await Promise.all(recipe.tips.map(tip => translateText(tip, language))) : recipe.tips,
          info: recipe.info ? await Promise.all(recipe.info.map(info => translateText(info, language))) : recipe.info,
          comments: recipe.comments ? await Promise.all(recipe.comments.map(async (comment) => ({
            user: comment.user,
            text: await translateText(comment.text, language)
          }))) : recipe.comments,
          isTranslating: false
        };

        sessionStorage.setItem(`recipe_${recipe.title}_${language}`, JSON.stringify(result));
        if (!cancelled) {
          setTranslated(result);
        }
      } catch (error) {
        console.error(`Error translating recipe ${recipe.title}:`, error);
        if (!cancelled) {
          setTranslated(null);
        }
      } finally {
        if (!cancelled) {
          setIsTranslating(false);
        }
      }
    };

    translateRecipe();

    return () => {
      cancelled = true;
    };
  }, [recipe, language, shouldTranslate, cached]);

  const base = shouldTranslate ? (translated ?? cached ?? recipe) : recipe;
  return { ...base, isTranslating: isTranslating && shouldTranslate };
}
