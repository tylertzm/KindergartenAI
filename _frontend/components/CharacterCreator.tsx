import React, { useState } from 'react';

interface CharacterCreatorProps {
  onDescriptionSubmitted: (description: string) => void;
  themeTitle: string;
}

const CharacterCreator: React.FC<CharacterCreatorProps> = ({ onDescriptionSubmitted, themeTitle }) => {
  const [description, setDescription] = useState('');
  
  const exampleCharacters = [
    "A curious young boy with messy hair and overalls",
    "A playful girl with pigtails and a colorful dress",
    "A mischievous child with freckles and a striped shirt",
    "A dreamy child with wide eyes and worn-out shoes"
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (description.trim()) {
      onDescriptionSubmitted(description);
    }
  };
  
  const handleExampleClick = (example: string) => {
    setDescription(example);
  };

  return (
    <div className="w-full max-w-lg text-center bg-black p-8 border border-gray-800">
      <h2 className="text-3xl font-bold text-white mb-2">Who Will Act Out Your Story?</h2>
      <p className="text-gray-500 mb-6">Story: <span className="text-white">{themeTitle}</span></p>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="character" className="sr-only">Character Description</label>
          <textarea
            id="character"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g., 'A cheerful boy with bright eyes and a red cap'"
            rows={3}
            className="w-full p-4 bg-gray-900 border border-gray-700 focus:outline-none focus:border-white transition-colors placeholder-gray-600 resize-none"
          />
        </div>
        
        <div className="pt-2">
            <p className="text-sm text-gray-600 mb-3">Need inspiration?</p>
            <div className="flex flex-wrap justify-center gap-2">
                {exampleCharacters.map((example) => (
                    <button
                        key={example}
                        type="button"
                        onClick={() => handleExampleClick(example)}
                        className="px-3 py-1 bg-transparent border border-gray-800 text-gray-400 text-sm hover:bg-gray-900 hover:text-white transition-colors"
                    >
                        {example}
                    </button>
                ))}
            </div>
        </div>
        
        <button 
          type="submit" 
          disabled={!description.trim()}
          className="w-full p-4 bg-white text-black font-bold text-xl hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next: Pose for Character
        </button>
      </form>
    </div>
  );
};

export default CharacterCreator;