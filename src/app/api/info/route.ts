import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  return NextResponse.json({
    name: 'AI Video Generation Platform API',
    version: '1.0.0',
    description: 'Complete API for AI video generation, script generation, image generation, and more',
    endpoints: [
      {
        path: '/api/generate-video',
        method: 'POST',
        description: 'Generate video from prompt or image',
        parameters: {
          prompt: 'string (optional) - Video description',
          duration: 'number (optional) - Video duration in seconds (5-12)',
          ratio: 'string (optional) - Video ratio (16:9, 9:16, 1:1, 4:3)',
          firstFrameUrl: 'string (optional) - First frame image URL',
          lastFrameUrl: 'string (optional) - Last frame image URL',
          model: 'string (optional) - Model name'
        }
      },
      {
        path: '/api/generate-script',
        method: 'POST',
        description: 'Generate video script',
        parameters: {
          topic: 'string (required) - Video topic',
          style: 'string (optional) - Script style (professional, funny, emotional, concise)',
          duration: 'number (optional) - Video duration',
          language: 'string (optional) - Language (zh, en)',
          videoCount: 'number (optional) - Number of videos for multi-video mode',
          isMultiVideo: 'boolean (optional) - Enable multi-video mode'
        }
      },
      {
        path: '/api/generate-image',
        method: 'POST',
        description: 'Generate image from prompt',
        parameters: {
          prompt: 'string (required) - Image description',
          size: 'string (optional) - Image size',
          ratio: 'string (optional) - Image ratio',
          model: 'string (optional) - Model name'
        }
      },
      {
        path: '/api/upload-image',
        method: 'POST',
        description: 'Upload image file',
        parameters: {
          file: 'File (required) - Image file to upload'
        }
      },
      {
        path: '/api/tts',
        method: 'POST',
        description: 'Text to speech',
        parameters: {
          text: 'string (required) - Text to convert to speech',
          voice: 'string (optional) - Voice type',
          language: 'string (optional) - Language'
        }
      },
      {
        path: '/api/info',
        method: 'GET',
        description: 'Get API information and documentation'
      }
    ],
    features: [
      'Video generation with image reference',
      'Multi-video script generation',
      'Image generation',
      'Text to speech',
      'Image upload',
      'Smart duration matching',
      'Batch video generation'
    ],
    status: 'operational',
    timestamp: new Date().toISOString()
  });
}
