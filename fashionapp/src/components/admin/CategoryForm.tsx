import { useState, useEffect } from 'react';
import { X, Upload, Image as ImageIcon, Trash2 } from 'lucide-react';
import type { Category } from '../../services/categoryService';
import { getImageUrl } from '../../utils/imageHelper';

interface CategoryFormProps {
    category?: Category | null;
    parentCategories: Category[];
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (formData: FormData) => Promise<void>;
    isEditing?: boolean;
}

export default function CategoryForm({
    category,
    parentCategories,
    isOpen,
    onClose,
    onSubmit,
    isEditing = false
}: CategoryFormProps) {
    const [formData, setFormData] = useState({
        category_name: '',
        description: '',
        parent_id: '',
        slug: ''
    });
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string>('');
    const [currentImageUrl, setCurrentImageUrl] = useState<string>('');
    const [removeImage, setRemoveImage] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (category && isEditing) {
            setFormData({
                category_name: category.category_name || '',
                description: category.description || '',
                parent_id: category.parent_id?.toString() || '',
                slug: category.slug || ''
            });
            setCurrentImageUrl(category.image_url || '');
            setPreviewUrl('');
            setSelectedFile(null);
            setRemoveImage(false);
        } else {
            // Reset form for new category
            setFormData({
                category_name: '',
                description: '',
                parent_id: '',
                slug: ''
            });
            setSelectedFile(null);
            setPreviewUrl('');
            setCurrentImageUrl('');
            setRemoveImage(false);
        }
    }, [category, isEditing, isOpen]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedFile(file);
            setRemoveImage(false);

            // Create preview
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewUrl(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleRemoveImage = () => {
        setSelectedFile(null);
        setPreviewUrl('');
        setRemoveImage(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const submitFormData = new FormData();

            Object.keys(formData).forEach(key => {
                if (formData[key as keyof typeof formData]) {
                    submitFormData.append(key, formData[key as keyof typeof formData]);
                }
            });

            if (selectedFile) {
                submitFormData.append('image', selectedFile);
            }

            if (removeImage) {
                submitFormData.append('remove_image', 'true');
            }

            await onSubmit(submitFormData);
            onClose();
        } catch (error) {
            console.error('Submit error:', error);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between p-6 border-b">
                    <h2 className="text-xl font-semibold">
                        {isEditing ? 'Edit Category' : 'Add New Category'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Left Column */}
                        <div className="space-y-4">
                            {/* Category Name */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Category Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="category_name"
                                    value={formData.category_name}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                />
                            </div>

                            {/* Description */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Description
                                </label>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleInputChange}
                                    rows={3}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Short description about the category..."
                                />
                            </div>

                            {/* Parent Category */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Parent Category
                                </label>
                                <select
                                    name="parent_id"
                                    value={formData.parent_id}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">None (Root Category)</option>
                                    {parentCategories.map(cat => (
                                        <option key={cat.category_id} value={cat.category_id}>
                                            {cat.category_name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Slug */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Slug (URL-friendly)
                                </label>
                                <input
                                    type="text"
                                    name="slug"
                                    value={formData.slug}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Leave empty to auto-generate from name"
                                />
                            </div>
                        </div>

                        {/* Right Column - Image Upload */}
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Category Image
                                </label>

                                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                                    {previewUrl ? (
                                        // New image preview
                                        <div className="relative">
                                            <img
                                                src={previewUrl}
                                                alt="Preview"
                                                className="w-full h-48 object-cover rounded-lg"
                                            />
                                            <button
                                                type="button"
                                                onClick={handleRemoveImage}
                                                className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ) : currentImageUrl && !removeImage ? (
                                        // Current image
                                        <div className="relative">
                                            <img
                                                src={getImageUrl(currentImageUrl)}
                                                alt="Current category"
                                                className="w-full h-48 object-cover rounded-lg"
                                            />
                                            <button
                                                type="button"
                                                onClick={handleRemoveImage}
                                                className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ) : (
                                        // Upload placeholder
                                        <div className="text-center">
                                            <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
                                            <div className="mt-2">
                                                <label htmlFor="image-upload" className="cursor-pointer">
                                                    <span className="mt-2 block text-sm font-medium text-gray-900">
                                                        Click to upload or drag and drop
                                                    </span>
                                                    <span className="mt-1 block text-xs text-gray-500">
                                                        PNG, JPG, GIF up to 10MB
                                                    </span>
                                                </label>
                                                <input
                                                    id="image-upload"
                                                    name="image"
                                                    type="file"
                                                    className="sr-only"
                                                    accept="image/*"
                                                    onChange={handleFileSelect}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {!previewUrl && !currentImageUrl && (
                                    <div className="mt-2">
                                        <label
                                            htmlFor="image-upload"
                                            className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer"
                                        >
                                            <Upload className="w-4 h-4 mr-2" />
                                            Select Image
                                        </label>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Form Actions */}
                    <div className="flex justify-end gap-3 mt-6 pt-6 border-t">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                        >
                            {loading ? 'Processing...' : (isEditing ? 'Update' : 'Add')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}