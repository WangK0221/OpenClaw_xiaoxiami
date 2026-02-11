#!/bin/bash
# 等待5分钟
sleep 300

# 删除5分钟测试任务
echo "删除5分钟测试任务..."
curl -s -X POST http://localhost:18789/ac2ba893/cron/remove \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer 22f16eb4bfc8dc03ab9a26b301790ebd" \
  -d '{"jobId":"95bc0984-bba9-4d4f-9211-64fcbed4f210"}'

# 删除自身
rm -f /home/admin/.openclaw/workspace/delete_test_task.sh

echo "5分钟测试任务已删除"