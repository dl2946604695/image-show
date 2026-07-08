import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, Sparkles, Trash2, Plus, ChevronLeft, MoreVertical, MessageSquare, Copy, Check, RefreshCw } from 'lucide-react';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'agent';
  timestamp: Date;
}

interface Conversation {
  id: string;
  name: string;
  lastMessage: string;
  timestamp: Date;
  unread?: boolean;
}

const defaultWelcomeMessage = '你好！我是摄影老师，有什么关于摄影的问题可以问我。';

export function AgentChat() {
  const [conversations, setConversations] = useState<Conversation[]>([
    {
      id: '1',
      name: '摄影老师',
      lastMessage: defaultWelcomeMessage,
      timestamp: new Date(),
    },
  ]);
  const [currentConversationId, setCurrentConversationId] = useState('1');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: defaultWelcomeMessage,
      sender: 'agent',
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const copyMessage = (id: string, content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const retryMessage = (message: Message) => {
    if (message.sender !== 'agent') return;
    
    const userMessage = messages.find(m => m.id === (parseInt(message.id) - 1).toString());
    if (!userMessage) return;
    
    setMessages(prev => prev.map(m => 
      m.id === message.id 
        ? { ...m, content: '', timestamp: new Date() }
        : m
    ));
    
    sendMessageInternal(userMessage.content, message.id);
  };

  const sendMessageInternal = async (content: string, agentMessageId: string) => {
    setIsLoading(true);

    try {
      const response = await fetch('/api/agent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: content }),
      });

      if (!response.ok) {
        setMessages(prev => prev.map(msg => 
          msg.id === agentMessageId 
            ? { ...msg, content: '抱歉，我暂时无法回答你的问题。' }
            : msg
        ));
        setIsLoading(false);
        return;
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder('utf-8');

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') {
                break;
              }
              try {
                const parsed = JSON.parse(data);
                if (parsed.content) {
                  setMessages(prev => prev.map(msg => 
                    msg.id === agentMessageId 
                      ? { ...msg, content: msg.content + parsed.content }
                      : msg
                  ));
                }
              } catch {
              }
            }
          }
        }
      }
    } catch {
      setMessages(prev => prev.map(msg => 
        msg.id === agentMessageId 
          ? { ...msg, content: '网络错误，请稍后再试。' }
          : msg
      ));
    }

    setIsLoading(false);
  };

  const sendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue.trim(),
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');

    const agentMessageId = (Date.now() + 1).toString();
    setMessages(prev => [...prev, {
      id: agentMessageId,
      content: '',
      sender: 'agent',
      timestamp: new Date(),
    }]);

    setConversations(prev => prev.map(c => 
      c.id === currentConversationId 
        ? { ...c, lastMessage: inputValue.trim(), timestamp: new Date() }
        : c
    ));

    await sendMessageInternal(userMessage.content, agentMessageId);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const createNewConversation = () => {
    const newId = Date.now().toString();
    const newConversation: Conversation = {
      id: newId,
      name: '摄影老师',
      lastMessage: defaultWelcomeMessage,
      timestamp: new Date(),
    };
    setConversations(prev => [newConversation, ...prev]);
    setCurrentConversationId(newId);
    setMessages([{
      id: '1',
      content: defaultWelcomeMessage,
      sender: 'agent',
      timestamp: new Date(),
    }]);
    setMobileMenuOpen(false);
  };

  const deleteConversation = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setConversations(prev => prev.filter(c => c.id !== id));
    if (currentConversationId === id) {
      const remaining = conversations.filter(c => c.id !== id);
      if (remaining.length > 0) {
        setCurrentConversationId(remaining[0].id);
        setMessages([{
          id: '1',
          content: defaultWelcomeMessage,
          sender: 'agent',
          timestamp: new Date(),
        }]);
      } else {
        createNewConversation();
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex">
      <div className={`fixed lg:static inset-y-0 left-0 z-50 w-80 bg-[#0f0f0f] border-r border-[#1a1a1a] transform transition-transform duration-300 ease-out ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="h-full flex flex-col">
          <div className="p-4 border-b border-[#1a1a1a]">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">对话</h2>
              <button 
                onClick={createNewConversation}
                className="w-8 h-8 rounded-lg bg-[#1a1a1a] flex items-center justify-center hover:bg-[#242424] transition-colors"
              >
                <Plus className="w-4 h-4 text-[#00d4ff]" />
              </button>
            </div>
            
            <div className="relative">
              <input
                type="text"
                placeholder="搜索对话..."
                className="w-full bg-[#141414] border border-[#1a1a1a] rounded-lg px-3 py-2 text-sm text-white placeholder-[#555] focus:outline-none focus:border-[#00d4ff]/40 transition-colors"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2">
            {conversations.map((conversation) => (
              <div
                key={conversation.id}
                onClick={() => {
                  setCurrentConversationId(conversation.id);
                  setMobileMenuOpen(false);
                }}
                className={`group flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all ${
                  currentConversationId === conversation.id
                    ? 'bg-[#1a1a1a] border border-[#00d4ff]/20'
                    : 'hover:bg-[#141414] border border-transparent'
                }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  currentConversationId === conversation.id ? 'bg-[#00d4ff]/15' : 'bg-[#1a1a1a]'
                }`}>
                  <Bot className="w-5 h-5 text-[#00d4ff]" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-white truncate">{conversation.name}</span>
                    <span className="text-xs text-[#555] flex-shrink-0">{conversation.timestamp.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <p className="text-xs text-[#666] truncate mt-0.5">{conversation.lastMessage}</p>
                </div>

                <button
                  onClick={(e) => deleteConversation(conversation.id, e)}
                  className="opacity-0 group-hover:opacity-100 w-7 h-7 rounded-lg flex items-center justify-center text-[#666] hover:text-red-500 hover:bg-red-500/10 transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          <div className="p-4 border-t border-[#1a1a1a]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#00d4ff]/20 to-purple-500/20 flex items-center justify-center border border-[#00d4ff]/15">
                <Sparkles className="w-5 h-5 text-[#00d4ff]" />
              </div>
              <div>
                <div className="text-sm font-medium text-white">摄影老师</div>
                <div className="text-xs text-[#666]">AI 摄影助手</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex items-center justify-between px-4 py-3 bg-[#0f0f0f] border-b border-[#1a1a1a] lg:px-6">
          <button 
            onClick={() => setMobileMenuOpen(true)}
            className="lg:hidden w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[#141414] transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-[#999]" />
          </button>
          
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#00d4ff]/15 flex items-center justify-center border border-[#00d4ff]/15">
              <Bot className="w-5 h-5 text-[#00d4ff]" />
            </div>
            <div>
              <div className="text-sm font-medium text-white">摄影老师</div>
              <div className="text-xs text-green-500 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                在线
              </div>
            </div>
          </div>

          <button className="w-8 h-8 rounded-lg flex items-center justify-center text-[#666] hover:text-[#999] hover:bg-[#141414] transition-colors">
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 lg:p-8">
          <div className="max-w-3xl mx-auto space-y-6">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex items-end gap-3 max-w-[85%] ${message.sender === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    message.sender === 'user' 
                      ? 'bg-[#00d4ff]/15' 
                      : 'bg-[#1a1a1a]'
                  }`}>
                    {message.sender === 'user' ? (
                      <User className="w-4 h-4 text-[#00d4ff]" />
                    ) : (
                      <Bot className="w-4 h-4 text-[#00d4ff]" />
                    )}
                  </div>
                  
                  <div className={`rounded-2xl transition-all duration-300 ${
                    message.sender === 'user'
                      ? 'bg-gradient-to-br from-[#00d4ff] to-[#00a8cc] text-white rounded-br-sm'
                      : 'bg-[#141414] text-white rounded-bl-sm border border-[#1a1a1a]'
                  }`}>
                    <div className="px-4 py-3">
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                      {message.content === '' && isLoading && (
                        <div className="flex gap-1.5 mt-2">
                          <span className="w-1.5 h-1.5 bg-[#00d4ff]/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                          <span className="w-1.5 h-1.5 bg-[#00d4ff]/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                          <span className="w-1.5 h-1.5 bg-[#00d4ff]/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                      )}
                    </div>
                    <div className={`px-4 pb-2 flex items-center justify-end gap-3 text-xs ${message.sender === 'user' ? 'text-white/50' : 'text-[#555]'}`}>
                      {message.timestamp.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                      {message.sender === 'agent' && (
                        <>
                          <button 
                            onClick={() => copyMessage(message.id, message.content)}
                            className="flex items-center gap-1 hover:text-[#00d4ff] transition-colors"
                          >
                            {copiedId === message.id ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                          </button>
                          <button 
                            onClick={() => retryMessage(message)}
                            className="flex items-center gap-1 hover:text-[#00d4ff] transition-colors"
                          >
                            <RefreshCw className="w-3 h-3" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </div>

        <div className="px-4 py-4 bg-[#0f0f0f] border-t border-[#1a1a1a] lg:px-6">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-end gap-3 bg-[#141414] rounded-2xl p-3 border border-[#1a1a1a] focus-within:border-[#00d4ff]/30 focus-within:shadow-[0_0_16px_rgba(0,212,255,0.08)] transition-all">
              <button className="w-9 h-9 rounded-lg flex items-center justify-center text-[#666] hover:text-[#00d4ff] hover:bg-[#00d4ff]/10 transition-colors flex-shrink-0">
                <Sparkles className="w-4 h-4" />
              </button>
              
              <textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="输入你的问题..."
                className="flex-1 bg-transparent text-white placeholder-[#555] resize-none outline-none text-sm py-2 max-h-32"
                rows={1}
                style={{ minHeight: '40px' }}
              />
              
              <button
                onClick={sendMessage}
                disabled={!inputValue.trim() || isLoading}
                className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all flex-shrink-0 ${
                  inputValue.trim() && !isLoading
                    ? 'bg-[#00d4ff] hover:bg-[#00d4ff]/90 text-black shadow-[0_0_12px_rgba(0,212,255,0.3)]'
                    : 'bg-[#1a1a1a] text-[#555] cursor-not-allowed'
                }`}
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </div>
            
            <p className="text-xs text-[#555] text-center mt-3">
              AI 生成的内容仅供参考，请谨慎使用
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}