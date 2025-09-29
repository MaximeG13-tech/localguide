import React, { useState, useEffect } from 'react';
import { LocalGuide, GeneratedBusinessInfo, UserBusinessInfo } from '../types';

interface GuideDisplayProps {
  guide: LocalGuide;
  onReset: () => void;
  onRegenerate: (newLinkCount: number) => void;
  userInfo: UserBusinessInfo | null;
  generationTime: number | null;
}

// Icon Components
const BriefcaseIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-500" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 2a2 2 0 00-2 2v1H6a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V7a2 2 0 00-2-2h-2V4a2 2 0 00-2-2h-4zM9 4V3a1 1 0 011-1h4a1 1 0 011 1v1H9z" clipRule="evenodd" /></svg> );
const MapPinIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-500" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 20l-4.95-5.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" /></svg> );
const BuildingStorefrontIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-500" fill="currentColor" viewBox="0 0 16 16"><path d="M13.427 1.11C13.26 1.04 13.11 1 12.5 1h-9a1.5 1.5 0 0 0 0 3h9a1.5 1.5 0 0 0 0-3M1.713 5.055a.5.5 0 0 1 .573.03l1.375 1.455-1.018 2.853.011.01a.5.5 0 0 1-.34 1.113H2.5a.5.5 0 0 1 0-1h.562l.31-2.6-1.437-1.526A.5.5 0 0 1 1.713 5.055m11.47 0a.5.5 0 0 1 .573.03l1.375 1.455-1.018 2.853.011.01a.5.5 0 0 1-.34 1.113h-1.25a.5.5 0 0 1 0-1h.562l.31-2.6-1.437-1.526a.5.5 0 0 1 .03-.573ZM6.02 11.525a.5.5 0 0 1 .5-.5h2.96a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-2.96a.5.5 0 0 1-.5-.5v-1Z"/><path d="M16 5.333a1.65 1.65 0 0 1-1.65 1.65h-1.238a.5.5 0 0 1-.49-.356l-.24-1.202a.5.5 0 0 1 .356-.567L13.43 4.58a1.65 1.65 0 0 1 2.57 2.253l-1.43 1.29a.5.5 0 0 1-.685-.152l-1.35-2.25A.5.5 0 0 1 12.5 5h-9a.5.5 0 0 1-.256.44l-1.35 2.25a.5.5 0 0 1-.685.152L.073 6.833A1.65 1.65 0 0 1 2.57 4.58l.755.333a.5.5 0 0 1 .356.567l-.24 1.202a.5.5 0 0 1-.49.356H1.65A1.65 1.65 0 0 1 0 5.333V15a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V5.333Z"/></svg> );
const DocumentTextIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-500" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 2a.5.5 0 01.5-.5h6a.5.5 0 010 1h-6a.5.5 0 01-.5-.5zm0 3a.5.5 0 01.5-.5h6a.5.5 0 010 1h-6a.5.5 0 01-.5-.5zm0 3a.5.5 0 01.5-.5h4a.5.5 0 010 1h-4a.5.5 0 01-.5-.5z" clipRule="evenodd" /></svg> );
const AlignLeftIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-500" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 5a1 1 0 011-1h6a1 1 0 110 2H4a1 1 0 01-1-1zm0 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" /></svg> );
const PhoneIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-500" viewBox="0 0 20 20" fill="currentColor"><path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.518.759a11.024 11.024 0 005.176 5.176l.759-1.518a1 1 0 011.06-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" /></svg> );
const GlobeAltIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-500" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM4.332 8.027a6.012 6.012 0 011.912-2.706C6.512 5.73 6.974 6 7.5 6A1.5 1.5 0 019 7.5V8a2 2 0 004 0 2 2 0 011.523-1.943A5.998 5.998 0 0116 10c0 .994-.252 1.927-.702 2.757A6.01 6.01 0 0113.088 15.02c.003.007.005.014.007.021A.5.5 0 0113 15h-1a.5.5 0 01-.5-.5v-1a.5.5 0 01.5-.5h1a.5.5 0 01.31-.112A4.011 4.011 0 0011 11c0-1.518-.93-2.825-2.25-3.415A2.99 2.99 0 009 8.5V9.5a.5.5 0 01-1 0V8a2 2 0 00-4 0 2 2 0 01-1.523-1.943A5.998 5.998 0 014 10c0 .158.012.314.034.469a.5.5 0 01-.48.531h-1a.5.5 0 01-.48-.531A6.004 6.004 0 014.332 8.027z" clipRule="evenodd" /></svg> );
const UserCircleIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clipRule="evenodd" /></svg> );

const StarRating: React.FC<{ rating?: number; count?: number }> = ({ rating = 0, count = 0 }) => {
  if (rating === 0) return null;
  const fullStars = Math.floor(rating);
  const halfStar = rating % 1 !== 0;
  const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center">
        {[...Array(fullStars)].map((_, i) => <svg key={`full-${i}`} className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>)}
        {halfStar && <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>}
        {[...Array(emptyStars)].map((_, i) => <svg key={`empty-${i}`} className="w-5 h-5 text-slate-300" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>)}
      </div>
      <span className="text-sm text-slate-500 font-medium">{rating?.toFixed(1)}</span>
      <span className="text-sm text-slate-500">({count} avis)</span>
    </div>
  );
};

const CopyableField: React.FC<{ label: string; value: string; icon: React.ReactNode; isTextarea?: boolean; isLink?: boolean; isHtml?: boolean }> = ({ label, value, icon, isTextarea = false, isLink = false, isHtml = false }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(value);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const InputComponent = isTextarea ? 'textarea' : 'input';

    return (
        <div>
            <label className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-1">
                {icon}
                <span>{label}</span>
            </label>
            <div className="flex items-center gap-2">
                 {isHtml ? (
                    <div
                        className="w-full px-3 py-2 bg-slate-100 border border-slate-300 rounded-lg shadow-sm text-sm"
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
                 {isLink && value && (
                    <a
                        href={value}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-shrink-0 p-2 border border-slate-300 rounded-md shadow-sm text-slate-600 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        title="Ouvrir le lien dans un nouvel onglet"
                        aria-label="Ouvrir le lien dans un nouvel onglet"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                           <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                           <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
                        </svg>
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
            <CopyableField label="Nom / Société" value={business.name} icon={<BuildingStorefrontIcon />} />
            <CopyableField label="Activité et spécificité" value={business.activity} icon={<BriefcaseIcon />} />
            <CopyableField label="Secteur / Ville" value={business.city} icon={<MapPinIcon />} />
            <CopyableField label="Téléphone" value={business.phone} icon={<PhoneIcon />} />
            {business.website && <CopyableField label="Site Web" value={business.website} icon={<GlobeAltIcon />} isLink />}
            <CopyableField label="Extrait" value={business.extract} icon={<DocumentTextIcon />} isTextarea />
            <CopyableField label="Description" value={business.description} icon={<AlignLeftIcon />} isHtml />
             <div className="pt-4 border-t border-slate-200">
                <button
                    onClick={() => onOpenBrief(business)}
                    className="inline-flex items-center gap-2 justify-center py-2 px-4 border border-blue-600 text-sm font-medium rounded-lg text-blue-600 bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-300"
                >
                    <UserCircleIcon />
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
          <button onClick={onClose} className="text-slate-500 hover:text-slate-800" aria-label="Fermer">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="p-6 space-y-5 overflow-y-auto">
          <div>
            <h4 className="font-bold text-slate-700 mb-2">Note Google</h4>
            <StarRating rating={business.rating} count={business.userRatingCount} />
          </div>
          <div>
            <h4 className="font-bold text-slate-700 mb-1">Contexte de l'entreprise</h4>
            <div className="text-sm text-slate-600 space-y-2" dangerouslySetInnerHTML={{ __html: business.description || 'Non fourni.' }}></div>
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


const GuideDisplay: React.FC<GuideDisplayProps> = ({ guide, onReset, onRegenerate, userInfo, generationTime }) => {
  const [modalBusiness, setModalBusiness] = useState<GeneratedBusinessInfo | null>(null);
  const [newLinkCount, setNewLinkCount] = useState<number>(userInfo?.linkCount || 5);

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

  return (
    <>
      <CommercialBriefModal business={modalBusiness} onClose={() => setModalBusiness(null)} />
      <div className="p-4 md:p-8 bg-slate-100">
          <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-slate-800">Votre Guide Local est Prêt !</h2>
              <p className="text-slate-600 mt-2">Copiez chaque champ et collez-le dans votre back-office, ou exportez toutes les données.</p>
          </div>
          
          {/* --- Contols Header --- */}
          <div className="p-4 bg-white rounded-xl shadow-md border border-slate-200 mb-8 space-y-4">
              <div className="flex flex-col md:flex-row justify-center items-center gap-4 flex-wrap">
                  <button
                      onClick={handleExportJson}
                      className="w-full md:w-auto inline-flex justify-center py-2 px-5 border border-transparent shadow-sm text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-300"
                  >
                      Exporter en JSON
                  </button>

                  <div className="flex items-center gap-2">
                      <select
                          value={newLinkCount}
                          onChange={(e) => setNewLinkCount(Number(e.target.value))}
                          aria-label="Nombre d'entreprises à regénérer"
                          className="block w-auto pl-3 pr-8 py-2 border border-slate-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
                      >
                          <option value="5">5</option>
                          <option value="10">10</option>
                          <option value="15">15</option>
                          <option value="20">20</option>
                          <option value="25">25</option>
                          <option value="50">50</option>
                      </select>
                      <button
                        onClick={() => onRegenerate(newLinkCount)}
                        className="inline-flex justify-center py-2 px-5 border border-blue-600 shadow-sm text-sm font-medium rounded-lg text-blue-600 bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-300"
                      >
                          Regénérer
                      </button>
                  </div>

                  <button
                      onClick={onReset}
                      className="w-full md:w-auto inline-flex justify-center py-2 px-5 border border-slate-300 shadow-sm text-sm font-medium rounded-lg text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-300"
                  >
                      Générer un autre guide
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
              <BusinessEntry key={index} business={business} index={index} onOpenBrief={setModalBusiness} />
            ))}
          </div>
      </div>
    </>
  );
};

export default GuideDisplay;