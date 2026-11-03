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
  Clock,
} from 'lucide-react';
import { clsx } from 'clsx';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';

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
          <Badge variant="warning" className="text-[10px]">
            <GitPullRequest className="w-2.5 h-2.5" />
            <span>Delegation</span>
          </Badge>
        );
      case 'TASK_ACCEPTED':
        return (
          <Badge variant="success" className="text-[10px]">
            <CheckCircle2 className="w-2.5 h-2.5" />
            <span>Accepted</span>
          </Badge>
        );
      case 'TASK_REJECTED':
        return (
          <Badge variant="danger" className="text-[10px]">
            <XCircle className="w-2.5 h-2.5" />
            <span>Rejected</span>
          </Badge>
        );
      case 'QUERY':
      case 'RESPONSE':
        return (
          <Badge variant="info" className="text-[10px]">
            <HelpCircle className="w-2.5 h-2.5" />
            <span>{type}</span>
          </Badge>
        );
      default:
        return (
          <Badge variant="neutral" className="text-[10px]">
            {type}
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-surface p-4 rounded-xl border border-surface-border shadow-subtle">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          {['ALL', 'TASK_DELEGATION', 'TASK_ACCEPTED', 'TASK_REJECTED', 'DIRECT_MESSAGE'].map(
            (type) => (
              <button
                key={type}
                onClick={() => setSelectedType(type)}
                className={clsx(
                  'px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors shrink-0',
                  selectedType === type
                    ? 'bg-surface-muted text-primary-text border border-surface-border'
                    : 'text-secondary-text hover:text-primary-text hover:bg-surface-muted/60',
                )}
              >
                {type === 'ALL' ? 'All Messages' : type.replace(/_/g, ' ')}
              </button>
            ),
          )}
        </div>

        <button
          onClick={loadMessages}
          disabled={isLoading}
          className="p-2 rounded-lg bg-surface border border-surface-border text-secondary-text hover:text-primary-text transition-colors self-end sm:self-auto shadow-subtle"
        >
          <RefreshCw className={clsx('w-3.5 h-3.5 text-primary-600', isLoading && 'animate-spin')} />
        </button>
      </div>

      {/* Messages Feed */}
      {isLoading ? (
        <div className="py-16 text-center space-y-2 text-secondary-text">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto text-primary-600" />
          <p className="text-xs">Querying agent communication event bus...</p>
        </div>
      ) : filteredMessages.length === 0 ? (
        <Card className="p-12 text-center border-dashed border-surface-border">
          <MessageSquare className="w-8 h-8 text-secondary-text mx-auto mb-2" />
          <h4 className="text-sm font-bold text-primary-text">No Agent Messages</h4>
          <p className="mt-1 text-xs text-secondary-text">
            When employees delegate tasks or exchange technical queries, correlated messages appear here.
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredMessages.map((msg) => (
            <Card key={msg.id} className="p-4 space-y-3">
              {/* Message Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  {/* Sender */}
                  <span className="font-bold text-primary-text text-sm">
                    {msg.senderEmployee
                      ? `${msg.senderEmployee.firstName} ${msg.senderEmployee.lastName}`
                      : 'Supervisor Agent'}
                  </span>

                  <ArrowRight className="w-3.5 h-3.5 text-secondary-text" />

                  {/* Recipient */}
                  <span className="font-bold text-primary-text text-sm">
                    {msg.recipientEmployee
                      ? `${msg.recipientEmployee.firstName} ${msg.recipientEmployee.lastName}`
                      : 'Assigned Agent'}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {getMessageTypeBadge(msg.messageType)}
                  <span className="text-[11px] text-secondary-text flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{new Date(msg.createdAt).toLocaleTimeString()}</span>
                  </span>
                </div>
              </div>

              {/* Message Content */}
              <div className="p-3 rounded-lg bg-surface-muted/60 border border-surface-border text-xs text-primary-text leading-relaxed">
                {msg.content}
              </div>

              {/* Associated Task */}
              {msg.task && (
                <div className="text-[11px] text-secondary-text flex items-center gap-1.5 pt-1">
                  <span>Related Task:</span>
                  <span className="font-semibold text-primary-text">{msg.task.title}</span>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
