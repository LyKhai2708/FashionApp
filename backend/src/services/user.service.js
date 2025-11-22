const knex = require('../database/knex');
const Paginator = require('./paginator');
const bcrypt = require('bcrypt');
function usersRepository() {
    return knex('users');
}

function readUser(payload) {
    const user = {
        user_id: payload.user_id,
        username: payload.username,
        password: payload.password,
        email: payload.email,
        phone: payload.phone,
        is_active: payload.is_active,
        birth_date: payload.birth_date,
        gender: payload.gender,
    };

    Object.keys(user).forEach(key => {
        if (user[key] === undefined) {
            delete user[key];
        }
    });

    return user;
}

async function getUserById(id) {
    const user = await knex('users')
        .leftJoin('user_roles', 'users.user_id', 'user_roles.user_id')
        .leftJoin('roles', 'user_roles.role_id', 'roles.role_id')
        .where('users.user_id', id)
        .select(
            'users.*',
            'roles.role_name as role'
        )
        .first();

    if (user) {
        user.has_password = user.password !== null && user.password !== undefined;
        delete user.password;
    }

    return user;
}

async function getManyUsers(query) {
    const { page = 1, limit = 10, name, email, phone, role, is_active } = query
    const paginator = new Paginator(page, limit);
    let results = await knex('users')
        .leftJoin('user_roles', 'users.user_id', 'user_roles.user_id')
        .leftJoin('roles', 'user_roles.role_id', 'roles.role_id')
        .where((builder) => {
            if (name) {
                builder.where('users.username', 'like', `%${name}%`);
            }
            if (email) {
                builder.where('users.email', 'like', `%${email}%`);
            }
            if (phone) {
                builder.where('users.phone', 'like', `%${phone}%`);
            }
            if (role) {
                builder.where('roles.role_name', role);
            }
            if (is_active !== undefined) {
                builder.where('users.is_active', is_active);
            }
        })
        .select(
            knex.raw('count(users.user_id) OVER() AS recordCount'),
            'users.user_id',
            'users.username',
            'users.email',
            'users.phone',
            'roles.role_name as role',
            'users.is_active',
            'users.created_at'
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

async function createUser(payload, roleId = null) {
    const user = readUser(payload);

    // Hash password nếu có
    if (user.password) {
        user.password = await bcrypt.hash(user.password, 10);
    }

    return await knex.transaction(async (trx) => {
        // Tạo user
        const [userId] = await trx('users').insert(user);

        // Gán role nếu có
        if (roleId) {
            await trx('user_roles').insert({
                user_id: userId,
                role_id: roleId,
                assigned_by: null
            });
        }

        const newUser = await trx('users')
            .where('user_id', userId)
            .select('user_id', 'username', 'email', 'phone', 'is_active', 'created_at')
            .first();

        return newUser;
    });
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
    try {
        const isValidPassword = await bcrypt.compare(currentPassword, user.password);
        if (!isValidPassword) {
            throw new Error('Mật khẩu hiện tại không đúng');
        }
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await usersRepository()
            .where({ user_id: id })
            .update({ password: hashedPassword });
        return { message: 'Đổi mật khẩu thành công' };
    } catch (error) {
        throw error;
    }
}

async function getUserRole(userId) {
    const result = await knex('user_roles')
        .join('roles', 'user_roles.role_id', 'roles.role_id')
        .where('user_roles.user_id', userId)
        .select(
            'roles.role_id',
            'roles.role_name',
            'roles.display_name',
            'roles.description',
            'user_roles.assigned_at',
            'user_roles.assigned_by'
        )
        .first();

    return result || null;
}


async function updateUserRole(userId, roleId, assignedBy) {
    return await knex.transaction(async (trx) => {
        // Xóa tất cả roles cũ
        await trx('user_roles')
            .where('user_id', userId)
            .delete();

        // Thêm role mới
        await trx('user_roles').insert({
            user_id: userId,
            role_id: roleId,
            assigned_by: assignedBy,
            assigned_at: knex.fn.now()
        });

        return true;
    });
}

module.exports = {
    getUserById,
    getManyUsers,
    createUser,
    updateUser,
    deleteUser,
    changePassword,
    getUserRole,
    updateUserRole
};