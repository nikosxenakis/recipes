import { GroqVisionExtractor } from "./groqExtractor.ts";
import type { VisionExtractor } from "./visionExtractor.ts";

let cached: VisionExtractor | null = null;

export function getVisionExtractor(): VisionExtractor | null {
  if (cached) {
    return cached;
  }
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return null;
  }
  cached = new GroqVisionExtractor(apiKey);
  return cached;
}

export { VisionExtractorError } from "./visionExtractor.ts";
export type { VisionExtractor } from "./visionExtractor.ts";
