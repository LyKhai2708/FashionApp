import { useState, useEffect } from 'react';
import { productService } from '../../services/productService';
import type { Product } from '../../types/product';
import { useMessage } from '../../App';
import brandService from '../../services/brandService';
import categoryService, { type Category } from '../../services/categoryService';
import { Edit, Eye, Trash } from 'lucide-react';

interface Paginate {
    totalRecords: number;
    firstPage: number;
    lastPage: number;
    page: number;
    limit: number;
}

export default function Products() {
    const message = useMessage();
    const [products, setProducts] = useState<Product[]>([]);
    const [paginate, setPaginate] = useState<Paginate>({
        totalRecords: 0,
        firstPage: 1,
        lastPage: 1,
        page: 1,
        limit: 10,
    });

    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [delFlag, setDelFlag] = useState<'0' | '1' | 'all'>('0');
    const [stockFilter, setStockFilter] = useState<'all' | 'low' | 'medium' | 'out'>('all');
    const [selectedCategory, setSelectedCategory] = useState<number | 'all'>('all');
    const [selectedBrand, setSelectedBrand] = useState<number | 'all'>('all');
    const [categories, setCategories] = useState<Category[]>([]);
    const [brands, setBrands] = useState<Array<{ id: number; name: string }>>([]);

    const [stats, setStats] = useState({
        total: 0,
        active: 0,
        lowStock: 0,
        outOfStock: 0
    });

    const fetchStats = async () => {
        try {
            const allProductsResponse = await productService.getProducts({ limit: 1000 }); // Lấy tất cả
            const allProducts = allProductsResponse.products;
            
            setStats({
                total: allProducts.length,
                active: allProducts.filter(p => p.del_flag === 0).length, 
                lowStock: allProducts.filter(p => (p.total_stock || 0) < 30 && (p.total_stock || 0) > 0).length,
                outOfStock: allProducts.filter(p => (p.total_stock || 0) === 0).length
            });
        } catch (error) {
            console.error('Error fetching stats:', error);
        }
    };

    const fetchProducts = async () => {
        try {
            setLoading(true);
            const params: any = {
                page: paginate.page,
                limit: paginate.limit,
            };

            if (searchTerm) {
                params.search = searchTerm;
            }

            if (delFlag === '0') {
                params.del_flag = '0';
            } else if (delFlag === '1') {
                params.del_flag = '1';
            }

            if (selectedCategory !== 'all') {
                params.category_id = selectedCategory;
            }

            if (selectedBrand !== 'all') {
                params.brand_id = selectedBrand;
            }

            const response = await productService.getProducts(params);

            let filteredProducts = response.products;
            if (stockFilter !== 'all') {
                filteredProducts = filteredProducts.filter(product => {
                    const stock = product.total_stock || 0;
                    switch (stockFilter) {
                        case 'out': return stock === 0;
                        case 'low': return stock > 0 && stock < 30;
                        case 'medium': return stock >= 30 && stock < 100;
                        default: return true;
                    }
                });
            }

            setProducts(filteredProducts);
            setPaginate(response.metadata);

        } catch (error: any) {
            console.error('Error fetching products:', error);
            message.error(error.message || 'Không thể tải danh sách sản phẩm');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const loadFilters = async () => {
            try {
                const categoriesRes = await categoryService.getCategories();
                const sortedCategories = categoriesRes.sort((a, b) => {
                    if (!a.parent_id && b.parent_id) return -1;
                    if (a.parent_id && !b.parent_id) return 1;
                    if (a.parent_id === b.parent_id) return 0;
                    return (a.parent_id || 0) - (b.parent_id || 0);
                });
                setCategories(sortedCategories || []);

                const brandsRes = await brandService.getBrands();
                setBrands(brandsRes || []);
            } catch (error) {
                console.error('Error loading filters:', error);
            }
        };
        loadFilters();
        fetchStats();
    }, []);

    useEffect(() => {
        fetchProducts();
    }, [paginate.page, delFlag, stockFilter, selectedCategory, selectedBrand]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setPaginate(prev => ({ ...prev, page: 1 }));
        fetchProducts();
    };

    const handleDelete = async (productId: number) => {
        if (!window.confirm('Xác nhận xóa sản phẩm này?')) {
            return;
        }

        try {
            await productService.deleteProduct(productId);
            message.success('Xóa sản phẩm thành công');
            await fetchProducts();
            await fetchStats();
        } catch (error: any) {
            message.error(error.message || 'Không thể xóa sản phẩm');
        }
    };

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(price);
    };


    return (
        <div className="min-h-screen bg-gray-50 p-6">
            {/* Header */}
            <div className="mb-8">
                <div className="flex justify-between items-center mb-2">
                    <h1 className="text-3xl font-bold text-gray-900">Quản lý sản phẩm</h1>
                    <div className="flex gap-3">
                        <button className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center gap-2">
                            📤 Export
                        </button>
                        <button className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center gap-2">
                            📥 Load file
                        </button>
                        <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
                            ➕ Thêm
                        </button>
                    </div>
                </div>
                <p className="text-gray-600">Quản lý tất cả sản phẩm trong hệ thống</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-blue-100 text-sm">Tổng sản phẩm</p>
                            <p className="text-3xl font-bold">{stats.total}</p>
                        </div>
                        <div className="bg-white/20 rounded-full p-3">
                            📦
                        </div>
                    </div>
                </div>

                <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-green-100 text-sm">Đang bán</p>
                            <p className="text-3xl font-bold">{stats.active}</p>
                        </div>
                        <div className="bg-white/20 rounded-full p-3">
                            ✅
                        </div>
                    </div>
                </div>

                <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-xl p-6 text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-yellow-100 text-sm">Sắp hết hàng</p>
                            <p className="text-3xl font-bold">{stats.lowStock}</p>
                        </div>
                        <div className="bg-white/20 rounded-full p-3">
                            ⚠️
                        </div>
                    </div>
                </div>

                <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-xl p-6 text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-red-100 text-sm">Hết hàng</p>
                            <p className="text-3xl font-bold">{stats.outOfStock}</p>
                        </div>
                        <div className="bg-white/20 rounded-full p-3">
                            🚫
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-4">
                    {/* Search */}
                    <form onSubmit={handleSearch} className="lg:col-span-2">
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Tìm kiếm sản phẩm..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                🔍
                            </div>
                            <button
                                type="submit"
                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-blue-600 hover:text-blue-800"
                            >
                                Tìm
                            </button>
                        </div>
                    </form>

                    {/* Category */}
                    <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                        className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                    >
                        <option value="all">Tất cả danh mục</option>
                        {categories.map(cat => (
                            <option key={cat.category_id} value={cat.category_id}>
                                {cat.parent_id ? `  ↳ ${cat.category_name}` : cat.category_name}
                            </option>
                        ))}
                    </select>

                    {/* Brand */}
                    <select
                        value={selectedBrand}
                        onChange={(e) => setSelectedBrand(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                        className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                    >
                        <option value="all">Tất cả thương hiệu</option>
                        {brands.map(brand => (
                            <option key={brand.id} value={brand.id}>
                                {brand.name}
                            </option>
                        ))}
                    </select>

                    {/* Stock */}
                    <select
                        value={stockFilter}
                        onChange={(e) => setStockFilter(e.target.value as any)}
                        className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                    >
                        <option value="all">Tồn kho</option>
                        <option value="out">Hết hàng</option>
                        <option value="low">Sắp hết</option>
                        <option value="medium">Trung bình</option>
                    </select>

                    {/* Status */}
                    <select
                        value={delFlag}
                        onChange={(e) => setDelFlag(e.target.value as '0' | '1' | 'all')}
                        className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                    >
                        <option value="0">Đang bán</option>
                        <option value="1">Ngưng bán</option>
                        <option value="all">Tất cả</option>
                    </select>
                </div>
            </div>

            {/* Products Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                {loading ? (
                    <div className="flex justify-center items-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    </div>
                ) : products.length === 0 ? (
                    <div className="text-center py-20 text-gray-500">
                        <div className="text-6xl mb-4">📦</div>
                        <p className="text-xl font-medium mb-2">Không tìm thấy sản phẩm nào</p>
                        <p className="text-gray-400">Thử thay đổi bộ lọc hoặc tìm kiếm khác</p>
                    </div>
                ) : (
                    <>
                        {/* Table Header */}
                        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold text-gray-900">
                                    Danh sách sản phẩm ({products.length})
                                </h3>
                                <div className="flex items-center gap-2 text-sm text-gray-500">
                                    <span>Hiển thị {(paginate.page - 1) * paginate.limit + 1}-{Math.min(paginate.page * paginate.limit, paginate.totalRecords)} trong {paginate.totalRecords}</span>
                                </div>
                            </div>
                        </div>

                        {/* Table */}
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Sản phẩm
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Danh mục
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Giá bán
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Tồn kho
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Trạng thái
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Thao tác
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {products.map((product) => (
                                        <tr key={product.product_id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center">
                                                    <div className="h-16 w-16 rounded-lg bg-gray-200 flex-shrink-0 overflow-hidden mr-4">
                                                        <img
                                                            src={product.thumbnail || '/placeholder.png'}
                                                            alt={product.name}
                                                            className="h-full w-full object-cover"
                                                            onError={(e) => {
                                                                e.currentTarget.src = '/placeholder.png';
                                                            }}
                                                        />
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-medium text-gray-900 mb-1">
                                                            {product.name}
                                                        </div>
                                                        <div className="text-xs text-gray-500">
                                                            ID: {product.product_id} • {product.brand_name}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                    {product.category_name || '-'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm font-semibold text-gray-900">
                                                    {formatPrice(product.base_price)}
                                                </div>
                                                {product.discount_percent && (
                                                    <div className="text-xs text-red-600 font-medium">
                                                        -{product.discount_percent}% OFF
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                        (product.total_stock || 0) === 0
                                                            ? 'bg-red-100 text-red-800'
                                                            : (product.total_stock || 0) < 30
                                                            ? 'bg-yellow-100 text-yellow-800'
                                                            : 'bg-green-100 text-green-800'
                                                    }`}>
                                                        {product.total_stock || 0} sản phẩm
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                    product.del_flag === 0
                                                        ? 'bg-green-100 text-green-800'
                                                        : 'bg-red-100 text-red-800'
                                                }`}>
                                                    {product.del_flag === 0 ? ' Đang bán' : 'Ngưng bán'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <button className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-2">
                                                        <Eye className='w-4 h-4'/>Xem
                                                    </button>
                                                    <button className="text-indigo-600 hover:text-indigo-800 text-sm font-medium flex items-center gap-2">
                                                        <Edit className='w-4 h-4'/>Sửa
                                                    </button>
                                                    {product.del_flag === 0 && (
                                                        <button
                                                            onClick={() => handleDelete(product.product_id)}
                                                            className="text-red-600 hover:text-red-800 text-xs font-medium"
                                                        >
                                                            Ngưng bán
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
                            <div className="flex items-center justify-between">
                                <div className="text-sm text-gray-700">
                                    Hiển thị <span className="font-medium">{(paginate.page - 1) * paginate.limit + 1}</span> đến{' '}
                                    <span className="font-medium">{Math.min(paginate.page * paginate.limit, paginate.totalRecords)}</span> trong{' '}
                                    <span className="font-medium">{paginate.totalRecords}</span> sản phẩm
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setPaginate(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                                        disabled={paginate.page === 1}
                                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        ← Trước
                                    </button>
                                    <span className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg">
                                        {paginate.page} / {paginate.lastPage}
                                    </span>
                                    <button
                                        onClick={() => setPaginate(prev => ({ ...prev, page: Math.min(prev.lastPage, prev.page + 1) }))}
                                        disabled={paginate.page === paginate.lastPage}
                                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Sau →
                                    </button>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}