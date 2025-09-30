const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cart.controller');
const { authMiddleware } = require('../middleware/auth.middleware');
const { methodNotAllowed } = require('../controllers/errors.controller');

module.exports.setup = (app) => {
    app.use('/api/v1/cart', router);
    
    router.use(authMiddleware);
    router.get('/',cartController.getCart)           // GET /api/v1/cart - Lấy giỏ hàng
    router.post('/',cartController.addToCart)        // POST /api/v1/cart - Thêm vào giỏ hàng
    router.delete('/',cartController.clearCart)      // DELETE /api/v1/cart - Xóa toàn bộ giỏ hàng
    router.all('/', methodNotAllowed);
    
    router.get('/quantity',cartController.getCartItemCount)  // GET /api/v1/cart/count - Lấy số lượng items
    router.all('/quantity', methodNotAllowed);
    
    router.put('/:cartId',cartController.updateCartItem)    // PUT /api/v1/cart/:cartId - Cập nhật số lượng
    router.delete('/:cartId',cartController.removeFromCart) // DELETE /api/v1/cart/:cartId - Xóa item
    router.all('/:cartId', methodNotAllowed);
};
