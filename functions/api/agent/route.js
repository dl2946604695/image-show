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

const DEFAULT_WEGENT_MODEL = 'Trae#摄影老师';
const DEFAULT_WEGENT_TOOL_TYPE = 'wegent_chat_bot';

const mockResponses = [
  {
    keywords: ['你好', '您好', 'hello'],
    text: '你好！我是摄影老师 AI。你可以告诉我拍摄题材、光线条件、器材和想解决的问题，我会尽量给你具体可执行的建议。',
  },
  {
    keywords: ['构图', '三分法', '引导线'],
    text: '构图可以先从三件事入手：\n\n1. 明确主体，让画面中最重要的信息一眼可见。\n2. 使用三分法或中心构图稳定画面重心。\n3. 利用道路、栏杆、光影边界等引导线，把视线带向主体。\n\n如果你在拍街头或人像，可以先找一个干净背景，再等待人物进入合适位置。',
  },
  {
    keywords: ['光线', '光影', '曝光'],
    text: '光线决定照片的情绪。清晨和傍晚的低角度光适合制造层次；阴天适合拍柔和人像；强烈正午光更适合寻找硬阴影、几何线条和高反差画面。曝光上建议先保住高光，再通过后期抬起暗部。',
  },
  {
    keywords: ['长曝光', '慢门', '车轨'],
    text: '长曝光的核心是稳定和控制光量。建议使用三脚架、低 ISO、小光圈，并根据环境加 ND 镜。拍流水可以从 1/4s 到 2s 试起；拍车轨通常从 5s 到 20s 之间微调。',
  },
  {
    keywords: ['街头', '抓拍'],
    text: '街头摄影先观察光线、背景和人流方向，再等待决定性瞬间。可以预先构好画面，让人物走进画面；也可以用区域对焦减少错失瞬间。注意尊重被摄者隐私和公共空间规则。',
  },
  {
    keywords: ['后期', '调色', 'Lightroom', 'Photoshop'],
    text: '后期建议按顺序处理：先校正曝光和白平衡，再调整对比度与曲线，之后做色彩统一，最后局部锐化和降噪。不要一开始就套重滤镜，否则容易丢掉照片本身的光线逻辑。',
  },
];

const defaultResponse = `我可以从构图、光线、曝光、器材和后期几个角度帮你分析。

为了给你更具体的建议，你可以补充：

1. 拍摄题材，比如人像、街头、风景或静物。
2. 当前光线条件，比如室内、阴天、夜景或逆光。
3. 你想解决的问题，比如画面杂乱、主体不突出、颜色不好看。`;

function pickMockResponse(message) {
  const normalized = String(message || '').toLowerCase();
  return mockResponses.find((item) =>
    item.keywords.some((keyword) => normalized.includes(keyword.toLowerCase())),
  )?.text || defaultResponse;
}

function getResponsesUrl(rawUrl) {
  const url = String(rawUrl || '').trim().replace(/\/+$/, '');
  if (!url) return '';
  return url.endsWith('/responses') ? url : `${url}/responses`;
}

function errorDetail(error) {
  if (!(error instanceof Error)) return String(error);

  const cause = error.cause;
  if (cause && typeof cause === 'object') {
    const code = 'code' in cause ? cause.code : '';
    const message = 'message' in cause ? cause.message : '';
    return [error.message, code, message].filter(Boolean).join(' | ');
  }

  return error.message;
}

function mockStream(text) {
  const encoder = new TextEncoder();
  return new ReadableStream({
    async start(controller) {
      const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
      let index = 0;

      await delay(250);
      while (index < text.length) {
        const chunk = text.slice(index, index + Math.min(8, text.length - index));
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: chunk })}\n\n`));
        index += chunk.length;
        await delay(35);
      }
      controller.enqueue(encoder.encode('data: [DONE]\n\n'));
      controller.close();
    },
  });
}

function fallbackResponse(message, reason, detail = '') {
  const safeDetail = detail ? String(detail).slice(0, 180).replace(/[\r\n]+/g, ' ') : '';
  return new Response(mockStream(pickMockResponse(message)), {
    headers: {
      ...SSE_HEADERS,
      'X-Agent-Mode': 'mock',
      'X-Agent-Fallback-Reason': reason,
      ...(safeDetail ? { 'X-Agent-Fallback-Detail': safeDetail } : {}),
    },
  });
}

function extractDelta(event) {
  if (!event || typeof event !== 'object') return '';

  if (event.type === 'response.output_text.delta' && typeof event.delta === 'string') {
    return event.delta;
  }

  if (typeof event.delta === 'string') return event.delta;
  if (typeof event.content === 'string') return event.content;
  if (typeof event.output_text === 'string') return event.output_text;
  if (typeof event.text === 'string') return event.text;

  const choiceContent = event.choices?.[0]?.delta?.content || event.choices?.[0]?.message?.content;
  if (typeof choiceContent === 'string') return choiceContent;

  const nestedDelta = extractDelta(event.data);
  if (nestedDelta) return nestedDelta;

  return '';
}

async function streamWegentResponse(response) {
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

      const processLine = (line) => {
        const trimmed = line.trim();
        if (!trimmed) return;

        const payload = trimmed.startsWith('data:') ? trimmed.slice(5).trim() : trimmed;
        if (!payload || payload === '[DONE]') return;

        try {
          const event = JSON.parse(payload);
          const delta = extractDelta(event);
          if (delta) {
            emitted = true;
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: delta })}\n\n`));
          }
        } catch {
          // Some gateways stream plain text fragments. Forward them instead of dropping output.
          emitted = true;
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: payload })}\n\n`));
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
            `data: ${JSON.stringify({ content: '已连接到智能体，但本次没有收到可显示的文本内容。请检查智能体输出事件格式。' })}\n\n`,
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

export async function onRequest(context) {
  if (context.request.method === 'OPTIONS') return corsPreflight();
  if (context.request.method !== 'POST') {
    return new Response(JSON.stringify({ success: false, error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json; charset=utf-8', ...CORS },
    });
  }

  let message = '';

  try {
    const body = await context.request.json();
    message = body.message;

    if (!message || typeof message !== 'string') {
      return new Response(JSON.stringify({ success: false, error: 'Message is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json; charset=utf-8', ...CORS },
      });
    }

    const apiKey = context.env.WEGENT_API_KEY;
    if (!apiKey) {
      return fallbackResponse(message, 'missing_api_key');
    }

    const responsesUrl = getResponsesUrl(context.env.WEGENT_BASE_URL || context.env.WEGENT_RESPONSES_URL);
    if (!responsesUrl) {
      return fallbackResponse(message, 'missing_base_url');
    }

    const model = context.env.WEGENT_MODEL || DEFAULT_WEGENT_MODEL;
    const toolType = context.env.WEGENT_TOOL_TYPE || DEFAULT_WEGENT_TOOL_TYPE;

    const response = await fetch(responsesUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey,
      },
      body: JSON.stringify({
        model,
        input: message,
        stream: true,
        tools: toolType ? [{ type: toolType }] : undefined,
      }),
    });

    if (!response.ok) {
      let detail = '';
      try {
        detail = await response.text();
      } catch {
        detail = response.statusText;
      }
      return fallbackResponse(message, `upstream_${response.status}`, detail);
    }

    return new Response(await streamWegentResponse(response), {
      headers: {
        ...SSE_HEADERS,
        'X-Agent-Mode': 'wegent',
      },
    });
  } catch (error) {
    return fallbackResponse(message, 'exception', errorDetail(error));
  }
}
