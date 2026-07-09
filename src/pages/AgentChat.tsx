import { useState, useRef, useEffect } from 'react';
import { Camera, User, Loader2, Plus, ChevronLeft, Menu, MoreVertical, Copy, Check, RefreshCw } from 'lucide-react';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'agent';
  timestamp: Date;
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

    await sendMessageInternal(userMessage.content, agentMessageId);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const navigate = (path: string) => {
    if (path !== '/agent') {
      window.location.href = path;
    }
  };

  const hasMessages = messages.length > 1;

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

      <main className="flex-1 overflow-y-auto pt-20 pb-48">
        <div className="max-w-2xl mx-auto px-8">
          {!hasMessages && (
            <div className="flex flex-col items-center pt-16 pb-12">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#00d4ff]/20 to-[#00d4ff]/5 flex items-center justify-center mb-6 shadow-lg shadow-black/20">
                <Camera className="w-10 h-10 text-[#00d4ff]" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">摄影老师</h3>
              <p className="text-[#666] text-sm">有任何摄影相关问题都可以向我提问</p>

              <div className="flex flex-wrap justify-center gap-3 mt-10">
                {suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => sendMessage(suggestion)}
                    className="px-4 py-2.5 bg-[#242424] hover:bg-[#2d2d2d] text-[#999] hover:text-white text-sm rounded-full border border-[#2d2d2d] hover:border-[#00d4ff]/30 transition-all duration-200"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}

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
          <div className="flex items-end gap-3 bg-[#242424] rounded-2xl p-3 border border-[#2d2d2d] focus-within:border-[#00d4ff]/30 transition-all duration-200">
            <button className="w-10 h-10 rounded-xl flex items-center justify-center text-[#999] hover:text-white hover:bg-[#2d2d2d] transition-all duration-200 flex-shrink-0">
              <Plus className="w-5 h-5" />
            </button>

            <textarea
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
                  ? 'bg-[#00d4ff] hover:bg-[#00d4ff]/90 text-black hover:scale-105'
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
    </div>
  );
}