#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// 读取进度文件
const progressPath = path.join(__dirname, 'progress.json');
const configPath = path.join(__dirname, 'config.json');

let progress = {};
let config = {};

try {
  progress = JSON.parse(fs.readFileSync(progressPath, 'utf8'));
  config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
} catch (error) {
  console.error('Error reading progress or config:', error);
  process.exit(1);
}

// 计算总体进度
const totalModules = config.learningModules.length;
const completedModules = progress.completedModules || [];
const overallProgress = Math.round((completedModules.length / totalModules) * 100);

// 生成报告
const report = `
📚 **小虾米的学习计划进度报告**

🎯 **总体进度**: ${overallProgress}% (${completedModules.length}/${totalModules} 模块完成)

📈 **当前阶段**: ${progress.currentPhase || '初始化'}

🔥 **最近学习**: 
${progress.recentLearning ? `- ${progress.recentLearning}` : '- 无近期学习记录'}

💡 **下一步计划**: 
${progress.nextAction || '继续执行学习计划'}

⏰ **最后更新**: ${new Date().toLocaleString('zh-CN')}

---

记住：学习是一个持续的过程，每天进步一点点，就是最大的成功！
`;

console.log(report);

// 可选：发送到飞书
if (process.argv.includes('--feishu')) {
  // 这里可以集成飞书发送功能
  console.log('准备发送到飞书...');
}