/**
 * Application Constants
 * Centralized configuration for business rules and settings
 */

export const SHIPPING = {
    STANDARD_FEE: 30000, // 30,000 VNĐ
    FREE_SHIP_THRESHOLD: 0, // Disabled - only use vouchers for free shipping
} as const;

export const ORDER_STATUS = {
    PENDING: 'pending',
    PROCESSING: 'processing',
    SHIPPING: 'shipping',
    DELIVERED: 'delivered',
    CANCELLED: 'cancelled',
} as const;

export const PAYMENT_STATUS = {
    PENDING: 'pending',
    PAID: 'paid',
    FAILED: 'failed',
} as const;
