'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sparkles, Video, Loader2, Download, Play, Upload, X, History, Trash2, Clock, Lightbulb, Copy, Wand2, Palette, Zap, Film, User, Mic, Smile, Monitor, AlignLeft } from 'lucide-react';

interface VideoHistoryItem {
  id: string;
  videoUrl: string;
  prompt: string;
  duration: number;
  ratio: string;
  resolution: string;
  generateAudio: boolean;
  model: string;
  firstFrameUrl?: string;
  lastFrameUrl?: string;
  createdAt: string;
}

export default function VideoGenerator() {
  const [prompt, setPrompt] = useState('');
  const [duration, setDuration] = useState(5);
  const [ratio, setRatio] = useState('16:9');
  const [resolution, setResolution] = useState('720p');
  const [generateAudio, setGenerateAudio] = useState(true);
  const [model, setModel] = useState('doubao-seedance-1-5-pro-251215');
  const [isGenerating, setIsGenerating] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mergeVoiceAndVideo, setMergeVoiceAndVideo] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<VideoHistoryItem[]>([]);
  const [showTemplates, setShowTemplates] = useState(false);
  
  // 强制重新编译的注释

  const promptTemplates = [
    {
      title: '数字人读稿',
      icon: <AlignLeft className="w-4 h-4" />,
      template: '一位专业的数字人正在认真朗读稿件，表情自然，语速适中，眼神专注，吐字清晰，专业的播读风格'
    },
    {
      title: '数字人主播',
      icon: <User className="w-4 h-4" />,
      template: '一位专业的数字人主播，站在简洁的演播室背景前，微笑着面向镜头，手势自然，语速适中，光线柔和'
    },
    {
      title: '数字人讲解',
      icon: <Mic className="w-4 h-4" />,
      template: '数字人在讲解知识，站在白板或屏幕前，配合手势动作，表情丰富，背景简洁专业'
    },
    {
      title: '数字人问候',
      icon: <Smile className="w-4 h-4" />,
      template: '友好的数字人向镜头挥手问候，笑容亲切，眼神温暖，动作自然流畅'
    },
    {
      title: '数字人播报',
      icon: <Monitor className="w-4 h-4" />,
      template: '数字人新闻主播，坐在专业的新闻主播台前，表情严肃认真，播报新闻内容，背景是新闻演播室'
    },
    {
      title: '风格转换',
      icon: <Palette className="w-4 h-4" />,
      template: '@首帧 保持画面主体，将风格转换为动漫风格，色彩鲜艳，线条流畅'
    },
    {
      title: '镜头运动',
      icon: <Film className="w-4 h-4" />,
      template: '@首帧 镜头从远景缓慢推近，聚焦于主体，然后平滑过渡到 @末帧'
    },
    {
      title: '魔法效果',
      icon: <Wand2 className="w-4 h-4" />,
      template: '@首帧 画面中出现魔法粒子效果，物体缓缓漂浮，光影变化柔和'
    },
    {
      title: '快速转场',
      icon: <Zap className="w-4 h-4" />,
      template: '@首帧 快速缩放模糊转场，无缝衔接 @末帧，节奏感强烈'
    }
  ];
  
  const [firstFrameUrl, setFirstFrameUrl] = useState<string | null>(null);
  const [lastFrameUrl, setLastFrameUrl] = useState<string | null>(null);
  const [isUploadingFirst, setIsUploadingFirst] = useState(false);
  const [isUploadingLast, setIsUploadingLast] = useState(false);
  const [activeTab, setActiveTab] = useState('text');
  const [autoDuration, setAutoDuration] = useState(true);
  const [selectedVoice, setSelectedVoice] = useState('zh_female_xiaohe_uranus_bigtts');
  const [avatarImageUrl, setAvatarImageUrl] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [avatarPrompt, setAvatarPrompt] = useState('');
  const [avatarVideoUrl, setAvatarVideoUrl] = useState<string | null>(null);
  const [avatarStep, setAvatarStep] = useState<'idle' | 'generating-audio' | 'generating-video' | 'completed'>('idle');
  
  // 语音选项
  const voiceOptions = [
    { value: 'zh_female_xiaohe_uranus_bigtts', label: '小荷 - 女声（通用）' },
    { value: 'zh_female_vv_uranus_bigtts', label: 'Vivi - 女声（中英双语）' },
    { value: 'zh_male_m191_uranus_bigtts', label: '云舟 - 男声' },
    { value: 'zh_male_taocheng_uranus_bigtts', label: '小天 - 男声' },
    { value: 'zh_female_xueayi_saturn_bigtts', label: '雪怡 - 儿童有声书' },
    { value: 'zh_male_dayi_saturn_bigtts', label: '大义 - 男声（视频配音）' },
    { value: 'zh_female_mizai_saturn_bigtts', label: '米仔 - 女声（视频配音）' },
    { value: 'zh_female_jitangnv_saturn_bigtts', label: '鸡汤女 - 励志女声' },
    { value: 'zh_female_meilinvyou_saturn_bigtts', label: '魅力女友 - 女声' },
    { value: 'zh_male_ruyayichen_saturn_bigtts', label: '儒雅逸晨 - 男声' }
  ];
  
  const firstFrameInputRef = useRef<HTMLInputElement>(null);
  const lastFrameInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const savedHistory = localStorage.getItem('videoHistory');
    if (savedHistory) {
      setHistory(JSON.parse(savedHistory));
    }
  }, []);

  const saveToHistory = (item: VideoHistoryItem) => {
    const newHistory = [item, ...history].slice(0, 50);
    setHistory(newHistory);
    localStorage.setItem('videoHistory', JSON.stringify(newHistory));
  };

  const removeFromHistory = (id: string) => {
    const newHistory = history.filter(item => item.id !== id);
    setHistory(newHistory);
    localStorage.setItem('videoHistory', JSON.stringify(newHistory));
  };

  const clearHistory = () => {
    if (confirm('确定要清空所有历史记录吗？')) {
      setHistory([]);
      localStorage.removeItem('videoHistory');
    }
  };

  // 计算读稿时长（中文：每分钟 160 字）
  const calculateReadingDuration = (text: string): number => {
    // 去除空白字符，只计算有效字符
    const cleanText = text.replace(/\s/g, '');
    const charCount = cleanText.length;
    const wordsPerMinute = 160;
    const durationMinutes = charCount / wordsPerMinute;
    // 转换为秒，最小 5 秒，最大 60 秒（受模型限制）
    let durationSeconds = Math.ceil(durationMinutes * 60);
    durationSeconds = Math.max(5, Math.min(60, durationSeconds));
    return durationSeconds;
  };

  // 当文稿内容变化时自动更新时长
  useEffect(() => {
    if (autoDuration && activeTab === 'avatar') {
      const newDuration = calculateReadingDuration(prompt);
      setDuration(newDuration);
    }
  }, [prompt, autoDuration, activeTab]);

  const reuseFromHistory = (item: VideoHistoryItem) => {
    if (item.firstFrameUrl) {
      setFirstFrameUrl(item.firstFrameUrl);
    }
    if (item.lastFrameUrl) {
      setLastFrameUrl(item.lastFrameUrl);
    }
    setPrompt(item.prompt);
    setDuration(item.duration);
    setRatio(item.ratio);
    setResolution(item.resolution);
    setGenerateAudio(item.generateAudio);
    setModel(item.model);
    setShowHistory(false);
  };

  const handleImageUpload = async (file: File, type: 'first' | 'last') => {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/upload-image', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '上传图片失败');
      }

      if (type === 'first') {
        setFirstFrameUrl(data.imageUrl);
      } else {
        setLastFrameUrl(data.imageUrl);
      }
    } catch {
      setError('上传图片时发生错误');
    }
  };

  const handleFirstFrameSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingFirst(true);
    setError(null);
    await handleImageUpload(file, 'first');
    setIsUploadingFirst(false);
  };

  const handleLastFrameSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingLast(true);
    setError(null);
    await handleImageUpload(file, 'last');
    setIsUploadingLast(false);
  };

  const removeFirstFrame = () => {
    setFirstFrameUrl(null);
    if (firstFrameInputRef.current) {
      firstFrameInputRef.current.value = '';
    }
  };

  const removeLastFrame = () => {
    setLastFrameUrl(null);
    if (lastFrameInputRef.current) {
      lastFrameInputRef.current.value = '';
    }
  };

  const insertAtCursor = (text: string) => {
    const textarea = textareaRef.current;
    if (!textarea) {
      setPrompt(prev => prev + (prev ? ' ' : '') + text);
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newValue = prompt.substring(0, start) + text + prompt.substring(end);
    
    setPrompt(newValue);
    
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + text.length, start + text.length);
    }, 0);
  };

  const insertFirstFrameReference = () => {
    insertAtCursor('@首帧');
    if (activeTab !== 'text') {
      setActiveTab('text');
    }
  };

  const insertLastFrameReference = () => {
    insertAtCursor('@末帧');
    if (activeTab !== 'text') {
      setActiveTab('text');
    }
  };

  const avatarInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingAvatar(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload-image', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || '图片上传失败');
      }

      setAvatarImageUrl(data.imageUrl);
    } catch {
      setError('头像图片上传失败');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const removeAvatar = () => {
    setAvatarImageUrl(null);
    if (avatarInputRef.current) {
      avatarInputRef.current.value = '';
    }
  };

  const handleAvatarGenerate = async () => {
    if (!avatarPrompt.trim()) {
      setError('请输入要口播的内容');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setAudioUrl(null);
    setAvatarVideoUrl(null);
    setAvatarStep('generating-audio');

    try {
      // 第一步：生成 TTS 语音
      
      const ttsResponse = await fetch('/api/tts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: avatarPrompt,
          speaker: selectedVoice
        }),
      });
      
      const ttsData = await ttsResponse.json();
      if (!ttsResponse.ok) {
        throw new Error(ttsData.error || '音频生成失败');
      }
      
      if (ttsData.success && ttsData.audioUri) {
        setAudioUrl(ttsData.audioUri);
      }

      // 第二步：生成数字人视频 - 优化提示词促进口型同步
      setAvatarStep('generating-video');
      
      // 计算视频时长
      const cleanText = avatarPrompt.replace(/\s/g, '');
      const charCount = cleanText.length;
      const wordsPerMinute = 160;
      const durationMinutes = charCount / wordsPerMinute;
      let videoDuration = Math.ceil(durationMinutes * 60);
      videoDuration = Math.max(5, Math.min(60, videoDuration));

      // 优化提示词：促进口型同步和自然的朗读效果
      const enhancedPrompt = `一位专业的主播正在认真朗读，口型与语音同步，嘴唇自然开合，表情丰富自然，眼神专注，语速适中，专业的播读风格。清晰的口型动作，自然的面部表情，正面半身镜头，专业演播室背景。内容：${avatarPrompt}`;

      const videoResponse = await fetch('/api/generate-video', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: enhancedPrompt,
          duration: videoDuration,
          ratio: '16:9',
          resolution: '720p',
          generateAudio: true,
          firstFrameUrl: avatarImageUrl,
          model: 'doubao-seedance-1-5-pro-251215'
        }),
      });

      const videoData = await videoResponse.json();
      if (!videoResponse.ok) {
        throw new Error(videoData.error || '视频生成失败');
      }

      if (videoData.videoUrl) {
        setAvatarVideoUrl(videoData.videoUrl);
      }

      setAvatarStep('completed');
      
    } catch {
      setError('口播生成时发生错误');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim() && model !== 'doubao-seed-tts' && !firstFrameUrl) {
      setError('请输入视频描述或上传首帧图片');
      return;
    }
    
    if (!prompt.trim() && model === 'doubao-seed-tts') {
      setError('请输入要合成的文本内容');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setVideoUrl(null);
    setAudioUrl(null);

    try {
      // 如果选择的是 Doubao-Seed-TTS 模型，只生成音频
      if (model === 'doubao-seed-tts') {
        const ttsResponse = await fetch('/api/tts', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            text: prompt,
            speaker: selectedVoice
          }),
        });
        
        const ttsData = await ttsResponse.json();
        if (!ttsResponse.ok) {
          throw new Error(ttsData.error || '音频生成失败');
        }
        
        if (ttsData.success && ttsData.audioUri) {
          setAudioUrl(ttsData.audioUri);
        }
      } else if (activeTab === 'avatar' && mergeVoiceAndVideo && prompt.trim()) {
        // 语言合并模式：先生成 TTS 语音，再生成视频
        
        // 第一步：生成 TTS 语音
        try {
          const ttsResponse = await fetch('/api/tts', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              text: prompt,
              speaker: selectedVoice
            }),
          });
          
          const ttsData = await ttsResponse.json();
          if (ttsData.success && ttsData.audioUri) {
            setAudioUrl(ttsData.audioUri);
          }
        } catch {
          console.warn('TTS 生成失败');
        }

        // 第二步：生成视频（关闭自动音频生成）
        const response = await fetch('/api/generate-video', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            prompt,
            duration,
            ratio,
            resolution,
            generateAudio: false,
            firstFrameUrl,
            model
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || '生成视频失败');
        }

        setVideoUrl(data.videoUrl);
        
        saveToHistory({
          id: Date.now().toString(),
          videoUrl: data.videoUrl,
          prompt,
          duration,
          ratio,
          resolution,
          generateAudio: false,
          model,
          firstFrameUrl: firstFrameUrl || undefined,
          lastFrameUrl: lastFrameUrl || undefined,
          createdAt: new Date().toISOString(),
        });
      } else {
        // 否则生成视频
        
        // 如果是数字人标签页且开启音频，先调用 TTS 生成语音
        if (activeTab === 'avatar' && generateAudio && prompt.trim()) {
          try {
            const ttsResponse = await fetch('/api/tts', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                text: prompt,
                speaker: selectedVoice
              }),
            });
            
            const ttsData = await ttsResponse.json();
            if (ttsData.success && ttsData.audioUri) {
              // 虽然不使用 customAudioUrl，但我们仍然可以记录日志
            }
          } catch {
            console.warn('TTS 生成失败，将使用默认音频生成');
          }
        }

        const response = await fetch('/api/generate-video', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            prompt,
            duration,
            ratio,
            resolution,
            generateAudio,
            firstFrameUrl,
            lastFrameUrl,
            model
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || '生成视频失败');
        }

        setVideoUrl(data.videoUrl);
        
        saveToHistory({
          id: Date.now().toString(),
          videoUrl: data.videoUrl,
          prompt,
          duration,
          ratio,
          resolution,
          generateAudio,
          model,
          firstFrameUrl: firstFrameUrl || undefined,
          lastFrameUrl: lastFrameUrl || undefined,
          createdAt: new Date().toISOString(),
        });
      }
    } catch {
      setError(model === 'doubao-seed-tts' ? '音频生成时发生错误' : '生成视频时发生错误');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = async () => {
    if (!videoUrl && !audioUrl && !avatarVideoUrl) return;

    try {
      const url = videoUrl || avatarVideoUrl || audioUrl;
      const extension = (videoUrl || avatarVideoUrl) ? 'mp4' : 'mp3';
      const prefix = (videoUrl || avatarVideoUrl) ? 'video' : 'audio';
      
      const response = await fetch(url!);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `generated-${prefix}-${Date.now()}.${extension}`;
      link.click();
      window.URL.revokeObjectURL(blobUrl);
    } catch {
      setError('下载失败');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Video className="w-12 h-12 text-purple-400" />
            <h1 className="text-4xl font-bold text-white">AI 视频生成器</h1>
          </div>
          <p className="text-gray-400 text-lg">基于火山引擎 · 输入你的创意描述，AI 为你生成精彩视频</p>
        </div>

        <div className="max-w-4xl mx-auto mb-6">
          <div className="flex justify-end">
            <Button
              variant="secondary"
              onClick={() => setShowHistory(!showHistory)}
              className="flex items-center gap-2"
            >
              <History className="w-4 h-4" />
              {showHistory ? '隐藏历史' : '历史记录'}
              {history.length > 0 && (
                <span className="ml-1 px-2 py-0.5 bg-purple-600 rounded-full text-xs">
                  {history.length}
                </span>
              )}
            </Button>
          </div>
        </div>

        {showHistory && history.length > 0 && (
          <Card className="max-w-4xl mx-auto mb-8 p-6 bg-slate-800/50 backdrop-blur border-purple-500/20">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                <Clock className="w-5 h-5 text-purple-400" />
                历史记录
              </h2>
              <Button
                variant="destructive"
                size="sm"
                onClick={clearHistory}
                className="flex items-center gap-1"
              >
                <Trash2 className="w-4 h-4" />
                清空
              </Button>
            </div>
            <ScrollArea className="h-96 rounded-lg border border-slate-700">
              <div className="p-4 space-y-4">
                {history.map((item) => (
                  <Card key={item.id} className="p-4 bg-slate-700/50 border-slate-600">
                    <div className="flex gap-4">
                      <div className="flex-shrink-0 w-48">
                        <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
                          <video
                            src={item.videoUrl}
                            className="w-full h-full object-contain"
                            controls
                            playsInline
                          />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-white font-medium line-clamp-2">
                            {item.prompt || '无描述'}
                          </p>
                          <div className="flex gap-1">
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => reuseFromHistory(item)}
                              className="h-7 text-xs bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 flex items-center gap-1"
                              disabled={isGenerating}
                            >
                              <Copy className="w-3 h-3" />
                              复用
                            </Button>
                            <button
                              onClick={() => removeFromHistory(item.id)}
                              className="flex-shrink-0 p-1 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-2">
                          <span className="text-xs px-2 py-1 bg-purple-500/20 text-purple-300 rounded">
                            {item.duration}秒
                          </span>
                          <span className="text-xs px-2 py-1 bg-blue-500/20 text-blue-300 rounded">
                            {item.ratio}
                          </span>
                          <span className="text-xs px-2 py-1 bg-green-500/20 text-green-300 rounded">
                            {item.resolution}
                          </span>
                          {item.generateAudio && (
                            <span className="text-xs px-2 py-1 bg-yellow-500/20 text-yellow-300 rounded">
                              含音频
                            </span>
                          )}
                          {(item.firstFrameUrl || item.lastFrameUrl) && (
                            <span className="text-xs px-2 py-1 bg-pink-500/20 text-pink-300 rounded">
                              含参考图
                            </span>
                          )}
                        </div>
                        <p className="mt-2 text-xs text-slate-500">
                          {new Date(item.createdAt).toLocaleString('zh-CN')}
                        </p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </div>
          </Card>
        )}

        <div className="max-w-4xl mx-auto">
          <Card className="p-6 bg-slate-800/50 backdrop-blur border-purple-500/20">
            <div className="space-y-6">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="w-full bg-slate-700/50">
                  <TabsTrigger value="text" className="flex-1">文本描述</TabsTrigger>
                  <TabsTrigger value="images" className="flex-1">参考图片</TabsTrigger>
                  <TabsTrigger value="avatar" className="flex-1">数字人</TabsTrigger>
                  <TabsTrigger value="avatar-voice" className="flex-1">图片口播</TabsTrigger>
                </TabsList>
                

                
                <TabsContent value="text" className="mt-4">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <Label className="text-white text-sm font-medium">视频描述</Label>
                      <div className="flex gap-2">
                        {(firstFrameUrl || lastFrameUrl) && (
                          <span className="text-xs text-slate-500">
                            提示：在下方参考图片标签页上传图片后，可使用 @首帧/@末帧 引用
                          </span>
                        )}
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => setShowTemplates(!showTemplates)}
                          className="h-7 text-xs"
                        >
                          <Wand2 className="w-3 h-3 mr-1" />
                          灵感模板
                        </Button>
                      </div>
                    </div>
                    
                    {showTemplates && (
                      <div className="mb-4 p-4 bg-slate-700/50 rounded-lg border border-slate-600">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {promptTemplates.map((template, index) => (
                            <Button
                              key={index}
                              variant="secondary"
                              size="sm"
                              onClick={() => {
                                insertAtCursor(template.template);
                                setShowTemplates(false);
                              }}
                              className="justify-start h-auto py-3 text-left bg-slate-600/50 hover:bg-slate-600 border border-slate-500"
                              disabled={isGenerating}
                            >
                              <div className="flex items-start gap-2">
                                <span className="text-purple-400 mt-0.5">{template.icon}</span>
                                <div>
                                  <p className="text-white font-medium text-sm">{template.title}</p>
                                  <p className="text-slate-400 text-xs line-clamp-2">{template.template}</p>
                                </div>
                              </div>
                            </Button>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <Textarea
                      ref={textareaRef}
                      placeholder={`描述你想要生成的视频内容... ${(firstFrameUrl || lastFrameUrl) ? '\n提示：使用 @首帧 或 @末帧 来引用你上传的图片' : ''}\n例如：@首帧 镜头缓慢拉近，展现美丽的风景，然后平滑过渡到 @末帧`}
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      className="min-h-32 bg-slate-700/50 border-slate-600 text-white placeholder:text-gray-500 resize-none"
                      disabled={isGenerating}
                    />
                    
                    {(firstFrameUrl || lastFrameUrl) && (
                      <div className="mt-2 flex gap-2">
                        {firstFrameUrl && (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={insertFirstFrameReference}
                            className="bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30"
                            disabled={isGenerating}
                          >
                            @首帧
                          </Button>
                        )}
                        {lastFrameUrl && (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={insertLastFrameReference}
                            className="bg-pink-600/20 hover:bg-pink-600/30 text-pink-300 border border-pink-500/30"
                            disabled={isGenerating}
                          >
                            @末帧
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </TabsContent>
                
                <TabsContent value="images" className="mt-4 space-y-4">
                  <Card className="p-4 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-purple-500/30">
                    <div className="flex items-start gap-3">
                      <Lightbulb className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <h3 className="text-white font-medium mb-1">参考图使用技巧</h3>
                        <ul className="text-sm text-slate-300 space-y-1">
                          <li>• 首帧图片：视频开始的画面，AI会从这张图片开始生成</li>
                          <li>• 末帧图片：视频结束的画面，AI会平滑过渡到这张图片</li>
                          <li>• 可以在文本中使用 @首帧/@末帧 来强调参考图的重要性</li>
                          <li>• 历史记录中的参数和图片可以一键复用</li>
                        </ul>
                      </div>
                    </div>
                  </Card>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-white text-sm font-medium">首帧图片</Label>
                        {firstFrameUrl && (
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={insertFirstFrameReference}
                            className="h-7 text-xs bg-purple-600/20 hover:bg-purple-600/30 text-purple-300"
                            disabled={isGenerating}
                          >
                            @引用
                          </Button>
                        )}
                      </div>
                      {firstFrameUrl ? (
                        <div className="relative">
                          <img
                            src={firstFrameUrl}
                            alt="首帧"
                            className="w-full h-40 object-cover rounded-lg border-2 border-purple-500/50"
                          />
                          <button
                            onClick={removeFirstFrame}
                            className="absolute top-2 right-2 p-1 bg-red-500 rounded-full text-white hover:bg-red-600"
                            disabled={isGenerating}
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div
                          onClick={() => firstFrameInputRef.current?.click()}
                          className="border-2 border-dashed border-slate-600 rounded-lg p-8 text-center cursor-pointer hover:border-purple-500/50 transition-colors"
                        >
                          <input
                            ref={firstFrameInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleFirstFrameSelect}
                            className="hidden"
                            disabled={isGenerating}
                          />
                          {isUploadingFirst ? (
                            <Loader2 className="w-8 h-8 mx-auto text-purple-400 animate-spin" />
                          ) : (
                            <>
                              <Upload className="w-8 h-8 mx-auto text-slate-500 mb-2" />
                              <p className="text-slate-500 text-sm">点击上传首帧图片</p>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-white text-sm font-medium">末帧图片（可选）</Label>
                        {lastFrameUrl && (
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={insertLastFrameReference}
                            className="h-7 text-xs bg-pink-600/20 hover:bg-pink-600/30 text-pink-300"
                            disabled={isGenerating}
                          >
                            @引用
                          </Button>
                        )}
                      </div>
                      {lastFrameUrl ? (
                        <div className="relative">
                          <img
                            src={lastFrameUrl}
                            alt="末帧"
                            className="w-full h-40 object-cover rounded-lg border-2 border-pink-500/50"
                          />
                          <button
                            onClick={removeLastFrame}
                            className="absolute top-2 right-2 p-1 bg-red-500 rounded-full text-white hover:bg-red-600"
                            disabled={isGenerating}
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div
                          onClick={() => lastFrameInputRef.current?.click()}
                          className="border-2 border-dashed border-slate-600 rounded-lg p-8 text-center cursor-pointer hover:border-pink-500/50 transition-colors"
                        >
                          <input
                            ref={lastFrameInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleLastFrameSelect}
                            className="hidden"
                            disabled={isGenerating}
                          />
                          {isUploadingLast ? (
                            <Loader2 className="w-8 h-8 mx-auto text-pink-400 animate-spin" />
                          ) : (
                            <>
                              <Upload className="w-8 h-8 mx-auto text-slate-500 mb-2" />
                              <p className="text-slate-500 text-sm">点击上传末帧图片</p>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="avatar" className="mt-4 space-y-4">
                  <Card className="p-4 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-blue-500/30">
                    <div className="flex items-start gap-3">
                      <User className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <h3 className="text-white font-medium mb-1">数字人视频生成</h3>
                        <p className="text-sm text-slate-300">
                          选择下方的数字人模板，快速生成专业的数字人视频内容。
                          支持主播、讲解、问候、播报、读稿等多种场景。
                        </p>
                      </div>
                    </div>
                  </Card>
                  
                  <Card className="p-4 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border-cyan-500/30">
                    <div className="flex items-start gap-3">
                      <AlignLeft className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <h3 className="text-white font-medium mb-1">📝 数字人读稿</h3>
                        <p className="text-sm text-slate-300 mb-3">
                          输入你要朗读的文稿内容，数字人会为你专业朗读。
                          建议开启音频生成，效果更佳！
                        </p>
                        <div className="space-y-3">
                          <Textarea
                            placeholder="在这里输入你要朗读的文稿内容..."
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            className="min-h-24 bg-slate-700/50 border-slate-600 text-white placeholder:text-gray-500 resize-none"
                            disabled={isGenerating}
                          />
                          {/* 语音选择 */}
                          <div className="p-3 bg-slate-700/50 rounded-lg border border-slate-600">
                            <div className="flex items-center justify-between mb-2">
                              <Label className="text-white text-sm font-medium">
                                🎤 选择语音
                              </Label>
                            </div>
                            <Select value={selectedVoice} onValueChange={setSelectedVoice} disabled={isGenerating}>
                              <SelectTrigger className="bg-slate-800 border-slate-600 text-white">
                                <SelectValue placeholder="选择语音" />
                              </SelectTrigger>
                              <SelectContent className="bg-slate-800 border-slate-600">
                                {voiceOptions.map((voice) => (
                                  <SelectItem 
                                    key={voice.value} 
                                    value={voice.value}
                                    className="text-white hover:bg-slate-700"
                                  >
                                    {voice.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          {/* 自动时长设置 */}
                          <div className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg border border-slate-600">
                            <div className="flex items-center gap-3">
                              <div className="flex items-center gap-2">
                                <Switch
                                  id="auto-duration"
                                  checked={autoDuration}
                                  onCheckedChange={setAutoDuration}
                                  disabled={isGenerating}
                                />
                                <Label htmlFor="auto-duration" className="text-white text-sm">
                                  自动计算读稿时长
                                </Label>
                              </div>
                            </div>
                            {autoDuration && (
                              <div className="text-right">
                                <p className="text-xs text-slate-400">
                                  字符数: {prompt.replace(/\s/g, '').length} 字
                                </p>
                                <p className="text-cyan-400 font-medium">
                                  预计时长: {duration} 秒
                                </p>
                              </div>
                            )}
                          </div>

                          {/* 语言合并设置 */}
                          <div className="p-3 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-lg border border-purple-500/30">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="flex items-center gap-2">
                                  <Switch
                                    id="merge-voice-video"
                                    checked={mergeVoiceAndVideo}
                                    onCheckedChange={setMergeVoiceAndVideo}
                                    disabled={isGenerating}
                                  />
                                  <Label htmlFor="merge-voice-video" className="text-white text-sm">
                                    🎬 语言合并模式
                                  </Label>
                                </div>
                              </div>
                            </div>
                            <p className="text-xs text-purple-300 mt-2 ml-7">
                              先生成专业语音，再生成数字人视频（分别下载后可用视频编辑软件合并）
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="secondary"
                              onClick={() => {
                                const readTemplate = promptTemplates[0];
                                if (readTemplate) {
                                  insertAtCursor(readTemplate.template);
                                }
                              }}
                              className="bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300"
                              disabled={isGenerating}
                            >
                              <AlignLeft className="w-4 h-4 mr-2" />
                              添加读稿描述
                            </Button>
                            <Button
                              variant="secondary"
                              onClick={() => setGenerateAudio(true)}
                              className={generateAudio ? "bg-green-600/20 text-green-300" : ""}
                              disabled={isGenerating}
                            >
                              {generateAudio ? "✅ 音频已开启" : "🔊 开启音频"}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {promptTemplates.slice(0, 5).map((template, index) => (
                      <Card 
                        key={index}
                        className="p-4 bg-slate-700/50 border-slate-600 cursor-pointer hover:border-blue-500/50 transition-colors"
                        onClick={() => {
                          insertAtCursor(template.template);
                          if (activeTab !== 'text') {
                            setActiveTab('text');
                          }
                        }}
                      >
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-blue-500/20 rounded-lg">
                            {template.icon}
                          </div>
                          <div>
                            <h4 className="text-white font-medium">{template.title}</h4>
                            <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                              {template.template}
                            </p>
                          </div>
                        </div>
                        <Button 
                          variant="secondary"
                          size="sm"
                          className="w-full mt-3 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300"
                          onClick={(e) => {
                            e.stopPropagation();
                            insertAtCursor(template.template);
                            if (activeTab !== 'text') {
                              setActiveTab('text');
                            }
                          }}
                        >
                          使用此模板
                        </Button>
                      </Card>
                    ))}
                  </div>
                  
                  <div className="p-4 bg-slate-700/30 rounded-lg border border-slate-600">
                    <h4 className="text-white font-medium mb-2">💡 数字人使用技巧</h4>
                    <ul className="text-sm text-slate-300 space-y-1">
                      <li>• 使用数字人读稿功能，输入文稿快速生成朗读视频</li>
                      <li>• 选择合适的数字人模板，快速生成专业视频</li>
                      <li>• 可以在模板基础上修改，添加个性化内容</li>
                      <li>• 务必开启音频生成，让数字人说话</li>
                      <li>• 16:9 横屏适合视频号，9:16 竖屏适合抖音快手</li>
                    </ul>
                  </div>
                </TabsContent>
                
                <TabsContent value="avatar-voice" className="mt-4 space-y-4">
                  <Card className="p-4 bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-green-500/30">
                    <div className="flex items-start gap-3">
                      <User className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <h3 className="text-white font-medium mb-1">🎬 口型驱动 + 音视频自动合成</h3>
                        <p className="text-sm text-slate-300">
                          只需要填好文本，就能生成口型同步的数字人口播视频！
                          适合知识分享、产品介绍、新闻播报等各种场景！
                        </p>
                      </div>
                    </div>
                  </Card>

                  {/* 口播文案 - 放在最前面，突出重点 */}
                  <Card className="p-4 bg-slate-700/50 border-slate-600 border-2 border-green-500/30">
                    <h4 className="text-white font-medium mb-3 flex items-center gap-2">
                      <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                      📝 口播文案（必填）
                    </h4>
                    <Textarea
                      placeholder="在这里输入你要口播的内容...&#10;&#10;示例：&#10;大家好，欢迎来到今天的节目！今天我们来聊一聊人工智能的发展历程..."
                      value={avatarPrompt}
                      onChange={(e) => setAvatarPrompt(e.target.value)}
                      className="min-h-40 bg-slate-800/50 border-slate-600 text-white placeholder:text-gray-500 resize-none text-lg"
                      disabled={isGenerating}
                    />
                    <div className="flex justify-between items-center mt-3">
                      <p className="text-sm text-slate-400">
                        字符数: <span className="text-green-400 font-medium">{avatarPrompt.replace(/\s/g, '').length}</span> 字
                      </p>
                    </div>
                  </Card>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* 头像图片上传 - 可选 */}
                    <Card className="p-4 bg-slate-700/50 border-slate-600">
                      <h4 className="text-white font-medium mb-3">📷 头像/图片（可选）</h4>
                      {avatarImageUrl ? (
                        <div className="space-y-3">
                          <div className="relative">
                            <img
                              src={avatarImageUrl}
                              alt="头像"
                              className="w-full aspect-square object-cover rounded-lg border-2 border-green-500/50"
                            />
                            <button
                              onClick={removeAvatar}
                              className="absolute top-2 right-2 p-1 bg-red-500 rounded-full text-white hover:bg-red-600"
                              disabled={isGenerating}
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                          <p className="text-xs text-green-400">✅ 图片已上传</p>
                        </div>
                      ) : (
                        <div
                          onClick={() => avatarInputRef.current?.click()}
                          className="border-2 border-dashed border-slate-600 rounded-lg p-6 text-center cursor-pointer hover:border-green-500/50 transition-colors"
                        >
                          <input
                            ref={avatarInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleAvatarSelect}
                            className="hidden"
                            disabled={isGenerating}
                          />
                          {isUploadingAvatar ? (
                            <Loader2 className="w-8 h-8 mx-auto text-green-400 animate-spin" />
                          ) : (
                            <>
                              <Upload className="w-8 h-8 mx-auto text-slate-500 mb-2" />
                              <p className="text-slate-500 text-sm">点击上传头像图片</p>
                              <p className="text-xs text-slate-600 mt-1">不上传也能生成</p>
                            </>
                          )}
                        </div>
                      )}
                    </Card>

                    {/* 语音选择 - 智能默认 */}
                    <Card className="p-4 bg-slate-700/50 border-slate-600">
                      <h4 className="text-white font-medium mb-3">🎤 语音风格</h4>
                      <Select value={selectedVoice} onValueChange={setSelectedVoice} disabled={isGenerating}>
                        <SelectTrigger className="bg-slate-800 border-slate-600 text-white">
                          <SelectValue placeholder="选择语音" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-800 border-slate-600">
                          {voiceOptions.map((voice) => (
                            <SelectItem 
                              key={voice.value} 
                              value={voice.value}
                              className="text-white hover:bg-slate-700"
                            >
                              {voice.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      
                      <div className="mt-4 p-3 bg-green-500/10 rounded-lg border border-green-500/30">
                        <p className="text-xs text-green-300">
                          ✨ 默认使用小荷女声，适合大部分场景
                        </p>
                      </div>
                    </Card>
                  </div>

                  {/* 生成进度显示 */}
                  {isGenerating && (
                    <Card className="p-4 bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-green-500/30">
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${avatarStep === 'generating-audio' || avatarStep === 'generating-video' || avatarStep === 'completed' ? 'bg-green-500' : 'bg-slate-600'}`}>
                            {avatarStep === 'completed' ? '✓' : (avatarStep === 'generating-audio' || avatarStep === 'generating-video' ? <Loader2 className="w-4 h-4 animate-spin" /> : '1')}
                          </div>
                          <div>
                            <p className={`text-sm font-medium ${avatarStep === 'generating-audio' || avatarStep === 'generating-video' || avatarStep === 'completed' ? 'text-green-400' : 'text-slate-400'}`}>
                              生成语音
                            </p>
                            {avatarStep === 'generating-audio' && (
                              <p className="text-xs text-green-300">正在使用 {voiceOptions.find(v => v.value === selectedVoice)?.label} 合成语音...</p>
                            )}
                          </div>
                        </div>
                        
                        {avatarImageUrl && (
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${avatarStep === 'generating-video' || avatarStep === 'completed' ? 'bg-green-500' : 'bg-slate-600'}`}>
                              {avatarStep === 'completed' ? '✓' : (avatarStep === 'generating-video' ? <Loader2 className="w-4 h-4 animate-spin" /> : '2')}
                            </div>
                            <div>
                              <p className={`text-sm font-medium ${avatarStep === 'generating-video' || avatarStep === 'completed' ? 'text-green-400' : 'text-slate-400'}`}>
                                生成视频
                              </p>
                              {avatarStep === 'generating-video' && (
                                <p className="text-xs text-green-300">正在使用头像生成数字人视频...</p>
                              )}
                            </div>
                          </div>
                        )}
                        
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${avatarStep === 'completed' ? 'bg-green-500' : 'bg-slate-600'}`}>
                            {avatarStep === 'completed' ? '✓' : '3'}
                          </div>
                          <p className={`text-sm font-medium ${avatarStep === 'completed' ? 'text-green-400' : 'text-slate-400'}`}>
                            完成
                          </p>
                        </div>
                      </div>
                    </Card>
                  )}

                  {/* 生成按钮 */}
                  <Button
                    onClick={handleAvatarGenerate}
                    disabled={isGenerating || !avatarPrompt.trim()}
                    className="w-full py-6 text-lg bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isGenerating ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        {avatarStep === 'generating-audio' ? '正在生成语音...' : '正在生成视频...'}
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <Film className="w-5 h-5" />
                        {avatarImageUrl ? '生成数字人口播' : '生成口播语音'}
                      </span>
                    )}
                  </Button>
                </TabsContent>
              </Tabs>

              {activeTab !== 'avatar-voice' && (
                <div className={`grid gap-6 ${model === 'doubao-seed-tts' ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'}`}>
                  {model !== 'doubao-seed-tts' && (
                    <>
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <Label className="text-white text-sm font-medium">
                            时长: {duration} 秒
                          </Label>
                          {autoDuration && activeTab === 'avatar' && (
                            <span className="text-xs text-cyan-400 bg-cyan-500/20 px-2 py-0.5 rounded">
                              自动计算中
                            </span>
                          )}
                        </div>
                        <Slider
                          value={[duration]}
                          onValueChange={(value) => {
                            if (!autoDuration || activeTab !== 'avatar') {
                              setDuration(value[0]);
                            }
                          }}
                          min={5}
                          max={60}
                          step={1}
                          disabled={isGenerating || (autoDuration && activeTab === 'avatar')}
                          className={`${autoDuration && activeTab === 'avatar' ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                        />
                      </div>

                      <div>
                        <Label className="text-white text-sm font-medium mb-2 block">宽高比</Label>
                        <Select value={ratio} onValueChange={setRatio} disabled={isGenerating}>
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

                      <div>
                        <Label className="text-white text-sm font-medium mb-2 block">分辨率</Label>
                        <Select value={resolution} onValueChange={setResolution} disabled={isGenerating}>
                          <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-800 border-slate-600">
                            <SelectItem value="480p">480p</SelectItem>
                            <SelectItem value="720p">720p</SelectItem>
                            <SelectItem value="1080p">1080p</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </>
                  )}

                  <div>
                    <Label className="text-white text-sm font-medium mb-2 block">生成模型</Label>
                    <Select value={model} onValueChange={setModel} disabled={isGenerating}>
                      <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-600">
                        <SelectItem value="doubao-seedance-1-5-pro-251215">
                          <div className="flex flex-col">
                            <span className="font-medium">Doubao Seedance 1.5 Pro</span>
                            <span className="text-sm text-slate-400">✨ 专业版</span>
                            <span className="text-xs text-slate-500">火山引擎 · 视频生成</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="doubao-seed-tts">
                          <div className="flex flex-col">
                            <span className="font-medium">Doubao Seed TTS</span>
                            <span className="text-sm text-slate-400">🎤 语音合成</span>
                            <span className="text-xs text-slate-500">豆包大模型 · 专业人声</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {model !== 'doubao-seed-tts' && (
                <div className="flex items-center gap-3">
                  <Switch
                    id="audio"
                    checked={generateAudio}
                    onCheckedChange={setGenerateAudio}
                    disabled={isGenerating}
                  />
                  <Label htmlFor="audio" className="text-white cursor-pointer">
                    生成音频（背景音乐和音效）
                  </Label>
                </div>
              )}

              {error && (
                <div className="p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-300">
                  {error}
                </div>
              )}

              <Button
                onClick={handleGenerate}
                disabled={isGenerating || (model !== 'doubao-seed-tts' && !prompt.trim() && !firstFrameUrl) || (model === 'doubao-seed-tts' && !prompt.trim())}
                className={`w-full py-6 text-lg font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed ${
                  model === 'doubao-seed-tts'
                    ? 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700'
                    : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700'
                } text-white`}
              >
                {isGenerating ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    {model === 'doubao-seed-tts' ? '正在生成语音，请稍候...' : '正在生成视频，请稍候...'}
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    {model === 'doubao-seed-tts' ? (
                      <>
                        <Mic className="w-5 h-5" />
                        生成语音
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5" />
                        生成视频
                      </>
                    )}
                  </span>
                )}
              </Button>
            </div>
          </Card>

          {(audioUrl || avatarVideoUrl) && (
            <Card className="mt-8 p-6 bg-slate-800/50 backdrop-blur border-green-500/20">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                    {avatarVideoUrl ? (
                      <>
                        <Film className="w-5 h-5 text-green-400" />
                        🎬 数字人口播生成成功
                      </>
                    ) : (
                      <>
                        <Mic className="w-5 h-5 text-green-400" />
                        {activeTab === 'avatar-voice' ? '🎬 图片口播生成成功' : (mergeVoiceAndVideo ? '步骤 1/2 - 生成的语音' : '生成的语音')}
                      </>
                    )}
                  </h2>
                  <div className="flex gap-2">
                    {avatarVideoUrl && (
                      <Button
                        onClick={handleDownload}
                        variant="secondary"
                        className="bg-slate-700 hover:bg-slate-600 text-white"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        下载视频
                      </Button>
                    )}
                    {audioUrl && (
                      <Button
                        onClick={handleDownload}
                        variant="secondary"
                        className="bg-slate-700 hover:bg-slate-600 text-white"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        下载音频
                      </Button>
                    )}
                  </div>
                </div>
                
                {/* 有视频时显示视频播放器 */}
                {avatarVideoUrl && (
                  <div className="space-y-4">
                    <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
                      <video
                        src={avatarVideoUrl}
                        controls
                        className="w-full h-full object-contain"
                        playsInline
                      />
                    </div>
                    
                    {audioUrl && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Card className="p-4 bg-slate-700/50 border-slate-600">
                          <h4 className="text-white font-medium mb-2">🎤 口播语音</h4>
                          <div className="p-3 bg-slate-800/50 rounded-lg">
                            <audio
                              src={audioUrl}
                              controls
                              className="w-full"
                            />
                          </div>
                        </Card>
                        
                        <div className="p-4 bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-lg border border-green-500/30">
                          <h4 className="text-white font-medium mb-2">✅ 生成完成！</h4>
                          <p className="text-sm text-green-200">
                            数字人视频已生成！你可以：
                          </p>
                          <ul className="text-sm text-green-200 mt-2 space-y-1 list-disc list-inside">
                            <li>直接观看生成的数字人视频</li>
                            <li>下载口播语音用于其他用途</li>
                            <li>使用视频编辑软件进一步编辑</li>
                          </ul>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                
                {/* 只有音频没有视频时的显示 */}
                {!avatarVideoUrl && audioUrl && (
                  <>
                    {activeTab === 'avatar-voice' && avatarImageUrl && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <h3 className="text-white font-medium">📷 你的头像</h3>
                          <div className="relative aspect-square bg-black rounded-lg overflow-hidden">
                            <img
                              src={avatarImageUrl}
                              alt="头像"
                              className="w-full h-full object-contain"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <h3 className="text-white font-medium">🎤 口播语音</h3>
                          <div className="p-4 bg-slate-700/50 rounded-lg">
                            <audio
                              src={audioUrl}
                              controls
                              className="w-full"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {activeTab !== 'avatar-voice' && (
                      <div className="p-4 bg-slate-700/50 rounded-lg">
                        <audio
                          src={audioUrl}
                          controls
                          className="w-full"
                        />
                      </div>
                    )}
                    
                    <p className="text-sm text-slate-400">
                      ✅ 使用 {voiceOptions.find(v => v.value === selectedVoice)?.label || selectedVoice} 语音合成
                    </p>
                    
                    {activeTab === 'avatar-voice' && !avatarVideoUrl && (
                      <div className="p-4 bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-lg border border-green-500/30">
                        <h3 className="text-white font-medium mb-2">💡 使用建议</h3>
                        <ol className="text-sm text-green-200 space-y-1 list-decimal list-inside">
                          <li>下载上方的音频文件</li>
                          <li>使用视频编辑软件（剪映、Adobe Premiere等）</li>
                          <li>将图片和音频放入时间轴</li>
                          <li>添加简单的动画效果（图片轻微缩放、淡入淡出等）</li>
                          <li>导出视频就完成了！</li>
                        </ol>
                      </div>
                    )}
                  </>
                )}
                
                {mergeVoiceAndVideo && activeTab !== 'avatar-voice' && (
                  <p className="text-sm text-purple-300 bg-purple-500/10 p-3 rounded-lg border border-purple-500/30">
                    💡 语音已生成！请等待视频生成完成，然后分别下载音频和视频，使用视频编辑软件（如剪映、 Premiere）将它们合并。
                  </p>
                )}
              </div>
            </Card>
          )}

          {videoUrl && (
            <Card className="mt-8 p-6 bg-slate-800/50 backdrop-blur border-purple-500/20">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                    <Play className="w-5 h-5 text-green-400" />
                    {mergeVoiceAndVideo ? '步骤 2/2 - 生成的视频' : '生成的视频'}
                  </h2>
                  <Button
                    onClick={handleDownload}
                    variant="secondary"
                    className="bg-slate-700 hover:bg-slate-600 text-white"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    下载视频
                  </Button>
                </div>
                <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
                  <video
                    src={videoUrl}
                    controls
                    className="w-full h-full object-contain"
                    playsInline
                  />
                </div>
                {mergeVoiceAndVideo && (
                  <div className="p-4 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-lg border border-purple-500/30">
                    <h3 className="text-white font-medium mb-2">🎬 合并指南</h3>
                    <ol className="text-sm text-purple-200 space-y-1 list-decimal list-inside">
                      <li>分别下载上方的音频和视频文件</li>
                      <li>使用视频编辑软件（剪映、Adobe Premiere、Final Cut Pro等）</li>
                      <li>将音频和视频拖入时间轴，对齐后导出</li>
                      <li>就能得到带有专业语音的数字人视频了！</li>
                    </ol>
                  </div>
                )}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
