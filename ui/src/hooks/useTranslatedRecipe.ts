import { useState, useEffect } from 'react';
import type { Recipe } from '../types/recipe';
import type { Language } from '../utils/translator';
import { translateText } from '../utils/translator';

interface TranslatedRecipe extends Recipe {
  isTranslating?: boolean;
}

export function useTranslatedRecipe(recipe: Recipe, language: Language, isExpanded: boolean): TranslatedRecipe {
  const [translatedRecipe, setTranslatedRecipe] = useState<TranslatedRecipe>(recipe);
  const [isTranslating, setIsTranslating] = useState(false);

  useEffect(() => {
    // Only translate when recipe is expanded and language is not German
    if (!isExpanded || language === 'de') {
      setTranslatedRecipe(recipe);
      return;
    }

    // Check if already translated to this language
    const cacheKey = `recipe_${recipe.title}_${language}`;
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) {
      try {
        setTranslatedRecipe(JSON.parse(cached));
        return;
      } catch (e) {
        // Invalid cache, proceed to translate
      }
    }

    const translateRecipe = async () => {
      setIsTranslating(true);

      try {
        const translated: TranslatedRecipe = {
          ...recipe,
          title: await translateText(recipe.title, language),
          category: await translateText(recipe.category, language),
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

        // Cache in sessionStorage
        sessionStorage.setItem(cacheKey, JSON.stringify(translated));
        setTranslatedRecipe(translated);
      } catch (error) {
        console.error(`Error translating recipe ${recipe.title}:`, error);
        setTranslatedRecipe(recipe);
      } finally {
        setIsTranslating(false);
      }
    };

    translateRecipe();
  }, [recipe, language, isExpanded]);

  return { ...translatedRecipe, isTranslating };
}
