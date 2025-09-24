import React, { useState, useRef, useEffect } from 'react';
import { AppStep, UserBusinessInfo, LocalGuide } from './types';
import UserInputForm from './components/UserInputForm';
import GuideDisplay from './components/GuideDisplay';
import Header from './components/Header';
import Loader from './components/Loader';
import { generateLocalGuide } from './services/geminiService';

const App: React.FC = () => {
  const [step, setStep] = useState<AppStep>(AppStep.USER_INFO);
  const [generatedGuide, setGeneratedGuide] = useState<LocalGuide | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingMessage, setLoadingMessage] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const progressIntervalRef = useRef<number | null>(null);

  const clearProgressInterval = () => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
  };

  useEffect(() => {
    // Cleanup interval on component unmount
    return () => {
      clearProgressInterval();
    };
  }, []);

  const handleUserInfoSubmit = async (info: UserBusinessInfo) => {
    setIsLoading(true);
    setError(null);
    setGeneratedGuide(null);
    setLoadingMessage("L'IA analyse votre demande...");
    setProgress(0);
    clearProgressInterval();

    // Start a smooth, continuous progress simulation from 0 to 99
    const estimatedDuration = Math.max(20, info.linkCount * 1.8) * 1000; // 1.8s per link, min 20s
    const totalSteps = 99;
    const stepInterval = estimatedDuration / totalSteps;

    progressIntervalRef.current = window.setInterval(() => {
      setProgress(prev => {
        const next = prev + 1;
        if (next >= totalSteps) {
          clearProgressInterval();
          return totalSteps;
        }
        return next;
      });
    }, stepInterval);
    
    setLoadingMessage("Génération des partenaires par l'IA...");


    try {
      const guide = await generateLocalGuide(info);

      // On success, ensure interval is cleared and jump to 100%
      clearProgressInterval();
      setProgress(100);
      setLoadingMessage("Guide généré avec succès !");
      setGeneratedGuide(guide);
      setStep(AppStep.DISPLAY_GUIDE);

    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Une erreur inconnue est survenue lors de la génération du guide.");
    } finally {
      // The interval is cleared in success/error path, but this is a final safeguard.
      clearProgressInterval();
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setStep(AppStep.USER_INFO);
    setGeneratedGuide(null);
    setError(null);
    setIsLoading(false);
    setLoadingMessage('');
    setProgress(0);
    clearProgressInterval();
  };

  const renderContent = () => {
    if (isLoading || step === AppStep.DISPLAY_GUIDE && !generatedGuide && !error) {
      return <Loader message={loadingMessage} progress={progress} />;
    }
    
    if (error) {
        return (
            <div className="text-center p-8 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                <h3 className="text-xl font-bold mb-4">Erreur</h3>
                <p>{error}</p>
                <button
                    onClick={handleReset}
                    className="mt-6 bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded-lg transition duration-300"
                >
                    Recommencer
                </button>
            </div>
        );
    }

    switch (step) {
      case AppStep.USER_INFO:
        return <UserInputForm onSubmit={handleUserInfoSubmit} />;
      case AppStep.DISPLAY_GUIDE:
        return generatedGuide ? <GuideDisplay guide={generatedGuide} onReset={handleReset} /> : null;
      default:
        return <UserInputForm onSubmit={handleUserInfoSubmit} />;
    }
  };

  return (
    <div className="min-h-screen text-slate-800">
      <Header />
      <main className="container mx-auto px-4 py-8 md:py-12">
        <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-2xl overflow-hidden">
            {renderContent()}
        </div>
      </main>
      <footer className="text-center py-6 text-slate-500 text-sm">
        <p>Propulsé par l'IA de Google Gemini</p>
      </footer>
    </div>
  );
};

export default App;