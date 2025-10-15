import { api } from '../utils/axios';

export interface FavoriteProduct {
  favorite_id: number;
  product_id: number;
  favorited_at: string;
  product_name: string;
  description: string;
  base_price: string;
  thumbnail: string;
  sold: number;
  slug: string;
  brand_name: string;
  category_name: string;
  discount_percent: number | null;
  discounted_price: string;
  has_promotion: boolean;
  available_colors: Array<{
    color_id: number;
    name: string;
    hex_code: string;
    primary_image: string | null;
    sizes: Array<{
      variant_id: number;
      size_id: number;
      size_name: string;
      stock_quantity: number;
    }>;
  }>;
  price_info: {
    base_price: number;
    discounted_price: number;
    discount_percent: number | null;
    has_promotion: boolean;
  };
}

export interface Favorite {
  favorite_id: number;
  user_id: number;
  product_id: number;
  created_at: string;
}

export interface FavoritesResponse {
  status: 'success';
  data: {
    metadata: {
      page: number;
      limit: number;
      totalRecords: number;
      totalPages: number;
    };
    favorites: FavoriteProduct[];
  };
}

export interface AddFavoriteResponse {
  status: 'success';
  data: {
    favorite: Favorite;
  };
}

class FavoriteService {
  

  async getFavorites(page: number = 1, limit: number = 20): Promise<{ favorites: FavoriteProduct[]; metadata: { page: number; limit: number; totalRecords: number; totalPages: number } }> {
    try {
      const response = await api.get<FavoritesResponse>('/api/v1/favorites', {
        params: { page, limit }
      });
      return response.data.data;
      
    } catch (error) {
      console.error('Get favorites error:', error);
      const message = error instanceof Error && 'response' in error && error.response ? 
        (error.response as { data?: { message?: string } }).data?.message : undefined;
      throw new Error(message || 'Không thể tải danh sách yêu thích');
    }
  }

  /**
   * Thêm sản phẩm vào danh sách yêu thích
   */
  async addFavorite(productId: number): Promise<Favorite> {
    try {
      const response = await api.post<AddFavoriteResponse>('/api/v1/favorites', {
        product_id: productId
      });
      return response.data.data.favorite;
      
    } catch (error) {
      console.error('Add favorite error:', error);
      const message = error instanceof Error && 'response' in error && error.response ? 
        (error.response as { data?: { message?: string } }).data?.message : undefined;
      throw new Error(message || 'Không thể thêm vào danh sách yêu thích');
    }
  }

  /**
   * Xóa sản phẩm khỏi danh sách yêu thích
   */
  async removeFavorite(favoriteId: number): Promise<void> {
    try {
      await api.delete(`/api/v1/favorites/${favoriteId}`);
      
    } catch (error) {
      console.error('Remove favorite error:', error);
      const message = error instanceof Error && 'response' in error && error.response ? 
        (error.response as { data?: { message?: string } }).data?.message : undefined;
      throw new Error(message || 'Không thể xóa khỏi danh sách yêu thích');
    }
  }


  async toggleFavorite(productId: number, currentFavoriteId?: number): Promise<{ isLiked: boolean; favoriteId?: number }> {
    try {
      if (currentFavoriteId) {

        await this.removeFavorite(currentFavoriteId);
        return { isLiked: false };
      } else {
        const favorite = await this.addFavorite(productId);
        return { isLiked: true, favoriteId: favorite.favorite_id };
      }
      
    } catch (error) {
      console.error('Toggle favorite error:', error);
      const message = error instanceof Error && 'response' in error && error.response ? 
        (error.response as { data?: { message?: string } }).data?.message : undefined;
      throw new Error(message || 'Không thể cập nhật trạng thái yêu thích');
    }
  }
}

export const favoriteService = new FavoriteService();
export default favoriteService;
