import { useState } from "react";
import { ChevronDown, Filter } from "lucide-react";
import ProductList from "../components/ProductList";

export default function ProductPage() {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [selectedSort, setSelectedSort] = useState("Mới nhất");
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [expandedFilters, setExpandedFilters] = useState<{ [key: string]: boolean }>({});
    const [selectedFilters, setSelectedFilters] = useState<{ [key: string]: string[] }>({});

    const sortOptions = [
        { value: "1", label: "Mới nhất" },
        { value: "2", label: "Bán chạy nhất" },
        { value: "3", label: "Giá tăng dần" },
        { value: "4", label: "Giá giảm dần" }
    ];

    const filterCategories = {
        style: {
            title: "Phong cách",
            options: ["Office", "Street Style", "Evening"]
        },
        color: {
            title: "Màu sắc",
            options: [
                { name: "Đen", value: "black", color: "bg-black" },
                { name: "Trắng", value: "white", color: "bg-white border" },
                { name: "Xám", value: "gray", color: "bg-gray-400" },
                { name: "Hồng", value: "pink", color: "bg-pink-300" },
                { name: "Xanh dương", value: "blue", color: "bg-blue-600" },
                { name: "Xanh lá", value: "green", color: "bg-green-600" },
                { name: "Đỏ", value: "red", color: "bg-red-500" },
                { name: "Hồng đậm", value: "hotpink", color: "bg-pink-500" },
                { name: "Nâu", value: "brown", color: "bg-amber-800" },
                { name: "Vàng", value: "yellow", color: "bg-yellow-400" }
            ]
        },
        size: {
            title: "Size",
            options: ["XS", "S", "M", "L", "XL"]
        },
        price: {
            title: "Khoảng giá",
            options: [
                "Dưới 100.000đ",
                "100.000đ - 300.000đ", 
                "300.000đ - 500.000đ",
                "500.000đ - 1.000.000đ",
                "Trên 1.000.000đ"
            ]
        },
    };

    const handleSortSelect = (option: { value: string; label: string }) => {
        setSelectedSort(option.label);
        setIsDropdownOpen(false);
    };

    const toggleFilterExpansion = (category: string) => {
        setExpandedFilters(prev => ({
            ...prev,
            [category]: !prev[category]
        }));
    };

    const handleFilterSelect = (category: string, value: string) => {
        setSelectedFilters(prev => {
            const currentValues = prev[category] || [];
            const newValues = currentValues.includes(value)
                ? currentValues.filter(v => v !== value)
                : [...currentValues, value];
            
            return {
                ...prev,
                [category]: newValues
            };
        });
    };

    const handleApplyFilters = () => {
        // thêm logic
        console.log("Applied filters:", selectedFilters);
        setIsFilterOpen(false);
    };

    const handleCancelFilters = () => {
        setSelectedFilters({});
        setIsFilterOpen(false);
    };

    return (
        <div className="min-h-screen">
            <div className="flex gap-2">
                <a href="/">Trang chủ</a>
                <span>/</span>
                <span className="text-gray-500">Áo thun</span>
            </div>
            <div className="mt-4">
                {/* Filter */}
                <div className="flex items-center justify-between mb-4">
                    <div className="text-xl font-semibold">ÁO THUN (<span>40</span> sản phẩm)</div>
                    <div className="flex gap-4 flex-wrap">
                        <div className="relative">
                            <button
                                onClick={() => setIsFilterOpen(!isFilterOpen)}
                                className="cursor-pointer h-10 rounded-md border border-gray-300 bg-white px-3 py-2 flex items-center gap-2 hover:border-gray-400 focus:outline-none"
                            >
                                Lọc
                            <Filter
                            className="w-4 h-4"></Filter>
                            </button>
                    <div>
                                 {isFilterOpen && (
                                     <div className="absolute top-full right-0 mt-1 w-80 bg-white border border-gray-300 rounded-md shadow-lg z-20 p-6">
                                         {/* filter categories */}
                                         {Object.entries(filterCategories).map(([key, category]) => (
                                             <div key={key} className="mb-6">
                                                 <button
                                                     onClick={() => toggleFilterExpansion(key)}
                                                     className="flex items-center justify-between w-full text-left font-medium text-gray-900 mb-3"
                                                 >
                                                     <span>{category.title}</span>
                                                     <ChevronDown 
                                                         className={`w-4 h-4 transition-transform ${expandedFilters[key] ? 'rotate-180' : ''}`}
                                                     />
                                                 </button>
                                                 
                                                 {expandedFilters[key] && (
                                                     <div className="mb-4">
                                                         {key === 'color' ? (
                                                             <div className="grid grid-cols-5 gap-2">
                                                                 {category.options.map((option: any) => (
                                                                     <button
                                                                         key={option.value}
                                                                         onClick={() => handleFilterSelect(key, option.value)}
                                                                         className={`relative w-8 h-8 rounded ${option.color} border-2 ${
                                                                             selectedFilters[key]?.includes(option.value) 
                                                                                 ? 'border-red-500' 
                                                                                 : 'border-gray-300'
                                                                         }`}
                                                                         title={option.name}
                                                                     >
                                                                         {selectedFilters[key]?.includes(option.value) && (
                                                                             <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-red-500 rounded-full flex items-center justify-center">
                                                                                 <span className="text-white text-xs">✓</span>
                                                                             </div>
                                                                         )}
                                                                     </button>
                                                                 ))}
                                                             </div>
                                                         ) : (
                                                             <div className="space-y-2">
                                                                 {(category.options as string[]).map((option: string) => (
                                                                     <label key={option} className="flex items-center gap-2 cursor-pointer">
                                                                         <input
                                                                             type="checkbox"
                                                                             checked={selectedFilters[key]?.includes(option) || false}
                                                                             onChange={() => handleFilterSelect(key, option)}
                                                                             className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                                                         />
                                                                         <span className="text-sm text-gray-700">{option}</span>
                                                                     </label>
                                                                 ))}
                                                             </div>
                                                         )}
                                                     </div>
                                                 )}
                                             </div>
                                         ))}
                                         
                                         {/* action */}
                                         <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                                             <button
                                                 onClick={handleCancelFilters}
                                                 className="text-gray-600 underline hover:text-gray-800"
                                             >
                                                 HỦY
                                             </button>
                                             <button
                                                 onClick={handleApplyFilters}
                                                 className="bg-black text-white px-6 py-2 rounded hover:bg-gray-800 transition"
                                             >
                                                 ÁP DỤNG
                                             </button>
                                         </div>
                                     </div>
                                 )}
                             </div>
                        </div>
                        <div className="relative">
                            <div className="flex items-center gap-4">
                                <span className="text-black-500">Sắp xếp theo: </span>
                                <button
                                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                    className="w-40 h-10 rounded-md border border-gray-300 bg-white px-3 text-left flex items-center justify-between hover:border-gray-400 focus:outline-none"
                                >
                                    <span>{selectedSort}</span>
                                    <ChevronDown 
                                        className={`w-4 h-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}
                                    />
                                </button>
                            </div>
                            
                            
                            {isDropdownOpen && (
                                <div className="absolute top-full right-0 mt-1 w-40 bg-white border border-gray-300 rounded-md shadow-lg z-10">
                                    {sortOptions.map((option) => (
                                        <button
                                            key={option.value}
                                            onClick={() => handleSortSelect(option)}
                                            className="w-full px-3 py-2 text-left hover:bg-gray-100 first:rounded-t-md last:rounded-b-md"
                                        >
                                            {option.label}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                    
                </div>
                <ProductList></ProductList>
            </div>
            
        </div>
    )
}