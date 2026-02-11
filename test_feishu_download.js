#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// 读取飞书配置
const feishuConfig = {
  appId: 'cli_a900014c0238dcd6',
  appSecret: 'd6eDcC1g05gvsXXFp0x5efr1dJZ7WzNn'
};

async function getTenantAccessToken() {
  try {
    const response = await fetch('https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8'
      },
      body: JSON.stringify({
        app_id: feishuConfig.appId,
        app_secret: feishuConfig.appSecret
      })
    });
    
    const data = await response.json();
    if (data.code === 0) {
      return data.tenant_access_token;
    } else {
      throw new Error(`Failed to get tenant access token: ${data.msg}`);
    }
  } catch (error) {
    console.error('Error getting tenant access token:', error);
    throw error;
  }
}

async function downloadFile(messageId, fileKey, outputPath) {
  try {
    const token = await getTenantAccessToken();
    const url = `https://open.feishu.cn/open-apis/im/v1/messages/${messageId}/resources/${fileKey}?type=file`;
    
    console.log('Downloading file from:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const buffer = await response.arrayBuffer();
    fs.writeFileSync(outputPath, Buffer.from(buffer));
    
    console.log(`File downloaded successfully to: ${outputPath}`);
    return outputPath;
  } catch (error) {
    console.error('Error downloading file:', error);
    throw error;
  }
}

// 如果直接运行这个脚本，进行测试
if (require.main === module) {
  if (process.argv.length < 4) {
    console.log('Usage: node test_feishu_download.js <message_id> <file_key>');
    process.exit(1);
  }
  
  const messageId = process.argv[2];
  const fileKey = process.argv[3];
  const outputPath = path.join(process.cwd(), 'downloaded_file.tar.gz');
  
  downloadFile(messageId, fileKey, outputPath)
    .then(() => console.log('Download completed!'))
    .catch(error => console.error('Download failed:', error));
}