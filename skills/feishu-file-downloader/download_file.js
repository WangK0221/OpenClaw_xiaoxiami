#!/usr/bin/env node

const axios = require('axios');
const fs = require('fs');
const path = require('path');

// 从环境变量获取飞书App ID和App Secret
const APP_ID = process.env.FEISHU_APP_ID || 'cli_a900014c0238dcd6';
const APP_SECRET = process.env.FEISHU_APP_SECRET || 'd6eDcC1g05gvsXXFp0x5efr1dJZ7WzNn';

async function getTenantAccessToken() {
    try {
        const response = await axios.post('https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal', {
            app_id: APP_ID,
            app_secret: APP_SECRET
        });
        
        if (response.data.code === 0) {
            return response.data.tenant_access_token;
        } else {
            throw new Error(`Failed to get tenant access token: ${response.data.msg}`);
        }
    } catch (error) {
        console.error('Error getting tenant access token:', error.message);
        throw error;
    }
}

async function downloadFile(messageId, fileKey, outputPath = null) {
    try {
        // 获取 tenant_access_token
        const token = await getTenantAccessToken();
        
        // 构建正确的API URL
        const url = `https://open.feishu.cn/open-apis/im/v1/messages/${messageId}/resources/${fileKey}?type=file`;
        
        console.log(`📥 开始下载文件: ${fileKey}`);
        console.log(`🔗 API URL: ${url}`);
        
        // 发送GET请求下载文件
        const response = await axios({
            url: url,
            method: 'GET',
            responseType: 'stream',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            timeout: 30000 // 30秒超时
        });
        
        // 确定输出路径
        if (!outputPath) {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            outputPath = path.join(process.cwd(), `downloaded-file-${timestamp}`);
        }
        
        // 创建写入流
        const writer = fs.createWriteStream(outputPath);
        
        // 管道响应数据到文件
        response.data.pipe(writer);
        
        // 等待文件写入完成
        await new Promise((resolve, reject) => {
            writer.on('finish', resolve);
            writer.on('error', reject);
        });
        
        console.log(`✅ 文件下载成功: ${outputPath}`);
        return outputPath;
        
    } catch (error) {
        if (error.response) {
            console.error(`❌ HTTP错误 (${error.response.status}): ${error.response.data}`);
        } else if (error.request) {
            console.error('❌ 网络请求错误:', error.message);
        } else {
            console.error('❌ 其他错误:', error.message);
        }
        throw error;
    }
}

// 命令行接口
if (require.main === module) {
    const args = process.argv.slice(2);
    
    if (args.length < 2) {
        console.log('用法: node download_file.js <message_id> <file_key> [output_path]');
        console.log('示例: node download_file.js oc_123456789abcdef file_987654321 /path/to/output.tar.gz');
        process.exit(1);
    }
    
    const messageId = args[0];
    const fileKey = args[1];
    const outputPath = args[2] || null;
    
    downloadFile(messageId, fileKey, outputPath)
        .then(() => {
            console.log('🎉 文件下载完成！');
        })
        .catch((error) => {
            console.error('💥 下载失败:', error.message);
            process.exit(1);
        });
}

module.exports = { downloadFile, getTenantAccessToken };