import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import type { Brand } from '../../services/brandService';

interface BrandModalProps {
    brand: Brand | null;
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: { name: string; active: number }) => Promise<void>;
    isEditing: boolean;
}

export default function BrandModal({ brand, isOpen, onClose, onSubmit, isEditing }: BrandModalProps) {
    const [name, setName] = useState('');
    const [active, setActive] = useState(1);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (brand) {
            setName(brand.name);
            setActive(brand.active);
        } else {
            setName('');
            setActive(1);
        }
    }, [brand]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!name.trim()) {
            alert('Vui lòng nhập tên thương hiệu');
            return;
        }

        setSubmitting(true);
        try {
            await onSubmit({ name: name.trim(), active });
            setName('');
            setActive(1);
        } finally {
            setSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
                <div className="flex items-center justify-between p-4 border-b">
                    <h2 className="text-lg font-semibold">
                        {isEditing ? 'Chỉnh sửa thương hiệu' : 'Thêm thương hiệu mới'}
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Tên thương hiệu <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Nhập tên thương hiệu"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái</label>
                        <select
                            value={active}
                            onChange={(e) => setActive(Number(e.target.value))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value={1}>Đang hoạt động</option>
                            <option value={0}>Vô hiệu hóa</option>
                        </select>
                    </div>

                    <div className="flex justify-end gap-2 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                            disabled={submitting}
                        >
                            Hủy
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                            disabled={submitting}
                        >
                            {submitting ? 'Đang lưu...' : (isEditing ? 'Cập nhật' : 'Thêm mới')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}