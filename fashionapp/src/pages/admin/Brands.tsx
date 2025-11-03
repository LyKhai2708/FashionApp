import { useState, useEffect } from 'react';
import { useMessage } from '../../App';
import brandService, { type Brand } from '../../services/brandService';
import { Edit, Plus, Trash2, Check, Tag, CheckCircle } from 'lucide-react';
import BrandModal from '../../components/admin/BrandModal';

export default function Brands() {
    const message = useMessage();
    const [brands, setBrands] = useState<Brand[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingBrand, setEditingBrand] = useState<Brand | null>(null);

    const [stats, setStats] = useState({
        total: 0,
        active: 0
    });

    const fetchBrands = async () => {
        try {
            const response = await brandService.getAllBrandsIncludeInactive();
            setBrands(response || []);
        } catch (error: any) {
            message.error('Không thể tải danh sách thương hiệu');
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const allBrands = await brandService.getAllBrandsIncludeInactive();
            setStats({
                total: allBrands.length,
                active: allBrands.filter(brand => brand.active === 1).length
            });
        } catch (error) {
            console.error('Error fetching stats:', error);
        }
    };

    useEffect(() => {
        fetchBrands();
        fetchStats();
    }, []);

    const handleToggleStatus = async (brandId: number, currentStatus: number) => {
        const action = currentStatus === 1 ? 'vô hiệu hóa' : 'kích hoạt';
        if (!window.confirm(`Xác nhận ${action} thương hiệu này?`)) return;
        
        try {
            await brandService.toggleBrandStatus(brandId);
            message.success(`${action === 'vô hiệu hóa' ? 'Vô hiệu hóa' : 'Kích hoạt'} thành công`);
            fetchBrands();
            fetchStats();
        } catch (error: any) {
            message.error(`Không thể ${action}`);
        }
    };

    const handleOpenAddModal = () => {
        setEditingBrand(null);
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (brand: Brand) => {
        setEditingBrand(brand);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingBrand(null);
    };

    const handleSubmit = async (data: { name: string; active: number }) => {
        try {
            if (editingBrand) {
                await brandService.updateBrand(editingBrand.id, data);
                message.success('Cập nhật thương hiệu thành công');
            } else {
                await brandService.createBrand(data);
                message.success('Thêm thương hiệu thành công');
            }

            await fetchBrands();
            await fetchStats();
            handleCloseModal();
        } catch (error: any) {
            message.error(error.message || 'Không thể thực hiện thao tác');
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Quản lý thương hiệu</h1>
                <button
                    onClick={handleOpenAddModal}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                >
                    <Plus className="w-4 h-4" />
                    Thêm thương hiệu
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="bg-white rounded-lg shadow p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-600 text-sm">Tổng thương hiệu</p>
                            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                        </div>
                        <Tag className="w-8 h-8 text-blue-600" />
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-600 text-sm">Đang hoạt động</p>
                            <p className="text-2xl font-bold text-green-600">{stats.active}</p>
                        </div>
                        <CheckCircle className="w-8 h-8 text-green-600" />
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow">
                <div className="p-4 border-b">
                    <h3 className="font-semibold">Danh sách thương hiệu</h3>
                </div>

                {loading ? (
                    <div className="text-center py-8">Đang tải...</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tên thương hiệu</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng thái</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ngày tạo</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {brands.map((brand) => (
                                    <tr key={brand.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{brand.id}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className={`font-medium text-gray-900 ${brand.active === 0 ? 'opacity-50 line-through' : ''}`}>
                                                {brand.name}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                brand.active === 1 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                            }`}>
                                                {brand.active === 1 ? 'Đang hoạt động' : 'Vô hiệu hóa'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {new Date(brand.created_at).toLocaleDateString('vi-VN')}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => handleOpenEditModal(brand)}
                                                    className="text-blue-600 hover:text-blue-800 p-1"
                                                    title="Chỉnh sửa"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleToggleStatus(brand.id, brand.active)}
                                                    className={`p-1 ${brand.active === 1 ? 'text-red-600 hover:text-red-800' : 'text-green-600 hover:text-green-800'}`}
                                                    title={brand.active === 1 ? 'Vô hiệu hóa' : 'Kích hoạt'}
                                                >
                                                    {brand.active === 1 ? <Trash2 className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {brands.length === 0 && (
                            <div className="text-center py-8 text-gray-500">Chưa có thương hiệu nào</div>
                        )}
                    </div>
                )}
            </div>

            <BrandModal
                brand={editingBrand}
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onSubmit={handleSubmit}
                isEditing={!!editingBrand}
            />
        </div>
    );
}