import React from 'react';
import { GlobalCompanyFeed } from './GlobalCompanyFeed';
import { CeoCommandInput } from './CeoCommandInput';
import { useCompanyFeedStore } from '../../../store/useCompanyFeedStore';
import { ChevronRight, PanelRightOpen, Radio } from 'lucide-react';

interface OfficeRightSidebarProps {
  onSelectEmployee?: (employeeId: string) => void;
  onSelectTask?: (taskId: string) => void;
}

export const OfficeRightSidebar: React.FC<OfficeRightSidebarProps> = ({
  onSelectEmployee,
  onSelectTask,
}) => {
  const { isRightSidebarOpen, toggleRightSidebar } = useCompanyFeedStore();

  if (!isRightSidebarOpen) {
    return (
      <div className="absolute top-4 right-4 z-30">
        <button
          onClick={toggleRightSidebar}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#171A21]/90 hover:bg-[#1E222B] border border-[#2A2F3A] text-[#E6E8EC] backdrop-blur-md shadow-xl transition-all hover:border-emerald-500/50 group"
          title="Open Global Company Feed & CEO Directives"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <Radio className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
          <span className="text-xs font-semibold tracking-wide">Company Feed & CEO Command</span>
          <PanelRightOpen className="w-3.5 h-3.5 text-[#9AA1AF]" />
        </button>
      </div>
    );
  }

  return (
    <aside className="w-96 lg:w-[410px] h-full flex flex-col flex-shrink-0 bg-[#12141A] border-l border-[#242833] z-20 shadow-2xl relative transition-all duration-300">
      {/* Collapse Toggle Handle */}
      <button
        onClick={toggleRightSidebar}
        title="Collapse sidebar"
        className="absolute -left-3.5 top-5 z-30 p-1 rounded-full bg-[#1A1E29] border border-[#2C3242] text-[#9AA1AF] hover:text-white hover:bg-[#252B3B] transition-colors shadow-md"
      >
        <ChevronRight className="w-3.5 h-3.5" />
      </button>

      {/* Main Upper Area: Global Company Activity Feed */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <GlobalCompanyFeed
          onSelectEmployee={onSelectEmployee}
          onSelectTask={onSelectTask}
        />
      </div>

      {/* Bottom Area: CEO Command Input */}
      <div className="flex-shrink-0">
        <CeoCommandInput />
      </div>
    </aside>
  );
};

