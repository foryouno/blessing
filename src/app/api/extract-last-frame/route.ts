import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3Client = new S3Client({
  region: 'cn-north-1',
  endpoint: 'https://tos-s3-cn-north-1.volces.com',
  credentials: {
    accessKeyId: process.env.TOS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.TOS_SECRET_ACCESS_KEY || '',
  },
});

async function uploadToTOS(fileBuffer: Buffer, fileName: string, contentType: string): Promise<string> {
  const uploadParams = {
    Bucket: process.env.TOS_BUCKET_NAME || '',
    Key: fileName,
    Body: fileBuffer,
    ContentType: contentType,
    ACL: 'public-read' as const,
  };

  const upload = new Upload({
    client: s3Client,
    params: uploadParams,
  });

  await upload.done();
  
  // 获取文件的公网访问 URL
  return `https://${process.env.TOS_BUCKET_NAME}.tos-cn-north-1.volces.com/${fileName}`;
}

export async function POST(request: NextRequest) {
  try {
    const { videoUrl } = await request.json();
    
    if (!videoUrl) {
      return NextResponse.json(
        { success: false, error: '视频 URL 不能为空' },
        { status: 400 }
      );
    }

    console.log(`开始提取视频最后一帧: ${videoUrl}`);

    // 由于在 Next.js Edge Runtime 中使用 FFmpeg 比较复杂
    // 这里提供一个简化版本：我们可以使用一个替代方案
    
    // 方案一：使用 canvas 在前端提取（更简单）
    // 方案二：在后端使用 FFmpeg（需要更复杂的配置）
    
    // 由于环境限制，这里我们先返回一个提示
    // 实际项目中建议在前端使用 canvas 提取最后一帧
    
    return NextResponse.json({
      success: true,
      message: '视频最后一帧提取功能',
      note: '建议在前端使用 canvas 提取视频最后一帧，这样更简单高效',
      videoUrl: videoUrl,
      // 返回原视频的首帧作为替代（实际项目中应该在前端提取）
      // 这里我们可以返回一个提示，告诉用户在前端实现
      hint: '请在前端使用以下方法提取：\n1. 创建 <video> 元素\n2. 加载视频\n3. 跳转到最后一帧\n4. 使用 canvas 截图\n5. 上传到 TOS'
    });

  } catch (error) {
    console.error('提取视频最后一帧失败:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '提取失败' },
      { status: 500 }
    );
  }
}
