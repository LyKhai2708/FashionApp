import { api } from '../utils/axios';
import axios from 'axios';

export interface Category {
  category_id: number;
  category_name: string;
  description?: string;
  slug: string;
  image_url?: string;
  parent_id: number | null;
  active: number;
  children?: Category[];
}

export interface CategoriesResponse {
  status: 'success';
  data: {
    categories: Category[];
  };
}

class CategoryService {
  
  /**
   * Lấy tất cả danh mục (có cấu trúc cây)
   */
  async getCategories(): Promise<Category[]> {
    try {
      const response = await api.get<CategoriesResponse>('/api/v1/categories');
      return response.data.data.categories;
      
    } catch (error: any) {
      console.error('Get categories error:', error);
      throw new Error(error.response?.data?.message || 'Không thể tải danh mục');
    }
  }


  async getParentCategories(): Promise<Category[]> {
    try {
      const categories = await this.getCategories();
      return categories.filter(cat => cat.parent_id === null);
      
    } catch (error: any) {
      console.error('Get parent categories error:', error);
      throw new Error(error.response?.data?.message || 'Không thể tải danh mục cha');
    }
  }

  async getSubCategories(parentId: number): Promise<Category[]> {
    try {
      const categories = await this.getCategories();
      return categories.filter(cat => cat.parent_id === parentId);
      
    } catch (error: any) {
      console.error('Get sub categories error:', error);
      throw new Error(error.response?.data?.message || 'Không thể tải danh mục con');
    }
  }

  async getCategoryBySlug(slug: string): Promise<Category | null> {
    try {
      const categories = await this.getCategories();
      return categories.find(cat => cat.slug === slug) || null;
      
    } catch (error: any) {
      console.error('Get category by slug error:', error);
      throw new Error(error.response?.data?.message || 'Không thể tải danh mục');
    }
  }


  buildCategoryTree(categories: Category[]): Category[] {
    const categoryMap = new Map<number, Category>();
    const rootCategories: Category[] = [];

    categories.forEach(cat => {
      categoryMap.set(cat.category_id, { ...cat, children: [] });
    });

    categories.forEach(cat => {
      const category = categoryMap.get(cat.category_id)!;
      
      if (cat.parent_id === null) {
        rootCategories.push(category);
      } else {
        const parent = categoryMap.get(cat.parent_id);
        if (parent) {
          parent.children!.push(category);
        }
      }
    });

    return rootCategories;
  }

  /**
   * Lấy cấu trúc cây danh mục
   */
  async getCategoryTree(): Promise<Category[]> {
    try {
      const categories = await this.getCategories();
      return this.buildCategoryTree(categories);
      
    } catch (error: any) {
      console.error('Get category tree error:', error);
      throw new Error(error.response?.data?.message || 'Không thể tải cây danh mục');
    }
  }
  async getAll(): Promise<Category[]> {
    return this.getCategories();
  }

  async toggleCategoryStatus(id: number): Promise<Category> {
  try {
    const response = await api.patch(`/api/v1/categories/${id}/toggle`);
    return response.data.data.category;
  } catch (error: any) {
    console.error('Toggle category status error:', error);
    throw new Error(error.response?.data?.message || 'Không thể thay đổi trạng thái danh mục');
  }
}

async getAllCategoriesIncludeInactive(): Promise<Category[]> {
  try {
    const response = await api.get('/api/v1/categories?include_inactive=true');
    return response.data.data.categories;
  } catch (error: any) {
    console.error('Get all categories error:', error);
    throw new Error(error.response?.data?.message || 'Không thể tải danh mục');
  }
}

  async getLeafCategories(): Promise<Category[]> {
    try {
      const categories = await this.getCategories();
      // Tìm các category có parent_id (là con) và không có ai có parent_id là id của nó
      const childIds = new Set(categories.map(cat => cat.parent_id).filter(id => id !== null));
      return categories.filter(cat => !childIds.has(cat.category_id));
      
    } catch (error: any) {
      console.error('Get leaf categories error:', error);
      throw new Error(error.response?.data?.message || 'Không thể tải danh mục con');
    }
  }

   async createCategory(formData: FormData): Promise<Category> {
    try {
      const response = await api.post('/api/v1/categories', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data.data.category;
    } catch (error: any) {
      console.error('Create category error:', error);
      throw new Error(error.response?.data?.message || 'Không thể tạo danh mục');
    }
  }


  async updateCategory(id: number, formData: FormData): Promise<Category> {
    try {
      const response = await api.put(`/api/v1/categories/${id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data.data.category;
    } catch (error: any) {
      console.error('Update category error:', error);
      throw new Error(error.response?.data?.message || 'Không thể cập nhật danh mục');
    }
  }
}

export const categoryService = new CategoryService();
export default categoryService;
