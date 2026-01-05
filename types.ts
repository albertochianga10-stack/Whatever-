
export enum AgentRole {
  SALES = 'Vendas',
  SUPPORT = 'Suporte Técnico',
  PERSONAL = 'Assistente Pessoal',
  RESERVATION = 'Reservas e Agendamentos'
}

export interface Agent {
  id: string;
  name: string;
  role: AgentRole;
  instruction: string;
  isActive: boolean;
  avatar: string;
}

export interface Message {
  id: string;
  sender: 'user' | 'bot' | 'customer';
  content: string;
  timestamp: Date;
}

export interface Conversation {
  id: string;
  contactName: string;
  contactNumber: string;
  lastMessage: string;
  timestamp: Date;
  unread: number;
  messages: Message[];
  agentId?: string;
}

export interface LogEntry {
  id: string;
  timestamp: Date;
  type: 'info' | 'success' | 'warning' | 'error';
  message: string;
}

export type ViewState = 'dashboard' | 'agents' | 'conversations' | 'link' | 'settings' | 'logs';
