const { spawn } = require('child_process');
const path = require('path');


async function extractProductFeatures(productId, wait = false) {
    const pythonScript = path.join(__dirname, '../../../imageSearch/extract_single_product.py');
    const imageSearchDir = path.join(__dirname, '../../../imageSearch');
    
    console.log(`[Feature Extraction] Starting for product ${productId}...`);
    
    const pythonProcess = spawn('python', [pythonScript, productId.toString()], {
        cwd: imageSearchDir
    });
    
    if (wait) {
        return new Promise((resolve, reject) => {
            let stdout = '';
            let stderr = '';
            
            pythonProcess.stdout.on('data', (data) => {
                stdout += data.toString();
            });
            
            pythonProcess.stderr.on('data', (data) => {
                stderr += data.toString();
                console.log(`[Feature Extraction] ${data.toString().trim()}`);
            });
            
            pythonProcess.on('close', (code) => {
                if (code === 0) {                    try {
                        const result = JSON.parse(stdout);
                        resolve(result);
                    } catch (e) {
                        resolve({ success: true, product_id: productId });
                    }
                } else {
                    console.error(stderr);
                    reject(new Error('Feature extraction failed'));
                }
            });
        });
    } else {
        pythonProcess.stdout.on('data', (data) => {
            console.log(`[Feature Extraction] ${data.toString().trim()}`);
        });
        
        pythonProcess.stderr.on('data', (data) => {
            console.log(`[Feature Extraction] ${data.toString().trim()}`);
        });
        
        pythonProcess.on('close', (code) => {
            if (code === 0) {
                console.log(`[Feature Extraction] ✅ Success for product ${productId}`);
            } else {
                console.error(`[Feature Extraction] ❌ Failed for product ${productId}`);
            }
        });
        return Promise.resolve({ queued: true, product_id: productId });
    }
}

module.exports = {
    extractProductFeatures
};
