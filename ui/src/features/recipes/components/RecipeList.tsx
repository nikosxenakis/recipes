import { useCallback, useEffect, useState } from "react";
import { Plus } from "lucide-react";
import type { Recipe, RecipeInput, User } from "recipes-shared";
import type { Language } from "@/shared/utils/translator";
import { getLabel } from "@/shared/utils/labels";
import { RecipeCard } from "@/features/recipes/components/RecipeCard";
import { SearchFilter } from "@/features/recipes/components/SearchFilter";
import { RecipeFormModal } from "@/features/recipes/components/RecipeFormModal";
import { RecipeCardSkeleton } from "@/features/recipes/components/RecipeCardSkeleton";
import { ImportRecipeButton } from "@/features/recipes/components/ImportRecipeButton";
import { WhoAreYouDialog } from "@/features/recipes/components/WhoAreYouDialog";
import { useRecipes, type RecipeQuery, type SortKey } from "@/features/recipes/hooks/useRecipes";
import { useRecipeMeta } from "@/features/recipes/hooks/useRecipeMeta";
import { useCurrentUser } from "@/features/recipes/hooks/useCurrentUser";
import { Button } from "@/shared/components/ui/button";

type PendingIntent = { kind: "create" } | { kind: "import"; prefill: RecipeInput } | null;

const formatDate = (isoDate: string): string => {
  const date = new Date(isoDate);
  return date.toLocaleDateString("de-DE", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
};

const PAGE_SIZE = 10;
const SORT_KEYS: SortKey[] = ["title", "-title", "createdAt", "-createdAt"];

function isSortKey(value: string): value is SortKey {
  return (SORT_KEYS as string[]).includes(value);
}

function readInitialState(): RecipeQuery {
  if (typeof window === "undefined") {
    return { q: [], category: null, creator: null, sort: "title", page: 1, pageSize: PAGE_SIZE };
  }
  const params = new URLSearchParams(window.location.search);
  const sortRaw = params.get("sort");
  const pageRaw = Number(params.get("page") ?? "1");
  return {
    q: params.getAll("q").filter((s) => s.length > 0),
    category: params.get("category"),
    creator: params.get("creator"),
    sort: sortRaw && isSortKey(sortRaw) ? sortRaw : "title",
    page: Number.isFinite(pageRaw) && pageRaw >= 1 ? pageRaw : 1,
    pageSize: PAGE_SIZE,
  };
}

function writeStateToUrl(state: RecipeQuery): void {
  const params = new URLSearchParams();
  for (const term of state.q) {
    params.append("q", term);
  }
  if (state.category) {
    params.set("category", state.category);
  }
  if (state.creator) {
    params.set("creator", state.creator);
  }
  if (state.sort !== "title") {
    params.set("sort", state.sort);
  }
  if (state.page !== 1) {
    params.set("page", String(state.page));
  }
  const qs = params.toString();
  const next = `${window.location.pathname}${qs ? `?${qs}` : ""}${window.location.hash}`;
  window.history.replaceState(null, "", next);
}

interface RecipeListProps {
  currentLanguage: Language;
}

export function RecipeList({ currentLanguage }: RecipeListProps) {
  const [query, setQuery] = useState<RecipeQuery>(readInitialState);
  const [searchInput, setSearchInput] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [createPrefill, setCreatePrefill] = useState<RecipeInput | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [currentUser, setCurrentUser] = useCurrentUser();
  const [pendingIntent, setPendingIntent] = useState<PendingIntent>(null);

  const { items, total, loading, error } = useRecipes(query, refreshKey);
  const meta = useRecipeMeta(refreshKey);

  useEffect(() => {
    writeStateToUrl(query);
  }, [query]);

  useEffect(() => {
    const applyHash = () => {
      const raw = window.location.hash.slice(1);
      setExpandedId(raw ? decodeURIComponent(raw) : null);
    };
    applyHash();
    window.addEventListener("hashchange", applyHash);
    return () => window.removeEventListener("hashchange", applyHash);
  }, []);

  const toggleVisibility = useCallback((recipeId: string) => {
    setExpandedId((prev) => (prev === recipeId ? null : recipeId));
  }, []);

  const copyRecipeLink = (recipeId: string) => {
    const url = `${window.location.origin}${window.location.pathname}#${encodeURIComponent(recipeId)}`;
    void navigator.clipboard.writeText(url).then(() => {
      alert(getLabel("linkCopied", currentLanguage));
    });
  };

  const handleEdit = (recipe: Recipe) => {
    setEditingRecipe(recipe);
  };

  const handleDelete = async (recipe: Recipe) => {
    const response = await fetch(`/api/recipes/${encodeURIComponent(recipe.id)}`, { method: "DELETE" });
    if (!response.ok && response.status !== 404) {
      const data = (await response.json().catch(() => ({ error: `HTTP ${response.status}` }))) as { error?: string };
      throw new Error(data.error ?? `HTTP ${response.status}`);
    }
    if (expandedId === recipe.id) {
      window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}`);
      setExpandedId(null);
    }
    setRefreshKey((k) => k + 1);
  };

  const handleSaved = (savedId: string) => {
    setCreateOpen(false);
    setCreatePrefill(null);
    setEditingRecipe(null);
    setRefreshKey((k) => k + 1);
    setQuery((prev) => ({ ...prev, page: 1 }));
    if (savedId) {
      window.location.hash = `#${encodeURIComponent(savedId)}`;
    }
  };

  const openCreate = (prefill?: RecipeInput) => {
    const intent: PendingIntent = prefill ? { kind: "import", prefill } : { kind: "create" };
    if (currentUser) {
      applyIntent(intent);
      return;
    }
    setPendingIntent(intent);
  };

  const applyIntent = (intent: NonNullable<PendingIntent>) => {
    if (intent.kind === "import") {
      setCreatePrefill(intent.prefill);
    } else {
      setCreatePrefill(null);
    }
    setCreateOpen(true);
  };

  const handleWhoPicked = (name: string) => {
    setCurrentUser(name);
    const intent = pendingIntent;
    setPendingIntent(null);
    if (intent) {
      applyIntent(intent);
    }
  };

  const getUserName = (user: User | string | undefined): string => {
    if (!user) return "";
    return typeof user === "string" ? user : user.name;
  };

  const getUserPhoto = (user: User | string | undefined): string | undefined => {
    if (!user || typeof user === "string") return undefined;
    return user.photo ? `./users/${user.photo}` : undefined;
  };

  const mergeIngredientSections = (sections: { title?: string; items: string[] }[]) => {
    const merged: { title?: string; items: string[] }[] = [];
    let currentUntitled: string[] = [];
    sections.forEach((section) => {
      if (section.title) {
        if (currentUntitled.length > 0) {
          merged.push({ items: currentUntitled });
          currentUntitled = [];
        }
        merged.push(section);
      } else {
        currentUntitled.push(...section.items);
      }
    });
    if (currentUntitled.length > 0) {
      merged.push({ items: currentUntitled });
    }
    return merged;
  };

  const handleSearchSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const term = searchInput.trim();
    if (term && !query.q.includes(term)) {
      setQuery((prev) => ({ ...prev, q: [...prev.q, term], page: 1 }));
    }
    setSearchInput("");
  };

  const handleRemoveSearchTerm = (term: string) => {
    setQuery((prev) => ({ ...prev, q: prev.q.filter((t) => t !== term), page: 1 }));
  };

  const handleCategoryChange = (value: string) => {
    setQuery((prev) => ({ ...prev, category: value === "all" ? null : value, page: 1 }));
  };

  const handleCreatorChange = (value: string) => {
    setQuery((prev) => ({ ...prev, creator: value === "all" ? null : value, page: 1 }));
  };

  const totalPages = Math.max(1, Math.ceil(total / query.pageSize));
  const handleNextPage = () => {
    if (query.page < totalPages) {
      setQuery((prev) => ({ ...prev, page: prev.page + 1 }));
    }
  };
  const handlePreviousPage = () => {
    if (query.page > 1) {
      setQuery((prev) => ({ ...prev, page: prev.page - 1 }));
    }
  };

  const skeletonCount = items.length > 0 ? items.length : query.pageSize;

  return (
    <div>
      <SearchFilter
        searchQuery={searchInput}
        searchTerms={query.q}
        selectedCategory={query.category ?? "all"}
        selectedCreator={query.creator ?? "all"}
        categories={meta.categories}
        creators={meta.creators}
        currentLanguage={currentLanguage}
        onSearchChange={setSearchInput}
        onSearchSubmit={handleSearchSubmit}
        onRemoveSearchTerm={handleRemoveSearchTerm}
        onCategoryChange={handleCategoryChange}
        onCreatorChange={handleCreatorChange}
      />

      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="text-base text-muted-foreground">
          {error ? (
            <span className="text-destructive">{error}</span>
          ) : (
            <span>
              {total} recipe{total !== 1 ? "s" : ""} found{loading ? "…" : ""}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <ImportRecipeButton
            currentLanguage={currentLanguage}
            onExtracted={(prefill) => openCreate(prefill)}
          />
          <Button
            type="button"
            onClick={() => openCreate()}
            aria-label={getLabel("addRecipe", currentLanguage)}
            title={getLabel("addRecipe", currentLanguage)}
            className="px-3 sm:px-5"
          >
            <Plus className="h-5 w-5" />
            <span className="hidden sm:inline">{getLabel("addRecipe", currentLanguage)}</span>
          </Button>
        </div>
      </div>

      {createOpen && (
        <RecipeFormModal
          open
          prefill={createPrefill ?? undefined}
          defaultCreator={currentUser || undefined}
          onOpenChange={(next) => {
            setCreateOpen(next);
            if (!next) {
              setCreatePrefill(null);
            }
          }}
          onSaved={handleSaved}
          creators={meta.creators}
          currentLanguage={currentLanguage}
        />
      )}
      {editingRecipe && (
        <RecipeFormModal
          recipe={editingRecipe}
          open
          onOpenChange={(open) => {
            if (!open) {
              setEditingRecipe(null);
            }
          }}
          onSaved={handleSaved}
          creators={meta.creators}
          currentLanguage={currentLanguage}
        />
      )}
      <WhoAreYouDialog
        open={pendingIntent !== null}
        knownCreators={meta.creators}
        currentLanguage={currentLanguage}
        onPick={handleWhoPicked}
        onCancel={() => setPendingIntent(null)}
      />

      {loading
        ? Array.from({ length: skeletonCount }, (_, i) => <RecipeCardSkeleton key={`skeleton-${i}`} />)
        : items.map((recipe) => (
            <RecipeCard
              key={recipe.id}
              recipe={recipe}
              isExpanded={expandedId === recipe.id}
              currentLanguage={currentLanguage}
              onToggle={() => toggleVisibility(recipe.id)}
              onCopyLink={() => copyRecipeLink(recipe.id)}
              onEdit={handleEdit}
              onDelete={handleDelete}
              formatDate={formatDate}
              getUserName={getUserName}
              getUserPhoto={getUserPhoto}
              mergeIngredientSections={mergeIngredientSections}
            />
          ))}

      <div className="mt-6 flex items-center justify-between gap-3 rounded-2xl border border-border bg-card p-3">
        <Button variant="outline" onClick={handlePreviousPage} disabled={query.page === 1}>
          {getLabel("previous", currentLanguage)}
        </Button>
        <span className="text-base text-muted-foreground">
          {getLabel("page", currentLanguage)} {total === 0 ? 0 : query.page}{" "}
          {getLabel("of", currentLanguage)} {total === 0 ? 0 : totalPages}
        </span>
        <Button variant="outline" onClick={handleNextPage} disabled={query.page >= totalPages || total === 0}>
          {getLabel("next", currentLanguage)}
        </Button>
      </div>
    </div>
  );
}
