const knex = require('../database/knex');


async function getUserAddresses(userId) {
    return await knex('user_addresses')
        .where('user_id', userId)
        .orderBy('is_default', 'desc')
        .orderBy('id', 'desc');
}


async function getDefaultAddress(userId) {
    return await knex('user_addresses')
        .where({ user_id: userId, is_default: true })
        .first();
}

/**
 * Get address by ID
 */
async function getAddressById(addressId, userId) {
    return await knex('user_addresses')
        .where({ id: addressId, user_id: userId })
        .first();
}

/**
 * Create new address
 */
async function createAddress(userId, addressData) {
    const { province, province_code, ward, ward_code, detail_address, is_default } = addressData;
    
    // If this is default address, unset other default addresses
    if (is_default) {
        await knex('user_addresses')
            .where('user_id', userId)
            .update({ is_default: false });
    }
    
    const [id] = await knex('user_addresses').insert({
        user_id: userId,
        province,
        province_code,
        ward,
        ward_code,
        detail_address,
        is_default: is_default || false
    });
    return await getAddressById(id, userId);
}


async function updateAddress(addressId, userId, addressData) {
    const { province, province_code, ward, ward_code, detail_address } = addressData;
    
    const address = await getAddressById(addressId, userId);
    if (!address) {
        throw new Error('Địa chỉ không tồn tại');
    }
    
    await knex('user_addresses')
        .where({ id: addressId, user_id: userId })
        .update({
            province,
            province_code,
            ward,
            ward_code,
            detail_address,
            updated_at: knex.fn.now()
        });
    
    return await getAddressById(addressId, userId);
}

/**
 * Delete address
 */
async function deleteAddress(addressId, userId) {
    const address = await getAddressById(addressId, userId);
    if (!address) {
        throw new Error('Địa chỉ không tồn tại');
    }
    
    await knex('user_addresses')
        .where({ id: addressId, user_id: userId })
        .delete();
    
    return true;
}

/**
 * Set default address
 */
async function setDefaultAddress(addressId, userId) {
    const address = await getAddressById(addressId, userId);
    if (!address) {
        throw new Error('Địa chỉ không tồn tại');
    }
    
    // Unset all default addresses
    await knex('user_addresses')
        .where('user_id', userId)
        .update({ is_default: false });
    
    // Set this as default
    await knex('user_addresses')
        .where({ id: addressId, user_id: userId })
        .update({ is_default: true, updated_at: knex.fn.now() });
    
    return await getAddressById(addressId, userId);
}

module.exports = {
    getUserAddresses,
    getDefaultAddress,
    getAddressById,
    createAddress,
    updateAddress,
    deleteAddress,
    setDefaultAddress
};
