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
import { Sparkles, Video, Loader2, Download, Play, Upload, X, History, Trash2, Clock, Lightbulb, Copy, Wand2, Palette, Zap, Film, User, Mic, Smile, Monitor } from 'lucide-react';

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
  const [error, setError] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<VideoHistoryItem[]>([]);
  const [showTemplates, setShowTemplates] = useState(false);

  const promptTemplates = [
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

  const handleGenerate = async () => {
    if (!prompt.trim() && !firstFrameUrl) {
      setError('请输入视频描述或上传首帧图片');
      return;
    }

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
          resolution,
          generateAudio,
          firstFrameUrl,
          lastFrameUrl,
          model,
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
    } catch {
      setError('生成视频时发生错误');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = async () => {
    if (!videoUrl) return;

    try {
      const response = await fetch(videoUrl);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `generated-video-${Date.now()}.mp4`;
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
                          支持主播、讲解、问候、播报等多种场景。
                        </p>
                      </div>
                    </div>
                  </Card>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {promptTemplates.slice(0, 4).map((template, index) => (
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
                      <li>• 选择合适的数字人模板，快速生成专业视频</li>
                      <li>• 可以在模板基础上修改，添加个性化内容</li>
                      <li>• 建议开启音频生成，让数字人说话</li>
                      <li>• 16:9 横屏适合视频号，9:16 竖屏适合抖音快手</li>
                    </ul>
                  </div>
                </TabsContent>
              </Tabs>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div>
                  <Label className="text-white text-sm font-medium mb-2 block">
                    时长: {duration} 秒
                  </Label>
                  <Slider
                    value={[duration]}
                    onValueChange={(value) => setDuration(value[0])}
                    min={4}
                    max={12}
                    step={1}
                    disabled={isGenerating}
                    className="cursor-pointer"
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
                          <span className="text-xs text-slate-500">火山引擎 · 支持音频生成</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

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

              {error && (
                <div className="p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-300">
                  {error}
                </div>
              )}

              <Button
                onClick={handleGenerate}
                disabled={isGenerating || (!prompt.trim() && !firstFrameUrl)}
                className="w-full py-6 text-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isGenerating ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    正在生成视频，请稍候...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5" />
                    生成视频
                  </span>
                )}
              </Button>
            </div>
          </Card>

          {videoUrl && (
            <Card className="mt-8 p-6 bg-slate-800/50 backdrop-blur border-purple-500/20">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                    <Play className="w-5 h-5 text-green-400" />
                    生成的视频
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
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
