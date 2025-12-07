export interface Era {
  id: string;
  name: string;
  description: string;
  promptModifier: string; // The core instruction for the style/setting
  icon: string;
  previewImage: string; // URL for the preview image
}

export type AppState = 'capture' | 'analyze' | 'select-era' | 'processing' | 'result';

export interface AnalysisResult {
  description: string;
  suggestedEras: {
    name: string;
    reason: string;
  }[];
}