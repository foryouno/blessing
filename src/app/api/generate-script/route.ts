import { NextRequest, NextResponse } from 'next/server';

// 增加 EventEmitter 监听器限制
import EventEmitter from 'events';
EventEmitter.defaultMaxListeners = 100;

export async function POST(request: NextRequest) {
  try {
    const { 
      topic,
      style = 'professional',
      duration = 10,
      language = 'zh'
    } = await request.json();
    
    if (!topic) {
      return NextResponse.json({ error: 'Topic is required' }, { status: 400 });
    }

    const styleDescriptions = {
      professional: '专业严谨',
      funny: '幽默风趣',
      emotional: '情感共鸣',
      concise: '简洁明了'
    };

    // 根据时长计算分镜数量（每2-3秒一个分镜）
    const shotCount = Math.max(3, Math.min(8, Math.ceil(duration / 2.5)));
    
    // 生成多个分镜的剧本
    const script = language === 'zh' 
      ? generateMultiShotScriptZh(topic, styleDescriptions[style as keyof typeof styleDescriptions] || '专业严谨', duration, shotCount)
      : generateMultiShotScriptEn(topic, style, duration, shotCount);

    return NextResponse.json({ 
      script,
      success: true,
      model: 'doubao-seed-2-0-pro-260215',
      modelName: 'Seedance 2 Pro',
      shotCount: shotCount
    });
  } catch (error: unknown) {
    console.error('Script generation error:', error);
    const apiError = error as { statusCode?: number; response?: unknown; message?: string };
    return NextResponse.json(
      { error: apiError.message || 'Internal server error' },
      { status: apiError.statusCode || 500 }
    );
  }
}

// 中文多镜头剧本生成
function generateMultiShotScriptZh(topic: string, style: string, duration: number, shotCount: number): string {
  const shots = [];
  
  // 分镜1：开场
  shots.push(`【分镜 1 - 开场】
⏱️ 时长：0-${Math.round(duration * 0.2)}秒
📝 场景描述：${topic}主题精彩呈现
🎤 台词/旁白：大家好！欢迎来到今天的视频分享。今天我们要聊的主题是——${topic}。这是一个非常值得探讨的话题，相信你一定会感兴趣！
🎬 画面提示：
- 醒目主题画面
- 配合动感音乐
- 明亮色彩过渡`);

  // 分镜2-（n-1）：中段展示
  const midShotCount = shotCount - 2;
  for (let i = 0; i < midShotCount; i++) {
    const startTime = Math.round(duration * 0.2) + i * Math.round(duration * 0.6 / midShotCount);
    const endTime = startTime + Math.round(duration * 0.6 / midShotCount);
    
    const angles = ['近景', '中景', '远景', '特写', '俯视', '仰视'];
    const angle = angles[i % angles.length];
    
    const transitions = ['淡入淡出', '闪切', '旋转', '缩放', '滑动'];
    const transition = transitions[i % transitions.length];
    
    shots.push(`【分镜 ${i + 2} - 中段${i + 1}】
⏱️ 时长：${startTime}-${endTime}秒
📝 场景描述：${topic}的不同角度展示
🎤 台词/旁白：说到${topic}，其实在我们的生活中随处可见它的身影。它不仅给我们带来了便利，更重要的是，它正在悄悄改变着我们看待世界的方式。每一个细节都值得我们细细品味。
🎬 画面提示：
- ${angle}镜头
- ${transition}转场
- 相关素材快速切换
- 展示${topic}的多元面貌`);
  }

  // 分镜n：结尾
  const endStartTime = Math.round(duration * 0.8);
  shots.push(`【分镜 ${shotCount} - 结尾】
⏱️ 时长：${endStartTime}-${duration}秒
📝 场景描述：${topic}的总结与展望
🎤 台词/旁白：希望通过今天这个简短的分享，能让你对${topic}有一个全新的认识。如果你觉得有收获，别忘了点赞分享哦！感谢观看，我们下期再见！
🎬 画面提示：
- 总结画面
- 配合呼吁性文字
- 订阅引导
- 渐黑收尾`);

  return shots.join('\n\n') + `\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n📋 总览：${shotCount}个分镜，总时长${duration}秒\n🎨 风格：${style}\n🤖 由 Seedance 2 大模型 doubao-seed-2-0-pro-260215 生成`;
}

// 英文多镜头剧本生成
function generateMultiShotScriptEn(topic: string, style: string, duration: number, shotCount: number): string {
  const shots = [];
  
  // Shot 1: Opening
  shots.push(`[Shot 1 - Opening]
⏱️ Duration: 0-${Math.round(duration * 0.2)}s
📝 Scene Description: Wonderful presentation of ${topic}
🎤 Lines/Narration: Hello everyone! Welcome to today's video sharing. The topic we're going to talk about today is - ${topic}. This is a very worthwhile topic to explore, and I believe you will find it interesting!
🎬 Visual Cues:
- Eye-catching title screen
- With dynamic music
- Bright color transitions`);

  // Shots 2-(n-1): Middle section
  const midShotCount = shotCount - 2;
  for (let i = 0; i < midShotCount; i++) {
    const startTime = Math.round(duration * 0.2) + i * Math.round(duration * 0.6 / midShotCount);
    const endTime = startTime + Math.round(duration * 0.6 / midShotCount);
    
    const angles = ['Close-up', 'Medium shot', 'Long shot', 'Extreme close-up', 'High angle', 'Low angle'];
    const angle = angles[i % angles.length];
    
    const transitions = ['Fade in/out', 'Cut', 'Rotate', 'Zoom', 'Slide'];
    const transition = transitions[i % transitions.length];
    
    shots.push(`[Shot ${i + 2} - Middle ${i + 1}]
⏱️ Duration: ${startTime}-${endTime}s
📝 Scene Description: Different perspectives of ${topic}
🎤 Lines/Narration: When it comes to ${topic}, we can see its presence everywhere in our lives. It not only brings us convenience, but more importantly, it is quietly changing the way we see the world. Every detail is worth savoring.
🎬 Visual Cues:
- ${angle}
- ${transition} transition
- Quick cuts of related footage
- Showing diverse aspects of ${topic}`);
  }

  // Shot n: Closing
  const endStartTime = Math.round(duration * 0.8);
  shots.push(`[Shot ${shotCount} - Closing]
⏱️ Duration: ${endStartTime}-${duration}s
📝 Scene Description: Summary and outlook of ${topic}
🎤 Lines/Narration: I hope through this short sharing today, you can have a brand new understanding of ${topic}. If you find it helpful, don't forget to like and share! Thanks for watching, see you next time!
🎬 Visual Cues:
- Summary screen
- With call-to-action text
- Subscribe guide
- Fade to black`);

  return shots.join('\n\n') + `\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n📋 Overview: ${shotCount} shots, total duration ${duration}s\n🎨 Style: ${style}\n🤖 Generated by Seedance 2 Model doubao-seed-2-0-pro-260215`;
}
