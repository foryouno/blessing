import { NextRequest } from 'next/server';
import { VideoGenerationClient, Config, HeaderUtils, Content } from 'coze-coding-dev-sdk';
import { z } from 'zod';
import { createErrorResponse, createSuccessResponse, ApiError } from '@/lib/api-errors';
import { GenerateVideoRequest, GenerateVideoResponse } from '@/lib/api-types';
import { generateVideoSchema } from '@/lib/api-schemas';
import { videoQueue, queueTask } from '@/lib/queue';
import { createRateLimiter } from '@/lib/rate-limit';

const rateLimiter = createRateLimiter({ maxRequests: 3, windowMs: 60000 });

export async function POST(request: NextRequest) {
  try {
    const rateLimitResponse = rateLimiter(request);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    const body = await request.json();
    const validatedData: GenerateVideoRequest = generateVideoSchema.parse(body);
    
    if (!validatedData.prompt && !validatedData.firstFrameUrl) {
      throw new ApiError(
        'VALIDATION_ERROR',
        'Either prompt or firstFrameUrl must be provided',
        400
      );
    }

    const result = await queueTask(videoQueue, async () => {
      const customHeaders = HeaderUtils.extractForwardHeaders(request.headers);
      const config = new Config();
      const client = new VideoGenerationClient(config, customHeaders);

      const content: Content[] = [];

      if (validatedData.firstFrameUrl?.length) {
        content.push({
          type: 'image_url' as const,
          image_url: { url: validatedData.firstFrameUrl },
          role: 'first_frame' as const
        });
      }

      if (validatedData.lastFrameUrl?.length) {
        content.push({
          type: 'image_url' as const,
          image_url: { url: validatedData.lastFrameUrl },
          role: 'last_frame' as const
        });
      }

      if (validatedData.prompt) {
        content.push({ type: 'text' as const, text: validatedData.prompt });
      }

      const response = await client.videoGeneration(content, {
        model: validatedData.model,
        duration: validatedData.duration,
        ratio: validatedData.ratio,
      });

      if (!response.videoUrl) {
        throw new ApiError('EXTERNAL_API_ERROR', 'Video generation failed, no URL returned', 500);
      }

      const resultData: GenerateVideoResponse = {
        videoUrl: response.videoUrl,
        taskId: response.response.id,
        status: response.response.status
      };

      return resultData;
    });

    return createSuccessResponse(result);

  } catch (error) {
    if (error instanceof z.ZodError) {
      return createErrorResponse(
        new ApiError('VALIDATION_ERROR', 'Request data validation failed', 400, {
          errors: error.errors,
        })
      );
    }

    if (error instanceof ApiError) {
      return createErrorResponse(error);
    }

    console.error('Video generation failed:', error);
    
    const apiError = error as { statusCode?: number; message?: string; response?: unknown };
    return createErrorResponse(
      new ApiError(
        'EXTERNAL_API_ERROR',
        apiError.message || 'Video generation failed',
        apiError.statusCode || 500,
        { details: apiError.response }
      )
    );
  }
}
