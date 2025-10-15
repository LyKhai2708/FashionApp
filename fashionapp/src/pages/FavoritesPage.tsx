import { useState, useEffect, useCallback } from 'react';
import { Empty, Spin, Pagination } from 'antd';
import { HeartOutlined } from '@ant-design/icons';
import favoriteService, { type FavoriteProduct } from '../services/favoriteService';
import ProductCard from '../components/ProductCard';
import Breadcrumb from '../components/Breadcrumb';
import { useMessage } from '../App';

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState<FavoriteProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const limit = 12;
  const message = useMessage();

  const loadFavorites = useCallback(async () => {
    try {
      setLoading(true);
      const data = await favoriteService.getFavorites(page, limit);
      setFavorites(data.favorites);
      setTotalRecords(data.metadata.totalRecords);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Không thể tải danh sách yêu thích';
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [page, limit, message]);

  useEffect(() => {
    loadFavorites();
  }, [loadFavorites]);

  const breadcrumbItems = [
    { label: 'Trang chủ', path: '/' },
    { label: 'Sản phẩm yêu thích' }
  ];

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Breadcrumb items={breadcrumbItems} />
        <div className="flex justify-center items-center min-h-[400px]">
          <Spin size="large" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Breadcrumb items={breadcrumbItems} />
      
      <div className="flex items-center gap-3 mb-6">
        <HeartOutlined className="text-3xl text-red-500" />
        <h1 className="text-3xl font-bold">Sản phẩm yêu thích</h1>
        <span className="text-gray-500">({totalRecords} sản phẩm)</span>
      </div>

      {favorites.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[400px]">
          <Empty 
            description="Chưa có sản phẩm yêu thích nào"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          >
            <a href="/products" className="text-blue-500 hover:underline">
              Khám phá sản phẩm ngay
            </a>
          </Empty>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {favorites.map((item) => (
              <ProductCard
                key={item.favorite_id}
                product={{
                  product_id: item.product_id,
                  name: item.product_name,
                  description: item.description,
                  slug: item.slug,
                  base_price: parseFloat(item.base_price),
                  thumbnail: item.thumbnail,
                  brand_id: 0,
                  category_id: 0,
                  created_at: item.favorited_at,
                  brand_name: item.brand_name,
                  category_name: item.category_name,
                  discount_percent: item.discount_percent ?? undefined,
                  discounted_price: item.price_info.discounted_price,
                  has_promotion: item.has_promotion,
                  is_favorite: true,
                  favorite_id: item.favorite_id,
                  colors: item.available_colors.map(color => ({
                    color_id: color.color_id,
                    name: color.name,
                    hex_code: color.hex_code,
                    primary_image: color.primary_image,
                    images: color.primary_image ? [{ image_url: color.primary_image, is_primary: true, display_order: 1 }] : [],
                    sizes: color.sizes.map(size => ({
                      variant_id: size.variant_id,
                      size_id: size.size_id,
                      size_name: size.size_name,
                      stock_quantity: size.stock_quantity
                    }))
                  })),
                  price_info: {
                    base_price: item.price_info.base_price,
                    discounted_price: item.price_info.discounted_price,
                    discount_percent: item.price_info.discount_percent ?? 0,
                    has_promotion: item.price_info.has_promotion
                  }
                }}
              />
            ))}
          </div>

          {totalRecords > limit && (
            <div className="flex justify-center mt-8">
              <Pagination
                current={page}
                total={totalRecords}
                pageSize={limit}
                onChange={setPage}
                showSizeChanger={false}
                showTotal={(total) => `Tổng ${total} sản phẩm`}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}
