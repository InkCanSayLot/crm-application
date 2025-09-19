import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { aiApi } from '@/lib/api';
import {
  Send,
  Bot,
  User,
  Trash2,
  Download,
  Copy,
  RefreshCw,
  MessageSquare,
  Sparkles,
  Brain,
  Lightbulb,
  TrendingUp,
  FileText,
  Calendar,
  Users
} from 'lucide-react';
import { toast } from "react-hot-toast";

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
}

interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
}

const QUICK_PROMPTS = [
  {
    icon: TrendingUp,
    title: 'Sales Analysis',
    prompt: 'Analyze my current sales pipeline and suggest improvements for closing more deals.',
    color: 'bg-pink-100 text-pink-700 hover:bg-pink-200'
  },
  {
    icon: Users,
    title: 'Client Insights',
    prompt: 'Help me understand my client behavior patterns and suggest personalized engagement strategies.',
    color: 'bg-pink-100 text-pink-700 hover:bg-pink-200'
  },
  {
    icon: Calendar,
    title: 'Schedule Optimization',
    prompt: 'Review my calendar and suggest ways to optimize my time for better productivity.',
    color: 'bg-pink-100 text-pink-700 hover:bg-pink-200'
  },
  {
    icon: FileText,
    title: 'Report Generation',
    prompt: 'Generate a comprehensive business report based on my CRM data and recent activities.',
    color: 'bg-pink-100 text-pink-700 hover:bg-pink-200'
  },
  {
    icon: Lightbulb,
    title: 'Growth Ideas',
    prompt: 'Suggest innovative strategies to grow my business and expand my client base.',
    color: 'bg-pink-100 text-pink-700 hover:bg-pink-200'
  },
  {
    icon: Brain,
    title: 'Decision Support',
    prompt: 'Help me make data-driven decisions about my business priorities and resource allocation.',
    color: 'bg-pink-100 text-pink-700 hover:bg-pink-200'
  }
];

export default function AIChat() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    loadSessions();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [currentSession?.messages]);

  const loadSessions = () => {
    const savedSessions = localStorage.getItem(`ai-chat-sessions-${user?.id}`);
    if (savedSessions) {
      const parsed = JSON.parse(savedSessions).map((session: any) => ({
        ...session,
        createdAt: new Date(session.createdAt),
        updatedAt: new Date(session.updatedAt),
        messages: session.messages.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }))
      }));
      setSessions(parsed);
    }
  };

  const saveSessions = (updatedSessions: ChatSession[]) => {
    localStorage.setItem(`ai-chat-sessions-${user?.id}`, JSON.stringify(updatedSessions));
    setSessions(updatedSessions);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const createNewSession = () => {
    const newSession: ChatSession = {
      id: Date.now().toString(),
      title: 'New Chat',
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const updatedSessions = [newSession, ...sessions];
    saveSessions(updatedSessions);
    setCurrentSession(newSession);
  };

  const deleteSession = (sessionId: string) => {
    if (!confirm('Are you sure you want to delete this chat session?')) return;
    
    const updatedSessions = sessions.filter(s => s.id !== sessionId);
    saveSessions(updatedSessions);
    
    if (currentSession?.id === sessionId) {
      setCurrentSession(updatedSessions[0] || null);
    }
  };

  const sendMessage = async (messageText?: string) => {
    const textToSend = messageText || message.trim();
    if (!textToSend || loading) return;

    let session = currentSession;
    if (!session) {
      session = {
        id: Date.now().toString(),
        title: textToSend.slice(0, 50) + (textToSend.length > 50 ? '...' : ''),
        messages: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };
      setCurrentSession(session);
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      content: textToSend,
      role: 'user',
      timestamp: new Date()
    };

    const updatedMessages = [...session.messages, userMessage];
    const updatedSession = {
      ...session,
      messages: updatedMessages,
      updatedAt: new Date()
    };

    setCurrentSession(updatedSession);
    setMessage('');
    setLoading(true);

    try {
      // Get AI response from API
      const response = await aiApi.chat({
        message: textToSend,
        context: updatedMessages.map(msg => ({
          role: msg.role,
          content: msg.content
        })),
        sessionId: session.id
      });
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: response.data.message,
        role: 'assistant',
        timestamp: new Date()
      };

      const finalMessages = [...updatedMessages, aiMessage];
      const finalSession = {
        ...updatedSession,
        messages: finalMessages,
        updatedAt: new Date()
      };

      setCurrentSession(finalSession);
      
      // Update sessions list
      const sessionIndex = sessions.findIndex(s => s.id === session.id);
      let updatedSessions;
      if (sessionIndex >= 0) {
        updatedSessions = [...sessions];
        updatedSessions[sessionIndex] = finalSession;
      } else {
        updatedSessions = [finalSession, ...sessions];
      }
      
      saveSessions(updatedSessions);
    } catch (error: any) {
      console.error('Error sending message:', error);
      
      // Handle specific AI service errors
      if (error.message?.includes('temporarily unavailable') || error.message?.includes('quota') || error.message?.includes('rate limit')) {
        toast.error('AI service is temporarily unavailable due to quota limits. Please try again later.');
        
        // Add a fallback message from AI
        const fallbackMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: "I'm currently experiencing high demand and my AI capabilities are temporarily limited. Please try again in a few minutes, or feel free to continue using the CRM features without AI assistance.",
          role: 'assistant',
          timestamp: new Date()
        };
        
        const finalMessages = [...updatedMessages, fallbackMessage];
        const finalSession = {
          ...updatedSession,
          messages: finalMessages,
          updatedAt: new Date()
        };
        
        setCurrentSession(finalSession);
        
        // Update sessions list
        const sessionIndex = sessions.findIndex(s => s.id === session.id);
        let updatedSessions;
        if (sessionIndex >= 0) {
          updatedSessions = [...sessions];
          updatedSessions[sessionIndex] = finalSession;
        } else {
          updatedSessions = [finalSession, ...sessions];
        }
        
        saveSessions(updatedSessions);
      } else {
        toast.error('Failed to send message. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };



  const copyMessage = (content: string) => {
    navigator.clipboard.writeText(content);
    toast.success('Message copied to clipboard');
  };

  const exportChat = () => {
    if (!currentSession) return;
    
    const chatText = currentSession.messages
      .map(msg => `${msg.role.toUpperCase()}: ${msg.content}`)
      .join('\n\n');
    
    const blob = new Blob([chatText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chat-${currentSession.title.replace(/[^a-z0-9]/gi, '-')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const adjustTextareaHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-80' : 'w-0'} transition-all duration-300 overflow-hidden bg-white border-r border-gray-200`}>
        <div className="p-4 border-b border-gray-200">
          <button
            onClick={createNewSession}
            className="btn-primary w-full flex items-center justify-center"
          >
            <MessageSquare className="w-4 h-4 mr-2" />
            New Chat
          </button>
        </div>
        
        <div className="p-4">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Recent Chats</h3>
          <div className="space-y-2">
            {sessions.map(session => (
              <div
                key={session.id}
                className={`card-container cursor-pointer transition-colors group ${
                  currentSession?.id === session.id
                    ? 'bg-pink-50 border border-pink-200'
                    : 'hover:bg-gray-50'
                }`}
                onClick={() => setCurrentSession(session)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {session.title}
                    </p>
                    <p className="text-xs text-gray-500">
                      {session.updatedAt.toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteSession(session.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-600 transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="card-header">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="mr-4 p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <MessageSquare className="w-5 h-5" />
              </button>
              <div className="flex items-center">
                <div className="bg-pink-100 p-2 rounded-lg mr-3">
                  <Sparkles className="w-6 h-6 text-pink-600" />
                </div>
                <div>
                  <h1 className="text-xl font-semibold text-gray-900">Empty AI</h1>
                  <p className="text-sm text-gray-500">Powered by Empty AI 2.0</p>
                </div>
              </div>
            </div>
            {currentSession && (
              <div className="flex space-x-2">
                <button
                  onClick={exportChat}
                  className="btn-secondary p-2"
                  title="Export Chat"
                >
                  <Download className="w-5 h-5" />
                </button>
                <button
                  onClick={() => deleteSession(currentSession.id)}
                  className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                  title="Delete Chat"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4">
          {!currentSession ? (
            <div className="h-full flex flex-col items-center justify-center">
              <div className="bg-pink-100 p-6 rounded-full mb-6">
                <Sparkles className="w-12 h-12 text-pink-600" />
              </div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">Welcome to Empty AI</h2>
              <p className="text-gray-600 mb-8 text-center max-w-md">
                Get intelligent insights about your CRM data, business strategies, and productivity tips.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl">
                {QUICK_PROMPTS.map((prompt, index) => {
                  const Icon = prompt.icon;
                  return (
                    <button
                      key={index}
                      onClick={() => sendMessage(prompt.prompt)}
                      className={`card-container text-left transition-colors ${prompt.color}`}
                    >
                      <Icon className="w-6 h-6 mb-2" />
                      <h3 className="font-medium mb-1">{prompt.title}</h3>
                      <p className="text-sm opacity-80">{prompt.prompt}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto">
              {currentSession.messages.map(msg => (
                <div key={msg.id} className={`mb-6 flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`flex max-w-3xl ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                    <div className={`flex-shrink-0 ${msg.role === 'user' ? 'ml-3' : 'mr-3'}`}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        msg.role === 'user' ? 'bg-pink-600' : 'bg-gray-600'
                      }`}>
                        {msg.role === 'user' ? (
                          <User className="w-4 h-4 text-white" />
                        ) : (
                          <Bot className="w-4 h-4 text-white" />
                        )}
                      </div>
                    </div>
                    <div className={`flex-1 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                      <div className={`inline-block p-4 rounded-lg ${
                        msg.role === 'user'
                          ? 'bg-pink-600 text-white'
                          : 'card-container text-gray-900'
                      }`}>
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                      </div>
                      <div className="flex items-center mt-2 space-x-2">
                        <span className="text-xs text-gray-500">
                          {msg.timestamp.toLocaleTimeString()}
                        </span>
                        <button
                          onClick={() => copyMessage(msg.content)}
                          className="btn-secondary text-xs"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              {loading && (
                <div className="mb-6 flex justify-start">
                  <div className="flex max-w-3xl">
                    <div className="flex-shrink-0 mr-3">
                      <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center">
                        <Bot className="w-4 h-4 text-white" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="inline-block p-4 rounded-lg card-container">
                        <div className="flex items-center space-x-2">
                          <RefreshCw className="w-4 h-4 animate-spin text-gray-400" />
                          <span className="text-gray-500">AI is thinking...</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="bg-white border-t border-gray-200 p-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-end space-x-3">
              <div className="flex-1">
                <textarea
                  ref={textareaRef}
                  value={message}
                  onChange={(e) => {
                    setMessage(e.target.value);
                    adjustTextareaHeight();
                  }}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask me anything about your CRM, business strategies, or productivity tips..."
                  className="input-primary w-full px-4 py-3 resize-none"
                  rows={1}
                  disabled={loading}
                />
              </div>
              <button
                onClick={() => sendMessage()}
                disabled={!message.trim() || loading}
                className="btn-primary p-3 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {loading ? (
                  <RefreshCw className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}