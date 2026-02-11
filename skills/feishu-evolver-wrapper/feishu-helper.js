// feishu-helper.js - Helper functions for Feishu integration
const { message } = require('openclaw-tools');

async function sendFeishuMessage(content, options = {}) {
  try {
    const result = await message({
      channel: 'feishu',
      to: options.to || process.env.FEISHU_USER_ID,
      message: content,
      ...options
    });
    return result;
  } catch (error) {
    console.error('Failed to send Feishu message:', error);
    return null;
  }
}

module.exports = { sendFeishuMessage };