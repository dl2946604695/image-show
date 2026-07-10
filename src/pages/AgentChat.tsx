import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Send,
  Loader2,
  Sparkles,
  ImageIcon,
  Compass,
  Palette,
  Plus,
  Settings as SettingsIcon,
  HelpCircle,
  ArrowUp,
  Camera,
  History,
} from 'lucide-react';
import { API_BASE_URL } from '@/lib/api';
import { cn } from '@/lib/utils';

/* ---------- 类型 ---------- */

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'agent';
}

interface ChatSession {
  id: string;
  title: string;
  icon: typeof Camera;
  active?: boolean;
}

interface Suggestion {
  icon: typeof Camera;
  title: string;
  desc: string;
  prompt: string;
}

/* ---------- 静态数据（严格对齐参考图） ---------- */

const HISTORY: ChatSession[] = [
  { id: '1', title: '构图基础', icon: ImageIcon, active: true },
  { id: '2', title: '光影大师课', icon: Sparkles },
  { id: '3', title: '色彩理论', icon: Palette },
  { id: '4', title: '作品集评估', icon: Compass },
];

const SUGGESTIONS: Suggestion[] = [
  {
    icon: Camera,
    title: '人像构图建议',
    desc: '掌握三分法法则与平视连接技巧',
    prompt: '请讲讲人像构图中的三分法法则与平视连接技巧',
  },
  {
    icon: Sparkles,
    title: '长曝光拍摄技巧',
    desc: '在风光与星空摄影中捕捉流动的光影',
    prompt: '长曝光拍摄有什么技巧?如何在风光和星空摄影中使用?',
  },
  {
    icon: Compass,
    title: '街头摄影基础',
    desc: '学习捕捉瞬间的艺术与几何构图',
    prompt: '街头摄影有哪些基础的构图技巧和捕捉瞬间的方法?',
  },
];

/* ---------- 轻量 Markdown（段落/列表/加粗） ---------- */

function renderInline(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((p, i) =>
    p.startsWith('**') && p.endsWith('**') ? (
      <strong key={i} className="font-semibold text-white">
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
          <p key={i} className="whitespace-pre-wrap">
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
          className="h-2 w-2 animate-bounce rounded-full bg-[#00d4ff]/70"
          style={{ animationDelay: d }}
        />
      ))}
    </span>
  );
}

/* ---------- 页面 ---------- */

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
    el.style.height = Math.min(el.scrollHeight, 180) + 'px';
  };

  const startNewChat = () => {
    abortRef.current?.abort();
    setMessages([]);
    setStarted(false);
    setInput('');
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
              /* 忽略无法解析的行 */
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

  return (
    <div className="flex h-screen overflow-hidden bg-[#0a0a0a] text-[#d4d4d4]">
      {/* ============== 左侧历史栏 ============== */}
      <aside className="hidden w-[240px] shrink-0 flex-col border-r border-[#1a1a1a] bg-[#0a0a0a] md:flex">
        {/* Logo 区 */}
        <button
          onClick={() => navigate('/')}
          className="flex h-14 items-center gap-2 border-b border-[#1a1a1a] px-5 text-left transition hover:bg-[#101010]"
        >
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-[#00d4ff] to-[#7c3aed]">
            <Camera className="h-3.5 w-3.5 text-white" />
          </div>
          <span className="text-[15px] font-semibold tracking-wide text-white">光影集</span>
        </button>

        {/* 历史记录 */}
        <div className="flex-1 overflow-y-auto px-3 py-4">
          <div className="mb-2 flex items-center gap-1.5 px-2 text-[11px] font-medium uppercase tracking-wider text-[#666]">
            <History className="h-3 w-3" />
            <span>历史记录</span>
          </div>
          <div className="space-y-0.5">
            {HISTORY.map((h) => (
              <button
                key={h.id}
                className={cn(
                  'group flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-[13px] transition',
                  h.active
                    ? 'bg-[#ededed] text-[#0a0a0a]'
                    : 'text-[#b4b4b4] hover:bg-[#141414]',
                )}
              >
                <h.icon
                  className={cn(
                    'h-4 w-4 shrink-0',
                    h.active ? 'text-[#0a0a0a]' : 'text-[#888]',
                  )}
                />
                <span className="truncate">{h.title}</span>
              </button>
            ))}
          </div>

          {/* 新对话 */}
          <button
            onClick={startNewChat}
            className="mt-3 flex w-full items-center gap-2 rounded-lg border border-[#ededed]/30 bg-[#ededed]/10 px-3 py-2 text-[13px] text-[#ededed] transition hover:bg-[#ededed]/15"
          >
            <Plus className="h-4 w-4" />
            <span>开启新对话</span>
          </button>
        </div>

        {/* 底部 设置/帮助 */}
        <div className="shrink-0 border-t border-[#1a1a1a] px-2 py-3">
          <button className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] text-[#b4b4b4] transition hover:bg-[#141414]">
            <SettingsIcon className="h-4 w-4 text-[#888]" />
            <span>设置</span>
          </button>
          <button className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] text-[#b4b4b4] transition hover:bg-[#141414]">
            <HelpCircle className="h-4 w-4 text-[#888]" />
            <span>帮助</span>
          </button>
        </div>
      </aside>

      {/* ============== 右侧主区 ============== */}
      <div className="flex min-w-0 flex-1 flex-col bg-[#0a0a0a]">
        {/* 顶栏（移动端可见 / 桌面端仅显示当前页标题） */}
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-[#1a1a1a] px-5">
          <div className="flex items-center gap-2 md:hidden">
            <span className="text-[15px] font-semibold text-white">光影集</span>
          </div>
          <div className="hidden md:block">
            <span className="text-[13px] text-[#666]">摄影老师 · 智能对话</span>
          </div>
          {started && (
            <button
              onClick={startNewChat}
              className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[12.5px] text-[#888] transition hover:bg-[#141414] hover:text-white"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>新对话</span>
            </button>
          )}
        </header>

        {/* 主体滚动区 */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto">
          {!started ? (
            <div className="mx-auto flex min-h-full max-w-3xl flex-col items-center px-6 pt-16 pb-32">
              {/* 闪光圆图标 */}
              <div className="mb-8 flex h-16 w-16 items-center justify-center rounded-full bg-[#0a0a0a] ring-1 ring-[#00d4ff]/30 shadow-[0_0_40px_-5px_rgba(0,212,255,0.45)]">
                <Sparkles className="h-7 w-7 text-[#00d4ff]" />
              </div>

              {/* 主标题 */}
              <h1 className="mb-3 text-center text-[26px] font-semibold leading-tight text-white">
                你好，我是你的<span className="text-[#00d4ff]">摄影老师 AI</span>。
              </h1>
              <p className="mb-12 max-w-xl text-center text-[14px] leading-6 text-[#888]">
                今天我该如何协助你提升视觉叙事能力？你可以询问关于构图、光影的问题，或者上传照片进行分析。
              </p>

              {/* 3 卡片 */}
              <div className="grid w-full max-w-3xl grid-cols-1 gap-3 sm:grid-cols-3">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s.title}
                    onClick={() => send(s.prompt)}
                    className="group flex flex-col items-start gap-2.5 rounded-2xl border border-[#1f1f1f] bg-[#101010] p-5 text-left transition hover:border-[#00d4ff]/30 hover:bg-[#121212]"
                  >
                    <s.icon className="h-5 w-5 text-[#ededed]" />
                    <div className="text-[14px] font-semibold text-white">{s.title}</div>
                    <div className="text-[12.5px] leading-5 text-[#888]">{s.desc}</div>
                  </button>
                ))}
              </div>

              {/* 欢迎回到提示条 */}
              <div className="mt-6 flex w-full max-w-3xl items-start gap-3 rounded-2xl border border-[#1a1a1a] bg-[#0e0e0e] p-4">
                <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#1a1a1a]">
                  <Sparkles className="h-3 w-3 text-[#ededed]" />
                </div>
                <p className="text-[13px] leading-6 text-[#b4b4b4]">
                  欢迎回来。你上次关注的是
                  <span className="text-white"> "构图基础" </span>
                  。你想继续探索引导线，还是尝试新主题，比如
                  <span className="text-white"> 黄金时刻光影 </span>
                  ？
                </p>
              </div>
            </div>
          ) : (
            <div className="mx-auto max-w-3xl space-y-6 px-6 py-8">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={cn(
                    'flex gap-3 msg-in',
                    m.sender === 'user' ? 'justify-end' : 'justify-start',
                  )}
                >
                  {m.sender === 'agent' && (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#00d4ff] to-[#7c3aed]">
                      <Camera className="h-4 w-4 text-white" />
                    </div>
                  )}
                  <div
                    className={cn(
                      'max-w-[85%] text-[14.5px] leading-7',
                      m.sender === 'user'
                        ? 'whitespace-pre-wrap rounded-2xl rounded-tr-sm bg-[#1a1a1a] px-4 py-3 text-white'
                        : 'text-[#e6e6e6]',
                    )}
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

        {/* ============== 输入栏 ============== */}
        <div className="shrink-0 px-6 pb-6 pt-2">
          <div className="mx-auto flex max-w-3xl items-end gap-3 rounded-2xl border border-[#222] bg-[#0e0e0e] px-4 py-3 transition focus-within:border-[#00d4ff]/40">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#161616] text-[#b4b4b4]">
              <ImageIcon className="h-4 w-4" />
            </div>
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
              className="max-h-[180px] flex-1 resize-none bg-transparent px-1 py-2 text-[14px] text-white placeholder-[#5a5a5a] outline-none"
            />
            <button
              onClick={() => (loading ? abortRef.current?.abort() : send())}
              disabled={!loading && !input.trim()}
              aria-label={loading ? '停止生成' : '发送'}
              className={cn(
                'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition',
                loading
                  ? 'bg-[#1a1a1a] text-white hover:bg-[#222]'
                  : input.trim()
                    ? 'bg-[#a8f0ff] text-[#0a0a0a] shadow-[0_0_18px_-2px_rgba(0,212,255,0.5)] hover:bg-[#c4f5ff]'
                    : 'cursor-not-allowed bg-[#161616] text-[#3a3a3a]',
              )}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ArrowUp className="h-4 w-4" strokeWidth={2.5} />
              )}
            </button>
          </div>
          <p className="mx-auto mt-3 max-w-3xl text-center text-[11px] text-[#4a4a4a]">
            由 CINEMATIC VISION ENGINE V4.2 提供技术支持
          </p>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .msg-in { animation: fadeIn 0.25s ease-out; }

        /* 隐藏滚动条但保留滚动 */
        .overflow-y-auto::-webkit-scrollbar { width: 6px; }
        .overflow-y-auto::-webkit-scrollbar-track { background: transparent; }
        .overflow-y-auto::-webkit-scrollbar-thumb {
          background: #1a1a1a;
          border-radius: 3px;
        }
        .overflow-y-auto::-webkit-scrollbar-thumb:hover { background: #2a2a2a; }
      `}</style>
    </div>
  );
}
