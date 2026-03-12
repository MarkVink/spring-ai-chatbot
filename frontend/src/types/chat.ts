export interface SpecialInput {
  type: 'address' | 'date' | 'time';
  label: string;
}

export interface Message {
  role: 'user' | 'assistant';
  content: string;
  responseTimeSeconds?: number;
  specialInput?: SpecialInput;
}

