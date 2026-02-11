const { getUserInfo, registerUser } = require('./user_manager');

// 测试已知用户
console.log('测试已知用户 (Star):');
const starInfo = getUserInfo('ou_e3d4815bb54605113207ff0d0a9fd72e');
console.log(starInfo);

// 测试未知用户
console.log('\n测试未知用户:');
const unknownInfo = getUserInfo('ou_unknown123456789');
console.log(unknownInfo);