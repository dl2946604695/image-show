import { corsPreflight } from '../../_lib/cors.js';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const SSE_HEADERS = {
  'Content-Type': 'text/event-stream; charset=utf-8',
  'Cache-Control': 'no-cache',
  Connection: 'keep-alive',
  ...CORS,
};

const ZHIPU_CHAT_COMPLETIONS_URL = 'https://open.bigmodel.cn/api/paas/v4/chat/completions';
const DEFAULT_ZHIPU_MODEL = 'glm-4.7';
const DEFAULT_ZHIPU_FALLBACK_MODELS = ['glm-4.5-flash'];
const DEFAULT_TEMPERATURE = 0.7;
const DEFAULT_MAX_TOKENS = 600;
const DEFAULT_RETRY_COUNT = 1;

const PHOTOGRAPHY_TEACHER_PROMPT = `你是“摄影老师 Agent”，一位耐心、专业、实战导向的中文摄影老师。

你的能力范围包括：
- 摄影基础：曝光三要素、测光、对焦、景深、白平衡、焦段、快门、ISO、光圈。
- 构图与审美：三分法、中心构图、引导线、框架构图、留白、节奏、层次、视觉重心。
- 光线与场景：自然光、闪光灯、逆光、侧光、硬光、柔光、夜景、室内、街头、人像、风光、静物、建筑、纪实。
- 器材建议：相机、镜头、滤镜、三脚架、灯光附件、手机摄影，不做过度消费导向。
- 后期流程：选片、裁切、曝光校正、色彩统一、曲线、局部调整、降噪、锐化、Lightroom/Photoshop 思路。
- 作品点评：从主题、构图、光线、色彩、情绪、技术完成度、改进练习给出建设性反馈。

回答规则：
1. 优先给出可执行建议，避免空泛形容。
2. 用户信息不足时，先给一个通用方案，再用 1-3 个问题追问关键条件。
3. 涉及参数时给范围和调整逻辑，例如“先从 1/250s、f/2.8、ISO 400 试起”。
4. 对初学者解释术语，对进阶用户可以更技术化。
5. 不编造不存在的相机规格或软件功能；不确定时说明需要核对。
6. 默认回答控制在 300-600 个中文字符内，除非用户明确要求“详细讲”“展开”或“系统教程”。
7. 回答保持中文，结构清晰，适合直接照着练习。`;

function cleanEnvValue(value) {
  const trimmed = String(value || '').trim();
  if (!trimmed) return '';

  const first = trimmed[0];
  const last = trimmed[trimmed.length - 1];
  if ((first === '"' && last === '"') || (first === "'" && last === "'")) {
    return trimmed.slice(1, -1).trim();
  }

  return trimmed;
}

function parseList(value) {
  return cleanEnvValue(value)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function clampInteger(value, fallback, min, max) {
  const parsed = Number.parseInt(cleanEnvValue(value), 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
}

function normalizeMessages(messages) {
  if (!Array.isArray(messages)) return [];

  return messages
    .filter((item) => item && typeof item.content === 'string' && item.content.trim())
    .slice(-6)
    .map((item) => ({
      role: item.role === 'assistant' ? 'assistant' : 'user',
      content: item.content.trim().slice(0, 1000),
    }));
}

function buildZhipuMessages(message, messages = []) {
  const history = normalizeMessages(messages).filter((item) => item.content !== message);

  return [
    { role: 'system', content: PHOTOGRAPHY_TEACHER_PROMPT },
    ...history,
    { role: 'user', content: message.trim().slice(0, 2000) },
  ];
}

function sseChunk(content) {
  return `data: ${JSON.stringify({ content })}\n\n`;
}

function mockStream(text) {
  const encoder = new TextEncoder();

  return new ReadableStream({
    async start(controller) {
      const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
      let index = 0;

      await delay(120);
      while (index < text.length) {
        const chunk = text.slice(index, index + Math.min(12, text.length - index));
        controller.enqueue(encoder.encode(sseChunk(chunk)));
        index += chunk.length;
        await delay(20);
      }

      controller.enqueue(encoder.encode('data: [DONE]\n\n'));
      controller.close();
    },
  });
}

function fallbackResponse(reason, detail = '') {
  const safeDetail = detail ? String(detail).slice(0, 240).replace(/[\r\n]+/g, ' ') : '';
  const text =
    reason === 'missing_api_key'
      ? '智谱 API Key 还没有配置，所以摄影老师 Agent 暂时不能连接真实模型。请在 Cloudflare Pages 环境变量中设置 ZHIPU_API_KEY。'
      : reason === 'missing_message'
        ? '请先输入一个摄影相关问题，例如“阴天怎么拍人像更通透？”或“50mm 镜头适合拍什么？”。'
        : reason === 'model_overloaded'
          ? '智谱模型当前访问量过大，我已经自动重试过了，但还是没有排到可用资源。请稍后再试，或在环境变量 ZHIPU_FALLBACK_MODELS 中配置一个备用模型。'
        : `摄影老师 Agent 调用智谱模型失败。错误原因：${reason}${safeDetail ? `，${safeDetail}` : ''}`;

  return new Response(mockStream(text), {
    headers: {
      ...SSE_HEADERS,
      'X-Agent-Mode': 'error',
      'X-Agent-Fallback-Reason': reason,
      ...(safeDetail ? { 'X-Agent-Fallback-Detail': safeDetail } : {}),
    },
  });
}

function extractDelta(event) {
  if (!event || typeof event !== 'object') return '';

  const choice = event.choices?.[0];
  const content = choice?.delta?.content ?? choice?.message?.content;

  if (typeof content === 'string') return content;
  if (Array.isArray(content)) {
    return content
      .map((item) => (typeof item === 'string' ? item : item?.text || item?.content || ''))
      .join('');
  }

  return '';
}

function extractMessageText(payload) {
  if (!payload || typeof payload !== 'object') return '';

  const content = payload.choices?.[0]?.message?.content;
  if (typeof content === 'string') return content;
  if (Array.isArray(content)) {
    return content
      .map((item) => (typeof item === 'string' ? item : item?.text || item?.content || ''))
      .join('');
  }

  return '';
}

async function streamZhipuResponse(response) {
  const encoder = new TextEncoder();
  const decoder = new TextDecoder('utf-8');
  const reader = response.body?.getReader();

  if (!reader) {
    throw new Error('Upstream response has no body');
  }

  return new ReadableStream({
    async start(controller) {
      let buffer = '';
      let emitted = false;

      const emit = (content) => {
        if (!content) return;
        emitted = true;
        controller.enqueue(encoder.encode(sseChunk(content)));
      };

      const processLine = (line) => {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith('data:')) return;

        const payload = trimmed.slice(5).trim();
        if (!payload || payload === '[DONE]') return;

        try {
          emit(extractDelta(JSON.parse(payload)));
        } catch {
          emit(payload);
        }
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split(/\r?\n/);
        buffer = lines.pop() || '';
        for (const line of lines) processLine(line);
      }

      if (buffer) processLine(buffer);

      if (!emitted) {
        controller.enqueue(
          encoder.encode(
            sseChunk('已经连接到智谱模型，但本次没有收到可显示的文本内容。请稍后重试，或检查模型响应格式。'),
          ),
        );
      }

      controller.enqueue(encoder.encode('data: [DONE]\n\n'));
      controller.close();
    },
    async cancel() {
      await reader.cancel();
    },
  });
}

async function errorDetail(response) {
  try {
    return await response.text();
  } catch {
    return response.statusText;
  }
}

function parseErrorPayload(detail) {
  try {
    return JSON.parse(detail);
  } catch {
    return null;
  }
}

function isModelOverloaded(status, detail) {
  if (status !== 429) return false;

  const payload = parseErrorPayload(detail);
  const code = String(payload?.error?.code || '');
  const message = String(payload?.error?.message || detail || '');

  return code === '1305' || message.includes('访问量过大') || message.toLowerCase().includes('too many');
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getApiKey(env = {}) {
  return (
    cleanEnvValue(env.ZHIPU_API_KEY) ||
    cleanEnvValue(env.BIGMODEL_API_KEY) ||
    cleanEnvValue(env.GLM_API_KEY)
  );
}

async function requestZhipu({ apiKey, model, messages, temperature, maxTokens }) {
  return fetch(ZHIPU_CHAT_COMPLETIONS_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json; charset=utf-8',
    },
    body: JSON.stringify({
      model,
      messages,
      temperature,
      max_tokens: maxTokens,
      stream: true,
    }),
  });
}

async function requestZhipuWithFallback({
  apiKey,
  models,
  messages,
  temperature,
  maxTokens,
  retryCount,
}) {
  let lastFailure = null;

  for (const model of models) {
    for (let attempt = 0; attempt <= retryCount; attempt++) {
      const upstream = await requestZhipu({ apiKey, model, messages, temperature, maxTokens });

      if (upstream.ok) {
        return { upstream, model, fallbackUsed: model !== models[0] };
      }

      const detail = await errorDetail(upstream);
      lastFailure = { status: upstream.status, detail, model };

      if (!isModelOverloaded(upstream.status, detail)) {
        return { failure: lastFailure };
      }

      if (attempt < retryCount) {
        await delay(250 * (attempt + 1));
      }
    }
  }

  return { failure: lastFailure, overloaded: true };
}

export async function onRequest(context) {
  if (context.request.method === 'OPTIONS') return corsPreflight();
  if (context.request.method !== 'POST') {
    return new Response(JSON.stringify({ success: false, error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json; charset=utf-8', ...CORS },
    });
  }

  try {
    const body = await context.request.json();
    const message = typeof body.message === 'string' ? body.message.trim() : '';

    if (!message) {
      return fallbackResponse('missing_message');
    }

    const apiKey = getApiKey(context.env);
    if (!apiKey) {
      return fallbackResponse('missing_api_key');
    }

    const model = cleanEnvValue(context.env.ZHIPU_MODEL) || DEFAULT_ZHIPU_MODEL;
    const fallbackModels = parseList(context.env.ZHIPU_FALLBACK_MODELS);
    const models = unique([model, ...(fallbackModels.length ? fallbackModels : DEFAULT_ZHIPU_FALLBACK_MODELS)]);
    const temperature =
      Number.parseFloat(cleanEnvValue(context.env.ZHIPU_TEMPERATURE)) || DEFAULT_TEMPERATURE;
    const maxTokens = clampInteger(context.env.ZHIPU_MAX_TOKENS, DEFAULT_MAX_TOKENS, 256, 8192);
    const retryCount = clampInteger(context.env.ZHIPU_RETRY_COUNT, DEFAULT_RETRY_COUNT, 0, 3);
    const zhipuMessages = buildZhipuMessages(message, body.messages);

    const result = await requestZhipuWithFallback({
      apiKey,
      models,
      messages: zhipuMessages,
      temperature,
      maxTokens,
      retryCount,
    });

    if (result.failure) {
      if (result.overloaded) {
        return fallbackResponse('model_overloaded', result.failure.detail);
      }

      return fallbackResponse(`upstream_${result.failure.status}`, result.failure.detail);
    }

    const { upstream } = result;
    const contentType = upstream.headers.get('content-type') || '';
    if (contentType.includes('text/event-stream')) {
      return new Response(await streamZhipuResponse(upstream), {
        headers: {
          ...SSE_HEADERS,
          'X-Agent-Mode': 'zhipu',
          'X-Agent-Model': result.model,
          'X-Agent-Fallback-Used': String(result.fallbackUsed),
          'X-Agent-Upstream-Stream': 'true',
        },
      });
    }

    const payload = await upstream.json();
    const text = extractMessageText(payload);
    if (!text) {
      return fallbackResponse('upstream_empty_text', JSON.stringify(payload).slice(0, 400));
    }

    return new Response(mockStream(text), {
      headers: {
        ...SSE_HEADERS,
        'X-Agent-Mode': 'zhipu',
        'X-Agent-Model': result.model,
        'X-Agent-Fallback-Used': String(result.fallbackUsed),
        'X-Agent-Upstream-Stream': 'false',
      },
    });
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    return fallbackResponse('exception', detail);
  }
}
