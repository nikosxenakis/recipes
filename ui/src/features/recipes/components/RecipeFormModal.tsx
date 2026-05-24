import { useState, type FormEvent } from "react";
import { Trash2 } from "lucide-react";
import type { Recipe, RecipeInput } from "recipes-shared";
import type { Language } from "@/shared/utils/translator";
import { getCategoryLabel, getLabel } from "@/shared/utils/labels";
import { CATEGORY_KEYS } from "recipes-shared/categories";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Textarea } from "@/shared/components/ui/textarea";
import { FormField } from "@/shared/components/common/FormField";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";

type Difficulty = "" | "einfach" | "mittel" | "schwer";

interface IngredientSectionDraft {
  title: string;
  items: string;
}

interface DraftRecipe {
  title: string;
  category: string;
  creator: string;
  duration: string;
  servings: string;
  difficulty: Difficulty;
  tags: string;
  photo: string;
  ingredients: IngredientSectionDraft[];
  instructions: string;
  tips: string;
  info: string;
}

const emptyDraft = (): DraftRecipe => ({
  title: "",
  category: "",
  creator: "",
  duration: "",
  servings: "",
  difficulty: "",
  tags: "",
  photo: "",
  ingredients: [{ title: "", items: "" }],
  instructions: "",
  tips: "",
  info: "",
});

function recipeToDraft(recipe: Recipe): DraftRecipe {
  const creatorName = recipe.creator
    ? typeof recipe.creator === "string"
      ? recipe.creator
      : recipe.creator.name
    : "";
  const ingredients = recipe.ingredients.length > 0
    ? recipe.ingredients.map((s) => ({
        title: s.title ?? "",
        items: s.items.join("\n"),
      }))
    : [{ title: "", items: "" }];
  return {
    title: recipe.title,
    category: recipe.category,
    creator: creatorName,
    duration: recipe.duration ?? "",
    servings: recipe.servings ?? "",
    difficulty: recipe.difficulty ?? "",
    tags: recipe.tags ? recipe.tags.join(", ") : "",
    photo: recipe.photo ?? "",
    ingredients,
    instructions: recipe.instructions.join("\n"),
    tips: recipe.tips ? recipe.tips.join("\n") : "",
    info: recipe.info ? recipe.info.join("\n") : "",
  };
}

function linesToArray(text: string): string[] {
  return text.split("\n").map((s) => s.trim()).filter((s) => s.length > 0);
}

function csvToArray(text: string): string[] {
  return text.split(",").map((s) => s.trim()).filter((s) => s.length > 0);
}

interface RecipeFormModalProps {
  recipe?: Recipe;
  /** Pre-fill for create mode (e.g. from image extraction). Ignored if `recipe` is set. */
  prefill?: RecipeInput;
  /** Default creator name for create mode when no prefill creator is present. */
  defaultCreator?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: (recipeId: string) => void;
  creators: string[];
  currentLanguage: Language;
}

function buildInitialDraft(recipe: Recipe | undefined, prefill: RecipeInput | undefined, defaultCreator: string | undefined): DraftRecipe {
  if (recipe) {
    return recipeToDraft(recipe);
  }
  if (prefill) {
    // RecipeInput is shaped like Recipe minus required id; reuse the mapper.
    return recipeToDraft({ ...prefill, id: "draft" } as Recipe);
  }
  const draft = emptyDraft();
  if (defaultCreator) {
    draft.creator = defaultCreator;
  }
  return draft;
}

export function RecipeFormModal({
  recipe,
  prefill,
  defaultCreator,
  open,
  onOpenChange,
  onSaved,
  creators,
  currentLanguage,
}: RecipeFormModalProps) {
  const isEdit = recipe !== undefined;
  const [draft, setDraft] = useState<DraftRecipe>(() => buildInitialDraft(recipe, prefill, defaultCreator));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update = <K extends keyof DraftRecipe>(key: K, value: DraftRecipe[K]) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
  };

  const updateIngredient = (index: number, field: keyof IngredientSectionDraft, value: string) => {
    setDraft((prev) => ({
      ...prev,
      ingredients: prev.ingredients.map((section, i) =>
        i === index ? { ...section, [field]: value } : section
      ),
    }));
  };

  const addIngredientSection = () => {
    setDraft((prev) => ({ ...prev, ingredients: [...prev.ingredients, { title: "", items: "" }] }));
  };

  const removeIngredientSection = (index: number) => {
    setDraft((prev) => ({
      ...prev,
      ingredients: prev.ingredients.length === 1
        ? prev.ingredients
        : prev.ingredients.filter((_, i) => i !== index),
    }));
  };

  const buildPayload = () => {
    const ingredients = draft.ingredients
      .map((section) => ({
        title: section.title.trim() || undefined,
        items: linesToArray(section.items),
      }))
      .filter((section) => section.items.length > 0 || section.title);

    const instructions = linesToArray(draft.instructions);
    const tips = linesToArray(draft.tips);
    const info = linesToArray(draft.info);
    const tags = csvToArray(draft.tags);

    return {
      title: draft.title.trim(),
      category: draft.category.trim(),
      creator: draft.creator.trim() ? { name: draft.creator.trim() } : undefined,
      duration: draft.duration.trim() || undefined,
      servings: draft.servings.trim() || undefined,
      difficulty: draft.difficulty || undefined,
      tags: tags.length > 0 ? tags : undefined,
      photo: draft.photo.trim() || undefined,
      ingredients,
      instructions,
      tips: tips.length > 0 ? tips : undefined,
      info: info.length > 0 ? info : undefined,
    };
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    const payload = buildPayload();
    if (!payload.title) {
      setError("Title is required.");
      setSubmitting(false);
      return;
    }
    if (!payload.category) {
      setError("Category is required.");
      setSubmitting(false);
      return;
    }
    if (payload.ingredients.length === 0 || payload.ingredients.every((s) => s.items.length === 0)) {
      setError("At least one ingredient is required.");
      setSubmitting(false);
      return;
    }
    if (payload.instructions.length === 0) {
      setError("At least one instruction step is required.");
      setSubmitting(false);
      return;
    }

    try {
      const url = isEdit && recipe ? `/api/recipes/${encodeURIComponent(recipe.id)}` : "/api/recipes";
      const method = isEdit ? "PUT" : "POST";
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await response.json()) as { recipe?: { id: string }; error?: string };
      if (!response.ok) {
        setError(data.error ?? `Failed to save (HTTP ${response.status})`);
        setSubmitting(false);
        return;
      }
      const savedId = data.recipe?.id ?? recipe?.id ?? "";
      onSaved(savedId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save recipe");
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEdit ? getLabel("editRecipe", currentLanguage) : getLabel("addRecipe", currentLanguage)}
          </DialogTitle>
        </DialogHeader>
        <form id="recipe-form" onSubmit={handleSubmit} noValidate className="flex flex-col gap-4 overflow-y-auto px-5 py-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <FormField label="Title" required className="md:col-span-2">
              <Input
                value={draft.title}
                onChange={(e) => update("title", e.target.value)}
                required
                maxLength={200}
              />
            </FormField>

            <FormField label="Category" required>
              <Select value={draft.category} onValueChange={(v) => update("category", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="—" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORY_KEYS.map((key) => (
                    <SelectItem key={key} value={key}>
                      {getCategoryLabel(key, currentLanguage)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>

            <FormField label="Creator">
              <Input
                list="modal-creator-list"
                value={draft.creator}
                onChange={(e) => update("creator", e.target.value)}
              />
              <datalist id="modal-creator-list">
                {creators.map((c) => <option key={c} value={c} />)}
              </datalist>
            </FormField>

            <FormField label="Duration">
              <Input
                placeholder="z.B. 30 Minuten"
                value={draft.duration}
                onChange={(e) => update("duration", e.target.value)}
              />
            </FormField>

            <FormField label="Servings">
              <Input
                placeholder="z.B. 4 Personen"
                value={draft.servings}
                onChange={(e) => update("servings", e.target.value)}
              />
            </FormField>

            <FormField label="Difficulty">
              <Select
                value={draft.difficulty}
                onValueChange={(v) => update("difficulty", v as Difficulty)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="—" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="einfach">einfach</SelectItem>
                  <SelectItem value="mittel">mittel</SelectItem>
                  <SelectItem value="schwer">schwer</SelectItem>
                </SelectContent>
              </Select>
            </FormField>

            <FormField label="Tags" hint="comma separated">
              <Input
                value={draft.tags}
                onChange={(e) => update("tags", e.target.value)}
              />
            </FormField>

            <FormField label="Photo URL" className="md:col-span-2">
              <Input
                type="text"
                inputMode="url"
                placeholder="https://..."
                value={draft.photo}
                onChange={(e) => update("photo", e.target.value)}
              />
            </FormField>
          </div>

          <fieldset className="rounded-md border border-border p-3">
            <legend className="px-1 text-sm font-semibold">
              {getLabel("ingredients", currentLanguage)} <span className="text-destructive">*</span>
            </legend>
            <div className="space-y-3">
              {draft.ingredients.map((section, index) => (
                <div key={index} className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <Input
                      placeholder="Section title (optional, e.g. 'Für die Sauce')"
                      value={section.title}
                      onChange={(e) => updateIngredient(index, "title", e.target.value)}
                    />
                    {draft.ingredients.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeIngredientSection(index)}
                        aria-label={`Remove section ${index + 1}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <Textarea
                    placeholder="One ingredient per line"
                    rows={4}
                    value={section.items}
                    onChange={(e) => updateIngredient(index, "items", e.target.value)}
                  />
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addIngredientSection}
              >
                + Section
              </Button>
            </div>
          </fieldset>

          <FormField label={`${getLabel("instructions", currentLanguage)} (one step per line)`} required>
            <Textarea
              rows={6}
              value={draft.instructions}
              onChange={(e) => update("instructions", e.target.value)}
              required
            />
          </FormField>

          <FormField label={`${getLabel("tips", currentLanguage)} (one per line)`}>
            <Textarea
              rows={3}
              value={draft.tips}
              onChange={(e) => update("tips", e.target.value)}
            />
          </FormField>

          <FormField label={`${getLabel("info", currentLanguage)} (one per line, e.g. 'Quelle: ...')`}>
            <Textarea
              rows={3}
              value={draft.info}
              onChange={(e) => update("info", e.target.value)}
            />
          </FormField>

          {error && (
            <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">
              {error}
            </div>
          )}
        </form>
        <DialogFooter>
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" form="recipe-form" disabled={submitting}>
            {submitting ? "Saving…" : isEdit ? "Save changes" : "Save recipe"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
