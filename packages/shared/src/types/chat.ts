export type MessageSenderType = 'USER' | 'AGENT' | 'SYSTEM';

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderType: MessageSenderType;
  senderName: string;
  content: string;
  thinking?: string | null;
  metadata?: Record<string, any> | null;
  createdAt: string | Date;
}

export interface Conversation {
  id: string;
  title?: string | null;
  employeeId: string;
  messages?: ChatMessage[];
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface SendChatMessageDto {
  message: string;
  conversationId?: string;
  think?: boolean;
}

export interface ChatExecutionResponse {
  conversationId: string;
  userMessage: ChatMessage;
  agentMessage: ChatMessage;
  executionMetrics: {
    durationMs: number;
    model: string;
    provider: string;
    promptEvalCount?: number;
    evalCount?: number;
  };
}
