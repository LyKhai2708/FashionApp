import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Row, Col, Statistic } from 'antd';
import { AppstoreOutlined, CheckCircleOutlined, WarningOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { getImageUrl } from '../../utils/imageHelper';
import { productService } from '../../services/productService';
import type { Product } from '../../types/product';
import { useMessage } from '../../App';
import brandService from '../../services/brandService';
import categoryService, { type Category } from '../../services/categoryService';
import { Edit, Eye, Plus, PackageOpen, Search } from 'lucide-react';
import { PermissionGate } from '../../components/PermissionGate';

interface Paginate {
    totalRecords: number;
    firstPage: number;
    lastPage: number;
    page: number;
    limit: number;
}

export default function Products() {
    const navigate = useNavigate();
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
            message.error(error.message || 'Cannot load products');
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
        if (!window.confirm('Are you sure you want to discontinue this product?')) {
            return;
        }

        try {
            await productService.deleteProduct(productId);
            message.success('Product deactivated successfully');
            await fetchProducts();
            await fetchStats();
        } catch (error: any) {
            message.error(error.message || 'Cannot deactivate product');
        }
    };

    const handleRestore = async (productId: number) => {
        if (!window.confirm('Are you sure you want to restore this product for sale?')) {
            return;
        }

        try {
            await productService.restoreProduct(productId);
            message.success('Product restored successfully');
            await fetchProducts();
            await fetchStats();
        } catch (error: any) {
            message.error(error.message || 'Cannot restore product');
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
            <div className="mb-8">
                <div className="flex justify-between items-center mb-2">
                    <h1 className="text-3xl font-bold text-gray-900">Product Management</h1>
                    <PermissionGate permission="products.create">
                        <button
                            onClick={() => navigate('/admin/products/add')}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 font-medium shadow-sm transition-colors"
                        >
                            <Plus size={20} />
                            Add Product
                        </button>
                    </PermissionGate>
                </div>
                <p className="text-gray-600">Manage all products in the system</p>
            </div>

            <Row gutter={16} style={{ marginBottom: 24 }}>
                <Col span={6}>
                    <Card>
                        <Statistic
                            title="Total Products"
                            value={stats.total}
                            valueStyle={{ color: '#1890ff' }}
                            prefix={<AppstoreOutlined />}
                        />
                    </Card>
                </Col>
                <Col span={6}>
                    <Card>
                        <Statistic
                            title="Active"
                            value={stats.active}
                            valueStyle={{ color: '#52c41a' }}
                            prefix={<CheckCircleOutlined />}
                        />
                    </Card>
                </Col>
                <Col span={6}>
                    <Card>
                        <Statistic
                            title="Low Stock"
                            value={stats.lowStock}
                            valueStyle={{ color: '#faad14' }}
                            prefix={<WarningOutlined />}
                        />
                    </Card>
                </Col>
                <Col span={6}>
                    <Card>
                        <Statistic
                            title="Out of Stock"
                            value={stats.outOfStock}
                            valueStyle={{ color: '#cf1322' }}
                            prefix={<CloseCircleOutlined />}
                        />
                    </Card>
                </Col>
            </Row>

            {/* Filters */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-4">
                    {/* Search */}
                    <form onSubmit={handleSearch} className="lg:col-span-2">
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Search products..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Search className="w-4 h-4 text-gray-400" />
                            </div>
                            <button
                                type="submit"
                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-blue-600 hover:text-blue-800"
                            >
                                Search
                            </button>
                        </div>
                    </form>

                    <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                        className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                    >
                        <option value="all">All Categories</option>
                        {categories.map(cat => (
                            <option key={cat.category_id} value={cat.category_id}>
                                {cat.parent_id ? `  ↳ ${cat.category_name}` : cat.category_name}
                            </option>
                        ))}
                    </select>

                    <select
                        value={selectedBrand}
                        onChange={(e) => setSelectedBrand(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                        className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                    >
                        <option value="all">All Brands</option>
                        {brands.map(brand => (
                            <option key={brand.id} value={brand.id}>
                                {brand.name}
                            </option>
                        ))}
                    </select>

                    <select
                        value={stockFilter}
                        onChange={(e) => setStockFilter(e.target.value as any)}
                        className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                    >
                        <option value="all">Stock</option>
                        <option value="out">Out of Stock</option>
                        <option value="low">Low Stock</option>
                        <option value="medium">Medium</option>
                    </select>


                    <select
                        value={delFlag}
                        onChange={(e) => setDelFlag(e.target.value as '0' | '1' | 'all')}
                        className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                    >
                        <option value="0">Active</option>
                        <option value="1">Discontinued</option>
                        <option value="all">All</option>
                    </select>
                </div>
            </div>


            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                {loading ? (
                    <div className="flex justify-center items-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    </div>
                ) : products.length === 0 ? (
                    <div className="text-center py-20 text-gray-500">
                        <PackageOpen className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                        <p className="text-xl font-medium mb-2">No products found</p>
                        <p className="text-gray-400">Try changing filters or search term</p>
                    </div>
                ) : (
                    <>
                        {/* Table Header */}
                        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold text-gray-900">
                                    Product List ({products.length})
                                </h3>
                                <div className="flex items-center gap-2 text-sm text-gray-500">
                                    <span>Showing {(paginate.page - 1) * paginate.limit + 1}-{Math.min(paginate.page * paginate.limit, paginate.totalRecords)} of {paginate.totalRecords}</span>
                                </div>
                            </div>
                        </div>

                        {/* Table */}
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Product
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Category
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Price
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Stock
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Status
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Actions
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
                                                            src={getImageUrl(product.thumbnail)}
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
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${(product.total_stock || 0) === 0
                                                        ? 'bg-red-100 text-red-800'
                                                        : (product.total_stock || 0) < 30
                                                            ? 'bg-yellow-100 text-yellow-800'
                                                            : 'bg-green-100 text-green-800'
                                                        }`}>
                                                        {product.total_stock || 0} items
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${product.del_flag === 0
                                                    ? 'bg-green-100 text-green-800'
                                                    : 'bg-red-100 text-red-800'
                                                    }`}>
                                                    {product.del_flag === 0 ? 'Active' : 'Discontinued'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => navigate(`/products/${product.slug}-${product.product_id}`)}
                                                        className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-2"
                                                    >
                                                        <Eye className='w-4 h-4' />View
                                                    </button>
                                                    <PermissionGate
                                                        permission="products.edit"
                                                        showTooltip={true}
                                                        tooltipMessage="You don't have permission to edit products"
                                                        fallback={
                                                            <button
                                                                disabled
                                                                className="text-gray-400 text-sm font-medium flex items-center gap-2 cursor-not-allowed opacity-50"
                                                            >
                                                                <Edit className='w-4 h-4' />Edit
                                                            </button>
                                                        }
                                                    >
                                                        <button
                                                            onClick={() => navigate(`/admin/products/edit/${product.product_id}`)}
                                                            className="text-indigo-600 hover:text-indigo-800 text-sm font-medium flex items-center gap-2"
                                                        >
                                                            <Edit className='w-4 h-4' />Edit
                                                        </button>
                                                    </PermissionGate>
                                                    {product.del_flag === 0 ? (
                                                        <PermissionGate permission="products.delete">
                                                            <button
                                                                onClick={() => handleDelete(product.product_id)}
                                                                className="text-red-600 hover:text-red-800 text-sm font-medium"
                                                            >
                                                                Inactive
                                                            </button>
                                                        </PermissionGate>
                                                    ) : (
                                                        <PermissionGate permission="products.edit">
                                                            <button
                                                                onClick={() => handleRestore(product.product_id)}
                                                                className="text-green-600 hover:text-green-800 text-sm font-medium"
                                                            >
                                                                Restore
                                                            </button>
                                                        </PermissionGate>
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
                                    Showing <span className="font-medium">{(paginate.page - 1) * paginate.limit + 1}</span> to{' '}
                                    <span className="font-medium">{Math.min(paginate.page * paginate.limit, paginate.totalRecords)}</span> of{' '}
                                    <span className="font-medium">{paginate.totalRecords}</span> products
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setPaginate(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                                        disabled={paginate.page === 1}
                                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        ← Previous
                                    </button>
                                    <span className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg">
                                        {paginate.page} / {paginate.lastPage}
                                    </span>
                                    <button
                                        onClick={() => setPaginate(prev => ({ ...prev, page: Math.min(prev.lastPage, prev.page + 1) }))}
                                        disabled={paginate.page === paginate.lastPage}
                                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Next →
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