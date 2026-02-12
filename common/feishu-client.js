const { fetch } = require('undici');

// Load environment variables for Feishu authentication
require('dotenv').config({ path: '/home/admin/.openclaw/workspace/.env' });

let accessToken = null;
let tokenExpiry = 0;

async function getAccessToken() {
    const now = Date.now();
    if (accessToken && tokenExpiry > now + 60000) {
        return accessToken;
    }
    
    const appId = process.env.FEISHU_APP_ID;
    const appSecret = process.env.FEISHU_APP_SECRET;
    
    if (!appId || !appSecret) {
        throw new Error('FEISHU_APP_ID and FEISHU_APP_SECRET must be set in .env');
    }
    
    try {
        const response = await fetch('https://open.feishu.cn/open-apis/auth/v3/app_access_token/internal', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                app_id: appId,
                app_secret: appSecret
            })
        });
        
        const data = await response.json();
        if (data.code !== 0) {
            throw new Error(`Failed to get access token: ${data.msg}`);
        }
        
        accessToken = data.app_access_token;
        tokenExpiry = now + (data.expire * 1000);
        return accessToken;
    } catch (error) {
        console.error('Error getting Feishu access token:', error);
        throw error;
    }
}

async function fetchWithAuth(url, options = {}) {
    const token = await getAccessToken();
    
    const headers = {
        ...options.headers,
        'Authorization': `Bearer ${token}`
    };
    
    const response = await fetch(url, {
        ...options,
        headers
    });
    
    return response;
}

module.exports = { fetchWithAuth };