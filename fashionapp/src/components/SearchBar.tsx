import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { SearchIcon, XIcon, CameraIcon } from 'lucide-react';
import ProductCard from './ProductCard';
import { productService } from '../services/productService';
import type { Product } from '../types/product';

export default function SearchBar() {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<Product[]>([]);
    const [trendingKeywords, setTrendingKeywords] = useState<string[]>([]);
    const [recentProducts, setRecentProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const navigate = useNavigate();
    const overlayRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setTrendingKeywords([
            'Áo thun', 'Quần Shorts', 'Áo Polo', 'Áo khoác chống nắng', 'Găng tay chống nắng', 'Quần dài'
        ]); //hard code tạm 

        const storedRecent = JSON.parse(localStorage.getItem('recentViewed') || '[]');
        setRecentProducts(storedRecent); //chưa làm xong
    }, []);

    useEffect(() => {
        if (!query.trim()) {
            setResults([]);
            return;
        }

        const debounceTimer = setTimeout(async () => {
            setLoading(true);
            try {
                const data = await productService.searchProduct(query, 4);
                setResults(data);
            } catch (error) {
                console.error('Search error:', error);
                setResults([]);
            } finally {
                setLoading(false);
            }
        }, 300);

        return () => clearTimeout(debounceTimer);
    }, [query]);

    const handleImageSearch = () => {
        alert('...');
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (overlayRef.current && !overlayRef.current.contains(event.target as Node) &&
                inputRef.current && !inputRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                setQuery('');
            }
        };
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    const handleFocus = () => {
        setIsOpen(true);
        setTimeout(() => inputRef.current?.focus(), 0); 
    };

    const handleClose = () => {
        setIsOpen(false);
        setQuery('');
    };

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden'; //khoa cuon
        } else {
            document.body.style.overflow = ''; 
        }
        return () => {
            document.body.style.overflow = ''; 
        };
    }, [isOpen]);

    const handleKeywordClick = (keyword: string) => {
        setQuery(keyword);
    };

    const handleViewAll = () => {
        if (query.trim()) {
            navigate(`/search?q=${encodeURIComponent(query)}`);
            setIsOpen(false);
            setQuery('');
        }
    };

    return (
        <div className="relative">
            <div className="flex items-center border border-gray-300 rounded-full overflow-hidden bg-white max-w-xs">
                <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={handleFocus} 
                    placeholder="Tìm kiếm..."
                    className="flex-grow px-4 py-2 outline-none text-sm"
                />
                <button className="px-3 py-2 text-gray-500">
                    <SearchIcon size={18} />
                </button>
            </div>

            {isOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
                    <div ref={overlayRef} className="bg-white w-full max-w-4xl h-[90vh] p-6 rounded-lg shadow-lg relative overflow-y-auto">
                        <button onClick={handleClose} className="absolute top-2 right-2 text-gray-500 hover:text-black">
                            <XIcon size={24} />
                        </button>

                        <div className="flex items-center justify-between mb-6">
                            <div className="flex-grow">
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    placeholder="Tìm kiếm..."
                                    className="flex-grow px-4 py-2 outline-none text-base w-full border-b border-gray-200"
                                />
                            </div>
                            <button
                                onClick={handleImageSearch}
                                className="ml-4 p-2 bg-gray-100 text-gray-800 rounded-full hover:bg-gray-200 transition-colors"
                            >
                                <CameraIcon size={20} />
                            </button>
                        </div>
                        {query.trim() ? ( 
                            loading ? (
                                <div className="text-center text-gray-500 text-lg">Đang tìm kiếm...</div>
                            ) : results.length > 0 ? (
                                <>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        {results.map((product) => (
                                            <ProductCard key={product.product_id} product={product} compact />
                                        ))}
                                    </div>
                                    <div className="mt-6 text-center">
                                        <button
                                            onClick={handleViewAll}
                                            className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 text-base"
                                        >
                                            XEM TẤT CẢ
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <div className="text-center text-gray-500 text-lg">Không tìm thấy sản phẩm</div>
                            )
                        ) : ( 
                            <>
                                <h4 className="text-lg font-semibold mb-4">Từ khóa nổi bật ngày hôm nay</h4>
                                <div className="flex flex-wrap gap-2 mb-6">
                                    {trendingKeywords.map((keyword) => (
                                        <button
                                            key={keyword}
                                            onClick={() => handleKeywordClick(keyword)}
                                            className="bg-gray-100 text-gray-800 px-4 py-2 rounded-full text-sm hover:bg-gray-200 transition-colors"
                                        >
                                            {keyword}
                                        </button>
                                    ))}
                                </div>

                                <h4 className="text-lg font-semibold mb-4">Sản phẩm xem gần đây</h4>
                                {recentProducts.length > 0 ? (
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                                        {recentProducts.map((product) => (
                                            <ProductCard key={product.product_id} product={product} compact />
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center text-gray-500 text-base">Không có sản phẩm nào xem gần đây</div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}