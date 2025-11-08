import React from 'react';

interface Beat {
    id: number;
    capturedImage: string | null;
    openPoseImage?: string | null;
    generatedImage: string | null;
    status: string;
    storyText?: string;
}

interface DebugPanelProps {
    characterImage: string | null;
    styleImage: string | null;
    styleParagraph: string;
    beats: Beat[];
    onRetryCharacter?: () => void;
    onRetryStyle?: () => void;
    onRetryBeat?: (beatId: number) => void;
}

const DebugPanel: React.FC<DebugPanelProps> = ({
    characterImage,
    styleImage,
    styleParagraph,
    beats,
    onRetryCharacter,
    onRetryStyle,
    onRetryBeat
}) => {
    // Helper function to ensure image has proper data URL prefix
    const getImageSrc = (base64Data: string | null, defaultFormat: string = 'jpeg'): string => {
        if (!base64Data) return '';
        if (base64Data.startsWith('data:')) {
            return base64Data;
        }
        return `data:image/${defaultFormat};base64,${base64Data}`;
    };

    // Filter beats that have at least one image (captured, openpose, or generated)
    const beatsWithImages = beats.filter(beat => 
        beat.capturedImage || beat.openPoseImage || beat.generatedImage
    );

    return (
        <div className="fixed top-16 right-4 w-80 bg-black/95 border border-yellow-500 p-4 max-h-[80vh] overflow-y-auto z-50">
            <div className="flex items-center gap-2 mb-4 pb-2 border-b border-yellow-500">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-500" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <h3 className="text-yellow-500 font-bold text-sm">DEBUG MODE</h3>
            </div>

            <div className="space-y-4 text-xs">
                {/* Character Image */}
                {characterImage && (
                    <div className="border border-gray-700 p-2">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-gray-400 font-semibold">Character Image</span>
                            {onRetryCharacter && (
                                <button
                                    onClick={onRetryCharacter}
                                    className="px-2 py-1 bg-yellow-600 hover:bg-yellow-700 text-black text-xs font-bold"
                                >
                                    Retry
                                </button>
                            )}
                        </div>
                        <img 
                            src={getImageSrc(characterImage, 'jpeg')} 
                            alt="Character" 
                            className="w-full aspect-video object-cover"
                        />
                    </div>
                )}

                {/* Style Image & Paragraph */}
                {(styleImage || styleParagraph) && (
                    <div className="border border-gray-700 p-2">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-gray-400 font-semibold">Style Guide</span>
                            {onRetryStyle && (
                                <button
                                    onClick={onRetryStyle}
                                    className="px-2 py-1 bg-yellow-600 hover:bg-yellow-700 text-black text-xs font-bold"
                                >
                                    Retry
                                </button>
                            )}
                        </div>
                        {styleImage && (
                            <img 
                                src={getImageSrc(styleImage, 'jpeg')} 
                                alt="Style" 
                                className="w-full aspect-video object-cover mb-2"
                            />
                        )}
                        {styleParagraph && (
                            <div className="text-gray-300 text-xs p-2 bg-gray-900 border border-gray-800 rounded">
                                <div className="text-gray-500 text-[10px] mb-1 font-semibold">STYLE PARAGRAPH (appended to all prompts):</div>
                                {styleParagraph}
                            </div>
                        )}
                    </div>
                )}

                {/* All Beats Debug Info */}
                {beatsWithImages.map((beat) => (
                    <div key={beat.id} className="border border-yellow-600 p-2">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-yellow-500 font-semibold">
                                Beat {beat.id + 1}
                                {beat.status === 'processing' && ' (Processing...)'}
                                {beat.status === 'error' && ' (Error)'}
                            </span>
                            {onRetryBeat && beat.capturedImage && (
                                <button
                                    onClick={() => onRetryBeat(beat.id)}
                                    className="px-2 py-1 bg-yellow-600 hover:bg-yellow-700 text-black text-xs font-bold"
                                >
                                    Retry
                                </button>
                            )}
                        </div>

                        {/* Captured Webcam Image */}
                        {beat.capturedImage && (
                            <div className="mb-2">
                                <span className="text-gray-500 text-xs block mb-1">1. Captured Image</span>
                                <img 
                                    src={getImageSrc(beat.capturedImage, 'jpeg')} 
                                    alt={`Beat ${beat.id + 1} Captured`} 
                                    className="w-full aspect-video object-cover border border-gray-700"
                                />
                            </div>
                        )}

                        {/* OpenPose Image */}
                        {beat.openPoseImage && (
                            <div className="mb-2">
                                <span className="text-gray-500 text-xs block mb-1">2. OpenPose</span>
                                <img 
                                    src={getImageSrc(beat.openPoseImage, 'webp')} 
                                    alt={`Beat ${beat.id + 1} OpenPose`} 
                                    className="w-full aspect-video object-cover border border-gray-700"
                                />
                            </div>
                        )}

                        {/* Final Generated Image */}
                        {beat.generatedImage && (
                            <div>
                                <span className="text-gray-500 text-xs block mb-1">3. Final Image</span>
                                <img 
                                    src={getImageSrc(beat.generatedImage, 'jpeg')} 
                                    alt={`Beat ${beat.id + 1} Generated`} 
                                    className="w-full aspect-video object-cover border border-gray-700"
                                />
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default DebugPanel;

