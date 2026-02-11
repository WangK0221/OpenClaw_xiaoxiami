# Exec Automation Skill

## Description
Automatically detects and optimizes repeated `exec` tool usage patterns to reduce redundancy and improve efficiency.

## Capabilities
- Monitors exec command patterns across sessions
- Creates reusable command templates for common operations  
- Provides intelligent command suggestions based on context
- Reduces manual repetition of common shell operations
- Integrates with the evolver's pattern detection system

## Usage
This skill runs automatically in the background and enhances the main agent's exec tool usage without requiring explicit invocation.

## Configuration
- `EXEC_AUTO_THRESHOLD`: Minimum repeat count before automation (default: 3)
- `EXEC_TEMPLATE_DIR`: Directory for storing command templates (default: ~/.openclaw/exec_templates)
- `EXEC_LEARNING_ENABLED`: Enable/disable learning mode (default: true)

## Integration
Works seamlessly with existing OpenClaw tool system and requires no changes to user workflows.