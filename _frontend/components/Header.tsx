import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="w-full p-4 border-b border-gray-900">
      <div className="container mx-auto flex items-center justify-center">
        <h1 className="text-2xl md:text-3xl font-bold text-center text-white tracking-wider">
          🎬 ACT-A-STORY
        </h1>
      </div>
    </header>
  );
};

export default Header;