'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sparkles, Video, Loader2, Download, Play, History, Clock, Copy, Wand2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface VideoHistoryItem {
  id: string;
  videoUrl: string;
  prompt: string;
  duration: number;
  ratio: string;
  model: string;
  createdAt: string;
}

// 视频生成提示词模板
const promptTemplates = [
  { icon: '🎬', title: '城市风光', template: '航拍现代都市，高楼大厦林立，车流不息，霓虹闪烁，现代感十足' },
  { icon: '🌿', title: '自然风景', template: '美丽的自然风光，蓝天白云，青山绿水，阳光明媚，空气清新' },
  { icon: '🏠', title: '温馨家居', template: '温馨舒适的家居环境，阳光透过窗户洒进来，整洁干净的房间' },
  { icon: '💼', title: '商务办公', template: '专业的商务场景，现代化的办公室，人们认真工作的样子' },
  { icon: '🎉', title: '喜庆节日', template: '热闹的节日气氛，张灯结彩，欢声笑语，喜气洋洋' },
  { icon: '🚀', title: '科技未来', template: '充满科技感的未来世界，炫酷的光影效果，高科技产品展示' },
];

export default function TextVideoPage() {
  const [prompt, setPrompt] = useState('');
  const [duration, setDuration] = useState(5);
  const [ratio, setRatio] = useState('16:9');
  const [model, setModel] = useState('doubao-seedance-1-5-pro-251215');
  const [isGenerating, setIsGenerating] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [history, setHistory] = useState<VideoHistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 从localStorage加载历史记录
  useEffect(() => {
    const savedHistory = localStorage.getItem('textVideoHistory');
    if (savedHistory) {
      setHistory(JSON.parse(savedHistory));
    }
  }, []);

  // 保存到localStorage
  const saveToHistory = (videoData: VideoHistoryItem) => {
    const newHistory = [videoData, ...history];
    setHistory(newHistory);
    localStorage.setItem('textVideoHistory', JSON.stringify(newHistory));
  };

  // 插入模板到光标位置
  const insertAtCursor = (text: string) => {
    if (textareaRef.current) {
      const start = textareaRef.current.selectionStart;
      const end = textareaRef.current.selectionEnd;
      const before = prompt.substring(0, start);
      const after = prompt.substring(end);
      setPrompt(before + text + after);
      setTimeout(() => {
        textareaRef.current?.focus();
        textareaRef.current?.setSelectionRange(start + text.length, start + text.length);
      }, 0);
    } else {
      setPrompt(prompt + text);
    }
  };

  // 生成视频
  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    
    setIsGenerating(true);
    setVideoUrl(null);
    
    try {
      const requestBody = {
        prompt: prompt,
        duration: duration,
        ratio: ratio,
        model: model
      };

      const response = await fetch('/api/generate-video', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '视频生成失败');
      }

      const data = await response.json();
      
      if (data.videoUrl) {
        setVideoUrl(data.videoUrl);
        
        const historyItem: VideoHistoryItem = {
          id: Date.now().toString(),
          videoUrl: data.videoUrl,
          prompt: prompt,
          duration: duration,
          ratio: ratio,
          model: model,
          createdAt: new Date().toISOString()
        };
        
        saveToHistory(historyItem);
      }
    } catch (error) {
      console.error('视频生成失败:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 p-6">
      {/* 顶部导航 */}
      <div className="max-w-4xl mx-auto mb-6">
        <Link href="/">
          <Button variant="secondary" className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            返回首页
          </Button>
        </Link>
        
        <Card className="p-6 bg-gradient-to-r from-blue-600/20 to-purple-600/20 border-blue-500/30">
          <h1 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
            <Video className="w-6 h-6 text-blue-400" />
            文本描述生成视频
          </h1>
          <p className="text-slate-300">通过文字描述生成高质量的视频内容</p>
        </Card>
      </div>

      <div className="max-w-4xl mx-auto space-y-6">
        {/* 左侧区域 - 生成控制 */}
        <Card className="p-6 bg-slate-800/50 backdrop-blur border-slate-700/50">
          <div className="space-y-6">
            {/* 提示词输入 */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <Label className="text-white text-sm font-medium">视频描述</Label>
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
                          <span className="text-blue-400 mt-0.5">{template.icon}</span>
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
                placeholder="描述你想要生成的视频内容...例如：美丽的自然风光，蓝天白云，青山绿水，阳光明媚"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="min-h-32 bg-slate-700/50 border-slate-600 text-white placeholder:text-gray-500"
                disabled={isGenerating}
              />
            </div>

            {/* 参数设置 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label className="text-white text-sm font-medium mb-2 block">视频时长</Label>
                <div className="space-y-2">
                  <Slider
                    value={[duration]}
                    onValueChange={(value) => setDuration(value[0])}
                    min={5}
                    max={12}
                    step={1}
                    disabled={isGenerating}
                    className="py-2"
                  />
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>5秒</span>
                    <span className="text-white font-medium"><Clock className="w-3 h-3 inline mr-1" />{duration}秒</span>
                    <span>12秒</span>
                  </div>
                </div>
              </div>

              <div>
                <Label className="text-white text-sm font-medium mb-2 block">视频比例</Label>
                <Select value={ratio} onValueChange={setRatio} disabled={isGenerating}>
                  <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-600">
                    <SelectItem value="16:9">16:9（横屏）</SelectItem>
                    <SelectItem value="9:16">9:16（竖屏）</SelectItem>
                    <SelectItem value="1:1">1:1（方形）</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-white text-sm font-medium mb-2 block">视频模型</Label>
                <Select value={model} onValueChange={setModel} disabled={isGenerating}>
                  <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-600">
                    <SelectItem value="doubao-seedance-1-5-pro-251215">Seedance 1.5 Pro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* 生成按钮 */}
            <Button
              onClick={handleGenerate}
              disabled={isGenerating || !prompt.trim()}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white h-12 text-lg"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  正在生成视频...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 mr-2" />
                  生成视频
                </>
              )}
            </Button>
          </div>
        </Card>

        {/* 视频播放器 */}
        {videoUrl && (
          <Card className="p-6 bg-slate-800/50 backdrop-blur border-green-500/30">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-white flex items-center gap-2">
                  <Play className="w-5 h-5 text-green-400" />
                  生成结果
                </h3>
                <div className="flex gap-2">
                  <Button variant="secondary" size="sm" onClick={() => setShowHistory(!showHistory)}>
                    <History className="w-4 h-4 mr-1" />
                    历史记录
                  </Button>
                </div>
              </div>
              
              <div className="relative rounded-lg overflow-hidden bg-black aspect-video">
                <video
                  src={videoUrl}
                  controls
                  autoPlay
                  className="w-full h-full"
                />
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-slate-700">
                <div className="flex gap-2">
                  <span className="text-xs px-2 py-1 bg-blue-500/20 text-blue-300 rounded">
                    {duration}秒
                  </span>
                  <span className="text-xs px-2 py-1 bg-purple-500/20 text-purple-300 rounded">
                    {ratio}
                  </span>
                </div>
                <Button variant="secondary" size="sm" onClick={() => navigator.clipboard.writeText(prompt)}>
                  <Copy className="w-4 h-4 mr-1" />
                  复制提示词
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* 历史记录 */}
        {showHistory && history.length > 0 && (
          <Card className="p-6 bg-slate-800/50 backdrop-blur border-slate-700/50">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-white flex items-center gap-2">
                <History className="w-5 h-5 text-amber-400" />
                生成历史
              </h3>
              <Button variant="secondary" size="sm" onClick={() => setShowHistory(false)}>
                收起
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {history.map((item) => (
                <Card key={item.id} className="p-4 bg-slate-700/50 border-slate-600">
                  <div className="space-y-3">
                    <div className="relative rounded-lg overflow-hidden bg-black aspect-video">
                      <video
                        src={item.videoUrl}
                        controls
                        className="w-full h-full"
                      />
                    </div>
                    <p className="text-sm text-slate-300 line-clamp-2">
                      {item.prompt}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <span className="text-xs px-2 py-1 bg-blue-500/20 text-blue-300 rounded">
                        {item.duration}秒
                      </span>
                      <span className="text-xs px-2 py-1 bg-purple-500/20 text-purple-300 rounded">
                        {item.ratio}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">
                      {new Date(item.createdAt).toLocaleString('zh-CN')}
                    </p>
                  </div>
                </Card>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
