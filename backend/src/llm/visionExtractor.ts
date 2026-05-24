import type { RecipeInput } from "recipes-shared";

export interface VisionExtractor {
  /**
   * Parse a single image of a recipe into structured recipe data.
   * Throws on transient failures (network, rate limit) so the caller can return 5xx.
   * Returns `null` if the image doesn't look like a recipe.
   */
  extractRecipe(image: Buffer, mimeType: string): Promise<RecipeInput | null>;
}

export class VisionExtractorError extends Error {
  constructor(message: string, public status: "transient" | "permanent" = "transient") {
    super(message);
    this.name = "VisionExtractorError";
  }
}
