import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, Sparkles, Trash2, Plus, ChevronLeft, MoreVertical } from 'lucide-react';

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

export function AgentChat() {
  const [conversations, setConversations] = useState<Conversation[]>([
    {
      id: '1',
      name: '摄影老师',
      lastMessage: '你好！我是摄影老师，有什么关于摄影的问题可以问我。',
      timestamp: new Date(),
    },
  ]);
  const [currentConversationId, setCurrentConversationId] = useState('1');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: '你好！我是摄影老师，有什么关于摄影的问题可以问我。',
      sender: 'agent',
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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
    setIsLoading(true);

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

    try {
      const response = await fetch('/api/agent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: userMessage.content }),
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
    setConversations(prev => prev.map(c => 
      c.id === currentConversationId 
        ? { ...c, lastMessage: messages[messages.length - 1]?.content || '', timestamp: new Date() }
        : c
    ));
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
      lastMessage: '你好！我是摄影老师，有什么关于摄影的问题可以问我。',
      timestamp: new Date(),
    };
    setConversations(prev => [newConversation, ...prev]);
    setCurrentConversationId(newId);
    setMessages([{
      id: '1',
      content: '你好！我是摄影老师，有什么关于摄影的问题可以问我。',
      sender: 'agent',
      timestamp: new Date(),
    }]);
    setMobileMenuOpen(false);
  };

  const deleteConversation = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (conversations.length === 1) {
      createNewConversation();
    }
    setConversations(prev => prev.filter(c => c.id !== id));
    if (currentConversationId === id && conversations.length > 1) {
      const next = conversations.find(c => c.id !== id);
      if (next) {
        setCurrentConversationId(next.id);
        setMessages([{
          id: '1',
          content: '你好！我是摄影老师，有什么关于摄影的问题可以问我。',
          sender: 'agent',
          timestamp: new Date(),
        }]);
      }
    }
  };

  return (
    <div className="min-h-screen bg-bg flex">
      <div className={`fixed lg:static inset-y-0 left-0 z-50 w-72 bg-bg-secondary border-r border-border transform transition-transform duration-300 ease-out ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="h-full flex flex-col">
          <div className="p-4 border-b border-border">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-text-primary">对话</h2>
              <button 
                onClick={createNewConversation}
                className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center hover:bg-accent/20 transition-colors"
              >
                <Plus className="w-4 h-4 text-accent" />
              </button>
            </div>
            
            <div className="relative">
              <input
                type="text"
                placeholder="搜索对话..."
                className="w-full bg-bg-tertiary border border-border rounded-xl px-4 py-2.5 text-sm text-text-primary placeholder-text-tertiary focus:outline-none focus:border-accent/50 transition-colors"
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
                    ? 'bg-accent/10 border border-accent/20'
                    : 'hover:bg-bg-tertiary border border-transparent'
                }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  currentConversationId === conversation.id ? 'bg-accent/20' : 'bg-white/10'
                }`}>
                  <Bot className="w-5 h-5 text-accent" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-text-primary truncate">{conversation.name}</span>
                    <span className="text-xs text-text-quaternary flex-shrink-0">{conversation.timestamp.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <p className="text-xs text-text-tertiary truncate mt-0.5">{conversation.lastMessage}</p>
                </div>

                <button
                  onClick={(e) => deleteConversation(conversation.id, e)}
                  className="opacity-0 group-hover:opacity-100 w-7 h-7 rounded-lg flex items-center justify-center text-text-quaternary hover:text-red-500 hover:bg-red-500/10 transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          <div className="p-4 border-t border-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent/30 to-purple-500/30 flex items-center justify-center border border-accent/20">
                <Sparkles className="w-5 h-5 text-accent" />
              </div>
              <div>
                <div className="text-sm font-medium text-text-primary">摄影老师</div>
                <div className="text-xs text-text-tertiary">AI 助手</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex items-center justify-between px-4 py-3 bg-bg-secondary border-b border-border lg:px-6">
          <button 
            onClick={() => setMobileMenuOpen(true)}
            className="lg:hidden w-8 h-8 rounded-lg flex items-center justify-center hover:bg-bg-tertiary transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-text-secondary" />
          </button>
          
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-accent/20 flex items-center justify-center">
              <Bot className="w-5 h-5 text-accent" />
            </div>
            <div>
              <div className="text-sm font-medium text-text-primary">摄影老师</div>
              <div className="text-xs text-green-500 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                在线
              </div>
            </div>
          </div>

          <button className="w-8 h-8 rounded-lg flex items-center justify-center text-text-tertiary hover:text-text-secondary hover:bg-bg-tertiary transition-colors">
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 lg:p-6">
          <div className="max-w-3xl mx-auto space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex items-end gap-3 max-w-[85%] ${message.sender === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    message.sender === 'user' 
                      ? 'bg-accent/20' 
                      : 'bg-white/10'
                  }`}>
                    {message.sender === 'user' ? (
                      <User className="w-4.5 h-4.5 text-accent" />
                    ) : (
                      <Bot className="w-4.5 h-4.5 text-accent" />
                    )}
                  </div>
                  
                  <div className={`rounded-2xl ${
                    message.sender === 'user'
                      ? 'bg-accent text-white rounded-br-sm'
                      : 'bg-bg-card text-text-primary rounded-bl-sm border border-border'
                  }`}>
                    <div className="px-4 py-3">
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                      {message.content === '' && isLoading && (
                        <div className="flex gap-1.5 mt-3">
                          <span className="w-2 h-2 bg-accent/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                          <span className="w-2 h-2 bg-accent/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                          <span className="w-2 h-2 bg-accent/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                      )}
                    </div>
                    <div className={`px-4 pb-1.5 text-xs ${message.sender === 'user' ? 'text-white/50' : 'text-text-quaternary'}`}>
                      {message.timestamp.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </div>

        <div className="px-4 py-4 bg-bg-secondary border-t border-border lg:px-6">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-end gap-3 bg-bg-card rounded-2xl p-2 border border-border focus-within:border-accent/50 transition-colors">
              <button className="w-9 h-9 rounded-xl flex items-center justify-center text-text-tertiary hover:text-accent hover:bg-accent/10 transition-colors flex-shrink-0">
                <Sparkles className="w-4.5 h-4.5" />
              </button>
              
              <textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="输入你的问题..."
                className="flex-1 bg-transparent text-text-primary placeholder-text-tertiary resize-none outline-none text-sm py-2.5 max-h-32"
                rows={1}
                style={{ minHeight: '40px' }}
              />
              
              <button
                onClick={sendMessage}
                disabled={!inputValue.trim() || isLoading}
                className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all flex-shrink-0 ${
                  inputValue.trim() && !isLoading
                    ? 'bg-accent hover:bg-accent/90 text-white shadow-lg shadow-accent/25'
                    : 'bg-bg-tertiary text-text-quaternary cursor-not-allowed'
                }`}
              >
                {isLoading ? (
                  <Loader2 className="w-4.5 h-4.5 animate-spin" />
                ) : (
                  <Send className="w-4.5 h-4.5" />
                )}
              </button>
            </div>
            
            <p className="text-xs text-text-quaternary text-center mt-3">
              AI 生成的内容仅供参考，请谨慎使用
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}