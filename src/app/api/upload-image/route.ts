import { NextRequest, NextResponse } from 'next/server';
import { S3Storage } from 'coze-coding-dev-sdk';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // 文件大小限制：最大 10MB
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File size exceeds 10MB limit. Current size: ${(file.size / 1024 / 1024).toFixed(2)}MB` },
        { status: 400 }
      );
    }

    // 文件格式限制：仅支持图片格式
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    const fileExt = file.name.split('.').pop()?.toLowerCase() || '';
    const allowedExts = ['jpg', 'jpeg', 'png', 'webp', 'gif'];
    
    if (!allowedTypes.includes(file.type) && !allowedExts.includes(fileExt)) {
      return NextResponse.json(
        { error: `Unsupported file format. Allowed: JPG, JPEG, PNG, WEBP, GIF` },
        { status: 400 }
      );
    }

    const storage = new S3Storage();
    
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    const fileName = `reference-images/${Date.now()}.${fileExt || 'jpg'}`;
    
    const key = await storage.uploadFile({
      fileContent: buffer,
      fileName,
      contentType: file.type,
    });

    const presignedUrl = await storage.generatePresignedUrl({
      key,
      expireTime: 86400 * 7,
    });

    return NextResponse.json({ 
      imageUrl: presignedUrl,
      fileKey: key
    });
  } catch (error) {
    console.error('Image upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload image' },
      { status: 500 }
    );
  }
}
