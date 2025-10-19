const knex = require('../database/knex');
const Paginator = require('./paginator');
const bcrypt = require('bcrypt');
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
    return usersRepository()
    .where('users.user_id', id)
    .select('*')
    .first();
}

async function getManyUsers(query){
    const { page = 1, limit = 10, name, email, phone, role, is_active} = query
    const paginator = new Paginator(page, limit);
    let results = await usersRepository()
        .where((builder) => {
            if (name) {
                builder.where('username', 'like', `%${name}%`);
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
            if (is_active !== undefined) {
                builder.where('is_active', is_active);
            }
        })
        .select(
            knex.raw('count(user_id) OVER() AS recordCount'),
            'user_id',
            'username',
            'email',
            'phone',
            'role',
            'is_active',
            'created_at'
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
  
    await usersRepository().where({ user_id: id }).update({ is_active: 0 });
  
    return existingUser;
}

async function changePassword(id, currentPassword, newPassword) {
    
    const user = await usersRepository()
        .where('user_id', id)
        .where('is_active', 1)
        .first();
    
    if (!user) {
        throw new Error('Người dùng không tồn tại');
    }
    try{
        const isValidPassword = await bcrypt.compare(currentPassword, user.password);
        if (!isValidPassword) {
            throw new Error('Mật khẩu hiện tại không đúng');
        }
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await usersRepository()
        .where({ user_id: id })
        .update({ password: hashedPassword });
        return { message: 'Đổi mật khẩu thành công' };
    }catch(error){
        throw error;
    }
}

module.exports = {
    getUserById,
    getManyUsers,
    updateUser,
    deleteUser,
    changePassword
};