export interface ProductColor {
    color_id: number;
    name: string;
    hex_code: string;
    images: ProductImage[];
  }
  

  export interface ProductImage {
    image_url: string;
    is_primary: boolean;
    display_order: number;
  }
  
 
  export interface PriceInfo {
    base_price: number;
    discounted_price: number;
    discount_percent: number;
    has_promotion: boolean;
  }
  

  export interface Product {
    product_id: number;
    name: string;
    description: string;
    slug: string;
    base_price: number;
    thumbnail: string;
    brand_id: number;
    category_id: number;
    created_at: string;
    brand_name: string;
    category_name: string;
    discount_percent?: number;
    discounted_price: number;
    has_promotion: boolean;
    colors: ProductColor[];        
    price_info: PriceInfo;         
  }

  // Variant cho product detail
export interface ProductVariant {
    variant_id: number;
    color: {
      color_id: number;
      name: string;
      hex_code: string;
      images: ProductImage[];
    };
    size: {
      size_id: number;
      name: string;
    };
    stock_quantity: number;
    final_price: number;
    active: number;
  }
  
  // Product detail (single product API)
  export interface ProductDetail {
    product_id: number;
    name: string;
    description: string;
    slug: string;
    base_price: number;
    thumbnail: string;
    brand_id: number;
    category_id: number;
    created_at: string;
    brand_name: string;
    category_name: string;
    discount_percent?: number;
    discounted_price: number;
    has_promotion: boolean;
    variants: ProductVariant[];
    price_info: PriceInfo;
  }
  
  // req parám
  export interface ProductsParams {
    page?: number;
    limit?: number;
    search?: string;
    category_id?: number;
    brand_id?: number;
    min_price?: number;
    max_price?: number;
    color_id?: number;
    size_id?: number;
    sort?: 'price_asc' | 'price_desc' | 'newest';
  }
  
  export interface ProductsResponse {
    status: 'success';
    data: {
      products: Product[];
      metadata: {
        totalRecords: number;
        firstPage: number;
        lastPage: number;
        page: number;
        limit: number;
      };
    };
  }
  
  export interface ProductDetailResponse {
    status: 'success';
    data: {
      product: ProductDetail;
    };
  }