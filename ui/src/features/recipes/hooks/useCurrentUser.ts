import { useEffect, useState } from "react";

const STORAGE_KEY = "recipes.currentUser";

function readInitial(): string {
  if (typeof window === "undefined") {
    return "";
  }
  try {
    return window.localStorage.getItem(STORAGE_KEY) ?? "";
  } catch {
    return "";
  }
}

/**
 * The name the user has identified themselves as. Persisted so we only ask once
 * (and pre-fill the recipe form's creator field on every add/edit).
 */
export function useCurrentUser(): [string, (next: string) => void] {
  const [name, setName] = useState<string>(readInitial);

  useEffect(() => {
    try {
      if (name) {
        window.localStorage.setItem(STORAGE_KEY, name);
      } else {
        window.localStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      /* localStorage unavailable; non-fatal */
    }
  }, [name]);

  return [name, setName];
}
