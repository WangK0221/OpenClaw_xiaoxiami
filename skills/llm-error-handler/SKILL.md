# LLM Error Handler

A robust error handling and fallback system for LLM API calls that provides graceful degradation and automatic retry mechanisms.

## Features
- Automatic detection and handling of common LLM API errors (400, 429, 500, etc.)
- Intelligent retry with exponential backoff
- Fallback to alternative models when primary model fails
- Detailed error logging for debugging
- Configurable error tolerance thresholds

## Integration
This skill automatically integrates with the existing OpenClaw agent system and requires no manual configuration changes.