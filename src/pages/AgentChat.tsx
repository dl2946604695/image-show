import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Aperture,
  ArrowUp,
  Bot,
  Compass,
  HelpCircle,
  ImagePlus,
  Images,
  LayoutGrid,
  Palette,
  Plus,
  Settings,
  Sparkles,
  Square,
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
    desc: '学习如何利用自然光，捕捉最具表现力的瞬间。',
    prompt: '请讲讲人像构图中的三分法、视线引导和自然光运用技巧。',
  },
  {
    icon: Aperture,
    title: '长曝光拍摄技巧',
    desc: '掌握流水的丝滑感与城市车轨的动感。',
    prompt: '长曝光拍摄有哪些关键技巧？如何在风光和城市夜景中使用？',
  },
  {
    icon: Compass,
    title: '街头摄影基础',
    desc: '在平凡中发现不凡，学习复杂环境里的精准预判。',
    prompt: '街头摄影有哪些基础构图技巧和抓拍瞬间的方法？',
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
                <span className="mt-[10px] h-1.5 w-1.5 shrink-0 rounded-full bg-[#00d4ff]" />
                <span>{renderInline(item)}</span>
              </li>
            ))}
          </ul>
        ) : block.type === 'ol' ? (
          <ol key={index} className="space-y-2">
            {block.items.map((item, itemIndex) => (
              <li key={itemIndex} className="flex gap-3">
                <span className="text-[#00d4ff]">{itemIndex + 1}.</span>
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
          className="h-2 w-2 animate-bounce rounded-full bg-[#00d4ff]"
          style={{ animationDelay: delay }}
        />
      ))}
    </span>
  );
}

export function AgentChat() {
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

      const userMessage: Message = { id: crypto.randomUUID(), content, sender: 'user' };
      const contextMessages = [...messages, userMessage]
        .filter((message) => message.content.trim())
        .slice(-8)
        .map((message) => ({
          role: message.sender === 'user' ? 'user' : 'assistant',
          content: message.content,
        }));
      const agentId = crypto.randomUUID();
      setMessages((prev) => [...prev, userMessage, { id: agentId, content: '', sender: 'agent' }]);
      setLoading(true);

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const response = await fetch(`${API_BASE_URL}/agent`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: content, messages: contextMessages }),
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
      } catch (error: unknown) {
        if (!(error instanceof DOMException && error.name === 'AbortError')) {
          setMessages((prev) =>
            prev.map((message) =>
              message.id === agentId && message.content === ''
                ? {
                    ...message,
                    content:
                      '抱歉，我暂时无法回答你的问题。你可以稍后再试，或先描述拍摄场景、光线条件和想解决的摄影问题。',
                  }
                : message,
            ),
          );
        }
      } finally {
        setLoading(false);
        abortRef.current = null;
      }
    },
    [input, loading, messages],
  );

  const onKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      send();
    }
  };

  return (
    <div className="agent-page">
      <div className="agent-shell">
        <aside className="agent-sidebar">
          <div>
            <h2 className="font-['Noto_Serif_SC'] text-[18px] font-semibold text-[#e5e2e1]">
              历史记录
            </h2>
            <p className="mt-1 text-[10px] text-[#687174]">最近的对话</p>
          </div>

          <div className="agent-history-list">
            {HISTORY_ITEMS.map((item) => (
              <button
                key={item.label}
                className={cn('agent-history-button', item.active && 'agent-history-button-active')}
              >
                <span
                  className={cn('agent-history-icon', item.active && 'agent-history-icon-active')}
                >
                  <item.icon className="h-3.5 w-3.5" />
                </span>
                <span className="truncate">{item.label}</span>
              </button>
            ))}
          </div>

          <div className="agent-sidebar-footer">
            <button
              onClick={startNewChat}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-[9px] bg-[#00d4ff] text-[14px] font-bold text-[#001f24] shadow-[0_0_22px_rgba(0,212,255,0.16)] transition hover:brightness-105"
            >
              <Plus className="h-4 w-4" />
              开启新对话
            </button>

            <div className="agent-sidebar-tools">
              {[
                { icon: Settings, label: '设置' },
                { icon: HelpCircle, label: '帮助' },
              ].map((item) => (
                <button
                  key={item.label}
                  className="agent-sidebar-tool"
                >
                  <span className="agent-sidebar-tool-icon">
                    <item.icon className="h-3 w-3" />
                  </span>
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        </aside>

        <main className="agent-main">
          <div className="agent-left-gutter" />
          <div className="agent-right-gutter" />

          <div
            ref={scrollRef}
            className="agent-scroll"
          >
            <div className="agent-content">
              {!started ? (
                <div className="flex flex-1 flex-col">
                  <section className="agent-hero">
                    <h1 className="agent-title">
                      你好，我是你的摄影老师 AI。
                    </h1>
                    <p className="agent-subtitle">
                      今天我该如何协助你提升视觉叙事能力？
                    </p>
                  </section>

                  <section className="agent-quick-grid">
                    {QUICK_CARDS.map((card) => (
                      <button
                        key={card.title}
                        onClick={() => send(card.prompt)}
                        className="agent-quick-card"
                      >
                        <span className="agent-quick-icon">
                          <card.icon className="h-5 w-5" />
                        </span>
                        <h3 className="agent-quick-title">{card.title}</h3>
                        <p className="agent-quick-desc">{card.desc}</p>
                      </button>
                    ))}
                  </section>

                  <section className="agent-welcome-row">
                    <div className="agent-avatar">
                      <Sparkles className="h-5 w-5" />
                    </div>
                    <div className="agent-welcome-bubble">
                      欢迎回来，我已准备好协助你的创作。无论是针对构图技巧的深入讨论，还是对你最新摄影作品的专业点评，我们现在就可以开始。
                    </div>
                  </section>
                  <p className="agent-welcome-meta">刚才 · AI 摄影老师</p>
                </div>
              ) : (
                <div className="agent-chat-thread">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={cn('agent-message-row message-fade', message.sender === 'user' && 'agent-message-row-user')}
                    >
                      {message.sender === 'agent' && (
                        <div className="agent-message-avatar">
                          <Bot className="h-[18px] w-[18px]" />
                        </div>
                      )}

                      <div
                        className={cn(
                          'agent-message-bubble',
                          message.sender === 'user' ? 'agent-message-bubble-user' : 'agent-message-bubble-ai',
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

          <div className="agent-input-area">
            <div className="agent-input-wrap">
              <div className="agent-input-box">
                <div className="agent-input-row">
                  <button
                    type="button"
                    title="图片点评能力即将上线"
                    aria-label="上传照片用于 AI 点评"
                    className="agent-attach-button"
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
                    className="agent-textarea"
                  />

                  <button
                    type="button"
                    onClick={() => (loading ? abortRef.current?.abort() : send())}
                    disabled={!loading && !input.trim()}
                    aria-label={loading ? '停止生成' : '发送问题'}
                    className={cn(
                      'agent-send-button',
                      loading
                        ? 'agent-send-button-loading'
                        : input.trim()
                          ? 'agent-send-button-ready'
                          : 'agent-send-button-disabled',
                    )}
                  >
                    {loading ? (
                      <Square className="h-4 w-4 fill-current" />
                    ) : (
                      <ArrowUp className="h-[18px] w-[18px]" strokeWidth={2.6} />
                    )}
                  </button>
                </div>
              </div>

              <p className="mt-3 text-center text-[9px] font-medium uppercase tracking-[0.34em] text-[#5f6466]">
                Powered by Light & Shadow Intelligence
              </p>
            </div>
          </div>
        </main>
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
