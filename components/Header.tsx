
import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="bg-white shadow-md">
      <div className="container mx-auto px-4 py-6 text-center">
        <h1 className="text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-teal-500">
          Générateur de Guide Local IA
        </h1>
        <p className="mt-2 text-slate-600">
          Créez des fiches d'entreprises optimisées pour votre annuaire local.
        </p>
      </div>
    </header>
  );
};

export default Header;
