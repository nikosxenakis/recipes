import type { Language } from "@/shared/utils/translator";
import { RecipeList } from "@/features/recipes/components/RecipeList";

interface RecipesPageProps {
  currentLanguage: Language;
}

export function RecipesPage({ currentLanguage }: RecipesPageProps) {
  return <RecipeList currentLanguage={currentLanguage} />;
}
