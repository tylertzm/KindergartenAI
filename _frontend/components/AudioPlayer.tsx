import React, { useState, useRef, useEffect, useCallback } from 'react';

// Helper function to decode base64 string to Uint8Array
function decode(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

// Helper function to convert raw PCM data into an AudioBuffer
async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  // The raw data is Int16, so we create a view on the buffer
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      // Normalize the Int16 data to Float32 range [-1.0, 1.0]
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}


interface AudioPlayerProps {
  audioBase64: string | null;
  isLoading: boolean;
}

const AudioPlayer: React.FC<AudioPlayerProps> = ({ audioBase64, isLoading }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isReady, setIsReady] = useState(false);

  const audioContextRef = useRef<AudioContext | null>(null);
  const audioBufferRef = useRef<AudioBuffer | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);

  // For pause/resume functionality
  const startTimeRef = useRef(0);
  const startOffsetRef = useRef(0);

  const cleanup = useCallback(() => {
    if (sourceNodeRef.current) {
      sourceNodeRef.current.onended = null;
      try {
        sourceNodeRef.current.stop();
      } catch(e) {
        // Ignore errors from stopping an already stopped source.
      }
      sourceNodeRef.current = null;
    }
  }, []);

  // Effect to decode audio data when the base64 string is available
  useEffect(() => {
    // Reset state when a new audio comes in
    cleanup();
    setIsPlaying(false);
    setIsReady(false);
    startOffsetRef.current = 0;
    audioBufferRef.current = null;

    if (audioBase64) {
      const setupAudio = async () => {
        try {
          if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
          }
          const ctx = audioContextRef.current;
          const decodedBytes = decode(audioBase64);
          const buffer = await decodeAudioData(decodedBytes, ctx, 24000, 1);
          audioBufferRef.current = buffer;
          setIsReady(true);
        } catch (error) {
          console.error("Failed to decode or setup audio:", error);
          setIsReady(false);
        }
      };
      setupAudio();
    }
  }, [audioBase64, cleanup]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
    };
  }, [cleanup]);

  const play = useCallback(() => {
    if (!audioContextRef.current || !audioBufferRef.current || isPlaying) return;

    const ctx = audioContextRef.current;
    
    // Resume context if it's suspended (e.g., due to browser autoplay policies)
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    const source = ctx.createBufferSource();
    source.buffer = audioBufferRef.current;
    source.connect(ctx.destination);
    
    source.onended = () => {
      setIsPlaying(false);
      startOffsetRef.current = 0; // Reset for next play from start
      sourceNodeRef.current = null;
    };

    source.start(0, startOffsetRef.current % audioBufferRef.current.duration);
    
    startTimeRef.current = ctx.currentTime - startOffsetRef.current;
    sourceNodeRef.current = source;
    setIsPlaying(true);
  }, [isPlaying]);

  const pause = useCallback(() => {
    if (!sourceNodeRef.current || !audioContextRef.current || !isPlaying) return;

    const ctx = audioContextRef.current;
    const elapsedTime = ctx.currentTime - startTimeRef.current;
    startOffsetRef.current = elapsedTime;

    // We must clean up the old source node
    cleanup();
    setIsPlaying(false);
  }, [isPlaying, cleanup]);

  const togglePlayPause = () => {
    if (isPlaying) {
      pause();
    } else {
      play();
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
      <button 
        onClick={togglePlayPause} 
        disabled={!isReady}
        className="p-3 bg-white text-black rounded-full hover:bg-gray-300 transition-all focus:outline-none disabled:bg-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed"
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
        {isReady ? "Listen to Your Story" : "Preparing audio..."}
      </span>
    </div>
  );
};

export default AudioPlayer;