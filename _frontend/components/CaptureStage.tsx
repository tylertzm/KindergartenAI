import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ProcessedBeat } from '../types';

interface CaptureStageProps {
  beats: ProcessedBeat[];
  onCapture: (beatId: number, imageBase64: string) => void;
  onComplete: () => void;
  characterImageBase64: string | null;
}

const CaptureStage: React.FC<CaptureStageProps> = ({ beats, onCapture, onComplete, characterImageBase64 }) => {
  const [currentBeatIndex, setCurrentBeatIndex] = useState(0);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const countdownTimerRef = useRef<NodeJS.Timeout | null>(null);

  const setupCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      setCameraError("Could not access camera. Please grant permission and refresh.");
    }
  }, []);

  useEffect(() => {
    setupCamera();

    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current);
      }
    };
  }, [setupCamera]);

  useEffect(() => {
    if (countdown !== null && countdown > 0) {
      countdownTimerRef.current = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
    } else if (countdown === 0) {
      captureImage();
      setCountdown(null);
    }

    return () => {
      if (countdownTimerRef.current) {
        clearTimeout(countdownTimerRef.current);
      }
    };
  }, [countdown]);
  
  const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      if (context) {
        // Flip the context horizontally to match the mirrored video feed
        context.translate(video.videoWidth, 0);
        context.scale(-1, 1);
        context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
        // Reset the transformation
        context.setTransform(1, 0, 0, 1, 0, 0);

        const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
        const base64Data = dataUrl.split(',')[1];
        onCapture(beats[currentBeatIndex].id, base64Data);

        if (currentBeatIndex < beats.length - 1) {
          setCurrentBeatIndex(currentBeatIndex + 1);
        } else {
          onComplete();
        }
      }
    }
  };

  const handleCapture = () => {
    setCountdown(3); // Start 3-second countdown
  };

  const currentBeat = beats[currentBeatIndex];
  const isLastBeat = currentBeatIndex === beats.length - 1;

  if (cameraError) {
    return <div className="text-center text-red-400 p-8 bg-red-900/50 border border-red-500">{cameraError}</div>;
  }
  
  return (
    <div className="w-full max-w-4xl flex flex-col items-center">
      <div className="w-full bg-black/80 backdrop-blur-sm p-6 border-b border-gray-800">
        <div className="text-center">
            <span className="text-gray-400 font-semibold tracking-wider">BEAT {currentBeatIndex + 1} / {beats.length}</span>
            <p className="text-xl md:text-2xl mt-2 text-white">"{currentBeat.actingDirection}"</p>
        </div>
      </div>

      <div className="w-full relative aspect-video bg-black overflow-hidden border border-gray-800">
        <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover transform -scale-x-100"></video>
        {countdown !== null && countdown > 0 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/80 px-6 py-3 rounded-lg border-2 border-white">
            <div className="text-white text-5xl font-bold">
              {countdown}
            </div>
          </div>
        )}
      </div>

      <canvas ref={canvasRef} className="hidden"></canvas>
      
      <button 
        onClick={handleCapture}
        disabled={countdown !== null}
        className="mt-8 px-12 py-4 bg-white text-black font-bold text-2xl hover:bg-gray-300 transition-colors flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor">
          <path d="M2 6a2 2 0 012-2h1.586a1 1 0 00.707-.293l1.414-1.414A1 1 0 018.414 2h3.172a1 1 0 01.707.293l1.414 1.414a1 1 0 00.707.293H16a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
          <path d="M10 14a4 4 0 100-8 4 4 0 000 8z" />
        </svg>
        {isLastBeat ? 'Finish & Create' : 'Capture'}
      </button>

      <div className="w-full max-w-3xl mt-8 flex items-start gap-4">
        {characterImageBase64 && (
          <div className="flex-shrink-0 w-24">
            <p className="text-xs text-center text-gray-500 mb-1">Your Character</p>
            <img 
              src={`data:image/jpeg;base64,${characterImageBase64}`} 
              alt="Character Reference" 
              className="w-full aspect-[9/16] object-cover border-2 border-gray-700" 
            />
          </div>
        )}
        <div className="flex-grow">
          <p className="text-xs text-center text-gray-500 mb-1">Story Progress</p>
          <div className="flex justify-center gap-2 md:gap-4">
            {beats.map((beat) => (
              <div 
                key={beat.id} 
                className={`flex-1 aspect-square bg-black/50 flex flex-col items-center justify-center text-white relative overflow-hidden border-2 transition-all
                  ${beat.id === currentBeat.id ? 'border-white' : 'border-gray-800'}`}
              >
                {beat.status === 'done' && beat.generatedImage && (
                  <img src={`data:image/jpeg;base64,${beat.generatedImage}`} alt={`Beat ${beat.id + 1}`} className="w-full h-full object-cover" />
                )}
                {beat.status === 'processing' && (
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                )}
                {beat.status === 'error' && (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                )}
                {beat.status === 'pending' && (
                  <span className="text-4xl font-bold text-gray-700">{beat.id + 1}</span>
                )}

                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                <span className="absolute bottom-1 left-2 text-xs font-semibold text-gray-400">Beat {beat.id + 1}</span>

              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CaptureStage;