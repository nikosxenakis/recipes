import { useEffect, useRef, useState } from 'react';
import type { Recipe } from '../types/recipe';

export type SortKey = 'title' | '-title' | 'createdAt' | '-createdAt';

export interface RecipeQuery {
  q: string[];
  category: string | null;
  creator: string | null;
  sort: SortKey;
  page: number;
  pageSize: number;
}

interface RecipesResponse {
  items: Recipe[];
  page: number;
  pageSize: number;
  total: number;
}

interface UseRecipesResult {
  items: Recipe[];
  total: number;
  loading: boolean;
  error: string | null;
}

function buildQueryString(query: RecipeQuery): string {
  const params = new URLSearchParams();
  for (const term of query.q) {
    params.append('q', term);
  }
  if (query.category) {
    params.append('category', query.category);
  }
  if (query.creator) {
    params.append('creator', query.creator);
  }
  params.set('sort', query.sort);
  params.set('page', String(query.page));
  params.set('pageSize', String(query.pageSize));
  return params.toString();
}

export function useRecipes(query: RecipeQuery, refreshKey = 0, debounceMs = 250): UseRecipesResult {
  const [items, setItems] = useState<Recipe[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fetchSeq = useRef(0);

  const qs = buildQueryString(query);

  useEffect(() => {
    const mySeq = ++fetchSeq.current;
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setLoading(true);
      fetch(`/api/recipes?${qs}`, { signal: controller.signal })
        .then(async (response) => {
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
          }
          const data = (await response.json()) as RecipesResponse;
          if (fetchSeq.current === mySeq) {
            setItems(data.items);
            setTotal(data.total);
            setError(null);
            setLoading(false);
          }
        })
        .catch((err: unknown) => {
          if (controller.signal.aborted || fetchSeq.current !== mySeq) {
            return;
          }
          setError(err instanceof Error ? err.message : 'Failed to load recipes');
          setLoading(false);
        });
    }, debounceMs);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [qs, debounceMs, refreshKey]);

  return { items, total, loading, error };
}
