import type { Language } from "@/shared/utils/translator";
import de from "@/shared/locales/de.json";
import en from "@/shared/locales/en.json";
import el from "@/shared/locales/el.json";

const translations: Record<Language, Record<string, string>> = { de, en, el };

export function getLabel(key: string, language: Language): string {
  return translations[language][key] || key;
}

export function getCategoryLabel(key: string, language: Language): string {
  return translations[language][`cat_${key}`] || key;
}
