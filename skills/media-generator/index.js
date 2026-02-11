#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

class MediaGenerator {
  constructor() {
    this.workspace = process.env.OPENCLAW_WORKSPACE || '/home/admin/.openclaw/workspace';
    this.mediaDir = path.join(this.workspace, 'media');
    this.ensureMediaDir();
  }

  ensureMediaDir() {
    if (!fs.existsSync(this.mediaDir)) {
      fs.mkdirSync(this.mediaDir, { recursive: true });
    }
  }

  // 生成语音
  async generateSpeech(text, options = {}) {
    const { voice = 'default', filename = null } = options;
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const speechFile = filename || `speech-${timestamp}.mp3`;
    const fullPath = path.join(this.mediaDir, speechFile);

    return new Promise((resolve, reject) => {
      // 使用OpenClaw的tts工具
      const ttsCommand = `tts "${text}" --output "${fullPath}"`;
      
      exec(ttsCommand, (error, stdout, stderr) => {
        if (error) {
          console.error('TTS Error:', error);
          reject(error);
          return;
        }
        
        console.log(`Speech generated: ${fullPath}`);
        resolve(fullPath);
      });
    });
  }

  // 生成图像
  async generateImage(prompt, options = {}) {
    const { resolution = '1K', filename = null } = options;
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const imageFile = filename || `image-${timestamp}.png`;
    
    return new Promise((resolve, reject) => {
      // 使用nano-banana-pro技能
      const imageCommand = `uv run ${this.workspace}/skills/nano-banana-pro/scripts/generate_image.py --prompt "${prompt}" --filename "${imageFile}" --resolution ${resolution}`;
      
      exec(imageCommand, { cwd: this.workspace }, (error, stdout, stderr) => {
        if (error) {
          console.error('Image generation error:', error);
          reject(error);
          return;
        }
        
        const imagePath = path.join(this.workspace, imageFile);
        console.log(`Image generated: ${imagePath}`);
        resolve(imagePath);
      });
    });
  }

  // 生成多媒体内容（语音+图像）
  async generateMultimedia(content, options = {}) {
    const { type = 'story', voice = 'default', resolution = '2K' } = options;
    
    try {
      // 生成语音
      const speechPath = await this.generateSpeech(content.text, { voice });
      
      // 生成图像
      const imagePath = await this.generateImage(content.prompt, { resolution });
      
      return {
        success: true,
        speech: speechPath,
        image: imagePath,
        content: content
      };
    } catch (error) {
      console.error('Multimedia generation failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

// 命令行接口
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('Usage:');
    console.log('  node index.js speech "Hello world"');
    console.log('  node index.js image "A beautiful landscape"');
    console.log('  node index.js multimedia --text "Hello" --prompt "portrait"');
    process.exit(1);
  }

  const action = args[0];
  const mediaGen = new MediaGenerator();

  switch (action) {
    case 'speech':
      const text = args.slice(1).join(' ');
      mediaGen.generateSpeech(text).then(path => {
        console.log(`Speech saved to: ${path}`);
      }).catch(err => {
        console.error('Failed to generate speech:', err);
        process.exit(1);
      });
      break;

    case 'image':
      const prompt = args.slice(1).join(' ');
      mediaGen.generateImage(prompt).then(path => {
        console.log(`Image saved to: ${path}`);
      }).catch(err => {
        console.error('Failed to generate image:', err);
        process.exit(1);
      });
      break;

    default:
      console.log('Unknown action:', action);
      process.exit(1);
  }
}

module.exports = MediaGenerator;