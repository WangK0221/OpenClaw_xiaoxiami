# Cron Manager

Enhanced cron job management for OpenClaw with beautiful card-based output and duplicate detection.

## Features

- 📊 Card-based display of all cron jobs
- 🧹 Automatic duplicate detection and cleanup
- 📋 Smart grouping by job type (greetings, health, interaction, etc.)
- 🛠️ Command-line interface for easy management

## Usage

```bash
# List all cron jobs with card formatting
node skills/cron-manager/index.js list

# Clean duplicate jobs
node skills/cron-manager/index.js clean

# Get help
node skills/cron-manager/index.js
```

## Integration

This skill integrates with OpenClaw's built-in cron system and provides enhanced visualization and management capabilities.