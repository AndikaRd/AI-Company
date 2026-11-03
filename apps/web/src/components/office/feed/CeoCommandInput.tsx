import React, { useState, useEffect } from 'react';
import {
  CeoTargetType,
  CeoCommandPayload,
} from '@vac/shared';
import { useCompanyStore } from '../../../store/useCompanyStore';
import { useCompanyFeedStore } from '../../../store/useCompanyFeedStore';
import {
  Send,
  Building2,
  Users,
  UserCheck,
  CheckCircle2,
  AlertCircle,
  History,
  Sparkles,
  Loader2,
  CornerDownLeft,
} from 'lucide-react';

const SUGGESTIONS = [
  {
    label: "Elena: Operating Plan",
    targetType: 'COMPANY' as CeoTargetType,
    text: "Elena, coordinate the team to prepare this month's operating plan.",
  },
  {
    label: "Marcus: Architecture Review",
    targetType: 'DEPARTMENT' as CeoTargetType,
    deptKeyword: 'tech',
    text: "Marcus, review the current VAC architecture and identify technical risks.",
  },
  {
    label: "Alex: Implement Task",
    targetType: 'EMPLOYEE' as CeoTargetType,
    empKeyword: 'alex',
    text: "Alex, implement the approved engineering task.",
  },
];

export const CeoCommandInput: React.FC = () => {
  const { employees, departments } = useCompanyStore();
  const {
    commandStatus,
    lastDispatchedCommand,
    commandError,
    commandHistory,
    isHistoryOpen,
    dispatchCeoCommand,
    fetchCommandHistory,
    toggleHistory,
    clearCommandState,
  } = useCompanyFeedStore();

  const [targetType, setTargetType] = useState<CeoTargetType>('COMPANY');
  const [selectedTargetId, setSelectedTargetId] = useState<string>('');
  const [instruction, setInstruction] = useState<string>('');
  const [showSuggestions, setShowSuggestions] = useState<boolean>(false);

  useEffect(() => {
    fetchCommandHistory();
  }, [fetchCommandHistory]);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!instruction.trim() || commandStatus === 'sending') return;

    let targetId: string | undefined = undefined;
    let targetName = 'Entire Company (Nexus AI Dynamics)';

    if (targetType === 'DEPARTMENT') {
      const dept = departments.find((d) => d.id === selectedTargetId) || departments[0];
      targetId = dept?.id;
      targetName = dept?.name || 'Department Lead';
    } else if (targetType === 'EMPLOYEE') {
      const emp = employees.find((e) => e.id === selectedTargetId) || employees[0];
      targetId = emp?.id;
      targetName = emp ? `${emp.firstName} ${emp.lastName}` : 'Assigned Employee';
    }

    const payload: CeoCommandPayload = {
      targetType,
      targetId,
      targetName,
      instruction: instruction.trim(),
    };

    const res = await dispatchCeoCommand(payload);
    if (res) {
      setInstruction('');
      setShowSuggestions(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const applySuggestion = (s: typeof SUGGESTIONS[0]) => {
    setTargetType(s.targetType);
    setInstruction(s.text);

    if (s.targetType === 'DEPARTMENT' && s.deptKeyword) {
      const matchedDept = departments.find((d) =>
        d.name.toLowerCase().includes(s.deptKeyword),
      );
      if (matchedDept) setSelectedTargetId(matchedDept.id);
    } else if (s.targetType === 'EMPLOYEE' && s.empKeyword) {
      const matchedEmp = employees.find(
        (e) =>
          e.firstName.toLowerCase().includes(s.empKeyword) ||
          e.lastName.toLowerCase().includes(s.empKeyword),
      );
      if (matchedEmp) setSelectedTargetId(matchedEmp.id);
    }

    setShowSuggestions(false);
  };

  return (
    <div className="flex flex-col bg-[#161922] border-t border-[#252A37] relative">
      {/* Directive History Drawer (Collapsible) */}
      {isHistoryOpen && (
        <div className="max-h-60 overflow-y-auto border-b border-[#252A37] bg-[#111319] p-3 text-xs divide-y divide-[#1F2430]">
          <div className="flex items-center justify-between pb-2 mb-1">
            <span className="font-semibold text-stone-300 flex items-center gap-1.5">
              <History className="w-3.5 h-3.5 text-emerald-400" />
              Past CEO Directives ({commandHistory.length})
            </span>
            <button
              onClick={toggleHistory}
              className="text-[10px] text-stone-400 hover:text-white"
            >
              Close
            </button>
          </div>
          {commandHistory.length === 0 ? (
            <p className="text-[#6B7280] py-3 text-center">No past directives yet.</p>
          ) : (
            commandHistory.map((cmd) => (
              <div key={cmd.id} className="py-2 space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-semibold text-emerald-400">
                    To: {cmd.targetName || cmd.targetType}
                  </span>
                  <span
                    className={`px-1.5 py-0.5 rounded text-[9px] font-mono ${
                      cmd.status === 'COMPLETED'
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : cmd.status === 'ACKNOWLEDGED' || cmd.status === 'IN_PROGRESS'
                        ? 'bg-blue-500/20 text-blue-400'
                        : 'bg-stone-500/20 text-stone-400'
                    }`}
                  >
                    {cmd.status}
                  </span>
                </div>
                <p className="text-stone-300 font-mono text-[11px] bg-[#171B24] p-1.5 rounded border border-[#232835]">
                  "{cmd.instruction}"
                </p>
                {cmd.response && (
                  <p className="text-[10px] text-stone-400 pl-2 border-l border-emerald-500/40 italic">
                    {cmd.response}
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Target Selector & History Header */}
      <div className="px-3 pt-2.5 pb-2 flex items-center justify-between gap-2 border-b border-[#212634]">
        {/* Target Category Selector */}
        <div className="flex items-center gap-1 bg-[#1A1E29] p-0.5 rounded-lg border border-[#272D3C]">
          <button
            type="button"
            onClick={() => setTargetType('COMPANY')}
            className={`flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium transition-all ${
              targetType === 'COMPANY'
                ? 'bg-emerald-600 text-white font-semibold shadow-sm'
                : 'text-[#9AA1AF] hover:text-white'
            }`}
          >
            <Building2 className="w-3 h-3" />
            <span>Company</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setTargetType('DEPARTMENT');
              if (!selectedTargetId && departments.length > 0) {
                setSelectedTargetId(departments[0].id);
              }
            }}
            className={`flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium transition-all ${
              targetType === 'DEPARTMENT'
                ? 'bg-emerald-600 text-white font-semibold shadow-sm'
                : 'text-[#9AA1AF] hover:text-white'
            }`}
          >
            <Users className="w-3 h-3" />
            <span>Dept</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setTargetType('EMPLOYEE');
              if (!selectedTargetId && employees.length > 0) {
                setSelectedTargetId(employees[0].id);
              }
            }}
            className={`flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium transition-all ${
              targetType === 'EMPLOYEE'
                ? 'bg-emerald-600 text-white font-semibold shadow-sm'
                : 'text-[#9AA1AF] hover:text-white'
            }`}
          >
            <UserCheck className="w-3 h-3" />
            <span>Employee</span>
          </button>
        </div>

        {/* Dynamic Specific Recipient Sub-Selector */}
        {targetType === 'DEPARTMENT' && (
          <select
            value={selectedTargetId}
            onChange={(e) => setSelectedTargetId(e.target.value)}
            className="flex-1 bg-[#1A1E29] text-white text-[11px] px-2 py-1 rounded-lg border border-[#272D3C] focus:outline-none focus:border-emerald-500"
          >
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        )}

        {targetType === 'EMPLOYEE' && (
          <select
            value={selectedTargetId}
            onChange={(e) => setSelectedTargetId(e.target.value)}
            className="flex-1 bg-[#1A1E29] text-white text-[11px] px-2 py-1 rounded-lg border border-[#272D3C] focus:outline-none focus:border-emerald-500 truncate"
          >
            {employees.map((e) => (
              <option key={e.id} value={e.id}>
                {e.firstName} {e.lastName} ({e.jobTitle || e.role})
              </option>
            ))}
          </select>
        )}

        {/* Command History & Suggestions Toggle Buttons */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setShowSuggestions(!showSuggestions)}
            title="Quick executive prompt templates"
            className={`p-1.5 rounded-md transition-colors ${
              showSuggestions
                ? 'bg-emerald-600 text-white'
                : 'text-[#9AA1AF] hover:text-white hover:bg-[#202534]'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={toggleHistory}
            title="View directive history"
            className={`p-1.5 rounded-md transition-colors ${
              isHistoryOpen
                ? 'bg-emerald-600 text-white'
                : 'text-[#9AA1AF] hover:text-white hover:bg-[#202534]'
            }`}
          >
            <History className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Suggestion Quick Chips */}
      {showSuggestions && (
        <div className="px-3 py-2 bg-[#141720] border-b border-[#212634] flex flex-col gap-1.5 animate-fadeIn">
          <span className="text-[10px] uppercase font-semibold tracking-wider text-emerald-400">
            Executive Directives Quick Templates
          </span>
          <div className="flex flex-col gap-1">
            {SUGGESTIONS.map((s, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => applySuggestion(s)}
                className="text-left px-2.5 py-1.5 rounded-md bg-[#1B1F2A] hover:bg-[#232938] border border-[#293042] text-[11px] text-stone-300 hover:text-white flex items-center justify-between group transition-colors"
              >
                <span className="truncate pr-2">{s.text}</span>
                <span className="text-[9px] text-[#6B7280] group-hover:text-emerald-400 font-mono whitespace-nowrap">
                  {s.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* CEO Input Area */}
      <form onSubmit={handleSubmit} className="p-3">
        <div className="relative">
          <textarea
            value={instruction}
            onChange={(e) => setInstruction(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              targetType === 'COMPANY'
                ? "Direct the entire company (e.g. Elena, coordinate the team to prepare this month's operating plan)..."
                : targetType === 'DEPARTMENT'
                ? "Instruct department lead (e.g. Marcus, review the current VAC architecture and identify technical risks)..."
                : "Instruct specific employee (e.g. Alex, implement the approved engineering task)..."
            }
            rows={2}
            className="w-full pl-3 pr-10 py-2.5 bg-[#1B1F2B] border border-[#2D3344] focus:border-emerald-500 rounded-xl text-xs text-stone-100 placeholder-[#6B7280] focus:outline-none resize-none transition-all leading-relaxed"
          />

          <button
            type="submit"
            disabled={!instruction.trim() || commandStatus === 'sending'}
            className={`absolute right-2 bottom-3 p-2 rounded-lg transition-all ${
              instruction.trim() && commandStatus !== 'sending'
                ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-md active:scale-95'
                : 'bg-[#252B3B] text-[#555E70] cursor-not-allowed'
            }`}
          >
            {commandStatus === 'sending' ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Send className="w-3.5 h-3.5" />
            )}
          </button>
        </div>

        {/* Footer Status Indicators */}
        <div className="mt-2 flex items-center justify-between text-[11px]">
          <div className="flex items-center gap-1.5">
            {commandStatus === 'idle' && (
              <span className="text-[#6B7280] flex items-center gap-1 text-[10px]">
                <CornerDownLeft className="w-3 h-3 text-[#555E70]" />
                Press Enter to dispatch CEO command
              </span>
            )}
            {commandStatus === 'sending' && (
              <span className="text-amber-400 flex items-center gap-1 font-medium text-[10px]">
                <Loader2 className="w-3 h-3 animate-spin" />
                Routing directive to executive agents...
              </span>
            )}
            {commandStatus === 'acknowledged' && (
              <span className="text-emerald-400 flex items-center gap-1 font-medium text-[10px] animate-fadeIn">
                <CheckCircle2 className="w-3 h-3" />
                Acknowledged by {lastDispatchedCommand?.targetName || 'team'}
              </span>
            )}
            {commandStatus === 'in_progress' && (
              <span className="text-blue-400 flex items-center gap-1 font-medium text-[10px]">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-ping" />
                Task dispatched & executing in office
              </span>
            )}
            {commandStatus === 'failed' && (
              <span className="text-rose-400 flex items-center gap-1 font-medium text-[10px]">
                <AlertCircle className="w-3 h-3" />
                {commandError || 'Failed to dispatch command'}
              </span>
            )}
          </div>

          {(commandStatus === 'acknowledged' ||
            commandStatus === 'in_progress' ||
            commandStatus === 'failed') && (
            <button
              type="button"
              onClick={clearCommandState}
              className="text-[10px] text-[#8C93A3] hover:text-white underline"
            >
              Dismiss
            </button>
          )}
        </div>
      </form>
    </div>
  );
};
