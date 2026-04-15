export type ChatRole = "assistant" | "user";

export interface ChatSource {
  document_id: string;
  content_preview: string;
  similarity: number;
}

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  sources?: ChatSource[];
}

export interface ChatFunctionResponse {
  answer: string;
  sources: ChatSource[];
}
