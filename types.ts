
export enum MessageRole {
  USER = 'user',
  ROSE = 'rose'
}

export interface Message {
  id: string;
  role: MessageRole;
  text: string;
  timestamp: Date;
  isAudio?: boolean;
  audioData?: string; // Base64
}

export interface ChatSession {
  messages: Message[];
}
