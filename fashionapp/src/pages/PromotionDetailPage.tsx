import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect, useCallback } from 'react';
import { Breadcrumb, Spin, Pagination } from 'antd';
import { Calendar, Tag } from 'lucide-react';
import ProductList from '../components/ProductList';
import Countdown from '../components/promotion/CountDown';
import promotionService from '../services/promotionService';
import type { Promotion } from '../services/promotionService';
import type { Product } from '../types/product';

const PromotionDetailPage = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [promotion, setPromotion] = useState<Promotion | null>(null);
    const [loading, setLoading] = useState(true);
    const [products, setProducts] = useState<Product[]>([]);
    const [productsLoading, setProductsLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);


    useEffect(() => {
        const fetchPromotionDetail = async () => {
            if (!id) return;

            try {
                setLoading(true);
                const promo = await promotionService.getPromotionById(parseInt(id));
                setPromotion(promo);
            } catch (error) {
                console.error('Error fetching promotion:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchPromotionDetail();
    }, [id]);

    const fetchProducts = useCallback(async (page: number = 1) => {
        if (!id) return;

        try {
            setProductsLoading(true);
            const response = await promotionService.getPromotionProducts(parseInt(id), {
                page,
                limit: 12
            });

            setProducts(response.products);
            setTotalCount(response.metadata.totalRecords);
            setCurrentPage(response.metadata.page);
        } catch (error) {
            console.error('Error fetching products:', error);
        } finally {
            setProductsLoading(false);
        }
    }, [id]);

    useEffect(() => {
        if (id) {
            fetchProducts(1);
        }
    }, [id, fetchProducts]);

    const handlePageChange = useCallback((page: number) => {
        fetchProducts(page);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [fetchProducts]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Spin size="large" />
            </div>
        );
    }

    if (!promotion) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold mb-4">Không tìm thấy chương trình khuyến mãi</h2>
                    <button
                        onClick={() => navigate('/')}
                        className="text-blue-600 hover:underline"
                    >
                        Về trang chủ
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="bg-white border-b">
                <div className="container mx-auto px-4 py-4">
                    <Breadcrumb
                        separator="/"
                        items={[
                            {
                                title: (
                                    <a href="/" className="flex items-center gap-1 hover:text-red-600">
                                        <span>Trang chủ</span>
                                    </a>
                                ),
                            },
                            {
                                title: <span className="text-gray-600">Khuyến mãi</span>,
                            },
                            {
                                title: <span className="font-medium">{promotion.name}</span>,
                            },
                        ]}
                    />
                </div>
            </div>


            <div className="bg-gradient-to-r from-red-500 to-pink-500 text-white">
                <div className="container mx-auto px-4 py-12">
                    <div className="max-w-4xl mx-auto text-center">

                        <div className="inline-block bg-yellow-400 text-red-600 px-6 py-2 rounded-full font-bold text-2xl mb-4">
                            GIẢM {promotion.discount_percent}%
                        </div>


                        <h1 className="text-4xl md:text-5xl font-bold mb-4">
                            {promotion.name}
                        </h1>


                        {promotion.description && (
                            <p className="text-xl mb-6 text-white/90">
                                {promotion.description}
                            </p>
                        )}


                        <div className="flex items-center justify-center gap-2 mb-6 text-white/90">
                            <Calendar className="w-5 h-5" />
                            <span className="text-lg">
                                {new Date(promotion.start_date).toLocaleDateString('vi-VN')}
                                {' - '}
                                {new Date(promotion.end_date).toLocaleDateString('vi-VN')}
                            </span>
                        </div>


                        <div className="flex justify-center">
                            <div className="bg-white/10 backdrop-blur-sm rounded-lg px-8 py-4">
                                <Countdown
                                    endDate={promotion.end_date}
                                    className="text-white text-xl"
                                />
                            </div>
                        </div>


                        {promotion.product_count !== undefined && (
                            <div className="mt-6 flex items-center justify-center gap-2 text-white/90">
                                <Tag className="w-5 h-5" />
                                <span className="text-lg">
                                    {promotion.product_count} sản phẩm đang khuyến mãi
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            </div>


            <div className="container mx-auto px-4 py-8">
                <div className="mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">Sản phẩm trong chương trình</h2>
                    {totalCount > 0 && (
                        <p className="text-sm text-gray-500 mt-1">
                            Showing {((currentPage - 1) * 12) + 1}-{Math.min(currentPage * 12, totalCount)} of {totalCount} products
                        </p>
                    )}
                </div>

                <ProductList
                    products={products}
                    loading={productsLoading}
                    gridColumns={4}
                />

                {totalCount > 12 && !productsLoading && (
                    <div className="flex justify-center mt-8">
                        <Pagination
                            current={currentPage}
                            total={totalCount}
                            pageSize={12}
                            onChange={handlePageChange}
                            showSizeChanger={false}
                            showTotal={(total, range) =>
                                `${range[0]}-${range[1]} of ${total} products`
                            }
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

export default PromotionDetailPage;