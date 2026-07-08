import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, Plus, ChevronLeft, MoreVertical, Copy, Check, RefreshCw, MessageSquare } from 'lucide-react';

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

const suggestions = [
  '如何拍出好的人像？',
  '风景摄影技巧',
  '新手买什么相机？',
  '后期修图入门',
  '拍照构图方法',
  '如何选择镜头？',
];

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

  const sendMessage = async (text?: string) => {
    const messageContent = text || inputValue.trim();
    if (!messageContent || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: messageContent,
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
        ? { ...c, lastMessage: messageContent, timestamp: new Date() }
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

  const hasMessages = messages.length > 1 || messages[0].content !== defaultWelcomeMessage;

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex">
      <div className={`fixed lg:static inset-y-0 left-0 z-50 w-72 bg-[#0f0f0f] border-r border-[#1a1a1a] transform transition-transform duration-300 ease-out ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="h-full flex flex-col">
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">对话</h2>
              <button 
                onClick={createNewConversation}
                className="w-7 h-7 rounded-lg bg-[#1a1a1a] flex items-center justify-center hover:bg-[#242424] transition-colors"
              >
                <Plus className="w-4 h-4 text-white/70" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {conversations.map((conversation) => (
              <div
                key={conversation.id}
                onClick={() => {
                  setCurrentConversationId(conversation.id);
                  setMobileMenuOpen(false);
                }}
                className={`group flex items-start gap-3 p-3 cursor-pointer transition-all ${
                  currentConversationId === conversation.id
                    ? 'bg-[#1a1a1a]'
                    : 'hover:bg-[#141414]'
                }`}
              >
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  currentConversationId === conversation.id ? 'bg-[#7c5cfc]/15' : 'bg-[#1a1a1a]'
                }`}>
                  <Bot className="w-4 h-4 text-[#7c5cfc]" />
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
                  className="opacity-0 group-hover:opacity-100 w-6 h-6 flex items-center justify-center text-[#555] hover:text-red-500 transition-all"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          <div className="p-4 border-t border-[#1a1a1a]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#7c5cfc]/20 to-pink-500/20 flex items-center justify-center">
                <Bot className="w-5 h-5 text-[#7c5cfc]" />
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
        <div className="flex items-center justify-between px-4 py-3 bg-[#0f0f0f] border-b border-[#1a1a1a]">
          <button 
            onClick={() => setMobileMenuOpen(true)}
            className="lg:hidden w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[#141414] transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-[#999]" />
          </button>
          
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#7c5cfc]/20 to-pink-500/20 flex items-center justify-center">
              <Bot className="w-4 h-4 text-[#7c5cfc]" />
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

        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-2xl mx-auto">
            {!hasMessages && messages.length === 1 && (
              <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#7c5cfc]/20 to-pink-500/20 flex items-center justify-center mb-6">
                  <Bot className="w-10 h-10 text-[#7c5cfc]" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">摄影老师</h3>
                <p className="text-[#666] text-sm mb-8">有什么关于摄影的问题都可以问我</p>
                
                <div className="flex flex-wrap justify-center gap-2">
                  {suggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => sendMessage(suggestion)}
                      className="px-4 py-2 bg-[#1a1a1a] hover:bg-[#242424] text-[#999] text-sm rounded-full border border-[#242424] hover:border-[#7c5cfc]/30 hover:text-white transition-all"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-6">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex items-start gap-3 max-w-[85%] ${message.sender === 'user' ? 'flex-row-reverse' : ''}`}>
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      message.sender === 'user' 
                        ? 'bg-[#7c5cfc]/15' 
                        : 'bg-[#1a1a1a]'
                    }`}>
                      {message.sender === 'user' ? (
                        <User className="w-4 h-4 text-[#7c5cfc]" />
                      ) : (
                        <Bot className="w-4 h-4 text-[#7c5cfc]" />
                      )}
                    </div>
                    
                    <div className={`max-w-[calc(100%-36px)] ${message.sender === 'user' ? '' : ''}`}>
                      {message.sender === 'user' ? (
                        <div className="bg-[#7c5cfc] text-white text-sm leading-relaxed rounded-2xl rounded-tr-sm px-4 py-3">
                          {message.content}
                        </div>
                      ) : (
                        <div className="text-sm leading-relaxed text-white/90">
                          {message.content}
                          {message.content === '' && isLoading && (
                            <div className="flex gap-1.5 mt-3">
                              <span className="w-2 h-2 bg-[#7c5cfc]/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                              <span className="w-2 h-2 bg-[#7c5cfc]/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                              <span className="w-2 h-2 bg-[#7c5cfc]/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                            </div>
                          )}
                        </div>
                      )}
                      <div className={`flex items-center justify-end gap-3 mt-1 text-xs ${message.sender === 'user' ? 'text-white/40' : 'text-[#555]'}`}>
                        {message.timestamp.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                        {message.sender === 'agent' && (
                          <>
                            <button 
                              onClick={() => copyMessage(message.id, message.content)}
                              className="flex items-center gap-1 hover:text-[#7c5cfc] transition-colors"
                            >
                              {copiedId === message.id ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                            </button>
                            <button 
                              onClick={() => retryMessage(message)}
                              className="flex items-center gap-1 hover:text-[#7c5cfc] transition-colors"
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
        </div>

        <div className="px-6 py-4 bg-[#0f0f0f] border-t border-[#1a1a1a]">
          <div className="max-w-2xl mx-auto">
            <div className="flex items-end gap-3 bg-[#1a1a1a] rounded-2xl p-3 border border-[#242424] focus-within:border-[#7c5cfc]/30 transition-colors">
              <button className="w-9 h-9 rounded-lg flex items-center justify-center text-[#666] hover:text-white hover:bg-[#242424] transition-colors flex-shrink-0">
                <Plus className="w-4 h-4" />
              </button>
              
              <textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="发消息..."
                className="flex-1 bg-transparent text-white placeholder-[#555] resize-none outline-none text-sm py-2 max-h-32"
                rows={1}
                style={{ minHeight: '40px' }}
              />
              
              <button
                onClick={() => sendMessage()}
                disabled={!inputValue.trim() || isLoading}
                className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all flex-shrink-0 ${
                  inputValue.trim() && !isLoading
                    ? 'bg-[#7c5cfc] hover:bg-[#7c5cfc]/90 text-white'
                    : 'bg-[#242424] text-[#555] cursor-not-allowed'
                }`}
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </div>
            
            <div className="flex items-center justify-center gap-4 mt-3">
              <span className="text-xs text-[#555]">快速</span>
              <span className="text-xs text-[#555]">帮我写作</span>
              <span className="text-xs text-[#555]">图像生成</span>
              <span className="text-xs text-[#555]">PPT生成</span>
              <span className="text-xs text-[#555]">编程</span>
              <span className="text-xs text-[#555]">翻译</span>
              <span className="text-xs text-[#555]">更多</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}