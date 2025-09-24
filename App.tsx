import React, { useState, useRef } from 'react';
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

  const handleUserInfoSubmit = async (info: UserBusinessInfo) => {
    setIsLoading(true);
    setError(null);
    setGeneratedGuide(null);
    setLoadingMessage("Initialisation...");
    setProgress(0);

    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }

    const startSlowProgress = (from: number, to: number, duration: number) => {
        if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
        const range = to - from;
        if (range <= 0 || duration <= 0) return;
        const stepInterval = duration / range;
        progressIntervalRef.current = window.setInterval(() => {
            setProgress(prev => {
                if (prev >= to) {
                    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
                    return to;
                }
                return prev + 1;
            });
        }, stepInterval);
    };

    try {
      const onProgressUpdate = (update: { message: string, progress: number }) => {
        // Clear any slow progression if a firm update comes in
        if (progressIntervalRef.current) {
            clearInterval(progressIntervalRef.current);
            progressIntervalRef.current = null;
        }

        setLoadingMessage(update.message);
        setProgress(update.progress);
        
        // When the AI generation starts (at 20%), begin the slow, simulated progress
        if (update.progress === 20) {
            const estimatedDuration = Math.max(15, info.linkCount * 1.5) * 1000; // 1.5s per link, min 15s
            startSlowProgress(20, 90, estimatedDuration);
        }
      };

      const guide = await generateLocalGuide(info, onProgressUpdate);

      // On success, ensure interval is cleared and jump to 100%
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      setProgress(100);
      setGeneratedGuide(guide);
      setStep(AppStep.DISPLAY_GUIDE);

    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Une erreur inconnue est survenue lors de la génération du guide.");
    } finally {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
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
    if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
    }
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