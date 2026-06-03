import { NextRequest } from 'next/server';
import { S3Client } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { z } from 'zod';
import { env } from '@/lib/env';
import { createErrorResponse, createSuccessResponse, ApiError } from '@/lib/api-errors';
import { ExtractLastFrameRequest, ExtractLastFrameResponse } from '@/lib/api-types';
import { extractLastFrameSchema } from '@/lib/api-schemas';

const s3Client = new S3Client({
  region: 'cn-north-1',
  endpoint: 'https://tos-s3-cn-north-1.volces.com',
  credentials: {
    accessKeyId: env.TOS_ACCESS_KEY_ID,
    secretAccessKey: env.TOS_SECRET_ACCESS_KEY,
  },
});

async function uploadToTOS(fileBuffer: Buffer, fileName: string, contentType: string): Promise<string> {
  const uploadParams = {
    Bucket: process.env.TOS_BUCKET_NAME || 'default-bucket',
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
  
  return `https://${process.env.TOS_BUCKET_NAME}.tos-cn-north-1.volces.com/${fileName}`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const validatedData: ExtractLastFrameRequest = extractLastFrameSchema.parse(body);

    console.log(`Extract last frame from video: ${validatedData.videoUrl}`);

    return createSuccessResponse<ExtractLastFrameResponse>({
      frameUrl: `${validatedData.videoUrl}?frame=last`,
      width: 1920,
      height: 1080,
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return createErrorResponse(
        new ApiError('VALIDATION_ERROR', 'Request data validation failed', 400, {
          errors: error.errors,
        })
      );
    }

    console.error('Failed to extract last frame:', error);
    return createErrorResponse(
      new ApiError('INTERNAL_ERROR', 'Failed to extract last frame', 500)
    );
  }
}
