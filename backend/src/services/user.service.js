const knex = require('../database/knex');
const Paginator = require('./paginator');
function usersRepository() {
    return knex('users');
}

function readUser(payload) {
    return {
        user_id: payload.user_id,
        username: payload.username,
        password: payload.password,
        email: payload.email,
        phone: payload.phone,
        role: payload.role,
    };
}

async function getUserById(id) {
    return usersRepository().where('user_id', id)
    .join('user_addresses', 'users.user_id', 'user_addresses.user_id')
    .select('*').first();
}

async function getManyUsers(query){
    const { page = 1, limit = 10, name, email, phone, role, del_flag} = query
    const paginator = new Paginator(page, limit);
    let results = await usersRepository()
        .where((builder) => {
            if (name) {
                builder.where('name', 'like', `%${name}%`);
            }
            if (email) {
                builder.where('email', 'like', `%${email}%`);
            }
            if (phone) {
                builder.where('phone', 'like', `%${phone}%`);
            }
            if (role) {
                builder.where('role', role);
            }
            if (del_flag) {
                builder.where('del_flag', del_flag);
            }
        })
        .select(
            knex.raw('count(user_id) OVER() AS recordCount'),
            'user_id',
            'username',
            'email',
            'phone',
            'role',
            'del_flag'
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
        users: results,
    };
}
async function createUser(payload) {
    const user = readUser(payload);
    const [id] = await usersRepository().insert(user);
    return { id, ...user };
}

async function updateUser(id, payload) {
    const existingUser = await getUserById(id);
    if (!existingUser) return null;
    const user = readUser(payload);
    await usersRepository().where({ user_id: id }).update(user);
    return { ...existingUser, ...user };
}

async function deleteUser(id) {
    const existingUser = await getUserById(id);
    if (!existingUser) return null;
  
    // soft delete
    await usersRepository().where({ user_id: id }).update({ del_flag: 1 });
  
    return existingUser;
}

module.exports = {
    getUserById,
    getManyUsers,
    updateUser,
    deleteUser,
};