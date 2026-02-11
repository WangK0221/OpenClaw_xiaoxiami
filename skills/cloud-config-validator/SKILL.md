# Cloud Configuration Validator

## Description
Validates and manages cloud provider API configurations to prevent runtime errors from missing or invalid API keys. Provides graceful fallbacks and clear error messages when configurations are incomplete.

## Capabilities
- Detects missing or placeholder API keys
- Validates API key formats before use
- Provides graceful fallbacks to alternative providers
- Generates clear configuration guidance for users
- Integrates with existing tool execution workflows

## Usage
The validator automatically runs before any cloud-dependent tool execution and provides appropriate feedback or fallback behavior.