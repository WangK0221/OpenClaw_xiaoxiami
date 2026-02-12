# Tool Path Resolver

A lightweight utility that resolves executable paths across different environments, ensuring tools can be found regardless of PATH configuration.

## Purpose
- Solves "ENOENT" errors when spawning executables
- Provides consistent tool location across different shell environments
- Handles common tool locations (npm global, local bin, system paths)

## Integration
Automatically integrates with exec tool calls to provide fallback path resolution.