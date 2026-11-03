import React, { useState, useEffect } from 'react';
import { OfficeMap2D } from '../components/office/OfficeMap2D';
import { OfficeScene } from '../components/office/OfficeScene';
import { OfficeControlsOverlay } from '../components/office/OfficeControlsOverlay';
import { OfficeMinimap } from '../components/office/OfficeMinimap';
import { EmployeeInteractionPanel } from '../components/office/EmployeeInteractionPanel';
import { AgentChatDrawer } from '../components/chat/AgentChatDrawer';
import { EmployeeMemoryDrawer } from '../components/employees/EmployeeMemoryDrawer';
import { OfficeRightSidebar } from '../components/office/feed/OfficeRightSidebar';
import { OFFICE_FACILITY_COORDINATES } from '../components/office/officeSpatialCoordinates';
import { useCompanyStore } from '../store/useCompanyStore';
import { useOfficeStore } from '../store/useOfficeStore';
import { useOfficeSocket } from '../hooks/useOfficeSocket';
import { Employee } from '@vac/shared';
import { Map, Box } from 'lucide-react';

export const VirtualOfficePage: React.FC = () => {
  const { employees, fetchData, fetchEmployees } = useCompanyStore();
  const { setCameraMode, focusPosition } = useOfficeStore();
  const [viewMode, setViewMode] = useState<'2d' | '3d'>('2d');
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [activeChatEmployee, setActiveChatEmployee] = useState<Employee | null>(null);
  const [activeMemoryEmployee, setActiveMemoryEmployee] = useState<Employee | null>(null);

  // 1. Initial REST data load independent of WebSockets
  useEffect(() => {
    fetchData();
    fetchEmployees();
  }, [fetchData, fetchEmployees]);

  // Handle URL query parameters for direct employee inspection (e.g. ?employee=alex), view mode (?view=3d), and camera (?camera=explore)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const viewParam = params.get('view');
    if (viewParam === '3d' || viewParam === '2d') {
      setViewMode(viewParam);
    }

    const cameraParam = params.get('camera');
    if (cameraParam === 'explore' || cameraParam === 'overview') {
      setCameraMode(cameraParam);
    }

    const empParam = params.get('employee');
    if (empParam && employees.length > 0) {
      const lower = empParam.toLowerCase();
      const found = employees.find(
        (e) =>
          e.id === empParam ||
          e.firstName.toLowerCase().includes(lower) ||
          e.lastName.toLowerCase().includes(lower) ||
          (e.employeeCode && e.employeeCode.toLowerCase().includes(lower)),
      );
      if (found) {
        setSelectedEmployee(found);
      }
    }
  }, [employees, setCameraMode]);

  // 2. Initialize Socket.IO connection and real-time activity synchronization
  useOfficeSocket();

  const handleSelectAgent = (employeeId: string) => {
    const found = employees.find((e) => e.id === employeeId);
    if (found) {
      setSelectedEmployee(found);

      // In 3D mode, glide camera focus towards their workstation
      if (viewMode === '3d') {
        const fac = Object.values(OFFICE_FACILITY_COORDINATES).find(
          (f) => f.assignedEmployeeCode === found.employeeCode,
        );
        if (fac) {
          focusPosition(
            [fac.position[0], fac.position[1] + 4, fac.position[2] + 8],
            `${found.firstName} Workstation`,
          );
        }
      }
    }
  };

  return (
    <div className="w-full h-full flex flex-row overflow-hidden select-none bg-[#0F1115]">
      {/* ============================================================ */}
      {/* CENTER: 3D Living Virtual Office or 2D Architectural Map      */}
      {/* ============================================================ */}
      <div className="flex-1 h-full relative overflow-hidden min-w-0">
        {/* View Mode Switcher Toggle: 2D Floorplan (Default) vs 3D Experimental */}
        <div className="absolute top-4 left-4 z-30 flex items-center p-1 rounded-xl bg-[#171A21]/90 border border-[#2A2F3A] backdrop-blur-md shadow-lg">
          <button
            onClick={() => setViewMode('2d')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              viewMode === '2d'
                ? 'bg-[#10B981] text-white shadow-sm'
                : 'text-[#9AA1AF] hover:text-[#E6E8EC] hover:bg-[#1E222B]'
            }`}
          >
            <Map className="w-3.5 h-3.5" />
            <span>2D Map</span>
          </button>
          <button
            onClick={() => setViewMode('3d')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              viewMode === '3d'
                ? 'bg-[#10B981] text-white shadow-sm'
                : 'text-[#9AA1AF] hover:text-[#E6E8EC] hover:bg-[#1E222B]'
            }`}
          >
            <Box className="w-3.5 h-3.5" />
            <span>3D (Eksperimental)</span>
          </button>
        </div>

        {/* Render 2D Top-Down Vector Map or 3D Scene */}
        {viewMode === '2d' ? (
          <OfficeMap2D
            onSelectEmployee={handleSelectAgent}
            selectedEmployeeId={selectedEmployee?.id}
          />
        ) : (
          <>
            {/* 3D Isometric Virtual Office Scene */}
            <OfficeScene onSelectAgent={handleSelectAgent} />
            {/* Floating Camera & Visual Controls Overlay */}
            <OfficeControlsOverlay />
            {/* Live Architectural Floorplan Minimap */}
            <OfficeMinimap onSelectEmployee={handleSelectAgent} />
          </>
        )}
      </div>

      {/* ============================================================ */}
      {/* RIGHT: Persistent Global Company Feed & CEO Command Input    */}
      {/* ============================================================ */}
      <OfficeRightSidebar
        onSelectEmployee={handleSelectAgent}
        onSelectTask={(taskId) => {
          console.log('[VirtualOffice] Selected task from feed:', taskId);
        }}
      />

      {/* ============================================================ */}
      {/* Overlays & Drawers                                           */}
      {/* ============================================================ */}

      {/* Real-time Employee Interaction Panel */}
      <EmployeeInteractionPanel
        employee={selectedEmployee}
        isOpen={Boolean(selectedEmployee)}
        onClose={() => setSelectedEmployee(null)}
        onOpenChat={(emp) => {
          setSelectedEmployee(null);
          setActiveChatEmployee(emp);
        }}
        onOpenMemory={(emp) => {
          setSelectedEmployee(null);
          setActiveMemoryEmployee(emp);
        }}
      />

      {/* Interactive Agent Chat Drawer */}
      <AgentChatDrawer
        employee={activeChatEmployee}
        isOpen={Boolean(activeChatEmployee)}
        onClose={() => setActiveChatEmployee(null)}
      />

      {/* Employee Cognitive Memory Drawer */}
      <EmployeeMemoryDrawer
        employee={activeMemoryEmployee}
        isOpen={Boolean(activeMemoryEmployee)}
        onClose={() => setActiveMemoryEmployee(null)}
      />
    </div>
  );
};
