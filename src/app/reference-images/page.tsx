'use client';

import { ArrowLeft, Image } from 'lucide-react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function ReferenceImagesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 p-8">
      <div className="max-w-4xl mx-auto">
        <Link href="/">
          <Button variant="secondary" className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            返回首页
          </Button>
        </Link>

        <Card className="p-12 bg-slate-800/50 backdrop-blur border-slate-700/50 text-center">
          <Image className="w-16 h-16 text-purple-400 mx-auto mb-6" />
          <h1 className="text-2xl font-bold text-white mb-4">参考图片生成视频</h1>
          <p className="text-slate-400 mb-8">此功能正在开发中，敬请期待...</p>
          
          <Link href="/">
            <Button>
              返回首页
            </Button>
          </Link>
        </Card>
      </div>
    </div>
  );
}
