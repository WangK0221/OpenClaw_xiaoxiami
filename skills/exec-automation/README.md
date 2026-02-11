# Exec Automation Skill

This skill provides intelligent automation for repeated exec and write tool usage patterns.

## Features

- **Pattern Detection**: Automatically identifies recurring exec/write sequences
- **Workflow Automation**: Creates reusable workflows from detected patterns  
- **Cloud Provider Integration**: Graceful handling of missing API keys with fallbacks
- **Validation**: Built-in validation for generated commands and file operations

## Usage

The skill automatically activates when it detects repeated tool usage patterns. No manual intervention required.

## Configuration

Configure cloud provider API keys in your `.env` file:
- `GEMINI_API_KEY=your_key_here`
- `ELEVENLABS_API_KEY=your_key_here`

The skill will provide graceful fallbacks when keys are missing or invalid.