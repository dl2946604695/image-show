import { json, corsPreflight, getKV, getSecret } from '../../_lib/cors.js';
import { getChatHistory, setChatHistory } from '../../_lib/store.js';
import { verifyToken } from '../../_lib/auth.js';

export async function onRequest(context) {
  if (context.request.method === 'OPTIONS') return corsPreflight();

  const authHeader = context.request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return json(401, { error: '未授权' });
  }

  const token = authHeader.slice(7);
  const secret = getSecret(context);
  const payload = await verifyToken(token, secret);

  if (!payload || !payload.userId) {
    return json(401, { error: '无效的登录凭证' });
  }

  const userId = payload.userId;

  if (context.request.method === 'GET') {
    const kv = getKV(context);
    if (!kv) return json(500, { error: '服务端存储未配置' });

    const allHistory = await getChatHistory(kv);
    const userHistory = allHistory.filter((h) => h.userId === userId);
    userHistory.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

    return json(200, { success: true, data: userHistory });
  }

  if (context.request.method === 'POST') {
    const kv = getKV(context);
    if (!kv) return json(500, { error: '服务端存储未配置' });

    const body = await context.request.json().catch(() => ({}));
    const { messages, title } = body;

    if (!messages || !Array.isArray(messages)) {
      return json(400, { error: '请提供消息列表' });
    }

    const allHistory = await getChatHistory(kv);
    const newChat = {
      id: crypto.randomUUID(),
      userId,
      messages,
      title: title || messages[0]?.content?.slice(0, 30) || '新对话',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    allHistory.push(newChat);
    await setChatHistory(kv, allHistory);

    return json(200, { success: true, data: newChat });
  }

  return json(405, { error: 'Method not allowed' });
}