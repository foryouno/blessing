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

    // 根据时长计算分镜数量（每2-2.5秒一个分镜）
    const shotCount = Math.max(3, Math.min(8, Math.ceil(duration / 2.5)));
    
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

// 中文多镜头剧本生成
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
      intro: '开场介绍',
      focus: '概念和定义',
      angle: '从基础讲起',
      conclusion: '引出下文'
    },
    {
      intro: '深入分析',
      focus: '原理和机制',
      angle: '从技术角度',
      conclusion: '总结核心要点'
    },
    {
      intro: '实际应用',
      focus: '案例和实践',
      angle: '从应用场景',
      conclusion: '展望未来发展'
    },
    {
      intro: '专家观点',
      focus: '见解和建议',
      angle: '从专业视角',
      conclusion: '给出行动建议'
    },
    {
      intro: '总结回顾',
      focus: '回顾和总结',
      angle: '从全局视角',
      conclusion: '完美收尾'
    }
  ];
  
  const variation = contentVariations[(partNumber || 1) - 1] || contentVariations[0];
  const partInfo = partNumber && totalParts ? `（第${partNumber}/${totalParts}集）` : '';
  
  // 分镜1：开场
  shots.push(`【分镜 1 - ${variation.intro}】
⏱️ 时长：0-${Math.round(duration * 0.2)}秒
📝 场景描述：${topic}主题${variation.angle}精彩呈现${partInfo}
🎤 台词/旁白：大家好！欢迎来到今天的视频分享${partInfo}。这一集我们将${variation.focus}，${variation.angle}来深入探讨${topic}这个话题。相信通过这一集的内容，你会对${topic}有全新的认识和理解！
🎬 画面提示：
- 醒目主题画面，突出"${variation.intro}"
- 配合动感音乐
- 明亮色彩过渡
- 展示本集内容概览`);

  // 分镜2-（n-1）：中段展示
  const midShotCount = shotCount - 2;
  const midShotTopics = generateMidShotTopics(topic, variation.focus, midShotCount);
  
  for (let i = 0; i < midShotCount; i++) {
    const startTime = Math.round(duration * 0.2) + i * Math.round(duration * 0.6 / midShotCount);
    const endTime = startTime + Math.round(duration * 0.6 / midShotCount);
    
    const angles = ['近景', '中景', '远景', '特写', '俯视', '仰视'];
    const angle = angles[i % angles.length];
    
    const transitions = ['淡入淡出', '闪切', '旋转', '缩放', '滑动'];
    const transition = transitions[i % transitions.length];
    
    const midTopic = midShotTopics[i];
    
    shots.push(`【分镜 ${i + 2} - ${midTopic.title}】
⏱️ 时长：${startTime}-${endTime}秒
📝 场景描述：${midTopic.scene}
🎤 台词/旁白：${midTopic.dialogue}
🎬 画面提示：
- ${angle}镜头
- ${transition}转场
- 相关素材展示
- ${midTopic.visual}`);
  }

  // 分镜n：结尾
  const endStartTime = Math.round(duration * 0.8);
  const closingText = totalParts && partNumber === totalParts 
    ? `通过这一系列${totalParts}集的分享，相信你对${topic}已经有了全面而深入的了解。从基础概念到实际应用，从原理分析到未来展望，我们一起完成了这次精彩的${topic}探索之旅！如果你觉得有收获，别忘了点赞分享哦！感谢观看，我们下期再见！`
    : partNumber && totalParts 
      ? `这一集我们${variation.angle}探讨了${topic}的${variation.focus}。希望通过今天的内容，能让你对${topic}有更多的了解和思考。下一集我们将继续深入，精彩内容不容错过，记得关注哦！`
      : `希望通过今天这个简短的分享，能让你对${topic}有一个全新的认识。如果你觉得有收获，别忘了点赞分享哦！感谢观看，我们下期再见！`;
  
  shots.push(`【分镜 ${shotCount} - ${variation.conclusion}】
⏱️ 时长：${endStartTime}-${duration}秒
📝 场景描述：${topic}的${variation.conclusion}
🎤 台词/旁白：${closingText}
🎬 画面提示：
- 总结画面
- 配合呼吁性文字
- ${totalParts && partNumber !== totalParts ? '下集预告画面' : '订阅引导'}
- 渐黑收尾`);

  return shots.join('\n\n') + `\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n📋 总览：${shotCount}个分镜，总时长${duration}秒\n🎨 风格：${style}${partInfo}\n📚 本集重点：${variation.focus}\n🤖 由 Seedance 2 大模型 doubao-seed-2-0-pro-260215 生成（智能模板）`;
}

// 生成中段分镜的具体话题
function generateMidShotTopics(topic: string, focus: string, count: number) {
  const topics = [];
  
  const topicTemplates = [
    {
      title: '起源与背景',
      scene: `${topic}的起源与发展背景`,
      dialogue: `要了解${topic}，我们首先要从它的起源说起。${topic}的概念最早出现在什么时候？它是如何发展演变的？让我们一起来回顾这段有趣的历史。`,
      visual: '时间线展示'
    },
    {
      title: '核心概念',
      scene: `${topic}的核心概念解析`,
      dialogue: `${topic}的核心是什么？它包含哪些关键要素？理解这些基本概念，是我们深入学习的第一步。让我来为你一一解析。`,
      visual: '概念图解'
    },
    {
      title: '实际应用',
      scene: `${topic}在现实生活中的应用`,
      dialogue: `理论知识固然重要，但更重要的是如何应用。${topic}在我们的日常生活中有哪些实际应用？它是如何改变我们的生活的？`,
      visual: '应用场景展示'
    },
    {
      title: '优势与价值',
      scene: `${topic}的优势和价值分析`,
      dialogue: `${topic}为什么如此重要？它有哪些独特的优势？它能为我们带来什么价值？这些问题都值得我们深入思考。`,
      visual: '优势对比图'
    },
    {
      title: '未来展望',
      scene: `${topic}的未来发展趋势`,
      dialogue: `展望未来，${topic}会朝着什么方向发展？有哪些值得关注的趋势？技术的进步又会带来哪些新的可能性？让我们一起来展望。`,
      visual: '未来概念图'
    }
  ];
  
  // 根据 focus 调整话题
  const adjustedTemplates = topicTemplates.map(t => {
    let newDialogue = t.dialogue;
    if (focus.includes('概念')) {
      newDialogue = newDialogue.replace('重要', '概念重要');
    } else if (focus.includes('原理')) {
      newDialogue = newDialogue.replace('应用', '原理');
    } else if (focus.includes('案例')) {
      newDialogue = newDialogue.replace('理论', '案例');
    }
    return { ...t, dialogue: newDialogue };
  });
  
  // 选择需要的话题数量
  for (let i = 0; i < count; i++) {
    topics.push(adjustedTemplates[i % adjustedTemplates.length]);
  }
  
  return topics;
}

// 英文多镜头剧本生成
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
      intro: 'Introduction',
      focus: 'Concepts and Definitions',
      angle: 'From the Basics',
      conclusion: 'Setting the Stage'
    },
    {
      intro: 'Deep Analysis',
      focus: 'Principles and Mechanisms',
      angle: 'From a Technical Perspective',
      conclusion: 'Summarizing Key Points'
    },
    {
      intro: 'Practical Applications',
      focus: 'Case Studies and Practice',
      angle: 'From Application Scenarios',
      conclusion: 'Future Outlook'
    },
    {
      intro: 'Expert Insights',
      focus: 'Opinions and Advice',
      angle: 'From a Professional View',
      conclusion: 'Actionable Recommendations'
    },
    {
      intro: 'Summary and Review',
      focus: 'Recap and Synthesis',
      angle: 'From a Global Perspective',
      conclusion: 'Final Thoughts'
    }
  ];
  
  const variation = contentVariations[(partNumber || 1) - 1] || contentVariations[0];
  const partInfo = partNumber && totalParts ? ` (Part ${partNumber}/${totalParts})` : '';
  
  // Shot 1: Opening
  shots.push(`[Shot 1 - ${variation.intro}]
⏱️ Duration: 0-${Math.round(duration * 0.2)}s
📝 Scene Description: Wonderful presentation of ${topic}${partInfo}, ${variation.angle}
🎤 Lines/Narration: Hello everyone! Welcome to today's video sharing${partInfo}. In this episode, we will explore ${variation.focus} and dive deep into ${topic} ${variation.angle}. I believe through this content, you'll gain a brand new understanding of ${topic}!
🎬 Visual Cues:
- Eye-catching title screen highlighting "${variation.intro}"
- With dynamic music
- Bright color transitions
- Show episode overview`);

  // Shots 2-(n-1): Middle section
  const midShotCount = shotCount - 2;
  const midShotTopics = generateMidShotTopicsEn(topic, variation.focus, midShotCount);
  
  for (let i = 0; i < midShotCount; i++) {
    const startTime = Math.round(duration * 0.2) + i * Math.round(duration * 0.6 / midShotCount);
    const endTime = startTime + Math.round(duration * 0.6 / midShotCount);
    
    const angles = ['Close-up', 'Medium shot', 'Long shot', 'Extreme close-up', 'High angle', 'Low angle'];
    const angle = angles[i % angles.length];
    
    const transitions = ['Fade in/out', 'Cut', 'Rotate', 'Zoom', 'Slide'];
    const transition = transitions[i % transitions.length];
    
    const midTopic = midShotTopics[i];
    
    shots.push(`[Shot ${i + 2} - ${midTopic.title}]
⏱️ Duration: ${startTime}-${endTime}s
📝 Scene Description: ${midTopic.scene}
🎤 Lines/Narration: ${midTopic.dialogue}
🎬 Visual Cues:
- ${angle}
- ${transition} transition
- Related footage展示
- ${midTopic.visual}`);
  }

  // Shot n: Closing
  const endStartTime = Math.round(duration * 0.8);
  const closingText = totalParts && partNumber === totalParts 
    ? `Through this ${totalParts}-part series, I believe you now have a comprehensive and in-depth understanding of ${topic}. From basic concepts to practical applications, from principle analysis to future outlook, we've completed this wonderful journey of exploring ${topic} together! If you found this helpful, don't forget to like and share! Thanks for watching, see you next time!`
    : partNumber && totalParts 
      ? `In this episode, we explored ${variation.focus} of ${topic} ${variation.angle}. I hope through today's content, you've gained more understanding and insights about ${topic}. We'll continue deeper in the next episode - don't miss the exciting content, remember to follow!`
      : `I hope through this short sharing today, you can have a brand new understanding of ${topic}. If you found this helpful, don't forget to like and share! Thanks for watching, see you next time!`;
  
  shots.push(`[Shot ${shotCount} - ${variation.conclusion}]
⏱️ Duration: ${endStartTime}-${duration}s
📝 Scene Description: ${variation.conclusion} of ${topic}
🎤 Lines/Narration: ${closingText}
🎬 Visual Cues:
- Summary screen
- With call-to-action text
- ${totalParts && partNumber !== totalParts ? 'Next episode preview' : 'Subscribe guide'}
- Fade to black`);

  return shots.join('\n\n') + `\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n📋 Overview: ${shotCount} shots, total duration ${duration}s\n🎨 Style: ${style}${partInfo}\n📚 Episode Focus: ${variation.focus}\n🤖 Generated by Seedance 2 Model doubao-seed-2-0-pro-260215 (Smart Template)`;
}

// 生成英文中段分镜的具体话题
function generateMidShotTopicsEn(topic: string, focus: string, count: number) {
  const topics = [];
  
  const topicTemplates = [
    {
      title: 'Origins and Background',
      scene: `Origins and development background of ${topic}`,
      dialogue: `To understand ${topic}, we first need to start with its origins. When did the concept of ${topic} first appear? How did it evolve? Let's review this interesting history together.`,
      visual: 'Timeline display'
    },
    {
      title: 'Core Concepts',
      scene: `Core concept analysis of ${topic}`,
      dialogue: `What is the core of ${topic}? What key elements does it include? Understanding these basic concepts is our first step in deeper learning. Let me break them down for you.`,
      visual: 'Concept diagram'
    },
    {
      title: 'Practical Applications',
      scene: `Real-world applications of ${topic}`,
      dialogue: `Theoretical knowledge is important, but even more important is how to apply it. What are the practical applications of ${topic} in our daily lives? How is it changing our lives?`,
      visual: 'Application scenarios'
    },
    {
      title: 'Advantages and Value',
      scene: `Advantage and value analysis of ${topic}`,
      dialogue: `Why is ${topic} so important? What unique advantages does it have? What value can it bring us? These are questions worth thinking deeply about.`,
      visual: 'Advantage comparison'
    },
    {
      title: 'Future Outlook',
      scene: `Future development trends of ${topic}`,
      dialogue: `Looking to the future, what direction will ${topic} develop? What trends are worth watching? What new possibilities will technological progress bring? Let's look ahead together.`,
      visual: 'Future concept visualization'
    }
  ];
  
  // 根据 focus 调整话题
  const adjustedTemplates = topicTemplates.map(t => {
    let newDialogue = t.dialogue;
    if (focus.includes('Concept')) {
      newDialogue = newDialogue.replace('important', 'conceptually important');
    } else if (focus.includes('Principle')) {
      newDialogue = newDialogue.replace('application', 'principles');
    } else if (focus.includes('Case')) {
      newDialogue = newDialogue.replace('Theoretical', 'Case');
    }
    return { ...t, dialogue: newDialogue };
  });
  
  // 选择需要的话题数量
  for (let i = 0; i < count; i++) {
    topics.push(adjustedTemplates[i % adjustedTemplates.length]);
  }
  
  return topics;
}
