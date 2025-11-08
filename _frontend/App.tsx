import React, { useState, useCallback, useEffect } from 'react';
import { AppState, ProcessedBeat, StoryStructure, SavedStory } from './types';
import { generateStoryStructure, generateImageForBeat, generateSpeech, generateStyleImage, generateStyleParagraph, generateCharacterImage } from './services/geminiService';
import ThemeSelector from './components/ThemeSelector';
import CharacterCreator from './components/CharacterCreator';
import CharacterCapture from './components/CharacterCapture';
import CaptureStage from './components/CaptureStage';
import Storyboard from './components/Storyboard';
import LoadingIndicator from './components/LoadingIndicator';
import Header from './components/Header';
import Footer from './components/Footer';
import StoryLibrary from './components/StoryLibrary';
import DebugPanel from './components/DebugPanel';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.STORY_LIBRARY);
  
  // Story Creation State
  const [theme, setTheme] = useState<string>('');
  const [themeTitle, setThemeTitle] = useState<string>('');
  const [numBeats, setNumBeats] = useState<number>(4);
  const [characterDescription, setCharacterDescription] = useState<string>('');
  const [characterPoseImageBase64, setCharacterPoseImageBase64] = useState<string | null>(null);
  const [characterImageBase64, setCharacterImageBase64] = useState<string | null>(null);
  const [styleImageBase64, setStyleImageBase64] = useState<string | null>(null);
  const [styleParagraph, setStyleParagraph] = useState<string>('');
  const [processedBeats, setProcessedBeats] = useState<ProcessedBeat[]>([]);
  
  // UI/Feedback State
  const [error, setError] = useState<string | null>(null);
  const [processingMessage, setProcessingMessage] = useState<string>('');
  const [audioDataBase64, setAudioDataBase64] = useState<string | null>(null);
  const [isAudioLoading, setIsAudioLoading] = useState<boolean>(false);

  // Library State
  const [savedStories, setSavedStories] = useState<SavedStory[]>([]);
  const [currentStory, setCurrentStory] = useState<SavedStory | null>(null);

  // Debug Mode State
  const [debugMode, setDebugMode] = useState<boolean>(false);


  // Load stories from localStorage on initial mount
  useEffect(() => {
    try {
      const storedStories = localStorage.getItem('act-a-stories');
      if (storedStories) {
        setSavedStories(JSON.parse(storedStories));
      }
    } catch (e) {
      console.error("Failed to load stories from localStorage", e);
      setSavedStories([]);
    }
  }, []);

  const resetCreationState = () => {
    setTheme('');
    setThemeTitle('');
    setNumBeats(4);
    setProcessedBeats([]);
    setError(null);
    setProcessingMessage('');
    setStyleImageBase64(null);
    setStyleParagraph('');
    setAudioDataBase64(null);
    setIsAudioLoading(false);
    setCharacterDescription('');
    setCharacterPoseImageBase64(null);
    setCharacterImageBase64(null);
    setCurrentStory(null);
  };

  const handleCreateNew = () => {
    resetCreationState();
    setAppState(AppState.THEME_SELECTION);
  };

  const handleThemeSelected = (selectedTheme: string, selectedThemeTitle: string, selectedNumBeats: number) => {
    setTheme(selectedTheme);
    setThemeTitle(selectedThemeTitle);
    setNumBeats(selectedNumBeats);
    setError(null);
    setAppState(AppState.CHARACTER_CREATION);
  };

  const handleDescriptionSubmitted = (description: string) => {
    setCharacterDescription(description);
    setAppState(AppState.CHARACTER_CAPTURE);
  };

  const handleCharacterCaptured = async (poseImageBase64: string) => {
    setAppState(AppState.GENERATING_STORY_ASSETS);
    setProcessingMessage('Generating story assets...');
    setError(null);
    
    // Store the pose image for potential retries
    setCharacterPoseImageBase64(poseImageBase64);

    try {
      const [charImg, styleImg, stylePara, storyStructures] = await Promise.all([
        generateCharacterImage(characterDescription, poseImageBase64),
        generateStyleImage(theme),
        generateStyleParagraph(theme),
        generateStoryStructure(theme, numBeats, characterDescription)
      ]);

      setCharacterImageBase64(charImg);
      setStyleImageBase64(styleImg);
      setStyleParagraph(stylePara);
      
      setProcessedBeats(storyStructures.map((structure: StoryStructure, index: number) => ({
        id: index,
        actingDirection: structure.actingDirection,
        imagePrompt: structure.imagePrompt,
        storyText: structure.storyText,
        capturedImage: null,
        generatedImage: null,
        status: 'pending'
      })));

      setAppState(AppState.CAPTURING);

    } catch (err) {
      console.error(err);
      setError('An error occurred during story generation. Please check your API key and try again.');
      setAppState(AppState.STORY_LIBRARY);
    }
  };


  const handleCapture = useCallback((beatId: number, imageBase64: string) => {
    const beatToProcess = processedBeats.find(b => b.id === beatId);
    if (!beatToProcess || !styleImageBase64 || !characterImageBase64) return;

    setProcessedBeats(prev => prev.map(beat => 
      beat.id === beatId ? { ...beat, capturedImage: imageBase64, status: 'processing' } : beat
    ));

    generateImageForBeat(beatToProcess.imagePrompt, imageBase64, styleImageBase64, characterImageBase64, debugMode, styleParagraph)
      .then(result => {
        if (debugMode && typeof result === 'object' && 'openPoseImage' in result) {
          // Debug mode: result contains both openPose and final image
          setProcessedBeats(prev => prev.map(beat => 
            beat.id === beatId ? { 
              ...beat, 
              openPoseImage: result.openPoseImage,
              generatedImage: result.finalImage, 
              status: 'done' 
            } : beat
          ));
        } else {
          // Normal mode: result is just the final image
          setProcessedBeats(prev => prev.map(beat => 
            beat.id === beatId ? { ...beat, generatedImage: result as string, status: 'done' } : beat
          ));
        }
      })
      .catch(err => {
        console.error(err);
        setProcessedBeats(prev => prev.map(beat => 
          beat.id === beatId ? { ...beat, generatedImage: null, status: 'error' } : beat
        ));
      });
  }, [processedBeats, styleImageBase64, characterImageBase64, debugMode]);

  const handleCaptureComplete = () => {
    setAppState(AppState.CREATING_STORYBOARD);
    setProcessingMessage('Rendering your storyboard...');
  };

  const handleReturnToLibrary = () => {
    resetCreationState();
    setAppState(AppState.STORY_LIBRARY);
  };

  const handleViewStory = (storyId: string) => {
    const storyToView = savedStories.find(s => s.id === storyId);
    if (storyToView) {
      setCurrentStory(storyToView);
      setTheme(storyToView.theme);
      setThemeTitle(storyToView.themeTitle || storyToView.theme.substring(0, 50));
      setCharacterImageBase64(storyToView.characterImageBase64);
      setProcessedBeats(storyToView.processedBeats);
      // We will fetch audio again when viewing
      setAudioDataBase64(null);
      setIsAudioLoading(false);
      setAppState(AppState.VIEWING_STORYBOARD);
    }
  };
  
  const handleDeleteStory = (storyId: string) => {
    const updatedStories = savedStories.filter(s => s.id !== storyId);
    setSavedStories(updatedStories);
    try {
      localStorage.setItem('act-a-stories', JSON.stringify(updatedStories));
    } catch (e) {
      console.error("Failed to save stories to localStorage after delete", e);
    }
  };

  // Debug Mode Retry Handlers
  const handleRetryCharacter = async () => {
    if (!characterDescription || !characterPoseImageBase64) return;
    try {
      setProcessingMessage('Regenerating character image...');
      const charImg = await generateCharacterImage(characterDescription, characterPoseImageBase64);
      setCharacterImageBase64(charImg);
      setProcessingMessage('');
    } catch (err) {
      console.error("Failed to retry character generation", err);
      setProcessingMessage('');
    }
  };

  const handleRetryStyle = async () => {
    if (!theme) return;
    try {
      setProcessingMessage('Regenerating style...');
      const [styleImg, stylePara] = await Promise.all([
        generateStyleImage(theme),
        generateStyleParagraph(theme)
      ]);
      setStyleImageBase64(styleImg);
      setStyleParagraph(stylePara);
      setProcessingMessage('');
    } catch (err) {
      console.error("Failed to retry style generation", err);
      setProcessingMessage('');
    }
  };

  const handleRetryBeat = async (beatId: number) => {
    const beatToRetry = processedBeats.find(b => b.id === beatId);
    if (!beatToRetry || !beatToRetry.capturedImage || !styleImageBase64 || !characterImageBase64) return;
    
    handleCapture(beatToRetry.id, beatToRetry.capturedImage);
  };

  // Effect to wait for processing to finish
  useEffect(() => {
    if (appState === AppState.CREATING_STORYBOARD) {
      const allDone = processedBeats.every(beat => beat.status === 'done' || beat.status === 'error');
      if (allDone) {
        setAppState(AppState.VIEWING_STORYBOARD);
      }
    }
  }, [processedBeats, appState]);

  // Effect to generate audio and save new story
  useEffect(() => {
    if (appState === AppState.VIEWING_STORYBOARD && !currentStory) { // Only save if it's a NEW story
      const fullStory = processedBeats
        .filter(b => b.status === 'done' && b.generatedImage)
        .map(b => b.storyText)
        .join(' ');
      
      if (fullStory && characterImageBase64) {
        // Save the new story to localStorage
        const newStory: SavedStory = {
          id: `story-${Date.now()}`,
          theme,
          themeTitle,
          characterImageBase64,
          processedBeats,
          createdAt: new Date().toISOString(),
        };
        const updatedStories = [newStory, ...savedStories];
        setSavedStories(updatedStories);
        try {
          localStorage.setItem('act-a-stories', JSON.stringify(updatedStories));
        } catch(e) {
          console.error("Failed to save new story to localStorage", e);
        }
        setCurrentStory(newStory); // Set as current to prevent re-saving
      }
    }

    // Generate audio for any viewed storyboard (new or loaded)
    if (appState === AppState.VIEWING_STORYBOARD && !audioDataBase64 && !isAudioLoading) {
       const fullStory = processedBeats
        .filter(b => b.status === 'done')
        .map(b => b.storyText)
        .join(' ');
      
      if (fullStory) {
        setIsAudioLoading(true);
        generateSpeech(fullStory)
          .then(audioData => setAudioDataBase64(audioData))
          .catch(err => console.error("Failed to generate speech", err))
          .finally(() => setIsAudioLoading(false));
      }
    }
  }, [appState, processedBeats, audioDataBase64, isAudioLoading, characterImageBase64, theme, savedStories, currentStory]);


  const renderContent = () => {
    switch (appState) {
      case AppState.STORY_LIBRARY:
        return <StoryLibrary 
          stories={savedStories}
          onViewStory={handleViewStory}
          onDeleteStory={handleDeleteStory}
          onCreateNew={handleCreateNew}
        />;
      case AppState.THEME_SELECTION:
        return <ThemeSelector onThemeSelected={handleThemeSelected} error={error} />;
      case AppState.CHARACTER_CREATION:
        return <CharacterCreator onDescriptionSubmitted={handleDescriptionSubmitted} themeTitle={themeTitle} />;
      case AppState.CHARACTER_CAPTURE:
        return <CharacterCapture onCapture={handleCharacterCaptured} />;
      case AppState.GENERATING_STORY_ASSETS:
      case AppState.CREATING_STORYBOARD:
        return <LoadingIndicator message={processingMessage} />;
      case AppState.CAPTURING:
        return <CaptureStage
          beats={processedBeats}
          onCapture={handleCapture}
          onComplete={handleCaptureComplete}
          characterImageBase64={characterImageBase64}
        />;
      case AppState.VIEWING_STORYBOARD:
        return <Storyboard 
                  beats={processedBeats} 
                  onReturnToLibrary={handleReturnToLibrary} 
                  themeTitle={themeTitle}
                  audioDataBase64={audioDataBase64}
                  isAudioLoading={isAudioLoading}
                />;
      default:
        return <div>Something went wrong.</div>;
    }
  };

  const appStyle =
    appState === AppState.CAPTURING && styleImageBase64
      ? {
          backgroundImage: `url('data:image/jpeg;base64,${styleImageBase64}')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed',
        }
      : {};

  return (
    <div style={appStyle} className="min-h-screen bg-black text-gray-100 flex flex-col transition-all duration-500">
       <div className={`min-h-screen flex flex-col transition-colors duration-500 ${appState === AppState.CAPTURING && styleImageBase64 ? 'bg-black/30' : ''}`}>
        <Header />
        
        {/* Debug Mode Checkbox */}
        <div className="fixed top-4 left-4 z-50 bg-black/90 border border-gray-700 p-3 rounded">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={debugMode}
              onChange={(e) => setDebugMode(e.target.checked)}
              className="w-4 h-4 cursor-pointer"
            />
            <span className="text-sm text-gray-300 font-semibold">Debug Mode</span>
          </label>
        </div>

        {/* Debug Panel */}
        {debugMode && (
          <DebugPanel
            characterImage={characterImageBase64}
            styleImage={styleImageBase64}
            styleParagraph={styleParagraph}
            beats={processedBeats}
            onRetryCharacter={characterImageBase64 ? handleRetryCharacter : undefined}
            onRetryStyle={styleImageBase64 ? handleRetryStyle : undefined}
            onRetryBeat={handleRetryBeat}
          />
        )}

        <main className="flex-grow container mx-auto p-4 md:p-8 flex flex-col items-center justify-center">
          {renderContent()}
        </main>
        <Footer />
       </div>
    </div>
  );
};

export default App;