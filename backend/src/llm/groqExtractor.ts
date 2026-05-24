import { CATEGORY_KEYS } from "recipes-shared/categories";
import { recipeInputSchema, type RecipeInput } from "recipes-shared";
import { VisionExtractorError, type VisionExtractor } from "./visionExtractor.ts";

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
// Scout = Groq's smallest free-tier vision model. Keep it small to stay within free quota.
const DEFAULT_MODEL = "meta-llama/llama-4-scout-17b-16e-instruct";
const MAX_OUTPUT_TOKENS = 1500;

const SYSTEM_PROMPT = [
  "Extract a recipe from the image. Return ONLY JSON, no markdown.",
  "If the image is not a readable recipe: {\"not_a_recipe\":true}.",
  "Shape:",
  "{title:string, category:enum, creator?:{name:string}, duration?:string, servings?:string, difficulty?:'einfach'|'mittel'|'schwer', tags?:string[], ingredients:[{title?:string,items:string[]}], instructions:string[], tips?:string[], info?:string[]}",
  `category one of: ${CATEGORY_KEYS.join(", ")}`,
  "Rules: metric units (g/kg/ml/l/°C). Preserve source language. One step per instructions[] entry. Omit fields you can't see. If source/URL visible, add a \"Quelle: ...\" line to info[].",
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
