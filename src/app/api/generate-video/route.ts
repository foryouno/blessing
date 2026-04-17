import { NextRequest, NextResponse } from 'next/server';
import { VideoGenerationClient, Config, HeaderUtils, Content } from 'coze-coding-dev-sdk';

export async function POST(request: NextRequest) {
  try {
    const { 
      prompt, 
      duration = 5, 
      ratio = '16:9', 
      resolution = '720p', 
      generateAudio = true,
      firstFrameUrl,
      lastFrameUrl,
      model = 'doubao-seedance-1-5-pro-251215',
      audioUrl
    } = await request.json();
    
    if (!prompt && !firstFrameUrl) {
      return NextResponse.json({ error: 'Prompt or first frame image is required' }, { status: 400 });
    }

    const customHeaders = HeaderUtils.extractForwardHeaders(request.headers);
    const config = new Config();
    const client = new VideoGenerationClient(config, customHeaders);

    const content: Content[] = [];

    if (firstFrameUrl) {
      content.push({
        type: 'image_url' as const,
        image_url: { url: firstFrameUrl },
        role: 'first_frame' as const
      });
    }

    if (lastFrameUrl) {
      content.push({
        type: 'image_url' as const,
        image_url: { url: lastFrameUrl },
        role: 'last_frame' as const
      });
    }

    if (prompt) {
      content.push({ type: 'text' as const, text: prompt });
    }

    const response = await client.videoGeneration(content, {
      model,
      duration,
      ratio,
      resolution,
      generateAudio,
    });

    if (!response.videoUrl) {
      return NextResponse.json({ error: 'Failed to generate video' }, { status: 500 });
    }

    return NextResponse.json({ 
      videoUrl: response.videoUrl,
      taskId: response.response.id,
      status: response.response.status
    });
  } catch (error) {
    console.error('Video generation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
