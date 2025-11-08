import React, { useState, useEffect, useCallback } from 'react';
import { ProcessedBeat } from '../types';
import AudioPlayer from './AudioPlayer';

interface StoryboardProps {
  beats: ProcessedBeat[];
  onReturnToLibrary: () => void;
  themeTitle: string;
  audioDataBase64: string | null;
  isAudioLoading: boolean;
}

const Storyboard: React.FC<StoryboardProps> = ({ beats, onReturnToLibrary, themeTitle, audioDataBase64, isAudioLoading }) => {
  const [fullscreenIndex, setFullscreenIndex] = useState<number | null>(null);
  const [showShareMessage, setShowShareMessage] = useState(false);

  const handleShareClick = () => {
    setShowShareMessage(true);
    setTimeout(() => {
      setShowShareMessage(false);
    }, 3000);
  };

  const handleDownloadData = () => {
    // Prepare all data for download
    const exportData = {
      theme: themeTitle,
      timestamp: new Date().toISOString(),
      beats: beats.map((beat, index) => ({
        id: beat.id,
        actingDirection: beat.actingDirection,
        imagePrompt: beat.imagePrompt,
        storyText: beat.storyText,
        status: beat.status,
        hasImage: !!beat.generatedImage,
        hasCapturedImage: !!beat.capturedImage,
        hasOpenPoseImage: !!beat.openPoseImage,
      })),
      hasAudio: !!audioDataBase64,
    };

    // Download JSON data
    const jsonBlob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const jsonUrl = URL.createObjectURL(jsonBlob);
    const jsonLink = document.createElement('a');
    jsonLink.href = jsonUrl;
    jsonLink.download = `story-${themeTitle.replace(/\s+/g, '-')}-data.json`;
    jsonLink.click();
    URL.revokeObjectURL(jsonUrl);

    // Download all images
    beats.forEach((beat, index) => {
      if (beat.generatedImage) {
        const imageBlob = fetch(`data:image/jpeg;base64,${beat.generatedImage}`)
          .then(res => res.blob())
          .then(blob => {
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `story-${themeTitle.replace(/\s+/g, '-')}-beat-${index + 1}-generated.jpg`;
            link.click();
            URL.revokeObjectURL(url);
          });
      }

      if (beat.capturedImage) {
        const imageBlob = fetch(`data:image/jpeg;base64,${beat.capturedImage}`)
          .then(res => res.blob())
          .then(blob => {
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `story-${themeTitle.replace(/\s+/g, '-')}-beat-${index + 1}-captured.jpg`;
            link.click();
            URL.revokeObjectURL(url);
          });
      }

      if (beat.openPoseImage) {
        const imageBlob = fetch(`data:image/jpeg;base64,${beat.openPoseImage}`)
          .then(res => res.blob())
          .then(blob => {
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `story-${themeTitle.replace(/\s+/g, '-')}-beat-${index + 1}-openpose.jpg`;
            link.click();
            URL.revokeObjectURL(url);
          });
      }
    });

    // Download audio if available
    if (audioDataBase64) {
      fetch(`data:audio/mpeg;base64,${audioDataBase64}`)
        .then(res => res.blob())
        .then(blob => {
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `story-${themeTitle.replace(/\s+/g, '-')}-audio.mp3`;
          link.click();
          URL.revokeObjectURL(url);
        });
    }

    console.log('=== STORYBOARD EXPORT DEBUG ===');
    console.log('Exported data:', exportData);
  };

  const successfulBeats = beats.filter(b => b.status === 'done' && b.generatedImage);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (fullscreenIndex === null) return;

    if (e.key === 'ArrowRight') {
      setFullscreenIndex((prevIndex) => (prevIndex! + 1) % successfulBeats.length);
    } else if (e.key === 'ArrowLeft') {
      setFullscreenIndex((prevIndex) => (prevIndex! - 1 + successfulBeats.length) % successfulBeats.length);
    } else if (e.key === 'Escape') {
      setFullscreenIndex(null);
    }
  }, [fullscreenIndex, successfulBeats.length]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);
  
  const changeFullscreenImage = (direction: 'next' | 'prev') => {
    if (fullscreenIndex === null) return;
    if (direction === 'next') {
        setFullscreenIndex((prevIndex) => (prevIndex! + 1) % successfulBeats.length);
    } else {
        setFullscreenIndex((prevIndex) => (prevIndex! - 1 + successfulBeats.length) % successfulBeats.length);
    }
  }


  return (
    <div className="w-full max-w-7xl mx-auto">
      {fullscreenIndex !== null && (
        <div 
          className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in"
          onClick={() => setFullscreenIndex(null)}
        >
          <style>{`.animate-fade-in { animation: fadeIn 0.3s ease; } @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }`}</style>
          
          {/* Previous Button */}
          <button 
            className="absolute left-4 top-1/2 -translate-y-1/2 z-10 p-3 bg-white/10 text-white hover:bg-white/20 transition-colors"
            onClick={(e) => { e.stopPropagation(); changeFullscreenImage('prev'); }}
            aria-label="Previous image"
            >
             <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>
          
          <img 
            src={`data:image/jpeg;base64,${successfulBeats[fullscreenIndex].generatedImage}`} 
            className="max-w-[90vw] max-h-[90vh] object-contain border border-gray-800" 
            alt="Fullscreen view" 
            onClick={(e) => e.stopPropagation()}
          />

           {/* Next Button */}
          <button 
            className="absolute right-4 top-1/2 -translate-y-1/2 z-10 p-3 bg-white/10 text-white hover:bg-white/20 transition-colors"
            onClick={(e) => { e.stopPropagation(); changeFullscreenImage('next'); }}
            aria-label="Next image"
            >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </button>

          {/* Close Button */}
           <button 
            className="absolute top-4 right-4 z-10 p-3 bg-white/10 text-white hover:bg-white/20 transition-colors"
            onClick={() => setFullscreenIndex(null)}
            aria-label="Close fullscreen view"
            >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
      )}

      <div className="text-center mb-8">
        <h2 className="text-4xl font-bold text-white">Your Storyboard</h2>
        <p className="text-xl text-gray-500 mt-2">Theme: {themeTitle}</p>
      </div>
      
      <div className="w-full max-w-sm mx-auto mb-8">
        <AudioPlayer audioBase64={audioDataBase64} isLoading={isAudioLoading} />
      </div>
      
      <div className={`grid grid-cols-1 md:grid-cols-2 gap-px bg-gray-800 border border-gray-800`}>
        {beats.map((beat, index) => (
          <div 
            key={beat.id} 
            className="group relative bg-black aspect-video flex items-center justify-center overflow-hidden cursor-pointer"
            onClick={() => {
                const successIndex = successfulBeats.findIndex(b => b.id === beat.id);
                if (successIndex !== -1) setFullscreenIndex(successIndex);
            }}
          >
            {beat.status === 'processing' && <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
            {beat.status === 'error' && <div className="text-red-500 p-4">Image failed</div>}
            {beat.generatedImage && (
              <>
                <img 
                  src={`data:image/jpeg;base64,${beat.generatedImage}`} 
                  alt={`Scene ${index + 1}`} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-6">
                  <p className="text-white text-center text-lg drop-shadow-lg translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                    "{beat.storyText}"
                  </p>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
      
      <div className="text-center mt-12 flex flex-col sm:flex-row justify-center items-center gap-4">
        <button 
          onClick={onReturnToLibrary}
          className="px-8 py-3 bg-transparent border border-gray-700 text-white font-bold text-lg hover:bg-gray-900 transition-colors w-full sm:w-auto"
        >
          Return to Library
        </button>
        <button
          onClick={handleDownloadData}
          className="px-8 py-3 bg-white text-black font-bold text-lg hover:bg-gray-300 transition-colors flex items-center justify-center gap-2 w-full sm:w-auto"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
          Download All Data
        </button>
        <div className="relative w-full sm:w-auto">
          <button
            onClick={handleShareClick}
            className="w-full px-8 py-3 bg-gray-900 text-gray-600 font-bold text-lg cursor-not-allowed flex items-center justify-center gap-2 border border-gray-800"
          >
            Share Story
            <span className="text-xs font-bold bg-gray-800 text-gray-500 px-2 py-0.5">SOON</span>
          </button>
          {showShareMessage && (
            <div className="absolute bottom-full mb-2 w-max left-1/2 -translate-x-1/2 bg-gray-800 text-white text-sm px-3 py-1 border border-gray-700 animate-fade-in">
              Share feature is coming soon!
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Storyboard;