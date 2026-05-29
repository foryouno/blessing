import { NextRequest, NextResponse } from 'next/server';
import { TTSClient, Config, HeaderUtils } from 'coze-coding-dev-sdk';

// 增加 EventEmitter 监听器限制
import EventEmitter from 'events';
EventEmitter.defaultMaxListeners = 100;

export async function POST(request: NextRequest) {
  try {
    const { text, speaker } = await request.json();
    
    if (!text) {
      return NextResponse.json(
        { error: '缺少 text 参数' },
        { status: 400 }
      );
    }

    // 每次调用前等待 15 秒，避免频繁调用
    await new Promise(resolve => setTimeout(resolve, 15000));

    const customHeaders = HeaderUtils.extractForwardHeaders(request.headers);
    const config = new Config();
    const ttsClient = new TTSClient(config, customHeaders);

    const response = await ttsClient.synthesize({
      uid: 'video_generator_user',
      text,
      speaker: speaker || 'zh_female_xiaohe_uranus_bigtts',
      audioFormat: 'mp3',
      sampleRate: 24000
    });

    return NextResponse.json({
      success: true,
      audioUri: response.audioUri,
      audioSize: response.audioSize
    });

  } catch (error) {
    console.error('TTS 生成失败:', error);
    return NextResponse.json(
      { error: 'TTS 生成失败', details: String(error) },
      { status: 500 }
    );
  }
}
