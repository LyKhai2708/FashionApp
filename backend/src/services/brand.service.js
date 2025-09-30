const knex = require('../database/knex');
const Paginator = require('./paginator');
function brandRepository() {
    return knex('brand');
}

function readBrand(payload) {
    return {
        name: payload.name,
        active: payload.active,
    }
}
async function checkBrandName(name) {
    return brandRepository().where('name', name).select('*').first();
}
async function createBrand(payload) {
    const brand = readBrand(payload);
    const [id] = await brandRepository().insert(brand);
    return { id, ...brand };
}

async function getManyBrands(query) {
    const {name, active, page = 1, limit = 5} = query;
    const paginator = new Paginator(page, limit);

    let result = await brandRepository().where((builder) => {
        if (name) {
            builder.where('name', 'like', `%${name}%`);
        }
        if (active !== undefined) {
            builder.where('active', active == '1' || active == 'true' ? 1 : 0);
        }
    }).select(
        knex.raw('count(id) OVER() AS recordCount'),
        'id',
        'name',
        'active',
        'created_at',
    ).limit(paginator.limit)
    .offset(paginator.offset);

    let totalRecords = 0;
    const results = result.map((item) => {
        totalRecords = item.recordCount;
        delete item.recordCount;
        return item;
    });
    return {
        metadata: paginator.getMetadata(totalRecords),
        brands: results,
    };
}

async function getBrandById(id) {
    return brandRepository().where('id', id).select('*').first();
}
async function getActiveBrands(){
    return brandRepository().where('active', 1).select('*');
}
async function updateBrand(id, payload) {
    const existingBrand = await brandRepository().where('id', id).select('*').first();
    if (!existingBrand) {
        return null;
    }
    const brand = readBrand(payload);
    await brandRepository().where('id', id).update(brand);
    return { ...existingBrand, ...brand };
}

async function deleteBrand(id) {
    return brandRepository().where({ id: id }).del();
}

async function deleteAllBrands() {
    return brandRepository().del();
}

module.exports = {
    checkBrandName,
    createBrand,
    getManyBrands,
    getBrandById,
    getActiveBrands,
    updateBrand,
    deleteBrand,
    deleteAllBrands,
};