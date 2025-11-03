import { useState, useEffect } from 'react';
import { useMessage } from '../../App';
import categoryService, { type Category } from '../../services/categoryService';
import { Edit, Plus, Trash2, ChevronDown, ChevronRight, Check, Folder, CheckCircle } from 'lucide-react';
import CategoryForm from '../../components/admin/CategoryForm';
import { getImageUrl } from '../../utils/imageHelper';

export default function Categories() {
    const message = useMessage();
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedCategories, setExpandedCategories] = useState<Set<number>>(new Set());

    // Form modal states
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);

    // Stats
    const [stats, setStats] = useState({
        total: 0,
        active: 0
    });

    const fetchCategories = async () => {
        try {
            const response = await categoryService.getAllCategoriesIncludeInactive();
            setCategories(response || []);
            
            const parentIds = (response || [])
                .filter(cat => !cat.parent_id)
                .map(cat => cat.category_id);
            setExpandedCategories(new Set(parentIds));
        } catch (error: any) {
            message.error('Không thể tải danh sách danh mục');
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const allCategories = await categoryService.getAllCategoriesIncludeInactive();
            setStats({
                total: allCategories.length,
                active: allCategories.filter(cat => cat.active === 1).length
            });
        } catch (error) {
            console.error('Error fetching stats:', error);
        }
    };

    useEffect(() => {
        fetchCategories();
        fetchStats();
    }, []);

    const handleToggleStatus = async (categoryId: number, currentStatus: number) => {
        const action = currentStatus === 1 ? 'vô hiệu hóa' : 'kích hoạt';
        if (!window.confirm(`Xác nhận ${action} danh mục này?`)) return;
        
        try {
            await categoryService.toggleCategoryStatus(categoryId);
            message.success(`${action === 'vô hiệu hóa' ? 'Vô hiệu hóa' : 'Kích hoạt'} thành công`);
            fetchCategories();
            fetchStats();
        } catch (error: any) {
            message.error(`Không thể ${action}`);
        }
    };

    const toggleExpand = (categoryId: number) => {
        const newExpanded = new Set(expandedCategories);
        if (newExpanded.has(categoryId)) {
            newExpanded.delete(categoryId);
        } else {
            newExpanded.add(categoryId);
        }
        setExpandedCategories(newExpanded);
    };

    const handleOpenAddForm = () => {
        setEditingCategory(null);
        setIsFormOpen(true);
    };

    const handleOpenEditForm = (category: Category) => {
        setEditingCategory(category);
        setIsFormOpen(true);
    };

    const handleCloseForm = () => {
        setIsFormOpen(false);
        setEditingCategory(null);
    };

    const handleSubmitForm = async (formData: FormData) => {
        try {
            if (editingCategory) {
                await categoryService.updateCategory(editingCategory.category_id, formData);
                message.success('Cập nhật danh mục thành công');
            } else {
                await categoryService.createCategory(formData);
                message.success('Thêm danh mục thành công');
            }

            await fetchCategories();
            await fetchStats();
        } catch (error: any) {
            message.error(error.message || 'Không thể thực hiện thao tác');
        }
    };

    const parentCategories = categories.filter(cat => !cat.parent_id);
    const getChildCategories = (parentId: number) => 
        categories.filter(cat => cat.parent_id === parentId);

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Quản lý danh mục</h1>
                <button
                    onClick={handleOpenAddForm}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                >
                    <Plus className="w-4 h-4" />
                    Thêm danh mục
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="bg-white rounded-lg shadow p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-600 text-sm">Tổng danh mục</p>
                            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                        </div>
                        <div className="text-3xl"><Folder></Folder></div>
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

            {/* Categories Tree */}
            <div className="bg-white rounded-lg shadow">
                <div className="p-4 border-b">
                    <h3 className="font-semibold">Cây danh mục</h3>
                </div>

                {loading ? (
                    <div className="text-center py-8">Đang tải...</div>
                ) : (
                    <div className="p-4">
                        {parentCategories.map((parent) => {
                            const children = getChildCategories(parent.category_id);
                            const isExpanded = expandedCategories.has(parent.category_id);

                            return (
                                <div key={parent.category_id} className="mb-2">
                                    {/* Parent Category */}
                                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100">
                                        <div className="flex items-center gap-2">
                                            {children.length > 0 && (
                                                <button
                                                    onClick={() => toggleExpand(parent.category_id)}
                                                    className="text-gray-500 hover:text-gray-700"
                                                >
                                                    {isExpanded ? (
                                                        <ChevronDown className="w-4 h-4" />
                                                    ) : (
                                                        <ChevronRight className="w-4 h-4" />
                                                    )}
                                                </button>
                                            )}
                                            {parent.image_url ? (
                                                <img 
                                                    src={getImageUrl(parent.image_url)} 
                                                    alt={parent.category_name}
                                                    className="w-8 h-8 rounded-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                                                    {parent.category_name.charAt(0).toUpperCase()}
                                                </div>
                                            )}
                                            <div>
                                                <div className={`font-medium text-gray-900 ${parent.active === 0 ? 'opacity-50 line-through' : ''}`}>
                                                 {parent.category_name} {parent.active === 0 && '(Vô hiệu hóa)'}
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    {children.length} danh mục con
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => handleOpenEditForm(parent)}
                                                className="text-blue-600 hover:text-blue-800 p-1"
                                            >
                                                <Edit className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleToggleStatus(parent.category_id, parent.active)}
                                                className={`p-1 ${parent.active === 1 ? 'text-red-600 hover:text-red-800' : 'text-green-600 hover:text-green-800'}`}
                                            >
                                                {parent.active === 1 ? <Trash2 className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Child Categories */}
                                    {isExpanded && children.length > 0 && (
                                        <div className="ml-6 mt-2 space-y-1">
                                            {children.map((child) => (
                                                <div
                                                    key={child.category_id}
                                                    className="flex items-center justify-between p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-1 h-6 bg-gray-300 rounded-full"></div>
                                                        {child.image_url ? (
                                                            <img 
                                                                src={getImageUrl(child.image_url)} 
                                                                alt={child.category_name}
                                                                className="w-6 h-6 rounded-full object-cover"
                                                            />
                                                        ) : (
                                                            <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white font-bold text-xs">
                                                                {child.category_name.charAt(0).toUpperCase()}
                                                            </div>
                                                        )}
                                                        <div>
                                                            <div className={`font-medium text-gray-900 text-sm ${child.active === 0 ? 'opacity-50 line-through' : ''}`}>
                                                                 {child.category_name} {child.active === 0 && '(Vô hiệu hóa)'}
                                                            </div>
                                                            <div className="text-xs text-gray-500">
                                                                ID: {child.category_id}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="flex items-center gap-1">
                                                        <button
                                                            onClick={() => handleOpenEditForm(child)}
                                                            className="text-blue-600 hover:text-blue-800 p-1"
                                                        >
                                                            <Edit className="w-3 h-3" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleToggleStatus(child.category_id, child.active)}
                                                            className={`p-1 ${child.active === 1 ? 'text-red-600 hover:text-red-800' : 'text-green-600 hover:text-green-800'}`}
                                                        >
                                                            {child.active === 1 ? <Trash2 className="w-3 h-3" /> : <Check className="w-3 h-3" />}
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        })}

                        
                        {categories.filter(cat => cat.parent_id && !categories.find(p => p.category_id === cat.parent_id)).map((orphan) => (
                            <div key={orphan.category_id} className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg mb-2">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        {orphan.image_url ? (
                                            <img 
                                                src={getImageUrl(orphan.image_url)} 
                                                alt={orphan.category_name}
                                                className="w-6 h-6 rounded-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center text-white font-bold text-xs">
                                                {orphan.category_name.charAt(0).toUpperCase()}
                                            </div>
                                        )}
                                        <div>
                                            <div className="font-medium text-gray-900 text-sm">
                                                {orphan.category_name}
                                            </div>
                                            <div className="text-xs text-yellow-600">
                                                Danh mục mồ côi (parent không tồn tại)
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center gap-1">
                                        <button className="text-blue-600 hover:text-blue-800 p-1">
                                            <Edit className="w-3 h-3" />
                                        </button>
                                        <button
                                            onClick={() => handleToggleStatus(orphan.category_id, orphan.active)}
                                            className={`p-1 ${orphan.active === 1 ? 'text-red-600 hover:text-red-800' : 'text-green-600 hover:text-green-800'}`}
                                        >
                                            {orphan.active === 1 ? <Trash2 className="w-3 h-3" /> : <Check className="w-3 h-3" />}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <CategoryForm
                category={editingCategory}
                parentCategories={parentCategories}
                isOpen={isFormOpen}
                onClose={handleCloseForm}
                onSubmit={handleSubmitForm}
                isEditing={!!editingCategory}
            />
        </div>
    );
}