const API_BASE_URL = 'http://127.0.0.1:8000';

export interface Chat {
  id: string;
  title: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  messages: Message[];
}

export interface Message {
  id: string;
  content: string;
  is_user: boolean;
  timestamp: string;
  chat_id: string;
}

export interface CreateChatRequest {
  title: string;
  user_id: string;
}

export interface CreateMessageRequest {
  content: string;
  is_user: boolean;
  chat_id: string;
}

class ChatService {
  private getAuthHeaders() {
    const token = localStorage.getItem('blogify_token');
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  }

  async getChats(): Promise<Chat[]> {
    const response = await fetch(`${API_BASE_URL}/chat/`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch chats');
    }

    return response.json();
  }

  async getChat(chatId: string): Promise<Chat> {
    const response = await fetch(`${API_BASE_URL}/chat/${chatId}`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch chat');
    }

    return response.json();
  }

  async createChat(chatData: CreateChatRequest): Promise<Chat> {
    const response = await fetch(`${API_BASE_URL}/chat/`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(chatData),
    });

    if (!response.ok) {
      throw new Error('Failed to create chat');
    }

    return response.json();
  }

  async updateChat(chatId: string, title: string): Promise<Chat> {
    const response = await fetch(`${API_BASE_URL}/chat/${chatId}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ title }),
    });

    if (!response.ok) {
      throw new Error('Failed to update chat');
    }

    return response.json();
  }

  async deleteChat(chatId: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/chat/${chatId}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to delete chat');
    }
  }

  async getMessages(chatId: string): Promise<Message[]> {
    const response = await fetch(`${API_BASE_URL}/chat/${chatId}/messages`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch messages');
    }

    return response.json();
  }

  async createMessage(messageData: CreateMessageRequest): Promise<Message> {
    const response = await fetch(`${API_BASE_URL}/chat/${messageData.chat_id}/messages`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(messageData),
    });

    if (!response.ok) {
      throw new Error('Failed to create message');
    }

    return response.json();
  }
}

export const chatService = new ChatService();
