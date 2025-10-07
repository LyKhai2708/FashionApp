const cartService = require('../services/cart.service');
const ApiError = require('../api-error');
const JSend = require('../jsend');

async function getCart(req, res, next) {
    try {
        const userId = req.user.id;
        const cart = await cartService.getCart(userId);
        return res.json(JSend.success({ cart }));
    } catch (error) {
        console.error('Get cart error:', error);
        return next(new ApiError(500, 'Lỗi khi lấy giỏ hàng'));
    }
}

async function addToCart(req, res, next) {
    try {
        const userId = req.user.id;
        const { product_variants_id, quantity } = req.body;

        if (!product_variants_id) {
            return next(new ApiError(400, 'product_variant_id là bắt buộc'));
        }

        if (quantity && (quantity <= 0 || !Number.isInteger(quantity))) {
            return next(new ApiError(400, 'Số lượng phải là số nguyên dương'));
        }

        const cart = await cartService.addToCart(userId, { product_variants_id, quantity });
        return res.json(JSend.success({ 
            cart,
            message: 'Đã thêm sản phẩm vào giỏ hàng'
        }));
    } catch (error) {
        console.error('Add to cart error:', error);
        return next(new ApiError(500, error.message));
    }
}

async function updateCartItem(req, res, next) {
    try {
        const userId = req.user.id;
        const cartId = parseInt(req.params.cartId);
        const { quantity } = req.body;

        if (!quantity || quantity <= 0 || !Number.isInteger(quantity)) {
            return next(new ApiError(400, 'Số lượng phải là số nguyên dương'));
        }

        const cart = await cartService.updateCartItem(userId, cartId, quantity);
        return res.json(JSend.success({ 
            cart,
            message: 'Đã cập nhật số lượng sản phẩm'
        }));
    } catch (error) {
        console.error('Update cart item error:', error);
        return next(new ApiError(500, error.message));
    }
}

async function removeFromCart(req, res, next) {
    try {
        const userId = req.user.id;
        const cartId = parseInt(req.params.cartId);

        const cart = await cartService.removeFromCart(userId, cartId);
        return res.json(JSend.success({ 
            cart,
            message: 'Đã xóa sản phẩm khỏi giỏ hàng'
        }));
    } catch (error) {
        console.error('Remove from cart error:', error);
        return next(new ApiError(500, error.message));
    }
}

async function clearCart(req, res, next) {
    try {
        const userId = req.user.id;
        const result = await cartService.clearCart(userId);
        return res.json(JSend.success(result));
    } catch (error) {
        console.error('Clear cart error:', error);
        return next(new ApiError(500, 'Lỗi khi xóa giỏ hàng'));
    }
}

async function getCartItemCount(req, res, next) {
    try {
        const userId = req.user.id;
        const result = await cartService.getCartItemCount(userId);
        return res.json(JSend.success(result));
    } catch (error) {
        console.error('Get cart count error:', error);
        return next(new ApiError(500, 'Lỗi khi lấy số lượng giỏ hàng'));
    }
}

async function mergeLocalCartToCart(req, res, next) {
    try {
        const userId = req.user.id;
        const { items } = req.body;

        if (!Array.isArray(items)) {
            return next(new ApiError(400, 'Dữ liệu không hợp lệ, "items" phải là một mảng.'));
        }

        await cartService.mergeLocalCartToCart(userId, items);
        return res.status(200).json(JSend.success({
            message: 'Giỏ hàng đã được đồng bộ thành công.'
        }));
    } catch (error) {
        console.error('Merge local cart error:', error);
        return next(new ApiError(500, error.message));
    }
}
module.exports = {
    getCart,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart,
    getCartItemCount,
    mergeLocalCartToCart
};
