import React from 'react';
import { Select, Button } from 'antd';
import { Star } from 'lucide-react';

interface ReviewFiltersProps {
    sortBy: string;
    setSortBy: (value: string) => void;
    filterRating: number;
    setFilterRating: (value: number) => void;
}

const ReviewFilters: React.FC<ReviewFiltersProps> = ({
    sortBy,
    setSortBy,
    filterRating,
    setFilterRating
}) => {
    return (
        <div className="flex flex-wrap gap-4 mb-6 p-4 bg-white">

            <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Sắp xếp:</span>
                <Select
                    value={sortBy}
                    onChange={setSortBy}
                    style={{ width: 160 }}
                    options={[
                        { value: 'newest', label: 'Mới nhất' },
                        { value: 'oldest', label: 'Cũ nhất' },
                    ]}
                />
            </div>


            <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Lọc theo sao:</span>
                <div className="flex gap-2 ">
                    <Button 
                        size="middle"
                        style={{borderRadius: '0px'}}
                        type={filterRating === 0 ? 'primary' : 'default'}
                        onClick={() => setFilterRating(0)}
                    >
                        Tất cả
                    </Button>
                    {[5, 4, 3, 2, 1].map(rating => (
                        <Button
                            key={rating}
                            style={{borderRadius: '0px'}}
                            size="middle"
                            type={filterRating === rating ? 'primary' : 'default'}
                            onClick={() => setFilterRating(rating)}
                        >
                            {rating} <Star className='w-4 h-4' />
                        </Button>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ReviewFilters;