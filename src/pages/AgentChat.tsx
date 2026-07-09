import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, Loader2, Plus, Send, ChevronLeft, Image, Sparkles, FileText } from 'lucide-react';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'agent';
  timestamp: Date;
}

const suggestionCards = [
  '如何拍出好看的人像？',
  '风景摄影构图技巧',
  '新手买什么相机？',
  '后期修图怎么入门？',
];

const plusMenuItems = [
  { icon: Image, label: '上传图片' },
  { icon: Sparkles, label: '生成图片' },
  { icon: FileText, label: '写文案' },
];

export function AgentChat() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: '你好！我是摄影老师，有任何摄影问题都可以问我。',
      sender: 'agent',
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasStartedChatting, setHasStartedChatting] = useState(false);
  const [showPlusMenu, setShowPlusMenu] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const plusMenuRef = useRef<HTMLDivElement>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = Math.min(inputRef.current.scrollHeight, 96) + 'px';
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (hasStartedChatting && inputRef.current) {
      inputRef.current.focus();
    }
  }, [hasStartedChatting]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (plusMenuRef.current && !plusMenuRef.current.contains(event.target as Node)) {
        setShowPlusMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const sendMessageInternal = useCallback(async (content: string, agentMessageId: string) => {
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
  }, []);

  const sendMessage = useCallback(async (text?: string) => {
    const messageContent = text || inputValue.trim();
    if (!messageContent || isLoading) return;

    if (!hasStartedChatting) {
      setHasStartedChatting(true);
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      content: messageContent,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    if (inputRef.current) {
      inputRef.current.style.height = '44px';
    }

    const agentMessageId = (Date.now() + 1).toString();
    setMessages(prev => [...prev, {
      id: agentMessageId,
      content: '',
      sender: 'agent',
      timestamp: new Date(),
    }]);

    await sendMessageInternal(userMessage.content, agentMessageId);
  }, [inputValue, isLoading, hasStartedChatting, sendMessageInternal]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handlePlusClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowPlusMenu(!showPlusMenu);
  };

  return (
    <div className="min-h-screen bg-[#0F1115] flex flex-col">
      <header className="fixed top-0 left-0 right-0 z-50 h-14 bg-[#0F1115]/80 backdrop-blur-md flex items-center px-6 border-b border-[#1A1D24]">
        <button 
          onClick={() => navigate('/')}
          className="w-9 h-9 rounded-lg flex items-center justify-center text-[#A0A0A0] hover:text-[#FFFFFF] hover:bg-[#1A1D24] transition-all duration-200 mr-3"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <span className="text-[#FFFFFF] text-base font-medium">摄影老师</span>
      </header>

      <main className="flex-1 overflow-y-auto pt-14 pb-24">
        <div className="max-w-[720px] mx-auto px-6">
          {!hasStartedChatting ? (
            <div className="flex flex-col items-center justify-center min-h-[calc(100vh-8rem)] animate-fade-in">
              <div className="flex flex-col items-center text-center mb-10">
                <div className="w-20 h-20 rounded-full bg-[#1A1D24] flex items-center justify-center mb-5">
                  <Camera className="w-10 h-10 text-[#4A90D9]" />
                </div>
                <h1 className="text-xl font-semibold text-[#FFFFFF] mb-2">摄影老师</h1>
                <p className="text-sm text-[#A0A0A0] max-w-[280px]">任何摄影问题，我都可以帮你解决</p>
              </div>

              <div className="w-full grid grid-cols-2 gap-3">
                {suggestionCards.map((card, index) => (
                  <button
                    key={index}
                    onClick={() => sendMessage(card)}
                    className="group bg-[#1A1D24] rounded-[16px] px-5 py-4 text-left hover:bg-[#23272F] hover:scale-[1.02] transition-all duration-200"
                  >
                    <span className="text-sm text-[#FFFFFF] group-hover:text-[#4A90D9] transition-colors">{card}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-5 pt-6 animate-fade-in">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {message.sender === 'agent' && (
                    <div className="w-8 h-8 rounded-full bg-[#1A1D24] flex items-center justify-center flex-shrink-0 mr-3">
                      <Camera className="w-4 h-4 text-[#4A90D9]" />
                    </div>
                  )}

                  <div className={`max-w-[75%] ${message.sender === 'user' ? 'text-right' : ''}`}>
                    {message.sender === 'user' ? (
                      <div className="bg-[#1A1D24] text-[#FFFFFF] text-sm leading-relaxed rounded-2xl rounded-tr-sm px-4 py-3">
                        {message.content}
                      </div>
                    ) : (
                      <div className="text-[#FFFFFF] text-sm leading-relaxed">
                        {message.content}
                        {message.content === '' && isLoading && (
                          <div className="flex gap-1.5 mt-3">
                            <span className="w-2 h-2 bg-[#4A90D9]/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                            <span className="w-2 h-2 bg-[#4A90D9]/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                            <span className="w-2 h-2 bg-[#4A90D9]/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                          </div>
                        )}
                      </div>
                    )}

                    <div className={`flex items-center justify-end gap-3 mt-1.5 text-xs text-[#A0A0A0]`}>
                      {message.timestamp.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </main>

      <footer className="fixed bottom-0 left-0 right-0 bg-[#0F1115]/90 backdrop-blur-md border-t border-[#1A1D24]">
        <div className="max-w-[720px] mx-auto px-6 py-3">
          <div className="relative">
            {showPlusMenu && (
              <div 
                ref={plusMenuRef}
                className="absolute bottom-full left-0 mb-2 bg-[#1A1D24] rounded-xl overflow-hidden shadow-xl animate-fade-in"
              >
                {plusMenuItems.map((item, index) => (
                  <button
                    key={index}
                    className="w-full px-5 py-3 flex items-center gap-3 text-left hover:bg-[#23272F] transition-colors"
                  >
                    <item.icon className="w-4 h-4 text-[#A0A0A0]" />
                    <span className="text-sm text-[#FFFFFF]">{item.label}</span>
                  </button>
                ))}
              </div>
            )}

            <div className="flex items-center bg-[#1A1D24] rounded-[24px] px-1">
              <button 
                onClick={handlePlusClick}
                className="w-10 h-10 rounded-full flex items-center justify-center text-[#A0A0A0] hover:text-[#FFFFFF] hover:bg-[#23272F] transition-all duration-200 flex-shrink-0"
              >
                <Plus className="w-5 h-5" />
              </button>

              <textarea
                ref={inputRef}
                value={inputValue}
                onChange={handleInputChange}
                onKeyPress={handleKeyPress}
                placeholder="输入你的摄影问题..."
                className="flex-1 bg-transparent text-[#FFFFFF] placeholder-[#A0A0A0] resize-none outline-none text-sm py-3 px-2 max-h-24"
                rows={1}
                style={{ minHeight: '44px' }}
              />

              <button
                onClick={() => sendMessage()}
                disabled={!inputValue.trim() || isLoading}
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 flex-shrink-0 ${
                  inputValue.trim() && !isLoading
                    ? 'bg-[#4A90D9] hover:bg-[#3D7BC4] text-[#FFFFFF]'
                    : 'bg-[#23272F] text-[#555] cursor-not-allowed'
                }`}
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        </div>
      </footer>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}