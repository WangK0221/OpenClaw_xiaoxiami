# Alibaba Cloud Configuration Validator

A repair skill that validates Alibaba Cloud configuration and provides graceful fallbacks when credentials are missing or invalid.

## Purpose
This skill addresses recurring "401 Unauthorized" and "404 Not Found" errors when discovering Alibaba Cloud models by:
- Validating Alibaba Cloud API credentials
- Providing clear error messages for missing configuration
- Implementing graceful fallback to alternative models
- Preventing system crashes due to authentication failures

## Integration
Automatically integrates with OpenClaw's model discovery system and provides validation during startup.