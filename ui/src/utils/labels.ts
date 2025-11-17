import type { Language } from './translator';
import de from '../locales/de.json';
import en from '../locales/en.json';
import el from '../locales/el.json';

const translations: Record<Language, Record<string, string>> = {
  de,
  en,
  el
};

export function getLabel(key: string, language: Language): string {
  return translations[language][key] || key;
}
