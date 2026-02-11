// Simple feishu client for evolver wrapper
const { fetch } = require('undici');

async function fetchWithAuth(url, options) {
    // Get app ID and secret from environment or config
    const appId = process.env.FEISHU_APP_ID || 'cli_a900014c0238dcd6';
    const appSecret = process.env.FEISHU_APP_SECRET || 'd6eDcC1g05gvsXXFp0x5efr1dJZ7WzNn';
    
    // Get tenant access token
    const tokenRes = await fetch('https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ app_id: appId, app_secret: appSecret })
    });
    
    const tokenData = await tokenRes.json();
    if (tokenData.code !== 0) {
        throw new Error('Failed to get tenant access token: ' + tokenData.msg);
    }
    
    const accessToken = tokenData.tenant_access_token;
    
    // Add authorization header
    if (!options.headers) {
        options.headers = {};
    }
    options.headers.Authorization = `Bearer ${accessToken}`;
    
    return fetch(url, options);
}

module.exports = { fetchWithAuth };