import api from '../utils/axios';
import type {
    Product,
    ProductDetail,
    ProductsParams,
    ProductsResponse,
    ProductDetailResponse
} from '../types/product';

class ProductService{
    async getProducts(params: ProductsParams = {}, user_id?: number): Promise<{
        products: Product[];
        metadata: ProductsResponse['data']['metadata'];
      }> {

        try{
            const query = new URLSearchParams();

            if(params.page){
                query.append('page', params.page.toString());   
            }
            if(params.limit){
                query.append('limit', params.limit.toString());
            }
            if(params.search){
                query.append('search', params.search);
            }
            if(params.category_id){
                query.append('category_id', params.category_id.toString());
            }
            if(params.brand_id){
                query.append('brand_id', params.brand_id.toString());  
            }
            if(params.min_price){
                query.append('min_price', params.min_price.toString());
            }
            if(params.max_price){
                query.append('max_price', params.max_price.toString());
            }
            if(params.color_id){
                if(Array.isArray(params.color_id)){
                    query.append('color_id', params.color_id.join(','));
                } else {
                    query.append('color_id', params.color_id.toString());
                }
            }
            if(params.size_id){
                if(Array.isArray(params.size_id)){
                    query.append('size_id', params.size_id.join(','));
                } else {
                    query.append('size_id', params.size_id.toString());
                }
            }
            
            if(params.sort){
                query.append('sort', params.sort);
            }
            if(params.del_flag){
                query.append('del_flag', params.del_flag.toString());
            }
            if(user_id){
                query.append('user_id', user_id.toString());
            }
            const queryString = query.toString();
            const response = await api.get<ProductsResponse>(`/api/v1/products?${queryString}`);
            return {
                products: response.data.data.products,
                metadata: response.data.data.metadata
            };
        }catch(error: any){
            console.error('Get products error:', error);
            throw new Error(error.response?.data?.message || 'Không thể tải danh sách sản phẩm');
        }
        
    }

    async deleteProduct (productId: number) {
        const response = await api.delete(`/api/v1/products/${productId}`);
        return response.data;
    };
    async getProductById(id: number, user_id?: number): Promise<ProductDetail> {
        try{
            const query = new URLSearchParams();
            if(user_id){
                query.append('user_id', user_id.toString());
            }
            const response = await api.get<ProductDetailResponse>(`/api/v1/products/${id}?${query.toString()}`);
            return response.data.data.product;
        }catch(error: any){
            console.error('Get product by id error:', error);
            throw new Error(error.response?.data?.message || 'Không thể tải thông tin sản phẩm');
        }
    }
    
    async searchProduct(searchT: string, limit: number = 1){
        try{
            const response = await this.getProducts({search: searchT, limit, page: 1});
            return response.products;
        }catch(error: any){
            console.error('Search product error:', error);
            throw new Error(error.response?.data?.message || 'Không thể tìm kiếm sản phẩm');
        }
    }

    async getProductByCate(categoryId: number, params: Omit<ProductsParams, 'category_id'> = {}, user_id?: number): Promise<{
        products: Product[],
        metadata: ProductsResponse['data']['metadata']
    }> {
        return this.getProducts({
            category_id: categoryId,
            ...params
        }, user_id);
    }

    
}

export const productService = new ProductService();
export default productService;