import React from 'react';

interface LoaderProps {
  message?: string;
  progress?: number;
}

const Loader: React.FC<LoaderProps> = ({ message, progress = 0 }) => {
  // Keyframes CSS for the block animation, injected directly for component-specific styling.
  const keyframes = `
    @keyframes loader {
      0% {
        transform: scale(1);
        box-shadow: 0 0 40px rgb(53, 143, 246);
      }
      13% {
        transform: scale(1, 4);
        box-shadow: 0 0 60px rgb(53, 143, 246);
      }
      26% {
        transform: scale(1);
        box-shadow: 0 0 40px rgb(53, 143, 246);
      }
    }
  `;

  return (
    <div className="flex flex-col items-center justify-center p-20 text-center">
      <style>{keyframes}</style>
      
      {/* Loader Animation Container */}
      <div className="relative flex items-center justify-center w-20 h-20">
        <div className="flex items-center justify-center">
          {Array.from({ length: 24 }).map((_, i) => (
            <div
              key={i}
              className="inline-block w-[8px] h-[10px] m-[2px] bg-blue-500 shadow-[0_0_30px_rgb(53,143,246)]"
              style={{
                animation: `loader 5s infinite`,
                animationDelay: `${(i + 1) * 0.2}s`,
              }}
            ></div>
          ))}
        </div>
      </div>
      
      {/* Percentage Display below the loader */}
      <div className="mt-6">
        <span className="text-3xl font-bold text-blue-600 transition-all duration-500">
          {Math.round(progress)}%
        </span>
      </div>

      <h2 className="mt-6 text-xl font-semibold text-slate-700">{message || "Génération en cours..."}</h2>
      <p className="mt-2 text-slate-500">L'IA analyse vos données et rédige votre guide. Cela peut prendre un moment.</p>
    </div>
  );
};

export default Loader;