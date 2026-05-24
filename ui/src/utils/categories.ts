// Mirrors backend/src/categories.ts and recipe-builder/src/categories.ts.
// Pure UI-side type for the small set of canonical category keys.
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
