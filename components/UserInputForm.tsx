import React, { useState } from 'react';
import { UserBusinessInfo } from '../types';


const UserInputForm: React.FC<{ onSubmit: (info: UserBusinessInfo) => void }> = ({ onSubmit }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [partnerAddress, setPartnerAddress] = useState('');
  const [radius, setRadius] = useState(5);
  const [linkCount, setLinkCount] = useState(10);
  

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name && description && partnerAddress) {
        onSubmit({ 
          name, 
          description, 
          linkCount,
          partnerSearchAddress: partnerAddress, 
          partnerSearchRadius: radius
        });
    }
  };

  const isSubmitDisabled = !name || !description || !partnerAddress;
  
  const linkCountOptions = [
    { label: 'Coordination', value: 1 },
    { label: '5', value: 5 },
    { label: '10', value: 10 },
    { label: '15', value: 15 },
    { label: '25', value: 25 },
    { label: '50', value: 50 },
  ];

  return (
    <>
      <div className="p-4 md:p-8 bg-slate-100">
        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* Card 1: Your Business */}
          <div className="bg-white rounded-xl shadow-lg p-6 md:p-8 border border-slate-200">
              <div className="mb-6">
                  <h2 className="text-xl font-bold text-slate-800">1. Votre Entreprise</h2>
                  <p className="text-slate-500 mt-1">Parlez-nous de vous pour contextualiser la recherche.</p>
              </div>
              <div className="space-y-5">
                  <div>
                    <label htmlFor="name" className="block text-sm font-bold text-slate-700 mb-1">
                      Nom de votre entreprise
                    </label>
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
                  <div>
                    <label htmlFor="partnerAddress" className="block text-sm font-bold text-slate-700 mb-1">
                      Adresse du client
                    </label>
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
                  <div>
                    <label htmlFor="description" className="block text-sm font-bold text-slate-700 mb-1">
                      Description de votre activité
                    </label>
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
          </div>

          {/* Card 2: Your Partners */}
          <fieldset>
            <div className="bg-white rounded-xl shadow-lg p-6 md:p-8 border border-slate-200">
                <div className="mb-6">
                    <h2 className="text-xl font-bold text-slate-800">2. Vos Partenaires</h2>
                    <p className="text-slate-500 mt-1">Définissez la zone et le volume de votre recherche.</p>
                </div>
                <div className="space-y-5">
                    <div>
                        <label htmlFor="radius" className="block text-sm font-bold text-slate-700 mb-1">
                            Périmètre de recherche
                        </label>
                        <select
                            id="radius"
                            value={radius}
                            onChange={(e) => setRadius(Number(e.target.value))}
                            className="mt-1 block w-full px-4 py-2 border border-slate-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 transition bg-white"
                        >
                            <option value="5">5 km</option>
                            <option value="10">10 km</option>
                            <option value="20">20 km</option>
                            <option value="50">50 km</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">
                            Nombre d'entreprises à traiter
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {linkCountOptions.map((option) => (
                                <button
                                    type="button"
                                    key={option.value}
                                    onClick={() => setLinkCount(option.value)}
                                    className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-200 border-2 ${
                                        linkCount === option.value
                                            ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                                            : 'bg-white text-slate-700 border-slate-300 hover:border-blue-500 hover:text-blue-600'
                                    }`}
                                >
                                    {option.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
          </fieldset>
          
          <div className="flex justify-center pt-4">
            <button
              type="submit"
              disabled={isSubmitDisabled}
              className="w-full md:w-auto inline-flex items-center justify-center py-3 px-8 border border-transparent shadow-sm text-lg font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-slate-400 disabled:cursor-not-allowed transition duration-300"
            >
              LET'S GOO
            </button>
          </div>
        </form>
      </div>
    </>
  );
};

export default UserInputForm;