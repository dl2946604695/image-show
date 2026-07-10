import { corsPreflight } from '../../_lib/cors.js';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const SSE_HEADERS = {
  'Content-Type': 'text/event-stream',
  'Cache-Control': 'no-cache',
  Connection: 'keep-alive',
  ...CORS,
};

function mockStream(text) {
  const encoder = new TextEncoder();
  return new ReadableStream({
    async start(controller) {
      let index = 0;
      const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
      await delay(500);
      while (index < text.length) {
        const chunk = text.slice(index, index + Math.min(5, text.length - index));
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: chunk })}\n\n`));
        index += chunk.length;
        await delay(50 + Math.random() * 50);
      }
      controller.enqueue(encoder.encode('data: [DONE]\n\n'));
      controller.close();
    },
  });
}

const mockResponses = {
  你好: '你好！我是摄影老师，很高兴为你服务。有什么关于摄影的问题都可以问我哦~',
  拍照: '拍照有很多技巧呢！比如构图可以试试三分法、引导线，光线方面早晨和傍晚的黄金时段拍照效果最好。',
  相机: '选择相机要看你的需求哦~新手入门可以考虑微单，比如索尼A6000系列、佳能M系列都很不错。',
  构图: '常用的构图方法有：三分法、对称构图、引导线、框架构图、对角线构图等。不同场景适合不同的构图方式。',
  光线: '光线是摄影的灵魂！自然光拍摄尽量选择柔和的时段，室内拍摄可以使用反光板补光，避免硬光直射。',
  后期: '后期处理推荐使用Lightroom或Photoshop。调整顺序一般是：基础色调→对比度→色彩校准→细节锐化。',
  风景: '风景摄影要注意光线、构图和层次感。使用小光圈可以获得更大的景深，让远近景物都清晰。',
  人像: '人像摄影关键在于用光和引导模特。侧光可以增加立体感，眼神光让眼睛更有神采。',
  曝光: '曝光三要素是光圈、快门和ISO。光圈控制景深，快门控制动态效果，ISO控制感光度。',
  焦距: '广角镜头适合风景和建筑，长焦镜头适合人像和野生动物，标准镜头最贴近人眼视角。',
};

const defaultResponse = `关于这个问题，我可以给你一些建议：

1. 拍摄技巧：注意光线和构图的运用
2. 设备选择：根据拍摄场景选择合适的器材
3. 后期处理：适度调整可以提升照片质感

如果你有更具体的问题，欢迎继续问我！`;

export async function onRequest(context) {
  if (context.request.method === 'OPTIONS') return corsPreflight();
  if (context.request.method !== 'POST') {
    return new Response(JSON.stringify({ success: false, error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json', ...CORS },
    });
  }

  try {
    const body = await context.request.json();
    const { message } = body;

    if (!message) {
      return new Response(JSON.stringify({ success: false, error: 'Message is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...CORS },
      });
    }

    const apiKey = context.env.WEGENT_API_KEY;
    const baseUrl = 'https://wegent.intra.weibo.com/api/v1';

    if (!apiKey) {
      return new Response(mockStream(mockResponses[message] || defaultResponse), {
        headers: SSE_HEADERS,
      });
    }

    const response = await fetch(`${baseUrl}/responses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'Trae#摄影老师',
        input: message,
        stream: true,
        tools: [{ type: 'wegent_chat_bot' }],
      }),
    });

    if (!response.ok) {
      return new Response(mockStream(mockResponses[message] || defaultResponse), {
        headers: SSE_HEADERS,
      });
    }

    const encoder = new TextEncoder();
    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');

    const stream = new ReadableStream({
      async start(controller) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value);
          for (const line of chunk.split('\n')) {
            const t = line.trim();
            if (!t) continue;
            try {
              const event = JSON.parse(t);
              if (event.type === 'response.output_text.delta' && event.delta) {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: event.delta })}\n\n`));
              }
            } catch {
              // 忽略非 JSON 行
            }
          }
        }
        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        controller.close();
      },
      async cancel() {
        await reader.cancel();
      },
    });

    return new Response(stream, { headers: SSE_HEADERS });
  } catch {
    const fallback = '抱歉，我暂时无法回答你的问题。';
    return new Response(mockStream(fallback), { headers: SSE_HEADERS });
  }
}
