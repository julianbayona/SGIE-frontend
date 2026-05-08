import React from 'react';
import UserMenu from '@/components/auth/UserMenu';

const Header: React.FC = () => {
  return (
    <header className="flex justify-between items-center h-16 px-8 ml-64 w-[calc(100%-16rem)] bg-stone-50/90 backdrop-blur-md shadow-sm fixed top-0 z-30 border-b border-outline-variant/10">
      <div className="flex items-center flex-1 max-w-xl">
        <div className="relative w-full focus-within:ring-1 focus-within:ring-primary-gold/20 rounded">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 text-lg">
            search
          </span>
          <input
            className="w-full bg-surface-container-low border-none rounded py-2 pl-10 pr-4 text-sm focus:ring-0 placeholder-stone-400"
            placeholder="Buscar cliente, evento o cotización..."
            type="text"
          />
        </div>
      </div>
      <div className="flex items-center gap-6">
        <button className="text-stone-600 hover:text-primary-gold transition-colors relative">
          <span className="material-symbols-outlined">notifications</span>
          <span className="absolute top-0 right-0 w-2 h-2 bg-primary-gold rounded-full border-2 border-surface"></span>
        </button>
        <div className="h-8 w-px bg-stone-200/50"></div>
        <UserMenu />
      </div>
    </header>
  );
};

export default Header;
