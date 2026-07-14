import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '@/lib/api';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'agent';
}

interface QuickCard {
  icon: string;
  title: string;
  desc: string;
  prompt: string;
}

interface HistoryItem {
  icon: string;
  label: string;
  active?: boolean;
}

const HEADER_ITEMS = ['发现', '精选', '摄影师'];

const HISTORY_ITEMS: HistoryItem[] = [
  { icon: 'grid_view', label: '构图基础', active: true },
  { icon: 'light_mode', label: '光影大师课' },
  { icon: 'palette', label: '色彩理论' },
  { icon: 'photo_library', label: '作品集评估' },
];

const QUICK_CARDS: QuickCard[] = [
  {
    icon: 'person',
    title: '人像构图建议',
    desc: '掌握三分法法则与平视连接技巧',
    prompt: '请讲讲人像构图中的三分法法则与平视连接技巧。',
  },
  {
    icon: 'shutter_speed',
    title: '长曝光拍摄技巧',
    desc: '在风光与星空摄影中捕捉流动的光影',
    prompt: '长曝光拍摄有什么技巧？如何在风光和星空摄影中使用？',
  },
  {
    icon: 'streetview',
    title: '街头摄影基础',
    desc: '学习捕捉瞬间的艺术与几何构图',
    prompt: '街头摄影有哪些基础的构图技巧和抓拍瞬间的方法？',
  },
];

type Block =
  | { type: 'p'; text: string }
  | { type: 'ul'; items: string[] }
  | { type: 'ol'; items: string[] };

function renderInline(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, index) =>
    part.startsWith('**') && part.endsWith('**') ? (
      <strong key={index}>{part.slice(2, -2)}</strong>
    ) : (
      <span key={index}>{part}</span>
    ),
  );
}

function parseBlocks(text: string): Block[] {
  const lines = text.split('\n');
  const blocks: Block[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];

    if (/^\s*[-*]\s+/.test(line)) {
      const items: string[] = [];
      while (index < lines.length && /^\s*[-*]\s+/.test(lines[index])) {
        items.push(lines[index].replace(/^\s*[-*]\s+/, ''));
        index++;
      }
      blocks.push({ type: 'ul', items });
      continue;
    }

    if (/^\s*\d+\.\s+/.test(line)) {
      const items: string[] = [];
      while (index < lines.length && /^\s*\d+\.\s+/.test(lines[index])) {
        items.push(lines[index].replace(/^\s*\d+\.\s+/, ''));
        index++;
      }
      blocks.push({ type: 'ol', items });
      continue;
    }

    if (line.trim() === '') {
      index++;
      continue;
    }

    const buffer: string[] = [];
    while (index < lines.length && lines[index].trim() !== '') {
      buffer.push(lines[index]);
      index++;
    }
    blocks.push({ type: 'p', text: buffer.join('\n') });
  }

  return blocks;
}

function Markdown({ text }: { text: string }) {
  const blocks = useMemo(() => parseBlocks(text), [text]);

  return (
    <div className="space-y-3">
      {blocks.map((block, index) =>
        block.type === 'ul' ? (
          <ul key={index} className="space-y-2">
            {block.items.map((item, itemIndex) => (
              <li key={itemIndex} className="flex gap-2">
                <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-white/50" />
                <span>{renderInline(item)}</span>
              </li>
            ))}
          </ul>
        ) : block.type === 'ol' ? (
          <ol key={index} className="space-y-2">
            {block.items.map((item, itemIndex) => (
              <li key={itemIndex} className="flex gap-2">
                <span>{itemIndex + 1}.</span>
                <span>{renderInline(item)}</span>
              </li>
            ))}
          </ol>
        ) : (
          <p key={index} className="whitespace-pre-wrap">
            {renderInline(block.text)}
          </p>
        ),
      )}
    </div>
  );
}

export function AgentChat() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [started, setStarted] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    document.documentElement.classList.add('dark');
    document.title = '摄影老师 AI | 光影集';
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, loading]);

  const autoGrow = (element: HTMLTextAreaElement) => {
    element.style.height = 'auto';
    element.style.height = `${element.scrollHeight}px`;
    if (element.scrollHeight > 200) element.style.overflowY = 'scroll';
    else element.style.overflowY = 'hidden';
  };

  const startNewChat = () => {
    abortRef.current?.abort();
    setMessages([]);
    setStarted(false);
    setLoading(false);
    setInput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const send = useCallback(
    async (text?: string) => {
      const content = (text ?? input).trim();
      if (!content || loading) return;

      setStarted(true);
      setInput('');

      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }

      const userMessage: Message = {
        id: crypto.randomUUID(),
        content,
        sender: 'user',
      };
      const agentId = crypto.randomUUID();

      setMessages((prev) => [...prev, userMessage, { id: agentId, content: '', sender: 'agent' }]);
      setLoading(true);

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const response = await fetch(`${API_BASE_URL}/agent`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: content }),
          signal: controller.signal,
        });

        if (!response.ok || !response.body) {
          throw new Error('bad response');
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith('data:')) continue;
            const data = trimmed.slice(5).trim();
            if (data === '[DONE]') continue;

            try {
              const parsed = JSON.parse(data);
              if (parsed.content) {
                setMessages((prev) =>
                  prev.map((message) =>
                    message.id === agentId
                      ? { ...message, content: message.content + parsed.content }
                      : message,
                  ),
                );
              }
            } catch {
              continue;
            }
          }
        }
      } catch (error: any) {
        if (error?.name !== 'AbortError') {
          setMessages((prev) =>
            prev.map((message) =>
              message.id === agentId && message.content === ''
                ? { ...message, content: '抱歉，我暂时无法回答你的问题。' }
                : message,
            ),
          );
        }
      } finally {
        setLoading(false);
        abortRef.current = null;
      }
    },
    [input, loading],
  );

  const onKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      send();
    }
  };

  return (
    <div className="bg-background text-on-background font-body-md selection:bg-primary/30 min-h-screen flex flex-col">
      <header className="fixed top-0 w-full z-50 bg-surface/80 dark:bg-surface/80 backdrop-blur-xl border-b border-white/10">
        <div className="flex justify-between items-center h-16 px-gutter max-w-container-max mx-auto">
          <div className="flex items-center gap-unit">
            <button
              className="font-headline-md text-headline-md text-on-surface dark:text-on-surface tracking-tight"
              onClick={() => navigate('/')}
            >
              光影集
            </button>
          </div>

          <nav className="hidden md:flex items-center gap-stack-md h-full">
            {HEADER_ITEMS.map((item) => (
              <button
                key={item}
                className="font-body-md text-body-md text-on-surface-variant dark:text-on-surface-variant hover:text-primary dark:hover:text-primary-fixed-dim transition-colors relative h-full flex items-center"
                onClick={() => navigate('/')}
              >
                {item}
              </button>
            ))}
            <button
              className="font-body-md text-body-md text-primary dark:text-primary-fixed-dim border-b-2 border-primary dark:border-primary-fixed-dim h-full flex items-center"
              onClick={() => navigate('/agent')}
            >
              摄影老师 AI
            </button>
          </nav>

          <div className="flex items-center gap-4">
            <button className="material-symbols-outlined text-on-surface-variant hover:text-primary transition-colors">
              menu
            </button>
          </div>
        </div>
      </header>

      <div className="flex flex-1 pt-16 overflow-hidden">
        <aside className="hidden lg:flex flex-col h-[calc(100vh-64px)] w-64 bg-surface-container-low dark:bg-surface-container-low border-r border-white/5 p-4 gap-unit">
          <div className="px-2 py-4">
            <h3 className="font-label-caps text-label-caps text-on-surface-variant opacity-60 mb-4">
              历史记录
            </h3>
            <div className="space-y-1">
              {HISTORY_ITEMS.map((item) => (
                <button
                  key={item.label}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2 rounded-lg group transition-all',
                    item.active
                      ? 'bg-secondary-container dark:bg-secondary-container text-on-secondary-container'
                      : 'text-on-surface-variant hover:bg-surface-variant/50',
                  )}
                >
                  <span className="material-symbols-outlined text-[20px]" data-icon={item.icon}>
                    {item.icon}
                  </span>
                  <span className="font-body-md text-body-md truncate">{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4 px-2">
            <button
              className="w-full py-3 bg-primary text-on-primary rounded-xl font-ui-button text-ui-button flex items-center justify-center gap-2 hover:brightness-110 active:scale-[0.98] transition-all"
              onClick={startNewChat}
            >
              <span className="material-symbols-outlined" data-icon="add">
                add
              </span>
              开启新对话
            </button>
          </div>

          <div className="mt-auto px-2 pb-4 space-y-1">
            {[
              { icon: 'settings', label: '设置' },
              { icon: 'help_outline', label: '帮助' },
            ].map((item) => (
              <button
                key={item.label}
                className="w-full flex items-center gap-3 px-3 py-2 text-on-surface-variant hover:bg-surface-variant/50 rounded-lg transition-all"
              >
                <span className="material-symbols-outlined text-[20px]" data-icon={item.icon}>
                  {item.icon}
                </span>
                <span className="font-body-md text-body-md">{item.label}</span>
              </button>
            ))}
          </div>
        </aside>

        <main className="flex-1 relative flex flex-col h-full bg-background overflow-hidden">
          <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none"></div>

          <div ref={scrollRef} className="relative z-10 flex-1 overflow-y-auto px-gutter py-section-padding">
            <div className="max-w-3xl mx-auto w-full flex flex-col gap-stack-md">
              {!started ? (
                <>
                  <div className="text-center mb-stack-md">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 border border-primary/20 mb-6 mx-auto">
                      <span
                        className="material-symbols-outlined text-primary text-4xl"
                        data-icon="auto_awesome"
                        data-weight="fill"
                      >
                        auto_awesome
                      </span>
                    </div>
                    <h1 className="font-headline-md text-headline-md text-on-surface mb-3 cyan-glow">
                      你好，我是你的摄影老师 AI。
                    </h1>
                    <p className="font-body-lg text-body-lg text-on-surface-variant max-w-xl mx-auto">
                      今天我该如何协助你提升视觉叙事能力？你可以询问关于构图、光影的问题，或者上传照片进行分析。
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-stack-md">
                    {QUICK_CARDS.map((card) => (
                      <button
                        key={card.title}
                        className="group p-6 glass-panel rounded-2xl text-left hover:border-primary/40 hover:bg-primary/5 transition-all active:scale-[0.98]"
                        onClick={() => send(card.prompt)}
                      >
                        <span className="material-symbols-outlined text-primary mb-4 block" data-icon={card.icon}>
                          {card.icon}
                        </span>
                        <h4 className="font-ui-button text-on-surface group-hover:text-primary transition-colors">
                          {card.title}
                        </h4>
                        <p className="mt-2 text-sm text-on-surface-variant opacity-70">{card.desc}</p>
                      </button>
                    ))}
                  </div>

                  <div className="space-y-stack-md">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-full glass-panel flex items-center justify-center flex-shrink-0">
                        <span className="material-symbols-outlined text-primary text-xl" data-icon="auto_awesome">
                          auto_awesome
                        </span>
                      </div>
                      <div className="p-6 glass-panel rounded-2xl rounded-tl-none max-w-[85%] border-l-2 border-l-primary">
                        <p className="text-body-md leading-relaxed text-on-surface">
                          欢迎回来。你上次关注的是“构图基础”。你想继续探索引导线，还是尝试新主题，比如
                          <strong>黄金时刻光影</strong>？
                        </p>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="space-y-stack-md">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={cn(
                        'flex items-start gap-4 message-fade',
                        message.sender === 'user' ? 'justify-end' : '',
                      )}
                    >
                      {message.sender === 'agent' && (
                        <div className="w-10 h-10 rounded-full glass-panel flex items-center justify-center flex-shrink-0">
                          <span className="material-symbols-outlined text-primary text-xl" data-icon="auto_awesome">
                            auto_awesome
                          </span>
                        </div>
                      )}

                      <div
                        className={cn(
                          message.sender === 'agent'
                            ? 'p-6 glass-panel rounded-2xl rounded-tl-none max-w-[85%] border-l-2 border-l-primary text-body-md leading-relaxed text-on-surface'
                            : 'max-w-[85%] rounded-2xl bg-surface-container-high text-on-surface px-5 py-4',
                        )}
                      >
                        {message.sender === 'agent' ? (
                          message.content ? (
                            <Markdown text={message.content} />
                          ) : (
                            <span className="material-symbols-outlined animate-spin">progress_activity</span>
                          )
                        ) : (
                          message.content
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="relative z-20 px-gutter pb-gutter pt-4 bg-gradient-to-t from-background via-background to-transparent">
            <div className="max-w-3xl mx-auto w-full relative">
              <div className="glass-panel rounded-2xl flex items-end p-2 gap-2 shadow-2xl focus-within:ring-1 focus-within:ring-primary/50 transition-all">
                <button
                  className="p-3 text-on-surface-variant hover:text-primary transition-colors rounded-xl"
                  title="上传照片"
                >
                  <span className="material-symbols-outlined" data-icon="add_photo_alternate">
                    add_photo_alternate
                  </span>
                </button>

                <textarea
                  ref={textareaRef}
                  className="flex-1 bg-transparent border-none focus:ring-0 text-on-surface py-3 px-2 resize-none placeholder:text-on-surface-variant/40"
                  placeholder="询问摄影技巧、器材或构图..."
                  rows={1}
                  value={input}
                  onChange={(event) => {
                    setInput(event.target.value);
                    autoGrow(event.target);
                  }}
                  onKeyDown={onKeyDown}
                />

                <button
                  className="bg-primary hover:brightness-110 p-3 rounded-xl text-on-primary transition-all active:scale-95 shadow-lg shadow-primary/20 disabled:opacity-60 disabled:cursor-not-allowed"
                  onClick={() => (loading ? abortRef.current?.abort() : send())}
                  disabled={!loading && !input.trim()}
                >
                  <span className="material-symbols-outlined" data-icon={loading ? 'progress_activity' : 'arrow_upward'}>
                    {loading ? 'progress_activity' : 'arrow_upward'}
                  </span>
                </button>
              </div>

              <div className="mt-3 flex justify-center gap-4">
                <span className="text-[10px] font-label-caps text-on-surface-variant opacity-40 uppercase tracking-widest">
                  由 CINEMATIC VISION ENGINE V4.2 提供技术支持
                </span>
              </div>
            </div>
          </div>
        </main>
      </div>

      <style>{`
        .material-symbols-outlined {
          font-variation-settings: 'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 24;
          vertical-align: middle;
        }

        .glass-panel {
          background: rgba(19, 19, 19, 0.7);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border: 1px solid rgba(255, 255, 255, 0.05);
        }

        .cyan-glow {
          text-shadow: 0 0 15px rgba(0, 218, 243, 0.4);
        }

        .message-fade {
          animation: fadeIn 0.25s ease-out;
        }

        ::-webkit-scrollbar {
          width: 4px;
        }

        ::-webkit-scrollbar-track {
          background: transparent;
        }

        ::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }

        .active-tab-indicator {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 2px;
          background: #00daf3;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(6px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
