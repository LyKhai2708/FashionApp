import { useState, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import type { ProductsParams } from '../types/product';
import { colorService, type Color } from '../services/colorService';
import { sizeService, type Size } from '../services/sizeService';

const PRICE_RANGES = [
    { label: "Dưới 100.000đ", min: 0, max: 100000 },
    { label: "100.000đ - 300.000đ", min: 100000, max: 300000 },
    { label: "300.000đ - 500.000đ", min: 300000, max: 500000 },
    { label: "500.000đ - 1.000.000đ", min: 500000, max: 1000000 },
    { label: "Trên 1.000.000đ", min: 1000000, max: undefined }
];

interface FilterBarProps {
    onFilterChange?: (filters: ProductsParams) => void;
    currentFilters?: ProductsParams;
}

interface SelectedFilters {
    color_ids: number[];
    size_ids: number[];
    priceRange?: { min?: number; max?: number };
}

export default function FilterBar({ onFilterChange, currentFilters }: FilterBarProps) {
    const [expandedSections, setExpandedSections] = useState({
        color: true,
        size: true,
        price: true
    });

    const convertToSelectedFilters = (filters?: ProductsParams): SelectedFilters => {
        if (!filters) return { color_ids: [], size_ids: [], priceRange: undefined };

        const colorIds = filters.color_id
            ? Array.isArray(filters.color_id) ? filters.color_id : [filters.color_id]
            : [];

        const sizeIds = filters.size_id
            ? Array.isArray(filters.size_id) ? filters.size_id : [filters.size_id]
            : [];

        const priceRange = (filters.min_price || filters.max_price)
            ? { min: filters.min_price, max: filters.max_price }
            : undefined;

        return { color_ids: colorIds, size_ids: sizeIds, priceRange };
    };

    const [selectedFilters, setSelectedFilters] = useState<SelectedFilters>(() =>
        convertToSelectedFilters(currentFilters)
    );

    const [colors, setColors] = useState<Color[]>([]);
    const [sizes, setSizes] = useState<Size[]>([]);
    const [loadingColors, setLoadingColors] = useState(false);
    const [loadingSizes, setLoadingSizes] = useState(false);

    useEffect(() => {
        const fetchColorsAndSizes = async () => {
            try {
                setLoadingColors(true);
                setLoadingSizes(true);

                const [colorsData, sizesData] = await Promise.all([
                    colorService.getColors(),
                    sizeService.getSizes()
                ]);
                setColors(colorsData);
                setSizes(sizesData);
            } catch (error) {
                console.log('Error fetching colors or sizes:', error);
            } finally {
                setLoadingColors(false);
                setLoadingSizes(false);
            }
        };

        fetchColorsAndSizes();
    }, []);

    useEffect(() => {
        setSelectedFilters(convertToSelectedFilters(currentFilters));
    }, [currentFilters]);

    const toggleSection = (section: keyof typeof expandedSections) => {
        setExpandedSections(prev => ({
            ...prev,
            [section]: !prev[section]
        }));
    };

    const handleColorToggle = (colorId: number) => {
        setSelectedFilters(prev => ({
            ...prev,
            color_ids: prev.color_ids.includes(colorId)
                ? prev.color_ids.filter(id => id !== colorId)
                : [...prev.color_ids, colorId]
        }));
    };

    const handleSizeToggle = (sizeId: number) => {
        setSelectedFilters(prev => ({
            ...prev,
            size_ids: prev.size_ids.includes(sizeId)
                ? prev.size_ids.filter(id => id !== sizeId)
                : [...prev.size_ids, sizeId]
        }));
    };

    const handlePriceRangeSelect = (range: { min?: number; max?: number }) => {
        setSelectedFilters(prev => ({
            ...prev,
            priceRange: prev.priceRange?.min === range.min && prev.priceRange?.max === range.max
                ? undefined
                : range
        }));
    };

    const handleApplyFilters = () => {
        const filters: ProductsParams = {
            page: 1,
            ...(currentFilters?.sort && { sort: currentFilters.sort })
        };

        if (selectedFilters.color_ids.length > 0) {
            filters.color_id = selectedFilters.color_ids.length === 1
                ? selectedFilters.color_ids[0]
                : selectedFilters.color_ids;
        }

        if (selectedFilters.size_ids.length > 0) {
            filters.size_id = selectedFilters.size_ids.length === 1
                ? selectedFilters.size_ids[0]
                : selectedFilters.size_ids;
        }

        if (selectedFilters.priceRange) {
            filters.min_price = selectedFilters.priceRange.min;
            filters.max_price = selectedFilters.priceRange.max;
        }

        onFilterChange?.(filters);
    };

    const handleClearFilters = () => {
        setSelectedFilters({
            color_ids: [],
            size_ids: [],
            priceRange: undefined
        });

        onFilterChange?.({
            ...(currentFilters?.sort && { sort: currentFilters.sort })
        });
    };

    const hasActiveFilters =
        selectedFilters.color_ids.length > 0 ||
        selectedFilters.size_ids.length > 0 ||
        selectedFilters.priceRange !== undefined;

    return (
        <div className="bg-white border border-gray-200 rounded-lg p-6 sticky top-4">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold">Filters</h3>
                {hasActiveFilters && (
                    <button
                        onClick={handleClearFilters}
                        className="text-sm text-cyan-500 hover:text-cyan-600 font-medium"
                    >
                        Clear All
                    </button>
                )}
            </div>

            <div className="space-y-6">
                <div>
                    <button
                        onClick={() => toggleSection('color')}
                        className="flex items-center justify-between w-full text-left font-semibold text-gray-900 mb-3"
                    >
                        <span>Color</span>
                        <ChevronDown
                            className={`w-4 h-4 transition-transform ${expandedSections.color ? 'rotate-180' : ''}`}
                        />
                    </button>

                    {expandedSections.color && (
                        <div className="grid grid-cols-5 gap-2">
                            {loadingColors ? (
                                Array.from({ length: 10 }).map((_, i) => (
                                    <div key={i} className="w-10 h-10 bg-gray-200 rounded animate-pulse" />
                                ))
                            ) : colors.length > 0 ? (
                                colors.map((color) => (
                                    <button
                                        key={color.color_id}
                                        onClick={() => handleColorToggle(color.color_id)}
                                        className={`relative w-10 h-10 rounded border-2 ${selectedFilters.color_ids.includes(color.color_id)
                                            ? 'border-cyan-500 ring-2 ring-cyan-200'
                                            : 'border-gray-300'
                                            }`}
                                        style={{
                                            backgroundColor: color.hex_code,
                                            ...(color.hex_code === '#FFFFFF' && { borderColor: '#D1D5DB' })
                                        }}
                                        title={color.name}
                                    >
                                        {selectedFilters.color_ids.includes(color.color_id) && (
                                            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-cyan-500 rounded-full flex items-center justify-center">
                                                <span className="text-white text-xs">✓</span>
                                            </div>
                                        )}
                                    </button>
                                ))
                            ) : (
                                <p className="col-span-5 text-sm text-gray-500">Không có màu sắc</p>
                            )}
                        </div>
                    )}
                </div>

                <div>
                    <button
                        onClick={() => toggleSection('size')}
                        className="flex items-center justify-between w-full text-left font-semibold text-gray-900 mb-3"
                    >
                        <span>Size</span>
                        <ChevronDown
                            className={`w-4 h-4 transition-transform ${expandedSections.size ? 'rotate-180' : ''}`}
                        />
                    </button>

                    {expandedSections.size && (
                        <div className="flex flex-wrap gap-2">
                            {loadingSizes ? (
                                Array.from({ length: 6 }).map((_, i) => (
                                    <div key={i} className="h-10 w-12 bg-gray-200 rounded animate-pulse" />
                                ))
                            ) : sizes.length > 0 ? (
                                sizes.map((size) => (
                                    <button
                                        key={size.size_id}
                                        onClick={() => handleSizeToggle(size.size_id)}
                                        className={`px-4 py-2 border rounded transition-colors ${selectedFilters.size_ids.includes(size.size_id)
                                            ? 'border-cyan-500 bg-cyan-50 text-cyan-600 font-medium'
                                            : 'border-gray-300 hover:border-gray-400'
                                            }`}
                                    >
                                        {size.name}
                                    </button>
                                ))
                            ) : (
                                <p className="text-sm text-gray-500">Không có kích thước</p>
                            )}
                        </div>
                    )}
                </div>

                <div>
                    <button
                        onClick={() => toggleSection('price')}
                        className="flex items-center justify-between w-full text-left font-semibold text-gray-900 mb-3"
                    >
                        <span>Price Range</span>
                        <ChevronDown
                            className={`w-4 h-4 transition-transform ${expandedSections.price ? 'rotate-180' : ''}`}
                        />
                    </button>

                    {expandedSections.price && (
                        <div className="space-y-2">
                            {PRICE_RANGES.map((range, index) => (
                                <label
                                    key={index}
                                    className="flex items-center gap-2 cursor-pointer group"
                                >
                                    <input
                                        type="radio"
                                        name="priceRange"
                                        checked={
                                            selectedFilters.priceRange?.min === range.min &&
                                            selectedFilters.priceRange?.max === range.max
                                        }
                                        onChange={() => handlePriceRangeSelect({ min: range.min, max: range.max })}
                                        className="w-4 h-4 text-cyan-600 border-gray-300 focus:ring-cyan-500"
                                    />
                                    <span className="text-sm text-gray-700 group-hover:text-gray-900">
                                        {range.label}
                                    </span>
                                </label>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <button
                onClick={handleApplyFilters}
                className="w-full mt-8 bg-cyan-500 text-white py-3 rounded-lg hover:bg-cyan-600 transition font-medium"
            >
                Apply Filters
            </button>
        </div>
    );
}