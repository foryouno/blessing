import { NextRequest } from 'next/server';
import { TTSClient, Config, HeaderUtils } from 'coze-coding-dev-sdk';
import { z } from 'zod';
import { createErrorResponse, createSuccessResponse, ApiError } from '@/lib/api-errors';
import { TTSRequest, TTSResponse } from '@/lib/api-types';
import { ttsSchema } from '@/lib/api-schemas';
import { ttsQueue, queueTask } from '@/lib/queue';
import { createRateLimiter } from '@/lib/rate-limit';

const rateLimiter = createRateLimiter({ maxRequests: 10, windowMs: 60000 });

export async function POST(request: NextRequest) {
  try {
    const rateLimitResponse = rateLimiter(request);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    const body = await request.json();
    const validatedData: TTSRequest = ttsSchema.parse(body);
    
    if (!validatedData.text) {
      throw new ApiError('VALIDATION_ERROR', 'text parameter is required', 400);
    }

    const result = await queueTask(ttsQueue, async () => {
      const customHeaders = HeaderUtils.extractForwardHeaders(request.headers);
      const config = new Config();
      const ttsClient = new TTSClient(config, customHeaders);

      const response = await ttsClient.synthesize({
        uid: 'video_generator_user',
        text: validatedData.text,
        speaker: validatedData.voice || 'zh_female_xiaohe_uranus_bigtts',
        audioFormat: 'mp3',
        sampleRate: 24000
      });

      const resultData: TTSResponse = {
        audioUrl: response.audioUri || '',
        taskId: '',
        status: 'completed'
      };

      return resultData;
    });

    return createSuccessResponse(result);

  } catch (error) {
    if (error instanceof z.ZodError) {
      return createErrorResponse(
        new ApiError('VALIDATION_ERROR', 'Request data validation failed', 400, {
          errors: error.issues,
        })
      );
    }

    if (error instanceof ApiError) {
      return createErrorResponse(error);
    }

    console.error('TTS generation failed:', error);
    return createErrorResponse(
      new ApiError('INTERNAL_ERROR', 'TTS generation failed', 500)
    );
  }
}
