const productService = require("../services/product.service");
const categoriesService = require("../services/categories.service");
const ApiError = require("../api-error");
const JSend = require("../jsend");
const { extractProductFeatures } = require("../utils/extractFeatures");

async function createProduct(req, res, next) {
  try {
    const payload = { ...req.body };
    
    if (payload.category_id) {
      const isLeaf = await categoriesService.isLeafCategory(payload.category_id);
      if (!isLeaf) {
        return next(new ApiError(400, "Vui lòng chọn danh mục cụ thể (danh mục con)"));
      }
    }
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
      
      let imageMetadata = [];
      if (payload.image_metadata) {
        try {
          imageMetadata = typeof payload.image_metadata === 'string' 
            ? JSON.parse(payload.image_metadata) 
            : payload.image_metadata;
        } catch (parseErr) {
          console.error('Error parsing image_metadata:', parseErr);
        }
      }
      
      let imageColors = [];
      if (payload.image_colors) {
        if (typeof payload.image_colors === 'string') {
          imageColors = [parseInt(payload.image_colors)];
        } else if (Array.isArray(payload.image_colors)) {
          imageColors = payload.image_colors.map(c => parseInt(c));
        }
      }
      
      const colorImages = {};
      imagePaths.slice(1).forEach((imagePath, index) => {
        const colorId = imageColors[index];
        if (colorId) {
          if (!colorImages[colorId]) {
            colorImages[colorId] = [];
          }
          const metadata = imageMetadata[index] || {};
          colorImages[colorId].push({
            url: imagePath,
            is_primary: metadata.is_primary || false,
            display_order: metadata.display_order || colorImages[colorId].length + 1
          });
        }
      });
      
      if (payload.variants && Array.isArray(payload.variants)) {
        payload.variants.forEach(variant => {
          const colorId = variant.color_id;
          variant.images = colorImages[colorId] || [];
        });
      }
      
      payload.colorImages = colorImages;
      payload.uploadedImages = imagePaths;
    }
    
    const product = await productService.createProduct(payload);
    
    extractProductFeatures(product.product_id, false).catch(err => {
      console.error('Feature extraction error:', err);
    });
    
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
    if(Object.keys(req.body).length === 0 && (!req.files || req.files.length === 0)) {
      return next(new ApiError(400, "No data to update"));
    }
    
    // Validate category phải là leaf category
    if (req.body.category_id) {
      const isLeaf = await categoriesService.isLeafCategory(req.body.category_id);
      if (!isLeaf) {
        return next(new ApiError(400, "Vui lòng chọn danh mục cụ thể (danh mục con)"));
      }
    }

    const imageData = {
      uploadedFiles: req.files || [],
      deletedImages: req.body.deleted_images ? JSON.parse(req.body.deleted_images) : [],
      updatedImages: req.body.updated_images ? JSON.parse(req.body.updated_images) : [],
      imageColors: req.body.image_colors ? JSON.parse(req.body.image_colors) : [],
      newThumbnail: req.body.new_thumbnail === 'true'
    };

    const updated = await productService.updateProduct(req.params.id, {
      ...req.body,
      imageData
    });
    
    if (!updated) return next(new ApiError(404, "Product not found"));
    
    const hasImageChanges = (req.files && req.files.length > 0) || 
                           (imageData.deletedImages && imageData.deletedImages.length > 0) ||
                           (imageData.updatedImages && imageData.updatedImages.length > 0);
    
    if (hasImageChanges) {
      extractProductFeatures(req.params.id, false).catch(err => {
        console.error('Feature extraction error:', err);
      });
    }
    
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

async function getProductsByIds(req, res, next) {
  try {
    const { ids } = req.body;
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return next(new ApiError(400, "Product IDs array is required"));
    }
    
    const user_id = req.user?.user_id || null;
    const products = await productService.getProductsByIds(ids, user_id);
    
    return res.json(JSend.success({ products }));
  } catch (err) {
    console.error(err);
    return next(new ApiError(500, "Error fetching products"));
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
  getProductsByIds,
};
