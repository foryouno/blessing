import { NextRequest } from 'next/server';
import { ImageGenerationClient, Config, HeaderUtils } from 'coze-coding-dev-sdk';
import { z } from 'zod';
import { createErrorResponse, createSuccessResponse, ApiError } from '@/lib/api-errors';
import { GenerateImageRequest, GenerateImageResponse } from '@/lib/api-types';
import { generateImageSchema } from '@/lib/api-schemas';
import { imageQueue, queueTask } from '@/lib/queue';
import { createRateLimiter } from '@/lib/rate-limit';

const rateLimiter = createRateLimiter({ maxRequests: 5, windowMs: 60000 });

export async function POST(request: NextRequest) {
  try {
    const rateLimitResponse = rateLimiter(request);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    const body = await request.json();
    const validatedData: GenerateImageRequest = generateImageSchema.parse(body);
    
    if (!validatedData.prompt) {
      throw new ApiError('VALIDATION_ERROR', 'Image description is required', 400);
    }

    const result = await queueTask(imageQueue, async () => {
      const customHeaders = HeaderUtils.extractForwardHeaders(request.headers);
      const config = new Config();
      const client = new ImageGenerationClient(config, customHeaders);

      const generateParams: any = {
        prompt: validatedData.prompt,
        size: validatedData.size || '2K',
        model: validatedData.model || 'doubao-seedream-5-0-260128',
        watermark: true,
        optimizePromptMode: 'standard',
      };

      if (validatedData.image) {
        generateParams.image = validatedData.image;
      }

      const response = await client.generate(generateParams);

      const helper = client.getResponseHelper(response);

      if (helper.success) {
        const resultData: GenerateImageResponse = {
          imageUrl: helper.imageUrls?.[0] || '',
          taskId: (response as any).id || '',
          status: 'completed'
        };
        return resultData;
      } else {
        throw new ApiError(
          'EXTERNAL_API_ERROR',
          helper.errorMessages.join(', ') || 'Image generation failed',
          500
        );
      }
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

    console.error('Image generation error:', error);
    return createErrorResponse(
      new ApiError('INTERNAL_ERROR', 'Image generation failed', 500)
    );
  }
}
