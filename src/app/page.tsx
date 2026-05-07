'use client';

import { Sparkles, Video, Image, User, Mic, Palette, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const features = [
  {
    icon: <Video className="w-8 h-8 text-blue-400" />,
    title: '文本描述',
    description: '通过文字描述生成高质量视频',
    href: '/text',
    color: 'from-blue-600 to-purple-600',
  },
  {
    icon: <Image className="w-8 h-8 text-purple-400" />,
    title: '参考图片',
    description: '使用图片作为参考生成视频',
    href: '/reference-images',
    color: 'from-purple-600 to-pink-600',
  },
  {
    icon: <User className="w-8 h-8 text-pink-400" />,
    title: '数字人',
    description: '创建你的专属数字人形象',
    href: '/avatar',
    color: 'from-pink-600 to-rose-600',
  },
  {
    icon: <Mic className="w-8 h-8 text-cyan-400" />,
    title: '图片口播',
    description: '让图片开口说话',
    href: '/avatar-talk',
    color: 'from-cyan-600 to-blue-600',
  },
  {
    icon: <Palette className="w-8 h-8 text-amber-400" />,
    title: '图片生成',
    description: 'AI生成精美的图片',
    href: '/image-generation',
    color: 'from-amber-600 to-orange-600',
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 p-8">
      <div className="max-w-6xl mx-auto">
        {/* 头部 */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Sparkles className="w-12 h-12 text-purple-400" />
            <h1 className="text-4xl font-bold text-white">
              视频创作工坊
            </h1>
          </div>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto">
            强大的AI视频创作平台，多种生成方式，激发无限创意
          </p>
        </div>

        {/* 功能卡片网格 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {features.map((feature, index) => (
            <Link key={index} href={feature.href}>
              <Card className="p-6 bg-slate-800/50 backdrop-blur border-slate-700/50 hover:border-slate-600 hover:shadow-xl hover:shadow-purple-500/10 transition-all duration-300 group h-full">
                <div className="space-y-4">
                  {/* 图标 */}
                  <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center`}>
                    {feature.icon}
                  </div>
                  
                  {/* 内容 */}
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-purple-300 transition-colors">
                      {feature.title}
                    </h3>
                    <p className="text-slate-400 text-sm">
                      {feature.description}
                    </p>
                  </div>

                  {/* 箭头 */}
                  <div className="flex items-center justify-end pt-4">
                    <Button variant="secondary" size="sm" className="group-hover:bg-purple-600/20 group-hover:text-purple-300 transition-colors">
                      开始使用
                      <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>

        {/* 底部说明 */}
        <div className="text-center">
          <p className="text-slate-500 text-sm">
            选择上方任意功能卡片开始你的创作之旅
          </p>
        </div>
      </div>
    </div>
  );
}
