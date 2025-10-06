import { api } from '../utils/axios';

export interface Favorite {
  favorite_id: number;
  user_id: number;
  product_id: number;
  created_at: string;
}

export interface FavoritesResponse {
  status: 'success';
  data: {
    favorites: Favorite[];
  };
}

export interface AddFavoriteResponse {
  status: 'success';
  data: {
    favorite: Favorite;
  };
}

class FavoriteService {
  
  /**
   * Lấy danh sách sản phẩm yêu thích của user
   */
  async getFavorites(): Promise<Favorite[]> {
    try {
      const response = await api.get<FavoritesResponse>('/api/v1/favorites');
      return response.data.data.favorites;
      
    } catch (error: any) {
      console.error('Get favorites error:', error);
      throw new Error(error.response?.data?.message || 'Không thể tải danh sách yêu thích');
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
      
    } catch (error: any) {
      console.error('Add favorite error:', error);
      throw new Error(error.response?.data?.message || 'Không thể thêm vào danh sách yêu thích');
    }
  }

  /**
   * Xóa sản phẩm khỏi danh sách yêu thích
   */
  async removeFavorite(favoriteId: number): Promise<void> {
    try {
      await api.delete(`/api/v1/favorites/${favoriteId}`);
      
    } catch (error: any) {
      console.error('Remove favorite error:', error);
      throw new Error(error.response?.data?.message || 'Không thể xóa khỏi danh sách yêu thích');
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
      
    } catch (error: any) {
      console.error('Toggle favorite error:', error);
      throw new Error(error.response?.data?.message || 'Không thể cập nhật trạng thái yêu thích');
    }
  }
}

export const favoriteService = new FavoriteService();
export default favoriteService;
