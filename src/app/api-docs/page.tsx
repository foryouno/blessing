'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Code, FileJson, Cpu, Play, Copy, Check, BookOpen, Zap, Video, FileText, Image, Mic, Upload } from 'lucide-react';

interface ApiEndpoint {
  path: string;
  method: string;
  description: string;
  parameters?: Record<string, string>;
}

interface ApiInfo {
  name: string;
  version: string;
  description: string;
  endpoints: ApiEndpoint[];
  features: string[];
  status: string;
  timestamp: string;
}

export default function ApiDocsPage() {
  const [apiInfo, setApiInfo] = useState<ApiInfo | null>(null);
  const [selectedEndpoint, setSelectedEndpoint] = useState<ApiEndpoint | null>(null);
  const [requestBody, setRequestBody] = useState('');
  const [response, setResponse] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchApiInfo();
  }, []);

  const fetchApiInfo = async () => {
    try {
      const res = await fetch('/api/info');
      const data = await res.json();
      setApiInfo(data);
      if (data.endpoints?.length > 0) {
        setSelectedEndpoint(data.endpoints[0]);
      }
    } catch (err) {
      console.error('Failed to fetch API info:', err);
    }
  };

  const handleExecute = async () => {
    if (!selectedEndpoint) return;
    
    setIsLoading(true);
    setResponse(null);
    
    try {
      const options: RequestInit = {
        method: selectedEndpoint.method,
        headers: {
          'Content-Type': 'application/json',
        },
      };
      
      if (selectedEndpoint.method !== 'GET' && requestBody) {
        options.body = requestBody;
      }
      
      const res = await fetch(selectedEndpoint.path, options);
      const data = await res.json();
      setResponse(JSON.stringify(data, null, 2));
    } catch (err) {
      setResponse(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const generateExampleBody = (endpoint: ApiEndpoint) => {
    if (!endpoint.parameters) return '';
    
    const example: Record<string, any> = {};
    for (const [key, desc] of Object.entries(endpoint.parameters)) {
      if (desc.includes('required')) {
        if (key === 'prompt') example[key] = '一个美丽的日落风景';
        else if (key === 'topic') example[key] = '人工智能的未来';
        else if (key === 'text') example[key] = '大家好，欢迎来到今天的视频分享';
        else if (key === 'duration') example[key] = 10;
        else if (key === 'ratio') example[key] = '16:9';
        else example[key] = '';
      }
    }
    return JSON.stringify(example, null, 2);
  };

  const getMethodColor = (method: string) => {
    switch (method.toUpperCase()) {
      case 'GET': return 'bg-green-500';
      case 'POST': return 'bg-blue-500';
      case 'PUT': return 'bg-yellow-500';
      case 'DELETE': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getEndpointIcon = (path: string) => {
    if (path.includes('video')) return <Video className="w-4 h-4" />;
    if (path.includes('script')) return <FileText className="w-4 h-4" />;
    if (path.includes('image')) return <Image className="w-4 h-4" />;
    if (path.includes('tts')) return <Mic className="w-4 h-4" />;
    if (path.includes('upload')) return <Upload className="w-4 h-4" />;
    return <Cpu className="w-4 h-4" />;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <BookOpen className="w-8 h-8 text-cyan-400" />
            <h1 className="text-3xl font-bold text-white">API 文档</h1>
          </div>
          <p className="text-slate-400">
            {apiInfo?.description} - v{apiInfo?.version}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 左侧：API 列表 */}
          <div className="lg:col-span-1">
            <Card className="p-4 bg-slate-900/50 border-slate-700">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Zap className="w-5 h-5 text-cyan-400" />
                API 端点
              </h2>
              <div className="space-y-2">
                {apiInfo?.endpoints?.map((endpoint, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setSelectedEndpoint(endpoint);
                      setRequestBody(generateExampleBody(endpoint));
                      setResponse(null);
                    }}
                    className={`w-full text-left p-3 rounded-lg transition-all ${
                      selectedEndpoint?.path === endpoint.path
                        ? 'bg-cyan-500/20 border border-cyan-500/50'
                        : 'bg-slate-800/50 hover:bg-slate-800 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`${getMethodColor(endpoint.method)} text-white text-xs px-2 py-0.5 rounded font-mono`}>
                        {endpoint.method}
                      </span>
                      {getEndpointIcon(endpoint.path)}
                    </div>
                    <div className="text-white text-sm font-mono truncate">
                      {endpoint.path}
                    </div>
                    <div className="text-slate-400 text-xs mt-1">
                      {endpoint.description}
                    </div>
                  </button>
                ))}
              </div>
            </Card>

            {/* 功能列表 */}
            {apiInfo?.features && (
              <Card className="p-4 mt-4 bg-slate-900/50 border-slate-700">
                <h2 className="text-lg font-semibold text-white mb-4">功能特性</h2>
                <ul className="space-y-2">
                  {apiInfo.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-slate-300 text-sm">
                      <Check className="w-4 h-4 text-green-400" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </Card>
            )}
          </div>

          {/* 右侧：API 详情和测试 */}
          <div className="lg:col-span-2">
            {selectedEndpoint ? (
              <Card className="p-6 bg-slate-900/50 border-slate-700">
                <div className="mb-6">
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`${getMethodColor(selectedEndpoint.method)} text-white text-sm px-3 py-1 rounded font-mono`}>
                      {selectedEndpoint.method}
                    </span>
                    <h2 className="text-xl font-semibold text-white font-mono">
                      {selectedEndpoint.path}
                    </h2>
                  </div>
                  <p className="text-slate-400">{selectedEndpoint.description}</p>
                </div>

                <Tabs defaultValue="test">
                  <TabsList className="bg-slate-800">
                    <TabsTrigger value="test">测试接口</TabsTrigger>
                    <TabsTrigger value="docs">参数文档</TabsTrigger>
                    <TabsTrigger value="examples">示例代码</TabsTrigger>
                  </TabsList>

                  {/* 测试接口 */}
                  <TabsContent value="test" className="mt-4">
                    <div className="space-y-4">
                      {selectedEndpoint.parameters && (
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <label className="text-white text-sm font-medium">请求体 (JSON)</label>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCopy(requestBody)}
                              className="text-slate-400 hover:text-white"
                            >
                              {copied ? <Check className="w-4 h-4 mr-1" /> : <Copy className="w-4 h-4 mr-1" />}
                              {copied ? '已复制' : '复制'}
                            </Button>
                          </div>
                          <Textarea
                            value={requestBody}
                            onChange={(e) => setRequestBody(e.target.value)}
                            placeholder='{"prompt": "你的提示词"}'
                            className="min-h-[200px] bg-slate-800/50 border-slate-600 text-white font-mono text-sm"
                          />
                        </div>
                      )}

                      <Button
                        onClick={handleExecute}
                        disabled={isLoading}
                        className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700"
                      >
                        {isLoading ? (
                          <>
                            <span className="animate-spin mr-2">⚡</span>
                            执行中...
                          </>
                        ) : (
                          <>
                            <Play className="w-4 h-4 mr-2" />
                            执行请求
                          </>
                        )}
                      </Button>

                      {response && (
                        <div>
                          <label className="text-white text-sm font-medium mb-2 block">响应</label>
                          <div className="bg-slate-950 rounded-lg p-4 border border-slate-700">
                            <pre className="text-green-400 font-mono text-sm whitespace-pre-wrap overflow-x-auto">
                              {response}
                            </pre>
                          </div>
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  {/* 参数文档 */}
                  <TabsContent value="docs" className="mt-4">
                    {selectedEndpoint.parameters ? (
                      <div className="space-y-3">
                        <h3 className="text-white font-medium mb-3">请求参数</h3>
                        {Object.entries(selectedEndpoint.parameters).map(([key, desc]) => (
                          <div key={key} className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
                            <div className="flex items-center gap-2 mb-1">
                              <code className="text-cyan-400 font-mono text-sm">{key}</code>
                              {desc.includes('required') && (
                                <span className="text-red-400 text-xs">必填</span>
                              )}
                            </div>
                            <p className="text-slate-400 text-sm">{desc}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-slate-400">此接口无需参数</p>
                    )}
                  </TabsContent>

                  {/* 示例代码 */}
                  <TabsContent value="examples" className="mt-4">
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-white font-medium mb-2 flex items-center gap-2">
                          <FileJson className="w-4 h-4" />
                          cURL
                        </h3>
                        <div className="bg-slate-950 rounded-lg p-4 border border-slate-700 relative">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCopy(`curl -X ${selectedEndpoint.method} \\
  -H "Content-Type: application/json" \\
  ${selectedEndpoint.method !== 'GET' && requestBody ? `-d '${requestBody.replace(/'/g, "\\'")}' \\` : ''}
  ${window.location.origin}${selectedEndpoint.path}`)}
                            className="absolute top-2 right-2 text-slate-400 hover:text-white"
                          >
                            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                          </Button>
                          <pre className="text-green-400 font-mono text-sm whitespace-pre-wrap">
                            {`curl -X ${selectedEndpoint.method} \\
  -H "Content-Type: application/json" \\
  ${selectedEndpoint.method !== 'GET' && requestBody ? `-d '${requestBody.replace(/'/g, "\\'")}' \\` : ''}
  ${window.location.origin}${selectedEndpoint.path}`}
                          </pre>
                        </div>
                      </div>

                      <div>
                        <h3 className="text-white font-medium mb-2 flex items-center gap-2">
                          <Code className="w-4 h-4" />
                          JavaScript / Fetch
                        </h3>
                        <div className="bg-slate-950 rounded-lg p-4 border border-slate-700 relative">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCopy(`const response = await fetch('${selectedEndpoint.path}', {
  method: '${selectedEndpoint.method}',
  headers: {
    'Content-Type': 'application/json',
  },
  ${selectedEndpoint.method !== 'GET' && requestBody ? `body: JSON.stringify(${requestBody}),` : ''}
});
const data = await response.json();
console.log(data);`)}
                            className="absolute top-2 right-2 text-slate-400 hover:text-white"
                          >
                            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                          </Button>
                          <pre className="text-blue-400 font-mono text-sm whitespace-pre-wrap">
                            {`const response = await fetch('${selectedEndpoint.path}', {
  method: '${selectedEndpoint.method}',
  headers: {
    'Content-Type': 'application/json',
  },
  ${selectedEndpoint.method !== 'GET' && requestBody ? `body: JSON.stringify(${requestBody}),` : ''}
});
const data = await response.json();
console.log(data);`}
                          </pre>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </Card>
            ) : (
              <Card className="p-8 bg-slate-900/50 border-slate-700 text-center">
                <Cpu className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400">请从左侧选择一个 API 端点</p>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
