import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  User,
  Aperture,
  Compass,
  Plus,
  ImagePlus,
  ArrowUp,
  LayoutGrid,
  Sun,
  Palette,
  Images,
  Settings,
  HelpCircle,
  Menu,
  Loader2,
} from 'lucide-react';
import { API_BASE_URL } from '@/lib/api';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'agent';
}

interface QuickCard {
  icon: typeof User;
  title: string;
  desc: string;
  prompt: string;
}

interface HistoryItem {
  icon: typeof LayoutGrid;
  label: string;
  active?: boolean;
}

const HEADER_ITEMS = ['发现', '精选', '摄影师'];

const HISTORY_ITEMS: HistoryItem[] = [
  { icon: LayoutGrid, label: '构图基础', active: true },
  { icon: Sun, label: '光影大师课' },
  { icon: Palette, label: '色彩理论' },
  { icon: Images, label: '作品集评估' },
];

const QUICK_CARDS: QuickCard[] = [
  {
    icon: User,
    title: '人像构图建议',
    desc: '掌握三分法法则与平视连接技巧',
    prompt: '请讲讲人像构图中的三分法法则与平视连接技巧。',
  },
  {
    icon: Aperture,
    title: '长曝光拍摄技巧',
    desc: '在风光与星空摄影中捕捉流动的光影',
    prompt: '长曝光拍摄有什么技巧？如何在风光和星空摄影中使用？',
  },
  {
    icon: Compass,
    title: '街头摄影基础',
    desc: '学习捕捉瞬间的艺术与几何构图',
    prompt: '街头摄影有哪些基础的构图技巧和抓拍瞬间的方法？',
  },
];

function renderInline(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, index) =>
    part.startsWith('**') && part.endsWith('**') ? (
      <strong key={index} className="font-semibold text-[#e5e2e1]">
        {part.slice(2, -2)}
      </strong>
    ) : (
      <span key={index}>{part}</span>
    ),
  );
}

type Block =
  | { type: 'p'; text: string }
  | { type: 'ul'; items: string[] }
  | { type: 'ol'; items: string[] };

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
                <span className="mt-[10px] h-1 w-1 shrink-0 rounded-full bg-[#8a8a8a]" />
                <span>{renderInline(item)}</span>
              </li>
            ))}
          </ul>
        ) : block.type === 'ol' ? (
          <ol key={index} className="space-y-2">
            {block.items.map((item, itemIndex) => (
              <li key={itemIndex} className="flex gap-2">
                <span className="text-[#8a8a8a]">{itemIndex + 1}.</span>
                <span>{renderInline(item)}</span>
              </li>
            ))}
          </ol>
        ) : (
          <p key={index} className="whitespace-pre-wrap leading-relaxed">
            {renderInline(block.text)}
          </p>
        ),
      )}
    </div>
  );
}

function TypingDots() {
  return (
    <span className="flex gap-1 py-2">
      {['0ms', '150ms', '300ms'].map((delay) => (
        <span
          key={delay}
          className="h-2 w-2 animate-bounce rounded-full bg-[#c3f5ff]/70"
          style={{ animationDelay: delay }}
        />
      ))}
    </span>
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
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, loading]);

  const autoGrow = (element: HTMLTextAreaElement) => {
    element.style.height = 'auto';
    element.style.height = `${element.scrollHeight}px`;
    element.style.overflowY = element.scrollHeight > 200 ? 'scroll' : 'hidden';
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

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      send();
    }
  };

  const glassPanel =
    'bg-[rgba(19,19,19,0.7)] backdrop-blur-[24px] border border-white/[0.05]';

  return (
    <div className="min-h-screen bg-[#131313] text-[#e5e2e1] selection:bg-[#c3f5ff]/30">
      <header className="fixed top-0 z-50 w-full border-b border-white/10 bg-[#131313]/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/')}
              className="font-['Noto_Serif_SC'] text-[32px] font-semibold leading-[1.4] tracking-tight text-[#e5e2e1]"
            >
              光影集
            </button>
          </div>

          <nav className="hidden h-full items-center gap-8 md:flex">
            {HEADER_ITEMS.map((item) => (
              <button
                key={item}
                onClick={() => navigate('/')}
                className="flex h-full items-center font-['Manrope'] text-[16px] leading-[1.6] text-[#bac9cc] transition-colors hover:text-[#00daf3]"
              >
                {item}
              </button>
            ))}
            <button
              onClick={() => navigate('/agent')}
              className="flex h-full items-center border-b-2 border-[#00daf3] font-['Manrope'] text-[16px] leading-[1.6] text-[#00daf3]"
            >
              摄影老师 AI
            </button>
          </nav>

          <div className="flex items-center gap-4">
            <button
              aria-label="打开菜单"
              className="text-[#bac9cc] transition-colors hover:text-[#00daf3]"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden pt-16">
        <aside className="hidden h-[calc(100vh-64px)] w-64 flex-col gap-2 border-r border-white/5 bg-[#1c1b1b] p-4 lg:flex">
          <div className="px-2 py-4">
            <h3 className="mb-4 font-['Space_Grotesk'] text-[14px] font-medium uppercase leading-none tracking-[0.2em] text-[#bac9cc] opacity-60">
              历史记录
            </h3>
            <div className="space-y-1">
              {HISTORY_ITEMS.map((item) => (
                <button
                  key={item.label}
                  className={cn(
                    'w-full rounded-lg px-3 py-2 text-left transition-all',
                    'flex items-center gap-3',
                    item.active
                      ? 'bg-[#454747] text-[#b4b5b5]'
                      : 'text-[#bac9cc] hover:bg-[#353534]/50',
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  <span className="truncate font-['Manrope'] text-[16px] leading-[1.6]">
                    {item.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4 px-2">
            <button
              onClick={startNewChat}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#c3f5ff] py-3 font-['Manrope'] text-[15px] font-semibold leading-none text-[#00363d] transition-all hover:brightness-110 active:scale-[0.98]"
            >
              <Plus className="h-4 w-4" />
              开启新对话
            </button>
          </div>

          <div className="mt-auto space-y-1 px-2 pb-4">
            {[
              { icon: Settings, label: '设置' },
              { icon: HelpCircle, label: '帮助' },
            ].map((item) => (
              <button
                key={item.label}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-[#bac9cc] transition-all hover:bg-[#353534]/50"
              >
                <item.icon className="h-5 w-5" />
                <span className="font-['Manrope'] text-[16px] leading-[1.6]">{item.label}</span>
              </button>
            ))}
          </div>
        </aside>

        <main className="relative flex h-full flex-1 flex-col overflow-hidden bg-[#131313]">
          <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" />

          <div
            ref={scrollRef}
            className="relative z-10 flex-1 overflow-y-auto px-6 py-20 agent-scroll"
          >
            <div className="mx-auto flex w-full max-w-3xl flex-col gap-8">
              {!started ? (
                <>
                  <div className="mb-8 text-center">
                    <div className="mx-auto mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full border border-[#c3f5ff]/20 bg-[#c3f5ff]/10">
                      <Sparkles className="h-8 w-8 text-[#c3f5ff]" />
                    </div>
                    <h1 className="mb-3 font-['Noto_Serif_SC'] text-[32px] font-semibold leading-[1.4] text-[#e5e2e1] [text-shadow:0_0_15px_rgba(0,218,243,0.4)]">
                      你好，我是你的摄影老师 AI。
                    </h1>
                    <p className="mx-auto max-w-xl font-['Manrope'] text-[18px] font-normal leading-[1.6] tracking-[0.01em] text-[#bac9cc]">
                      今天我该如何协助你提升视觉叙事能力？你可以询问关于构图、光影的问题，或者上传照片进行分析。
                    </p>
                  </div>

                  <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
                    {QUICK_CARDS.map((card) => (
                      <button
                        key={card.title}
                        onClick={() => send(card.prompt)}
                        className={cn(
                          'group rounded-2xl p-6 text-left transition-all active:scale-[0.98]',
                          'hover:border-[#c3f5ff]/40 hover:bg-[#c3f5ff]/5',
                          glassPanel,
                        )}
                      >
                        <card.icon className="mb-4 block h-6 w-6 text-[#c3f5ff]" />
                        <h4 className="font-['Manrope'] text-[15px] font-semibold leading-none text-[#e5e2e1] transition-colors group-hover:text-[#c3f5ff]">
                          {card.title}
                        </h4>
                        <p className="mt-2 font-['Manrope'] text-sm text-[#bac9cc] opacity-70">
                          {card.desc}
                        </p>
                      </button>
                    ))}
                  </div>

                  <div className="space-y-8">
                    <div className="flex items-start gap-4">
                      <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-full', glassPanel)}>
                        <Sparkles className="h-5 w-5 text-[#c3f5ff]" />
                      </div>
                      <div
                        className={cn(
                          'max-w-[85%] rounded-2xl rounded-tl-none border-l-2 border-l-[#c3f5ff] p-6',
                          glassPanel,
                        )}
                      >
                        <p className="font-['Manrope'] text-[16px] leading-relaxed text-[#e5e2e1]">
                          欢迎回来。你上次关注的是“构图基础”。你想继续探索引导线，还是尝试新主题，比如
                          <strong> 黄金时刻光影</strong>？
                        </p>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="space-y-8">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={cn(
                        'message-fade flex gap-4',
                        message.sender === 'user' ? 'justify-end' : 'justify-start',
                      )}
                    >
                      {message.sender === 'agent' && (
                        <div
                          className={cn(
                            'flex h-10 w-10 shrink-0 items-center justify-center rounded-full',
                            glassPanel,
                          )}
                        >
                          <Sparkles className="h-5 w-5 text-[#c3f5ff]" />
                        </div>
                      )}
                      <div
                        className={cn(
                          'max-w-[85%]',
                          message.sender === 'user'
                            ? 'rounded-2xl rounded-tr-sm bg-[#1a1a1a] px-5 py-3 text-[16px] text-white'
                            : cn(
                                'rounded-2xl rounded-tl-none border-l-2 border-l-[#c3f5ff] p-6 text-[16px] leading-relaxed text-[#e5e2e1]',
                                glassPanel,
                              ),
                        )}
                      >
                        {message.sender === 'agent' ? (
                          message.content ? (
                            <Markdown text={message.content} />
                          ) : (
                            <TypingDots />
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

          <div className="relative z-20 bg-gradient-to-t from-[#131313] via-[#131313] to-transparent px-6 pb-6 pt-4">
            <div className="relative mx-auto w-full max-w-3xl">
              <div
                className={cn(
                  'flex items-end gap-2 rounded-2xl p-2 shadow-2xl transition-all focus-within:ring-1 focus-within:ring-[#c3f5ff]/50',
                  glassPanel,
                )}
              >
                <button
                  title="上传照片"
                  aria-label="上传照片"
                  className="rounded-xl p-3 text-[#bac9cc] transition-colors hover:text-[#c3f5ff]"
                >
                  <ImagePlus className="h-5 w-5" />
                </button>

                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(event) => {
                    setInput(event.target.value);
                    autoGrow(event.target);
                  }}
                  onKeyDown={onKeyDown}
                  rows={1}
                  placeholder="询问摄影技巧、器材或构图..."
                  className="flex-1 resize-none border-none bg-transparent px-2 py-3 text-[#e5e2e1] placeholder:text-[#bac9cc]/40 focus:outline-none focus:ring-0"
                />

                <button
                  onClick={() => (loading ? abortRef.current?.abort() : send())}
                  disabled={!loading && !input.trim()}
                  aria-label={loading ? '停止生成' : '发送'}
                  className={cn(
                    'rounded-xl p-3 transition-all active:scale-95 shadow-lg shadow-[#c3f5ff]/20',
                    loading
                      ? 'bg-[#454747] text-[#e5e2e1] hover:bg-[#575959]'
                      : input.trim()
                        ? 'bg-[#c3f5ff] text-[#00363d] hover:brightness-110'
                        : 'cursor-not-allowed bg-[#2e2f2f] text-[#6d7476]',
                  )}
                >
                  {loading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <ArrowUp className="h-5 w-5" />
                  )}
                </button>
              </div>

              <div className="mt-3 flex justify-center gap-4">
                <span className="font-['Space_Grotesk'] text-[10px] font-medium uppercase tracking-widest text-[#bac9cc] opacity-40">
                  由 CINEMATIC VISION ENGINE V4.2 提供技术支持
                </span>
              </div>
            </div>
          </div>
        </main>
      </div>

      <style>{`
        .message-fade {
          animation: fadeIn 0.25s ease-out;
        }

        .agent-scroll::-webkit-scrollbar {
          width: 4px;
        }

        .agent-scroll::-webkit-scrollbar-track {
          background: transparent;
        }

        .agent-scroll::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
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
