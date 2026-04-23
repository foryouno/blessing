import { NextRequest, NextResponse } from 'next/server';
import { VideoGenerationClient, Config, HeaderUtils, Content } from 'coze-coding-dev-sdk';

// 增加 EventEmitter 监听器限制
import EventEmitter from 'events';
EventEmitter.defaultMaxListeners = 100;

export async function POST(request: NextRequest) {
  try {
    const { 
      prompt, 
      duration = 5, 
      ratio = '16:9',
      firstFrameUrl,
      lastFrameUrl,
      model = 'doubao-seedance-2.0-pro'
    } = await request.json();
    
    if (!prompt && !firstFrameUrl) {
      return NextResponse.json({ error: 'Prompt or first frame image is required' }, { status: 400 });
    }

    // 每次调用前等待 15 秒，避免频繁调用
    await new Promise(resolve => setTimeout(resolve, 15000));

    const customHeaders = HeaderUtils.extractForwardHeaders(request.headers);
    const config = new Config();
    const client = new VideoGenerationClient(config, customHeaders);

    const content: Content[] = [];

    if (firstFrameUrl && firstFrameUrl !== 'null' && firstFrameUrl !== 'undefined') {
      content.push({
        type: 'image_url' as const,
        image_url: { url: firstFrameUrl },
        role: 'first_frame' as const
      });
    }

    if (lastFrameUrl && lastFrameUrl !== 'null' && lastFrameUrl !== 'undefined') {
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
    });

    if (!response.videoUrl) {
      return NextResponse.json({ error: 'Failed to generate video' }, { status: 500 });
    }

    return NextResponse.json({ 
      videoUrl: response.videoUrl,
      taskId: response.response.id,
      status: response.response.status
    });
  } catch (error: unknown) {
    console.error('Video generation error:', error);
    const apiError = error as { statusCode?: number; response?: unknown; message?: string };
    console.error('Error response:', apiError.response);
    console.error('Error message:', apiError.message);
    return NextResponse.json(
      { error: apiError.message || 'Internal server error', details: apiError.response },
      { status: apiError.statusCode || 500 }
    );
  }
}
