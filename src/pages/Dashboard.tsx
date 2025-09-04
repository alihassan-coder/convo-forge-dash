import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { chatService, Chat, Message } from '@/services/chatService';
import { 
  Sparkles, 
  Plus, 
  Trash2, 
  Send, 
  User, 
  LogOut,
  MessageCircle,
  Bot,
  Menu,
  X,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [chatMinimized, setChatMinimized] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth < 768) {
        setSidebarCollapsed(true);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (user?.id) {
      loadChats();
    }
  }, [user?.id]);

  useEffect(() => {
    if (activeChat) {
      loadMessages(activeChat);
    } else {
      setMessages([]);
    }
  }, [activeChat]);

  const loadChats = async () => {
    try {
      setIsLoading(true);
      const userChats = await chatService.getChats();
      setChats(userChats);
      if (userChats.length > 0) {
        setActiveChat(userChats[0].id);
      }
    } catch (error) {
      console.error('Failed to load chats:', error);
      toast({
        title: "Error",
        description: "Failed to load chats. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadMessages = async (chatId: string) => {
    try {
      const msgs = await chatService.getMessages(chatId);
      setMessages(msgs);
    } catch (error) {
      console.error('Failed to load messages:', error);
      toast({
        title: "Error",
        description: "Failed to load messages. Please try again.",
        variant: "destructive",
      });
    }
  };

  const createNewChat = async () => {
  try {
    const newChat = await chatService.createChat({
      title: 'New Chat'
      // ❌ no user_id here
    });
    
    setChats(prev => [newChat, ...prev]);
    setActiveChat(newChat.id);
    
    toast({
      title: "New chat created",
      description: "Ready to generate amazing content!",
    });
  } catch (error) {
    console.error('Failed to create chat:', error);
    toast({
      title: "Error",
      description: "Failed to create new chat. Please try again.",
      variant: "destructive",
    });
  }
};


  const deleteChat = async (chatId: string) => {
    try {
      await chatService.deleteChat(chatId);
      setChats(prev => prev.filter(chat => chat.id !== chatId));
      
      if (activeChat === chatId) {
        const remainingChats = chats.filter(chat => chat.id !== chatId);
        const nextId = remainingChats.length > 0 ? remainingChats[0].id : null;
        setActiveChat(nextId);
        setMessages([]);
      }
      
      toast({
        title: "Chat deleted",
        description: "The chat has been removed from your history.",
      });
    } catch (error) {
      console.error('Failed to delete chat:', error);
      toast({
        title: "Error",
        description: "Failed to delete chat. Please try again.",
        variant: "destructive",
      });
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !activeChat || !user) return;

    const userMessageContent = newMessage;
    setNewMessage('');
    setIsGenerating(true);

    try {
      // Create user message
      const userMessage = await chatService.createMessage({
        content: userMessageContent,
        is_user: true,
        chat_id: activeChat
      });

      // Show user message immediately
      setMessages(prev => [...prev, userMessage]);

      // Update chat title if it's the first message
      const currentChat = chats.find(chat => chat.id === activeChat);
      if (currentChat && messages.length === 0) {
        const newTitle = userMessageContent.slice(0, 50) + (userMessageContent.length > 50 ? '...' : '');
        await chatService.updateChat(activeChat, newTitle);
      }

      try {
        const history = [...messages, userMessage];
        const aiSaved = await chatService.sendAndStoreAgentReply(activeChat, history, userMessageContent);
        setMessages(prev => [...prev, aiSaved]);
      } catch (error) {
        console.error('Failed to get agent reply:', error);
        toast({
          title: "Error",
          description: "Failed to get agent reply. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsGenerating(false);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
      setIsGenerating(false);
    }
  };

  const currentChat = chats.find(chat => chat.id === activeChat);

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your chats...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex bg-background">
      {/* Mobile Overlay */}
      {isMobile && !sidebarCollapsed && (
        <div 
          className="fixed inset-0 bg-black/50 z-40"
          onClick={() => setSidebarCollapsed(true)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        ${isMobile ? 'fixed' : 'relative'} 
        ${sidebarCollapsed ? (isMobile ? '-translate-x-full' : 'w-16') : 'w-80'} 
        ${isMobile ? 'z-50' : ''}
        bg-card border-r flex flex-col transition-all duration-300 ease-in-out
      `}>
        {/* Header */}
        <div className="p-4 border-b">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 bg-gradient-primary rounded-lg">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            {!sidebarCollapsed && <h1 className="text-xl font-bold">Blogify</h1>}
          </div>
          <Button 
            onClick={createNewChat} 
            className={`w-full ${sidebarCollapsed ? 'px-2' : ''}`} 
            variant="hero"
            size={sidebarCollapsed ? "icon" : "default"}
          >
            <Plus className="h-4 w-4" />
            {!sidebarCollapsed && "New Chat"}
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
                onClick={() => {
                  setActiveChat(chat.id);
                  if (isMobile) setSidebarCollapsed(true);
                }}
              >
                <MessageCircle className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                {!sidebarCollapsed && (
                  <>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{chat.title}</p>
                      {/* <p className="text-xs text-muted-foreground">
                        {chat.messages.length} messages
                      </p> */}
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
                  </>
                )}
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
            {!sidebarCollapsed && (
              <>
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
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar with Sidebar Toggle */}
        <div className="p-4 border-b flex items-center gap-4">
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="md:hidden"
          >
            <Menu className="h-5 w-5" />
          </Button>
          {currentChat && (
            <>
              <h2 className="text-lg font-semibold">{currentChat.title}</h2>
              <p className="text-sm text-muted-foreground hidden sm:block">
                AI-powered blog content generation
              </p>
              <div className="ml-auto">
                <Button size="sm" variant="outline" onClick={() => setChatMinimized(!chatMinimized)}>
                  {chatMinimized ? 'Expand' : 'Minimize'}
                </Button>
              </div>
            </>
          )}
        </div>

        {currentChat ? (
          <>
            {/* Messages */}
            {!chatMinimized && (
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-6 max-w-4xl mx-auto">
                {messages.length === 0 ? (
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
                  messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex gap-4 ${message.is_user ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`flex gap-3 max-w-[80%] ${message.is_user ? 'flex-row-reverse' : 'flex-row'}`}>
                        <div className={`p-2 rounded-full ${message.is_user ? 'bg-primary' : 'bg-gradient-primary'}`}>
                          {message.is_user ? 
                            <User className="h-4 w-4 text-primary-foreground" /> : 
                            <Bot className="h-4 w-4 text-white" />
                          }
                        </div>
                        <Card className={`${message.is_user ? 'bg-primary text-primary-foreground' : 'bg-card'}`}>
                          <CardContent className="p-4">
                            <p className="whitespace-pre-wrap">{message.content}</p>
                            <p className={`text-xs mt-2 ${message.is_user ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
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
            )}

            {/* Message Input */}
            <div className={`p-4 border-t ${chatMinimized ? 'hidden' : ''}`}>
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