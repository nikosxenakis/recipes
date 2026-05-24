import { CATEGORY_KEYS } from "recipes-shared/categories";
import { recipeInputSchema, type RecipeInput } from "recipes-shared";
import { VisionExtractorError, type VisionExtractor } from "./visionExtractor.ts";

const GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta/models";
// Flash strikes the best quality / cost / latency balance on the Google AI
// Studio free tier (15 RPM, ~1.5k requests/day). Excellent OCR for non-Latin
// scripts and noticeably less prone to fabrication than the Groq free model.
const DEFAULT_MODEL = "gemini-2.5-flash";
const MAX_OUTPUT_TOKENS = 2000;

const SYSTEM_PROMPT = [
  "You extract recipes from photos of cookbook pages, handwritten cards, and website screenshots.",
  "",
  "LANGUAGE DETECTION (most important):",
  "First detect the language of the visible text (German, Greek, English, French, etc.).",
  "Use that EXACT language verbatim for every text field: title, ingredients[].items, instructions[], tips[], info[], creator.name, ingredient section titles.",
  "Do NOT translate. Do NOT default to German. If the image shows Greek, return Greek. If English, return English.",
  "",
  "FAITHFULNESS (do not hallucinate):",
  "Transcribe ONLY what you can clearly read in the image. Read each ingredient line letter by letter; do not auto-complete or assume words from context.",
  "If a word looks unfamiliar, transcribe the exact letters you see — do not substitute a 'more common' word.",
  "If an ingredient line is partially illegible, include only the readable part (or omit it). Never invent quantities or words to fill gaps.",
  "Never add ingredients that are typical for this kind of dish but not visible in the image.",
  "If you can read fewer than 2 ingredients clearly, return {\"not_a_recipe\":true}.",
  "If the image is unreadable or not a recipe, return {\"not_a_recipe\":true}.",
  "",
  "Output STRICT JSON, nothing else (no markdown).",
  "Shape:",
  "{title:string, category:enum, creator?:{name:string}, duration?:string, servings?:string, difficulty?:'einfach'|'mittel'|'schwer', tags?:string[], ingredients:[{title?:string,items:string[]}], instructions:string[], tips?:string[], info?:string[]}",
  "",
  `category: pick the closest from [${CATEGORY_KEYS.join(", ")}]. Use "other" if unsure. These keys stay in English regardless of source language.`,
  "",
  "Rules:",
  "- Units in metric (g/kg/ml/l/°C). Convert imperial if needed; keep the numbers and units that appear in the image.",
  "- One logical cooking step per instructions[] entry.",
  "- difficulty enum is German-only; omit unless the source explicitly says einfach/mittel/schwer.",
  "- Omit duration, servings, tags, tips, info, creator entirely when not visible — do not guess.",
  "- If a source attribution or URL is visible, add it to info[] in the source's language (\"Quelle: ...\" for German, \"Πηγή: ...\" for Greek, \"Source: ...\" for English).",
].join("\n");

interface GeminiPart {
  text?: string;
}
interface GeminiCandidate {
  content?: { parts?: GeminiPart[] };
  finishReason?: string;
}
interface GeminiResponse {
  candidates?: GeminiCandidate[];
  promptFeedback?: { blockReason?: string };
  error?: { message?: string };
}

function stripCodeFence(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed.startsWith("```")) {
    return trimmed;
  }
  return trimmed
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```\s*$/, "")
    .trim();
}

export class GeminiVisionExtractor implements VisionExtractor {
  constructor(private apiKey: string, private model: string = DEFAULT_MODEL) {}

  async extractRecipe(image: Buffer, mimeType: string): Promise<RecipeInput | null> {
    const url = `${GEMINI_BASE}/${encodeURIComponent(this.model)}:generateContent?key=${encodeURIComponent(this.apiKey)}`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents: [
          {
            role: "user",
            parts: [
              { inlineData: { mimeType, data: image.toString("base64") } },
            ],
          },
        ],
        generationConfig: {
          temperature: 0,
          maxOutputTokens: MAX_OUTPUT_TOKENS,
          responseMimeType: "application/json",
        },
      }),
    });

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      throw new VisionExtractorError(`Gemini ${response.status}: ${body.slice(0, 200)}`, "transient");
    }

    const json = (await response.json()) as GeminiResponse;
    if (json.promptFeedback?.blockReason) {
      throw new VisionExtractorError(`Gemini blocked: ${json.promptFeedback.blockReason}`, "permanent");
    }
    const text = json.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";
    if (!text) {
      throw new VisionExtractorError(`Gemini returned no content (finishReason: ${json.candidates?.[0]?.finishReason ?? "unknown"})`, "transient");
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(stripCodeFence(text));
    } catch {
      throw new VisionExtractorError(`Gemini returned non-JSON output`, "permanent");
    }

    if (parsed && typeof parsed === "object" && "not_a_recipe" in parsed && parsed.not_a_recipe === true) {
      return null;
    }

    const validated = recipeInputSchema.safeParse(parsed);
    if (!validated.success) {
      throw new VisionExtractorError(
        `Gemini output didn't match recipe schema: ${validated.error.issues.slice(0, 3).map((i) => i.message).join("; ")}`,
        "permanent"
      );
    }
    return validated.data;
  }
}
