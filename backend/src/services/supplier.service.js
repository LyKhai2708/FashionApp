const knex = require('../database/knex');
const Paginator = require('./paginator');

function supplierRepository() {
    return knex('suppliers');
}

function readSupplier(payload) {
    return {
        name: payload.name,
        contact_name: payload.contact_name,
        email: payload.email,
        phone: payload.phone,
        address: payload.address,
        tax_code: payload.tax_code
    };
}

async function createSupplier(payload) {
    const supplier = readSupplier(payload);
    const [id] = await supplierRepository().insert(supplier);
    return { supplier_id: id, ...supplier };
}

async function getSuppliers(page = 1, limit = 10, search = '') {
    const paginator = new Paginator(page, limit);

    let result = await supplierRepository().where((builder) => {
        if (search) {
            builder.where('name', 'like', `%${search}%`)
                .orWhere('contact_name', 'like', `%${search}%`)
                .orWhere('email', 'like', `%${search}%`)
                .orWhere('phone', 'like', `%${search}%`);
        }
    }).select(
        knex.raw('count(supplier_id) OVER() AS recordCount'),
        'supplier_id',
        'name',
        'contact_name',
        'email',
        'phone',
        'address',
        'tax_code',
        'created_at',
        'updated_at'
    ).orderBy('created_at', 'desc')
        .limit(paginator.limit)
        .offset(paginator.offset);

    let totalRecords = 0;
    result = result.map((item) => {
        totalRecords = item.recordCount;
        delete item.recordCount;
        return item;
    });

    return {
        metadata: paginator.getMetadata(parseInt(totalRecords) || 0),
        suppliers: result
    };
}

async function getSupplierById(id) {
    return supplierRepository().where('supplier_id', id).select('*').first();
}

async function updateSupplier(id, payload) {
    const existingSupplier = await supplierRepository().where('supplier_id', id).first();
    if (!existingSupplier) {
        return null;
    }

    const supplier = readSupplier(payload);
    // Remove undefined fields
    Object.keys(supplier).forEach(key => supplier[key] === undefined && delete supplier[key]);

    await supplierRepository().where('supplier_id', id).update(supplier);
    return { ...existingSupplier, ...supplier };
}

async function deleteSupplier(id) {
    return supplierRepository().where('supplier_id', id).del();
}

module.exports = {
    createSupplier,
    getSuppliers,
    getSupplierById,
    updateSupplier,
    deleteSupplier
};
