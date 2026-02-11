# HEARTBEAT.md - 启用定时任务触发和记忆持久化

# 这个文件的存在会启用心跳机制，确保定时任务能够正常触发
# 检查定时任务状态并触发系统事件

## 记忆持久化
- 执行 memory_bridge.js 脚本来同步记忆到 RECENT_EVENTS.md
- 命令: node memory_bridge.js

## 学习计划执行
- 执行学习计划评估和进度更新
- 命令: node skills/learning-plan/execute_plan.js

## GitHub自动部署
- 检查是否有新的进化变更
- 自动提交并推送到GitHub
- 命令: ./deploy_to_github.sh