import React, { useState, useRef, useEffect } from 'react';
import { AppStep, UserBusinessInfo, LocalGuide } from './types';
import UserInputForm from './components/UserInputForm';
import GuideDisplay from './components/GuideDisplay';
import Header from './components/Header';
import Loader from './components/Loader';
import CategorySelectionModal from './components/CategorySelectionModal';
import { generateLocalGuide, generateB2BCategorySuggestions, generateInitialCategorySuggestions } from './services/geminiService';

const App: React.FC = () => {
  const [step, setStep] = useState<AppStep>(AppStep.USER_INFO);
  const [generatedGuide, setGeneratedGuide] = useState<LocalGuide | null>(null);
  const [lastUserInfo, setLastUserInfo] = useState<UserBusinessInfo | null>(null);
  const [lastUsedCategories, setLastUsedCategories] = useState<string[] | null>(null);
  const [b2bSuggestions, setB2bSuggestions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingMessage, setLoadingMessage] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const [generationTime, setGenerationTime] = useState<number | null>(null);
  
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [initialSuggestions, setInitialSuggestions] = useState<string[]>([]);
  const [isRegenerating, setIsRegenerating] = useState(false);
  
  const progressIntervalRef = useRef<number | null>(null);

  const clearProgressInterval = () => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      clearProgressInterval();
    };
  }, []);

  const handleStartGenerationProcess = async (
    info: UserBusinessInfo,
    initialCategories?: string[],
    excludeCategories?: string[] | null,
    userFeedback?: string | null
  ) => {
    setLastUserInfo(info);
    setIsLoading(true);
    setError(null);
    setGeneratedGuide(null);
    setLoadingMessage("Initialisation du processus IA...");
    setProgress(0);
    setGenerationTime(null);
    clearProgressInterval();
    
    const startTime = Date.now();
    
    const estimatedDuration = Math.max(20, info.linkCount * 2.5) * 1000;
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
    
    const progressCallback = (message: string) => {
      setLoadingMessage(message);
    };

    try {
      const guidePromise = generateLocalGuide(info, progressCallback, {
        initialCategories,
        excludeCategories,
        userFeedback
      });
      const suggestionsPromise = generateB2BCategorySuggestions(info.description);
      
      const [guideResult, suggestions] = await Promise.all([guidePromise, suggestionsPromise]);

      const { guide, categoriesUsed } = guideResult;
      const endTime = Date.now();
      setGenerationTime(endTime - startTime);
      
      clearProgressInterval();
      setProgress(100);
      setLoadingMessage("Guide généré avec succès !");
      setGeneratedGuide(guide);
      setLastUsedCategories(categoriesUsed);
      setB2bSuggestions(suggestions);
      setStep(AppStep.DISPLAY_GUIDE);

    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Une erreur inconnue est survenue lors de la génération du guide.");
      clearProgressInterval();
    } finally {
      setIsLoading(false);
    }
  };

  const handleUserInfoSubmit = async (info: UserBusinessInfo) => {
    setIsLoading(true);
    setError(null);
    setLoadingMessage("Analyse de votre activité pour suggérer des partenaires...");
    setLastUserInfo(info);

    try {
        const suggestions = await generateInitialCategorySuggestions(info.description, info.linkCount);
        setInitialSuggestions(suggestions);
        setIsCategoryModalOpen(true);
    } catch (err) {
        console.error(err);
        setError("Impossible de générer les suggestions de catégories. Veuillez réessayer.");
    } finally {
        setIsLoading(false);
        setLoadingMessage('');
    }
  };

  const handleCategoriesSelected = (selectedCategories: string[]) => {
    setIsCategoryModalOpen(false);
    if (lastUserInfo && selectedCategories.length > 0) {
      // Le nombre de liens à générer est maintenant basé sur la sélection de l'utilisateur.
      const infoWithCorrectedCount = { ...lastUserInfo, linkCount: selectedCategories.length };
      handleStartGenerationProcess(infoWithCorrectedCount, selectedCategories);
    }
  };

  const handleRegenerateSuggestions = async () => {
    if (!lastUserInfo) return;
    setIsRegenerating(true);
    try {
      const suggestions = await generateInitialCategorySuggestions(lastUserInfo.description, lastUserInfo.linkCount);
      setInitialSuggestions(suggestions);
    } catch (err) {
      // Gérer l'erreur, peut-être avec un toast/notification dans le futur
      console.error("Failed to regenerate suggestions", err);
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleReset = () => {
    setStep(AppStep.USER_INFO);
    setGeneratedGuide(null);
    setError(null);
    setIsLoading(false);
    setLoadingMessage('');
    setProgress(0);
    setGenerationTime(null);
    clearProgressInterval();
    setLastUserInfo(null);
    setLastUsedCategories(null);
    setB2bSuggestions([]);
    setInitialSuggestions([]);
  };
  
  const handleRecommencer = (newLinkCount: number, feedback: string) => {
    if (lastUserInfo) {
      const newInfo = { ...lastUserInfo, linkCount: newLinkCount };
      handleStartGenerationProcess(newInfo, undefined, lastUsedCategories, feedback);
    }
  };
  

  let content;
  if (isLoading) {
    content = <Loader message={loadingMessage} progress={progress} />;
  } else if (error) {
    content = (
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
  } else if (step === AppStep.DISPLAY_GUIDE) {
    content = generatedGuide ? <GuideDisplay guide={generatedGuide} onReset={handleReset} onRecommencer={handleRecommencer} userInfo={lastUserInfo} generationTime={generationTime} suggestions={b2bSuggestions} /> : null;
  } else {
    // Default to USER_INFO step
    content = <UserInputForm onSubmit={handleUserInfoSubmit} />;
  }

  return (
    <div className="min-h-screen text-slate-800">
      <Header />
      <main className="container mx-auto px-4 py-8 md:py-12">
        <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-2xl overflow-hidden">
            {content}
        </div>
      </main>
      <CategorySelectionModal 
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        onSubmit={handleCategoriesSelected}
        onRegenerate={handleRegenerateSuggestions}
        suggestions={initialSuggestions}
        isRegenerating={isRegenerating}
      />
      <footer className="text-center py-6 text-slate-500">
        <p>Générateur de Guide Local IA - V1.0</p>
      </footer>
    </div>
  );
};

export default App;