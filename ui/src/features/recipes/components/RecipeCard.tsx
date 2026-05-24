import { Calendar, ChefHat, Clock, Info, Lightbulb, MessageCircle, ShoppingCart, UtensilsCrossed, Users } from "lucide-react";
import type { Recipe } from "recipes-shared";
import type { Language } from "@/shared/utils/translator";
import { useTranslatedRecipe } from "@/features/recipes/hooks/useTranslatedRecipe";
import { useTranslatedText } from "@/features/recipes/hooks/useTranslatedText";
import { useWakeLock } from "@/features/recipes/hooks/useWakeLock";
import { useWakeLockPreference } from "@/features/recipes/hooks/useWakeLockPreference";
import { getCategoryLabel, getLabel } from "@/shared/utils/labels";
import { Avatar } from "@/features/recipes/components/Avatar";
import { Badge } from "@/shared/components/ui/badge";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { RecipeBodySkeleton } from "@/features/recipes/components/RecipeBodySkeleton";
import { RecipeActionsMenu } from "@/features/recipes/components/RecipeActionsMenu";
import { cn } from "@/shared/lib/utils";

interface RecipeCardProps {
  recipe: Recipe;
  isExpanded: boolean;
  currentLanguage: Language;
  onToggle: () => void;
  onCopyLink: () => void;
  onEdit: (recipe: Recipe) => void;
  onDelete: (recipe: Recipe) => Promise<void>;
  formatDate: (date: string) => string;
  mergeIngredientSections: (sections: { title?: string; items: string[] }[]) => { title?: string; items: string[] }[];
}

export function RecipeCard({
  recipe: originalRecipe,
  isExpanded,
  currentLanguage,
  onToggle,
  onCopyLink,
  onEdit,
  onDelete,
  formatDate,
  mergeIngredientSections,
}: RecipeCardProps) {
  const recipe = useTranslatedRecipe(originalRecipe, currentLanguage, isExpanded);
  const titleResult = useTranslatedText(originalRecipe.title, currentLanguage);
  const categoryLabel = getCategoryLabel(originalRecipe.category, currentLanguage);
  const previewTranslating = !isExpanded && titleResult.isTranslating;

  const [wakeLockEnabled, setWakeLockEnabled] = useWakeLockPreference();
  useWakeLock(isExpanded && wakeLockEnabled);

  return (
    <article
      className={cn(
        "mb-3 overflow-hidden rounded-2xl border border-border/80 bg-card text-card-foreground shadow-sm transition-all",
        isExpanded ? "ring-1 ring-primary/30 shadow-md" : "hover:border-primary/40"
      )}
      data-recipe-id={originalRecipe.id}
    >
      <div className="flex items-start gap-2.5 p-3 md:gap-4 md:p-5">
        <button
          type="button"
          onClick={onToggle}
          className="flex min-w-0 flex-1 items-start gap-3 text-left"
          aria-expanded={isExpanded}
        >
          {!isExpanded && recipe.photo && (
            <img
              src={recipe.photo}
              alt={titleResult.text}
              className="h-16 w-16 shrink-0 rounded-xl object-cover"
            />
          )}
          <div className="min-w-0 flex-1">
            {previewTranslating ? (
              <>
                <Skeleton className="mb-2 h-6 w-2/3" />
                <div className="flex gap-2">
                  <Skeleton className="h-4 w-28" />
                  {recipe.duration && <Skeleton className="h-4 w-20" />}
                </div>
              </>
            ) : (
              <>
                <h2 className="text-lg font-semibold leading-tight md:text-xl">{titleResult.text}</h2>
                {!isExpanded && (
                  <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                    <span>{categoryLabel}</span>
                    {recipe.duration && (
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {recipe.duration}
                      </span>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </button>

        <div className="flex shrink-0 items-center gap-2">
          {isExpanded && recipe.creator && (
            <span className="hidden items-center gap-2 rounded-full border border-border bg-muted px-3 py-1.5 text-sm font-medium md:inline-flex">
              <Avatar name={recipe.creator} size="sm" />
              {recipe.creator}
            </span>
          )}
          <RecipeActionsMenu
            recipe={originalRecipe}
            currentLanguage={currentLanguage}
            wakeLockEnabled={wakeLockEnabled}
            onToggleWakeLock={setWakeLockEnabled}
            onEdit={() => onEdit(originalRecipe)}
            onCopyLink={onCopyLink}
            onDelete={() => onDelete(originalRecipe)}
          />
        </div>
      </div>

      {isExpanded && (
        <div className="border-t border-border/70 px-3 pb-4 pt-3 md:px-6 md:pb-6 md:pt-4">
          {recipe.isTranslating ? (
            <RecipeBodySkeleton />
          ) : (
            <>
              <div className="mb-5 flex flex-wrap items-center gap-2 text-sm">
                {recipe.creator && (
                  <Badge variant="outline" className="gap-1.5 md:hidden">
                    <Avatar name={recipe.creator} size="sm" />
                    {recipe.creator}
                  </Badge>
                )}
                <Badge variant="outline" className="gap-1">
                  <UtensilsCrossed className="h-3.5 w-3.5" />
                  {categoryLabel}
                </Badge>
                {recipe.duration && (
                  <Badge variant="outline" className="gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    {recipe.duration}
                  </Badge>
                )}
                {recipe.servings && (
                  <Badge variant="outline" className="gap-1">
                    <Users className="h-3.5 w-3.5" />
                    {recipe.servings}
                  </Badge>
                )}
                {wakeLockEnabled && (
                  <Badge variant="primary" className="gap-1">
                    <Lightbulb className="h-3.5 w-3.5" />
                    {getLabel("keepAwake", currentLanguage)}
                  </Badge>
                )}
                {recipe.createdAt && (
                  <Badge variant="outline" className="ml-auto gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    {formatDate(recipe.createdAt)}
                  </Badge>
                )}
              </div>

              {recipe.photo && (
                <img
                  src={recipe.photo}
                  alt={recipe.title}
                  className="mb-5 max-h-96 w-full rounded-xl object-cover"
                />
              )}

              <RecipeSection icon={<ShoppingCart className="h-4 w-4" />} title={getLabel("ingredients", currentLanguage)}>
                <div className="space-y-3">
                  {mergeIngredientSections(recipe.ingredients).map((section, sectionIndex) => (
                    <div key={sectionIndex}>
                      {section.title && (
                        <h4 className="mb-1 text-sm font-semibold text-foreground">{section.title}</h4>
                      )}
                      <ul className="list-inside list-disc space-y-1 text-base text-foreground">
                        {section.items.map((ingredient, i) => (
                          <li key={i}>{ingredient}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </RecipeSection>

              <RecipeSection icon={<ChefHat className="h-4 w-4" />} title={getLabel("instructions", currentLanguage)}>
                <ol className="list-inside list-decimal space-y-2 text-base text-foreground">
                  {recipe.instructions.map((instruction, i) => (
                    <li key={i} className="pl-1">{instruction}</li>
                  ))}
                </ol>
              </RecipeSection>

              {recipe.tips && recipe.tips.length > 0 && (
                <RecipeSection icon={<Lightbulb className="h-4 w-4" />} title={getLabel("tips", currentLanguage)}>
                  <ul className="list-inside list-disc space-y-1 text-base text-foreground">
                    {recipe.tips.map((tip, i) => (
                      <li key={i}>{tip}</li>
                    ))}
                  </ul>
                </RecipeSection>
              )}

              {recipe.info && recipe.info.length > 0 && (
                <RecipeSection icon={<Info className="h-4 w-4" />} title={getLabel("info", currentLanguage)}>
                  <ul className="list-inside list-disc space-y-1 text-base text-foreground">
                    {recipe.info.map((entry, i) => (
                      <li key={i}>{entry}</li>
                    ))}
                  </ul>
                </RecipeSection>
              )}

              {recipe.comments && recipe.comments.length > 0 && (
                <RecipeSection icon={<MessageCircle className="h-4 w-4" />} title={getLabel("comment", currentLanguage)}>
                  <div className="space-y-3">
                    {recipe.comments.map((comment, i) => (
                      <div key={i} className="flex gap-3">
                        <Avatar name={comment.user ?? ""} size="md" />
                        <div className="flex-1">
                          {comment.user && <div className="text-sm font-medium">{comment.user}</div>}
                          <div className="text-base text-muted-foreground">{comment.text}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </RecipeSection>
              )}
            </>
          )}
        </div>
      )}
    </article>
  );
}

function RecipeSection({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-6 first:mt-0">
      <h3 className="mb-3 flex items-center gap-2 text-base font-semibold text-foreground">
        {icon}
        {title}
      </h3>
      {children}
    </section>
  );
}
