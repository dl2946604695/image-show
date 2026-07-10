import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Camera,
  Send,
  ChevronLeft,
  RotateCcw,
  Loader2,
  User,
  Mountain,
  Aperture,
  Wand2,
} from 'lucide-react';
import { API_BASE_URL } from '@/lib/api';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'agent';
}

interface Suggestion {
  icon: typeof User;
  title: string;
  desc: string;
}

const SUGGESTIONS: Suggestion[] = [
  { icon: User, title: '如何拍出好看的人像？', desc: '光影、构图与情绪引导' },
  { icon: Mountain, title: '风景摄影构图技巧', desc: '三分法、引导线与层次' },
  { icon: Aperture, title: '新手买什么相机？', desc: '入门微单推荐指南' },
  { icon: Wand2, title: '后期修图怎么入门？', desc: 'Lightroom 基础流程' },
];

/* ---------- 轻量 Markdown 渲染（段落 / 列表 / 加粗） ---------- */

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
    el.style.height = Math.min(el.scrollHeight, 200) + 'px';
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
              // 忽略无法解析的行
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
    <div className="flex h-screen flex-col bg-[#0a0a0a] text-[#ededed]">
      {/* 顶部栏 */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-[#1f1f1f] px-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/')}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-[#999] transition hover:bg-[#181818] hover:text-white"
            aria-label="返回"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <span className="text-[15px] font-medium text-white">摄影老师</span>
        </div>
        {started && (
          <button
            onClick={startNewChat}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[13px] text-[#999] transition hover:bg-[#181818] hover:text-white"
          >
            <RotateCcw className="h-4 w-4" />
            新对话
          </button>
        )}
      </header>

      {/* 主体 */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        {!started ? (
          <div className="mx-auto flex h-full max-w-3xl flex-col items-center justify-center px-4">
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#00d4ff] to-[#7c3aed] shadow-lg shadow-cyan-500/20">
              <Camera className="h-8 w-8 text-white" />
            </div>
            <h1 className="mb-2 text-2xl font-semibold text-white">摄影老师</h1>
            <p className="mb-10 text-center text-[15px] text-[#999]">
              你身边的摄影顾问，随时解答拍摄、器材与后期问题
            </p>
            <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s.title}
                  onClick={() => send(s.title)}
                  className="group flex items-start gap-3 rounded-2xl border border-[#1f1f1f] bg-[#101010] p-4 text-left transition hover:border-[#00d4ff]/40 hover:bg-[#151515]"
                >
                  <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#1a1a1a] text-[#00d4ff] transition group-hover:bg-[#00d4ff]/10">
                    <s.icon className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-[14px] font-medium text-white">{s.title}</div>
                    <div className="mt-0.5 text-[12.5px] text-[#888]">{s.desc}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="mx-auto max-w-3xl space-y-6 px-4 py-6">
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

      {/* 输入区 */}
      <div className="shrink-0 border-t border-[#1f1f1f] bg-[#0a0a0a] px-4 py-4">
        <div className="mx-auto flex max-w-3xl items-end gap-2 rounded-[26px] border border-[#262626] bg-[#141414] px-3 py-2 transition focus-within:border-[#00d4ff]/50">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              autoGrow(e.target);
            }}
            onKeyDown={onKeyDown}
            rows={1}
            placeholder="问点关于摄影的事…"
            className="max-h-[200px] flex-1 resize-none bg-transparent px-2 py-2 text-[14.5px] text-white placeholder-[#666] outline-none"
          />
          <button
            onClick={() => (loading ? abortRef.current?.abort() : send())}
            disabled={!loading && !input.trim()}
            className={cn(
              'flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition',
              loading
                ? 'bg-[#2a2a2a] text-white hover:bg-[#333]'
                : input.trim()
                  ? 'bg-[#00d4ff] text-black hover:bg-[#33ddff]'
                  : 'cursor-not-allowed bg-[#222] text-[#555]',
            )}
            aria-label={loading ? '停止生成' : '发送'}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </button>
        </div>
        <p className="mx-auto mt-2 max-w-3xl text-center text-[11px] text-[#555]">
          摄影老师生成的内容仅供参考
        </p>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .msg-in { animation: fadeIn 0.25s ease-out; }
      `}</style>
    </div>
  );
}
