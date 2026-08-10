import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { listFavorites, addFavorite, removeFavorite, FavoriteDoc } from '@/lib/favorites';

export function useFavorites() {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<FavoriteDoc[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!user) {
      setFavorites([]);
      setLoaded(true);
      return;
    }
    setLoaded(false);
    listFavorites(user.$id)
      .then(setFavorites)
      .catch(() => setFavorites([]))
      .finally(() => setLoaded(true));
  }, [user]);

  const isFavorite = useCallback(
    (foodId: number | string) => favorites.some((f) => f.foodId === String(foodId)),
    [favorites]
  );

  const toggleFavorite = useCallback(
    async (foodId: number | string) => {
      if (!user) return { requiresLogin: true as const };
      const idStr = String(foodId);
      const existing = favorites.find((f) => f.foodId === idStr);
      if (existing) {
        await removeFavorite(existing.$id);
        setFavorites((prev) => prev.filter((f) => f.$id !== existing.$id));
      } else {
        const created = await addFavorite(user.$id, idStr);
        setFavorites((prev) => [...prev, created]);
      }
      return { requiresLogin: false as const };
    },
    [user, favorites]
  );

  return { favorites, loaded, isFavorite, toggleFavorite };
}
