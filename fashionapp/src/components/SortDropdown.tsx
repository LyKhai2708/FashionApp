import { useState, useEffect } from "react";
import { ChevronDown } from "lucide-react";

interface SortOption {
    value: string;
    label: string;
}

interface SortDropdownProps {
    onSortChange?: (sort: string) => void;
    defaultSort?: string;
    currentSort?: string;
}

const sortOptions: SortOption[] = [
    { value: "newest", label: "Mới nhất" },
    { value: "price_asc", label: "Giá tăng dần" },
    { value: "price_desc", label: "Giá giảm dần" }
];

export default function SortDropdown({ onSortChange, defaultSort = "newest", currentSort }: SortDropdownProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedValue, setSelectedValue] = useState(currentSort || defaultSort);

    const getLabel = (value: string) => {
        return sortOptions.find(opt => opt.value === value)?.label || "Mới nhất";
    };

    useEffect(() => {
        if (currentSort) {
            setSelectedValue(currentSort);
        }
    }, [currentSort]);

    const handleSortSelect = (option: SortOption) => {
        setSelectedValue(option.value);
        setIsOpen(false);
        onSortChange?.(option.value);
    };

    return (
        <div className="relative">
            <div className="flex items-center gap-4">
                <span className="text-black-500">Sắp xếp theo: </span>
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="w-40 h-10 rounded-md border border-gray-300 bg-white px-3 text-left flex items-center justify-between hover:border-gray-400 focus:outline-none"
                >
                    <span>{getLabel(selectedValue)}</span>
                    <ChevronDown 
                        className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                    />
                </button>
            </div>
            
            {isOpen && (
                <div className="absolute top-full right-0 mt-1 w-40 bg-white border border-gray-300 rounded-md shadow-lg z-10">
                    {sortOptions.map((option) => (
                        <button
                            key={option.value}
                            onClick={() => handleSortSelect(option)}
                            className={`w-full px-3 py-2 text-left hover:bg-gray-100 first:rounded-t-md last:rounded-b-md ${
                                selectedValue === option.value ? 'bg-gray-50 font-medium' : ''
                            }`}
                        >
                            {option.label}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}