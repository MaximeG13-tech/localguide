import React, { useState } from 'react';
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

  const handleUserInfoSubmit = async (info: UserBusinessInfo, csvData: string) => {
    setIsLoading(true);
    setError(null);
    setLoadingMessage("Initialisation du processus...");
    try {
      const onProgressUpdate = (message: string) => {
        setLoadingMessage(message);
      };
      const guide = await generateLocalGuide(info, csvData, onProgressUpdate);
      setGeneratedGuide(guide);
      setStep(AppStep.DISPLAY_GUIDE);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Une erreur inconnue est survenue lors de la génération du guide.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setStep(AppStep.USER_INFO);
    setGeneratedGuide(null);
    setError(null);
    setIsLoading(false);
    setLoadingMessage('');
  };

  const renderContent = () => {
    if (isLoading) {
      return <Loader message={loadingMessage} />;
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