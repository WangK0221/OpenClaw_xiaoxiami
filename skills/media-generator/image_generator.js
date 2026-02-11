const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

class ImageGenerator {
  constructor() {
    this.nanoBananaPath = path.join(__dirname, '..', 'nano-banana-pro', 'scripts', 'generate_image.py');
  }

  async generateImage(prompt, filename, resolution = '1K', inputImage = null) {
    return new Promise((resolve, reject) => {
      // 构建命令
      let command = `uv run ${this.nanoBananaPath} --prompt "${prompt}" --filename "${filename}" --resolution ${resolution}`;
      
      if (inputImage) {
        command += ` --input-image "${inputImage}"`;
      }

      console.log(`🚀 执行图像生成命令: ${command}`);
      
      exec(command, { cwd: process.cwd() }, (error, stdout, stderr) => {
        if (error) {
          console.error('❌ 图像生成失败:', error);
          reject(error);
          return;
        }
        
        if (stderr) {
          console.warn('⚠️ 图像生成警告:', stderr);
        }
        
        console.log('✅ 图像生成成功:', stdout);
        resolve(stdout.trim());
      });
    });
  }

  // 生成故事板图像序列
  async generateStoryboard(prompts, baseName, resolution = '2K') {
    const images = [];
    
    for (let i = 0; i < prompts.length; i++) {
      const filename = `${baseName}_scene_${i + 1}.png`;
      try {
        const result = await this.generateImage(prompts[i], filename, resolution);
        images.push({
          scene: i + 1,
          filename: filename,
          prompt: prompts[i],
          result: result
        });
        console.log(`✅ 场景 ${i + 1} 生成完成`);
      } catch (error) {
        console.error(`❌ 场景 ${i + 1} 生成失败:`, error);
        throw error;
      }
    }
    
    return images;
  }
}

module.exports = ImageGenerator;