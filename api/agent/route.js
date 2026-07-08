export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ success: false, error: 'Message is required' });
  }

  const apiKey = process.env.WEGENT_API_KEY;
  const baseUrl = 'https://wegent.intra.weibo.com/api/v1';

  const mockResponses = {
    '你好': '你好！我是摄影老师，很高兴为你服务。有什么关于摄影的问题都可以问我哦~',
    '拍照': '拍照有很多技巧呢！比如构图可以试试三分法、引导线，光线方面早晨和傍晚的黄金时段拍照效果最好。',
    '相机': '选择相机要看你的需求哦~新手入门可以考虑微单，比如索尼A6000系列、佳能M系列都很不错。',
    '构图': '常用的构图方法有：三分法、对称构图、引导线、框架构图、对角线构图等。不同场景适合不同的构图方式。',
    '光线': '光线是摄影的灵魂！自然光拍摄尽量选择柔和的时段，室内拍摄可以使用反光板补光，避免硬光直射。',
    '后期': '后期处理推荐使用Lightroom或Photoshop。调整顺序一般是：基础色调→对比度→色彩校准→细节锐化。',
  };

  const defaultResponse = `关于"${message}"这个问题，我可以给你一些建议：

1. 拍摄技巧：注意光线和构图的运用
2. 设备选择：根据拍摄场景选择合适的器材
3. 后期处理：适度调整可以提升照片质感

如果你有更具体的问题，欢迎继续问我！`;

  if (!apiKey) {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    });

    const responseText = mockResponses[message] || defaultResponse;
    let index = 0;

    const sendChunk = () => {
      if (index < responseText.length) {
        const chunk = responseText.slice(index, index + Math.min(5, responseText.length - index));
        res.write(`data: ${JSON.stringify({ content: chunk })}\n\n`);
        index += chunk.length;
        setTimeout(sendChunk, 50 + Math.random() * 50);
      } else {
        res.write('data: [DONE]\n\n');
        res.end();
      }
    };

    setTimeout(sendChunk, 500);
    return;
  }

  try {
    const response = await fetch(`${baseUrl}/responses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'Trae#摄影老师',
        input: message,
        stream: true,
        tools: [{ type: 'wegent_chat_bot' }],
      }),
    });

    if (!response.ok) {
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      });

      const responseText = mockResponses[message] || defaultResponse;
      let index = 0;

      const sendChunk = () => {
        if (index < responseText.length) {
          const chunk = responseText.slice(index, index + Math.min(5, responseText.length - index));
          res.write(`data: ${JSON.stringify({ content: chunk })}\n\n`);
          index += chunk.length;
          setTimeout(sendChunk, 50 + Math.random() * 50);
        } else {
          res.write('data: [DONE]\n\n');
          res.end();
        }
      };

      setTimeout(sendChunk, 500);
      return;
    }

    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    });

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (line.trim()) {
          try {
            const event = JSON.parse(line);
            if (event.type === 'response.output_text.delta' && event.delta) {
              res.write(`data: ${JSON.stringify({ content: event.delta })}\n\n`);
            }
          } catch {
          }
        }
      }
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error) {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    });

    const responseText = mockResponses[message] || defaultResponse;
    let index = 0;

    const sendChunk = () => {
      if (index < responseText.length) {
        const chunk = responseText.slice(index, index + Math.min(5, responseText.length - index));
        res.write(`data: ${JSON.stringify({ content: chunk })}\n\n`);
        index += chunk.length;
        setTimeout(sendChunk, 50 + Math.random() * 50);
      } else {
        res.write('data: [DONE]\n\n');
        res.end();
      }
    };

    setTimeout(sendChunk, 500);
  }
}