import React, { useState } from 'react';
import { OfficeScene } from '../components/office/OfficeScene';
import { OfficeControlsOverlay } from '../components/office/OfficeControlsOverlay';
import { OfficeMinimap } from '../components/office/OfficeMinimap';
import { EmployeeInteractionPanel } from '../components/office/EmployeeInteractionPanel';
import { AgentChatDrawer } from '../components/chat/AgentChatDrawer';
import { EmployeeMemoryDrawer } from '../components/employees/EmployeeMemoryDrawer';
import { useCompanyStore } from '../store/useCompanyStore';
import { useOfficeSocket } from '../hooks/useOfficeSocket';
import { Employee } from '@vac/shared';

export const VirtualOfficePage: React.FC = () => {
  const { employees } = useCompanyStore();
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [activeChatEmployee, setActiveChatEmployee] = useState<Employee | null>(null);
  const [activeMemoryEmployee, setActiveMemoryEmployee] = useState<Employee | null>(null);

  // Initialize Socket.IO connection and real-time activity synchronization
  useOfficeSocket();

  const handleSelectAgent = (employeeId: string) => {
    const found = employees.find((e) => e.id === employeeId);
    if (found) {
      setSelectedEmployee(found);
    }
  };

  return (
    <div className="w-full h-full relative overflow-hidden select-none bg-[#070b14]">
      {/* 3D Isometric Virtual Office Scene */}
      <OfficeScene onSelectAgent={handleSelectAgent} />

      {/* Floating Camera & Visual Controls Overlay */}
      <OfficeControlsOverlay />

      {/* Live Minimap & Quick Department Navigation */}
      <OfficeMinimap onSelectEmployee={handleSelectAgent} />

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
