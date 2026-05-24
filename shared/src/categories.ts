/**
 * Canonical recipe category keys, shared across backend, recipe-builder and UI.
 * Pure constants + a mapper from legacy German labels — no Zod, so the UI bundle
 * stays small when only this module is imported.
 */

export const CATEGORY_KEYS = [
  "breakfast",
  "dinner",
  "starters",
  "soups",
  "salads",
  "main",
  "meat",
  "fish",
  "vegetables",
  "starches",
  "sides",
  "sauces",
  "snacks",
  "spreads",
  "bread",
  "pizza",
  "cakes",
  "desserts",
  "drinks",
  "other",
] as const;

export type CategoryKey = (typeof CATEGORY_KEYS)[number];

const ALIASES: Record<string, CategoryKey> = {
  abendbrot: "dinner",
  "aufstriche und marmeladen": "spreads",
  beilagen: "sides",
  "brot, brötchen und fladen, auch mit belag": "bread",
  "desserts und süßspeisen": "desserts",
  nachtisch: "desserts",
  fisch: "fish",
  "fleisch, geflügel und wild": "meat",
  frühstück: "breakfast",
  "gemüse, hülsenfrüchte und getreide": "vegetables",
  getränke: "drinks",
  hauptgerichte: "main",
  "kuchen, torten, muffins und gebäck": "cakes",
  "nudeln, kartoffeln und reis": "starches",
  "pizza, flammkuchen, foccacia, quiche, pasteten und samosas": "pizza",
  salate: "salads",
  "saucen, dips und snack": "sauces",
  snacks: "snacks",
  sonstiges: "other",
  "suppen und eintöpfe": "soups",
  vorspeisen: "starters",
};

export function isCategoryKey(value: string): value is CategoryKey {
  return (CATEGORY_KEYS as readonly string[]).includes(value);
}

export function mapToCategoryKey(input: string | undefined | null): CategoryKey {
  if (!input) {
    return "other";
  }
  const trimmed = input.trim();
  if (isCategoryKey(trimmed)) {
    return trimmed;
  }
  return ALIASES[trimmed.toLowerCase()] ?? "other";
}
