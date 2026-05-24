import { z } from 'zod';

export const CATEGORY_KEYS = [
  'breakfast',
  'dinner',
  'starters',
  'soups',
  'salads',
  'main',
  'meat',
  'fish',
  'vegetables',
  'starches',
  'sides',
  'sauces',
  'snacks',
  'spreads',
  'bread',
  'pizza',
  'cakes',
  'desserts',
  'drinks',
  'other'
] as const;

export type CategoryKey = (typeof CATEGORY_KEYS)[number];

export const categorySchema = z.enum(CATEGORY_KEYS);

// Known source-language headings and their canonical keys. Anything not
// listed (or already a key) falls through to "other".
const ALIASES: Record<string, CategoryKey> = {
  abendbrot: 'dinner',
  'aufstriche und marmeladen': 'spreads',
  beilagen: 'sides',
  'brot, brötchen und fladen, auch mit belag': 'bread',
  'desserts und süßspeisen': 'desserts',
  nachtisch: 'desserts',
  fisch: 'fish',
  'fleisch, geflügel und wild': 'meat',
  frühstück: 'breakfast',
  'gemüse, hülsenfrüchte und getreide': 'vegetables',
  getränke: 'drinks',
  hauptgerichte: 'main',
  'kuchen, torten, muffins und gebäck': 'cakes',
  'nudeln, kartoffeln und reis': 'starches',
  'pizza, flammkuchen, foccacia, quiche, pasteten und samosas': 'pizza',
  salate: 'salads',
  'saucen, dips und snack': 'sauces',
  snacks: 'snacks',
  sonstiges: 'other',
  'suppen und eintöpfe': 'soups',
  vorspeisen: 'starters'
};

export function mapToCategoryKey(input: string | undefined | null): CategoryKey {
  if (!input) {
    return 'other';
  }
  const trimmed = input.trim();
  if ((CATEGORY_KEYS as readonly string[]).includes(trimmed)) {
    return trimmed as CategoryKey;
  }
  return ALIASES[trimmed.toLowerCase()] ?? 'other';
}
