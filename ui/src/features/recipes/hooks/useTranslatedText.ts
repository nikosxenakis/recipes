import { useEffect, useReducer } from 'react';
import type { Language } from '@/shared/utils/translator';
import { getCachedTranslation, translateText } from '@/shared/utils/translator';

export interface TranslatedText {
  text: string;
  isTranslating: boolean;
}

const noopReducer = (x: number): number => x + 1;

export function useTranslatedText(text: string, language: Language): TranslatedText {
  const [, rerender] = useReducer(noopReducer, 0);

  useEffect(() => {
    if (language === 'de' || getCachedTranslation(text, language) !== null) {
      return;
    }
    let cancelled = false;
    translateText(text, language)
      .then(() => {
        if (!cancelled) {
          rerender();
        }
      })
      .catch(() => {
        if (!cancelled) {
          rerender();
        }
      });
    return () => {
      cancelled = true;
    };
  }, [text, language]);

  if (language === 'de') {
    return { text, isTranslating: false };
  }
  const cached = getCachedTranslation(text, language);
  if (cached !== null) {
    return { text: cached, isTranslating: false };
  }
  return { text, isTranslating: true };
}
