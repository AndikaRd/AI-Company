import React, { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopNav } from './TopNav';
import { useCompanyStore } from '../../store/useCompanyStore';

export const MainLayout: React.FC = () => {
  const { fetchData } = useCompanyStore();

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => {
      fetchData();
    }, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background text-primary-text font-sans">
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0 h-screen overflow-hidden">
        <TopNav />
        <main className="flex-1 relative overflow-hidden bg-background">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
