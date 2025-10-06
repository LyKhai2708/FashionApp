const knex = require('../database/knex');
const Paginator = require('./paginator');
function sizesRepository() {
    return knex('sizes');
}

function readSize(payload) {
    return {
        name: payload.name,
    };
}


async function createSize(payload) {
    const size = readSize(payload);
    const [size_id] = await sizesRepository().insert(size);
    return { size_id, ...size };
}

async function getSizeByName(name, size_id = null) {
  const query = sizesRepository()
    .whereRaw('LOWER(name) = LOWER(?)', [name]);
  
  if (size_id) {
    query.andWhere('size_id', '!=', size_id);
  }

  return query.first();
}

async function getManySizes(query) {
    const { name, page = 1, limit = 100  } = query;
    const paginator = new Paginator(page, limit);
    let results = await sizesRepository()
        .where((builder) => {
            if (name) {
                builder.where('name', 'like', `%${name}%`);
            }
        })
        .orderBy('name', 'asc')
        .select(
            knex.raw('count(size_id) OVER() AS recordCount'),
            'size_id',
            'name'
        )
        .limit(paginator.limit)
        .offset(paginator.offset);
    let totalRecords = 0;
    results = results.map((result) => {
        totalRecords = result.recordCount;
        delete result.recordCount;
        return result;
    });
    return {       
        metadata: paginator.getMetadata(totalRecords),
        sizes: results,
    };
}


async function getSizeById(id) {
    return sizesRepository().where('size_id', id).select('*').first();
}


async function updateSize(id, payload) {
    const existingSize = await sizesRepository().where('size_id', id).select('*').first();
    if (!existingSize) {
        return null;
    }

    const updatedSize = readSize(payload);
    await sizesRepository().where('size_id', id).update(updatedSize);
    
    return { ...existingSize, ...updatedSize };
}


async function deleteSize(id) {
    const size = await sizesRepository().where('size_id', id).select('*').first();
    if (!size) {
        return null;
    }

    await sizesRepository().where('size_id', id).del();
    return size;
}

//Delete all users
async function deleteAllSizes() {
    await sizesRepository().del();
}

module.exports = {
    getSizeByName,
    createSize,
    getManySizes,
    getSizeById,
    updateSize,
    deleteSize,
    deleteAllSizes,
};