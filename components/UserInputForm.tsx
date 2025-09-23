import React, { useState } from 'react';
import { UserBusinessInfo } from '../types';

interface UserInputFormProps {
  onSubmit: (info: UserBusinessInfo, csvData: string) => void;
}

const UserInputForm: React.FC<UserInputFormProps> = ({ onSubmit }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [linkCount, setLinkCount] = useState(5);
  const [csvContent, setCsvContent] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
        alert('Veuillez sélectionner un fichier .csv');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        setCsvContent(text);
        setFileName(file.name);
      };
      reader.readAsText(file);
    } else {
      setCsvContent(null);
      setFileName('');
    }
  };


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name && description && csvContent) {
        onSubmit({ url: '', name, description, address: '', linkCount }, csvContent);
    }
  };

  const isSubmitDisabled = !name || !description || !csvContent;

  return (
    <div className="p-8 md:p-12">
        <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 mb-4 rounded-full bg-blue-100">
                <span className="text-2xl font-bold text-blue-600">1</span>
            </div>
            <h2 className="text-2xl font-bold">Votre Entreprise</h2>
            <p className="text-slate-500 mt-2">Parlez-nous de vous. L'IA utilisera ces informations pour contextualiser les entreprises partenaires.</p>
        </div>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-slate-700">
            Nom de votre entreprise
          </label>
          <div className="mt-1">
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-4 py-2 border border-slate-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 transition"
              placeholder="Ex: Horde d’Or 24/16"
            />
          </div>
        </div>
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-slate-700">
            Description de votre activité
          </label>
          <div className="mt-1">
            <textarea
              id="description"
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              className="w-full px-4 py-2 border border-slate-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 transition"
              placeholder="Ex: Spécialiste de la vente de camping-cars d’occasion en Dordogne et Charente..."
            />
          </div>
        </div>

        <div className="border-t border-slate-200 my-8"></div>
        
        <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 mb-4 rounded-full bg-blue-100">
                <span className="text-2xl font-bold text-blue-600">2</span>
            </div>
            <h2 className="text-2xl font-bold">Vos Partenaires</h2>
            <p className="text-slate-500 mt-2">Importez votre fichier CSV et choisissez combien d'entreprises vous souhaitez traiter.</p>
        </div>

        <div>
            <label htmlFor="csvFile-label" className="block text-sm font-medium text-slate-700">
                Fichier CSV des partenaires
            </label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-slate-300 border-dashed rounded-lg">
                <div className="space-y-1 text-center">
                    <svg className="mx-auto h-12 w-12 text-slate-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                        <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <div className="flex text-sm text-slate-600">
                        <label htmlFor="csvFile" className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
                            <span>Sélectionnez un fichier</span>
                            <input id="csvFile" name="csvFile" type="file" className="sr-only" accept=".csv" onChange={handleFileChange} />
                        </label>
                        <p className="pl-1">ou glissez-déposez</p>
                    </div>
                    <p className="text-xs text-slate-500">
                        Fichier CSV uniquement.
                    </p>
                    {fileName && <p className="text-sm font-semibold text-green-600 pt-2">{fileName}</p>}
                </div>
            </div>
            <p className="mt-2 text-xs text-slate-500">Le CSV doit contenir au minimum les colonnes : `name`, `address`.</p>
        </div>

        <div>
            <label htmlFor="linkCount" className="block text-sm font-medium text-slate-700">
                Nombre d'entreprises à traiter
            </label>
            <select
                id="linkCount"
                value={linkCount}
                onChange={(e) => setLinkCount(Number(e.target.value))}
                className="mt-1 block w-full px-4 py-2 border border-slate-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 transition"
            >
                <option value="5">5</option>
                <option value="10">10</option>
                <option value="15">15</option>
                <option value="20">20</option>
                <option value="25">25</option>
                <option value="50">50</option>
            </select>
        </div>

        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={isSubmitDisabled}
            className="w-full md:w-auto inline-flex justify-center py-3 px-8 border border-transparent shadow-sm text-lg font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-slate-400 disabled:cursor-not-allowed transition duration-300"
          >
            Générer le Guide
          </button>
        </div>
      </form>
    </div>
  );
};

export default UserInputForm;