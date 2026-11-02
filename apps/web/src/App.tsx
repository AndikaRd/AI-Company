import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from './components/layout/MainLayout';
import { DashboardPage } from './pages/DashboardPage';
import { EmployeesPage } from './pages/EmployeesPage';
import { HierarchyPage } from './pages/HierarchyPage';
import { TasksPage } from './pages/TasksPage';
import { SettingsPage } from './pages/SettingsPage';

// Code-split 3D Virtual Office to isolate Three.js & R3F bundle chunk
const VirtualOfficePage = React.lazy(() =>
  import('./pages/VirtualOfficePage').then((m) => ({ default: m.VirtualOfficePage })),
);

const OfficeLoadingFallback: React.FC = () => (
  <div className="w-full h-full flex flex-col items-center justify-center bg-[#070b14] text-slate-400 font-mono text-xs space-y-3">
    <div className="w-8 h-8 rounded-full border-2 border-cyan-500/30 border-t-cyan-400 animate-spin" />
    <span>Mounting 3D Isometric Virtual Office...</span>
  </div>
);

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<DashboardPage />} />
          <Route
            path="office"
            element={
              <Suspense fallback={<OfficeLoadingFallback />}>
                <VirtualOfficePage />
              </Suspense>
            }
          />
          <Route path="employees" element={<EmployeesPage />} />
          <Route path="hierarchy" element={<HierarchyPage />} />
          <Route path="tasks" element={<TasksPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default App;
