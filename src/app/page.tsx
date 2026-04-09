'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sparkles, Video, Loader2, Download, Play } from 'lucide-react';

export default function VideoGenerator() {
  const [prompt, setPrompt] = useState('');
  const [duration, setDuration] = useState(5);
  const [ratio, setRatio] = useState('16:9');
  const [resolution, setResolution] = useState('720p');
  const [generateAudio, setGenerateAudio] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError('请输入视频描述');
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
          <p className="text-gray-400 text-lg">输入你的创意描述，AI 为你生成精彩视频</p>
        </div>

        <div className="max-w-4xl mx-auto">
          <Card className="p-6 bg-slate-800/50 backdrop-blur border-purple-500/20">
            <div className="space-y-6">
              <div>
                <Label className="text-white text-sm font-medium mb-2 block">视频描述</Label>
                <Textarea
                  placeholder="描述你想要生成的视频内容... 例如：一个宁静的海边日落，海浪轻轻拍打着沙滩，海鸥在空中翱翔"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="min-h-32 bg-slate-700/50 border-slate-600 text-white placeholder:text-gray-500 resize-none"
                  disabled={isGenerating}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                disabled={isGenerating || !prompt.trim()}
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
