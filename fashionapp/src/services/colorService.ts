import { api } from '../utils/axios';

export interface Color {
  color_id: number;
  name: string;
  hex_code: string;
}

export interface ColorsResponse {
  status: 'success';
  data: {
    colors: Color[];
  };
}

class ColorService {
  
  /**
   * Lấy tất cả màu sắc
   */
  async getColors(): Promise<Color[]> {
    try {
      const response = await api.get<ColorsResponse>('/api/v1/colors');
      return response.data.data.colors;
      
    } catch (error: any) {
      console.error('Get colors error:', error);
      throw new Error(error.response?.data?.message || 'Không thể tải màu sắc');
    }
  }

  /**
   * Lấy màu theo ID
   */
  async getColorById(id: number): Promise<Color | null> {
    try {
      const colors = await this.getColors();
      return colors.find(color => color.color_id === id) || null;
      
    } catch (error: any) {
      console.error('Get color by id error:', error);
      throw new Error(error.response?.data?.message || 'Không thể tải màu sắc');
    }
  }

  /**
   * Tìm kiếm màu theo tên
   */
  async searchColors(searchTerm: string): Promise<Color[]> {
    try {
      const colors = await this.getColors();
      return colors.filter(color => 
        color.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      
    } catch (error: any) {
      console.error('Search colors error:', error);
      throw new Error(error.response?.data?.message || 'Không thể tìm kiếm màu sắc');
    }
  }
}

export const colorService = new ColorService();
export default colorService;
