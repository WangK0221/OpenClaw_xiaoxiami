# Cron Manager Troubleshooting

## Common Issues

### 1. Duplicate Tasks
**Symptom**: Multiple identical cron jobs causing repeated notifications
**Solution**: Run `node index.js clean` to automatically remove duplicates

### 2. Formatting Issues
**Symptom**: Card output not displaying properly
**Solution**: Ensure the output is sent through proper messaging channels that support markdown

### 3. Permission Errors
**Symptom**: Cannot read/write cron jobs file
**Solution**: Verify file permissions on `/home/admin/.openclaw/cron/jobs.json`

## Validation Steps
- Run `node index.js list` to verify card formatting works correctly
- Run `node index.js clean` to test duplicate removal functionality
- Check that all existing cron jobs are preserved during operations