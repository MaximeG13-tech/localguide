import React, { useState, useEffect } from 'react';
import { XMarkIcon } from './Icons';
import { gmbCategories } from '../data/gmbCategories';

interface CategorySelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (selectedCategories: string[]) => void;
  onRegenerate: () => void;
  suggestions: string[];
  isRegenerating: boolean;
}

const CategorySelectionModal: React.FC<CategorySelectionModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  onRegenerate,
  suggestions,
  isRegenerating
}) => {
  const [currentCategories, setCurrentCategories] = useState<string[]>([]);
  const [newCategory, setNewCategory] = useState('');
  const [autocompleteSuggestions, setAutocompleteSuggestions] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen) {
      setCurrentCategories(suggestions);
    }
  }, [suggestions, isOpen]);
  
  if (!isOpen) return null;

  const handleDelete = (categoryToDelete: string) => {
    setCurrentCategories(prev => prev.filter(c => c !== categoryToDelete));
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setNewCategory(value);

    if (value.trim()) {
        const filtered = gmbCategories
            .filter(cat => cat.toLowerCase().includes(value.toLowerCase()))
            .slice(0, 7); // Limit to 7 suggestions
        setAutocompleteSuggestions(filtered);
    } else {
        setAutocompleteSuggestions([]);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    if (suggestion.trim() && !currentCategories.includes(suggestion.trim())) {
      setCurrentCategories(prev => [...prev, suggestion.trim()]);
    }
    setNewCategory('');
    setAutocompleteSuggestions([]);
  };

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    handleSuggestionClick(newCategory);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentCategories.length > 0) {
      onSubmit(currentCategories);
    }
  };
  
  const isSubmitDisabled = currentCategories.length === 0;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4 transition-opacity"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="category-modal-title"
    >
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-slate-200">
          <h3 id="category-modal-title" className="text-xl font-bold text-slate-800">Validez les types de partenaires</h3>
          <p className="text-sm text-slate-500 mt-1">Affinez la liste des "rapporteurs d'affaires" à inclure dans votre guide.</p>
        </div>
        <div className="p-6 md:p-8 space-y-6 overflow-y-auto flex-1">
          <fieldset>
            <legend className="block text-base font-semibold text-slate-800 mb-3">
              Suggestions de partenaires
            </legend>
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 min-h-[120px]">
              <div className="flex flex-wrap gap-2.5">
                {currentCategories.map(s => (
                  <span key={s} className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-semibold rounded-full bg-blue-100 text-blue-800 border-2 border-blue-200">
                    {s}
                    <button
                      type="button"
                      onClick={() => handleDelete(s)}
                      className="text-blue-600 hover:text-blue-900 hover:bg-blue-200 rounded-full p-0.5 transition-colors"
                      aria-label={`Supprimer ${s}`}
                    >
                      <XMarkIcon className="h-4 w-4" />
                    </button>
                  </span>
                ))}
                 {currentCategories.length === 0 && !isRegenerating && (
                    <div className="text-sm text-slate-500 w-full text-center py-2">La liste est vide. Ajoutez des catégories ou générez de nouvelles suggestions.</div>
                )}
                {isRegenerating && (
                     <div className="text-sm text-slate-500 w-full text-center py-2">Génération de suggestions...</div>
                )}
              </div>
            </div>
          </fieldset>
          
          <form onSubmit={handleAddCategory} className="space-y-2">
            <label htmlFor="add-category" className="block text-base font-semibold text-slate-800">
              Ajouter une catégorie manuellement
            </label>
            <div className="flex gap-2">
              <div className="flex-grow">
                  <input
                    id="add-category"
                    type="text"
                    value={newCategory}
                    onChange={handleInputChange}
                    onFocus={handleInputChange}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 transition"
                    placeholder="Ex: Architectes d'intérieur"
                    autoComplete="off"
                  />
                  {autocompleteSuggestions.length > 0 && (
                    <ul className="w-full bg-white border border-slate-300 rounded-lg shadow-lg mt-1 max-h-60 overflow-y-auto">
                      {autocompleteSuggestions.map((suggestion, index) => (
                        <li
                          key={`${suggestion}-${index}`}
                          className="px-4 py-2 cursor-pointer hover:bg-slate-100"
                          onMouseDown={(e) => {
                              e.preventDefault(); 
                              handleSuggestionClick(suggestion);
                          }}
                        >
                          {suggestion}
                        </li>
                      ))}
                    </ul>
                  )}
              </div>
              <button
                type="submit"
                className="px-5 py-2 bg-slate-700 text-white font-semibold rounded-lg hover:bg-slate-800 transition shadow-sm disabled:bg-slate-400"
                disabled={!newCategory.trim()}
              >
                Ajouter
              </button>
            </div>
          </form>
          
          <div>
             <button
                type="button"
                onClick={onRegenerate}
                disabled={isRegenerating}
                className="w-full text-center px-5 py-2 border border-blue-600 text-sm font-medium rounded-lg text-blue-600 bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-300 disabled:opacity-50"
              >
                {isRegenerating ? 'Génération en cours...' : 'Générer de nouvelles suggestions'}
              </button>
          </div>
        </div>
        <div className="p-4 bg-slate-100 border-t border-slate-200 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="px-5 py-2 bg-white border border-slate-300 text-slate-800 font-semibold rounded-lg hover:bg-slate-50 transition shadow-sm">
            Annuler
          </button>
          <button 
              type="button"
              onClick={handleSubmit}
              className="px-5 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition shadow-sm disabled:bg-slate-400 disabled:cursor-not-allowed"
              disabled={isSubmitDisabled}
          >
            {`Lancer la recherche (${currentCategories.length})`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CategorySelectionModal;