import React from 'react';

interface LoaderProps {
  message?: string;
  progress?: number;
}

const Loader: React.FC<LoaderProps> = ({ message, progress = 0 }) => {
  return (
    <div className="flex flex-col items-center justify-center p-20 text-center">
      {/* Simple Tailwind Spinner */}
      <div className="relative w-24 h-24">
        {/* Background circle */}
        <div className="absolute inset-0 border-4 border-blue-200 rounded-full"></div>
        {/* Spinning arc */}
        <div 
          className="absolute inset-0 border-4 border-t-blue-600 rounded-full animate-spin"
          style={{ animationDuration: '1.5s' }}
        ></div>
        {/* Percentage Display in the center */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-3xl font-bold text-blue-600 transition-all duration-500">
            {Math.round(progress)}%
          </span>
        </div>
      </div>
      
      <h2 className="mt-8 text-xl font-semibold text-slate-700">{message || "Génération en cours..."}</h2>
      <p className="mt-2 text-slate-500">L'IA analyse vos données et rédige votre guide. Cela peut prendre un moment.</p>
    </div>
  );
};

export default Loader;