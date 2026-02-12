# Model Fallback Manager

A robust model selection and fallback system that handles authentication failures and provides graceful degradation to available models.

## Purpose
- Detect and handle model provider authentication failures
- Automatically fallback to working models when primary providers fail
- Prevent system crashes due to model discovery errors
- Provide clear error logging for debugging

## Integration
This skill integrates with OpenClaw's model selection system and provides automatic fallback capabilities.