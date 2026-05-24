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
    const data: unknown = await response.json();
    const segments = Array.isArray(data) && Array.isArray(data[0]) ? data[0] : [];
    const translated =
      segments
        .map((item: unknown) =>
          Array.isArray(item) && typeof item[0] === 'string' ? item[0] : ''
        )
        .join('') || text;

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

// Synchronous cache peek for code that needs to render a placeholder
// while the async translation is in flight.
export function getCachedTranslation(text: string, targetLang: Language): string | null {
  if (targetLang === 'de') {
    return text;
  }
  return translationCache.get(`${text}_${targetLang}`) ?? null;
}

// Export function to manually save cache (can be called on page unload)
export function flushTranslationCache() {
  saveCacheToStorage();
}

// ----- Full-recipe cache (localStorage, persistent across sessions) -----

const RECIPE_CACHE_PREFIX = "tr-recipe:v1:";

/**
 * Compact FNV-1a 32-bit hash of an arbitrary string. Used as a content stamp
 * so a cached translation invalidates automatically when the source recipe is
 * edited.
 */
export function contentHash(input: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(36);
}

function recipeCacheKey(id: string, hash: string, lang: Language): string {
  return `${RECIPE_CACHE_PREFIX}${id}:${hash}:${lang}`;
}

export function getCachedRecipe<T>(id: string, hash: string, lang: Language): T | null {
  try {
    const raw = localStorage.getItem(recipeCacheKey(id, hash, lang));
    if (!raw) {
      return null;
    }
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function setCachedRecipe<T>(id: string, hash: string, lang: Language, value: T): void {
  try {
    localStorage.setItem(recipeCacheKey(id, hash, lang), JSON.stringify(value));
  } catch {
    /* localStorage full / unavailable; non-fatal */
  }
}

export function getSavedLanguage(): Language {
  const saved = localStorage.getItem('recipe-app-language');
  return (saved as Language) || 'de';
}

export function saveLanguage(lang: Language): void {
  localStorage.setItem('recipe-app-language', lang);
}
