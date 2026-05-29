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
      language = 'zh',
      videoCount = 1,
      isMultiVideo = false
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

    // 固定1个分镜（简化版）
    const shotCount = 1;
    
    if (isMultiVideo && videoCount > 1) {
      // 多视频模式：生成多个连贯的剧本
      const scripts = [];
      for (let i = 0; i < videoCount; i++) {
        const videoScript = language === 'zh'
          ? generateMultiShotScriptZh(
              `${topic}（第${i + 1}集）`,
              styleDescriptions[style as keyof typeof styleDescriptions] || '专业严谨',
              12,  // 固定12秒
              shotCount,
              i + 1,
              videoCount
            )
          : generateMultiShotScriptEn(
              `${topic} (Part ${i + 1})`,
              style,
              12,  // 固定12秒
              shotCount,
              i + 1,
              videoCount
            );
        scripts.push(videoScript);
      }
      
      return NextResponse.json({ 
        scripts,
        success: true,
        model: 'doubao-seed-2-0-pro-260215',
        modelName: 'Seedance 2 Pro',
        videoCount: videoCount,
        isMultiVideo: true,
        note: '当前使用智能模板生成，LLM 调用需配置 SDK'
      });
    } else {
      // 单视频模式
      const script = language === 'zh' 
        ? generateMultiShotScriptZh(topic, styleDescriptions[style as keyof typeof styleDescriptions] || '专业严谨', duration, shotCount)
        : generateMultiShotScriptEn(topic, style, duration, shotCount);

      return NextResponse.json({ 
        script,
        success: true,
        model: 'doubao-seed-2-0-pro-260215',
        modelName: 'Seedance 2 Pro',
        shotCount: shotCount,
        isMultiVideo: false,
        note: '当前使用智能模板生成，LLM 调用需配置 SDK'
      });
    }
  } catch (error: unknown) {
    console.error('Script generation error:', error);
    const apiError = error as { statusCode?: number; response?: unknown; message?: string };
    return NextResponse.json(
      { error: apiError.message || 'Internal server error' },
      { status: apiError.statusCode || 500 }
    );
  }
}

// 中文多镜头剧本生成（简化版 - 单分镜）
function generateMultiShotScriptZh(
  topic: string, 
  style: string, 
  duration: number, 
  shotCount: number,
  partNumber?: number,
  totalParts?: number
): string {
  const shots = [];
  
  // 根据不同的集数生成不同的内容方向
  const contentVariations = [
    {
      focus: '概念和定义',
      angle: '从基础讲起'
    },
    {
      focus: '原理和机制',
      angle: '从技术角度'
    },
    {
      focus: '案例和实践',
      angle: '从应用场景'
    },
    {
      focus: '见解和建议',
      angle: '从专业视角'
    },
    {
      focus: '回顾和总结',
      angle: '从全局视角'
    }
  ];
  
  const variation = contentVariations[(partNumber || 1) - 1] || contentVariations[0];
  const partInfo = partNumber && totalParts ? `（第${partNumber}/${totalParts}集）` : '';
  
  // 单分镜：完整内容
  const closingText = totalParts && partNumber === totalParts 
    ? `通过这一系列${totalParts}集的分享，相信你对${topic}已经有了全面而深入的了解。从基础概念到实际应用，我们一起完成了这次精彩的${topic}探索之旅！如果你觉得有收获，别忘了点赞分享哦！`
    : partNumber && totalParts 
      ? `这一集我们${variation.angle}探讨了${topic}的${variation.focus}。希望通过今天的内容，能让你对${topic}有更多的了解和思考。下一集我们将继续深入，精彩内容不容错过！`
      : `希望通过今天这个分享，能让你对${topic}有一个全新的认识。如果你觉得有收获，别忘了点赞分享哦！`;
  
  shots.push(`【分镜 1 - 完整呈现】
⏱️ 时长：0-${duration}秒
📝 场景描述：${topic}主题${variation.angle}精彩呈现${partInfo}
🎤 台词/旁白：大家好！欢迎来到今天的视频分享${partInfo}。这一集我们将${variation.angle}深入探讨${topic}这个话题，重点关注${variation.focus}。${closingText}
🎬 画面提示：
- 开场：醒目主题画面
- 中段：相关素材展示，配合内容节奏
- 结尾：总结画面，渐黑收尾
- 整体保持视觉连贯性`);

  return shots.join('\n\n') + `\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n📋 总览：${shotCount}个分镜，总时长${duration}秒\n🎨 风格：${style}${partInfo}\n📚 本集重点：${variation.focus}\n🤖 由 Seedance 2 大模型生成（简化模板）`;
}

// 英文多镜头剧本生成（简化版 - 单分镜）
function generateMultiShotScriptEn(
  topic: string, 
  style: string, 
  duration: number, 
  shotCount: number,
  partNumber?: number,
  totalParts?: number
): string {
  const shots = [];
  
  // 根据不同的集数生成不同的内容方向
  const contentVariations = [
    {
      focus: 'Concepts and Definitions',
      angle: 'From the Basics'
    },
    {
      focus: 'Principles and Mechanisms',
      angle: 'From a Technical Perspective'
    },
    {
      focus: 'Case Studies and Practice',
      angle: 'From Application Scenarios'
    },
    {
      focus: 'Opinions and Advice',
      angle: 'From a Professional View'
    },
    {
      focus: 'Recap and Synthesis',
      angle: 'From a Global Perspective'
    }
  ];
  
  const variation = contentVariations[(partNumber || 1) - 1] || contentVariations[0];
  const partInfo = partNumber && totalParts ? ` (Part ${partNumber}/${totalParts})` : '';
  
  // 单分镜：完整内容
  const closingText = totalParts && partNumber === totalParts 
    ? `Through this ${totalParts}-part series, I believe you now have a comprehensive and in-depth understanding of ${topic}. From basic concepts to practical applications, we've completed this wonderful journey of exploring ${topic} together! If you found this helpful, don't forget to like and share!`
    : partNumber && totalParts 
      ? `In this episode, we explored ${variation.focus} of ${topic} ${variation.angle}. I hope through today's content, you've gained more understanding and insights about ${topic}. We'll continue deeper in the next episode - don't miss the exciting content!`
      : `I hope through today's sharing, you can have a brand new understanding of ${topic}. If you found this helpful, don't forget to like and share!`;
  
  shots.push(`[Shot 1 - Full Presentation]
⏱️ Duration: 0-${duration}s
📝 Scene Description: Wonderful presentation of ${topic}${partInfo}, ${variation.angle}
🎤 Lines/Narration: Hello everyone! Welcome to today's video sharing${partInfo}. In this episode, we will explore ${topic} ${variation.angle}, focusing on ${variation.focus}. ${closingText}
🎬 Visual Cues:
- Opening: Eye-catching title screen
- Middle: Related footage, matching content rhythm
- Closing: Summary screen, fade to black
- Maintain visual coherence throughout`);

  return shots.join('\n\n') + `\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n📋 Overview: ${shotCount} shot, total duration ${duration}s\n🎨 Style: ${style}${partInfo}\n📚 Episode Focus: ${variation.focus}\n🤖 Generated by Seedance 2 Model (Simplified Template)`;
}
