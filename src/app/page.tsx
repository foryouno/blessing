'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sparkles, Video, Loader2, Download, Play, Upload, X } from 'lucide-react';

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
  
  const [firstFrameUrl, setFirstFrameUrl] = useState<string | null>(null);
  const [lastFrameUrl, setLastFrameUrl] = useState<string | null>(null);
  const [isUploadingFirst, setIsUploadingFirst] = useState(false);
  const [isUploadingLast, setIsUploadingLast] = useState(false);
  const [activeTab, setActiveTab] = useState('text');
  
  const firstFrameInputRef = useRef<HTMLInputElement>(null);
  const lastFrameInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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

        <div className="max-w-4xl mx-auto">
          <Card className="p-6 bg-slate-800/50 backdrop-blur border-purple-500/20">
            <div className="space-y-6">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="w-full bg-slate-700/50">
                  <TabsTrigger value="text" className="flex-1">文本描述</TabsTrigger>
                  <TabsTrigger value="images" className="flex-1">参考图片</TabsTrigger>
                </TabsList>
                
                {(firstFrameUrl || lastFrameUrl) && (
                  <div className="mt-4 p-4 bg-slate-700/30 rounded-lg border border-slate-600/50">
                    <div className="flex flex-wrap gap-2 items-center">
                      <span className="text-slate-400 text-sm">快捷引用：</span>
                      {firstFrameUrl && (
                        <Button
                          type="button"
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
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={insertLastFrameReference}
                          className="bg-pink-600/20 hover:bg-pink-600/30 text-pink-300 border border-pink-500/30"
                          disabled={isGenerating}
                        >
                          @末帧
                        </Button>
                      )}
                      <span className="text-slate-500 text-xs">
                        点击快速插入到描述中
                      </span>
                    </div>
                  </div>
                )}
                
                <TabsContent value="text" className="mt-4">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <Label className="text-white text-sm font-medium">视频描述</Label>
                      {(firstFrameUrl || lastFrameUrl) && (
                        <span className="text-xs text-slate-500">
                          提示：在下方参考图片标签页上传图片后，可使用 @首帧/@末帧 引用
                        </span>
                      )}
                    </div>
                    <Textarea
                      ref={textareaRef}
                      placeholder={`描述你想要生成的视频内容... ${(firstFrameUrl || lastFrameUrl) ? '\n提示：使用 @首帧 或 @末帧 来引用你上传的图片' : ''}\n例如：@首帧 镜头缓慢拉近，展现美丽的风景，然后平滑过渡到 @末帧`}
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      className="min-h-32 bg-slate-700/50 border-slate-600 text-white placeholder:text-gray-500 resize-none"
                      disabled={isGenerating}
                    />
                  </div>
                </TabsContent>
                
                <TabsContent value="images" className="mt-4 space-y-4">
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
                          <span>Doubao Seedance 1.5 Pro ✨</span>
                          <span className="text-xs text-slate-500">火山引擎 · 专业版，支持音频生成</span>
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
