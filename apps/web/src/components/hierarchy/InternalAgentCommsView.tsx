import React, { useState, useEffect } from 'react';
import { AgentMessage, AgentMessageType } from '@vac/shared';
import { api } from '../../services/api';
import {
  MessageSquare,
  ArrowRight,
  RefreshCw,
  GitPullRequest,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Hash,
  Clock,
} from 'lucide-react';
import { clsx } from 'clsx';

export const InternalAgentCommsView: React.FC = () => {
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<string>('ALL');

  const loadMessages = async () => {
    setIsLoading(true);
    try {
      const data = await api.getRecentAgentMessages(50);
      setMessages(data);
    } catch (err) {
      console.error('Failed to load agent messages:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMessages();
  }, []);

  const filteredMessages = messages.filter((m) => {
    if (selectedType === 'ALL') return true;
    return m.messageType === selectedType;
  });

  const getMessageTypeBadge = (type: AgentMessageType) => {
    switch (type) {
      case 'TASK_DELEGATION':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-amber-500/10 text-amber-300 border border-amber-500/30 flex items-center gap-1">
            <GitPullRequest className="w-2.5 h-2.5" />
            <span>DELEGATION</span>
          </span>
        );
      case 'TASK_ACCEPTED':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
            <CheckCircle2 className="w-2.5 h-2.5" />
            <span>ACCEPTED</span>
          </span>
        );
      case 'TASK_REJECTED':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-rose-500/10 text-rose-300 border border-rose-500/30 flex items-center gap-1">
            <XCircle className="w-2.5 h-2.5" />
            <span>REJECTED</span>
          </span>
        );
      case 'QUERY':
      case 'RESPONSE':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 flex items-center gap-1">
            <HelpCircle className="w-2.5 h-2.5" />
            <span>{type}</span>
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-slate-700 text-slate-300 border border-slate-600">
            {type}
          </span>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-surface-elevated/40 p-4 rounded-xl border border-surface-border">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          {['ALL', 'TASK_DELEGATION', 'TASK_ACCEPTED', 'TASK_REJECTED', 'DIRECT_MESSAGE'].map(
            (type) => (
              <button
                key={type}
                onClick={() => setSelectedType(type)}
                className={clsx(
                  'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors shrink-0',
                  selectedType === type
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800',
                )}
              >
                {type === 'ALL' ? 'All Communications' : type.replace(/_/g, ' ')}
              </button>
            ),
          )}
        </div>

        <button
          onClick={loadMessages}
          disabled={isLoading}
          className="px-3 py-1.5 rounded-lg bg-surface border border-surface-border text-xs text-slate-300 hover:text-white flex items-center gap-1.5 self-start sm:self-auto transition-colors"
        >
          <RefreshCw className={clsx('w-3.5 h-3.5', isLoading && 'animate-spin')} />
          <span>Refresh Feed</span>
        </button>
      </div>

      {/* Messages Feed */}
      {filteredMessages.length === 0 ? (
        <div className="text-center py-16 bg-surface-elevated/40 rounded-xl border border-surface-border text-slate-400">
          <MessageSquare className="w-8 h-8 mx-auto text-slate-500 mb-2 opacity-50" />
          <p className="text-sm">No agent communications recorded yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredMessages.map((msg) => (
            <div
              key={msg.id}
              className="p-4 rounded-xl bg-surface border border-surface-border hover:border-slate-600 transition-all space-y-2.5"
            >
              {/* Message Header */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  {getMessageTypeBadge(msg.messageType)}

                  {/* Sender -> Recipient */}
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-white">
                    <span className="text-cyan-400">
                      {msg.senderEmployee
                        ? `${msg.senderEmployee.firstName} ${msg.senderEmployee.lastName}`
                        : 'Sender'}
                    </span>
                    <ArrowRight className="w-3 h-3 text-slate-500" />
                    <span className="text-indigo-400">
                      {msg.recipientEmployee
                        ? `${msg.recipientEmployee.firstName} ${msg.recipientEmployee.lastName}`
                        : 'Recipient'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-[11px] font-mono text-slate-400">
                  <span className="flex items-center gap-1 bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700/80">
                    <Hash className="w-3 h-3 text-slate-500" />
                    <span className="truncate max-w-[120px]" title={msg.correlationId}>
                      {msg.correlationId.slice(0, 8)}...
                    </span>
                  </span>
                  <span className="flex items-center gap-1 text-slate-500">
                    <Clock className="w-3 h-3" />
                    <span>{new Date(msg.createdAt).toLocaleTimeString()}</span>
                  </span>
                </div>
              </div>

              {/* Message Content */}
              <div className="text-xs sm:text-sm text-slate-300 font-sans leading-relaxed bg-surface-elevated/50 p-3 rounded-lg border border-surface-border/50">
                {msg.content}
              </div>

              {/* Payload metadata if present */}
              {msg.payload && Object.keys(msg.payload).length > 0 && (
                <div className="text-[11px] font-mono bg-[#070b14] p-2.5 rounded border border-slate-800 text-slate-400 overflow-x-auto">
                  <span className="text-slate-500 select-none">// Workflow Payload: </span>
                  {JSON.stringify(msg.payload)}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
