import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
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
  ChevronRight,
  Search,
  Calendar,
  Clock,
  Eye,
  Tag,
  Globe,
  FileText,
  TrendingUp,
  BarChart3,
  ExternalLink,
  Copy,
  Download
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

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
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [currentStep, setCurrentStep] = useState<string>('');
  const [isBlogRequest, setIsBlogRequest] = useState<boolean>(false);

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
    setSearchResults([]);
    setCurrentStep('');
    setIsBlogRequest(false);

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
        // Use streaming for better UX
        let aiResponse = '';
        const history = [...messages, userMessage];
        
        await chatService.streamAgent(
          { 
            query: userMessageContent,
            messages: history.map(m => ({ role: m.is_user ? 'user' : 'assistant', content: m.content }))
          },
          (evt) => {
            if (evt.type === 'step') {
              setCurrentStep(evt.name);
            } else if (evt.type === 'intent') {
              setIsBlogRequest(evt.is_blog_request);
            } else if (evt.type === 'search_results') {
              setSearchResults(evt.results || []);
            } else if (evt.type === 'delta' && evt.content) {
              aiResponse += evt.content;
              // Update the last message with streaming content
              setMessages(prev => {
                const updated = [...prev];
                const lastMessage = updated[updated.length - 1];
                if (lastMessage && !lastMessage.is_user) {
                  lastMessage.content = aiResponse;
                } else {
                  // Add new AI message if it doesn't exist
                  updated.push({
                    id: `temp-${Date.now()}`,
                    content: aiResponse,
                    is_user: false,
                    timestamp: new Date().toISOString(),
                    chat_id: activeChat
                  });
                }
                return updated;
              });
            }
          }
        );

        // Save the final AI message to database
        if (aiResponse) {
          await chatService.createMessage({
            content: aiResponse,
            is_user: false,
            chat_id: activeChat
          });
        }

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

  // Try to extract a JSON object from a string. Handles raw JSON or JSON inside fenced code blocks.
  const extractJsonFromText = (text: string): any | null => {
    if (!text) return null;

    // 1) Try direct parse
    try {
      const parsed = JSON.parse(text);
      return parsed;
    } catch (e) {
      // continue
    }

    // 2) Try to find fenced code block ```json ... ``` or ``` ... ```
    const fenceMatch = text.match(/```(?:json)?\n([\s\S]*?)\n```/i);
    if (fenceMatch && fenceMatch[1]) {
      try {
        return JSON.parse(fenceMatch[1]);
      } catch (e) {
        // continue to next strategy
      }
    }

    // 3) Try to locate first { ... } balanced JSON substring
    const firstBrace = text.indexOf('{');
    if (firstBrace === -1) return null;
    let depth = 0;
    for (let i = firstBrace; i < text.length; i++) {
      const ch = text[i];
      if (ch === '{') depth++;
      else if (ch === '}') depth--;
      if (depth === 0) {
        const candidate = text.slice(firstBrace, i + 1);
        try {
          return JSON.parse(candidate);
        } catch (e) {
          return null;
        }
      }
    }

    return null;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Content copied to clipboard",
    });
  };

  const renderAIMessage = (content: string) => {
    const parsed = extractJsonFromText(content);
    if (parsed && typeof parsed === 'object') {
      // Render structured blog object if fields exist
      const {
        title,
        content: body,
        meta_description,
        tags,
        seo_keywords,
        word_count,
        search_sources,
        reading_time,
        difficulty,
        category
      } = parsed as any;

      return (
        <div className="space-y-6">
          {/* Blog Header */}
          {title && (
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-4">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 leading-tight">{title}</h1>
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => copyToClipboard(body || title)}
                    className="shrink-0"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              {/* Meta Information */}
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                {reading_time && (
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {reading_time}
                  </div>
                )}
                {word_count && (
                  <div className="flex items-center gap-1">
                    <FileText className="h-4 w-4" />
                    {word_count} words
                  </div>
                )}
                {difficulty && (
                  <Badge variant="secondary" className="text-xs">
                    {difficulty}
                  </Badge>
                )}
                {category && (
                  <Badge variant="outline" className="text-xs">
                    {category}
                  </Badge>
                )}
              </div>
            </div>
          )}

          {/* Meta Description */}
          {meta_description && (
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-4">
                <p className="text-blue-800 font-medium text-sm leading-relaxed">{meta_description}</p>
              </CardContent>
            </Card>
          )}

          {/* Main Content */}
          {body && (
            <Card className="bg-white shadow-sm">
              <CardContent className="p-6">
                <div className="prose prose-lg max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 prose-p:leading-relaxed prose-li:text-gray-700">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{body}</ReactMarkdown>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tags Section */}
          {tags && Array.isArray(tags) && tags.length > 0 && (
            <Card className="bg-gray-50">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Tag className="h-5 w-5" />
                  Tags
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag, index) => (
                    <Badge key={index} variant="secondary" className="text-sm">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Statistics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Word Count */}
            {word_count !== undefined && (
              <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-500 rounded-lg">
                      <FileText className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-blue-700">{word_count}</p>
                      <p className="text-sm text-blue-600">Words</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Search Sources */}
            {search_sources && (
              <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-500 rounded-lg">
                      <Search className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-green-700">
                        {Array.isArray(search_sources) ? search_sources.length : search_sources}
                      </p>
                      <p className="text-sm text-green-600">Sources</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* SEO Keywords */}
            {seo_keywords && Array.isArray(seo_keywords) && (
              <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-500 rounded-lg">
                      <TrendingUp className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-purple-700">{seo_keywords.length}</p>
                      <p className="text-sm text-purple-600">SEO Keywords</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* SEO Keywords List */}
          {seo_keywords && Array.isArray(seo_keywords) && seo_keywords.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  SEO Keywords
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {seo_keywords.map((keyword, index) => (
                    <Badge key={index} variant="outline" className="text-sm">
                      {keyword}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Additional Metadata */}
          <Card className="bg-gray-50 border-dashed">
            <CardHeader>
              <CardTitle className="text-lg">Blog Metadata</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {meta_description && (
                <div>
                  <p className="font-medium text-sm text-gray-700">Meta Description:</p>
                  <p className="text-sm text-gray-600 bg-white p-2 rounded border">{meta_description}</p>
                </div>
              )}
              
              {/* Show any additional keys */}
              {Object.keys(parsed).filter(k => !["title","content","meta_description","tags","seo_keywords","word_count","search_sources","reading_time","difficulty","category"].includes(k)).map((key) => (
                <div key={key}>
                  <p className="font-medium text-sm text-gray-700 capitalize">{key.replace(/_/g, ' ')}:</p>
                  <p className="text-sm text-gray-600 bg-white p-2 rounded border">
                    {typeof parsed[key] === 'object' ? JSON.stringify(parsed[key], null, 2) : String(parsed[key])}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      );
    }

    // Fallback to rendering as markdown
    return (
      <div className="prose prose-lg max-w-none">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <div className="space-y-2">
            <p className="text-xl font-semibold text-gray-800">Loading Blogify</p>
            <p className="text-gray-600">Preparing your content workspace...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex bg-gray-50">
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
        bg-white border-r border-gray-200 flex flex-col transition-all duration-300 ease-in-out shadow-lg
      `}>
        {/* Header */}
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            {!sidebarCollapsed && (
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Blogify
                </h1>
                <p className="text-xs text-gray-500">AI-powered content</p>
              </div>
            )}
          </div>
          
          {/* Desktop collapse button */}
          {!isMobile && (
            <div className="mb-3 flex justify-end">
              <Button size="sm" variant="ghost" onClick={() => setSidebarCollapsed(!sidebarCollapsed)}>
                {sidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
              </Button>
            </div>
          )}
          
          <Button 
            onClick={createNewChat} 
            className={`w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 ${sidebarCollapsed ? 'px-2' : ''}`}
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
                className={`group flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all duration-200 hover:bg-blue-50 hover:shadow-sm ${
                  activeChat === chat.id ? 'bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 shadow-sm' : 'hover:bg-gray-50'
                }`}
                onClick={() => {
                  setActiveChat(chat.id);
                  if (isMobile) setSidebarCollapsed(true);
                }}
              >
                <div className={`p-2 rounded-lg ${activeChat === chat.id ? 'bg-blue-500' : 'bg-gray-100'}`}>
                  <MessageCircle className={`h-4 w-4 ${activeChat === chat.id ? 'text-white' : 'text-gray-600'}`} />
                </div>
                {!sidebarCollapsed && (
                  <>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate text-gray-900">{chat.title}</p>
                      <p className="text-xs text-gray-500">Recent activity</p>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="opacity-0 group-hover:opacity-100 h-8 w-8 text-gray-400 hover:text-red-500"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteChat(chat.id);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>

        {/* User Info */}
        <div className="p-4 border-t border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-100 rounded-full">
              <User className="h-5 w-5 text-gray-600" />
            </div>
            {!sidebarCollapsed && (
              <>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate text-gray-900">{user?.name}</p>
                  <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={logout}
                  className="h-8 w-8 text-gray-400 hover:text-red-500"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-white">
        {/* Top Bar */}
        <div className="p-4 border-b border-gray-200 bg-white">
          <div className="flex items-center gap-4">
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
                <div className="flex-1">
                  <h2 className="text-xl font-semibold text-gray-900">{currentChat.title}</h2>
                  <p className="text-sm text-gray-500">AI-powered blog content generation</p>
                </div>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => setChatMinimized(!chatMinimized)}
                  className="hidden sm:flex"
                >
                  {chatMinimized ? 'Expand' : 'Minimize'}
                </Button>
              </>
            )}
          </div>
        </div>

        {currentChat ? (
          <>
            {/* Messages and Search Results */}
            {!chatMinimized && (
              <div className="flex-1 flex">
                {/* Main Chat Area */}
                <ScrollArea className="flex-1 p-6 bg-gray-50">
                  <div className="space-y-8 max-w-5xl mx-auto">
                    {messages.length === 0 ? (
                      <div className="text-center py-16">
                        <div className="p-6 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl w-20 h-20 mx-auto mb-6">
                          <Bot className="h-8 w-8 text-white mx-auto mt-2" />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-3">Ready to create amazing content?</h3>
                        <p className="text-gray-600 text-lg">
                          Ask me anything about blog writing, SEO, or content strategy!
                        </p>
                      </div>
                    ) : (
                      messages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex gap-4 ${message.is_user ? 'justify-end' : 'justify-start'}`}
                        >
                          <div className={`flex gap-4 max-w-[85%] ${message.is_user ? 'flex-row-reverse' : 'flex-row'}`}>
                            <div className={`p-3 rounded-full shrink-0 ${message.is_user ? 'bg-blue-500' : 'bg-gradient-to-r from-blue-500 to-purple-600'}`}>
                              {message.is_user ? 
                                <User className="h-5 w-5 text-white" /> : 
                                <Bot className="h-5 w-5 text-white" />
                              }
                            </div>
                            <Card className={`${message.is_user ? 'bg-blue-500 text-white border-blue-500' : 'bg-white shadow-md border-gray-200'}`}>
                              <CardContent className="p-6">
                                {message.is_user ? (
                                  <p className="whitespace-pre-wrap text-white">{message.content}</p>
                                ) : (
                                  renderAIMessage(message.content)
                                )}
                                <p className={`text-xs mt-4 ${message.is_user ? 'text-blue-100' : 'text-gray-400'}`}>
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
                        <div className="flex gap-4 max-w-[85%]">
                          <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full">
                            <Bot className="h-5 w-5 text-white" />
                          </div>
                          <Card className="bg-white shadow-md">
                            <CardContent className="p-6">
                              <div className="flex items-center gap-3">
                                <div className="animate-spin">
                                  <Sparkles className="h-5 w-5 text-blue-500" />
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-gray-900">
                                    {currentStep ? `${currentStep}...` : 'Generating response...'}
                                  </p>
                                  <p className="text-xs text-gray-500">This may take a few moments</p>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      </div>
                    )}
                  </div>
                </ScrollArea>

                {/* Enhanced Search Results Panel */}
                {searchResults.length > 0 && (
                  <div className="w-80 border-l border-gray-200 bg-white p-6">
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-100 rounded-lg">
                          <Search className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">Research Sources</h3>
                          <p className="text-sm text-gray-500">{searchResults.length} articles found</p>
                        </div>
                      </div>
                      
                      {isBlogRequest && (
                        <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl">
                          <div className="flex items-center gap-2 text-green-800 mb-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                            <span className="text-sm font-semibold">Blog Generation Mode</span>
                          </div>
                          <p className="text-xs text-green-700">
                            AI detected this as a blog request and will generate comprehensive content
                          </p>
                        </div>
                      )}
                      
                      <ScrollArea className="h-96">
                        <div className="space-y-3">
                          {searchResults.map((result, index) => (
                            <Card key={index} className="hover:shadow-md transition-shadow border-gray-100">
                              <CardContent className="p-4">
                                <div className="space-y-3">
                                  <h4 className="font-medium text-sm leading-tight text-gray-900 line-clamp-2">
                                    {result.title}
                                  </h4>
                                  <p className="text-xs text-gray-600 line-clamp-3 leading-relaxed">
                                    {result.content}
                                  </p>
                                  <div className="flex items-center justify-between pt-2">
                                    <a 
                                      href={result.url} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 hover:underline"
                                    >
                                      <ExternalLink className="h-3 w-3" />
                                      View Source
                                    </a>
                                    {result.score && (
                                      <Badge variant="secondary" className="text-xs">
                                        {result.score.toFixed(2)}
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </ScrollArea>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Enhanced Message Input */}
            <div className={`p-6 border-t border-gray-200 bg-white ${chatMinimized ? 'hidden' : ''}`}>
              <div className="max-w-4xl mx-auto">
                <div className="flex gap-3">
                  <div className="flex-1 relative">
                    <Input
                      placeholder="Ask me about blog writing, content ideas, SEO tips..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                      disabled={isGenerating}
                      className="pr-4 py-3 text-base border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-xl"
                    />
                  </div>
                  <Button 
                    onClick={sendMessage} 
                    disabled={!newMessage.trim() || isGenerating}
                    className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 rounded-xl"
                    size="lg"
                  >
                    {isGenerating ? (
                      <div className="animate-spin">
                        <Sparkles className="h-5 w-5" />
                      </div>
                    ) : (
                      <Send className="h-5 w-5" />
                    )}
                  </Button>
                </div>
                
                {/* Quick Actions */}
                <div className="flex flex-wrap gap-2 mt-3">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => setNewMessage("Write a blog post about")}
                    className="text-xs"
                  >
                    Blog Post
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => setNewMessage("SEO tips for")}
                    className="text-xs"
                  >
                    SEO Tips
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => setNewMessage("Content ideas for")}
                    className="text-xs"
                  >
                    Content Ideas
                  </Button>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center space-y-6">
              <div className="p-6 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl w-20 h-20 mx-auto">
                <MessageCircle className="h-8 w-8 text-white mx-auto mt-2" />
              </div>
              <div className="space-y-3">
                <h3 className="text-2xl font-bold text-gray-900">No chat selected</h3>
                <p className="text-gray-600 text-lg max-w-md mx-auto">
                  Create a new chat to start generating amazing blog content with AI assistance
                </p>
              </div>
              <Button 
                onClick={createNewChat} 
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 px-6 py-3 text-base"
                size="lg"
              >
                <Plus className="h-5 w-5 mr-2" />
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