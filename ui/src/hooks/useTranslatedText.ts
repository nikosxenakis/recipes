import { useState, useEffect } from 'react';
import type { Language } from '../utils/translator';
import { translateText } from '../utils/translator';

export function useTranslatedText(text: string, language: Language): string {
  const [translated, setTranslated] = useState<string | null>(null);

  useEffect(() => {
    if (language === 'de') {
      return;
    }

    let cancelled = false;
    translateText(text, language)
      .then((result) => {
        if (!cancelled) {
          setTranslated(result);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setTranslated(text);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [text, language]);

  if (language === 'de') {
    return text;
  }
  return translated ?? text;
}
