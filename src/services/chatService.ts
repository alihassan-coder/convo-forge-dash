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
  // user_id: string;
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
      method: 'GET',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch chats');
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

  async callAgent(messages: { role: string; content: string }[]): Promise<{ reply: string }> {
    const response = await fetch(`${API_BASE_URL}/agent/respond`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ messages }),
    });

    if (!response.ok) {
      throw new Error('Failed to call agent');
    }

    return response.json();
  }

  async sendAndStoreAgentReply(chatId: string, history: Message[], userMessage: string): Promise<Message> {
    const convo = history.map((m) => ({ role: m.is_user ? 'user' : 'assistant', content: m.content }));
    convo.push({ role: 'user', content: userMessage });
    const { reply } = await this.callAgent(convo);
    const saved = await this.createMessage({ content: reply, is_user: false, chat_id: chatId });
    return saved;
  }

  async streamAgent(
    params: { query?: string; messages?: { role: string; content: string }[]; thread_id?: string },
    onEvent: (evt: { type: string; [key: string]: any }) => void
  ): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/agent/stream`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(params),
    });

    if (!response.ok || !response.body) {
      throw new Error('Failed to open stream');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      let sepIndex: number;
      while ((sepIndex = buffer.indexOf('\n\n')) !== -1) {
        const rawEvent = buffer.slice(0, sepIndex);
        buffer = buffer.slice(sepIndex + 2);
        const lines = rawEvent.split('\n').filter(Boolean);
        for (const line of lines) {
          if (line.startsWith('data:')) {
            const jsonStr = line.slice(5).trim();
            if (!jsonStr) continue;
            try {
              const evt = JSON.parse(jsonStr);
              onEvent(evt);
            } catch {
              // ignore malformed chunk
            }
          }
        }
      }
    }
  }
}

export const chatService = new ChatService();
