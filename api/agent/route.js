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

  if (!apiKey) {
    return res.status(500).json({ success: false, error: 'API key not configured' });
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
      return res.status(response.status).json({ success: false, error: 'Agent request failed' });
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
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
}