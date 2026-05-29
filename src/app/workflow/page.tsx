'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Play,
  Save,
  Download,
  Trash2,
  Plus,
  MousePointer2,
  Settings,
  Video,
  Mic,
  Smile,
  Move,
  User,
  Layout,
  Layers,
  PlayCircle,
  PauseCircle,
  RotateCcw,
  FileJson,
  Upload,
  X,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowRight
} from 'lucide-react';

// ===== 节点类型定义 =====
type NodeType = 'seedance' | 'emotion' | 'tts' | 'action' | 'camera' | 'pose' | 'output';
type NodeStatus = 'idle' | 'running' | 'success' | 'error';

// 节点接口
interface WorkflowNode {
  id: string;
  type: NodeType;
  x: number;
  y: number;
  config: any;
  status?: NodeStatus;
  output?: any;
  error?: string;
}

// 连接接口
interface WorkflowConnection {
  id: string;
  from: string;
  to: string;
}

// 节点类型配置
const NODE_TYPES: Record<NodeType, { name: string; icon: any; color: string; description: string; defaultConfig: any }> = {
  seedance: {
    name: 'Seedance 视频模型',
    icon: Video,
    color: 'bg-blue-500',
    description: '使用 Seedance 1.5 Pro 生成视频',
    defaultConfig: {
      model: 'doubao-seedance-1-5-pro-251215',
      duration: 8,
      ratio: '16:9',
      prompt: '',
      firstFrameUrl: ''
    }
  },
  emotion: {
    name: '表情驱动',
    icon: Smile,
    color: 'bg-yellow-500',
    description: '控制人物表情变化',
    defaultConfig: {
      emotion: 'happy',
      intensity: 0.8,
      blink: true
    }
  },
  tts: {
    name: 'TTS 语音合成',
    icon: Mic,
    color: 'bg-green-500',
    description: '文本转语音描述',
    defaultConfig: {
      text: '',
      voice: 'female',
      speed: 1.0,
      pitch: 1.0
    }
  },
  action: {
    name: '自定义动作',
    icon: Move,
    color: 'bg-purple-500',
    description: '定义人物动作',
    defaultConfig: {
      action: 'wave',
      repeat: 1,
      speed: 1.0
    }
  },
  camera: {
    name: '运镜控制',
    icon: Layout,
    color: 'bg-orange-500',
    description: '控制摄像机运动',
    defaultConfig: {
      movement: 'static',
      zoom: 1.0,
      pan: 0,
      tilt: 0
    }
  },
  pose: {
    name: '全身姿态',
    icon: User,
    color: 'bg-pink-500',
    description: '控制全身姿态',
    defaultConfig: {
      pose: 'standing',
      rotation: 0,
      position: { x: 0, y: 0, z: 0 }
    }
  },
  output: {
    name: '输出节点',
    icon: PlayCircle,
    color: 'bg-red-500',
    description: '最终输出',
    defaultConfig: {
      format: 'mp4',
      quality: 'high'
    }
  }
};

// 表情选项
const EMOTIONS = [
  { value: 'happy', label: '开心' },
  { value: 'sad', label: '悲伤' },
  { value: 'angry', label: '愤怒' },
  { value: 'surprised', label: '惊讶' },
  { value: 'neutral', label: '中性' },
  { value: 'excited', label: '兴奋' },
  { value: 'calm', label: '平静' },
  { value: 'thinking', label: '思考' }
];

// 动作选项
const ACTIONS = [
  { value: 'wave', label: '挥手' },
  { value: 'nod', label: '点头' },
  { value: 'shake_head', label: '摇头' },
  { value: 'point', label: '指' },
  { value: 'clap', label: '鼓掌' },
  { value: 'thumbs_up', label: '竖大拇指' },
  { value: 'walk', label: '走路' },
  { value: 'dance', label: '跳舞' }
];

// 运镜选项
const CAMERA_MOVEMENTS = [
  { value: 'static', label: '静止' },
  { value: 'pan_left', label: '左平移' },
  { value: 'pan_right', label: '右平移' },
  { value: 'tilt_up', label: '上仰' },
  { value: 'tilt_down', label: '下俯' },
  { value: 'zoom_in', label: '放大' },
  { value: 'zoom_out', label: '缩小' },
  { value: 'circle', label: '环绕' }
];

// 姿态选项
const POSES = [
  { value: 'standing', label: '站立' },
  { value: 'sitting', label: '坐着' },
  { value: 'walking', label: '行走' },
  { value: 'lying', label: '躺着' },
  { value: 'dancing', label: '跳舞' },
  { value: 'running', label: '跑步' },
  { value: 'jumping', label: '跳跃' },
  { value: 'bowing', label: '鞠躬' }
];

// 视频比例选项
const RATIOS = [
  { value: '16:9', label: '16:9 (横屏)' },
  { value: '9:16', label: '9:16 (竖屏)' },
  { value: '1:1', label: '1:1 (方形)' },
  { value: '4:3', label: '4:3' }
];

// ===== 拓扑排序工具函数 =====
function topologicalSort(nodes: WorkflowNode[], connections: WorkflowConnection[]): string[] {
  const inDegree = new Map<string, number>();
  const adjacencyList = new Map<string, string[]>();
  
  nodes.forEach(node => {
    inDegree.set(node.id, 0);
    adjacencyList.set(node.id, []);
  });
  
  connections.forEach(conn => {
    adjacencyList.get(conn.from)?.push(conn.to);
    inDegree.set(conn.to, (inDegree.get(conn.to) || 0) + 1);
  });
  
  const queue: string[] = [];
  const result: string[] = [];
  
  inDegree.forEach((degree, id) => {
    if (degree === 0) queue.push(id);
  });
  
  while (queue.length > 0) {
    const nodeId = queue.shift()!;
    result.push(nodeId);
    
    const neighbors = adjacencyList.get(nodeId) || [];
    neighbors.forEach(neighborId => {
      const newDegree = (inDegree.get(neighborId) || 0) - 1;
      inDegree.set(neighborId, newDegree);
      if (newDegree === 0) queue.push(neighborId);
    });
  }
  
  return result;
}

// ===== 工作流执行引擎 =====
class WorkflowEngine {
  nodes: WorkflowNode[];
  connections: WorkflowConnection[];
  onNodeStatusChange: (nodeId: string, status: NodeStatus, output?: any, error?: string) => void;
  onProgress: (progress: number, message: string) => void;
  abortController: AbortController;

  constructor(
    nodes: WorkflowNode[],
    connections: WorkflowConnection[],
    onNodeStatusChange: (nodeId: string, status: NodeStatus, output?: any, error?: string) => void,
    onProgress: (progress: number, message: string) => void
  ) {
    this.nodes = nodes;
    this.connections = connections;
    this.onNodeStatusChange = onNodeStatusChange;
    this.onProgress = onProgress;
    this.abortController = new AbortController();
  }

  abort() {
    this.abortController.abort();
  }

  async execute(): Promise<any[]> {
    const executionOrder = topologicalSort(this.nodes, this.connections);
    const results = new Map<string, any>();
    const seedanceResults: any[] = [];

    for (let i = 0; i < executionOrder.length; i++) {
      if (this.abortController.signal.aborted) {
        throw new Error('执行已取消');
      }

      const nodeId = executionOrder[i];
      const node = this.nodes.find(n => n.id === nodeId);
      if (!node) continue;

      this.onNodeStatusChange(nodeId, 'running');
      this.onProgress(
        Math.round((i / executionOrder.length) * 100),
        `正在执行: ${NODE_TYPES[node.type].name}...`
      );

      try {
        // 获取输入节点的输出
        const inputNodes = this.connections
          .filter(c => c.to === nodeId)
          .map(c => this.nodes.find(n => n.id === c.from))
          .filter(Boolean) as WorkflowNode[];

        const inputData = inputNodes.reduce((acc, inputNode) => {
          if (results.has(inputNode.id)) {
            acc[inputNode.type] = results.get(inputNode.id);
          }
          return acc;
        }, {} as any);

        const output = await this.executeNode(node, inputData);
        results.set(nodeId, output);
        this.onNodeStatusChange(nodeId, 'success', output);

        // 收集 seedance 节点的输出
        if (node.type === 'seedance' && output?.videoUrl) {
          seedanceResults.push(output);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '执行失败';
        this.onNodeStatusChange(nodeId, 'error', undefined, errorMessage);
        throw new Error(`节点 "${NODE_TYPES[node.type].name}" 执行失败: ${errorMessage}`);
      }
    }

    this.onProgress(100, '执行完成！');
    return seedanceResults;
  }

  async executeNode(node: WorkflowNode, inputData: any): Promise<any> {
    switch (node.type) {
      case 'seedance':
        return this.executeSeedanceNode(node, inputData);
      case 'emotion':
        return this.executeEmotionNode(node, inputData);
      case 'tts':
        return this.executeTTSNode(node, inputData);
      case 'action':
        return this.executeActionNode(node, inputData);
      case 'camera':
        return this.executeCameraNode(node, inputData);
      case 'pose':
        return this.executePoseNode(node, inputData);
      case 'output':
        return this.executeOutputNode(node, inputData);
      default:
        return {};
    }
  }

  async executeSeedanceNode(node: WorkflowNode, inputData: any): Promise<any> {
    const { prompt, duration, ratio, model, firstFrameUrl } = node.config;

    // 合并所有输入的提示词
    let finalPrompt = prompt || '';
    
    if (inputData.emotion) {
      finalPrompt += `, ${inputData.emotion.emotion}表情`;
    }
    if (inputData.action) {
      finalPrompt += `, ${inputData.action.action}动作`;
    }
    if (inputData.pose) {
      finalPrompt += `, ${inputData.pose.pose}姿态`;
    }
    if (inputData.camera) {
      finalPrompt += `, ${inputData.camera.movement}运镜`;
    }
    if (inputData.tts) {
      finalPrompt += `, 正在说：${inputData.tts.text}`;
    }

    if (!finalPrompt.trim()) {
      finalPrompt = '一个美丽的自然风景，高质量';
    }

    const requestBody: any = {
      prompt: finalPrompt.trim(),
      duration: duration || 8,
      ratio: ratio || '16:9',
      model: model || 'doubao-seedance-1-5-pro-251215'
    };

    // 如果有前一个视频的输出，使用其最后一帧作为首帧
    if (firstFrameUrl) {
      requestBody.firstFrameUrl = firstFrameUrl;
    }

    const response = await fetch('/api/generate-video', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
      signal: this.abortController.signal
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || '视频生成失败');
    }

    return {
      videoUrl: data.videoUrl,
      prompt: finalPrompt,
      duration,
      ratio
    };
  }

  executeEmotionNode(node: WorkflowNode, inputData: any): any {
    return {
      emotion: node.config.emotion,
      intensity: node.config.intensity,
      blink: node.config.blink
    };
  }

  executeTTSNode(node: WorkflowNode, inputData: any): any {
    return {
      text: node.config.text,
      voice: node.config.voice,
      speed: node.config.speed,
      pitch: node.config.pitch
    };
  }

  executeActionNode(node: WorkflowNode, inputData: any): any {
    return {
      action: node.config.action,
      repeat: node.config.repeat,
      speed: node.config.speed
    };
  }

  executeCameraNode(node: WorkflowNode, inputData: any): any {
    return {
      movement: node.config.movement,
      zoom: node.config.zoom,
      pan: node.config.pan,
      tilt: node.config.tilt
    };
  }

  executePoseNode(node: WorkflowNode, inputData: any): any {
    return {
      pose: node.config.pose,
      rotation: node.config.rotation,
      position: node.config.position
    };
  }

  executeOutputNode(node: WorkflowNode, inputData: any): any {
    return {
      format: node.config.format,
      quality: node.config.quality,
      ...inputData
    };
  }
}

export default function WorkflowBuilder() {
  const [nodes, setNodes] = useState<WorkflowNode[]>([]);
  const [connections, setConnections] = useState<WorkflowConnection[]>([]);
  const [selectedNode, setSelectedNode] = useState<WorkflowNode | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [dragNode, setDragNode] = useState<string | null>(null);
  const [mouseDownPos, setMouseDownPos] = useState<{ x: number; y: number } | null>(null);
  const [pendingDragNode, setPendingDragNode] = useState<WorkflowNode | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectFrom, setConnectFrom] = useState<string | null>(null);
  const [connectLine, setConnectLine] = useState<{ x1: number; y1: number; x2: number; y2: number } | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [runProgress, setRunProgress] = useState(0);
  const [runMessage, setRunMessage] = useState('');
  const [outputVideos, setOutputVideos] = useState<any[]>([]);
  const [showTemplates, setShowTemplates] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [executionLogs, setExecutionLogs] = useState<string[]>([]);
  const engineRef = useRef<WorkflowEngine | null>(null);
  
  const canvasRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // 确保只在客户端执行
  useEffect(() => {
    setIsClient(true);
  }, []);

  // 生成唯一ID
  const generateId = useCallback(() => {
    if (!isClient) return 'temp-id';
    return Math.random().toString(36).substr(2, 9);
  }, [isClient]);

  // 添加日志
  const addLog = useCallback((message: string) => {
    setExecutionLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
  }, []);

  // 添加节点
  const addNode = (type: NodeType) => {
    const nodeType = NODE_TYPES[type];
    const newNode: WorkflowNode = {
      id: generateId(),
      type,
      x: isClient ? 100 + Math.random() * 200 : 150,
      y: isClient ? 100 + Math.random() * 200 : 150,
      config: { ...nodeType.defaultConfig },
      status: 'idle'
    };
    setNodes(prev => [...prev, newNode]);
    addLog(`添加节点: ${nodeType.name}`);
  };

  // 删除节点
  const deleteNode = (id: string) => {
    const node = nodes.find(n => n.id === id);
    if (node) {
      addLog(`删除节点: ${NODE_TYPES[node.type].name}`);
    }
    setNodes(prev => prev.filter(n => n.id !== id));
    setConnections(prev => prev.filter(c => c.from !== id && c.to !== id));
    if (selectedNode?.id === id) {
      setSelectedNode(null);
    }
  };

  // 更新节点配置
  const updateNodeConfig = (id: string, config: any) => {
    setNodes(prev => prev.map(n => 
      n.id === id ? { ...n, config: { ...n.config, ...config } } : n
    ));
    if (selectedNode?.id === id) {
      setSelectedNode(prev => prev ? { ...prev, config: { ...prev.config, ...config } } : null);
    }
  };

  // 更新节点状态
  const updateNodeStatus = (nodeId: string, status: NodeStatus, output?: any, error?: string) => {
    setNodes(prev => prev.map(n => 
      n.id === nodeId ? { ...n, status, output, error } : n
    ));
  };

  // 节点鼠标按下（区分点击和拖拽）
  const handleNodeMouseDown = (e: React.MouseEvent, node: WorkflowNode) => {
    e.stopPropagation();
    if (e.button !== 0) return; // 只处理左键
    setMouseDownPos({ x: e.clientX, y: e.clientY });
    setPendingDragNode(node);
    setDragStart({ x: e.clientX - node.x, y: e.clientY - node.y });
  };

  // 画布鼠标移动
  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    // 判断是否开始拖拽（移动距离超过阈值）
    if (pendingDragNode && mouseDownPos && !isDragging) {
      const dx = e.clientX - mouseDownPos.x;
      const dy = e.clientY - mouseDownPos.y;
      if (Math.sqrt(dx * dx + dy * dy) > 3) {
        setIsDragging(true);
        setDragNode(pendingDragNode.id);
        setSelectedNode(pendingDragNode);
      }
    }
    
    if (isDragging && dragNode) {
      const newX = e.clientX - dragStart.x;
      const newY = e.clientY - dragStart.y;
      setNodes(prev => prev.map(n => 
        n.id === dragNode ? { ...n, x: newX, y: newY } : n
      ));
    }
    
    if (isConnecting && connectFrom) {
      const fromNode = nodes.find(n => n.id === connectFrom);
      if (fromNode && svgRef.current) {
        const rect = svgRef.current.getBoundingClientRect();
        setConnectLine({
          x1: fromNode.x + 150,
          y1: fromNode.y + 40,
          x2: e.clientX - rect.left,
          y2: e.clientY - rect.top
        });
      }
    }
  };

  // 画布鼠标释放
  const handleCanvasMouseUp = () => {
    // 如果是点击（没有触发拖拽），则选择节点
    if (pendingDragNode && !isDragging) {
      setSelectedNode(pendingDragNode);
    }
    setIsDragging(false);
    setDragNode(null);
    setMouseDownPos(null);
    setPendingDragNode(null);
    setIsConnecting(false);
    setConnectFrom(null);
    setConnectLine(null);
  };

  // 开始连接
  const startConnection = (e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation();
    setIsConnecting(true);
    setConnectFrom(nodeId);
  };

  // 结束连接
  const endConnection = (e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation();
    if (isConnecting && connectFrom && connectFrom !== nodeId) {
      const exists = connections.some(c => 
        (c.from === connectFrom && c.to === nodeId) ||
        (c.from === nodeId && c.to === connectFrom)
      );
      if (!exists) {
        const newConnection: WorkflowConnection = {
          id: generateId(),
          from: connectFrom,
          to: nodeId
        };
        setConnections(prev => [...prev, newConnection]);
        const fromNode = nodes.find(n => n.id === connectFrom);
        const toNode = nodes.find(n => n.id === nodeId);
        if (fromNode && toNode) {
          addLog(`连接: ${NODE_TYPES[fromNode.type].name} → ${NODE_TYPES[toNode.type].name}`);
        }
      }
    }
    setIsConnecting(false);
    setConnectFrom(null);
    setConnectLine(null);
  };

  // 获取节点位置
  const getNodePosition = (nodeId: string) => {
    const node = nodes.find(n => n.id === nodeId);
    return node ? { x: node.x + 150, y: node.y + 40 } : { x: 0, y: 0 };
  };

  // ===== 执行工作流 =====
  const runWorkflow = async () => {
    if (nodes.length === 0) {
      alert('请先添加节点！');
      return;
    }

    // 重置所有节点状态
    setNodes(prev => prev.map(n => ({ ...n, status: 'idle', output: undefined, error: undefined })));
    setExecutionLogs([]);
    setIsRunning(true);
    setRunProgress(0);
    setRunMessage('准备执行...');
    setOutputVideos([]);

    addLog('开始执行工作流...');

    try {
      const engine = new WorkflowEngine(
        nodes,
        connections,
        (nodeId, status, output, error) => {
          updateNodeStatus(nodeId, status, output, error);
          const node = nodes.find(n => n.id === nodeId);
          if (node) {
            if (status === 'success') {
              addLog(`✅ ${NODE_TYPES[node.type].name} 执行成功`);
            } else if (status === 'error') {
              addLog(`❌ ${NODE_TYPES[node.type].name} 执行失败: ${error}`);
            } else if (status === 'running') {
              addLog(`⏳ ${NODE_TYPES[node.type].name} 执行中...`);
            }
          }
        },
        (progress, message) => {
          setRunProgress(progress);
          setRunMessage(message);
        }
      );

      engineRef.current = engine;
      const results = await engine.execute();
      
      setOutputVideos(results);
      addLog(`工作流执行完成！生成 ${results.length} 个视频`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '执行失败';
      addLog(`❌ 工作流执行失败: ${errorMessage}`);
      console.error('工作流执行失败:', error);
      alert(errorMessage);
    } finally {
      setIsRunning(false);
      engineRef.current = null;
    }
  };

  // 取消执行
  const cancelExecution = () => {
    if (engineRef.current) {
      engineRef.current.abort();
      addLog('用户取消执行');
    }
  };

  // 保存工作流
  const saveWorkflow = () => {
    if (!isClient) return;
    const workflow = { nodes, connections, createdAt: new Date().toISOString() };
    const dataStr = JSON.stringify(workflow, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `workflow-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
    addLog('工作流已保存');
  };

  // 加载工作流
  const loadWorkflow = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const workflow = JSON.parse(event.target?.result as string);
          setNodes(workflow.nodes || []);
          setConnections(workflow.connections || []);
          addLog('工作流已加载');
        } catch (error) {
          console.error('加载工作流失败:', error);
          alert('加载工作流失败');
        }
      };
      reader.readAsText(file);
    }
  };

  // 加载模板
  const loadTemplate = (template: string) => {
    let templateNodes: WorkflowNode[] = [];
    let templateConnections: WorkflowConnection[] = [];

    switch (template) {
      case 'basic':
        templateNodes = [
          { id: generateId(), type: 'seedance', x: 100, y: 200, config: { ...NODE_TYPES.seedance.defaultConfig } },
          { id: generateId(), type: 'tts', x: 400, y: 100, config: { ...NODE_TYPES.tts.defaultConfig } },
          { id: generateId(), type: 'output', x: 700, y: 200, config: { ...NODE_TYPES.output.defaultConfig } }
        ];
        templateConnections = [
          { id: generateId(), from: templateNodes[0].id, to: templateNodes[2].id },
          { id: generateId(), from: templateNodes[1].id, to: templateNodes[2].id }
        ];
        break;

      case 'avatar':
        templateNodes = [
          { id: generateId(), type: 'tts', x: 100, y: 100, config: { ...NODE_TYPES.tts.defaultConfig } },
          { id: generateId(), type: 'emotion', x: 100, y: 300, config: { ...NODE_TYPES.emotion.defaultConfig } },
          { id: generateId(), type: 'action', x: 100, y: 500, config: { ...NODE_TYPES.action.defaultConfig } },
          { id: generateId(), type: 'pose', x: 400, y: 100, config: { ...NODE_TYPES.pose.defaultConfig } },
          { id: generateId(), type: 'camera', x: 400, y: 350, config: { ...NODE_TYPES.camera.defaultConfig } },
          { id: generateId(), type: 'seedance', x: 700, y: 225, config: { ...NODE_TYPES.seedance.defaultConfig } },
          { id: generateId(), type: 'output', x: 1000, y: 225, config: { ...NODE_TYPES.output.defaultConfig } }
        ];
        templateConnections = [
          { id: generateId(), from: templateNodes[0].id, to: templateNodes[5].id },
          { id: generateId(), from: templateNodes[1].id, to: templateNodes[5].id },
          { id: generateId(), from: templateNodes[2].id, to: templateNodes[5].id },
          { id: generateId(), from: templateNodes[3].id, to: templateNodes[5].id },
          { id: generateId(), from: templateNodes[4].id, to: templateNodes[5].id },
          { id: generateId(), from: templateNodes[5].id, to: templateNodes[6].id }
        ];
        break;

      case 'story':
        templateNodes = [
          { id: generateId(), type: 'seedance', x: 100, y: 150, config: { ...NODE_TYPES.seedance.defaultConfig, prompt: '开头场景' } },
          { id: generateId(), type: 'camera', x: 400, y: 100, config: { ...NODE_TYPES.camera.defaultConfig, movement: 'zoom_in' } },
          { id: generateId(), type: 'seedance', x: 100, y: 350, config: { ...NODE_TYPES.seedance.defaultConfig, prompt: '中间情节' } },
          { id: generateId(), type: 'tts', x: 400, y: 300, config: { ...NODE_TYPES.tts.defaultConfig, text: '旁白解说' } },
          { id: generateId(), type: 'seedance', x: 700, y: 200, config: { ...NODE_TYPES.seedance.defaultConfig, prompt: '结尾场景' } },
          { id: generateId(), type: 'output', x: 1000, y: 200, config: { ...NODE_TYPES.output.defaultConfig } }
        ];
        templateConnections = [
          { id: generateId(), from: templateNodes[0].id, to: templateNodes[4].id },
          { id: generateId(), from: templateNodes[1].id, to: templateNodes[4].id },
          { id: generateId(), from: templateNodes[2].id, to: templateNodes[4].id },
          { id: generateId(), from: templateNodes[3].id, to: templateNodes[4].id },
          { id: generateId(), from: templateNodes[4].id, to: templateNodes[5].id }
        ];
        break;
    }

    setNodes(templateNodes.map(n => ({ ...n, status: 'idle' })));
    setConnections(templateConnections);
    setShowTemplates(false);
    addLog(`加载模板: ${template === 'basic' ? '基础视频生成' : template === 'avatar' ? '数字人全功能' : '故事视频'}`);
  };

  // 清空画布
  const clearCanvas = () => {
    if (confirm('确定要清空画布吗？')) {
      setNodes([]);
      setConnections([]);
      setSelectedNode(null);
      setOutputVideos([]);
      setExecutionLogs([]);
      addLog('画布已清空');
    }
  };

  // 只在客户端渲染完整内容
  if (!isClient) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="text-muted-foreground">加载中...</div>
      </div>
    );
  }

  // 获取节点状态颜色
  const getStatusColor = (status?: NodeStatus) => {
    switch (status) {
      case 'running': return 'ring-2 ring-yellow-400 animate-pulse';
      case 'success': return 'ring-2 ring-green-400';
      case 'error': return 'ring-2 ring-red-400';
      default: return '';
    }
  };

  const getStatusIcon = (status?: NodeStatus) => {
    switch (status) {
      case 'running': return <Loader2 className="w-4 h-4 animate-spin text-yellow-400" />;
      case 'success': return <CheckCircle2 className="w-4 h-4 text-green-400" />;
      case 'error': return <AlertCircle className="w-4 h-4 text-red-400" />;
      default: return null;
    }
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* 顶部工具栏 */}
      <div className="border-b border-border p-4 bg-card">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold flex items-center gap-2">
              <Layers className="w-6 h-6" />
              工作流编辑器
            </h1>
            <div className="flex items-center gap-2">
              <Button 
                onClick={isRunning ? cancelExecution : runWorkflow} 
                disabled={nodes.length === 0}
                className={`gap-2 ${isRunning ? 'bg-red-500 hover:bg-red-600' : ''}`}
              >
                {isRunning ? <PauseCircle className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                {isRunning ? '取消执行' : '执行工作流'}
              </Button>
              <Button onClick={saveWorkflow} variant="secondary" className="gap-2">
                <Save className="w-4 h-4" />
                保存
              </Button>
              <label className="cursor-pointer">
                <Button variant="secondary" className="gap-2" asChild>
                  <span>
                    <Upload className="w-4 h-4" />
                    加载
                  </span>
                </Button>
                <input 
                  type="file" 
                  accept=".json" 
                  onChange={loadWorkflow} 
                  className="hidden"
                />
              </label>
              <Button 
                onClick={() => setShowTemplates(true)} 
                variant="secondary" 
                className="gap-2"
              >
                <FileJson className="w-4 h-4" />
                模板
              </Button>
              <Button onClick={clearCanvas} variant="destructive" className="gap-2">
                <Trash2 className="w-4 h-4" />
                清空
              </Button>
            </div>
          </div>
          
          {isRunning && (
            <div className="flex items-center gap-4">
              <div className="text-sm text-muted-foreground">
                {runMessage} ({runProgress}%)
              </div>
              <div className="w-48 bg-secondary rounded-full h-2">
                <div 
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${runProgress}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* 左侧节点面板 */}
        <div className="w-64 border-r border-border bg-card p-4 overflow-y-auto">
          <h2 className="text-sm font-semibold text-muted-foreground mb-4">节点库</h2>
          <div className="space-y-2">
            {(Object.entries(NODE_TYPES) as [NodeType, any][]).map(([type, config]) => (
              <button
                key={type}
                onClick={() => addNode(type)}
                className="w-full p-3 rounded-lg border border-border hover:border-primary hover:bg-accent transition-all text-left group"
              >
                <div className="flex items-center gap-3">
                  <div className={`${config.color} p-2 rounded-lg text-white`}>
                    <config.icon className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-medium text-sm">{config.name}</div>
                    <div className="text-xs text-muted-foreground">{config.description}</div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* 中间画布区域 */}
        <div className="flex-1 relative overflow-hidden bg-muted/30">
          <div 
            ref={canvasRef}
            className="w-full h-full relative cursor-crosshair"
            onMouseMove={handleCanvasMouseMove}
            onMouseUp={handleCanvasMouseUp}
            onMouseLeave={handleCanvasMouseUp}
            onClick={() => setSelectedNode(null)}
          >
            {/* SVG 连接线层 */}
            <svg 
              ref={svgRef}
              className="absolute inset-0 w-full h-full pointer-events-none"
              style={{ zIndex: 1 }}
            >
              {/* 已存在的连接 */}
              {connections.map(conn => {
                const fromPos = getNodePosition(conn.from);
                const toPos = getNodePosition(conn.to);
                const midX = (fromPos.x + toPos.x) / 2;
                return (
                  <path
                    key={conn.id}
                    d={`M ${fromPos.x} ${fromPos.y} C ${midX} ${fromPos.y}, ${midX} ${toPos.y}, ${toPos.x} ${toPos.y}`}
                    stroke="hsl(var(--primary))"
                    strokeWidth="3"
                    fill="none"
                    className="pointer-events-auto cursor-pointer hover:stroke-primary/80"
                  />
                );
              })}
              
              {/* 正在绘制的连接线 */}
              {connectLine && (
                <path
                  d={`M ${connectLine.x1} ${connectLine.y1} C ${(connectLine.x1 + connectLine.x2) / 2} ${connectLine.y1}, ${(connectLine.x1 + connectLine.x2) / 2} ${connectLine.y2}, ${connectLine.x2} ${connectLine.y2}`}
                  stroke="hsl(var(--primary))"
                  strokeWidth="3"
                  strokeDasharray="5,5"
                  fill="none"
                />
              )}
            </svg>

            {/* 节点层 */}
            <div style={{ zIndex: 2 }}>
              {nodes.map(node => {
                const nodeType = NODE_TYPES[node.type];
                const isSelected = selectedNode?.id === node.id;
                return (
                  <div
                    key={node.id}
                    className={`absolute w-72 bg-card rounded-xl border-2 shadow-lg transition-all cursor-move ${
                      isSelected ? 'border-primary ring-2 ring-primary/20' : 'border-border hover:border-border/80'
                    } ${getStatusColor(node.status)}`}
                    style={{ left: node.x, top: node.y }}
                    onMouseDown={(e) => handleNodeMouseDown(e, node)}
                  >
                    {/* 节点头部 */}
                    <div className={`${nodeType.color} px-4 py-3 rounded-t-lg flex items-center justify-between`}>
                      <div className="flex items-center gap-2 text-white">
                        <nodeType.icon className="w-5 h-5" />
                        <span className="font-semibold">{nodeType.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(node.status)}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNode(node.id);
                          }}
                          className="text-white/80 hover:text-white"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    
                    {/* 连接点 */}
                    <div 
                      className="absolute -left-2 top-1/2 -translate-y-1/2 w-4 h-4 bg-primary rounded-full border-2 border-background cursor-pointer hover:scale-125 transition-transform"
                      onMouseDown={(e) => startConnection(e, node.id)}
                    />
                    <div 
                      className="absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-4 bg-primary rounded-full border-2 border-background cursor-pointer hover:scale-125 transition-transform"
                      onMouseUp={(e) => endConnection(e, node.id)}
                    />
                    
                    {/* 节点内容 */}
                    <div className="p-4">
                      <div className="text-xs text-muted-foreground mb-2">
                        ID: {node.id}
                      </div>
                      {node.status === 'error' && node.error && (
                        <div className="text-xs text-red-400 mt-2">
                          错误: {node.error}
                        </div>
                      )}
                      {node.status === 'success' && node.output && (
                        <div className="text-xs text-green-400 mt-2">
                          ✓ 执行成功
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* 右侧属性面板 */}
        <div className="w-80 border-l border-border bg-card overflow-y-auto">
          {selectedNode ? (
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">节点配置</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedNode(null)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <div className="space-y-4">
                {/* Seedance 视频模型配置 */}
                {selectedNode.type === 'seedance' && (
                  <>
                    <div>
                      <Label>模型</Label>
                      <Select 
                        value={selectedNode.config.model}
                        onValueChange={(value) => updateNodeConfig(selectedNode.id, { model: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="doubao-seedance-1-5-pro-251215">Seedance 1.5 Pro</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>提示词</Label>
                      <Textarea
                        value={selectedNode.config.prompt}
                        onChange={(e) => updateNodeConfig(selectedNode.id, { prompt: e.target.value })}
                        placeholder="描述你想要的视频内容..."
                        rows={4}
                      />
                    </div>

                    <div>
                      <Label>时长: {selectedNode.config.duration}秒</Label>
                      <Slider
                        value={[selectedNode.config.duration]}
                        onValueChange={(value) => updateNodeConfig(selectedNode.id, { duration: value[0] })}
                        min={5}
                        max={12}
                        step={1}
                      />
                    </div>

                    <div>
                      <Label>视频比例</Label>
                      <Select 
                        value={selectedNode.config.ratio}
                        onValueChange={(value) => updateNodeConfig(selectedNode.id, { ratio: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {RATIOS.map(ratio => (
                            <SelectItem key={ratio.value} value={ratio.value}>
                              {ratio.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                )}

                {/* 表情驱动配置 */}
                {selectedNode.type === 'emotion' && (
                  <>
                    <div>
                      <Label>表情</Label>
                      <Select 
                        value={selectedNode.config.emotion}
                        onValueChange={(value) => updateNodeConfig(selectedNode.id, { emotion: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {EMOTIONS.map(emotion => (
                            <SelectItem key={emotion.value} value={emotion.value}>
                              {emotion.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>表情强度: {selectedNode.config.intensity}</Label>
                      <Slider
                        value={[selectedNode.config.intensity]}
                        onValueChange={(value) => updateNodeConfig(selectedNode.id, { intensity: value[0] })}
                        min={0}
                        max={1}
                        step={0.1}
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <Switch
                        checked={selectedNode.config.blink}
                        onCheckedChange={(checked) => updateNodeConfig(selectedNode.id, { blink: checked })}
                      />
                      <Label>自动眨眼</Label>
                    </div>
                  </>
                )}

                {/* TTS 配置 */}
                {selectedNode.type === 'tts' && (
                  <>
                    <div>
                      <Label>文本内容</Label>
                      <Textarea
                        value={selectedNode.config.text}
                        onChange={(e) => updateNodeConfig(selectedNode.id, { text: e.target.value })}
                        placeholder="输入要朗读的文本..."
                        rows={4}
                      />
                    </div>

                    <div>
                      <Label>音色</Label>
                      <Select 
                        value={selectedNode.config.voice}
                        onValueChange={(value) => updateNodeConfig(selectedNode.id, { voice: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="male">男声</SelectItem>
                          <SelectItem value="female">女声</SelectItem>
                          <SelectItem value="child">童声</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>语速: {selectedNode.config.speed}x</Label>
                      <Slider
                        value={[selectedNode.config.speed]}
                        onValueChange={(value) => updateNodeConfig(selectedNode.id, { speed: value[0] })}
                        min={0.5}
                        max={2}
                        step={0.1}
                      />
                    </div>

                    <div>
                      <Label>音调: {selectedNode.config.pitch}</Label>
                      <Slider
                        value={[selectedNode.config.pitch]}
                        onValueChange={(value) => updateNodeConfig(selectedNode.id, { pitch: value[0] })}
                        min={0.5}
                        max={1.5}
                        step={0.1}
                      />
                    </div>
                  </>
                )}

                {/* 自定义动作配置 */}
                {selectedNode.type === 'action' && (
                  <>
                    <div>
                      <Label>动作</Label>
                      <Select 
                        value={selectedNode.config.action}
                        onValueChange={(value) => updateNodeConfig(selectedNode.id, { action: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {ACTIONS.map(action => (
                            <SelectItem key={action.value} value={action.value}>
                              {action.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>重复次数: {selectedNode.config.repeat}</Label>
                      <Slider
                        value={[selectedNode.config.repeat]}
                        onValueChange={(value) => updateNodeConfig(selectedNode.id, { repeat: value[0] })}
                        min={1}
                        max={5}
                        step={1}
                      />
                    </div>

                    <div>
                      <Label>动作速度: {selectedNode.config.speed}x</Label>
                      <Slider
                        value={[selectedNode.config.speed]}
                        onValueChange={(value) => updateNodeConfig(selectedNode.id, { speed: value[0] })}
                        min={0.5}
                        max={2}
                        step={0.1}
                      />
                    </div>
                  </>
                )}

                {/* 运镜控制配置 */}
                {selectedNode.type === 'camera' && (
                  <>
                    <div>
                      <Label>运镜方式</Label>
                      <Select 
                        value={selectedNode.config.movement}
                        onValueChange={(value) => updateNodeConfig(selectedNode.id, { movement: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {CAMERA_MOVEMENTS.map(movement => (
                            <SelectItem key={movement.value} value={movement.value}>
                              {movement.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>缩放: {selectedNode.config.zoom}x</Label>
                      <Slider
                        value={[selectedNode.config.zoom]}
                        onValueChange={(value) => updateNodeConfig(selectedNode.id, { zoom: value[0] })}
                        min={0.5}
                        max={2}
                        step={0.1}
                      />
                    </div>

                    <div>
                      <Label>水平平移: {selectedNode.config.pan}°</Label>
                      <Slider
                        value={[selectedNode.config.pan]}
                        onValueChange={(value) => updateNodeConfig(selectedNode.id, { pan: value[0] })}
                        min={-45}
                        max={45}
                        step={1}
                      />
                    </div>

                    <div>
                      <Label>垂直俯仰: {selectedNode.config.tilt}°</Label>
                      <Slider
                        value={[selectedNode.config.tilt]}
                        onValueChange={(value) => updateNodeConfig(selectedNode.id, { tilt: value[0] })}
                        min={-45}
                        max={45}
                        step={1}
                      />
                    </div>
                  </>
                )}

                {/* 全身姿态配置 */}
                {selectedNode.type === 'pose' && (
                  <>
                    <div>
                      <Label>姿态</Label>
                      <Select 
                        value={selectedNode.config.pose}
                        onValueChange={(value) => updateNodeConfig(selectedNode.id, { pose: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {POSES.map(pose => (
                            <SelectItem key={pose.value} value={pose.value}>
                              {pose.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>旋转角度: {selectedNode.config.rotation}°</Label>
                      <Slider
                        value={[selectedNode.config.rotation]}
                        onValueChange={(value) => updateNodeConfig(selectedNode.id, { rotation: value[0] })}
                        min={-180}
                        max={180}
                        step={5}
                      />
                    </div>

                    <div>
                      <Label>位置 X: {selectedNode.config.position.x}</Label>
                      <Slider
                        value={[selectedNode.config.position.x]}
                        onValueChange={(value) => updateNodeConfig(selectedNode.id, { 
                          position: { ...selectedNode.config.position, x: value[0] } 
                        })}
                        min={-2}
                        max={2}
                        step={0.1}
                      />
                    </div>

                    <div>
                      <Label>位置 Y: {selectedNode.config.position.y}</Label>
                      <Slider
                        value={[selectedNode.config.position.y]}
                        onValueChange={(value) => updateNodeConfig(selectedNode.id, { 
                          position: { ...selectedNode.config.position, y: value[0] } 
                        })}
                        min={-2}
                        max={2}
                        step={0.1}
                      />
                    </div>

                    <div>
                      <Label>位置 Z: {selectedNode.config.position.z}</Label>
                      <Slider
                        value={[selectedNode.config.position.z]}
                        onValueChange={(value) => updateNodeConfig(selectedNode.id, { 
                          position: { ...selectedNode.config.position, z: value[0] } 
                        })}
                        min={-2}
                        max={2}
                        step={0.1}
                      />
                    </div>
                  </>
                )}

                {/* 输出节点配置 */}
                {selectedNode.type === 'output' && (
                  <>
                    <div>
                      <Label>输出格式</Label>
                      <Select 
                        value={selectedNode.config.format}
                        onValueChange={(value) => updateNodeConfig(selectedNode.id, { format: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="mp4">MP4</SelectItem>
                          <SelectItem value="webm">WebM</SelectItem>
                          <SelectItem value="mov">MOV</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>画质</Label>
                      <Select 
                        value={selectedNode.config.quality}
                        onValueChange={(value) => updateNodeConfig(selectedNode.id, { quality: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">低画质</SelectItem>
                          <SelectItem value="medium">中等画质</SelectItem>
                          <SelectItem value="high">高画质</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-muted-foreground">
              <MousePointer2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>选择一个节点来编辑配置</p>
              <p className="text-sm mt-2">或从左侧拖拽节点到画布</p>
            </div>
          )}
        </div>
      </div>

      {/* 底部输出区域 */}
      <div className="flex border-t border-border">
        {/* 执行日志 */}
        <div className="w-1/2 border-r border-border bg-card p-4">
          <h3 className="text-sm font-semibold mb-2">执行日志</h3>
          <ScrollArea className="h-40">
            <div className="space-y-1">
              {executionLogs.length === 0 ? (
                <p className="text-xs text-muted-foreground">等待执行...</p>
              ) : (
                executionLogs.map((log, index) => (
                  <p key={index} className="text-xs font-mono">{log}</p>
                ))
              )}
            </div>
          </ScrollArea>
        </div>

        {/* 输出视频 */}
        <div className="w-1/2 bg-card p-4">
          <h3 className="text-sm font-semibold mb-2">
            输出视频 {outputVideos.length > 0 && `(${outputVideos.length})`}
          </h3>
          <ScrollArea className="h-40">
            <div className="space-y-2">
              {outputVideos.length === 0 ? (
                <p className="text-xs text-muted-foreground">执行后将在此处显示视频</p>
              ) : (
                outputVideos.map((video, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 border border-border rounded-lg">
                    <Video className="w-4 h-4 text-primary" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">视频 {index + 1}</p>
                      <p className="text-xs text-muted-foreground truncate">{video.prompt}</p>
                    </div>
                    <a 
                      href={video.videoUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-xs text-primary hover:underline"
                    >
                      查看
                    </a>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </div>
      </div>

      {/* 模板弹窗 */}
      {showTemplates && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">工作流模板</h2>
                <Button variant="ghost" onClick={() => setShowTemplates(false)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="grid gap-4">
                <button
                  onClick={() => loadTemplate('basic')}
                  className="p-4 border border-border rounded-lg hover:border-primary hover:bg-accent text-left transition-all"
                >
                  <h3 className="font-semibold mb-1">基础视频生成</h3>
                  <p className="text-sm text-muted-foreground">
                    Seedance 视频模型 + TTS 语音合成 + 输出
                  </p>
                </button>

                <button
                  onClick={() => loadTemplate('avatar')}
                  className="p-4 border border-border rounded-lg hover:border-primary hover:bg-accent text-left transition-all"
                >
                  <h3 className="font-semibold mb-1">数字人全功能</h3>
                  <p className="text-sm text-muted-foreground">
                    表情驱动 + 自定义动作 + 全身姿态 + 运镜控制 + TTS + Seedance
                  </p>
                </button>

                <button
                  onClick={() => loadTemplate('story')}
                  className="p-4 border border-border rounded-lg hover:border-primary hover:bg-accent text-left transition-all"
                >
                  <h3 className="font-semibold mb-1">故事视频</h3>
                  <p className="text-sm text-muted-foreground">
                    多场景串联 + 旁白解说 + 运镜变化
                  </p>
                </button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
