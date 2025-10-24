import { api } from '../utils/axios';

export interface Size {
  size_id: number;
  name: string;
}

export interface SizesResponse {
  status: 'success';
  data: {
    sizes: Size[];
  };
}

class SizeService {
  
  /**
   * Lấy tất cả kích cỡ
   */
  async getSizes(): Promise<Size[]> {
    try {
      const response = await api.get<SizesResponse>('/api/v1/sizes');
      return response.data.data.sizes;
      
    } catch (error: any) {
      console.error('Get sizes error:', error);
      throw new Error(error.response?.data?.message || 'Không thể tải kích cỡ');
    }
  }

  /**
   * Lấy kích cỡ theo ID
   */
  async getSizeById(id: number): Promise<Size | null> {
    try {
      const sizes = await this.getSizes();
      return sizes.find(size => size.size_id === id) || null;
      
    } catch (error: any) {
      console.error('Get size by id error:', error);
      throw new Error(error.response?.data?.message || 'Không thể tải kích cỡ');
    }
  }

  /**
   * Lấy sizes cho quần áo (XS, S, M, L, XL, XXL, XXXL)
   */
  async getClothingSizes(): Promise<Size[]> {
    try {
      const sizes = await this.getSizes();
      const clothingSizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'];
      return sizes.filter(size => clothingSizes.includes(size.name));
      
    } catch (error: any) {
      console.error('Get clothing sizes error:', error);
      throw new Error(error.response?.data?.message || 'Không thể tải size quần áo');
    }
  }

  /**
   * Lấy sizes cho giày (35-45)
   */
  async getShoeSizes(): Promise<Size[]> {
    try {
      const sizes = await this.getSizes();
      return sizes.filter(size => {
        const sizeNum = parseInt(size.name);
        return !isNaN(sizeNum) && sizeNum >= 35 && sizeNum <= 45;
      });
      
    } catch (error: any) {
      console.error('Get shoe sizes error:', error);
      throw new Error(error.response?.data?.message || 'Không thể tải size giày');
    }
  }

  /**
   * Lấy sizes cho phụ kiện
   */
  async getAccessorySizes(): Promise<Size[]> {
    try {
      const sizes = await this.getSizes();
      const accessorySizes = ['Free Size', 'Nhỏ', 'Vừa', 'Lớn'];
      return sizes.filter(size => accessorySizes.includes(size.name));
      
    } catch (error: any) {
      console.error('Get accessory sizes error:', error);
      throw new Error(error.response?.data?.message || 'Không thể tải size phụ kiện');
    }
  }

  /**
   * Tìm kiếm size theo tên
   */
  async searchSizes(searchTerm: string): Promise<Size[]> {
    try {
      const sizes = await this.getSizes();
      return sizes.filter(size => 
        size.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      
    } catch (error: any) {
      console.error('Search sizes error:', error);
      throw new Error(error.response?.data?.message || 'Không thể tìm kiếm kích cỡ');
    }
  }

  async deleteSize(id: number): Promise<void> {
    try {
      await api.delete(`/api/v1/sizes/${id}`);
    } catch (error: any) {
      console.error('Delete size error:', error);
      throw new Error(error.response?.data?.message || 'Không thể xóa size');
    }
  }

  async createSize(data: { name: string }): Promise<Size> {
    try {
      const response = await api.post<{ status: string; data: { size: Size } }>('/api/v1/sizes', data);
      return response.data.data.size;
    } catch (error: any) {
      console.error('Create size error:', error);
      throw new Error(error.response?.data?.message || 'Không thể tạo size');
    }
  }
}

export const sizeService = new SizeService();
export default sizeService;
