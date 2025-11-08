import React, { useState, useRef, useEffect } from 'react';

interface AudioPlayerProps {
  audioBase64: string | null;
  isLoading: boolean;
}

const AudioPlayer: React.FC<AudioPlayerProps> = ({ audioBase64, isLoading }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (audioBase64 && audioRef.current) {
      // Convert base64 to blob and create object URL
      try {
        const audioBlob = new Blob(
          [Uint8Array.from(atob(audioBase64), c => c.charCodeAt(0))],
          { type: 'audio/mpeg' } // Gemini TTS returns MP3
        );
        const audioUrl = URL.createObjectURL(audioBlob);
        audioRef.current.src = audioUrl;

        // Cleanup previous URL
        return () => {
          URL.revokeObjectURL(audioUrl);
        };
      } catch (error) {
        console.error('Failed to create audio blob:', error);
      }
    }
  }, [audioBase64]);

  const togglePlayPause = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center bg-black p-4 border border-gray-800">
        <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin mr-3"></div>
        <span className="text-gray-400">Generating Narration...</span>
      </div>
    );
  }

  if (!audioBase64) {
    return null;
  }

  return (
    <div className="flex items-center justify-center bg-black p-3 border border-gray-800">
      <audio
        ref={audioRef}
        onEnded={() => setIsPlaying(false)}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        preload="metadata"
      />
      <button
        onClick={togglePlayPause}
        className="p-3 bg-white text-black rounded-full hover:bg-gray-300 transition-all focus:outline-none"
        aria-label={isPlaying ? "Pause narration" : "Play narration"}
      >
        {isPlaying ? (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )}
      </button>
      <span className="ml-4 text-gray-400 font-semibold">
        Listen to Your Story
      </span>
    </div>
  );
};

export default AudioPlayer;