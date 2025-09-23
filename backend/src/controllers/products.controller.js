const JSend = require('../jsend');

function getProduct(req, res) {
    return res.json(JSend.success({ contact: {} }));
}
function updateProduct(req, res) {
    return res.json(JSend.success({ contact: {} }));
}
function deleteProduct(req, res) {
    return res.json(JSend.success());
}
function deleteAllProducts(req, res) {
    return res.json(JSend.success());
}

function createProduct(req, res) {
    return res.status(201).json({ product: {} });
}
function getProductsByFilter(req, res) {
    const filters = [];
    const { favorite, name } = req.query;
    if (favorite !== undefined) {
        filters.push(`favorite=${favorite}`);
    }
    if (name) {
        filters.push(`name=${name}`);
    }
    console.log(filters.join('&'));
    return res.json(JSend.success({ contact: {} }));
}


module.exports = {
    getProductsByFilter,
    deleteAllProducts,
    getProduct,
    createProduct,
    updateProduct,
    deleteProduct,
}