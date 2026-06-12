export type WealthyMode = 'regulations' | 'investments' | 'portfolio' | 'calculator';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface WealthyChatRequest {
  mode: WealthyMode;
  messages: ChatMessage[];
}
