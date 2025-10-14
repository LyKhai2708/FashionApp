import React, { useState } from 'react';
import ReviewStats from './ReviewStats';
import ReviewFilters from './ReviewFilter';
import ReviewList from './ReviewList';
import authService from '../../services/authService';
import reviewService from '../../services/reviewService';
import { useMessage } from '../../App';
import ReviewForm from './ReviewForm';
import {Button } from 'antd';
import {PenToolIcon} from 'lucide-react'
import { PlusOutlined } from '@ant-design/icons';
interface ReviewSectionProps {
    productId: number;
}

interface UserOrder {
    order_id: number;
    order_date: string;
}
const ReviewSection: React.FC<ReviewSectionProps> = ({ productId }) => {
    const [sortBy, setSortBy] = useState('newest'); 
    const [filterRating, setFilterRating] = useState(0);    
    const [currentPage, setCurrentPage] = useState(1);
    const [reviewFormVisible, setReviewFormVisible] = useState(false);
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [userOrders, setUserOrders] = useState<UserOrder[]>([]);
    const [loadingOrders, setLoadingOrders] = useState(false);
    const message = useMessage();
    const isLoggedIn = authService.isAuthenticated();

    const fetchUserOrders = async () => {
        
        setLoadingOrders(true);
        try {
            
            const response = await reviewService.getEligibleOrdersForReview(productId);
            setUserOrders(response);
            
        } catch (error) {
            console.error('Error fetching orders:', error);
            message.error('Không thể tải danh sách đơn hàng');
        } finally {
            setLoadingOrders(false);
        }
    };

    const handleOpenReviewForm = () => {
        if (!isLoggedIn) {
            message.warning('Vui lòng đăng nhập để viết đánh giá');
            return;
        }
        fetchUserOrders();
        setReviewFormVisible(true);
    };

    const handleReviewSuccess = () => {
        setRefreshTrigger(prev => prev + 1); //load lai danh gia
    };

    const handleReviewUpdate = () => {
    setRefreshTrigger(prev => {
        console.log('Setting refreshTrigger from', prev, 'to', prev + 1);
        return prev + 1;
    });
    };
    return (
        <div className="mt-10 pt-8 border-t border-gray-200">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">Đánh giá sản phẩm</h2>
                <Button
                    type="primary"
                    icon={<PenToolIcon 
                    width={15}
                    height={15}/>}
                    onClick={handleOpenReviewForm}
                >
                    Viết đánh giá
                </Button>
            </div>
            
            <ReviewStats 
                productId={productId}
                refreshTrigger={refreshTrigger}
            />
            
            <ReviewFilters 
                sortBy={sortBy}
                setSortBy={setSortBy}
                filterRating={filterRating}
                setFilterRating={setFilterRating}
            />
            
            <ReviewList 
                productId={productId}
                sortBy={sortBy}
                filterRating={filterRating}
                currentPage={currentPage}
                setCurrentPage={setCurrentPage}
                refreshTrigger={refreshTrigger}
                onReviewUpdate={handleReviewUpdate}
            />

            <ReviewForm
                visible={reviewFormVisible}
                onClose={() => setReviewFormVisible(false)}
                onSuccess={handleReviewSuccess}
                productId={productId}
                userOrders={userOrders}
            />
        </div>
    );
};

export default ReviewSection;