import { useRef, useState } from "react";
import { Camera, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { RecipeInput } from "recipes-shared";
import type { Language } from "@/shared/utils/translator";
import { getLabel } from "@/shared/utils/labels";
import { Button } from "@/shared/components/ui/button";
import { resizeImage } from "@/features/recipes/utils/resizeImage";

interface ImportRecipeButtonProps {
  currentLanguage: Language;
  onExtracted: (recipe: RecipeInput) => void;
}

export function ImportRecipeButton({ currentLanguage, onExtracted }: ImportRecipeButtonProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [busy, setBusy] = useState(false);

  const onPick = () => {
    if (busy) return;
    inputRef.current?.click();
  };

  const onChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setBusy(true);
    try {
      const resized = await resizeImage(file);
      const form = new FormData();
      form.append("image", resized, "recipe.jpg");
      const response = await fetch("/api/recipes/extract", { method: "POST", body: form });
      const data = (await response.json()) as { recipe?: RecipeInput; error?: string };
      if (!response.ok) {
        throw new Error(data.error ?? `HTTP ${response.status}`);
      }
      if (data.recipe) {
        onExtracted(data.recipe);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Image extraction failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        type="button"
        variant="outline"
        onClick={onPick}
        disabled={busy}
        aria-label={getLabel("importFromImage", currentLanguage)}
        title={getLabel("importFromImage", currentLanguage)}
      >
        {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <Camera className="h-5 w-5" />}
        <span className="hidden sm:inline">{getLabel("importFromImage", currentLanguage)}</span>
      </Button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={onChange}
      />
    </div>
  );
}
