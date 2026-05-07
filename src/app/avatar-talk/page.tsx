'use client';

import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Loader2, Upload, X, Mic, User, Video, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function AvatarTalkPage() {
  // 模型选择状态
  const [model, setModel] = useState('doubao-seedance-1-5-pro-251215');
  // 图片说话功能状态
  const [imageTalkImageUrl, setImageTalkImageUrl] = useState<string | null>(null);
  const [imageTalkVoiceText, setImageTalkVoiceText] = useState('');
  const [imageTalkVideoPrompt, setImageTalkVideoPrompt] = useState('一位专业的数字人正在认真朗读稿件，表情自然，手势动作适中，背景简洁大方');
  const [imageTalkDuration, setImageTalkDuration] = useState(12);
  const [imageTalkRatio, setImageTalkRatio] = useState('16:9');
  const [imageTalkAutoDuration, setImageTalkAutoDuration] = useState(true);
  const [isUploadingImageTalk, setIsUploadingImageTalk] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingImageTalkBatch, setIsGeneratingImageTalkBatch] = useState(false);
  const [imageTalkBatchProgress, setImageTalkBatchProgress] = useState(0);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // 首帧图片状态
  const [firstFrameUrl, setFirstFrameUrl] = useState<string | null>(null);
  // 提示词
  const [prompt, setPrompt] = useState('');
  // 视频时长
  const [duration, setDuration] = useState(12);
  // 视频比例
  const [ratio, setRatio] = useState('16:9');
  
  // Refs
  const imageTalkInputRef = useRef<HTMLInputElement>(null);

  // 快捷提示词模板
  const promptTemplates = [
    { title: '专业主播', icon: '📰', template: '一位专业的新闻主播，坐在明亮的演播室里，表情自然，手势动作适中，背景简洁大方' },
    { title: '知识讲解', icon: '🎓', template: '一位知识渊博的讲师，站在黑板前，认真讲解知识点，表情生动，手势丰富' },
    { title: '产品介绍', icon: '📦', template: '一位专业的产品经理，正在介绍新产品，表情兴奋，手势有力，背景有产品展示' },
    { title: '日常聊天', icon: '☕', template: '一位亲切的朋友，坐在温馨的客厅里，轻松聊天，表情自然，动作随意' },
    { title: '正式演讲', icon: '🎤', template: '一位专业的演讲者，站在舞台上，进行正式演讲，表情坚定，手势有力' }
  ];

  // 智能时长计算（根据文本长度）- 支持中英文混合
  const calculateRealDurationFromText = (text: string): number => {
    if (!text.trim()) return 0;
    const cleanText = text.replace(/\s/g, '');
    
    // 分别统计中文字符和非中文字符
    let chineseChars = 0;
    let otherChars = 0;
    
    for (const char of cleanText) {
      if (/[\u4e00-\u9fa5]/.test(char)) {
        chineseChars++;
      } else {
        otherChars++;
      }
    }
    
    // 中文：4字/秒，其他：5字符/秒
    const chineseDuration = chineseChars / 4;
    const otherDuration = otherChars / 5;
    const totalDuration = chineseDuration + otherDuration;
    
    return Math.max(1, Math.round(totalDuration));
  };

  // 计算有效时长（限制在5-12秒范围内）
  const calculateValidDurationFromText = (text: string): number => {
    const realDuration = calculateRealDurationFromText(text);
    return Math.max(5, Math.min(12, realDuration));
  };

  // 长文本智能分段算法
  const splitTextIntoSegments = (text: string, maxSecondsPerSegment: number = 12): string[] => {
    const segments: string[] = [];
    const sentences = text.split(/(?<=[。！？.!?])/).filter(s => s.trim());
    
    let currentSegment = '';
    let currentDuration = 0;
    
    for (const sentence of sentences) {
      const sentenceDuration = calculateRealDurationFromText(sentence);
      
      // 如果当前句子加上当前段落超过最大时长，且当前段落不为空，则先保存当前段落
      if (currentDuration + sentenceDuration > maxSecondsPerSegment && currentSegment.trim()) {
        segments.push(currentSegment.trim());
        currentSegment = '';
        currentDuration = 0;
      }
      
      // 如果单个句子就超过最大时长，需要强行截断
      if (sentenceDuration > maxSecondsPerSegment) {
        // 将长句子按逗号或空格分割
        const parts = sentence.split(/(?<=[，,])/).filter(p => p.trim());
        let tempSegment = '';
        let tempDuration = 0;
        
        for (const part of parts) {
          const partDuration = calculateRealDurationFromText(part);
          if (tempDuration + partDuration > maxSecondsPerSegment && tempSegment.trim()) {
            segments.push(tempSegment.trim());
            tempSegment = '';
            tempDuration = 0;
          }
          tempSegment += part;
          tempDuration += partDuration;
        }
        
        if (tempSegment.trim()) {
          segments.push(tempSegment.trim());
        }
      } else {
        currentSegment += sentence;
        currentDuration += sentenceDuration;
      }
    }
    
    if (currentSegment.trim()) {
      segments.push(currentSegment.trim());
    }
    
    return segments;
  };

  // 提取视频最后一帧作为图片
  const extractVideoLastFrame = async (videoUrl: string): Promise<string | null> => {
    return new Promise((resolve, reject) => {
      try {
        const video = document.createElement('video');
        video.crossOrigin = 'anonymous';
        video.src = videoUrl;
        
        video.addEventListener('loadedmetadata', () => {
          try {
            video.currentTime = video.duration;
          } catch (err) {
            console.error('设置视频时间失败:', err);
            // 如果设置时间失败，尝试用最后0.5秒
            try {
              video.currentTime = Math.max(0, video.duration - 0.5);
            } catch (err2) {
              console.error('设置备用时间也失败:', err2);
            }
          }
        });
        
        video.addEventListener('seeked', () => {
          try {
            const canvas = document.createElement('canvas');
            canvas.width = video.videoWidth || 1920;
            canvas.height = video.videoHeight || 1080;
            const ctx = canvas.getContext('2d');
            
            if (ctx) {
              ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
              const dataUrl = canvas.toDataURL('image/png');
              resolve(dataUrl);
            } else {
              resolve(null);
            }
          } catch (err) {
            console.error('Canvas绘制失败:', err);
            resolve(null);
          }
        });
        
        video.addEventListener('error', () => {
          console.error('视频加载失败');
          resolve(null);
        });
        
        // 超时保护
        setTimeout(() => {
          console.warn('提取最后一帧超时');
          resolve(null);
        }, 10000);
      } catch (err) {
        console.error('提取最后一帧异常:', err);
        resolve(null);
      }
    });
  };

  // 保存到历史记录
  const saveToHistory = (item: any) => {
    if (typeof window === 'undefined') return;
    
    try {
      const history = JSON.parse(localStorage.getItem('videoHistory') || '[]');
      const newItem = {
        ...item,
        id: Date.now().toString(36) + Math.random().toString(36).substr(2),
        createdAt: new Date().toISOString(),
      };
      history.unshift(newItem);
      localStorage.setItem('videoHistory', JSON.stringify(history.slice(0, 50)));
    } catch (err) {
      console.error('保存历史记录失败:', err);
    }
  };

  // 生成视频
  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    
    setIsGenerating(true);
    setError(null);
    setVideoUrl(null);
    
    try {
      const response = await fetch('/api/generate-video', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          duration,
          ratio,
          generateAudio: true,
          firstFrameUrl,
          model,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || '视频生成失败');
      }
      
      setVideoUrl(data.videoUrl);
      
      // 保存到历史记录
      saveToHistory({
        videoUrl: data.videoUrl,
        prompt,
        duration,
        ratio,
        generateAudio: true,
        model,
        firstFrameUrl,
      });
      
    } catch (err) {
      setError(err instanceof Error ? err.message : '生成视频时发生错误');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6">
      <div className="max-w-4xl mx-auto">
        {/* 返回按钮 */}
        <div className="mb-6">
          <Link href="/">
            <Button variant="secondary" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              返回主页面
            </Button>
          </Link>
        </div>
        
        {/* 页面标题 */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            <Mic className="w-10 h-10 inline mr-3 text-cyan-400" />
            图片口播
          </h1>
          <p className="text-slate-400">上传图片，让图片中的人物开口说话！</p>
        </div>
        
        {/* 错误提示 */}
        {error && (
          <Card className="p-4 mb-6 bg-red-500/10 border-red-500/30">
            <p className="text-red-400">{error}</p>
          </Card>
        )}
        
        {/* 视频预览 */}
        {videoUrl && (
          <Card className="p-4 mb-6 bg-slate-800/50 border-slate-700">
            <h3 className="text-white font-medium mb-4 flex items-center gap-2">
              <Video className="w-5 h-5 text-green-400" />
              生成的视频
            </h3>
            <video
              src={videoUrl}
              controls
              className="w-full rounded-lg"
            />
          </Card>
        )}
        
        {/* 图片说话功能 */}
        <Card className="p-6 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border-cyan-500/30">
          <div className="space-y-6">
            {/* 独立的图片上传区域 */}
            <div>
              <Label className="text-white text-sm font-medium mb-3 block">
                1. 上传图片
              </Label>
              {!imageTalkImageUrl ? (
                <div
                  onClick={() => imageTalkInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-600 rounded-lg p-8 text-center cursor-pointer hover:border-slate-500 hover:bg-slate-800/50 transition-all"
                >
                  <input
                    ref={imageTalkInputRef}
                    type="file"
                    accept="image/*"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      
                      setIsUploadingImageTalk(true);
                      
                      try {
                        const formData = new FormData();
                        formData.append('file', file);
                        const response = await fetch('/api/upload-image', {
                          method: 'POST',
                          body: formData,
                        });
                        const data = await response.json();
                        if (!response.ok) {
                          throw new Error(data.error || '上传图片失败');
                        }
                        setImageTalkImageUrl(data.imageUrl);
                      } catch (err) {
                        console.error('上传失败:', err);
                      } finally {
                        setIsUploadingImageTalk(false);
                      }
                    }}
                    disabled={isUploadingImageTalk}
                    className="hidden"
                  />
                  {isUploadingImageTalk ? (
                    <>
                      <Loader2 className="w-12 h-12 mx-auto mb-3 text-cyan-400 animate-spin" />
                      <p className="text-cyan-400">上传中...</p>
                    </>
                  ) : (
                    <>
                      <Upload className="w-12 h-12 mx-auto mb-3 text-slate-500" />
                      <p className="text-slate-400">
                        点击上传你想让说话的图片
                      </p>
                      <p className="text-slate-600 text-xs mt-1">
                        支持 JPG、PNG 格式
                      </p>
                    </>
                  )}
                </div>
              ) : (
                <div className="relative">
                  <img
                    src={imageTalkImageUrl}
                    alt="要说话的图片"
                    className="w-full h-64 object-cover rounded-lg"
                  />
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      setImageTalkImageUrl(null);
                      if (imageTalkInputRef.current) {
                        imageTalkInputRef.current.value = '';
                      }
                    }}
                    className="absolute top-2 right-2"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>
            
            {/* 语音文本输入 */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-white text-sm font-medium">
                  2. 输入语音文本（TTS）
                </Label>
                {imageTalkVoiceText.trim() && (
                  <span className="text-xs text-slate-400">
                    {imageTalkVoiceText.length} 字 · 约 {calculateRealDurationFromText(imageTalkVoiceText)} 秒
                  </span>
                )}
              </div>
              <Textarea
                placeholder="输入你想让数字人说的话...&#10;&#10;示例：&#10;大家好，我是今天的主播，很高兴为大家播报新闻！"
                value={imageTalkVoiceText}
                onChange={(e) => setImageTalkVoiceText(e.target.value)}
                className="min-h-[100px] bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500 resize-none text-lg"
                disabled={isGenerating || isGeneratingImageTalkBatch}
              />
            </div>
            
            {/* 视频画面提示词输入 */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-white text-sm font-medium">
                  3. 输入视频画面提示词
                </Label>
              </div>
              <Textarea
                placeholder="描述视频画面内容...&#10;&#10;示例：&#10;一位专业的新闻主播，坐在演播室里，表情自然，手势动作适中"
                value={imageTalkVideoPrompt}
                onChange={(e) => setImageTalkVideoPrompt(e.target.value)}
                className="min-h-[80px] bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500 resize-none"
                disabled={isGenerating || isGeneratingImageTalkBatch}
              />
              
              {/* 快捷模板按钮 */}
              <div className="mt-3 flex flex-wrap gap-2">
                {promptTemplates.map((template, index) => (
                  <Button
                    key={index}
                    variant="secondary"
                    size="sm"
                    onClick={() => setImageTalkVideoPrompt(template.template)}
                    disabled={isGenerating || isGeneratingImageTalkBatch}
                    className="text-xs bg-slate-700/50 hover:bg-slate-600/50 text-white"
                  >
                    {template.icon}
                    {template.title}
                  </Button>
                ))}
              </div>
            </div>
            
            {/* 自动时长开关 */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Switch
                  id="image-talk-auto-duration"
                  checked={imageTalkAutoDuration}
                  onCheckedChange={setImageTalkAutoDuration}
                  disabled={isGenerating || isGeneratingImageTalkBatch}
                />
                <Label htmlFor="image-talk-auto-duration" className="text-white text-sm">
                  自动匹配时长
                </Label>
              </div>
              {imageTalkVoiceText.trim() && calculateRealDurationFromText(imageTalkVoiceText) > 12 && (
                <span className="text-xs text-amber-400">
                  ⚠️ 文字较长，将分 {Math.ceil(calculateRealDurationFromText(imageTalkVoiceText) / 12)} 段生成
                </span>
              )}
            </div>
            
            {/* 视频比例设置 */}
            <div>
              <Label className="text-white text-sm font-medium mb-2 block">
                视频比例
              </Label>
              <Select 
                value={imageTalkRatio} 
                onValueChange={setImageTalkRatio} 
                disabled={isGenerating || isGeneratingImageTalkBatch}
              >
                <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-600">
                  <SelectItem value="16:9">16:9 (横屏)</SelectItem>
                  <SelectItem value="9:16">9:16 (竖屏)</SelectItem>
                  <SelectItem value="1:1">1:1 (方形)</SelectItem>
                  <SelectItem value="4:3">4:3 (传统)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* 视频时长设置（仅在非自动模式下显示） */}
            {!imageTalkAutoDuration && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-white text-sm font-medium">
                    视频时长
                  </Label>
                  <span className="text-cyan-400 text-sm font-mono">
                    {imageTalkDuration}秒
                  </span>
                </div>
                <Slider
                  value={[imageTalkDuration]}
                  onValueChange={(value) => setImageTalkDuration(value[0])}
                  min={5}
                  max={12}
                  step={1}
                  className="w-full"
                  disabled={isGenerating || isGeneratingImageTalkBatch}
                />
                <div className="flex justify-between mt-1 text-xs text-slate-500">
                  <span>5秒</span>
                  <span>12秒</span>
                </div>
              </div>
            )}
            
            {/* 生成按钮 */}
            <Button
              onClick={async () => {
                if (!imageTalkImageUrl || !imageTalkVoiceText.trim()) return;
                
                const totalDuration = calculateRealDurationFromText(imageTalkVoiceText);
                
                if (totalDuration <= 12) {
                  // 短文本：单次生成
                  setFirstFrameUrl(imageTalkImageUrl);
                  // 组合视频画面提示词 + 语音文本
                  const combinedPrompt = `${imageTalkVideoPrompt}，正在说：${imageTalkVoiceText}`;
                  setPrompt(combinedPrompt);
                  setDuration(imageTalkAutoDuration ? calculateValidDurationFromText(imageTalkVoiceText) : imageTalkDuration);
                  setRatio(imageTalkRatio);
                  handleGenerate();
                } else {
                  // 长文本：分批次生成
                  setIsGeneratingImageTalkBatch(true);
                  setImageTalkBatchProgress(0);
                  setError(null);
                  setVideoUrl(null);
                  
                  try {
                    const segments = splitTextIntoSegments(imageTalkVoiceText, 12);
                    const generatedVideos: string[] = [];
                    
                    // 第一个视频用用户上传的图片
                    let currentFirstFrame = imageTalkImageUrl;
                    
                    for (let i = 0; i < segments.length; i++) {
                      const segmentDuration = calculateValidDurationFromText(segments[i]);
                      // 组合视频画面提示词 + 语音文本片段
                      const combinedPrompt = `${imageTalkVideoPrompt}，正在说：${segments[i]}`;
                      
                      const response = await fetch('/api/generate-video', {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                          prompt: combinedPrompt,
                          duration: segmentDuration,
                          ratio: imageTalkRatio,
                          generateAudio: true,
                          firstFrameUrl: currentFirstFrame,
                          model,
                        }),
                      });
                      
                      const data = await response.json();
                      
                      if (!response.ok) {
                        throw new Error(data.error || `第 ${i + 1} 段视频生成失败`);
                      }
                      
                      generatedVideos.push(data.videoUrl);
                      
                      // 保存到历史记录
                      saveToHistory({
                        videoUrl: data.videoUrl,
                        prompt: combinedPrompt,
                        duration: segmentDuration,
                        ratio: imageTalkRatio,
                        generateAudio: true,
                        model,
                        firstFrameUrl: currentFirstFrame,
                      });
                      
                      // 如果不是最后一个片段，提取当前视频的最后一帧作为下一个的首帧
                      if (i < segments.length - 1) {
                        try {
                          const lastFrameUrl = await extractVideoLastFrame(data.videoUrl);
                          if (lastFrameUrl) {
                            currentFirstFrame = lastFrameUrl;
                          }
                        } catch (extractErr) {
                          console.error('提取最后一帧失败，继续使用当前首帧:', extractErr);
                        }
                      }
                    }
                    
                    setImageTalkBatchProgress(100);
                    
                    // 显示第一个生成的视频
                    if (generatedVideos.length > 0) {
                      setVideoUrl(generatedVideos[0]);
                    }
                    
                  } catch (err) {
                    setError(err instanceof Error ? err.message : '分批次生成视频时发生错误');
                  } finally {
                    setIsGeneratingImageTalkBatch(false);
                    setImageTalkBatchProgress(0);
                  }
                }
              }}
              disabled={isGenerating || !imageTalkImageUrl || !imageTalkVoiceText.trim() || isUploadingImageTalk || isGeneratingImageTalkBatch}
              className="w-full py-6 text-lg font-semibold bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white"
            >
              {isGenerating || isGeneratingImageTalkBatch ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  {isGeneratingImageTalkBatch ? (
                    <>分批次生成中 {imageTalkBatchProgress}%</>
                  ) : (
                    <>生成中...</>
                  )}
                </>
              ) : (
                <>
                  <Mic className="w-5 h-5 mr-2" />
                  {imageTalkVoiceText.trim() && calculateRealDurationFromText(imageTalkVoiceText) > 12 
                    ? `分 ${Math.ceil(calculateRealDurationFromText(imageTalkVoiceText) / 12)} 段生成视频`
                    : '让图片说话'
                  }
                </>
              )}
            </Button>
            
            {!imageTalkImageUrl && !isUploadingImageTalk && (
              <p className="text-cyan-400 text-xs text-center">
                ⚠️ 请先上传图片
              </p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
