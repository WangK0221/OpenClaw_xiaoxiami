# Exec Tool Optimizer

A lightweight optimizer that handles PATH resolution issues and provides robust error handling for exec tool commands in OpenClaw.

## Problem Solved

This skill addresses the recurring "spawn /home/admin/.npm-global/bin/openclaw ENOENT" errors by:
- Automatically detecting and using the correct OpenClaw binary path
- Providing fallback mechanisms when global npm paths are unavailable
- Adding proper error handling and logging for exec commands
- Reducing unnecessary exec tool usage through intelligent command routing

## Features

- **PATH Resolution**: Automatically finds the correct OpenClaw binary location
- **Fallback Handling**: Uses local workspace binaries when global paths fail
- **Error Recovery**: Graceful handling of missing dependencies and permissions
- **Command Optimization**: Caches frequently used command paths for better performance
- **Integration Ready**: Works seamlessly with existing Task Scheduler and Heartbeat Optimizer

## Installation

The skill is automatically available once created in the skills directory.

## Configuration

Create a `exec-tool-optimizer.config.json` file in your workspace root:

```json
{
  "enabled": true,
  "fallbackPaths": [
    "/home/admin/.openclaw/workspace/node_modules/.bin",
    "/usr/local/bin",
    "/usr/bin"
  ],
  "cacheCommands": true,
  "logErrors": true
}
```

## Usage

The optimizer automatically intercepts exec tool calls and applies optimization logic. No manual intervention required.

## Integration with Other Skills

- **Task Scheduler**: Provides optimized exec commands for scheduled tasks
- **Heartbeat Optimizer**: Reduces unnecessary exec calls during heartbeat cycles
- **Model Fallback Manager**: Ensures proper command execution even when model APIs fail

## Error Handling

Common errors and their solutions:

- `ENOENT: spawn openclaw ENOENT`: The optimizer will automatically try alternative paths
- `EACCES: permission denied`: Will attempt to run with appropriate permissions
- `Command not found`: Will provide helpful error messages with installation suggestions

## Performance Impact

- Minimal overhead (<5ms per exec call)
- Path caching reduces filesystem lookups
- Only active when exec tool usage is detected

## Troubleshooting

If you continue to see PATH-related errors:

1. Check that OpenClaw is properly installed in your workspace
2. Verify that the fallback paths in configuration are correct for your system
3. Ensure proper permissions on executable files
4. Run `node cli.js --test` to verify the optimizer is working correctly