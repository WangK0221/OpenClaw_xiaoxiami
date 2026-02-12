# Model Fallback Manager

A robust model management system that handles authentication failures and provides automatic fallback to available models.

## Problem Solved

This skill addresses recurring errors like:
- "Failed to discover Alibaba Cloud models: 401 Unauthorized"
- "Failed to discover Alibaba Cloud models: 404 Not Found"
- Model discovery failures due to missing or invalid credentials

Instead of crashing or failing silently, the system now gracefully falls back to available models with proper error handling.

## Features

- **Automatic Credential Detection**: Checks for missing API keys and authentication tokens
- **Intelligent Fallback**: Automatically switches to available models when primary models fail
- **Graceful Degradation**: Maintains system functionality even when primary providers are unavailable
- **Clear Error Reporting**: Provides actionable error messages for debugging
- **Configurable Priority**: Allows setting model priority order in configuration
- **Health Monitoring**: Continuously monitors model availability and performance

## Configuration

Create a `model-fallback.config.json` file in your workspace root:

```json
{
  "modelPriority": [
    "alibaba-cloud/qwen3-max-2026-01-23",
    "google/gemini-2.0-flash-001"
  ],
  "fallbackTimeoutMs": 5000,
  "healthCheckInterval": 300000,
  "enableLogging": true
}
```

## Integration

The Model Fallback Manager integrates seamlessly with OpenClaw's existing model system:

1. **Automatic Loading**: The manager loads during OpenClaw startup
2. **Transparent Operation**: No changes needed to existing code - works behind the scenes
3. **Fallback Chain**: When a model fails, it automatically tries the next in priority order
4. **Persistent State**: Remembers which models are working and prioritizes them

## Usage

### CLI Commands

```bash
# Check current model status
node skills/model-fallback-manager/cli.js --status

# Test model connectivity
node skills/model-fallback-manager/cli.js --test

# Reset fallback state
node skills/model-fallback-manager/cli.js --reset

# Generate configuration template
node skills/model-fallback-manager/cli.js --init
```

## Error Handling

When model discovery fails, the system will:

1. Log the specific error (401, 404, timeout, etc.)
2. Attempt to use the next model in the priority list
3. If all models fail, fall back to embedded mode
4. Continue monitoring for model recovery

## Benefits

- **Improved Reliability**: System continues working even when primary models are unavailable
- **Better User Experience**: No more cryptic authentication errors
- **Reduced Maintenance**: Automatic handling of credential issues
- **Performance Optimization**: Caches working model configurations for faster startup

## Compatibility

- Works with all OpenClaw model providers (Alibaba Cloud, Google, OpenAI, etc.)
- Compatible with existing OpenClaw configuration
- No breaking changes to existing workflows