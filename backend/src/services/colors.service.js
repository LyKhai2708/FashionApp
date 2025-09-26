const knex = require('../database/knex');
const Paginator = require('./paginator');
function colorsRepository() {
    return knex('colors');
}

function readColor(payload) {
    return {
        name: payload.name,
        hex_code: payload.hex_code,
    };
}


async function createColor(payload) {
    const color = readColor(payload);
    const [color_id] = await colorsRepository().insert(color);
    return { color_id, ...color };
}

async function getColorByName(name, color_id = null) {
  const query = colorsRepository()
    .whereRaw('LOWER(name) = LOWER(?)', [name]);
  
  if (color_id) {
    query.andWhere('color_id', '!=', color_id);
  }

  return query.first();
}

async function getManyColors(query) {
    const { name, page = 1, limit = 5  } = query;
    const paginator = new Paginator(page, limit);
    let results = await colorsRepository()
        .where((builder) => {
            if (name) {
                builder.where('name', 'like', `%${name}%`);
            }
        })
        .select(
            knex.raw('count(color_id) OVER() AS recordCount'),
            'color_id',
            'name',
            'hex_code'
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
        colors: results,
    };
}


async function getColorById(id) {
    return colorsRepository().where('color_id', id).select('*').first();
}


async function updateColor(id, payload) {
    const existingColor = await colorsRepository().where('color_id', id).select('*').first();
    if (!existingColor) {
        return null;
    }

    const updatedColor = readColor(payload);
    await colorsRepository().where('color_id', id).update(updatedColor);
    
    return { ...existingColor, ...updatedColor };
}


async function deleteColor(id) {
    const color = await colorsRepository().where('color_id', id).select('*').first();
    if (!color) {
        return null;
    }

    await colorsRepository().where('color_id', id).del();
    return color;
}

//Delete all users
async function deleteAllColors() {
    await colorsRepository().del();
}

module.exports = {
    getColorByName,
    createColor,
    getManyColors,
    getColorById,
    updateColor,
    deleteColor,
    deleteAllColors,
};