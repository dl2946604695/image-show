import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Aperture,
  ArrowUp,
  Compass,
  HelpCircle,
  ImagePlus,
  Images,
  LayoutGrid,
  Menu,
  Palette,
  Plus,
  Settings,
  Sparkles,
  Sun,
  User,
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

type Block =
  | { type: 'p'; text: string }
  | { type: 'ul'; items: string[] }
  | { type: 'ol'; items: string[] };

function renderInline(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, index) =>
    part.startsWith('**') && part.endsWith('**') ? (
      <strong key={index} className="font-semibold text-white">
        {part.slice(2, -2)}
      </strong>
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
              <li key={itemIndex} className="flex gap-3">
                <span className="mt-[10px] h-1.5 w-1.5 shrink-0 rounded-full bg-[#9addec]" />
                <span>{renderInline(item)}</span>
              </li>
            ))}
          </ul>
        ) : block.type === 'ol' ? (
          <ol key={index} className="space-y-2">
            {block.items.map((item, itemIndex) => (
              <li key={itemIndex} className="flex gap-3">
                <span className="text-[#9addec]">{itemIndex + 1}.</span>
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
          className="h-2 w-2 animate-bounce rounded-full bg-[#c3f5ff]"
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
    document.title = '摄影老师 AI | 光影集';
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, loading]);

  const autoGrow = (element: HTMLTextAreaElement) => {
    element.style.height = 'auto';
    element.style.height = `${element.scrollHeight}px`;
    element.style.overflowY = element.scrollHeight > 200 ? 'auto' : 'hidden';
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

      const userMessage: Message = { id: crypto.randomUUID(), content, sender: 'user' };
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

  const onKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      send();
    }
  };

  return (
    <div className="min-h-screen bg-[#090a0c] text-[#e9f0f2]">
      <div className="mx-auto min-h-screen max-w-[960px] overflow-hidden rounded-[18px] border border-white/[0.08] bg-[#0b0c0e] shadow-[0_30px_80px_rgba(0,0,0,0.45)]">
        <header className="flex h-[50px] items-center justify-between border-b border-white/[0.06] bg-[rgba(16,17,19,0.96)] px-5">
          <button
            onClick={() => navigate('/')}
            className="font-['Noto_Serif_SC'] text-[18px] font-semibold text-white"
          >
            光影集
          </button>

          <nav className="hidden h-full items-center gap-8 md:flex">
            {HEADER_ITEMS.map((item) => (
              <button
                key={item}
                onClick={() => navigate('/')}
                className="flex h-full items-center border-b-2 border-transparent text-[14px] text-[#afb7bb] transition hover:text-white"
              >
                {item}
              </button>
            ))}
            <button
              onClick={() => navigate('/agent')}
              className="flex h-full items-center border-b-2 border-[#00daf3] text-[14px] font-medium text-[#00daf3]"
            >
              摄影老师 AI
            </button>
          </nav>

          <button className="rounded-md p-2 text-[#b8c1c6] transition hover:bg-white/[0.04] hover:text-white">
            <Menu className="h-4.5 w-4.5" />
          </button>
        </header>

        <div className="flex min-h-[calc(100vh-50px)]">
          <aside className="hidden w-[190px] flex-col border-r border-white/[0.06] bg-[linear-gradient(180deg,#1a1818_0%,#171616_100%)] px-4 py-5 lg:flex">
            <div>
              <div className="mb-4 text-[13px] font-medium text-[#7f888c]">历史记录</div>
              <div className="space-y-1">
                {HISTORY_ITEMS.map((item) => (
                  <button
                    key={item.label}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-[10px] px-3 py-[9px] text-left text-[15px] transition',
                      item.active
                        ? 'bg-[#4d5053] text-[#eef3f4]'
                        : 'text-[#c0c8cb] hover:bg-white/[0.04] hover:text-white',
                    )}
                  >
                    <item.icon className="h-[15px] w-[15px] shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-8">
              <button
                onClick={startNewChat}
                className="flex h-[38px] w-full items-center justify-center gap-2 rounded-[10px] bg-[#c8f4ff] text-[14px] font-semibold text-[#0b3138] transition hover:brightness-105"
              >
                <Plus className="h-4 w-4" />
                开启新对话
              </button>
            </div>

            <div className="mt-auto space-y-1 pb-2">
              {[
                { icon: Settings, label: '设置' },
                { icon: HelpCircle, label: '帮助' },
              ].map((item) => (
                <button
                  key={item.label}
                  className="flex w-full items-center gap-3 rounded-[10px] px-3 py-[9px] text-left text-[15px] text-[#c0c8cb] transition hover:bg-white/[0.04] hover:text-white"
                >
                  <item.icon className="h-[15px] w-[15px] shrink-0" />
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          </aside>

          <main className="relative flex min-w-0 flex-1 flex-col overflow-hidden bg-[#0b0c0e]">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(18,34,40,0.2),transparent_35%)]" />

            <div ref={scrollRef} className="flex-1 overflow-y-auto px-7 pb-8 pt-14">
              <div className="mx-auto flex w-full max-w-[560px] flex-col">
                {!started ? (
                  <>
                    <div className="text-center">
                      <div className="mx-auto mb-7 flex h-[56px] w-[56px] items-center justify-center rounded-full border border-[#c3f5ff]/20 bg-[#172126] shadow-[0_8px_24px_rgba(0,0,0,0.28)]">
                        <Sparkles className="h-6 w-6 text-[#c3f5ff]" />
                      </div>
                      <h1 className="mb-4 font-['Noto_Serif_SC'] text-[31px] font-semibold leading-[1.35] text-[#f2fbfd] [text-shadow:0_0_14px_rgba(0,218,243,0.35)]">
                        你好，我是你的摄影老师 AI。
                      </h1>
                      <p className="mx-auto max-w-[540px] text-[15px] leading-8 text-[#bfcbcf]">
                        今天我该如何协助你提升视觉叙事能力？你可以询问关于构图、光影的问题，或者上传照片进行分析。
                      </p>
                    </div>

                    <div className="mt-12 grid grid-cols-1 gap-4 md:grid-cols-3">
                      {QUICK_CARDS.map((card) => (
                        <button
                          key={card.title}
                          onClick={() => send(card.prompt)}
                          className="group rounded-[16px] border border-white/[0.06] bg-[rgba(13,14,17,0.86)] px-5 py-5 text-left shadow-[0_12px_28px_rgba(0,0,0,0.2)] transition hover:border-[#204951] hover:bg-[rgba(16,18,21,0.94)]"
                        >
                          <card.icon className="mb-4 h-[18px] w-[18px] text-[#d7f7ff]" />
                          <h3 className="text-[16px] font-semibold leading-7 text-[#f0f4f5] group-hover:text-white">
                            {card.title}
                          </h3>
                          <p className="mt-2 text-[14px] leading-7 text-[#8c989d]">{card.desc}</p>
                        </button>
                      ))}
                    </div>

                    <div className="mt-14 flex items-start gap-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#c3f5ff]/10 bg-[#10171b]">
                        <Sparkles className="h-[17px] w-[17px] text-[#c3f5ff]" />
                      </div>
                      <div className="flex-1 rounded-[18px] rounded-tl-[4px] border border-white/[0.05] border-l-[#9ceeff] bg-[rgba(12,14,16,0.88)] px-5 py-5 shadow-[0_12px_30px_rgba(0,0,0,0.18)]">
                        <p className="text-[15px] font-medium leading-8 text-[#edf2f3]">
                          欢迎回来。你上次关注的是“构图基础”。你想继续探索引导线，还是尝试新主题，比如
                          <strong className="font-semibold text-white">黄金时刻光影</strong>？
                        </p>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="space-y-7 pt-2">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={cn(
                          'message-fade flex gap-4',
                          message.sender === 'user' ? 'justify-end' : 'justify-start',
                        )}
                      >
                        {message.sender === 'agent' && (
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#c3f5ff]/10 bg-[#10171b]">
                            <Sparkles className="h-[17px] w-[17px] text-[#c3f5ff]" />
                          </div>
                        )}

                        <div
                          className={cn(
                            'max-w-[85%]',
                            message.sender === 'user'
                              ? 'rounded-[16px] rounded-tr-[6px] bg-[#171b1e] px-5 py-4 text-[15px] leading-7 text-white'
                              : 'rounded-[18px] rounded-tl-[4px] border border-white/[0.05] border-l-[#9ceeff] bg-[rgba(12,14,16,0.88)] px-5 py-5 text-[15px] leading-7 text-[#e5edef]',
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

            <div className="px-7 pb-6 pt-4">
              <div className="mx-auto w-full max-w-[560px]">
                <div className="rounded-[16px] border border-white/[0.05] bg-[rgba(12,14,16,0.92)] p-2 shadow-[0_12px_36px_rgba(0,0,0,0.38)]">
                  <div className="flex items-end gap-2">
                    <button
                      title="上传照片"
                      aria-label="上传照片"
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px] text-[#7e8a90] transition hover:bg-white/[0.04] hover:text-[#c3f5ff]"
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
                      className="min-h-[44px] max-h-[180px] flex-1 resize-none bg-transparent px-2 py-[11px] text-[15px] leading-7 text-[#eef3f5] placeholder:text-[#616b70] focus:outline-none"
                    />

                    <button
                      onClick={() => (loading ? abortRef.current?.abort() : send())}
                      disabled={!loading && !input.trim()}
                      className={cn(
                        'flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px] transition',
                        loading
                          ? 'bg-[#334046] text-white'
                          : input.trim()
                            ? 'bg-[#c3f5ff] text-[#0b3138] shadow-[0_6px_18px_rgba(195,245,255,0.28)] hover:brightness-105'
                            : 'cursor-not-allowed bg-[#273035] text-[#667075]',
                      )}
                    >
                      <ArrowUp className="h-[18px] w-[18px]" strokeWidth={2.6} />
                    </button>
                  </div>
                </div>

                <p className="mt-3 text-center text-[9px] font-medium uppercase tracking-[0.22em] text-[#4e565a]">
                  由 CINEMATIC VISION ENGINE V4.2 提供技术支持
                </p>
              </div>
            </div>
          </main>
        </div>
      </div>

      <style>{`
        .message-fade {
          animation: fadeIn 0.24s ease-out;
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
