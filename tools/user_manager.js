const fs = require('fs');
const path = require('path');

// 用户数据库文件路径
const USER_DB_PATH = path.join(__dirname, '..', 'users.json');

// 确保用户数据库文件存在
function ensureUserDB() {
    if (!fs.existsSync(USER_DB_PATH)) {
        fs.writeFileSync(USER_DB_PATH, JSON.stringify({}, null, 2));
    }
}

// 获取用户信息
function getUserInfo(openId) {
    ensureUserDB();
    const users = JSON.parse(fs.readFileSync(USER_DB_PATH, 'utf8'));
    return users[openId] || null;
}

// 注册新用户
function registerUser(openId, name, alias = '', role = '', notes = '') {
    ensureUserDB();
    const users = JSON.parse(fs.readFileSync(USER_DB_PATH, 'utf8'));
    
    users[openId] = {
        name: name,
        alias: alias || name,
        role: role,
        notes: notes,
        registeredAt: new Date().toISOString()
    };
    
    fs.writeFileSync(USER_DB_PATH, JSON.stringify(users, null, 2));
    return users[openId];
}

// 更新用户信息
function updateUser(openId, updates) {
    ensureUserDB();
    const users = JSON.parse(fs.readFileSync(USER_DB_PATH, 'utf8'));
    
    if (users[openId]) {
        users[openId] = { ...users[openId], ...updates };
        fs.writeFileSync(USER_DB_PATH, JSON.stringify(users, null, 2));
        return users[openId];
    }
    
    return null;
}

// 获取所有用户
function getAllUsers() {
    ensureUserDB();
    return JSON.parse(fs.readFileSync(USER_DB_PATH, 'utf8'));
}

// 导出函数
module.exports = {
    getUserInfo,
    registerUser,
    updateUser,
    getAllUsers
};