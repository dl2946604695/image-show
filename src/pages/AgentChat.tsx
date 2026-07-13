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

/* ==========================================================================
   ㏘ 类型
   ========================================================================== */

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

/* ==========================================================================
   ㏘ 静态数据（完全按设计稿）
   ========================================================================== */

const QUICK_CARDS: QuickCard[] = [
  {
    icon: User,
    title: '人像构图建议',
    desc: '掌握三分法法则与平视连接技巧',
    prompt: '请讲讲人像构图中的三分法法则与平视连接技巧',
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
    prompt: '街头摄影有哪些基础的构图技巧和捕捉瞬间的方法？',
  },
];

/* ==========================================================================
   ㏘ 轻量 Markdown 渲染
   ========================================================================== */

function renderInline(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((p, i) =>
    p.startsWith('**') && p.endsWith('**') ? (
      <strong key={i} className="font-semibold text-[#e5e2e1]">
        {p.slice(2, -2)}
      </strong>
    ) : (
      <span key={i}>{p}</span>
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
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (/^\s*[-*]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*[-*]\s+/, ''));
        i++;
      }
      blocks.push({ type: 'ul', items });
    } else if (/^\s*\d+\.\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*\d+\.\s+/, ''));
        i++;
      }
      blocks.push({ type: 'ol', items });
    } else if (line.trim() === '') {
      i++;
    } else {
      const buf: string[] = [];
      while (i < lines.length && lines[i].trim() !== '') {
        buf.push(lines[i]);
        i++;
      }
      blocks.push({ type: 'p', text: buf.join('\n') });
    }
  }
  return blocks;
}

function Markdown({ text }: { text: string }) {
  const blocks = useMemo(() => parseBlocks(text), [text]);
  return (
    <div className="space-y-3">
      {blocks.map((b, i) =>
        b.type === 'ul' ? (
          <ul key={i} className="ml-1 space-y-1.5">
            {b.items.map((it, j) => (
              <li key={j} className="flex gap-2">
                <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-[#8a8a8a]" />
                <span>{renderInline(it)}</span>
              </li>
            ))}
          </ul>
        ) : b.type === 'ol' ? (
          <ol key={i} className="ml-1 space-y-1.5">
            {b.items.map((it, j) => (
              <li key={j} className="flex gap-2">
                <span className="text-[#8a8a8a]">{j + 1}.</span>
                <span>{renderInline(it)}</span>
              </li>
            ))}
          </ol>
        ) : (
          <p key={i} className="whitespace-pre-wrap leading-relaxed">
            {renderInline(b.text)}
          </p>
        ),
      )}
    </div>
  );
}

function TypingDots() {
  return (
    <span className="flex gap-1 py-2">
      {['0ms', '150ms', '300ms'].map((d) => (
        <span
          key={d}
          className="h-2 w-2 animate-bounce rounded-full bg-[#c3f5ff]/70"
          style={{ animationDelay: d }}
        />
      ))}
    </span>
  );
}

/* ==========================================================================
   ㏘ 页面组件
   ========================================================================== */

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

  const autoGrow = (el: HTMLTextAreaElement) => {
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 200) + 'px';
  };

  const startNewChat = () => {
    abortRef.current?.abort();
    setMessages([]);
    setStarted(false);
    setInput('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  };

  const send = useCallback(
    async (text?: string) => {
      const content = (text ?? input).trim();
      if (!content || loading) return;

      setStarted(true);
      setInput('');
      if (textareaRef.current) textareaRef.current.style.height = 'auto';

      const userMsg: Message = { id: crypto.randomUUID(), content, sender: 'user' };
      const agentId = crypto.randomUUID();
      setMessages((prev) => [...prev, userMsg, { id: agentId, content: '', sender: 'agent' }]);
      setLoading(true);

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const res = await fetch(`${API_BASE_URL}/agent`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: content }),
          signal: controller.signal,
        });

        if (!res.ok || !res.body) throw new Error('bad response');

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';
          for (const line of lines) {
            const t = line.trim();
            if (!t.startsWith('data:')) continue;
            const data = t.slice(5).trim();
            if (data === '[DONE]') continue;
            try {
              const parsed = JSON.parse(data);
              if (parsed.content) {
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === agentId ? { ...m, content: m.content + parsed.content } : m,
                  ),
                );
              }
            } catch {
              /* 无法解析的行，跳过 */
            }
          }
        }
      } catch (err: any) {
        if (err?.name !== 'AbortError') {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === agentId && m.content === ''
                ? { ...m, content: '抱歉，我暂时无法回答你的问题。' }
                : m,
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

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  /* ==========================================================================
     ㏘ 渲染
     ========================================================================== */

  // ── glass-panel class ──
  const glassCN =
    'bg-[rgba(19,19,19,0.7)] backdrop-blur-[24px] border border-white/[0.05]';

  // ── 欢迎消息气泡（未说话时展示）──
  const welcomeMessage = (
    <div className="flex items-start gap-4">
      <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-full', glassCN)}>
        <Sparkles className="h-5 w-5 text-[#c3f5ff]" />
      </div>
      <div
        className={cn(
          'max-w-[85%] rounded-2xl rounded-tl-none border-l-2 border-l-[#c3f5ff] p-6',
          glassCN,
        )}
      >
        <p className="text-[16px] leading-relaxed text-[#e5e2e1]" style={{ fontFamily: 'Manrope' }}>
          欢迎回来。你上次关注的是"构图基础"。你想继续探索引导线，还是尝试新主题，比如
          <strong className="font-semibold text-[#e5e2e1]">黄金时刻光影</strong>？
        </p>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#131313] text-[#e5e2e1] selection:bg-[#c3f5ff]/30">
      {/* ════════════════════════════════════════════════════════════
          顶部导航
          ════════════════════════════════════════════════════════════ */}
      <header className="fixed top-0 z-50 w-full border-b border-white/10 bg-[#131313]/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between px-6">
          {/* 品牌 */}
          <button
            onClick={() => navigate('/')}
            className="text-[32px] font-semibold leading-[1.4] tracking-tight text-[#e5e2e1] transition hover:text-white"
            style={{ fontFamily: 'Noto Serif' }}
          >
            光影集
          </button>

          {/* 导航链接 */}
          <nav className="hidden h-full items-center gap-8 md:flex">
            {['发现', '精选', '摄影师'].map((label) => (
              <button
                key={label}
                onClick={() => navigate('/')}
                className="flex h-full items-center text-[16px] leading-[1.6] text-[#bac9cc] transition-colors hover:text-[#00daf3]"
                style={{ fontFamily: 'Manrope' }}
              >
                {label}
              </button>
            ))}
            <button
              onClick={() => navigate('/agent')}
              className="flex h-full items-center border-b-2 border-[#00daf3] text-[16px] leading-[1.6] text-[#00daf3] transition-colors"
              style={{ fontFamily: 'Manrope' }}
            >
              摄影老师 AI
            </button>
          </nav>

          {/* 汉堡菜单 */}
          <button className="text-[#bac9cc] transition-colors hover:text-[#c3f5ff]">
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </header>

      {/* ════════════════════════════════════════════════════════════
          主体：侧栏 + 主区
          ════════════════════════════════════════════════════════════ */}
      <div className="flex flex-1 overflow-hidden pt-16">
        {/* ── 左侧边栏 ── */}
        <aside className="hidden h-full w-64 flex-col gap-2 border-r border-white/5 bg-[#1c1b1b] p-4 lg:flex">
          {/* 历史记录 */}
          <div className="px-2 py-4">
            <h3
              className="mb-4 text-[14px] font-medium uppercase tracking-[0.2em] text-[#bac9cc] opacity-60"
              style={{ fontFamily: 'Space Grotesk', lineHeight: '1.0' }}
            >
              历史记录
            </h3>
            <div className="space-y-1">
              {[
                { icon: LayoutGrid, label: '构图基础', active: true },
                { icon: Sun, label: '光影大师课', active: false },
                { icon: Palette, label: '色彩理论', active: false },
                { icon: Images, label: '作品集评估', active: false },
              ].map((item) => (
                <button
                  key={item.label}
                  className={cn(
                    'group flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-all',
                    item.active
                      ? 'bg-[#454747] text-[#b4b5b5]'
                      : 'text-[#bac9cc] hover:bg-[#353534]/50',
                  )}
                >
                  <item.icon className="h-5 w-5 shrink-0" />
                  <span className="truncate text-[16px] leading-[1.6]" style={{ fontFamily: 'Manrope' }}>
                    {item.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* 开启新对话 */}
          <div className="mt-4 px-2">
            <button
              onClick={startNewChat}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#c3f5ff] py-3 text-[15px] font-semibold leading-[1.0] text-[#00363d] transition hover:brightness-110 active:scale-[0.98]"
              style={{ fontFamily: 'Manrope' }}
            >
              <Plus className="h-4 w-4" />
              开启新对话
            </button>
          </div>

          {/* 底部设置/帮助 */}
          <div className="mt-auto space-y-1 px-2 pb-4">
            {[
              { icon: Settings, label: '设置' },
              { icon: HelpCircle, label: '帮助' },
            ].map((item) => (
              <button
                key={item.label}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-[#bac9cc] transition hover:bg-[#353534]/50"
              >
                <item.icon className="h-5 w-5" />
                <span className="text-[16px] leading-[1.6]" style={{ fontFamily: 'Manrope' }}>
                  {item.label}
                </span>
              </button>
            ))}
          </div>
        </aside>

        {/* ── 主对话区 ── */}
        <main className="relative flex flex-1 flex-col bg-[#131313] overflow-hidden">
          {/* 滚动区域 */}
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto px-6 py-20"
          >
            <div className="mx-auto flex w-full max-w-3xl flex-col gap-8">
              {!started ? (
                <>
                  {/* ── 欢迎标题 ── */}
                  <div className="mb-8 text-center">
                    <div className="mx-auto mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full border border-[#c3f5ff]/20 bg-[#c3f5ff]/10">
                      <Sparkles className="h-7 w-7 text-[#c3f5ff]" />
                    </div>
                    <h1
                      className="mb-3 text-[32px] font-semibold leading-[1.4] text-[#e5e2e1]"
                      style={{
                        fontFamily: 'Noto Serif',
                        textShadow: '0 0 15px rgba(0,218,243,0.4)',
                      }}
                    >
                      你好，我是你的摄影老师 AI。
                    </h1>
                    <p
                      className="mx-auto max-w-xl text-[18px] leading-[1.6] tracking-[0.01em] text-[#bac9cc]"
                      style={{ fontFamily: 'Manrope' }}
                    >
                      今天我该如何协助你提升视觉叙事能力？你可以询问关于构图、光影的问题，或者上传照片进行分析。
                    </p>
                  </div>

                  {/* ── 快捷卡片 ── */}
                  <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
                    {QUICK_CARDS.map((c) => (
                      <button
                        key={c.title}
                        onClick={() => send(c.prompt)}
                        className={cn(
                          'group rounded-2xl p-6 text-left transition-all active:scale-[0.98]',
                          'hover:border-[#c3f5ff]/40 hover:bg-[#c3f5ff]/5',
                          glassCN,
                        )}
                      >
                        <c.icon className="mb-4 h-6 w-6 text-[#c3f5ff]" />
                        <h4
                          className="text-[15px] font-semibold leading-[1.0] text-[#e5e2e1] transition-colors group-hover:text-[#c3f5ff]"
                          style={{ fontFamily: 'Manrope' }}
                        >
                          {c.title}
                        </h4>
                        <p
                          className="mt-2 text-sm text-[#bac9cc] opacity-70"
                          style={{ fontFamily: 'Manrope' }}
                        >
                          {c.desc}
                        </p>
                      </button>
                    ))}
                  </div>

                  {/* ── 欢迎消息 ── */}
                  {welcomeMessage}
                </>
              ) : (
                /* ── 对话列表 ── */
                <div className="space-y-8">
                  {messages.map((m) => (
                    <div
                      key={m.id}
                      className={cn(
                        'flex gap-4 msg-in',
                        m.sender === 'user' ? 'justify-end' : 'justify-start',
                      )}
                    >
                      {m.sender === 'agent' && (
                        <div
                          className={cn(
                            'flex h-10 w-10 shrink-0 items-center justify-center rounded-full',
                            glassCN,
                          )}
                        >
                          <Sparkles className="h-5 w-5 text-[#c3f5ff]" />
                        </div>
                      )}
                      <div
                        className={cn(
                          'max-w-[85%]',
                          m.sender === 'user'
                            ? 'rounded-2xl rounded-tr-sm bg-[#1a1a1a] px-5 py-3 text-[16px] text-white'
                            : cn(
                                'rounded-2xl rounded-tl-none border-l-2 border-l-[#c3f5ff] p-6 text-[16px] leading-relaxed text-[#e5e2e1]',
                                glassCN,
                              ),
                        )}
                        style={{ fontFamily: 'Manrope' }}
                      >
                        {m.sender === 'agent' ? (
                          m.content ? (
                            <Markdown text={m.content} />
                          ) : (
                            <TypingDots />
                          )
                        ) : (
                          m.content
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ════════════════════════════════════════════════════════════
              输入栏
              ════════════════════════════════════════════════════════════ */}
          <div className="relative z-20 bg-gradient-to-t from-[#131313] via-[#131313] to-transparent px-6 pb-6 pt-4">
            <div className="mx-auto w-full max-w-3xl">
              <div
                className={cn(
                  'flex items-end gap-2 rounded-2xl p-2 shadow-2xl transition-all focus-within:ring-1 focus-within:ring-[#c3f5ff]/50',
                  glassCN,
                )}
              >
                {/* 上传照片按钮 */}
                <button
                  className="rounded-xl p-3 text-[#bac9cc] transition hover:text-[#c3f5ff]"
                  title="上传照片"
                >
                  <ImagePlus className="h-5 w-5" />
                </button>

                {/* 输入框 */}
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => {
                    setInput(e.target.value);
                    autoGrow(e.target);
                  }}
                  onKeyDown={onKeyDown}
                  rows={1}
                  placeholder="询问摄影技巧、器材或构图..."
                  className="flex-1 resize-none border-none bg-transparent px-2 py-3 text-[16px] leading-[1.6] text-[#e5e2e1] placeholder:text-[#bac9cc]/40 focus:ring-0"
                  style={{ fontFamily: 'Manrope' }}
                />

                {/* 发送/停止按钮 */}
                <button
                  onClick={() => (loading ? abortRef.current?.abort() : send())}
                  disabled={!loading && !input.trim()}
                  aria-label={loading ? '停止生成' : '发送'}
                  className={cn(
                    'rounded-xl p-3 shadow-lg shadow-[#c3f5ff]/20 transition-all active:scale-95',
                    loading
                      ? 'bg-[#454747] text-[#e5e2e1] hover:bg-[#2a2a2a]'
                      : input.trim()
                        ? 'bg-[#c3f5ff] text-[#00363d] hover:brightness-110'
                        : 'cursor-not-allowed bg-[#454747] text-[#6a6a6a]',
                  )}
                >
                  {loading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <ArrowUp className="h-5 w-5" strokeWidth={2.5} />
                  )}
                </button>
              </div>

              {/* 底注 */}
              <p
                className="mt-3 text-center text-[10px] uppercase tracking-widest text-[#bac9cc] opacity-40"
                style={{ fontFamily: 'Space Grotesk' }}
              >
                由 CINEMATIC VISION ENGINE V4.2 提供技术支持
              </p>
            </div>
          </div>
        </main>
      </div>

      {/* ════════════════════════════════════════════════════════════
          全局样式
          ════════════════════════════════════════════════════════════ */}
      <style>{`
        /* 消息淡入动画 */
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .msg-in { animation: fadeIn 0.25s ease-out; }

        /* 4px 细滚动条 */
        ::-webkit-scrollbar       { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
      `}</style>
    </div>
  );
}
