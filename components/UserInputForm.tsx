import React, { useState } from 'react';
import { UserBusinessInfo } from '../types';

interface UserInputFormProps {
  onSubmit: (info: UserBusinessInfo) => void;
}

const UserInputForm: React.FC<UserInputFormProps> = ({ onSubmit }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [partnerAddress, setPartnerAddress] = useState('');
  const [radius, setRadius] = useState(5);
  const [linkCount, setLinkCount] = useState(5);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name && description && partnerAddress) {
        onSubmit({ name, description, linkCount, partnerSearchAddress: partnerAddress, partnerSearchRadius: radius });
    }
  };

  const isSubmitDisabled = !name || !description || !partnerAddress;

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
          <label htmlFor="partnerAddress" className="block text-sm font-medium text-slate-700">
            Adresse du client
          </label>
          <div className="mt-1">
            <input
              type="text"
              id="partnerAddress"
              value={partnerAddress}
              onChange={(e) => setPartnerAddress(e.target.value)}
              required
              className="w-full px-4 py-2 border border-slate-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 transition"
              placeholder="Ex: 24 Avenue des Champs-Élysées, 75008 Paris"
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
            <p className="text-slate-500 mt-2">Définissez la zone et le volume de votre recherche de partenaires.</p>
        </div>

        <div>
            <label htmlFor="radius" className="block text-sm font-medium text-slate-700">
                Périmètre de recherche
            </label>
            <select
                id="radius"
                value={radius}
                onChange={(e) => setRadius(Number(e.target.value))}
                className="mt-1 block w-full px-4 py-2 border border-slate-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 transition"
            >
                <option value="5">5 km</option>
                <option value="10">10 km</option>
                <option value="20">20 km</option>
                <option value="50">50 km</option>
            </select>
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