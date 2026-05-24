import { GeminiVisionExtractor } from "./geminiExtractor.ts";
import { GroqVisionExtractor } from "./groqExtractor.ts";
import type { VisionExtractor } from "./visionExtractor.ts";

let cached: VisionExtractor | null = null;

/**
 * Resolution order: GEMINI_API_KEY > GROQ_API_KEY. Whichever key the operator
 * has set drives the extractor; setting GEMINI overrides GROQ. To disable
 * either provider, just unset its env var.
 */
export function getVisionExtractor(): VisionExtractor | null {
  if (cached) {
    return cached;
  }
  const geminiKey = process.env.GEMINI_API_KEY;
  if (geminiKey) {
    cached = new GeminiVisionExtractor(geminiKey);
    return cached;
  }
  const groqKey = process.env.GROQ_API_KEY;
  if (groqKey) {
    cached = new GroqVisionExtractor(groqKey);
    return cached;
  }
  return null;
}

export { VisionExtractorError } from "./visionExtractor.ts";
export type { VisionExtractor } from "./visionExtractor.ts";
