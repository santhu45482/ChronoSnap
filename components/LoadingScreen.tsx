import React from 'react';

interface LoadingScreenProps {
  message: string;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ message }) => {
  return (
    <div className="flex flex-col items-center justify-center h-96 w-full text-center p-8">
      <div className="relative w-32 h-32 mb-8">
        <div className="absolute inset-0 border-4 border-t-neon-blue border-r-transparent border-b-neon-purple border-l-transparent rounded-full animate-spin"></div>
        <div className="absolute inset-2 border-4 border-r-neon-blue border-b-transparent border-l-neon-purple border-t-transparent rounded-full animate-spin-slow opacity-70"></div>
        <div className="absolute inset-0 flex items-center justify-center text-4xl">
          ⏳
        </div>
      </div>
      <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-neon-blue to-neon-purple animate-pulse">
        {message}
      </h2>
      <p className="text-gray-400 mt-2">Warping space-time continuum...</p>
    </div>
  );
};
