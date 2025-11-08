import React, { useState, useEffect } from 'react';
import { ProcessedBeat } from '../types';
import AudioPlayer from './AudioPlayer';

interface VideoGenerationProps {
  beats: ProcessedBeat[];
  onReturnToStoryboard: () => void;
  onReturnToLibrary: () => void;
  themeTitle: string;
  audioDataBase64: string | null;
  isAudioLoading: boolean;
  onRegenerateImage?: (beatId: number) => void;
}

interface VideoResult {
  index: number;
  image_filename: string;
  video_filename?: string;
  video_path?: string;
  video_url?: string;
  success: boolean;
  error?: string;
}

interface SoundResult {
  index: number;
  video_path: string;
  sound_video_paths?: string[];
  success: boolean;
  error?: string;
}

interface GenerationResponse {
  video_results: VideoResult[];
  sound_results?: SoundResult[];
  successful_videos: number;
  total_videos: number;
  successful_sounds?: number;
}

const VideoGeneration: React.FC<VideoGenerationProps> = ({ 
  beats, 
  onReturnToStoryboard, 
  onReturnToLibrary, 
  themeTitle, 
  audioDataBase64, 
  isAudioLoading,
  onRegenerateImage
}) => {
  const [videoResults, setVideoResults] = useState<VideoResult[]>([]);
  const [soundResults, setSoundResults] = useState<SoundResult[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState<'preparing' | 'videos' | 'sounds' | 'complete'>('preparing');
  const [fullscreenVideoIndex, setFullscreenVideoIndex] = useState<number | null>(null);
  const [addSound, setAddSound] = useState(true);
  const [customPrompts, setCustomPrompts] = useState<string[]>([]);
  const [processingVideos, setProcessingVideos] = useState<number[]>([]);
  const [completedVideos, setCompletedVideos] = useState<number[]>([]);
  const [processingSounds, setProcessingSounds] = useState<number[]>([]);
  const [completedSounds, setCompletedSounds] = useState<number[]>([]);

  // Filter beats that have generated images
  const successfulBeats = beats.filter(beat => beat.generatedImage && beat.status === 'done');

  // Initialize custom prompts array
  useEffect(() => {
    setCustomPrompts(new Array(successfulBeats.length).fill(''));
  }, [successfulBeats.length]);

  const handlePromptChange = (index: number, value: string) => {
    setCustomPrompts(prev => {
      const newPrompts = [...prev];
      newPrompts[index] = value;
      return newPrompts;
    });
  };

  const generateVideos = async () => {
    if (successfulBeats.length === 0) return;

    setIsGenerating(true);
    setGenerationProgress(0);
    setCurrentStep('preparing');
    setVideoResults([]);
    setSoundResults([]);
    setProcessingVideos([]);
    setCompletedVideos([]);
    setProcessingSounds([]);
    setCompletedSounds([]);

    try {
      const formData = new FormData();

      // Convert base64 images to files and add to form data
      successfulBeats.forEach((beat, index) => {
        if (beat.generatedImage) {
          // Convert base64 to blob
          const byteCharacters = atob(beat.generatedImage);
          const byteNumbers = new Array(byteCharacters.length);
          for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
          }
          const byteArray = new Uint8Array(byteNumbers);
          const blob = new Blob([byteArray], { type: 'image/jpeg' });
          
          // Create a file from the blob
          const file = new File([blob], `scene_${index + 1}.jpg`, { type: 'image/jpeg' });
          formData.append('files', file);
        }
      });

      // Add custom prompts
      customPrompts.forEach(prompt => {
        formData.append('prompts', prompt.trim() || '');
      });

      // Add sound option
      formData.append('add_sound', addSound.toString());

      // Simulate preparation phase
      setGenerationProgress(10);
      await new Promise(resolve => setTimeout(resolve, 500));

      setCurrentStep('videos');
      setGenerationProgress(20);
      
      // Simulate starting video processing for all videos
      const videoIndices = successfulBeats.map((_, index) => index);
      setProcessingVideos(videoIndices);

      // Call the backend API
      const response = await fetch('http://localhost:8080/api/generate-videos', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const result: GenerationResponse = await response.json();
      
      // Simulate progressive completion of videos
      setProcessingVideos([]);
      setCompletedVideos(videoIndices);
      setVideoResults(result.video_results);
      setGenerationProgress(addSound ? 60 : 100);

      if (addSound && result.sound_results) {
        setCurrentStep('sounds');
        // Simulate progressive sound processing
        setProcessingSounds(videoIndices);
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        setProcessingSounds([]);
        setCompletedSounds(videoIndices);
        setSoundResults(result.sound_results);
        setGenerationProgress(100);
      }

      setCurrentStep('complete');

    } catch (error) {
      console.error('Video generation failed:', error);
      alert(`Video generation failed: ${error.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const regenerateImage = async (beatId: number) => {
    if (!onRegenerateImage) {
      alert('Image regeneration not available. Please regenerate the entire storyboard.');
      return;
    }
    
    // Call the parent component's regeneration function
    onRegenerateImage(beatId);
  };

  const renderVideoGrid = () => {
    // Show sound videos if available, otherwise show original videos
    const videosToShow = soundResults.length > 0 ? soundResults : videoResults;
    
    if (soundResults.length > 0) {
      // Display videos with sound
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {soundResults.map((soundResult, index) => {
            // Find the corresponding video result
            const videoResult = videoResults.find(v => v.index === soundResult.index);
            
            return (
              <div key={index} className="bg-gray-900 border border-gray-700 overflow-hidden">
                <div className="aspect-video bg-black flex items-center justify-center relative">
                  {soundResult.success && soundResult.sound_video_paths && soundResult.sound_video_paths.length > 0 ? (
                    <div className="w-full h-full relative group">
                      <video
                        src={`http://localhost:8080/api/download/${soundResult.sound_video_paths[0].split('/').pop()}`}
                        controls
                        className="w-full h-full object-cover"
                        poster={successfulBeats[soundResult.index]?.generatedImage ? 
                          `data:image/jpeg;base64,${successfulBeats[soundResult.index].generatedImage}` : undefined}
                      />
                      <div className="absolute top-4 left-4 bg-green-600 text-white px-2 py-1 rounded-full text-xs font-bold">
                        🔊 WITH SOUND
                      </div>
                      <button
                        onClick={() => setFullscreenVideoIndex(index)}
                        className="absolute top-4 right-4 bg-black/50 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M3 4a1 1 0 011-1h4a1 1 0 010 2H6.414l2.293 2.293a1 1 0 11-1.414 1.414L5 6.414V8a1 1 0 01-2 0V4zm9 1a1 1 0 010-2h4a1 1 0 011 1v4a1 1 0 01-2 0V6.414l-2.293 2.293a1 1 0 11-1.414-1.414L13.586 5H12zm-9 7a1 1 0 012 0v1.586l2.293-2.293a1 1 0 111.414 1.414L6.414 15H8a1 1 0 010 2H4a1 1 0 01-1-1v-4zm13-1a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 010-2h1.586l-2.293-2.293a1 1 0 111.414-1.414L15 13.586V12a1 1 0 011-1z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                  ) : soundResult.success === false ? (
                    <div className="text-red-500 p-4 text-center">
                      <div className="text-2xl mb-2">❌</div>
                      <div>Sound Generation Failed</div>
                      <div className="text-sm mt-1">{soundResult.error}</div>
                    </div>
                  ) : (
                    <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  )}
                </div>
                
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-white font-bold text-lg">Scene {soundResult.index + 1} 🎵</h3>
                    {videoResult?.success && videoResult.video_url && (
                      <a
                        href={videoResult.video_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-300 text-sm flex items-center gap-1"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                          <path d="M5 5a2 2 0 00-2 2v6a2 2 0 002 2h6a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
                        </svg>
                        View Silent Version
                      </a>
                    )}
                  </div>
                  
                  <p className="text-gray-300 text-sm mb-4">
                    "{successfulBeats[soundResult.index]?.storyText}"
                  </p>

                  {soundResult.success && soundResult.sound_video_paths && (
                    <div className="text-xs text-gray-500">
                      Generated with sound: {soundResult.sound_video_paths[0]?.split('/').pop()}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      );
    } else {
      // Fallback to original videos if no sound videos available
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {videoResults.map((result, index) => (
            <div key={index} className="bg-gray-900 border border-gray-700 overflow-hidden">
              <div className="aspect-video bg-black flex items-center justify-center relative">
                {result.success && result.video_url ? (
                  <div className="w-full h-full relative group">
                    <video
                      src={result.video_url}
                      controls
                      className="w-full h-full object-cover"
                      poster={successfulBeats[result.index]?.generatedImage ? 
                        `data:image/jpeg;base64,${successfulBeats[result.index].generatedImage}` : undefined}
                    />
                    <div className="absolute top-4 left-4 bg-gray-600 text-white px-2 py-1 rounded-full text-xs font-bold">
                      🔇 NO SOUND
                    </div>
                    <button
                      onClick={() => setFullscreenVideoIndex(index)}
                      className="absolute top-4 right-4 bg-black/50 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M3 4a1 1 0 011-1h4a1 1 0 010 2H6.414l2.293 2.293a1 1 0 11-1.414 1.414L5 6.414V8a1 1 0 01-2 0V4zm9 1a1 1 0 010-2h4a1 1 0 011 1v4a1 1 0 01-2 0V6.414l-2.293 2.293a1 1 0 11-1.414-1.414L13.586 5H12zm-9 7a1 1 0 012 0v1.586l2.293-2.293a1 1 0 111.414 1.414L6.414 15H8a1 1 0 010 2H4a1 1 0 01-1-1v-4zm13-1a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 010-2h1.586l-2.293-2.293a1 1 0 111.414-1.414L15 13.586V12a1 1 0 011-1z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                ) : result.success === false ? (
                  <div className="text-red-500 p-4 text-center">
                    <div className="text-2xl mb-2">❌</div>
                    <div>Generation Failed</div>
                    <div className="text-sm mt-1">{result.error}</div>
                  </div>
                ) : (
                  <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                )}
              </div>
              
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-white font-bold text-lg">Scene {result.index + 1}</h3>
                  {result.success && result.video_url && (
                    <a
                      href={result.video_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300 text-sm flex items-center gap-1"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                        <path d="M5 5a2 2 0 00-2 2v6a2 2 0 002 2h6a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
                      </svg>
                      View Original
                    </a>
                  )}
                </div>
                
                <p className="text-gray-300 text-sm mb-4">
                  "{successfulBeats[result.index]?.storyText}"
                </p>

                {result.success && result.video_filename && (
                  <div className="text-xs text-gray-500">
                    Generated: {result.video_filename}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      );
    }
  };

  const renderGenerationInterface = () => {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-gray-900 border border-gray-700 p-8 mb-8">
          <h2 className="text-2xl font-bold text-white mb-6">Generate Videos from Storyboard</h2>
          
          <div className="space-y-6">
            {/* Sound Option */}
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="addSound"
                checked={addSound}
                onChange={(e) => setAddSound(e.target.checked)}
                className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
              />
              <label htmlFor="addSound" className="text-white font-medium">
                Add sound effects to videos
              </label>
            </div>

            {/* Custom Prompts */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Custom Prompts (Optional)</h3>
              <div className="space-y-4">
                {successfulBeats.map((beat, index) => (
                  <div key={beat.id} className="flex gap-4">
                    <div className="w-20 h-14 bg-black rounded overflow-hidden flex-shrink-0">
                      {beat.generatedImage && (
                        <img
                          src={`data:image/jpeg;base64,${beat.generatedImage}`}
                          alt={`Scene ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Scene {index + 1}: "{beat.storyText}"
                      </label>
                      <input
                        type="text"
                        value={customPrompts[index] || ''}
                        onChange={(e) => handlePromptChange(index, e.target.value)}
                        placeholder="Add custom animation prompt (e.g., 'character waves hand')"
                        className="w-full px-3 py-2 bg-gray-800 border border-gray-600 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Generate Button */}
            <div className="flex justify-center pt-4">
              <button
                onClick={generateVideos}
                disabled={isGenerating || successfulBeats.length === 0}
                className={`px-8 py-3 font-bold text-lg rounded-md transition-colors ${
                  isGenerating || successfulBeats.length === 0
                    ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {isGenerating ? 'Generating Videos...' : `Generate ${successfulBeats.length} Videos`}
              </button>
            </div>
          </div>
        </div>

        {/* Progress Indicator */}
        {isGenerating && (
          <div className="bg-gray-900 border border-gray-700 p-6 mb-8">
            <div className="flex justify-between items-center mb-4">
              <span className="text-white font-medium text-lg">
                {currentStep === 'preparing' && '🎬 Preparing images...'}
                {currentStep === 'videos' && '📹 Generating videos...'}
                {currentStep === 'sounds' && '🎵 Adding sound effects...'}
                {currentStep === 'complete' && '✅ Complete!'}
              </span>
              <span className="text-gray-400 text-sm">{generationProgress}%</span>
            </div>
            
            {/* Overall Progress Bar */}
            <div className="w-full bg-gray-700 rounded-full h-3 mb-6">
              <div 
                className="bg-gradient-to-r from-blue-600 to-purple-600 h-3 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${generationProgress}%` }}
              ></div>
            </div>

            {/* Individual Video Progress */}
            {(currentStep === 'videos' || currentStep === 'sounds') && (
              <div className="space-y-3">
                <h4 className="text-white font-medium mb-3">Scene Progress:</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {successfulBeats.map((beat, index) => (
                    <div key={beat.id} className="flex items-center gap-2 p-2 bg-gray-800 rounded">
                      <div className="w-8 h-8 bg-black rounded overflow-hidden flex-shrink-0">
                        {beat.generatedImage && (
                          <img
                            src={`data:image/jpeg;base64,${beat.generatedImage}`}
                            alt={`Scene ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs text-gray-300 truncate">Scene {index + 1}</div>
                        <div className="flex items-center gap-1">
                          {currentStep === 'videos' && (
                            <>
                              {completedVideos.includes(index) ? (
                                <span className="text-green-400 text-xs">✅ Video</span>
                              ) : processingVideos.includes(index) ? (
                                <span className="text-blue-400 text-xs">🎬 Video...</span>
                              ) : (
                                <span className="text-gray-500 text-xs">⏳ Waiting</span>
                              )}
                            </>
                          )}
                          {currentStep === 'sounds' && addSound && (
                            <>
                              {completedSounds.includes(index) ? (
                                <span className="text-green-400 text-xs">✅ Sound</span>
                              ) : processingSounds.includes(index) ? (
                                <span className="text-purple-400 text-xs">🎵 Sound...</span>
                              ) : completedVideos.includes(index) ? (
                                <span className="text-gray-500 text-xs">⏳ Queue</span>
                              ) : (
                                <span className="text-gray-600 text-xs">❌ No video</span>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Stats */}
            <div className="mt-4 flex justify-center gap-6 text-sm">
              {currentStep === 'videos' && (
                <>
                  <span className="text-blue-400">
                    Processing: {processingVideos.length}
                  </span>
                  <span className="text-green-400">
                    Completed: {completedVideos.length}/{successfulBeats.length}
                  </span>
                </>
              )}
              {currentStep === 'sounds' && addSound && (
                <>
                  <span className="text-purple-400">
                    Processing: {processingSounds.length}
                  </span>
                  <span className="text-green-400">
                    Completed: {completedSounds.length}/{completedVideos.length}
                  </span>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderFullscreenVideo = () => {
    if (fullscreenVideoIndex === null) return null;
    
    // Prioritize sound videos if available
    let videoSrc = '';
    let videoFound = false;
    
    if (soundResults.length > 0) {
      const soundResult = soundResults[fullscreenVideoIndex];
      if (soundResult && soundResult.success && soundResult.sound_video_paths && soundResult.sound_video_paths.length > 0) {
        videoSrc = `http://localhost:8080/api/download/${soundResult.sound_video_paths[0].split('/').pop()}`;
        videoFound = true;
      }
    }
    
    // Fallback to original video if no sound video
    if (!videoFound) {
      const result = videoResults[fullscreenVideoIndex];
      if (result && result.success && result.video_url) {
        videoSrc = result.video_url;
        videoFound = true;
      }
    }
    
    if (!videoFound) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
        <div className="relative max-w-4xl max-h-full w-full h-full flex items-center justify-center p-4">
          <button
            onClick={() => setFullscreenVideoIndex(null)}
            className="absolute top-4 right-4 text-white hover:text-gray-300 z-10"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
          <video
            src={videoSrc}
            controls
            autoPlay
            className="max-w-full max-h-full rounded-lg"
          />
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="border-b border-gray-800 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Video Generation</h1>
            <p className="text-gray-400">{themeTitle}</p>
          </div>
          
          {audioDataBase64 && !isAudioLoading && (
            <div className="flex-shrink-0 ml-6">
              <AudioPlayer audioBase64={audioDataBase64} isLoading={isAudioLoading} />
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="px-6 py-8">
        {videoResults.length === 0 ? renderGenerationInterface() : (
          <div className="max-w-6xl mx-auto">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h2 className="text-xl font-bold">Generated Videos</h2>
                {/* Narration Audio Player */}
                {audioDataBase64 && !isAudioLoading && (
                  <div className="mt-4 p-4 bg-gray-800 border border-gray-600 rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-400" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.776l-4.146-3.32a1 1 0 00-.632-.22H2a1 1 0 01-1-1V7.665a1 1 0 011-1h1.605a1 1 0 00.632-.22l4.146-3.32a1 1 0 011.617.776zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 11-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" clipRule="evenodd" />
                        </svg>
                        <span className="text-white font-medium">Story Narration</span>
                      </div>
                      <div className="flex-1">
                        <AudioPlayer audioBase64={audioDataBase64} isLoading={isAudioLoading} />
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <button
                onClick={() => {
                  setVideoResults([]);
                  setSoundResults([]);
                  setGenerationProgress(0);
                  setCurrentStep('preparing');
                  setProcessingVideos([]);
                  setCompletedVideos([]);
                  setProcessingSounds([]);
                  setCompletedSounds([]);
                }}
                className="px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600 transition-colors"
              >
                Generate New Videos
              </button>
            </div>
            {renderVideoGrid()}
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="border-t border-gray-800 px-6 py-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-center items-center gap-4">
          <button 
            onClick={onReturnToStoryboard}
            className="px-8 py-3 bg-transparent border border-gray-700 text-white font-bold text-lg hover:bg-gray-900 transition-colors w-full sm:w-auto"
          >
            ← Back to Storyboard
          </button>
          <button 
            onClick={onReturnToLibrary}
            className="px-8 py-3 bg-gray-700 text-white font-bold text-lg hover:bg-gray-600 transition-colors w-full sm:w-auto"
          >
            Return to Library
          </button>
        </div>
      </div>

      {/* Fullscreen Video Modal */}
      {renderFullscreenVideo()}
    </div>
  );
};

export default VideoGeneration;