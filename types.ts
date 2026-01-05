
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
  timestamp: string; // ISO string para serialização fácil
}

export interface Conversation {
  id: string;
  contactName: string;
  contactNumber: string;
  lastMessage: string;
  timestamp: string;
  unread: number;
  messages: Message[];
  agentId?: string;
}

export interface LogEntry {
  id: string;
  timestamp: string;
  type: 'info' | 'success' | 'warning' | 'error';
  message: string;
}

export type ViewState = 'dashboard' | 'agents' | 'conversations' | 'link' | 'settings' | 'logs';
