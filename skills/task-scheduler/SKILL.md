# Task Scheduler Skill

A lightweight task scheduler that integrates with OpenClaw's heartbeat system to automatically execute recurring tasks without manual intervention.

## Features
- Define recurring tasks in a simple JSON format
- Automatic execution based on schedule patterns
- Integration with existing HEARTBEAT.md workflow
- Minimal resource usage with efficient polling

## Usage
1. Create `tasks.json` in your workspace root
2. Define your tasks with command and schedule
3. The scheduler will automatically run during heartbeat cycles

## Task Format
```json
{
  "tasks": [
    {
      "id": "unique-task-id",
      "name": "Task Name",
      "command": "node memory_bridge.js",
      "schedule": "every_5m",
      "enabled": true
    }
  ]
}
```

## Schedule Patterns
- `every_5m` - Every 5 minutes
- `every_15m` - Every 15 minutes  
- `every_30m` - Every 30 minutes
- `hourly` - Once per hour
- `daily` - Once per day