import { useCallback, useEffect, useState } from "react";

interface UsersResponse {
  users: string[];
}

interface UseUsersResult {
  users: string[];
  loading: boolean;
  addUser: (name: string) => Promise<string | null>;
}

export function useUsers(refreshKey = 0): UseUsersResult {
  const [users, setUsers] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) {
        setLoading(true);
      }
    });
    fetch("/api/users")
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        const data = (await response.json()) as UsersResponse;
        if (!cancelled) {
          setUsers(data.users);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error("Failed to load users:", err);
        if (!cancelled) {
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  const addUser = useCallback(async (name: string): Promise<string | null> => {
    const trimmed = name.trim();
    if (!trimmed) {
      return null;
    }
    const response = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: trimmed }),
    });
    if (!response.ok) {
      return null;
    }
    const data = (await response.json()) as UsersResponse;
    setUsers(data.users);
    return trimmed;
  }, []);

  return { users, loading, addUser };
}
