import React, { useCallback, useEffect, useState } from "react";
import type { Recipe, User } from "./types/recipe";
import type { Language } from "./utils/translator";
import { getLabel } from "./utils/labels";
import { RecipeCard } from "./components/RecipeCard";
import { SearchFilter } from "./components/SearchFilter";
import { useRecipes, type RecipeQuery, type SortKey } from "./hooks/useRecipes";
import { useRecipeMeta } from "./hooks/useRecipeMeta";
import "./RecipeList.css";

const formatDate = (isoDate: string): string => {
  const date = new Date(isoDate);
  return date.toLocaleDateString("de-DE", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
};

const PAGE_SIZE = 10;
const SORT_KEYS: SortKey[] = ['title', '-title', 'createdAt', '-createdAt'];

function isSortKey(value: string): value is SortKey {
  return (SORT_KEYS as string[]).includes(value);
}

function readInitialState(): RecipeQuery {
  if (typeof window === 'undefined') {
    return { q: [], category: null, creator: null, sort: 'title', page: 1, pageSize: PAGE_SIZE };
  }
  const params = new URLSearchParams(window.location.search);
  const sortRaw = params.get('sort');
  const pageRaw = Number(params.get('page') ?? '1');
  return {
    q: params.getAll('q').filter((s) => s.length > 0),
    category: params.get('category'),
    creator: params.get('creator'),
    sort: sortRaw && isSortKey(sortRaw) ? sortRaw : 'title',
    page: Number.isFinite(pageRaw) && pageRaw >= 1 ? pageRaw : 1,
    pageSize: PAGE_SIZE
  };
}

function writeStateToUrl(state: RecipeQuery): void {
  const params = new URLSearchParams();
  for (const term of state.q) {
    params.append('q', term);
  }
  if (state.category) {
    params.set('category', state.category);
  }
  if (state.creator) {
    params.set('creator', state.creator);
  }
  if (state.sort !== 'title') {
    params.set('sort', state.sort);
  }
  if (state.page !== 1) {
    params.set('page', String(state.page));
  }
  const qs = params.toString();
  const next = `${window.location.pathname}${qs ? `?${qs}` : ''}${window.location.hash}`;
  window.history.replaceState(null, '', next);
}

interface RecipeListProps {
  currentLanguage: Language;
}

const RecipeList: React.FC<RecipeListProps> = ({ currentLanguage }) => {
  const [query, setQuery] = useState<RecipeQuery>(readInitialState);
  const [searchInput, setSearchInput] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { items, total, loading, error } = useRecipes(query);
  const meta = useRecipeMeta();

  useEffect(() => {
    writeStateToUrl(query);
  }, [query]);

  useEffect(() => {
    const applyHash = () => {
      const raw = window.location.hash.slice(1);
      const decoded = raw ? decodeURIComponent(raw) : null;
      setExpandedId(decoded);
    };
    applyHash();
    window.addEventListener('hashchange', applyHash);
    return () => window.removeEventListener('hashchange', applyHash);
  }, []);

  const toggleVisibility = useCallback((recipeId: string) => {
    setExpandedId((prev) => (prev === recipeId ? null : recipeId));
  }, []);

  const copyRecipeLink = (recipeId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    const url = `${window.location.origin}${window.location.pathname}#${encodeURIComponent(recipeId)}`;
    navigator.clipboard.writeText(url).then(() => {
      alert('Recipe link copied to clipboard!');
    });
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
    setSearchInput('');
  };

  const handleRemoveSearchTerm = (term: string) => {
    setQuery((prev) => ({ ...prev, q: prev.q.filter((t) => t !== term), page: 1 }));
  };

  const handleCategoryChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const v = event.target.value;
    setQuery((prev) => ({ ...prev, category: v === 'all' ? null : v, page: 1 }));
  };

  const handleCreatorChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const v = event.target.value;
    setQuery((prev) => ({ ...prev, creator: v === 'all' ? null : v, page: 1 }));
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

  const renderedItems: Recipe[] = items;

  return (
    <div className="recipe-list">
      <SearchFilter
        searchQuery={searchInput}
        searchTerms={query.q}
        selectedCategory={query.category ?? 'all'}
        selectedCreator={query.creator ?? 'all'}
        categories={meta.categories}
        creators={meta.creators}
        currentLanguage={currentLanguage}
        onSearchChange={(e) => setSearchInput(e.target.value)}
        onSearchSubmit={handleSearchSubmit}
        onRemoveSearchTerm={handleRemoveSearchTerm}
        onCategoryChange={handleCategoryChange}
        onCreatorChange={handleCreatorChange}
      />
      <div className="recipe-header-bar">
        <div className="recipe-count">
          {error ? (
            <span style={{ color: 'var(--primary-gradient-start)' }}>{error}</span>
          ) : (
            <span>
              {total} recipe{total !== 1 ? 's' : ''} found{loading ? '…' : ''}
            </span>
          )}
        </div>
        <a
          href="https://forms.gle/GC1GtuCSwFZEyE69A"
          target="_blank"
          rel="noopener noreferrer"
          className="add-recipe-button"
          title="Add a new recipe"
        >
          ➕ {getLabel('addRecipe', currentLanguage)}
        </a>
      </div>
      {renderedItems.map((recipe, index) => (
        <RecipeCard
          key={recipe.id}
          recipe={recipe}
          index={index}
          isExpanded={expandedId === recipe.id}
          currentLanguage={currentLanguage}
          onToggle={() => toggleVisibility(recipe.id)}
          onCopyLink={(_title, event) => copyRecipeLink(recipe.id, event)}
          formatDate={formatDate}
          getUserName={getUserName}
          getUserPhoto={getUserPhoto}
          mergeIngredientSections={mergeIngredientSections}
        />
      ))}
      <div className="pagination">
        <button onClick={handlePreviousPage} disabled={query.page === 1}>
          {getLabel('previous', currentLanguage)}
        </button>
        <span>
          {getLabel('page', currentLanguage)} {total === 0 ? 0 : query.page} {getLabel('of', currentLanguage)} {total === 0 ? 0 : totalPages}
        </span>
        <button onClick={handleNextPage} disabled={query.page >= totalPages || total === 0}>
          {getLabel('next', currentLanguage)}
        </button>
      </div>
    </div>
  );
};

export default RecipeList;
