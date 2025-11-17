import { useState, useEffect } from 'react';
import type { Language } from '../utils/translator';
import { translateText } from '../utils/translator';

export function useTranslatedText(text: string, language: Language): string {
  const [translatedText, setTranslatedText] = useState(text);

  useEffect(() => {
    if (language === 'de') {
      setTranslatedText(text);
      return;
    }

    translateText(text, language)
      .then(setTranslatedText)
      .catch(() => setTranslatedText(text));
  }, [text, language]);

  return translatedText;
}
