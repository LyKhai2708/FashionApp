const express = require("express");
const router = express.Router();
const productController = require("../controllers/products.controller");
const { methodNotAllowed } = require("../controllers/errors.controller");
const {authMiddleware, authorizeRoles} = require('../middleware/auth.middleware');
const { uploadSingle, uploadMultiple } = require("../middleware/upload_image.middleware");
module.exports.setup = (app) => {
    app.use("/api/v1/products", router);
    router.post("/", authMiddleware, authorizeRoles(['admin']), uploadMultiple('images', 30), productController.createProduct); // tạo product + variants + images
    router.get("/", productController.getProducts); // danh sách (phân trang, filter)
    router.all("/", methodNotAllowed);
    router.all("/:id", productController.getProductById);
    router.patch("/:id", authMiddleware, authorizeRoles(['admin']), uploadMultiple('images', 30), productController.updateProduct); // update cơ bản
    router.delete("/:id", authMiddleware, authorizeRoles(['admin']), productController.deleteProduct); // soft delete
    router.all("/:id", methodNotAllowed);
    router.delete("/:id/permanent", authMiddleware, authorizeRoles(['admin']), productController.hardDeleteProduct); // hard delete
}
