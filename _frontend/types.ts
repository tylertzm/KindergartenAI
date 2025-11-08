export enum AppState {
  STORY_LIBRARY = 'STORY_LIBRARY',
  THEME_SELECTION = 'THEME_SELECTION',
  CHARACTER_CREATION = 'CHARACTER_CREATION',
  CHARACTER_CAPTURE = 'CHARACTER_CAPTURE',
  GENERATING_STORY_ASSETS = 'GENERATING_STORY_ASSETS',
  CAPTURING = 'CAPTURING',
  CREATING_STORYBOARD = 'CREATING_STORYBOARD',
  VIEWING_STORYBOARD = 'VIEWING_STORYBOARD',
}

export type BeatStatus = 'pending' | 'processing' | 'done' | 'error';

export interface StoryStructure {
  actingDirection: string;
  imagePrompt: string;
  storyText: string;
}

export interface ProcessedBeat extends StoryStructure {
  id: number;
  capturedImage: string | null;
  generatedImage: string | null;
  status: BeatStatus;
  openPoseImage?: string | null; // Debug: OpenPose preprocessed image
}

export interface SavedStory {
  id: string;
  theme: string;
  themeTitle?: string; // Optional for backward compatibility
  characterImageBase64: string;
  processedBeats: ProcessedBeat[];
  createdAt: string;
}