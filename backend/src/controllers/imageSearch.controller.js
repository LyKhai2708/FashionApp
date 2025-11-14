const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const ApiError = require('../api-error');
const JSend = require('../jsend');
const productService = require('../services/product.service');


async function searchByImage(req, res, next) {

    
    try {
        if (!req.file) {
            return next(new ApiError(400, 'Vui lòng upload ảnh'));
        }

        const uploadedImagePath = req.file.path;


        const pythonScript = path.join(__dirname, '../../../imageSearch/image_search.py');

        if (!fs.existsSync(pythonScript)) {
            return next(new ApiError(500, 'Image search script not found'));
        }
        const absoluteImagePath = path.resolve(uploadedImagePath);

        const imageSearchDir = path.join(__dirname, '../../../imageSearch');
        
        const pythonPath = path.join(__dirname, '../../../imageSearch/myenv/Scripts/python.exe');
        
        const pythonProcess = spawn(pythonPath, [pythonScript, absoluteImagePath], {
            cwd: imageSearchDir
        });

        let stdout = '';
        let stderr = '';

        pythonProcess.stdout.on('data', (data) => {
            const chunk = data.toString();
            console.log('Python stdout:', chunk);
            stdout += chunk;
        });

        pythonProcess.stderr.on('data', (data) => {
            const chunk = data.toString();
            console.log('Python stderr:', chunk);
            stderr += chunk;
        });

        pythonProcess.on('close', async (code) => {
            fs.unlink(uploadedImagePath, (err) => {
                if (err) console.error('Error deleting temp file:', err);
            });

            if (code !== 0) {
                return next(new ApiError(500, 'Lỗi khi tìm kiếm ảnh'));
            }

            try {
                const result = JSON.parse(stdout);

                if (!result.success || !result.product_ids || result.product_ids.length === 0) {
                    return next(new ApiError(404, 'Không tìm thấy sản phẩm tương tự'));
                }


                const products = await productService.getProductsByIds(
                    result.product_ids, 
                    req.user?.user_id
                );


                res.json(JSend.success({
                    total: products.length,
                    products: products
                }));

            } catch (parseError) {
                return next(new ApiError(500, 'Lỗi xử lý kết quả'));
            }
        });

    } catch (error) {
        console.error('Search by image error:', error);
        return next(new ApiError(500, error.message));
    }
}

module.exports = {
    searchByImage
};
