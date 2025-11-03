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
    metadata: {
      totalRecords: number;
      firstPage: number;
      lastPage: number;
      page: number;
      limit: number;
    };
    brands: Brand[];
  };
}

export interface BrandResponse {
  status: 'success';
  data: {
    brand: Brand;
  };
}

class BrandService {
  

  async getBrands(): Promise<Brand[]> {
    try {
      const response = await api.get<BrandsResponse>('/api/v1/brands', {
        params: { active: 1, limit: 1000 }
      });
      return response.data.data.brands;
    } catch (error: any) {
      console.error('Get brands error:', error);
      throw new Error(error.response?.data?.message || 'Không thể tải thương hiệu');
    }
  }


  async getActiveBrands(): Promise<Brand[]> {
    try {
      const response = await api.get<BrandsResponse>('/api/v1/brands', {
        params: { active: 1, limit: 1000 }
      });
      return response.data.data.brands;
    } catch (error: any) {
      console.error('Get active brands error:', error);
      throw new Error(error.response?.data?.message || 'Không thể tải thương hiệu hoạt động');
    }
  }

  async getBrandById(id: number): Promise<Brand | null> {
    try {
      const response = await api.get<BrandResponse>(`/api/v1/brands/${id}`);
      return response.data.data.brand;
    } catch (error: any) {
      if (error.response?.status === 404) return null;
      console.error('Get brand by id error:', error);
      throw new Error(error.response?.data?.message || 'Không thể tải thương hiệu');
    }
  }

  async searchBrands(searchTerm: string): Promise<Brand[]> {
    try {
      const response = await api.get<BrandsResponse>('/api/v1/brands', {
        params: { name: searchTerm, active: 1, limit: 1000 }
      });
      return response.data.data.brands;
    } catch (error: any) {
      console.error('Search brands error:', error);
      throw new Error(error.response?.data?.message || 'Không thể tìm kiếm thương hiệu');
    }
  }


  async getAllBrandsIncludeInactive(): Promise<Brand[]> {
    try {
      const response = await api.get<BrandsResponse>('/api/v1/brands', {
        params: { limit: 1000 }
      });
      return response.data.data.brands;
    } catch (error: any) {
      console.error('Get all brands error:', error);
      throw new Error(error.response?.data?.message || 'Không thể tải thương hiệu');
    }
  }


  async createBrand(data: { name: string; active?: number }): Promise<Brand> {
    try {
      const response = await api.post<BrandResponse>('/api/v1/brands', data);
      return response.data.data.brand;
    } catch (error: any) {
      console.error('Create brand error:', error);
      throw new Error(error.response?.data?.message || 'Không thể tạo thương hiệu');
    }
  }


  async updateBrand(id: number, data: { name?: string; active?: number }): Promise<Brand> {
    try {
      const response = await api.put<BrandResponse>(`/api/v1/brands/${id}`, data);
      return response.data.data.brand;
    } catch (error: any) {
      console.error('Update brand error:', error);
      throw new Error(error.response?.data?.message || 'Không thể cập nhật thương hiệu');
    }
  }


  async deleteBrand(id: number): Promise<void> {
    try {
      await api.delete(`/api/v1/brands/${id}`);
    } catch (error: any) {
      console.error('Delete brand error:', error);
      throw new Error(error.response?.data?.message || 'Không thể xóa thương hiệu');
    }
  }


  async toggleBrandStatus(id: number): Promise<Brand> {
    try {
      const brand = await this.getBrandById(id);
      if (!brand) throw new Error('Không tìm thấy thương hiệu');
      
      const newStatus = brand.active === 1 ? 0 : 1;
      return await this.updateBrand(id, { active: newStatus });
    } catch (error: any) {
      console.error('Toggle brand status error:', error);
      throw new Error(error.response?.data?.message || 'Không thể thay đổi trạng thái');
    }
  }
}

export const brandService = new BrandService();
export default brandService;
