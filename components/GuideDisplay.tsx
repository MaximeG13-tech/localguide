
import React, { useState } from 'react';
import { LocalGuide, GeneratedBusinessInfo, UserBusinessInfo } from '../types';

interface GuideDisplayProps {
  guide: LocalGuide;
  onReset: () => void;
  onRecommencer: (newLinkCount: number, feedback: string) => void;
  userInfo: UserBusinessInfo | null;
  generationTime: number | null;
  suggestions: string[];
}

const StarRating: React.FC<{ rating?: number; count?: number }> = ({ rating = 0, count = 0 }) => {
  if (!rating || rating === 0) return null;
  return (
    <div className="flex items-baseline gap-2 mt-1">
      <span className="text-sm text-slate-600 font-semibold">Note Google :</span>
      <span className="text-sm text-slate-800 font-medium">{rating?.toFixed(1)} / 5</span>
      <span className="text-sm text-slate-500">({count} avis)</span>
    </div>
  );
};

const CopyableField: React.FC<{ label: string; value: string; isTextarea?: boolean; isLink?: boolean; isHtml?: boolean; showWordCount?: boolean; }> = ({ label, value, isTextarea = false, isLink = false, isHtml = false, showWordCount = false }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(value);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const countWords = (htmlString: string): number => {
        if (!htmlString) return 0;
        const textOnly = htmlString.replace(/<[^>]*>/g, ' ');
        const words = textOnly.trim().split(/\s+/).filter(Boolean);
        return words.length;
    };
    
    const wordCount = showWordCount ? countWords(value) : 0;

    const InputComponent = isTextarea ? 'textarea' : 'input';

    return (
        <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">
                {label}
            </label>
            <div className="flex items-center gap-2">
                 <div className="relative w-full">
                    {isHtml ? (
                        <div
                            className="w-full px-3 pt-2 pb-7 bg-slate-100 border border-slate-300 rounded-lg shadow-sm text-sm text-justify"
                            style={{minHeight: '120px', maxHeight: '240px', overflowY: 'auto'}}
                            dangerouslySetInnerHTML={{ __html: value }}
                        />
                    ) : (
                        <InputComponent
                            type="text"
                            readOnly
                            value={value}
                            rows={isTextarea ? 5 : undefined}
                            className="w-full px-3 py-2 bg-slate-100 border border-slate-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 transition font-mono text-sm"
                            onClick={(e) => (e.target as HTMLInputElement).select()}
                        />
                    )}
                    {showWordCount && (
                        <span className="absolute bottom-2 right-3 text-xs font-mono text-slate-500 bg-slate-100/80 backdrop-blur-sm px-1.5 py-0.5 rounded-md border border-slate-200/50 pointer-events-none">
                            {wordCount} mots
                        </span>
                    )}
                </div>
                 {isLink && value && (
                    <a
                        href={value}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-shrink-0 text-sm text-blue-600 hover:underline"
                        title="Ouvrir le lien dans un nouvel onglet"
                    >
                        Ouvrir
                    </a>
                )}
                <button
                    onClick={handleCopy}
                    className="flex-shrink-0 px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    aria-label={`Copier ${label}`}
                >
                    {copied ? 'Copié !' : 'Copier'}
                </button>
            </div>
        </div>
    );
};

const BusinessEntry: React.FC<{ business: GeneratedBusinessInfo; index: number; onOpenBrief: (business: GeneratedBusinessInfo) => void; }> = ({ business, index, onOpenBrief }) => {
    return (
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8 border border-slate-200 space-y-5 transition-all hover:shadow-xl hover:border-blue-200">
            <div className="border-b-2 border-slate-100 pb-3 mb-5">
                <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-700 to-teal-600">{`${index + 1}. ${business.name}`}</h3>
                <StarRating rating={business.rating} count={business.userRatingCount} />
            </div>
            <CopyableField label="Nom / Société" value={business.name} />
            <CopyableField label="Activité et spécificité" value={business.activity} />
            <CopyableField label="Secteur / Ville" value={business.city} />
            <CopyableField label="Téléphone" value={business.phone} />
            {business.website && <CopyableField label="Site Web" value={business.website} isLink />}
            <CopyableField label="Extrait" value={business.extract} isTextarea />
            <CopyableField label="Description" value={business.description} isHtml showWordCount />
             <div className="pt-4 border-t border-slate-200">
                <button
                    onClick={() => onOpenBrief(business)}
                    className="inline-flex items-center justify-center py-2 px-4 border border-blue-600 text-sm font-medium rounded-lg text-blue-600 bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-300"
                >
                    Brief commercial
                </button>
            </div>
        </div>
    );
};

const CommercialBriefModal: React.FC<{ business: GeneratedBusinessInfo | null; onClose: () => void; }> = ({ business, onClose }) => {
  if (!business) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4 transition-opacity duration-300"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="brief-title"
    >
      <div 
        className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 border-b border-slate-200 flex justify-between items-center">
          <h3 id="brief-title" className="text-xl font-bold text-slate-800">Brief: {business.name}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 font-sans text-2xl font-bold" aria-label="Fermer">
            &times;
          </button>
        </div>
        <div className="p-6 space-y-5 overflow-y-auto">
          <div>
            <h4 className="font-bold text-slate-700 mb-2">Note Google</h4>
            <StarRating rating={business.rating} count={business.userRatingCount} />
          </div>
          <div>
            <h4 className="font-bold text-slate-700 mb-1">Contexte de l'entreprise</h4>
            <div className="text-sm text-slate-600 space-y-2 text-justify" dangerouslySetInnerHTML={{ __html: business.description || 'Non fourni.' }}></div>
          </div>
          <div>
            <h4 className="font-bold text-slate-700 mb-1">Site Web</h4>
            {business.website ? <a href={business.website} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline break-all">{business.website}</a> : <p className="text-sm text-slate-500">Non fourni.</p>}
          </div>
          <div>
            <h4 className="font-bold text-slate-700 mb-1">Voir sur Google Maps</h4>
            {business.googleMapsUri ? <a href={business.googleMapsUri} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline break-all">{business.googleMapsUri}</a> : <p className="text-sm text-slate-500">Lien non fourni.</p>}
          </div>
          <div>
            <h4 className="font-bold text-slate-700 mb-1">Téléphone (Gérant)</h4>
            <p className="text-sm text-slate-600">{business.managerPhone || 'Non fourni.'}</p>
          </div>
           <div>
            <h4 className="font-bold text-slate-700 mb-1">Numéro de SIRET</h4>
             {business.siret ? (
              <a 
                href={`https://www.pappers.fr/entreprise/${business.siret.replace(/\s/g, '').substring(0, 9)}`}
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-sm text-blue-600 hover:underline break-all"
                title="Vérifier sur pappers.fr"
              >
                {business.siret}
              </a>
            ) : (
              <p className="text-sm text-slate-500">Non fourni.</p>
            )}
          </div>
        </div>
        <div className="p-4 bg-slate-50 border-t border-slate-200 text-right">
          <button onClick={onClose} className="px-5 py-2 bg-slate-600 text-white font-semibold rounded-lg hover:bg-slate-700 transition">
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};


const RecommencerModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (newLinkCount: number, feedback: string) => void;
  defaultLinkCount: number;
  suggestions: string[];
}> = ({ isOpen, onClose, onSubmit, defaultLinkCount, suggestions }) => {
  const [linkCount, setLinkCount] = useState(defaultLinkCount);
  const [feedback, setFeedback] = useState('');
  const [selectedSuggestions, setSelectedSuggestions] = useState<string[]>([]);

  if (!isOpen) return null;

  const handleSuggestionClick = (suggestion: string) => {
    setSelectedSuggestions(prev => 
      prev.includes(suggestion) 
        ? prev.filter(s => s !== suggestion)
        : [...prev, suggestion]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let combinedFeedback = '';
    if (selectedSuggestions.length > 0) {
      combinedFeedback += `Feedback Suggéré: ${selectedSuggestions.join(', ')}. `;
    }
    if (feedback.trim()) {
      combinedFeedback += `Commentaire: ${feedback.trim()}`;
    }
    onSubmit(linkCount, combinedFeedback.trim());
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4 transition-opacity"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="recommencer-modal-title"
    >
      <div 
        className="bg-white rounded-xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="p-6 border-b border-slate-200">
            <h3 id="recommencer-modal-title" className="text-xl font-bold text-slate-800">Affiner votre recherche</h3>
            <p className="text-sm text-slate-500 mt-1">Guidez l'IA pour trouver les partenaires les plus pertinents.</p>
          </div>
          <div className="p-6 md:p-8 space-y-8 overflow-y-auto">
            
            <fieldset>
              <legend className="block text-base font-semibold text-slate-800 mb-3">
                1. Suggestions de partenaires
              </legend>
              <div className="p-4 bg-slate-50 rounded-lg">
                <div className="flex flex-wrap gap-2">
                  {suggestions.length > 0 ? (
                    suggestions.map(s => {
                      const suggestionText = s.length > 50 ? `${s.substring(0, 47)}...` : s;
                      return (
                        <button
                          type="button"
                          key={s}
                          onClick={() => handleSuggestionClick(s)}
                          className={`px-3 py-1.5 text-sm font-semibold rounded-full transition-all duration-200 ${
                            selectedSuggestions.includes(s)
                              ? 'bg-blue-600 text-white shadow-md ring-2 ring-blue-300'
                              : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                          }`}
                          title={s}
                        >
                          {suggestionText}
                        </button>
                      );
                    })
                  ) : (
                    <div className="text-sm text-slate-500 w-full text-center py-2">L'IA n'a pas de suggestions pour le moment.</div>
                  )}
                </div>
              </div>
            </fieldset>

            <fieldset>
              <legend className="block text-base font-semibold text-slate-800 mb-3">
                2. Vos instructions (optionnel)
              </legend>
              <div>
                <label htmlFor="feedback" className="block text-sm font-medium text-slate-600 mb-1">
                  Ajoutez un commentaire pour orienter la recherche.
                </label>
                <textarea
                  id="feedback"
                  rows={3}
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 transition"
                  placeholder="Ex: 'Je veux plus d'artisans', 'Évite les agences immobilières'..."
                />
              </div>
            </fieldset>

            <fieldset>
              <legend className="block text-base font-semibold text-slate-800 mb-3">
                3. Nombre d'entreprises à générer
              </legend>
              <div>
                <select
                  id="modalLinkCount"
                  value={linkCount}
                  onChange={(e) => setLinkCount(Number(e.target.value))}
                  className="block w-full px-3 py-2 border border-slate-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 transition bg-white"
                >
                  <option value="1">1 Entreprise (Coordination)</option>
                  <option value="5">5 Entreprises</option>
                  <option value="10">10 Entreprises</option>
                  <option value="15">15 Entreprises</option>
                  <option value="25">25 Entreprises</option>
                  <option value="50">50 Entreprises</option>
                </select>
              </div>
            </fieldset>

          </div>
          <div className="p-4 bg-slate-100 border-t border-slate-200 flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-5 py-2 bg-white border border-slate-300 text-slate-800 font-semibold rounded-lg hover:bg-slate-50 transition shadow-sm">
              Annuler
            </button>
            <button type="submit" className="px-5 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition shadow-sm">
              Relancer la génération
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};


const GuideDisplay: React.FC<GuideDisplayProps> = ({ guide, onReset, onRecommencer, userInfo, generationTime, suggestions }) => {
  const [modalBusiness, setModalBusiness] = useState<GeneratedBusinessInfo | null>(null);
  const [isRecommencerModalOpen, setIsRecommencerModalOpen] = useState(false);
  
  const handleExportJson = () => {
    const dataStr = JSON.stringify(guide, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'guide-local.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const formatGenerationTime = (ms: number | null): string | null => {
    if (ms === null || ms <= 0) {
      return null;
    }
    const totalSeconds = ms / 1000;
    if (totalSeconds < 60) {
      return `Guide généré en ${totalSeconds.toFixed(1)} secondes.`;
    }
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = Math.round(totalSeconds % 60);
    const minuteText = `${minutes} minute${minutes > 1 ? 's' : ''}`;
    if (seconds > 0) {
      const secondText = `${seconds} seconde${seconds > 1 ? 's' : ''}`;
      return `Guide généré en ${minuteText} et ${secondText}.`;
    }
    return `Guide généré en ${minuteText}.`;
  };
  
  const formattedTime = formatGenerationTime(generationTime);

  const handleRecommencerSubmit = (newLinkCount: number, feedback: string) => {
    onRecommencer(newLinkCount, feedback);
    setIsRecommencerModalOpen(false);
  };

  return (
    <>
      <CommercialBriefModal business={modalBusiness} onClose={() => setModalBusiness(null)} />
      <RecommencerModal
        isOpen={isRecommencerModalOpen}
        onClose={() => setIsRecommencerModalOpen(false)}
        onSubmit={handleRecommencerSubmit}
        defaultLinkCount={userInfo?.linkCount || 10}
        suggestions={suggestions}
      />
      <div className="p-4 md:p-8 bg-slate-100">
          <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-slate-800">Votre Guide Local est Prêt !</h2>
              <p className="text-slate-600 mt-2">Copiez chaque champ et collez-le dans votre back-office, ou exportez toutes les données.</p>
          </div>
          
          {/* --- Contols Header --- */}
          <div className="mb-8 space-y-4">
              <div className="flex flex-col md:flex-row justify-center items-center gap-4 flex-wrap">
                  <button
                      onClick={handleExportJson}
                      className="w-full md:w-auto inline-flex justify-center py-2 px-5 border border-transparent shadow-sm text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-300"
                  >
                      Exporter en JSON
                  </button>

                  <button
                    onClick={() => setIsRecommencerModalOpen(true)}
                    className="inline-flex justify-center py-2 px-5 border border-blue-600 shadow-sm text-sm font-medium rounded-lg text-blue-600 bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-300"
                  >
                      Recommencer...
                  </button>

                  <button
                      onClick={onReset}
                      className="w-full md:w-auto inline-flex justify-center py-2 px-5 border border-slate-300 shadow-sm text-sm font-medium rounded-lg text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-300"
                  >
                      Nouveau Guide
                  </button>
              </div>
              {formattedTime && (
                <p className="text-center text-sm text-slate-500 pt-2">
                  {formattedTime}
                </p>
              )}
          </div>
          
          {/* --- Business List --- */}
          <div>
            {guide.map((business, index) => (
              <BusinessEntry key={`${business.siret || business.name}-${index}`} business={business} index={index} onOpenBrief={setModalBusiness} />
            ))}
          </div>
      </div>
    </>
  );
};

export default GuideDisplay;