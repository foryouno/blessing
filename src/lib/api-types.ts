export interface GenerateVideoRequest {
  prompt?: string;
  duration?: number;
  ratio?: '16:9' | '9:16' | '1:1' | '4:3';
  firstFrameUrl?: string;
  lastFrameUrl?: string;
  model?: string;
}

export interface GenerateVideoResponse {
  videoUrl: string;
  taskId: string;
  status: string;
}

export interface GenerateImageRequest {
  prompt?: string;
  model?: string;
  image?: string;
  size?: string;
}

export interface GenerateImageResponse {
  imageUrl: string;
  taskId: string;
  status: string;
}

export interface TTSRequest {
  text?: string;
  voice?: string;
  model?: string;
}

export interface TTSResponse {
  audioUrl: string;
  taskId: string;
  status: string;
}

export interface ExtractLastFrameRequest {
  videoUrl: string;
}

export interface ExtractLastFrameResponse {
  frameUrl: string;
  width: number;
  height: number;
}
