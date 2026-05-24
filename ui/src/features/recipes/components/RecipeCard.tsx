import { Calendar, ChefHat, Clock, Info, Link as LinkIcon, Lightbulb, MessageCircle, Pencil, ShoppingCart, UtensilsCrossed, Users } from "lucide-react";
import type { Recipe, User } from "@/features/recipes/types/recipe";
import type { Language } from "@/shared/utils/translator";
import { useTranslatedRecipe } from "@/features/recipes/hooks/useTranslatedRecipe";
import { useTranslatedText } from "@/features/recipes/hooks/useTranslatedText";
import { useWakeLock } from "@/features/recipes/hooks/useWakeLock";
import { useWakeLockPreference } from "@/features/recipes/hooks/useWakeLockPreference";
import { getCategoryLabel, getLabel } from "@/shared/utils/labels";
import { Avatar } from "@/features/recipes/components/Avatar";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { RecipeBodySkeleton } from "@/features/recipes/components/RecipeBodySkeleton";
import { WakeLockToggle } from "@/features/recipes/components/WakeLockToggle";
import { cn } from "@/shared/lib/utils";

interface RecipeCardProps {
  recipe: Recipe;
  isExpanded: boolean;
  currentLanguage: Language;
  onToggle: () => void;
  onCopyLink: (event: React.MouseEvent) => void;
  onEdit: (recipe: Recipe, event: React.MouseEvent) => void;
  formatDate: (date: string) => string;
  getUserName: (user: User | string | undefined) => string;
  getUserPhoto: (user: User | string | undefined) => string | undefined;
  mergeIngredientSections: (sections: { title?: string; items: string[] }[]) => { title?: string; items: string[] }[];
}

export function RecipeCard({
  recipe: originalRecipe,
  isExpanded,
  currentLanguage,
  onToggle,
  onCopyLink,
  onEdit,
  formatDate,
  getUserName,
  getUserPhoto,
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
        "mb-3 overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow-sm transition-colors",
        isExpanded ? "ring-1 ring-primary/30" : "hover:border-primary/40"
      )}
      data-recipe-id={originalRecipe.id}
    >
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-start gap-3 p-4 text-left md:p-5"
      >
        {!isExpanded && recipe.photo && (
          <img
            src={recipe.photo}
            alt={titleResult.text}
            className="h-16 w-16 shrink-0 rounded-lg object-cover"
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
              <h2 className="text-lg font-bold leading-tight md:text-xl">{titleResult.text}</h2>
              {!isExpanded && (
                <div className="mt-1.5 flex flex-wrap gap-2 text-sm text-muted-foreground">
                  <span className="font-medium">{categoryLabel}</span>
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
        {isExpanded && (
          <div className="flex shrink-0 items-center gap-2" onClick={(e) => e.stopPropagation()}>
            {recipe.creator && (
              <span className="hidden items-center gap-2 rounded-full border border-border bg-muted px-2.5 py-1 text-xs font-medium sm:inline-flex">
                <Avatar
                  photoUrl={getUserPhoto(recipe.creator)}
                  name={getUserName(recipe.creator)}
                  size="sm"
                />
                {getUserName(recipe.creator)}
              </span>
            )}
            <WakeLockToggle
              enabled={wakeLockEnabled}
              onChange={setWakeLockEnabled}
              language={currentLanguage}
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={(e) => onEdit(originalRecipe, e)}
              title={getLabel("editRecipe", currentLanguage)}
              aria-label={getLabel("editRecipe", currentLanguage)}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={onCopyLink}
              title="Copy recipe link"
              aria-label="Copy recipe link"
            >
              <LinkIcon className="h-4 w-4" />
            </Button>
          </div>
        )}
      </button>

      {isExpanded && (
        <div className="border-t border-border px-4 pb-5 pt-3 md:px-5">
          {recipe.isTranslating ? (
            <RecipeBodySkeleton />
          ) : (
            <>
              <div className="mb-4 flex flex-wrap items-center gap-2 text-sm">
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
                  className="mb-5 max-h-96 w-full rounded-lg object-cover"
                />
              )}

              <RecipeSection icon={<ShoppingCart className="h-4 w-4" />} title={getLabel("ingredients", currentLanguage)}>
                <div className="space-y-3">
                  {mergeIngredientSections(recipe.ingredients).map((section, sectionIndex) => (
                    <div key={sectionIndex}>
                      {section.title && (
                        <h4 className="mb-1 text-sm font-semibold text-foreground">{section.title}</h4>
                      )}
                      <ul className="list-inside list-disc space-y-1 text-sm text-foreground">
                        {section.items.map((ingredient, i) => (
                          <li key={i}>{ingredient}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </RecipeSection>

              <RecipeSection icon={<ChefHat className="h-4 w-4" />} title={getLabel("instructions", currentLanguage)}>
                <ol className="list-inside list-decimal space-y-1.5 text-sm text-foreground">
                  {recipe.instructions.map((instruction, i) => (
                    <li key={i}>{instruction}</li>
                  ))}
                </ol>
              </RecipeSection>

              {recipe.tips && recipe.tips.length > 0 && (
                <RecipeSection icon={<Lightbulb className="h-4 w-4" />} title={getLabel("tips", currentLanguage)}>
                  <ul className="list-inside list-disc space-y-1 text-sm text-foreground">
                    {recipe.tips.map((tip, i) => (
                      <li key={i}>{tip}</li>
                    ))}
                  </ul>
                </RecipeSection>
              )}

              {recipe.info && recipe.info.length > 0 && (
                <RecipeSection icon={<Info className="h-4 w-4" />} title={getLabel("info", currentLanguage)}>
                  <ul className="list-inside list-disc space-y-1 text-sm text-foreground">
                    {recipe.info.map((entry, i) => (
                      <li key={i}>{entry}</li>
                    ))}
                  </ul>
                </RecipeSection>
              )}

              {recipe.comments && recipe.comments.length > 0 && (
                <RecipeSection icon={<MessageCircle className="h-4 w-4" />} title={getLabel("comment", currentLanguage)}>
                  <div className="space-y-3">
                    {recipe.comments.map((comment, i) => {
                      const userName = getUserName(comment.user);
                      const userPhoto = getUserPhoto(comment.user);
                      return (
                        <div key={i} className="flex gap-3">
                          <Avatar photoUrl={userPhoto} name={userName} size="md" />
                          <div className="flex-1">
                            {userName && <div className="text-sm font-medium">{userName}</div>}
                            <div className="text-sm text-muted-foreground">{comment.text}</div>
                          </div>
                        </div>
                      );
                    })}
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
    <section className="mt-5 first:mt-0">
      <h3 className="mb-2 flex items-center gap-2 text-base font-semibold text-foreground">
        {icon}
        {title}
      </h3>
      {children}
    </section>
  );
}
