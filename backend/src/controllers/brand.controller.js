const ApiError = require('../api-error')
const brandService = require('../services/brand.service');
const JSend = require('../jsend');

async function createBrand(req, res, next) {
  try {
    const {name, active}  = req.body;
    if(!name || typeof name !== 'string') {
      return next(new ApiError(400, 'Tên thương hiệu là bắt buộc và phải là chuỗi ký tự'));
    }
    const checkName = await brandService.checkBrandName(name);
    if(checkName){
      return next(new ApiError(409, 'Tên thương hiệu đã tồn tại'));
    }
    
    const brand = await brandService.createBrand({...req.body});
    return res
      .status(201)
      .set({
        Location: `${req.baseUrl}/${brand.id}`
      })
      .json(JSend.success({brand}));
  } catch(error) {
    console.log(error);
    return next(new ApiError(500, 'Đã xảy ra lỗi khi tạo thương hiệu'));
  }
}
async function getBrandbyFilter(req, res, next) {
    let result = {
      metadata: {
        totalRecords: 0,
        firstPage: 1,
        lastPage: 1,
        page: 1,
        limit: 5,
      },
      brands: []
    };
  try {
    result = await brandService.getManyBrands(req.query);
    
    return res.json(JSend.success({
      metadata: result.metadata,
      brands: result.brands
    }));
  } catch (error) {
    console.log(error);
    return next(new ApiError(500, 'Đã xảy ra lỗi khi lấy danh sách thương hiệu'));
  }
}

async function getBrand(req, res, next) {
  try {
    const {id} = req.params;
    const brand = await brandService.getBrandById(id);
    
    if (!brand) {
      return next(new ApiError(404, 'Không tìm thấy thương hiệu'));
    }
    
    return res.json(JSend.success({brand}));
  } catch (error) {
    console.log(error);
    return next(new ApiError(500, `Đã xảy ra lỗi khi lấy thông tin thương hiệu với id=${req.params.id}`));
  }
}

async function updateBrand(req, res, next) {
  try {
    const {id} = req.params;
    

    if (Object.keys(req.body).length === 0) {
      return next(new ApiError(400, 'Dữ liệu cập nhật không được để trống'));
    }
    
    const updated = await brandService.updateBrand(id, req.body);
    if (!updated) {
      return next(new ApiError(404, 'Không tìm thấy thương hiệu'));
    }
    
    return res.json(JSend.success({brand: updated}));
  } catch (error) {
    console.log(error);
    if (error.code === "ER_DUP_ENTRY") {
      return next(new ApiError(409, "Tên thương hiệu đã tồn tại"));
    }
    return next(new ApiError(500, `Đã xảy ra lỗi khi cập nhật thương hiệu với id ${req.params.id}`));
  }
}

async function deleteBrand(req, res, next) {
  try {
    const {id} = req.params;
    const deleted = await brandService.deleteBrand(id);
    
    if (!deleted) {
      return next(new ApiError(404, 'Không tìm thấy thương hiệu'));
    }
    
    return res.json(JSend.success({ deleted: true }));
  } catch (error) {
    console.log(error);
    return next(new ApiError(500, `Đã xảy ra lỗi khi xóa thương hiệu với id ${req.params.id}`));
  }
}

async function deleteAllBrands(req, res, next) {
  try {
    const deleted = await brandService.deleteAllBrands();
    return res.json(JSend.success({ deleted: true }));
  } catch (error) {
    console.log(error);
    return next(new ApiError(500, 'Đã xảy ra lỗi khi xóa tất cả thương hiệu'));
  }
}

module.exports = {
  createBrand,
  getBrandbyFilter,
  getBrand,
  updateBrand,
  deleteBrand,
  deleteAllBrands,
};