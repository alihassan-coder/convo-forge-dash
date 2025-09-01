import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { 
  Sparkles, 
  Plus, 
  Trash2, 
  Send, 
  User, 
  LogOut,
  MessageCircle,
  Bot
} from 'lucide-react';

interface Chat {
  id: string;
  title: string;
  messages: Message[];
  createdAt: string;
}

interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: string;
}

const Dashboard = () => {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    // Load chats from localStorage
    const savedChats = localStorage.getItem(`blogify_chats_${user?.id}`);
    if (savedChats) {
      const parsedChats = JSON.parse(savedChats);
      setChats(parsedChats);
      if (parsedChats.length > 0) {
        setActiveChat(parsedChats[0].id);
      }
    }
  }, [user?.id]);

  const saveChats = (updatedChats: Chat[]) => {
    localStorage.setItem(`blogify_chats_${user?.id}`, JSON.stringify(updatedChats));
    setChats(updatedChats);
  };

  const createNewChat = () => {
    const newChat: Chat = {
      id: Date.now().toString(),
      title: 'New Chat',
      messages: [],
      createdAt: new Date().toISOString()
    };
    
    const updatedChats = [newChat, ...chats];
    saveChats(updatedChats);
    setActiveChat(newChat.id);
    
    toast({
      title: "New chat created",
      description: "Ready to generate amazing content!",
    });
  };

  const deleteChat = (chatId: string) => {
    const updatedChats = chats.filter(chat => chat.id !== chatId);
    saveChats(updatedChats);
    
    if (activeChat === chatId) {
      setActiveChat(updatedChats.length > 0 ? updatedChats[0].id : null);
    }
    
    toast({
      title: "Chat deleted",
      description: "The chat has been removed from your history.",
    });
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !activeChat) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: newMessage,
      isUser: true,
      timestamp: new Date().toISOString()
    };

    // Add user message
    const updatedChats = chats.map(chat => {
      if (chat.id === activeChat) {
        const updatedMessages = [...chat.messages, userMessage];
        const title = chat.messages.length === 0 ? newMessage.slice(0, 50) + '...' : chat.title;
        return { ...chat, messages: updatedMessages, title };
      }
      return chat;
    });

    saveChats(updatedChats);
    setNewMessage('');
    setIsGenerating(true);

    // Simulate AI response
    setTimeout(() => {
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: `I'd be happy to help you create amazing blog content! Based on your message "${userMessage.content}", here are some suggestions:\n\n• Consider focusing on your target audience's pain points\n• Use engaging headlines that spark curiosity\n• Include actionable insights and examples\n• Optimize for SEO with relevant keywords\n\nWould you like me to help you generate a specific blog post on this topic?`,
        isUser: false,
        timestamp: new Date().toISOString()
      };

      const finalChats = chats.map(chat => {
        if (chat.id === activeChat) {
          return { ...chat, messages: [...chat.messages, userMessage, aiMessage] };
        }
        return chat;
      });

      saveChats(finalChats);
      setIsGenerating(false);
    }, 2000);
  };

  const currentChat = chats.find(chat => chat.id === activeChat);

  return (
    <div className="h-screen flex bg-background">
      {/* Sidebar */}
      <div className="w-80 bg-card border-r flex flex-col">
        {/* Header */}
        <div className="p-4 border-b">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 bg-gradient-primary rounded-lg">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <h1 className="text-xl font-bold">Blogify</h1>
          </div>
          <Button onClick={createNewChat} className="w-full" variant="hero">
            <Plus className="h-4 w-4" />
            New Chat
          </Button>
        </div>

        {/* Chat List */}
        <ScrollArea className="flex-1 p-2">
          <div className="space-y-2">
            {chats.map((chat) => (
              <div
                key={chat.id}
                className={`group flex items-center gap-2 p-3 rounded-lg cursor-pointer transition-colors hover:bg-accent ${
                  activeChat === chat.id ? 'bg-accent' : ''
                }`}
                onClick={() => setActiveChat(chat.id)}
              >
                <MessageCircle className="h-4 w-4 text-muted-foreground" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{chat.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {chat.messages.length} messages
                  </p>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  className="opacity-0 group-hover:opacity-100 h-6 w-6"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteChat(chat.id);
                  }}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        </ScrollArea>

        {/* User Info */}
        <div className="p-4 border-t">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-secondary rounded-full">
              <User className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.name}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
            </div>
            <Button
              size="icon"
              variant="ghost"
              onClick={logout}
              className="h-8 w-8"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {currentChat ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b">
              <h2 className="text-lg font-semibold">{currentChat.title}</h2>
              <p className="text-sm text-muted-foreground">
                AI-powered blog content generation
              </p>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-6 max-w-4xl mx-auto">
                {currentChat.messages.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="p-4 bg-gradient-primary rounded-full w-16 h-16 mx-auto mb-4">
                      <Bot className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">Ready to create amazing content?</h3>
                    <p className="text-muted-foreground">
                      Ask me anything about blog writing, SEO, or content strategy!
                    </p>
                  </div>
                ) : (
                  currentChat.messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex gap-4 ${message.isUser ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`flex gap-3 max-w-[80%] ${message.isUser ? 'flex-row-reverse' : 'flex-row'}`}>
                        <div className={`p-2 rounded-full ${message.isUser ? 'bg-primary' : 'bg-gradient-primary'}`}>
                          {message.isUser ? 
                            <User className="h-4 w-4 text-primary-foreground" /> : 
                            <Bot className="h-4 w-4 text-white" />
                          }
                        </div>
                        <Card className={`${message.isUser ? 'bg-primary text-primary-foreground' : 'bg-card'}`}>
                          <CardContent className="p-4">
                            <p className="whitespace-pre-wrap">{message.content}</p>
                            <p className={`text-xs mt-2 ${message.isUser ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                              {new Date(message.timestamp).toLocaleTimeString()}
                            </p>
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  ))
                )}
                
                {isGenerating && (
                  <div className="flex gap-4 justify-start">
                    <div className="flex gap-3 max-w-[80%]">
                      <div className="p-2 bg-gradient-primary rounded-full">
                        <Bot className="h-4 w-4 text-white" />
                      </div>
                      <Card className="bg-card">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-2">
                            <div className="animate-spin">
                              <Sparkles className="h-4 w-4 text-primary" />
                            </div>
                            <p className="text-sm text-muted-foreground">Generating response...</p>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Message Input */}
            <div className="p-4 border-t">
              <div className="flex gap-2 max-w-4xl mx-auto">
                <Input
                  placeholder="Ask me about blog writing, content ideas, SEO tips..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  disabled={isGenerating}
                />
                <Button 
                  onClick={sendMessage} 
                  disabled={!newMessage.trim() || isGenerating}
                  variant="hero"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="p-4 bg-gradient-primary rounded-full w-16 h-16 mx-auto mb-4">
                <MessageCircle className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2">No chat selected</h3>
              <p className="text-muted-foreground mb-4">
                Create a new chat to start generating amazing blog content
              </p>
              <Button onClick={createNewChat} variant="hero">
                <Plus className="h-4 w-4" />
                Create New Chat
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;