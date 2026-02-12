# LLM Error Handler

A robust error handling and fallback system for Large Language Model API calls, specifically designed to handle common errors like 400 "GenerateContent" errors from Google Gemini and other LLM providers.

## Features

- **Automatic Error Detection**: Identifies common LLM API error patterns including 400, 429, 500+ errors
- **Intelligent Retries**: Implements exponential backoff with jitter for transient failures
- **Content Sanitization**: Automatically cleans input content that may cause validation errors
- **Fallback Mechanisms**: Provides graceful degradation when primary LLM fails
- **Rate Limiting Protection**: Prevents hitting API rate limits through intelligent queuing
- **Context Preservation**: Maintains conversation context across retries and fallbacks

## Problem Solved

This skill addresses recurring "LLM ERROR] {"error":{"message":"{\n \"error\": {\n \"code\": 400,\n \"message\": \"* GenerateContent" errors that occur when:
- Input content contains invalid characters or formatting
- Token limits are exceeded
- Rate limits are hit
- Temporary API unavailability occurs

## Usage

The LLM Error Handler integrates automatically with OpenClaw's agent system. Simply install the skill and it will intercept and handle LLM API calls transparently.

### Configuration

Create a `llm-error-handler.config.json` file in your workspace root:

```json
{
  "enabled": true,
  "maxRetries": 3,
  "baseDelayMs": 1000,
  "maxDelayMs": 10000,
  "sanitizeInput": true,
  "fallbackToSimplerModel": true,
  "logErrors": true
}
```

### Environment Variables

- `LLM_ERROR_HANDLER_ENABLED` - Set to "false" to disable the handler
- `LLM_ERROR_HANDLER_MAX_RETRIES` - Override maximum retry attempts
- `LLM_ERROR_HANDLER_LOG_LEVEL` - Set logging level (debug, info, warn, error)

## Integration

The error handler works by wrapping the standard LLM API calls in OpenClaw. It automatically:
1. Detects error patterns in API responses
2. Applies appropriate sanitization to input content
3. Implements retry logic with exponential backoff
4. Falls back to alternative models if available
5. Logs detailed error information for debugging

## Error Handling Strategy

### 400 Errors (Bad Request)
- **Cause**: Invalid input content, token limit exceeded, malformed requests
- **Solution**: Content sanitization, token truncation, request validation

### 429 Errors (Rate Limited) 
- **Cause**: Too many requests in short time period
- **Solution**: Exponential backoff with jitter, request queuing

### 500+ Errors (Server Errors)
- **Cause**: Temporary server issues, maintenance, timeouts
- **Solution**: Retry with backoff, fallback to alternative endpoints

## Testing

Run the integration test to verify functionality:

```bash
node test-integration.js
```

## Dependencies

- None - uses only Node.js built-in modules
- Compatible with all OpenClaw LLM providers

## License

MIT License - see LICENSE file for details.