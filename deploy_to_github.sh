#!/bin/bash

# 自动部署到GitHub脚本
# 在每次进化循环后自动执行

set -e

echo "🚀 开始自动部署到GitHub..."

# 获取当前时间
TIMESTAMP=$(date +"%Y-%m-%d %H:%M:%S")
BRANCH="main"

# 检查是否有git仓库
if [ ! -d .git ]; then
    echo "❌ 未找到git仓库"
    exit 1
fi

# 添加所有更改
git add .

# 检查是否有更改需要提交
if ! git diff --cached --quiet; then
    # 创建提交消息
    COMMIT_MSG="🤖 自动进化更新 - $TIMESTAMP"
    
    # 如果有具体的进化信息，添加到提交消息中
    if [ -f "skills/evolver/memory/evolution_state.json" ]; then
        LAST_CYCLE=$(cat skills/evolver/memory/evolution_state.json | jq -r '.last_cycle // "unknown"' 2>/dev/null || echo "unknown")
        if [ "$LAST_CYCLE" != "null" ] && [ "$LAST_CYCLE" != "unknown" ]; then
            COMMIT_MSG="🤖 自动进化更新 - Cycle #$LAST_CYCLE - $TIMESTAMP"
        fi
    fi
    
    # 提交更改
    git commit -m "$COMMIT_MSG"
    
    # 推送到GitHub
    echo "📤 推送更新到GitHub..."
    git push origin $BRANCH
    
    echo "✅ 部署成功！更新已推送到GitHub"
else
    echo "ℹ️  没有检测到更改，跳过部署"
fi

echo "✨ 部署完成"