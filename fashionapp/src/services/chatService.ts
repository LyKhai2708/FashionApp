import apiClient from '../utils/axios';

export interface ChatMessage {
  message_id?: number;
  sender: 'user' | 'bot';
  message: string;
  intent?: string;
  confidence?: number;
  image_url?: string;
  product_id?: number;
  created_at?: string;
}

export interface ChatResponse {
  success: boolean;
  session_id: string;
  responses: Array<{
    text: string;
    intent?: string;
    confidence?: number;
    image?: string;
    product_id?: number;
  }>;
  guest_token?: string;
}

export interface ChatHistoryResponse {
  success: boolean;
  messages: ChatMessage[];
}

export const chatService = {
  async sendMessage(message: string): Promise<ChatResponse> {
    const response = await apiClient.post(`/api/v1/chat/message`, {
      message
    }, {
      timeout: 30000  
    });

    return response.data;
  },

  async getChatHistory(limit = 50): Promise<ChatHistoryResponse> {
    const response = await apiClient.get(`/api/v1/chat/history`, {
      params: { limit }
    });

    return response.data;
  },

  async endSession(sessionId: string): Promise<void> {
    await apiClient.post(`/api/v1/chat/session/${sessionId}/end`, {});
  }
};