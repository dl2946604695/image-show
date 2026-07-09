import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, Loader2, Plus, ChevronLeft, Menu, MoreVertical, Copy, Check, RefreshCw, Sparkles, Zap, Target, Palette, Lightbulb, BookOpen } from 'lucide-react';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'agent';
  timestamp: Date;
}

const defaultWelcomeMessage = '你好！我是摄影老师，有什么关于摄影的问题可以问我。';

const suggestionCards = [
  {
    icon: Sparkles,
    title: '如何拍出好的人像？',
    description: '掌握人像摄影的核心技巧，让你的照片更有质感',
  },
  {
    icon: Target,
    title: '风景摄影技巧',
    description: '学习构图、光线和时机，捕捉大自然的美丽瞬间',
  },
  {
    icon: Camera,
    title: '新手买什么相机？',
    description: '根据预算和需求，选择适合你的第一台相机',
  },
  {
    icon: Palette,
    title: '后期修图入门',
    description: '掌握基本的后期处理技巧，提升照片品质',
  },
  {
    icon: Lightbulb,
    title: '拍照构图方法',
    description: '学习三分法、对称构图等经典构图法则',
  },
  {
    icon: Zap,
    title: '如何选择镜头？',
    description: '了解不同焦段镜头的特点和适用场景',
  },
];

const tabs = [
  { label: '光影集', path: '/' },
  { label: '探索', path: '/' },
  { label: '精选', path: '/' },
  { label: '摄影师', path: '/' },
  { label: '摄影老师', path: '/agent' },
];

const quickActions = [
  '快速',
  '帮我写作',
  '图像生成',
  'PPT生成',
  '编程',
  '翻译',
  '更多',
];

export function AgentChat() {
  const navigate = useNavigate();
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
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [hasStartedChatting, setHasStartedChatting] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const welcomeInputRef = useRef<HTMLTextAreaElement>(null);
  const conversationInputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!hasStartedChatting && welcomeInputRef.current) {
      setTimeout(() => welcomeInputRef.current?.focus(), 100);
    } else if (hasStartedChatting && conversationInputRef.current) {
      conversationInputRef.current.focus();
    }
  }, [hasStartedChatting]);

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

    const agentMessageId = (Date.now() + 1).toString();
    setMessages(prev => [...prev, {
      id: agentMessageId,
      content: '',
      sender: 'agent',
      timestamp: new Date(),
    }]);

    await sendMessageInternal(userMessage.content, agentMessageId);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="min-h-screen bg-[#161616] flex flex-col">
      <header className="fixed top-0 left-0 right-0 z-50 h-14 bg-[#121212]/80 backdrop-blur-xl border-b border-[#2a2a2a] flex items-center justify-between px-6">
        <button 
          onClick={() => navigate('/')}
          className="w-10 h-10 rounded-xl flex items-center justify-center text-[#999] hover:text-white hover:bg-[#2a2a2a] transition-all duration-200"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.label}
              onClick={() => navigate(tab.path)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                tab.path === '/agent'
                  ? 'bg-[#00d4ff]/15 text-[#00d4ff]'
                  : 'text-[#999] hover:text-white hover:bg-[#2a2a2a]/50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button className="w-10 h-10 rounded-xl flex items-center justify-center text-[#999] hover:text-white hover:bg-[#2a2a2a] transition-all duration-200">
            <Menu className="w-5 h-5" />
          </button>
          <button className="w-10 h-10 rounded-xl flex items-center justify-center text-[#999] hover:text-white hover:bg-[#2a2a2a] transition-all duration-200">
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>
      </header>

      {!hasStartedChatting ? (
        <main className="flex-1 flex flex-col items-center justify-center pt-20 pb-20 px-6">
          <div className="max-w-3xl w-full">
            <div className="flex flex-col items-center text-center mb-12">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#00d4ff]/30 via-[#00d4ff]/15 to-[#00d4ff]/5 flex items-center justify-center mb-6 shadow-xl shadow-black/30">
                <Camera className="w-12 h-12 text-[#00d4ff]" />
              </div>
              <h1 className="text-3xl font-semibold text-white mb-3">摄影老师</h1>
              <p className="text-[#666] text-lg max-w-md">有任何摄影相关问题都可以向我提问，从入门到精通，我来帮你解答</p>
            </div>

            <div className="bg-[#1c1c1c] rounded-2xl p-5 border border-[#2a2a2a] focus-within:border-[#00d4ff]/40 focus-within:shadow-lg focus-within:shadow-[#00d4ff]/10 transition-all duration-300 mb-10">
              <textarea
                ref={welcomeInputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="输入你的摄影问题，或从下方选择一个话题..."
                className="w-full bg-transparent text-white placeholder-[#555] resize-none outline-none text-base py-4 max-h-40"
                rows={3}
                style={{ minHeight: '100px' }}
              />
              <div className="flex items-center justify-between pt-3 border-t border-[#2a2a2a]">
                <div className="flex items-center gap-4 text-xs text-[#555]">
                  <span>按 Enter 发送</span>
                  <span>Shift + Enter 换行</span>
                </div>
                <button
                  onClick={() => sendMessage()}
                  disabled={!inputValue.trim() || isLoading}
                  className={`px-6 h-11 rounded-xl flex items-center gap-2 transition-all duration-200 ${
                    inputValue.trim() && !isLoading
                      ? 'bg-[#00d4ff] hover:bg-[#00d4ff]/90 text-black hover:scale-105 shadow-lg shadow-[#00d4ff]/20'
                      : 'bg-[#2a2a2a] text-[#555] cursor-not-allowed'
                  }`}
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Camera className="w-4 h-4" />
                      <span className="text-sm font-medium">发送</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-6">
                <BookOpen className="w-4 h-4 text-[#00d4ff]" />
                <span className="text-sm font-medium text-white">热门话题</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {suggestionCards.map((card, index) => (
                  <button
                    key={index}
                    onClick={() => sendMessage(card.title)}
                    className="group text-left bg-[#1c1c1c] rounded-xl p-4 border border-[#2a2a2a] hover:border-[#00d4ff]/30 hover:bg-[#242424] transition-all duration-300 hover:shadow-lg hover:shadow-[#00d4ff]/5"
                  >
                    <div className="w-10 h-10 rounded-lg bg-[#00d4ff]/10 flex items-center justify-center mb-3 group-hover:bg-[#00d4ff]/20 transition-colors">
                      <card.icon className="w-5 h-5 text-[#00d4ff]" />
                    </div>
                    <h3 className="text-sm font-medium text-white mb-1 group-hover:text-[#00d4ff] transition-colors">
                      {card.title}
                    </h3>
                    <p className="text-xs text-[#666]">{card.description}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </main>
      ) : (
        <>
          <main className="flex-1 overflow-y-auto pt-20 pb-48">
            <div className="max-w-2xl mx-auto px-8">
              <div className="space-y-6 pt-8">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {message.sender === 'agent' && (
                      <div className="w-9 h-9 rounded-full bg-[#242424] flex items-center justify-center flex-shrink-0 mr-3 shadow-md">
                        <Camera className="w-4.5 h-4.5 text-[#00d4ff]" />
                      </div>
                    )}

                    <div className={`max-w-[75%] ${message.sender === 'user' ? 'text-right' : ''}`}>
                      {message.sender === 'user' ? (
                        <div className="bg-[#00d4ff] text-white text-sm leading-relaxed rounded-2xl rounded-tr-sm px-5 py-3.5 shadow-lg shadow-[#00d4ff]/10">
                          {message.content}
                        </div>
                      ) : (
                        <div className="bg-white text-black text-sm leading-relaxed rounded-2xl rounded-tl-sm px-5 py-3.5 shadow-lg shadow-black/20">
                          {message.content}
                          {message.content === '' && isLoading && (
                            <div className="flex gap-1.5 mt-3">
                              <span className="w-2 h-2 bg-[#00d4ff]/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                              <span className="w-2 h-2 bg-[#00d4ff]/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                              <span className="w-2 h-2 bg-[#00d4ff]/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                            </div>
                          )}
                        </div>
                      )}

                      <div className={`flex items-center justify-end gap-3 mt-2 text-xs ${message.sender === 'user' ? 'text-white/40' : 'text-[#555]'}`}>
                        {message.timestamp.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                        {message.sender === 'agent' && message.content && (
                          <>
                            <button 
                              onClick={() => copyMessage(message.id, message.content)}
                              className="opacity-0 hover:opacity-100 flex items-center gap-1 text-[#555] hover:text-[#00d4ff] transition-all duration-200"
                            >
                              {copiedId === message.id ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                            <button 
                              onClick={() => retryMessage(message)}
                              className="opacity-0 hover:opacity-100 flex items-center gap-1 text-[#555] hover:text-[#00d4ff] transition-all duration-200"
                            >
                              <RefreshCw className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </div>
          </main>

          <footer className="fixed bottom-0 left-0 right-0 bg-[#121212]/90 backdrop-blur-xl border-t border-[#2a2a2a]">
            <div className="max-w-2xl mx-auto px-8 py-4">
              <div className="flex items-end gap-3 bg-[#242424] rounded-2xl p-3 border border-[#2d2d2d] focus-within:border-[#00d4ff]/30 focus-within:shadow-lg focus-within:shadow-[#00d4ff]/5 transition-all duration-200">
                <button className="w-10 h-10 rounded-xl flex items-center justify-center text-[#999] hover:text-white hover:bg-[#2d2d2d] transition-all duration-200 flex-shrink-0">
                  <Plus className="w-5 h-5" />
                </button>

                <textarea
                  ref={conversationInputRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="输入你的摄影相关问题..."
                  className="flex-1 bg-transparent text-white placeholder-[#555] resize-none outline-none text-sm py-2.5 max-h-36"
                  rows={1}
                  style={{ minHeight: '44px' }}
                />

                <button
                  onClick={() => sendMessage()}
                  disabled={!inputValue.trim() || isLoading}
                  className={`px-5 h-10 rounded-xl flex items-center gap-2 transition-all duration-200 flex-shrink-0 ${
                    inputValue.trim() && !isLoading
                      ? 'bg-[#00d4ff] hover:bg-[#00d4ff]/90 text-black hover:scale-105 shadow-lg shadow-[#00d4ff]/20'
                      : 'bg-[#2d2d2d] text-[#555] cursor-not-allowed'
                  }`}
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Camera className="w-4 h-4" />
                      <span className="text-sm font-medium">发送</span>
                    </>
                  )}
                </button>
              </div>

              <div className="flex items-center justify-center gap-5 mt-4 pb-1">
                {quickActions.map((action, index) => (
                  <button
                    key={index}
                    className="text-xs text-[#555] hover:text-[#999] transition-colors duration-200"
                  >
                    {action}
                  </button>
                ))}
              </div>
            </div>
          </footer>
        </>
      )}
    </div>
  );
}