const axios = require('axios');
const fs = require('fs');

async function generateImage() {
    const apiKey = process.env.GEMINI_API_KEY;
    const model = 'imagen-3.0-generate-001';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    
    const prompt = "A cute cartoon shrimp character lying comfortably in bed, reading a book with focused attention. Soft pillows and cozy blankets around, warm lighting creating a温馨 atmosphere. Bookshelves in the background with scattered books. Style: cute, detailed, warm colors, peaceful scene.";
    
    const requestBody = {
        prompt: {
            text: prompt
        },
        generationConfig: {
            sampleCount: 1,
            aspectRatio: "square"
        }
    };
    
    try {
        console.log('Generating image...');
        const response = await axios.post(url, requestBody);
        console.log('Response received:', response.data);
        
        // Extract image data from response
        if (response.data.candidates && response.data.candidates[0]) {
            const imageData = response.data.candidates[0];
            console.log('Image generated successfully!');
            // Save image data or return it
        }
    } catch (error) {
        console.error('Error generating image:', error.response?.data || error.message);
    }
}

generateImage();