const productService = require("../services/product.service");
const ApiError = require("../api-error");
const JSend = require("../jsend");

async function createProduct(req, res, next) {
  try {
    const payload = { ...req.body };
    if (req.files && req.files.length > 0) {

      const imagePaths = req.files.map(file => `/public/uploads/${file.filename}`);

      payload.thumbnail = imagePaths[0];
      

      if (typeof payload.variants === 'string') {
        try {
          payload.variants = JSON.parse(payload.variants);
        } catch (parseErr) {
          return next(new ApiError(400, "Invalid variants format"));
        }
      }
      
     
      if (payload.variants && Array.isArray(payload.variants)) {
        let imageIndex = 1; 
        
        payload.variants.forEach((variant, variantIndex) => {
  variant.images = [];
  const imagesPerVariant = variant.imageCount || 0;

  for (let i = 0; i < imagesPerVariant && imageIndex < imagePaths.length; i++) {
    variant.images.push(imagePaths[imageIndex]);
    imageIndex++;
  }
});
      }

      payload.uploadedImages = imagePaths;
    }
    
    const product = await productService.createProduct(payload);
    return res.status(201).json(JSend.success({ product }));
  } catch (err) {
    console.error('Create product error:', err);
    return next(new ApiError(500, err.message || "Error creating product"));
  }
}

async function getProducts(req, res, next) {
    let result = {
        products: [],
        metadata: {
          totalReconds: 0,
          firstPage: 1,
          lastPage: 1,
          page: 1,
          limit: 5,
        }
      }
  try {
    const query = { ...req.query };
    const role = req.user?.role || null;
    if (query.brand_id) {
      query.brand_id = parseInt(query.brand_id);
    }
    if (query.category_id) {
      query.category_id = parseInt(query.category_id);
    }
    if (query.page) {
      query.page = parseInt(query.page);
    }
    if (query.limit) {
      query.limit = parseInt(query.limit);
    }
    
    result = await productService.getManyProducts(query, role);

    return res.json(JSend.success(
        {
            products: result.products,
            metadata: result.metadata
        }
    ));
  } catch (err) {
    console.log(err);
    return next(new ApiError(500, "Error fetching products"));
  }
}

async function getProductById(req, res, next) {
  try {
    const user_id = req.query.user_id || null;
    
    const product = await productService.getProductById(req.params.id, user_id);
    if (!product) return next(new ApiError(404, "Product not found"));
    return res.json(JSend.success({ product }));
  } catch (err) {
    return next(new ApiError(500, "Error fetching product"));
  }
}

async function updateProduct(req, res, next) {
  try {
    if(Object.keys(req.body).length === 0 && !req.file) {
      return next(new ApiError(400, "No data to update"));
    }
    const updated = await productService.updateProduct(req.params.id, {
      ...req.body,
      thumbnail: req.file ? `/public/uploads/${req.file.filename}` : null,
    });
    if (!updated) return next(new ApiError(404, "Product not found"));
    return res.json(JSend.success({ product: updated }));
  } catch (err) {
    console.error('Update product error:', err);
    return next(new ApiError(500, err.message || "Error updating product"));
  }
}

async function deleteProduct(req, res, next) {
  try {
    const deleted = await productService.deleteProduct(req.params.id);
    if (!deleted) return next(new ApiError(404, "Product not found"));
    return res.json(JSend.success({ message: "Product deleted" }));
  } catch (err) {
    return next(new ApiError(500, "Error deleting product"));
  }
}

async function hardDeleteProduct(req, res, next) {
  try {
    const deleted = await productService.hardDeleteProduct(req.params.id);
    if (!deleted) return next(new ApiError(404, "Product not found"));
    return res.json(JSend.success({ message: "Product deleted" }));
  } catch (err) {
    return next(new ApiError(500, "Error deleting product"));
  }
}

async function restoreProduct(req, res, next) {
  try {
    const restored = await productService.restoreProduct(req.params.id);
    if (!restored) return next(new ApiError(404, "Product not found"));
    return res.json(JSend.success({ message: "Product restored" }));
  } catch (err) {
    return next(new ApiError(500, "Error restoring product"));
  }
}

module.exports = {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  hardDeleteProduct,
  restoreProduct,
};
