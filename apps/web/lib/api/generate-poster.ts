import type { BeltRank } from '@/lib/stores/poster-builder-store';

export interface GeneratePosterRequest {
  athletePhoto: File;
  athleteName: string;
  beltRank: BeltRank;
  team?: string;
  tournament: string;
  date?: string;
  location?: string;
  templateId: string;
}

export interface GeneratePosterResponse {
  posterId: string;
  imageUrl: string;
  createdAt: string;
}

export type ProgressCallback = (progress: number) => void;

async function simulateProgress(
  start: number,
  end: number,
  durationMs: number,
  onProgress?: ProgressCallback
): Promise<void> {
  const steps = 10;
  const stepDuration = durationMs / steps;
  const increment = (end - start) / steps;

  for (let i = 0; i <= steps; i++) {
    const progress = Math.round(start + increment * i);
    onProgress?.(progress);
    if (i < steps) {
      await new Promise((resolve) => setTimeout(resolve, stepDuration));
    }
  }
}

/**
 * Mock poster generation API.
 * Simulates realistic progress: upload (0-30%), processing (30-90%), finalization (90-100%).
 * TODO: Replace with real API call when backend is ready.
 */
export async function generatePoster(
  _request: GeneratePosterRequest,
  onProgress?: ProgressCallback
): Promise<GeneratePosterResponse> {
  // Simulate upload phase (0-30%)
  await simulateProgress(0, 30, 500, onProgress);

  // Simulate processing phase (30-90%)
  await simulateProgress(30, 90, 1500, onProgress);

  // Simulate finalization (90-100%)
  await simulateProgress(90, 100, 300, onProgress);

  return {
    posterId: crypto.randomUUID(),
    imageUrl: '/mock-generated-poster.png',
    createdAt: new Date().toISOString(),
  };
}
