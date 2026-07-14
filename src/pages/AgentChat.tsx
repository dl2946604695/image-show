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
      <strong key={index} className="font-semibold text-[#f3f7f8]">
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
              <li key={itemIndex} className="flex gap-3">
                <span className="mt-[10px] h-1.5 w-1.5 shrink-0 rounded-full bg-[#8adff0]" />
                <span>{renderInline(item)}</span>
              </li>
            ))}
          </ul>
        ) : block.type === 'ol' ? (
          <ol key={index} className="space-y-2">
            {block.items.map((item, itemIndex) => (
              <li key={itemIndex} className="flex gap-3">
                <span className="shrink-0 text-[#8adff0]">{itemIndex + 1}.</span>
                <span>{renderInline(item)}</span>
              </li>
            ))}
          </ol>
        ) : (
          <p key={index} className="whitespace-pre-wrap leading-7">
            {renderInline(block.text)}
          </p>
        ),
      )}
    </div>
  );
}

function TypingDots() {
  return (
    <span className="flex gap-1.5 py-2">
      {['0ms', '150ms', '300ms'].map((delay) => (
        <span
          key={delay}
          className="h-2.5 w-2.5 animate-bounce rounded-full bg-[#bceef7]"
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
    element.style.overflowY = element.scrollHeight > 180 ? 'auto' : 'hidden';
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
                ? { ...message, content: '抱歉，我暂时无法回答你的问题，请稍后再试。' }
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

  const shellPanel =
    'border border-white/[0.06] bg-[rgba(10,12,14,0.88)] shadow-[0_0_0_1px_rgba(255,255,255,0.02),0_18px_60px_rgba(0,0,0,0.35)]';

  const welcomeMessage = (
    <div className="flex items-start gap-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#bceef7]/16 bg-[#11181c] shadow-[0_8px_18px_rgba(0,0,0,0.3)]">
        <Sparkles className="h-[18px] w-[18px] text-[#bceef7]" />
      </div>
      <div className="flex-1 rounded-[18px] border border-white/[0.06] bg-[#0d1114] px-6 py-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]">
        <p className="text-[15px] leading-8 text-[#eaf2f4]">
          欢迎回来。你上次关注的是“构图基础”。你想继续探索引导线，还是尝试新主题，比如
          <strong className="font-semibold text-white"> 黄金时刻光影</strong>？
        </p>
      </div>
    </div>
  );

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#07090b] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(20,40,48,0.18),transparent_42%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.02),transparent_18%,transparent_82%,rgba(255,255,255,0.015))]" />

      <header className="fixed inset-x-0 top-0 z-50 border-b border-white/[0.05] bg-[rgba(8,10,12,0.86)] backdrop-blur-xl">
        <div className="mx-auto flex h-[52px] max-w-[1440px] items-center justify-between px-5 md:px-10">
          <button
            onClick={() => navigate('/')}
            className="text-[18px] font-semibold tracking-[0.01em] text-white transition hover:text-[#d5f7ff]"
          >
            光影集
          </button>

          <nav className="hidden h-full items-center gap-9 md:flex">
            {HEADER_ITEMS.map((item) => (
              <button
                key={item}
                onClick={() => navigate('/')}
                className="flex h-full items-center border-b-2 border-transparent text-[15px] text-[#b1b8bc] transition hover:text-white"
              >
                {item}
              </button>
            ))}
            <button
              onClick={() => navigate('/agent')}
              className="flex h-full items-center border-b-2 border-[#12d8f5] text-[15px] font-medium text-[#12d8f5]"
            >
              摄影老师 AI
            </button>
          </nav>

          <button
            className="flex h-9 w-9 items-center justify-center rounded-md text-[#b1b8bc] transition hover:bg-white/[0.04] hover:text-white"
            aria-label="打开菜单"
          >
            <Menu className="h-[18px] w-[18px]" />
          </button>
        </div>
      </header>

      <div className="relative flex h-screen pt-[52px]">
        <aside className="hidden w-[224px] shrink-0 border-r border-white/[0.05] bg-[linear-gradient(180deg,#151515_0%,#121212_100%)] lg:flex lg:flex-col">
          <div className="px-[18px] pb-4 pt-5">
            <div className="mb-3 text-[13px] font-medium text-[#7c858a]">历史记录</div>
            <div className="space-y-1">
              {HISTORY_ITEMS.map((item) => (
                <button
                  key={item.label}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-[10px] px-3 py-[10px] text-left text-[15px] transition',
                    item.active
                      ? 'bg-[#535759] text-[#e8ebed]'
                      : 'text-[#c3c8cb] hover:bg-white/[0.04] hover:text-white',
                  )}
                >
                  <item.icon className="h-[15px] w-[15px] shrink-0" />
                  <span className="truncate">{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="px-[18px] pt-5">
            <button
              onClick={startNewChat}
              className="flex h-[52px] w-full items-center justify-center gap-2 rounded-[12px] bg-[#c6f4ff] text-[15px] font-semibold text-[#082c35] transition hover:brightness-105 active:scale-[0.99]"
            >
              <Plus className="h-4 w-4" />
              开启新对话
            </button>
          </div>

          <div className="mt-auto px-[18px] pb-6">
            <div className="space-y-1">
              {[
                { icon: Settings, label: '设置' },
                { icon: HelpCircle, label: '帮助' },
              ].map((item) => (
                <button
                  key={item.label}
                  className="flex w-full items-center gap-3 rounded-[10px] px-3 py-[10px] text-left text-[15px] text-[#c3c8cb] transition hover:bg-white/[0.04] hover:text-white"
                >
                  <item.icon className="h-[15px] w-[15px] shrink-0" />
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        </aside>

        <main className="relative flex min-w-0 flex-1 flex-col overflow-hidden bg-[#080a0c]">
          <div
            ref={scrollRef}
            className="agent-scroll relative flex-1 overflow-y-auto px-5 pb-8 pt-8 md:px-10 md:pt-10"
          >
            <div className="mx-auto flex w-full max-w-[840px] flex-col">
              {!started ? (
                <>
                  <section className="mx-auto flex max-w-[760px] flex-col items-center pt-4 text-center">
                    <div className="mb-8 flex h-[58px] w-[58px] items-center justify-center rounded-full border border-[#bceef7]/18 bg-[linear-gradient(180deg,#18242a_0%,#10181c_100%)] shadow-[0_16px_34px_rgba(0,0,0,0.35)]">
                      <Sparkles className="h-6 w-6 text-[#c5f5ff]" />
                    </div>
                    <h1 className="mb-4 text-[28px] font-semibold leading-[1.35] tracking-[0.01em] text-[#f4fbfd] md:text-[31px]">
                      你好，我是你的摄影老师 AI。
                    </h1>
                    <p className="max-w-[660px] text-[16px] leading-8 text-[#c2cbd0]">
                      今天我该如何协助你提升视觉叙事能力？你可以问关于构图、光影的问题，或者上传照片进行分析。
                    </p>
                  </section>

                  <section className="mx-auto mt-12 grid w-full max-w-[760px] grid-cols-1 gap-4 md:grid-cols-3">
                    {QUICK_CARDS.map((card) => (
                      <button
                        key={card.title}
                        onClick={() => send(card.prompt)}
                        className={cn(
                          'group rounded-[16px] px-5 py-6 text-left transition duration-200 hover:border-[#1e4d57] hover:bg-[#0d1216]',
                          shellPanel,
                        )}
                      >
                        <card.icon className="mb-5 h-[18px] w-[18px] text-[#d3f6ff]" />
                        <h2 className="text-[17px] font-semibold leading-7 text-[#f0f6f8] transition group-hover:text-white">
                          {card.title}
                        </h2>
                        <p className="mt-3 text-[14px] leading-7 text-[#9ea8ad]">{card.desc}</p>
                      </button>
                    ))}
                  </section>

                  <section className="mx-auto mt-12 w-full max-w-[760px]">{welcomeMessage}</section>
                </>
              ) : (
                <section className="mx-auto w-full max-w-[760px] space-y-7 pt-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={cn(
                        'message-fade flex gap-4',
                        message.sender === 'user' ? 'justify-end' : 'justify-start',
                      )}
                    >
                      {message.sender === 'agent' && (
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#bceef7]/16 bg-[#11181c]">
                          <Sparkles className="h-[18px] w-[18px] text-[#bceef7]" />
                        </div>
                      )}

                      <div
                        className={cn(
                          'max-w-[86%]',
                          message.sender === 'user'
                            ? 'rounded-[18px] rounded-tr-[6px] bg-[#171c1f] px-5 py-4 text-[15px] leading-7 text-[#f3f7f8]'
                            : cn(
                                'rounded-[18px] rounded-tl-[6px] border-l border-l-[#a8eefa] px-6 py-5 text-[15px] text-[#e4edf0]',
                                shellPanel,
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
                </section>
              )}
            </div>
          </div>

          <div className="relative z-10 px-5 pb-6 pt-4 md:px-10">
            <div className="mx-auto w-full max-w-[760px]">
              <div
                className={cn(
                  'rounded-[18px] border border-white/[0.06] bg-[#090d10] shadow-[0_-10px_40px_rgba(0,0,0,0.25),0_24px_50px_rgba(0,0,0,0.32)]',
                  'focus-within:border-[#90e7f7]/30 focus-within:shadow-[0_0_0_1px_rgba(144,231,247,0.1),0_24px_50px_rgba(0,0,0,0.32)]',
                )}
              >
                <div className="flex items-end gap-2 px-3 py-3">
                  <button
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px] text-[#8f9aa1] transition hover:bg-white/[0.04] hover:text-[#d5f7ff]"
                    title="上传照片"
                    aria-label="上传照片"
                  >
                    <ImagePlus className="h-[18px] w-[18px]" />
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
                    className="max-h-[180px] min-h-[44px] flex-1 resize-none bg-transparent px-2 py-[11px] text-[15px] leading-7 text-[#edf3f5] placeholder:text-[#5f686d] focus:outline-none"
                  />

                  <button
                    onClick={() => (loading ? abortRef.current?.abort() : send())}
                    disabled={!loading && !input.trim()}
                    aria-label={loading ? '停止生成' : '发送消息'}
                    className={cn(
                      'flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px] transition active:scale-[0.98]',
                      loading
                        ? 'bg-[#30393d] text-white hover:bg-[#394247]'
                        : input.trim()
                          ? 'bg-[#c6f4ff] text-[#082c35] shadow-[0_8px_20px_rgba(198,244,255,0.28)] hover:brightness-105'
                          : 'cursor-not-allowed bg-[#2a3034] text-[#6a7276]',
                    )}
                  >
                    {loading ? (
                      <Loader2 className="h-[18px] w-[18px] animate-spin" />
                    ) : (
                      <ArrowUp className="h-[18px] w-[18px]" strokeWidth={2.6} />
                    )}
                  </button>
                </div>
              </div>

              <p className="mt-3 text-center text-[9px] font-medium uppercase tracking-[0.22em] text-[#4f575c]">
                CINEMATIC VISION ENGINE V4.2 提供技术支持
              </p>
            </div>
          </div>
        </main>
      </div>

      <style>{`
        .message-fade {
          animation: messageFade 0.24s ease-out;
        }

        .agent-scroll::-webkit-scrollbar {
          width: 4px;
        }

        .agent-scroll::-webkit-scrollbar-track {
          background: transparent;
        }

        .agent-scroll::-webkit-scrollbar-thumb {
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.1);
        }

        @keyframes messageFade {
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
