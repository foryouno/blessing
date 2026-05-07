'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, Upload, Mic, History, Copy, Play, Loader2, Sparkles } from 'lucide-react';
import Link from 'next/link';

// TTS 模型列表
const TTS_MODELS = [
  { id: 'doubao-seed-tts', name: '豆包 Seed TTS' },
  { id: 'doubao-tts', name: '豆包 TTS' },
  { id: 'generic-tts', name: '通用 TTS' },
];

// 快捷模板
const imageTalkTemplates = [
  { title: '专业新闻主播', videoPrompt: '一位专业的新闻主播正在电视台直播间，认真严肃，眼神坚定' },
  { title: '亲切知识博主', videoPrompt: '一位亲切的知识博主坐在温馨书房，微笑讲解，眼神友好' },
  { title: '严肃商业演讲', videoPrompt: '一位商务人士在会议室做演讲，自信有力，手势得体' },
  { title: '活泼产品介绍', videoPrompt: '一位活泼的产品经理在展示产品，热情洋溢，充满活力' },
  { title: '温柔故事讲述', videoPrompt: '一位温柔的讲述者在安静的环境中，语气温和，眼神柔和' },
  { title: '激情销售推广', videoPrompt: '一位充满激情的销售在推广产品，充满感染力，肢体语言丰富' },
  { title: '自信培训讲师', videoPrompt: '一位自信的培训讲师在培训室，专业权威，条理清晰' },
  { title: '可爱儿童主播', videoPrompt: '一位可爱的小主播在演播室，天真活泼，笑容灿烂' },
];

// 视频模型列表
const VIDEO_MODELS = [
  { id: 'doubao-seedance-1-5-pro-251215', name: 'Seedance 1.5 Pro' },
];

// 分辨率选项
const RATIOS = [
  { id: '16:9', name: '16:9 (横屏)', width: 1920, height: 1080 },
  { id: '9:16', name: '9:16 (竖屏)', width: 1080, height: 1920 },
  { id: '1:1', name: '1:1 (正方形)', width: 1024, height: 1024 },
];

// 历史记录类型
interface ScriptHistoryItem {
  id: string;
  voiceText: string;
  videoPrompt: string;
  ttsModel: string;
  model: string;
  duration: number;
  ratio: string;
  timestamp: number;
  imageUrl?: string;
  videoUrl?: string;
}

// 时长计算函数
const calculateRealDurationFromText = (text: string): number => {
  if (!text.trim()) return 0;
  const cleanText = text.replace(/\s/g, '');
  
  let chineseChars = 0;
  let otherChars = 0;
  
  for (const char of cleanText) {
    if (/[\u4e00-\u9fa5]/.test(char)) {
      chineseChars++;
    } else {
      otherChars++;
    }
  }
  
  const chineseDuration = chineseChars / 4;
  const otherDuration = otherChars / 5;
  const totalDuration = chineseDuration + otherDuration;
  
  return Math.round(totalDuration);
};

// 计算有效时长（5-12秒）
const calculateValidDurationFromText = (text: string): number => {
  const realDuration = calculateRealDurationFromText(text);
  if (realDuration <= 0) return 5;
  if (realDuration < 5) return 5;
  if (realDuration > 12) return 12;
  return realDuration;
};

// 文本分段函数
const splitTextIntoSegments = (text: string): string[] => {
  const segments: string[] = [];
  
  // 先按句子拆分
  const sentences = text.split(/(?<=[。！？.!?])/).filter(s => s.trim());
  
  let currentSegment = '';
  
  for (const sentence of sentences) {
    const testSegment = currentSegment + sentence;
    const testDuration = calculateRealDurationFromText(testSegment);
    
    if (testDuration > 12) {
      if (currentSegment) {
        segments.push(currentSegment.trim());
        currentSegment = sentence;
      } else {
        // 单个句子就超过12秒，强制拆分
        const chars = sentence.split('');
        let tempSegment = '';
        for (const char of chars) {
          const testTemp = tempSegment + char;
          if (calculateRealDurationFromText(testTemp) > 12) {
            if (tempSegment) {
              segments.push(tempSegment.trim());
            }
            tempSegment = char;
          } else {
            tempSegment = char;
          }
        }
        if (tempSegment) {
          currentSegment = tempSegment;
        }
      }
    } else {
      currentSegment = testSegment;
    }
  }
  
  if (currentSegment) {
    segments.push(currentSegment.trim());
  }
  
  return segments;
};

export default function AvatarTalkPage() {
  // 返回首页
  const goHome = () => {
    window.location.href = '/';
  };

  // 图片说话功能状态
  const [imageTalkImageUrl, setImageTalkImageUrl] = useState<string>('');
  const [imageTalkVoiceText, setImageTalkVoiceText] = useState('');
  const [imageTalkVideoPrompt, setImageTalkVideoPrompt] = useState('一位专业的数字人正在认真朗读稿件...');
  const [imageTalkTtsModel, setImageTalkTtsModel] = useState('doubao-seed-tts');
  const [imageTalkAutoDuration, setImageTalkAutoDuration] = useState(true);
  const [imageTalkDuration, setImageTalkDuration] = useState(12);
  const [imageTalkRatio, setImageTalkRatio] = useState('16:9');
  const [imageTalkModel, setImageTalkModel] = useState('doubao-seedance-1-5-pro-251215');

  // 上传图片状态
  const [isUploadingImageTalk, setIsUploadingImageTalk] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');

  // 视频输出
  const [videoUrl, setVideoUrl] = useState('');
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('');

  // 历史记录
  const [history, setHistory] = useState<ScriptHistoryItem[]>([]);

  // 从 localStorage 加载历史记录
  useEffect(() => {
    const savedHistory = localStorage.getItem('avatar-talk-history');
    if (savedHistory) {
      setHistory(JSON.parse(savedHistory));
    }
  }, []);

  // 保存到历史记录
  const saveToHistory = (item: Omit<ScriptHistoryItem, 'id' | 'timestamp'>) => {
    const newItem: ScriptHistoryItem = {
      ...item,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: Date.now(),
    };
    const newHistory = [newItem, ...history].slice(0, 50); // 只保留最近50条
    setHistory(newHistory);
    localStorage.setItem('avatar-talk-history', JSON.stringify(newHistory));
  };

  // 从历史记录加载
  const loadFromHistory = (item: ScriptHistoryItem) => {
    if (item.imageUrl) setImageTalkImageUrl(item.imageUrl);
    setImageTalkVoiceText(item.voiceText);
    setImageTalkVideoPrompt(item.videoPrompt);
    setImageTalkTtsModel(item.ttsModel);
    setImageTalkModel(item.model);
    setImageTalkDuration(item.duration);
    setImageTalkRatio(item.ratio);
    if (item.videoUrl) setVideoUrl(item.videoUrl);
  };

  // 复制文本
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  // 上传图片（图片说话）
  const handleImageTalkImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingImageTalk(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload-image', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.success && data.imageUrl) {
        setImageTalkImageUrl(data.imageUrl);
      } else {
        setError(data.error || '上传图片失败');
      }
    } catch {
      setError('上传图片时发生错误');
    } finally {
      setIsUploadingImageTalk(false);
    }
  };

  // 生成视频
  const handleGenerate = async () => {
    if (!imageTalkVoiceText.trim()) {
      setError('请输入语音文本');
      return;
    }

    if (!imageTalkImageUrl) {
      setError('请先上传图片');
      return;
    }

    setIsGenerating(true);
    setError('');
    setVideoUrl('');
    setProgress(0);
    setStatusText('准备生成...');

    try {
      const finalPrompt = `${imageTalkVideoPrompt}，正在说：${imageTalkVoiceText}`;
      const finalDuration = imageTalkAutoDuration 
        ? calculateValidDurationFromText(imageTalkVoiceText)
        : imageTalkDuration;

      setStatusText('正在生成视频...');
      setProgress(30);

      const response = await fetch('/api/generate-video', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: finalPrompt,
          duration: finalDuration,
          ratio: imageTalkRatio,
          model: imageTalkModel,
          firstFrameUrl: imageTalkImageUrl,
          generateAudio: true,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '生成视频失败');
      }

      setProgress(100);
      setStatusText('生成完成！');
      setVideoUrl(data.videoUrl);

      saveToHistory({
        voiceText: imageTalkVoiceText,
        videoPrompt: imageTalkVideoPrompt,
        ttsModel: imageTalkTtsModel,
        model: imageTalkModel,
        duration: finalDuration,
        ratio: imageTalkRatio,
        imageUrl: imageTalkImageUrl,
        videoUrl: data.videoUrl,
      });

    } catch (err) {
      setError(err instanceof Error ? err.message : '生成视频时发生错误');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* 顶部导航 */}
      <div className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button 
              variant="ghost" 
              onClick={goHome}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              返回首页
            </Button>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Mic className="w-6 h-6 text-cyan-500" />
              数字人口播
            </h1>
            <div className="w-[100px]" />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 左侧：生成区域 */}
          <div className="space-y-6">
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">1. 上传图片</h2>
              
              <div className="space-y-4">
                {imageTalkImageUrl ? (
                  <div className="relative">
                    <img 
                      src={imageTalkImageUrl} 
                      alt="上传的图片" 
                      className="w-full h-64 object-cover rounded-lg"
                    />
                    <Button
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={() => setImageTalkImageUrl('')}
                    >
                      移除
                    </Button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border rounded-lg cursor-pointer bg-muted/50 hover:bg-muted">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload className="w-8 h-8 mb-2 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        {isUploadingImageTalk ? '上传中...' : '点击或拖拽上传图片'}
                      </p>
                    </div>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handleImageTalkImageUpload}
                      disabled={isUploadingImageTalk}
                    />
                  </label>
                )}
              </div>
            </Card>

            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">2. 输入内容</h2>
              
              <div className="space-y-4">
                <div>
                  <Label>语音文本（TTS）</Label>
                  <Textarea
                    value={imageTalkVoiceText}
                    onChange={(e) => setImageTalkVoiceText(e.target.value)}
                    placeholder="请输入语音文本..."
                    className="min-h-[120px] mt-1"
                  />
                  {imageTalkVoiceText.trim() && (
                    <div className="mt-2 text-sm text-muted-foreground">
                      预估时长：{calculateRealDurationFromText(imageTalkVoiceText)} 秒
                      {calculateRealDurationFromText(imageTalkVoiceText) > 12 && (
                        <span className="text-amber-500 ml-2">
                          （超过12秒，建议分段）
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <Label>TTS 模型</Label>
                  <Select 
                    value={imageTalkTtsModel} 
                    onValueChange={setImageTalkTtsModel}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TTS_MODELS.map((m) => (
                        <SelectItem key={m.id} value={m.id}>
                          {m.name}
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
              <h2 className="text-xl font-semibold mb-4">4. 参数设置</h2>
              
              <div className="space-y-4">
                <div>
                  <Label>视频模型</Label>
                  <Select 
                    value={imageTalkModel} 
                    onValueChange={setImageTalkModel}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {VIDEO_MODELS.map((m) => (
                        <SelectItem key={m.id} value={m.id}>
                          {m.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

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

                <div>
                  <Label>分辨率</Label>
                  <Select value={imageTalkRatio} onValueChange={setImageTalkRatio}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {RATIOS.map((r) => (
                        <SelectItem key={r.id} value={r.id}>
                          {r.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </Card>

            {error && (
              <Card className="p-4 bg-destructive/10 border-destructive">
                <p className="text-destructive">{error}</p>
              </Card>
            )}

            {statusText && (
              <Card className="p-4">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">{statusText}</p>
                  {progress > 0 && (
                    <div className="w-full bg-muted rounded-full h-2">
                      <div 
                        className="bg-cyan-500 h-2 rounded-full transition-all"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  )}
                </div>
              </Card>
            )}

            <Button
              size="lg"
              className="w-full"
              onClick={handleGenerate}
              disabled={isGenerating || !imageTalkImageUrl || !imageTalkVoiceText.trim() || isUploadingImageTalk}
            >
              {isGenerating ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  正在生成...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5" />
                  生成视频
                </span>
              )}
            </Button>

            {videoUrl && (
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">生成结果</h3>
                <video
                  src={videoUrl}
                  controls
                  className="w-full rounded-lg"
                  autoPlay
                />
              </Card>
            )}
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
                  <p className="text-sm">生成视频后会自动保存到这里</p>
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
                            title="加载"
                          >
                            <Play className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(item.voiceText)}
                            title="复制语音文本"
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground mb-2">
                        <span className="font-medium">{TTS_MODELS.find(m => m.id === item.ttsModel)?.name}</span>
                        {' • '}
                        <span className="font-medium">{VIDEO_MODELS.find(m => m.id === item.model)?.name}</span>
                        {' • '}
                        <span>{item.duration}秒</span>
                        {' • '}
                        <span>{item.ratio}</span>
                      </div>
                      {item.imageUrl && (
                        <img
                          src={item.imageUrl}
                          alt="缩略图"
                          className="w-full h-24 object-cover rounded mb-2"
                        />
                      )}
                      <div className="text-sm font-medium mb-1">语音文本：</div>
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                        {item.voiceText}
                      </p>
                      <div className="text-sm font-medium mb-1">画面提示：</div>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {item.videoPrompt}
                      </p>
                      {item.videoUrl && (
                        <div className="mt-3">
                          <video
                            src={item.videoUrl}
                            controls
                            className="w-full rounded"
                          />
                        </div>
                      )}
                    </Card>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
