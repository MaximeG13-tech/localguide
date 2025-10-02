import React, { useState, useRef, useEffect } from 'react';
import { AppStep, UserBusinessInfo, LocalGuide, GeneratedBusinessInfo } from './types';
import UserInputForm from './components/UserInputForm';
import GuideDisplay from './components/GuideDisplay';
import Header from './components/Header';
import Loader from './components/Loader';
import CategorySelectionModal from './components/CategorySelectionModal';
import { generateLocalGuide, generateB2BCategorySuggestions, generateInitialCategorySuggestions } from './services/geminiService';

interface ProgressState {
  message: string;
  percentage: number;
}

const App: React.FC = () => {
  const [step, setStep] = useState<AppStep>(AppStep.USER_INFO);
  const [generatedGuide, setGeneratedGuide] = useState<LocalGuide>([]);
  const [lastUserInfo, setLastUserInfo] = useState<UserBusinessInfo | null>(null);
  const [lastUsedCategories, setLastUsedCategories] = useState<string[] | null>(null);
  const [b2bSuggestions, setB2bSuggestions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [progressState, setProgressState] = useState<ProgressState>({ message: '', percentage: 0 });
  const [error, setError] = useState<string | null>(null);
  const [generationTime, setGenerationTime] = useState<number | null>(null);
  
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [initialSuggestions, setInitialSuggestions] = useState<string[]>([]);
  const [isRegenerating, setIsRegenerating] = useState(false);
  
  const generationAbortController = useRef<AbortController | null>(null);

  const handleStartGenerationProcess = async (
    info: UserBusinessInfo,
    initialCategories?: string[],
    excludeCategories?: string[] | null,
    userFeedback?: string | null
  ) => {
    setLastUserInfo(info);
    setIsLoading(true);
    setError(null);
    setGeneratedGuide([]); // Start with an empty array for streaming results
    setGenerationTime(null);
    setStep(AppStep.DISPLAY_GUIDE); // Switch to display view immediately to show results as they come in

    const startTime = Date.now();
    generationAbortController.current = new AbortController();
    
    const progressCallback = (progress: ProgressState) => {
      setProgressState(progress);
    };

    const businessVerifiedCallback = (business: GeneratedBusinessInfo) => {
        setGeneratedGuide(prevGuide => [...prevGuide, business]);
    };

    try {
      const { guide, categoriesUsed } = await generateLocalGuide(
        info,
        progressCallback,
        businessVerifiedCallback,
        { initialCategories, excludeCategories, userFeedback },
        generationAbortController.current.signal
      );
      
      const suggestions = await generateB2BCategorySuggestions(info.description);
      
      const endTime = Date.now();
      setGenerationTime(endTime - startTime);
      
      setLastUsedCategories(categoriesUsed);
      setB2bSuggestions(suggestions);
      setProgressState({ message: `Génération terminée. ${guide.length} partenaires trouvés.`, percentage: 100 });

    } catch (err) {
      if (err.name === 'AbortError') {
        setError("La génération a été annulée.");
      } else {
        console.error(err);
        let errorMessage = "Une erreur inconnue est survenue lors de la génération du guide.";
        if (err instanceof Error) {
            if (err.message.includes('quota')) {
                errorMessage = "Le quota d'utilisation de l'API a été dépassé. Veuillez réessayer plus tard ou vérifier les limites de votre clé API Google.";
            } else {
                errorMessage = err.message;
            }
        }
        setError(errorMessage);
      }
    } finally {
      // Keep loading state true on display page until finished, but allow interaction.
      // A different state like 'isGenerating' might be better.
      // For now, we use the progress percentage to know when it's done.
    }
  };

  const handleStopGeneration = () => {
    if (generationAbortController.current) {
        generationAbortController.current.abort();
    }
    setIsLoading(false); // Or set a new state 'isCancelling'
    setProgressState({ message: "Annulation en cours...", percentage: progressState.percentage });
  };


  const handleUserInfoSubmit = async (info: UserBusinessInfo) => {
    setIsLoading(true);
    setError(null);
    setProgressState({ message: "Analyse de votre activité pour suggérer des partenaires...", percentage: 10 });
    setLastUserInfo(info);

    try {
        // A small visual bump to show progress before the async call
        setProgressState(prev => ({ ...prev, percentage: 50 }));
        const suggestions = await generateInitialCategorySuggestions(info.description, info.linkCount);
        setInitialSuggestions(suggestions);
        setIsCategoryModalOpen(true);
    } catch (err) {
        console.error(err);
        let errorMessage = "Impossible de générer les suggestions de catégories. Veuillez réessayer.";
        if (err instanceof Error) {
            if (err.message.includes('quota')) {
                errorMessage = "Le quota d'utilisation de l'API a été dépassé. Veuillez réessayer plus tard ou vérifier les limites de votre clé API Google.";
            } else {
                errorMessage = `Erreur: ${err.message}`;
            }
        }
        setError(errorMessage);
    } finally {
        setIsLoading(false);
        setProgressState({ message: "", percentage: 0 });
    }
  };

  const handleCategoriesSelected = (selectedCategories: string[]) => {
    setIsCategoryModalOpen(false);
    if (lastUserInfo && selectedCategories.length > 0) {
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
      console.error("Failed to regenerate suggestions", err);
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleReset = () => {
    if (isLoading) handleStopGeneration();
    setStep(AppStep.USER_INFO);
    setGeneratedGuide([]);
    setError(null);
    setIsLoading(false);
    setProgressState({ message: '', percentage: 0 });
    setGenerationTime(null);
    setLastUserInfo(null);
    setLastUsedCategories(null);
    setB2bSuggestions([]);
    setInitialSuggestions([]);
    sessionStorage.clear(); // Clear cache on new guide
  };
  
  const handleRecommencer = (newLinkCount: number, feedback: string) => {
    if (lastUserInfo) {
      const newInfo = { ...lastUserInfo, linkCount: newLinkCount };
      handleStartGenerationProcess(newInfo, undefined, lastUsedCategories, feedback);
    }
  };
  
  const renderContent = () => {
      if (step === AppStep.DISPLAY_GUIDE) {
        return (
            <GuideDisplay
                guide={generatedGuide}
                onReset={handleReset}
                onRecommencer={handleRecommencer}
                userInfo={lastUserInfo}
                generationTime={generationTime}
                suggestions={b2bSuggestions}
                isLoading={progressState.percentage < 100}
                progressState={progressState}
                onStop={handleStopGeneration}
            />
        );
      }
      
      if (isLoading) {
          return <Loader message={progressState.message} progress={progressState.percentage} />;
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

      return <UserInputForm onSubmit={handleUserInfoSubmit} />;
  }

  return (
    <div className="min-h-screen text-slate-800">
      <Header />
      <main className="container mx-auto px-4 py-8 md:py-12">
        <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-2xl overflow-hidden">
            {renderContent()}
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
        <p>Générateur de Guide Local IA - V1.1 Performance</p>
      </footer>
    </div>
  );
};

export default App;