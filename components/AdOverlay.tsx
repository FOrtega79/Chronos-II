import React, { useEffect, useState } from 'react';

export const AdOverlay: React.FC = () => {
  const [timeLeft, setTimeLeft] = useState(5);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center">
      <div className="w-full max-w-md bg-white text-black p-6 rounded-lg shadow-xl text-center">
        <h2 className="text-xl font-bold mb-4">Advertisement</h2>
        <div className="w-full h-48 bg-gray-200 mb-4 flex items-center justify-center text-gray-400 rounded">
          [Video Placeholder]
        </div>
        <p className="mb-4">Reward granting in {timeLeft} seconds...</p>
        <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
          <div 
            className="h-full bg-blue-600 transition-all duration-1000 ease-linear"
            style={{ width: `${((5 - timeLeft) / 5) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
};
