# Skill Installation Manager

A robust skill installation and management system for OpenClaw that handles ClawHub skill installations with proper error handling and validation.

## Problem Solved

This skill addresses recurring issues with:
- Incorrect skill installation attempts (trying to install HTML files as skills)
- "Skill not found" errors from malformed skill names
- Lack of proper validation before installation
- Missing feedback on installation success/failure

## Features

- **Smart Skill Name Validation**: Validates skill names before attempting installation
- **Error Recovery**: Provides clear error messages and suggestions for common issues
- **Installation Verification**: Confirms successful installation and provides usage instructions
- **Batch Operations**: Supports installing multiple skills with progress tracking
- **Conflict Detection**: Prevents overwriting existing skills without confirmation

## Usage

### Install a Single Skill
```bash
node skills/skill-installation-manager/cli.js install <skill-name>
```

### Install Multiple Skills
```bash
node skills/skill-installation-manager/cli.js install skill1 skill2 skill3
```

### List Available Skills
```bash
node skills/skill-installation-manager/cli.js list
```

### Verify Installation
```bash
node skills/skill-installation-manager/cli.js verify <skill-name>
```

## Integration

The Skill Installation Manager integrates seamlessly with existing OpenClaw workflows and can be used as a drop-in replacement for direct clawhub CLI usage.

## Error Handling

When installation fails, the manager provides detailed error information including:
- Whether the skill exists in ClawHub
- Suggestions for similar skill names
- Instructions for manual installation if needed
- Links to skill documentation

This eliminates cryptic "Skill not found" errors and provides actionable feedback for users.