import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type { ReactNode } from 'react';
import favoriteService from '../services/favoriteService';
import { useAuth } from './AuthContext';

interface FavoritesContextType {
  favorites: Map<number, number>; // Map<product_id, favorite_id>
  isLoading: boolean;
  isFavorite: (productId: number) => boolean;
  getFavoriteId: (productId: number) => number | undefined;
  toggleFavorite: (productId: number, currentFavoriteId?: number) => Promise<{ isLiked: boolean; favoriteId?: number }>;
  refreshFavorites: () => Promise<void>;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [favorites, setFavorites] = useState<Map<number, number>>(new Map());
  const [isLoading, setIsLoading] = useState(false);
  const { isAuthenticated } = useAuth();

  const loadFavorites = useCallback(async () => {
    if (!isAuthenticated) {
      setFavorites(new Map());
      return;
    }

    try {
      setIsLoading(true);
      const data = await favoriteService.getFavorites(1, 1000);
      const favMap = new Map<number, number>();
      
      data.favorites.forEach((item) => {
        favMap.set(item.product_id, item.favorite_id);
      });
      
      setFavorites(favMap);
    } catch (error) {
      console.error('Load favorites error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    loadFavorites();
  }, [loadFavorites]);

  const isFavorite = useCallback((productId: number): boolean => {
    return favorites.has(productId);
  }, [favorites]);

  const getFavoriteId = useCallback((productId: number): number | undefined => {
    return favorites.get(productId);
  }, [favorites]);

  const toggleFavorite = useCallback(async (
    productId: number,
    currentFavoriteId?: number
  ): Promise<{ isLiked: boolean; favoriteId?: number }> => {
    if (!isAuthenticated) {
      throw new Error('Vui lòng đăng nhập để thêm sản phẩm yêu thích');
    }

    try {
      const result = await favoriteService.toggleFavorite(productId, currentFavoriteId);
      
      // Update local state
      setFavorites(prev => {
        const newMap = new Map(prev);
        if (result.isLiked && result.favoriteId) {
          newMap.set(productId, result.favoriteId);
        } else {
          newMap.delete(productId);
        }
        return newMap;
      });

      return result;
    } catch (error) {
      console.error('Toggle favorite error:', error);
      throw error;
    }
  }, [isAuthenticated]);

  const refreshFavorites = useCallback(async () => {
    await loadFavorites();
  }, [loadFavorites]);

  return (
    <FavoritesContext.Provider
      value={{
        favorites,
        isLoading,
        isFavorite,
        getFavoriteId,
        toggleFavorite,
        refreshFavorites
      }}
    >
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error('useFavorites must be used within FavoritesProvider');
  }
  return context;
}
