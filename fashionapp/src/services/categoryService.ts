import { api } from '../utils/axios';

export interface Category {
  category_id: number;
  category_name: string;
  slug: string;
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

  /**
   * Lấy danh mục cha (parent_id = null)
   */
  async getParentCategories(): Promise<Category[]> {
    try {
      const categories = await this.getCategories();
      return categories.filter(cat => cat.parent_id === null);
      
    } catch (error: any) {
      console.error('Get parent categories error:', error);
      throw new Error(error.response?.data?.message || 'Không thể tải danh mục cha');
    }
  }

  /**
   * Lấy danh mục con theo parent_id
   */
  async getSubCategories(parentId: number): Promise<Category[]> {
    try {
      const categories = await this.getCategories();
      return categories.filter(cat => cat.parent_id === parentId);
      
    } catch (error: any) {
      console.error('Get sub categories error:', error);
      throw new Error(error.response?.data?.message || 'Không thể tải danh mục con');
    }
  }

  /**
   * Lấy danh mục theo slug
   */
  async getCategoryBySlug(slug: string): Promise<Category | null> {
    try {
      const categories = await this.getCategories();
      return categories.find(cat => cat.slug === slug) || null;
      
    } catch (error: any) {
      console.error('Get category by slug error:', error);
      throw new Error(error.response?.data?.message || 'Không thể tải danh mục');
    }
  }

  /**
   * Tạo cấu trúc cây danh mục
   */
  buildCategoryTree(categories: Category[]): Category[] {
    const categoryMap = new Map<number, Category>();
    const rootCategories: Category[] = [];

    // Tạo map và khởi tạo children array
    categories.forEach(cat => {
      categoryMap.set(cat.category_id, { ...cat, children: [] });
    });

    // Xây dựng cây
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
}

export const categoryService = new CategoryService();
export default categoryService;
