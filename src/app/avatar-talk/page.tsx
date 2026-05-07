'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, X, Mic, User, ArrowLeft, Copy, Check, History } from 'lucide-react';
import Link from 'next/link';

interface ScriptHistoryItem {
  id: string;
  voiceText: string;
  videoPrompt: string;
  duration: number;
  ttsModel: string;
  timestamp: number;
}

export default function AvatarTalkPage() {
  // 图片说话功能状态
  const [imageTalkImageUrl, setImageTalkImageUrl] = useState<string | null>(null);
  const [imageTalkVoiceText, setImageTalkVoiceText] = useState('');
  const [imageTalkVideoPrompt, setImageTalkVideoPrompt] = useState('一位专业的数字人正在认真朗读稿件，表情自然，手势动作适中，背景简洁大方');
  const [imageTalkDuration, setImageTalkDuration] = useState(12);
  const [imageTalkAutoDuration, setImageTalkAutoDuration] = useState(true);
  const [imageTalkTtsModel, setImageTalkTtsModel] = useState('doubao-seed-tts');
  const [isUploadingImageTalk, setIsUploadingImageTalk] = useState(false);
  const [history, setHistory] = useState<ScriptHistoryItem[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  // TTS 模型列表
  const ttsModels = [
    { value: 'doubao-seed-tts', label: '豆包 Seed TTS' },
    { value: 'doubao-tts', label: '豆包 TTS' },
    { value: 'generic-tts', label: '通用 TTS' }
  ];
  
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

  // 图片说话快捷模板
  const imageTalkTemplates = [
    { title: '专业新闻主播', voicePrompt: '', videoPrompt: '一位专业的新闻主播正在电视台直播间，认真严肃，眼神坚定，动作专业' },
    { title: '亲切知识博主', voicePrompt: '', videoPrompt: '一位亲切的知识博主坐在温馨书房，微笑讲解，眼神友好，动作自然' },
    { title: '严肃商业演讲', voicePrompt: '', videoPrompt: '一位商务人士在会议室做演讲，自信有力，手势得体，着装正式' },
    { title: '活泼产品介绍', voicePrompt: '', videoPrompt: '一位活泼的产品经理在展示产品，热情洋溢，充满活力，感染力强' },
    { title: '温柔故事讲述', voicePrompt: '', videoPrompt: '一位温柔的讲述者在安静的环境中，语气温和，眼神柔和，氛围宁静' },
    { title: '激情销售推广', voicePrompt: '', videoPrompt: '一位充满激情的销售在推广产品，充满感染力，肢体语言丰富，热情高涨' },
    { title: '自信培训讲师', voicePrompt: '', videoPrompt: '一位自信的培训讲师在培训室，专业权威，条理清晰，富有说服力' },
    { title: '可爱儿童主播', voicePrompt: '', videoPrompt: '一位可爱的小主播在演播室，天真活泼，笑容灿烂，充满童趣' }
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
      
      currentSegment += sentence;
      currentDuration += sentenceDuration;
    }
    
    // 添加最后一段
    if (currentSegment.trim()) {
      segments.push(currentSegment.trim());
    }
    
    return segments;
  };

  // 图片上传处理
  const handleImageTalkImageUpload = async (file: File) => {
    setIsUploadingImageTalk(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/upload-image', {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        throw new Error('图片上传失败');
      }
      
      const data = await response.json();
      setImageTalkImageUrl(data.imageUrl);
    } catch (err) {
      console.error('图片上传失败:', err);
      alert('图片上传失败，请重试');
    } finally {
      setIsUploadingImageTalk(false);
    }
  };

  // 保存到历史记录
  const saveToHistory = (voiceText: string, videoPrompt: string, duration: number, ttsModel: string) => {
    const newItem: ScriptHistoryItem = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      voiceText,
      videoPrompt,
      duration,
      ttsModel,
      timestamp: Date.now()
    };
    
    const updatedHistory = [newItem, ...history].slice(0, 50);
    setHistory(updatedHistory);
    
    if (typeof window !== 'undefined') {
      localStorage.setItem('avatar-talk-history', JSON.stringify(updatedHistory));
    }
  };

  // 从历史记录加载
  const loadFromHistory = (item: ScriptHistoryItem) => {
    setImageTalkVoiceText(item.voiceText);
    setImageTalkVideoPrompt(item.videoPrompt);
    setImageTalkDuration(item.duration);
    if (item.ttsModel) {
      setImageTalkTtsModel(item.ttsModel);
    }
  };

  // 复制到剪贴板
  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('复制失败:', err);
    }
  };

  // 自动时长计算监听
  useEffect(() => {
    if (imageTalkAutoDuration && imageTalkVoiceText) {
      const validDuration = calculateValidDurationFromText(imageTalkVoiceText);
      setImageTalkDuration(validDuration);
    }
  }, [imageTalkVoiceText, imageTalkAutoDuration]);

  // 从localStorage加载历史记录
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedHistory = localStorage.getItem('avatar-talk-history');
      if (savedHistory) {
        setHistory(JSON.parse(savedHistory));
      }
    }
  }, []);

  // 处理文本变化，自动保存
  const handleGenerate = () => {
    if (!imageTalkVoiceText.trim()) {
      alert('请输入语音文本');
      return;
    }

    // 计算实际时长和分段
    const realDuration = calculateRealDurationFromText(imageTalkVoiceText);
    const segments = splitTextIntoSegments(imageTalkVoiceText);
    
    // 保存到历史记录
    saveToHistory(imageTalkVoiceText, imageTalkVideoPrompt, imageTalkDuration, imageTalkTtsModel);
    
    alert(`✅ 脚本已生成并保存！\n\n预计时长：${realDuration}秒\n分段数量：${segments.length}段`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-muted/50 to-background">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* 顶部导航 */}
        <div className="mb-6">
          <Link href="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4">
            <ArrowLeft className="w-4 h-4" />
            返回首页
          </Link>
          
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Mic className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">数字人口播</h1>
              <p className="text-muted-foreground">语音文本 + 视频画面提示词</p>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* 左侧：输入区域 */}
          <div className="space-y-4">
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <User className="w-5 h-5" />
                1. 上传图片（可选）
              </h2>
              
              {!imageTalkImageUrl ? (
                <div className="flex flex-col items-center gap-4">
                  <div
                    className="border-2 border-dashed border-border rounded-lg p-8 cursor-pointer hover:border-primary/50 transition-colors w-full text-center"
                    onClick={() => imageTalkInputRef.current?.click()}
                  >
                    <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-muted-foreground">点击或拖拽上传图片</p>
                  </div>
                  <input
                    ref={imageTalkInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleImageTalkImageUpload(file);
                    }}
                  />
                </div>
              ) : (
                <div className="relative">
                  <img
                    src={imageTalkImageUrl}
                    alt="首帧"
                    className="w-full rounded-lg"
                  />
                  <button
                    onClick={() => setImageTalkImageUrl(null)}
                    className="absolute top-2 right-2 p-1 bg-black/50 rounded-full hover:bg-black/70 transition-colors"
                  >
                    <X className="w-4 h-4 text-white" />
                  </button>
                </div>
              )}
            </Card>

            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Mic className="w-5 h-5" />
                2. 语音文本（TTS）
              </h2>
              
              <div className="space-y-3">
                <div>
                  <Label>输入你想让数字人说的话</Label>
                  <Textarea
                    value={imageTalkVoiceText}
                    onChange={(e) => setImageTalkVoiceText(e.target.value)}
                    placeholder="请输入语音文本..."
                    className="min-h-[150px] mt-1"
                  />
                  {imageTalkVoiceText && (
                    <p className="text-sm text-muted-foreground mt-1">
                      预计时长：{calculateRealDurationFromText(imageTalkVoiceText)}秒
                      {calculateRealDurationFromText(imageTalkVoiceText) > 12 && 
                        `（建议分 ${splitTextIntoSegments(imageTalkVoiceText).length} 段）`
                      }
                    </p>
                  )}
                </div>
                
                <div>
                  <Label>TTS 模型</Label>
                  <Select value={imageTalkTtsModel} onValueChange={setImageTalkTtsModel}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="选择 TTS 模型" />
                    </SelectTrigger>
                    <SelectContent>
                      {ttsModels.map((model) => (
                        <SelectItem key={model.value} value={model.value}>
                          {model.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label>视频画面提示词</Label>
                  <Textarea
                    value={imageTalkVideoPrompt}
                    onChange={(e) => setImageTalkVideoPrompt(e.target.value)}
                    placeholder="请输入视频画面提示词..."
                    className="min-h-[100px] mt-1"
                  />
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">3. 快捷模板</h2>
              
              <div className="grid grid-cols-2 gap-2">
                {imageTalkTemplates.map((template, idx) => (
                  <Button
                    key={idx}
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setImageTalkVideoPrompt(template.videoPrompt);
                    }}
                  >
                    {template.title}
                  </Button>
                ))}
              </div>
            </Card>

            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">4. 时长设置</h2>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>自动匹配文字时长</Label>
                  <Switch
                    checked={imageTalkAutoDuration}
                    onCheckedChange={setImageTalkAutoDuration}
                  />
                </div>
                
                {!imageTalkAutoDuration && (
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label>视频时长</Label>
                      <span className="text-sm text-muted-foreground">{imageTalkDuration} 秒</span>
                    </div>
                    <Slider
                      value={[imageTalkDuration]}
                      onValueChange={([value]) => setImageTalkDuration(value)}
                      min={5}
                      max={12}
                      step={1}
                    />
                  </div>
                )}
              </div>
            </Card>

            <Button
              size="lg"
              className="w-full"
              onClick={handleGenerate}
            >
              生成并保存脚本
            </Button>
          </div>

          {/* 右侧：历史记录 */}
          <div className="space-y-4">
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <History className="w-5 h-5" />
                历史记录
              </h2>
              
              {history.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>暂无历史记录</p>
                  <p className="text-sm">生成脚本后会自动保存到这里</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[600px] overflow-y-auto">
                  {history.map((item) => (
                    <Card key={item.id} className="p-4">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="text-sm text-muted-foreground">
                          {new Date(item.timestamp).toLocaleString('zh-CN')}
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => loadFromHistory(item)}
                          >
                            加载
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(
                              `语音文本：${item.voiceText}\n\n视频画面：${item.videoPrompt}`,
                              item.id
                            )}
                          >
                            {copiedId === item.id ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                          </Button>
                        </div>
                      </div>
                      
                      <div className="text-sm space-y-2">
                        <div>
                          <div className="font-medium mb-1">语音文本：</div>
                          <div className="text-muted-foreground line-clamp-2">{item.voiceText}</div>
                        </div>
                        <div>
                          <div className="font-medium mb-1">视频画面：</div>
                          <div className="text-muted-foreground line-clamp-2">{item.videoPrompt}</div>
                        </div>
                        <div className="text-xs text-muted-foreground space-y-1">
                          <div>预计时长：{item.duration}秒</div>
                          {item.ttsModel && (
                            <div>TTS 模型：{ttsModels.find(m => m.value === item.ttsModel)?.label || item.ttsModel}</div>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </Card>

            {/* 分段预览（如果有长文本） */}
            {imageTalkVoiceText && calculateRealDurationFromText(imageTalkVoiceText) > 12 && (
              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4">分段预览</h2>
                <div className="space-y-2">
                  {splitTextIntoSegments(imageTalkVoiceText).map((segment, idx) => (
                    <Card key={idx} className="p-3">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-medium">第 {idx + 1} 段</span>
                        <span className="text-sm text-muted-foreground">
                          {calculateRealDurationFromText(segment)}秒
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">{segment}</p>
                    </Card>
                  ))}
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
