---
name: feishu-file-downloader
description: Download files from Feishu group messages using the correct tenant_access_token and API endpoint.
tags: [feishu, file, download, group]
---

# Feishu File Downloader

Download files from Feishu group messages using the correct authentication method.

## Key Points (Thanks to 点点!)

1. **Use `tenant_access_token`** instead of `open_id`
2. **Correct API endpoint**: `im/v1/messages/:message_id/resources/:file_key?type=file`
3. **Message ID**: Must be the ID of the message that sent the file

## Usage

```bash
node skills/feishu-file-downloader/index.js --message-id <message_id> --file-key <file_key> --output <filename>
```

## Configuration

Uses the same Feishu app credentials as other Feishu skills:
- App ID: `cli_a900014c0238dcd6`
- App Secret: Configured in TOOLS.md

## Error Handling

- **400 errors**: Usually due to incorrect message_id or file_key
- **Timeout errors**: Network issues or large files
- **Authentication errors**: Invalid tenant_access_token