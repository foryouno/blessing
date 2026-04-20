import { NextRequest, NextResponse } from 'next/server';
import { ImageGenerationClient, Config, HeaderUtils } from 'coze-coding-dev-sdk';

export async function POST(request: NextRequest) {
  try {
    const { prompt } = await request.json();
    
    if (!prompt) {
      return NextResponse.json(
        { error: '图片描述不能为空' },
        { status: 400 }
      );
    }

    const customHeaders = HeaderUtils.extractForwardHeaders(request.headers);
    const config = new Config();
    const client = new ImageGenerationClient(config, customHeaders);

    const response = await client.generate({
      prompt,
      size: '2K',
      model: 'doubao-seedream-5-0-260128',
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
