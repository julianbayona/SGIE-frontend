import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from '@/components/layout/Header';
import Sidebar from '@/components/layout/Sidebar';

const MainLayout: React.FC = () => {
  return (
    <div className="bg-background text-on-background">
      <Sidebar />
      <Header />
      <main className="ml-64 pt-16 pb-6 min-h-screen bg-[#F8F7F4]">
        <div className="max-w-[1600px] mx-auto px-8 py-6 space-y-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default MainLayout;
