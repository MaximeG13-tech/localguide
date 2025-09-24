import React, { useState } from 'react';
import { LocalGuide, GeneratedBusinessInfo } from '../types';

interface GuideDisplayProps {
  guide: LocalGuide;
  onReset: () => void;
  generationTime: number | null;
}

// Icon Components
const BriefcaseIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-500" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 2a2 2 0 00-2 2v1H6a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V7a2 2 0 00-2-2h-2V4a2 2 0 00-2-2h-4zM9 4V3a1 1 0 011-1h4a1 1 0 011 1v1H9z" clipRule="evenodd" /></svg> );
const MapPinIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-500" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 20l-4.95-5.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" /></svg> );
const BuildingStorefrontIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-500" fill="currentColor" viewBox="0 0 16 16"><path d="M13.427 1.11C13.26 1.04 13.11 1 12.5 1h-9a1.5 1.5 0 0 0 0 3h9a1.5 1.5 0 0 0 0-3M1.713 5.055a.5.5 0 0 1 .573.03l1.375 1.455-1.018 2.853.011.01a.5.5 0 0 1-.34 1.113H2.5a.5.5 0 0 1 0-1h.562l.31-2.6-1.437-1.526A.5.5 0 0 1 1.713 5.055m11.47 0a.5.5 0 0 1 .573.03l1.375 1.455-1.018 2.853.011.01a.5.5 0 0 1-.34 1.113h-1.25a.5.5 0 0 1 0-1h.562l.31-2.6-1.437-1.526a.5.5 0 0 1 .03-.573ZM6.02 11.525a.5.5 0 0 1 .5-.5h2.96a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-2.96a.5.5 0 0 1-.5-.5v-1Z"/><path d="M16 5.333a1.65 1.65 0 0 1-1.65 1.65h-1.238a.5.5 0 0 1-.49-.356l-.24-1.202a.5.5 0 0 1 .356-.567L13.43 4.58a1.65 1.65 0 0 1 2.57 2.253l-1.43 1.29a.5.5 0 0 1-.685-.152l-1.35-2.25A.5.5 0 0 1 12.5 5h-9a.5.5 0 0 1-.256.44l-1.35 2.25a.5.5 0 0 1-.685.152L.073 6.833A1.65 1.65 0 0 1 2.57 4.58l.755.333a.5.5 0 0 1 .356.567l-.24 1.202a.5.5 0 0 1-.49.356H1.65A1.65 1.65 0 0 1 0 5.333V15a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V5.333Z"/></svg> );
const DocumentTextIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-500" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 2a.5.5 0 01.5-.5h6a.5.5 0 010 1h-6a.5.5 0 01-.5-.5zm0 3a.5.5 0 01.5-.5h6a.5.5 0 010 1h-6a.5.5 0 01-.5-.5zm0 3a.5.5 0 01.5-.5h4a.5.5 0 010 1h-4a.5.5 0 01-.5-.5z" clipRule="evenodd" /></svg> );
const AlignLeftIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-500" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 5a1 1 0 011-1h6a1 1 0 110 2H4a1 1 0 01-1-1zm0 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" /></svg> );
const PhoneIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-500" viewBox="0 0 20 20" fill="currentColor"><path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.518.759a11.024 11.024 0 005.176 5.176l.759-1.518a1 1 0 011.06-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" /></svg> );

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

const BusinessEntry: React.FC<{ business: GeneratedBusinessInfo; index: number }> = ({ business, index }) => {
    // Dynamically create a reliable Google Maps search URL using the business name and full address for better precision.
    const googleMapsSearchUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${business.name}, ${business.address}`)}`;

    return (
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8 border border-slate-200 space-y-5 transition-all hover:shadow-xl hover:border-blue-200">
            <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-700 to-teal-600 border-b-2 border-slate-100 pb-3 mb-5">{`${index + 1}. ${business.name}`}</h3>
            <CopyableField label="Nom / Société" value={business.name} icon={<BuildingStorefrontIcon />} />
            <CopyableField label="Activité et spécificité" value={business.activity} icon={<BriefcaseIcon />} />
            <CopyableField label="Secteur / Ville" value={business.city} icon={<MapPinIcon />} />
            <CopyableField label="Téléphone" value={business.phone} icon={<PhoneIcon />} />
            <CopyableField label="Extrait" value={business.extract} icon={<DocumentTextIcon />} isTextarea />
            <CopyableField label="Description" value={business.description} icon={<AlignLeftIcon />} isHtml />
            <CopyableField label="Lien Google Maps (Recherche)" value={googleMapsSearchUrl} icon={<MapPinIcon />} isLink />
        </div>
    );
};


const GuideDisplay: React.FC<GuideDisplayProps> = ({ guide, onReset, generationTime }) => {

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
    <div className="p-4 md:p-8 bg-slate-100">
        <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-slate-800">Votre Guide Local est Prêt !</h2>
            <p className="text-slate-600 mt-2">Copiez chaque champ et collez-le dans votre back-office, ou exportez toutes les données.</p>
        </div>
        <div className="my-8 flex flex-col md:flex-row-reverse justify-center items-center gap-4">
             <button
                onClick={onReset}
                className="w-full md:w-auto inline-flex justify-center py-3 px-6 border border-slate-300 shadow-sm text-sm font-medium rounded-lg text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-300"
            >
                Générer un autre guide
            </button>
            <button
                onClick={handleExportJson}
                className="w-full md:w-auto inline-flex justify-center py-3 px-6 border border-transparent shadow-sm text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-300"
            >
                Exporter en JSON
            </button>
        </div>
         {formattedTime && (
          <p className="text-center text-sm text-slate-500 mb-8 -mt-4">
            {formattedTime}
          </p>
        )}
      <div>
        {guide.map((business, index) => (
          <BusinessEntry key={index} business={business} index={index} />
        ))}
      </div>
    </div>
  );
};

export default GuideDisplay;