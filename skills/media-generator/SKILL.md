---
name: media-generator
description: Generate voice, images, and video content using cloud APIs. Combines TTS, image generation, and video synthesis.
tags: [media, voice, video, image, tts, multimodal]
---

# Media Generator

Generate rich multimedia content including voice, images, and videos.

## Capabilities

- **Voice Generation**: Text-to-speech with multiple voices and languages
- **Image Generation**: High-quality image creation and editing (1K/2K/4K)
- **Video Synthesis**: Combine images and audio into videos
- **Multimodal Stories**: Create complete audiovisual narratives

## Usage

```bash
# Generate voice
node skills/media-generator/voice.js --text "Hello world" --voice "nova" --output "greeting.mp3"

# Generate image  
node skills/media-generator/image.js --prompt "A beautiful sunset" --resolution "4K" --output "sunset.png"

# Create video from image + audio
node skills/media-generator/video.js --image "sunset.png" --audio "greeting.mp3" --output "story.mp4"

# Generate complete story
node skills/media-generator/story.js --prompt "A tale about a brave knight" --duration 60 --output "knight_tale"
```

## Configuration

Create `config.json` in the skill directory:

```json
{
  "tts": {
    "provider": "elevenlabs",
    "api_key": "your-api-key"
  },
  "image": {
    "provider": "gemini",
    "api_key": "your-api-key"
  },
  "video": {
    "provider": "runwayml",
    "api_key": "your-api-key"
  }
}
```