import React, { useState, useEffect, useRef } from 'react';
import { Employee, ChatMessage } from '@vac/shared';
import { api } from '../../services/api';
import { Badge } from '../ui/Badge';
import {
  X,
  Send,
  Bot,
  User,
  Sparkles,
  Clock,
  ShieldCheck,
  Cpu,
  RefreshCw,
  AlertCircle,
  Code2,
} from 'lucide-react';

interface AgentChatDrawerProps {
  employee: Employee | null;
  isOpen: boolean;
  onClose: () => void;
}

export const AgentChatDrawer: React.FC<AgentChatDrawerProps> = ({
  employee,
  isOpen,
  onClose,
}) => {
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastExecutionMetrics, setLastExecutionMetrics] = useState<{
    durationMs?: number;
    model?: string;
    evalCount?: number;
  } | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom of chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen && employee) {
      loadEmployeeConversations();
    } else {
      setMessages([]);
      setActiveConversationId(null);
      setError(null);
    }
  }, [isOpen, employee?.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isSending]);

  const loadEmployeeConversations = async () => {
    if (!employee) return;
    setIsLoading(true);
    setError(null);
    try {
      const convs = await api.getConversations(employee.id);

      if (convs && convs.length > 0) {
        const latestConv = convs[0];
        setActiveConversationId(latestConv.id);
        const msgs = await api.getMessages(latestConv.id);
        setMessages(msgs);
      } else {
        setActiveConversationId(null);
        setMessages([]);
      }
    } catch (err: any) {
      console.error('Failed to load conversations:', err);
      setError('Failed to load conversation history from database.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (customText?: string) => {
    const textToSend = customText || inputValue.trim();
    if (!textToSend || !employee || isSending) return;

    setError(null);
    setInputValue('');
    setIsSending(true);

    // Optimistically add user message to list
    const tempUserMsg: ChatMessage = {
      id: `temp-${Date.now()}`,
      conversationId: activeConversationId || 'pending',
      senderType: 'USER',
      senderName: 'You (Supervisor)',
      content: textToSend,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, tempUserMsg]);

    try {
      const result = await api.sendChatMessage(employee.id, {
        message: textToSend,
        conversationId: activeConversationId || undefined,
        think: false,
      });

      if (!activeConversationId) {
        setActiveConversationId(result.conversationId);
      }

      setLastExecutionMetrics(result.executionMetrics);

      // Reload full verified message list from database
      const updatedMessages = await api.getMessages(result.conversationId);
      setMessages(updatedMessages);
    } catch (err: any) {
      console.error('Failed to send chat message:', err);
      setError(err.message || 'Error communicating with AI runtime. Please verify Ollama is running.');
    } finally {
      setIsSending(false);
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!isOpen || !employee) return null;

  const quickPrompts = [
    'Can you summarize the architecture of Virtual AI Company?',
    'What are your primary technical skills and responsibilities?',
    'Review our backend NestJS and Ollama integration status.',
  ];

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm transition-opacity">
      <div className="w-full max-w-2xl bg-surface border-l border-surface-border h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-surface-border bg-surface-elevated/70 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-bold shadow-glow-cyan">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold text-white">
                  {employee.firstName} {employee.lastName}
                </h3>
                <Badge variant="success" dot>
                  ONLINE
                </Badge>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  {employee.employeeCode}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-2">
                <span>{employee.role}</span>
                <span>•</span>
                <span className="text-cyan-400 font-mono text-[11px]">
                  {employee.agentConfig?.modelName || 'qwen3.5:4b'} ({employee.agentConfig?.provider || 'OLLAMA'})
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadEmployeeConversations}
              title="Refresh conversation"
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Runtime Context Bar */}
        <div className="px-4 py-2 bg-background/60 border-b border-surface-border flex items-center justify-between text-[11px] font-mono text-slate-400">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 text-slate-300">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              Autonomy: {employee.agentConfig?.autonomyLevel || 'SUPERVISED'}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Cpu className="w-3.5 h-3.5 text-cyan-400" />
              Workstation: {employee.workstationId || 'Unassigned'}
            </span>
          </div>

          {lastExecutionMetrics?.durationMs && (
            <span className="flex items-center gap-1 text-cyan-400 font-semibold">
              <Clock className="w-3 h-3" />
              {(lastExecutionMetrics.durationMs / 1000).toFixed(2)}s inference
            </span>
          )}
        </div>

        {/* Error Notification */}
        {error && (
          <div className="p-3 bg-red-950/40 border-b border-red-800/50 flex items-center gap-2 text-xs text-red-300">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span className="flex-1">{error}</span>
            <button
              onClick={() => setError(null)}
              className="text-red-400 hover:text-red-200 text-xs font-mono"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Messages Container */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-500 space-y-2">
              <RefreshCw className="w-6 h-6 animate-spin text-cyan-400" />
              <p className="text-xs">Connecting to Agent memory & history...</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center max-w-md mx-auto space-y-4 py-12">
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">
                  Direct Line with {employee.firstName}
                </h4>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Alex is a provisioned AI Employee running locally on Ollama. You can delegate software engineering tasks, ask technical questions, or review system architecture.
                </p>
              </div>

              {/* Quick Prompts */}
              <div className="w-full space-y-2 pt-2">
                <p className="text-[11px] font-mono text-slate-500 text-left">Suggested Questions:</p>
                {quickPrompts.map((prompt, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(prompt)}
                    className="w-full text-left p-2.5 rounded-lg bg-surface-elevated hover:bg-slate-800 border border-surface-border text-xs text-slate-300 hover:text-white transition-all flex items-center justify-between group"
                  >
                    <span>{prompt}</span>
                    <Send className="w-3 h-3 text-slate-500 group-hover:text-cyan-400 transition-colors" />
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg) => {
              const isUser = msg.senderType === 'USER';
              return (
                <div
                  key={msg.id}
                  className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
                >
                  {!isUser && (
                    <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 flex items-center justify-center shrink-0 mt-0.5">
                      <Bot className="w-4 h-4" />
                    </div>
                  )}

                  <div className={`max-w-[85%] space-y-1.5`}>
                    <div className="flex items-center gap-2 text-[10px] text-slate-400 px-1">
                      <span className="font-semibold text-slate-300">
                        {isUser ? 'You' : msg.senderName || employee.firstName}
                      </span>
                      <span>•</span>
                      <span>
                        {new Date(msg.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                      {msg.metadata?.durationMs && (
                        <span className="text-cyan-400 font-mono">
                          ({(msg.metadata.durationMs / 1000).toFixed(1)}s)
                        </span>
                      )}
                    </div>

                    <div
                      className={`p-3.5 rounded-xl text-xs sm:text-sm leading-relaxed whitespace-pre-wrap ${
                        isUser
                          ? 'bg-blue-600 text-white rounded-tr-none'
                          : 'bg-surface-elevated border border-surface-border text-slate-200 rounded-tl-none font-sans'
                      }`}
                    >
                      {msg.content}
                    </div>
                  </div>

                  {isUser && (
                    <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 mt-0.5">
                      <User className="w-4 h-4" />
                    </div>
                  )}
                </div>
              );
            })
          )}

          {/* Real-time Thinking Indicator */}
          {isSending && (
            <div className="flex gap-3 justify-start animate-in fade-in duration-200">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4" />
              </div>
              <div className="p-3 rounded-xl bg-surface-elevated border border-cyan-500/30 text-slate-300 text-xs rounded-tl-none flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse delay-150" />
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse delay-300" />
                </div>
                <span className="text-cyan-300 font-mono text-xs">
                  {employee.firstName} is processing with {employee.agentConfig?.modelName || 'qwen3.5:4b'}...
                </span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-4 border-t border-surface-border bg-surface-elevated/40">
          <div className="relative">
            <textarea
              ref={textareaRef}
              rows={2}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isSending}
              placeholder={`Send instructions or inquiry to ${employee.firstName}... (Press Enter to send, Shift+Enter for new line)`}
              className="w-full pl-3.5 pr-12 py-2.5 rounded-xl bg-surface border border-surface-border text-xs sm:text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/60 focus:ring-1 focus:ring-cyan-500/40 resize-none"
            />
            <button
              onClick={() => handleSendMessage()}
              disabled={!inputValue.trim() || isSending}
              className={`absolute right-2.5 bottom-3.5 p-2 rounded-lg transition-all ${
                inputValue.trim() && !isSending
                  ? 'bg-cyan-500 text-black hover:bg-cyan-400 shadow-glow-cyan'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              <Send className="w-4 h-4" />
            </button>
          </div>

          <div className="mt-2 flex items-center justify-between text-[11px] font-mono text-slate-500">
            <span className="flex items-center gap-1">
              <Code2 className="w-3.5 h-3.5" />
              Direct inference via NestJS Ollama Service
            </span>
            <span>Shift + Enter for multi-line</span>
          </div>
        </div>
      </div>
    </div>
  );
};
