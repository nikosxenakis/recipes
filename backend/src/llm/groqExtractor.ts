import { CATEGORY_KEYS } from "recipes-shared/categories";
import { recipeInputSchema, type RecipeInput } from "recipes-shared";
import { VisionExtractorError, type VisionExtractor } from "./visionExtractor.ts";

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
// Scout = Groq's smallest free-tier vision model. Keep it small to stay within free quota.
const DEFAULT_MODEL = "meta-llama/llama-4-scout-17b-16e-instruct";
const MAX_OUTPUT_TOKENS = 1500;

const SYSTEM_PROMPT = [
  "Extract a recipe from the image. Return ONLY JSON, no markdown, no commentary.",
  "",
  "LANGUAGE DETECTION (most important):",
  "First detect the language of the visible text in the image (German, Greek, English, French, etc.).",
  "Use that EXACT language verbatim for every text field: title, ingredients[].items, instructions[], tips[], info[], creator.name, ingredient section titles.",
  "Do NOT translate. Do NOT default to German. If the image shows Greek text, return Greek. If English, return English.",
  "",
  "FAITHFULNESS (do not hallucinate):",
  "Only transcribe ingredients, quantities and steps that you can actually read in the image.",
  "Never invent ingredients, quantities, durations, servings, tags, or steps to fill gaps.",
  "If you can read fewer than 2 ingredients clearly, return {\"not_a_recipe\":true}.",
  "If the image is unreadable or not a recipe, return {\"not_a_recipe\":true}.",
  "",
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
  "- If a source attribution or URL is visible, add it to info[] in the source's language (e.g. \"Quelle: ...\" for German, \"Πηγή: ...\" for Greek, \"Source: ...\" for English).",
].join("\n");

interface GroqChoice {
  message?: { content?: string };
}
interface GroqResponse {
  choices?: GroqChoice[];
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

export class GroqVisionExtractor implements VisionExtractor {
  constructor(private apiKey: string, private model: string = DEFAULT_MODEL) {}

  async extractRecipe(image: Buffer, mimeType: string): Promise<RecipeInput | null> {
    const dataUrl = `data:${mimeType};base64,${image.toString("base64")}`;

    const response = await fetch(GROQ_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        temperature: 0,
        max_tokens: MAX_OUTPUT_TOKENS,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: [
              { type: "image_url", image_url: { url: dataUrl } },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      throw new VisionExtractorError(`Groq ${response.status}: ${body.slice(0, 200)}`, "transient");
    }

    const json = (await response.json()) as GroqResponse;
    const content = json.choices?.[0]?.message?.content;
    if (!content) {
      throw new VisionExtractorError(`Groq returned no content`, "transient");
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(stripCodeFence(content));
    } catch {
      throw new VisionExtractorError(`Groq returned non-JSON output`, "permanent");
    }

    if (parsed && typeof parsed === "object" && "not_a_recipe" in parsed && parsed.not_a_recipe === true) {
      return null;
    }

    const validated = recipeInputSchema.safeParse(parsed);
    if (!validated.success) {
      throw new VisionExtractorError(
        `Groq output didn't match recipe schema: ${validated.error.issues.slice(0, 3).map((i) => i.message).join("; ")}`,
        "permanent"
      );
    }
    return validated.data;
  }
}
