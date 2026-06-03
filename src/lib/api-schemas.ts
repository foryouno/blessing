import { z } from 'zod';

export const generateVideoSchema = z.object({
  prompt: z.string().optional(),
  duration: z.number().min(5).max(15).default(5),
  ratio: z.enum(['16:9', '9:16', '1:1', '4:3']).default('16:9'),
  firstFrameUrl: z.string().url().optional(),
  lastFrameUrl: z.string().url().optional(),
  model: z.string().optional(),
});

export const generateImageSchema = z.object({
  prompt: z.string().optional(),
  model: z.string().optional(),
  image: z.string().optional(),
});

export const ttsSchema = z.object({
  text: z.string().optional(),
  voice: z.string().optional(),
  model: z.string().optional(),
});

export const extractLastFrameSchema = z.object({
  videoUrl: z.string().url('Invalid video URL'),
});
