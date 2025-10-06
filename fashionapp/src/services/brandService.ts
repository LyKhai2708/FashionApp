import { api } from '../utils/axios';

export interface Brand {
  id: number;
  name: string;
  active: number;
  created_at: string;
}

export interface BrandsResponse {
  status: 'success';
  data: {
    brands: Brand[];
  };
}

class BrandService {
  
  /**
   * Lấy tất cả thương hiệu
   */
  async getBrands(): Promise<Brand[]> {
    try {
      const response = await api.get<BrandsResponse>('/api/v1/brands');
      return response.data.data.brands;
      
    } catch (error: any) {
      console.error('Get brands error:', error);
      throw new Error(error.response?.data?.message || 'Không thể tải thương hiệu');
    }
  }

  /**
   * Lấy thương hiệu đang hoạt động
   */
  async getActiveBrands(): Promise<Brand[]> {
    try {
      const brands = await this.getBrands();
      return brands.filter(brand => brand.active === 1);
      
    } catch (error: any) {
      console.error('Get active brands error:', error);
      throw new Error(error.response?.data?.message || 'Không thể tải thương hiệu hoạt động');
    }
  }

  /**
   * Lấy thương hiệu theo ID
   */
  async getBrandById(id: number): Promise<Brand | null> {
    try {
      const brands = await this.getBrands();
      return brands.find(brand => brand.id === id) || null;
      
    } catch (error: any) {
      console.error('Get brand by id error:', error);
      throw new Error(error.response?.data?.message || 'Không thể tải thương hiệu');
    }
  }

  /**
   * Tìm kiếm thương hiệu theo tên
   */
  async searchBrands(searchTerm: string): Promise<Brand[]> {
    try {
      const brands = await this.getBrands();
      return brands.filter(brand => 
        brand.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
        brand.active === 1
      );
      
    } catch (error: any) {
      console.error('Search brands error:', error);
      throw new Error(error.response?.data?.message || 'Không thể tìm kiếm thương hiệu');
    }
  }
}

export const brandService = new BrandService();
export default brandService;
