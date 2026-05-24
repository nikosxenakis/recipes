/**
 * Build a URL-safe slug from a recipe title while preserving non-Latin scripts
 * (Greek, Cyrillic, Arabic, etc.). We don't transliterate — the original
 * letters stay so the id reads naturally in the source language. Diacritics
 * are stripped for stability across "ē"/"e", "é"/"e", etc.
 */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    // Strip combining marks (accents). Tonos on Greek (e.g. ό → ο) is a
    // combining mark, so this also normalises "ό" and "ο" to "ο".
    .replace(/\p{M}/gu, "")
    // Keep letters (any script) and numbers; collapse everything else to "-".
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Produce a recipe id from an optional explicit id and the title, falling
 * back to a stable random suffix if both are empty.
 */
export function deriveRecipeId(explicit: string | null | undefined, title: string): string {
  const fromExplicit = (explicit ?? "").trim();
  if (fromExplicit) {
    return fromExplicit;
  }
  const fromTitle = slugify(title ?? "");
  if (fromTitle) {
    return fromTitle;
  }
  return `recipe-${randomId(6)}`;
}

function randomId(len: number): string {
  const alphabet = "abcdefghijklmnopqrstuvwxyz0123456789";
  let out = "";
  for (let i = 0; i < len; i += 1) {
    out += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return out;
}
