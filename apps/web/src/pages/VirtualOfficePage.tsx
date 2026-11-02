import React, { useState } from 'react';
import { OfficeScene } from '../components/office/OfficeScene';
import { OfficeControlsOverlay } from '../components/office/OfficeControlsOverlay';
import { AgentChatDrawer } from '../components/chat/AgentChatDrawer';
import { useCompanyStore } from '../store/useCompanyStore';
import { Employee } from '@vac/shared';

export const VirtualOfficePage: React.FC = () => {
  const { employees } = useCompanyStore();
  const [activeChatEmployee, setActiveChatEmployee] = useState<Employee | null>(null);

  const handleSelectAgent = (employeeId: string) => {
    const found = employees.find((e) => e.id === employeeId);
    if (found) {
      setActiveChatEmployee(found);
    }
  };

  return (
    <div className="w-full h-full relative overflow-hidden select-none">
      <OfficeScene onSelectAgent={handleSelectAgent} />
      <OfficeControlsOverlay />

      {/* Interactive Agent Chat Drawer from 3D scene selection */}
      <AgentChatDrawer
        employee={activeChatEmployee}
        isOpen={Boolean(activeChatEmployee)}
        onClose={() => setActiveChatEmployee(null)}
      />
    </div>
  );
};
