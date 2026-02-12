# Tool Path Resolver

A lightweight utility that resolves PATH issues for executable tools, ensuring commands can be found regardless of the execution environment.

## Problem Solved

This skill addresses the recurring "spawn /home/admin/.npm-global/bin/openclaw ENOENT" errors by providing intelligent PATH resolution that:

- Searches multiple common installation locations
- Falls back to system-wide PATH search
- Caches resolved paths for performance
- Provides clear error messages when tools cannot be found

## Features

- **Multi-location Search**: Checks npm global bins, local node_modules, system PATH, and common installation directories
- **Intelligent Caching**: Caches resolved paths to avoid repeated filesystem searches
- **Graceful Fallbacks**: Provides alternative execution methods when primary paths fail
- **Error Diagnostics**: Clear error reporting with suggested fixes
- **Lightweight**: Minimal overhead with efficient path resolution algorithms

## Usage

### As a Library
```javascript
const { resolveToolPath } = require('./pathResolver');

// Resolve a tool path
const openclawPath = await resolveToolPath('openclaw');
if (openclawPath) {
  // Use the resolved path
  const result = await exec(openclawPath + ' --version');
} else {
  console.error('openclaw not found in any expected location');
}
```

### Command Line
```bash
# Resolve and execute a command
node cli.js --tool openclaw --args "--version"

# Just resolve the path
node cli.js --resolve openclaw
```

## Configuration

Create a `tool-path-resolver.config.json` file in your workspace root:

```json
{
  "searchPaths": [
    "/home/admin/.npm-global/bin",
    "/usr/local/bin",
    "/usr/bin",
    "./node_modules/.bin"
  ],
  "cacheEnabled": true,
  "cacheTtlMs": 300000,
  "fallbackToSystemPath": true
}
```

## Integration

The Tool Path Resolver integrates seamlessly with existing exec-based workflows and can be used as a drop-in replacement for direct command execution.

## Error Handling

When a tool cannot be found, the resolver provides detailed error information including:
- All paths that were searched
- Permission issues encountered
- Suggestions for installation or PATH configuration

This eliminates the cryptic "ENOENT" errors and provides actionable feedback for system administrators.