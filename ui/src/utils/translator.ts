export type Language = 'de' | 'en' | 'el';

export interface LanguageInfo {
  code: Language;
  name: string;
  flag: string;
}

export const LANGUAGES: LanguageInfo[] = [
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'el', name: 'Ελληνικά', flag: '🇬🇷' },
];

const translationCache = new Map<string, string>();

// Load translations from localStorage on startup
function loadCacheFromStorage() {
  try {
    const stored = localStorage.getItem('translation-cache');
    if (stored) {
      const parsed = JSON.parse(stored);
      Object.entries(parsed).forEach(([key, value]) => {
        translationCache.set(key, value as string);
      });
    }
  } catch (error) {
    console.error('Failed to load translation cache:', error);
  }
}

// Save translations to localStorage
function saveCacheToStorage() {
  try {
    const cacheObj: Record<string, string> = {};
    translationCache.forEach((value, key) => {
      cacheObj[key] = value;
    });
    localStorage.setItem('translation-cache', JSON.stringify(cacheObj));
  } catch (error) {
    console.error('Failed to save translation cache:', error);
  }
}

// Load cache on module initialization
loadCacheFromStorage();

export async function translateText(text: string, targetLang: Language): Promise<string> {
  if (targetLang === 'de') {
    return text; // Original language, no translation needed
  }

  const cacheKey = `${text}_${targetLang}`;
  if (translationCache.has(cacheKey)) {
    return translationCache.get(cacheKey)!;
  }

  try {
    // Using Google Translate free API
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=de&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;
    const response = await fetch(url);
    const data = await response.json();
    const translated = data[0]?.map((item: any[]) => item[0]).join('') || text;

    translationCache.set(cacheKey, translated);

    // Save to localStorage every 10 new translations to avoid too many writes
    if (translationCache.size % 10 === 0) {
      saveCacheToStorage();
    }

    return translated;
  } catch (error) {
    console.error('Translation error:', error);
    return text; // Return original text on error
  }
}

// Export function to manually save cache (can be called on page unload)
export function flushTranslationCache() {
  saveCacheToStorage();
}

export function getSavedLanguage(): Language {
  const saved = localStorage.getItem('recipe-app-language');
  return (saved as Language) || 'de';
}

export function saveLanguage(lang: Language): void {
  localStorage.setItem('recipe-app-language', lang);
}
