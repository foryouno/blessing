import { NextRequest, NextResponse } from 'next/server';
import { ImageGenerationClient, Config, HeaderUtils } from 'coze-coding-dev-sdk';

// 增加 EventEmitter 监听器限制
import EventEmitter from 'events';
EventEmitter.defaultMaxListeners = 100;

export async function POST(request: NextRequest) {
  try {
    const { prompt, size = '2K', model = 'doubao-seedream-5-0-260128' } = await request.json();
    
    if (!prompt) {
      return NextResponse.json(
        { error: '图片描述不能为空' },
        { status: 400 }
      );
    }

    // 每次调用前等待 15 秒，避免频繁调用
    await new Promise(resolve => setTimeout(resolve, 15000));

    const customHeaders = HeaderUtils.extractForwardHeaders(request.headers);
    const config = new Config();
    const client = new ImageGenerationClient(config, customHeaders);

    const response = await client.generate({
      prompt,
      size,
      model,
      watermark: true,
      optimizePromptMode: 'standard'
    });

    const helper = client.getResponseHelper(response);

    if (helper.success) {
      return NextResponse.json({ 
        success: true, 
        imageUrls: helper.imageUrls 
      });
    } else {
      return NextResponse.json(
        { error: helper.errorMessages.join(', ') },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Image generation error:', error);
    return NextResponse.json(
      { error: '图片生成时发生错误' },
      { status: 500 }
    );
  }
}
