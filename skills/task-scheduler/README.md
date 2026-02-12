# Task Scheduler Skill

A lightweight recurring task manager for OpenClaw that integrates with the HEARTBEAT.md system for efficient background operations.

## Features

- **Interval-based scheduling**: Run tasks every N seconds/minutes
- **Cron-like scheduling**: Schedule tasks at specific times (hour/minute patterns)
- **State persistence**: Tracks last execution time to avoid duplicate runs
- **Error handling**: Graceful failure handling with detailed logging
- **CLI interface**: Easy command-line integration
- **HEARTBEAT.md integration**: Can be called from heartbeat routines

## Configuration

Tasks are stored in `tasks.json` with the following structure:

```json
{
  "version": "1.0.0",
  "tasks": [
    {
      "id": "task_123456789",
      "name": "heartbeat-memory-sync",
      "enabled": true,
      "command": "node memory_bridge.js",
      "workdir": "/home/admin/.openclaw/workspace",
      "timeout": 30000,
      "schedule": {
        "type": "interval",
        "interval": 1800
      }
    }
  ]
}
```

### Schedule Types

#### Interval
```json
{
  "type": "interval",
  "interval": 1800
}
```
Runs every 1800 seconds (30 minutes).

#### Cron-like
```json
{
  "type": "cron",
  "hour": 8,
  "minute": 30
}
```
Runs daily at 8:30 AM.

## Usage

### CLI Commands

- `node cli.js --run`: Execute all scheduled tasks (default)
- `node cli.js --list`: List all configured tasks

### Integration with HEARTBEAT.md

Add this line to your HEARTBEAT.md file:
```bash
node skills/task-scheduler/cli.js --run
```

## API

The scheduler can also be used programmatically:

```javascript
const TaskScheduler = require('./scheduler');

const scheduler = new TaskScheduler();
await scheduler.runScheduledTasks();
```

## Error Handling

- Failed tasks are logged but don't stop other tasks from running
- Task state is only updated on successful execution
- Timeout defaults to 30 seconds but can be configured per task

## License

MIT License - Part of the OpenClaw ecosystem.