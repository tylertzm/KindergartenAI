import React from 'react';
import { SavedStory } from '../types';

interface StoryLibraryProps {
  stories: SavedStory[];
  onViewStory: (storyId: string) => void;
  onDeleteStory: (storyId: string) => void;
  onCreateNew: () => void;
}

const StoryLibrary: React.FC<StoryLibraryProps> = ({ stories, onViewStory, onDeleteStory, onCreateNew }) => {
  const handleDelete = (e: React.MouseEvent, storyId: string, themeTitle: string) => {
    e.stopPropagation(); // Prevent triggering onViewStory
    if (window.confirm(`Are you sure you want to delete the story "${themeTitle}"? This cannot be undone.`)) {
      onDeleteStory(storyId);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
        <h1 className="text-3xl font-bold text-white text-center sm:text-left">My Stories</h1>
        <button
          onClick={onCreateNew}
          className="w-full sm:w-auto px-6 py-3 bg-white text-black font-bold text-lg hover:bg-gray-300 transition-colors"
        >
          + Create New Story
        </button>
      </div>

      {stories.length === 0 ? (
        <div className="text-center bg-black p-12 border border-gray-800">
          <h2 className="text-2xl font-semibold text-white">Welcome to Act-a-Story!</h2>
          <p className="text-gray-500 mt-2">You haven't created any stories yet. Click the button above to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {stories.map((story) => (
            <div
              key={story.id}
              onClick={() => onViewStory(story.id)}
              className="group relative bg-black border border-gray-800 cursor-pointer aspect-[9/13] overflow-hidden"
            >
              <img
                src={`data:image/jpeg;base64,${story.characterImageBase64}`}
                alt={story.themeTitle || story.theme}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-transparent"></div>
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <h3 className="font-bold text-white truncate">{story.themeTitle || story.theme}</h3>
                <p className="text-xs text-gray-500">{new Date(story.createdAt).toLocaleDateString()}</p>
              </div>
              <button
                onClick={(e) => handleDelete(e, story.id, story.themeTitle || story.theme)}
                className="absolute top-2 right-2 w-8 h-8 flex items-center justify-center bg-black/50 text-gray-400 hover:bg-white hover:text-black transition-colors opacity-0 group-hover:opacity-100"
                aria-label="Delete story"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default StoryLibrary;
