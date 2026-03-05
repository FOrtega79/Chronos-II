import React, { useEffect } from 'react';
import { useGame } from '../context/GameContext'; // Corrected import
import { AppStatus } from '../types';

export const SplashScreen: React.FC = () => {
  // Use a direct internal state or a hack to access setAppStatus if not exposed?
  // Ideally, useGame should expose setAppStatus or a specific transition method.
  // In our GameContext, we only exposed startGame and resetGame. 
  // Let's assume we modify GameContext to handle the initial transition or do it here via a prop or just calling resetGame/startGame properly.
  // Actually, let's just use a local timer that calls a prop passed from App.tsx or similar. 
  // But strictly following the structure, let's fix GameContext logic in App.tsx or expose a method.
  
  // Revised approach: App.tsx handles the render condition, this component just animates.
  // We'll pass an onComplete callback.
  
  return (
    <div className="fixed inset-0 bg-black flex flex-col items-center justify-center z-50 animate-fade-in">
      <div className="text-center">
        <h1 className="text-6xl md:text-8xl font-bold text-transparent bg-clip-text bg-gradient-to-br from-indigo-400 to-purple-600 tracking-widest uppercase animate-pulse">
          Chronos
        </h1>
        <p className="text-gray-400 mt-4 tracking-[0.5em] text-sm uppercase">Infinite Text Engine</p>
      </div>
    </div>
  );
};
