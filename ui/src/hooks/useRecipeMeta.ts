import { useEffect, useState } from 'react';

export interface RecipeMeta {
  categories: string[];
  creators: string[];
}

export function useRecipeMeta(): RecipeMeta {
  const [meta, setMeta] = useState<RecipeMeta>({ categories: [], creators: [] });

  useEffect(() => {
    let cancelled = false;
    fetch('/api/recipes/meta')
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        const data = (await response.json()) as RecipeMeta;
        if (!cancelled) {
          setMeta(data);
        }
      })
      .catch((err: unknown) => {
        console.error('Failed to load recipe meta:', err);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return meta;
}
