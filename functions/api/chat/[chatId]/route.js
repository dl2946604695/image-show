import { json, corsPreflight, getKV, getSecret } from '../../../_lib/cors.js';
import { getChatHistory, setChatHistory } from '../../../_lib/store.js';
import { verifyToken } from '../../../_lib/auth.js';

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
  const { chatId } = context.params;

  if (context.request.method === 'GET') {
    const kv = getKV(context);
    if (!kv) return json(500, { error: '服务端存储未配置' });

    const allHistory = await getChatHistory(kv);
    const chat = allHistory.find((h) => h.id === chatId && h.userId === userId);

    if (!chat) {
      return json(404, { error: '对话不存在' });
    }

    return json(200, { success: true, data: chat });
  }

  if (context.request.method === 'PUT') {
    const kv = getKV(context);
    if (!kv) return json(500, { error: '服务端存储未配置' });

    const body = await context.request.json().catch(() => ({}));
    const { messages } = body;

    if (!messages || !Array.isArray(messages)) {
      return json(400, { error: '请提供消息列表' });
    }

    const allHistory = await getChatHistory(kv);
    const index = allHistory.findIndex((h) => h.id === chatId && h.userId === userId);

    if (index === -1) {
      return json(404, { error: '对话不存在' });
    }

    allHistory[index] = {
      ...allHistory[index],
      messages,
      updatedAt: new Date().toISOString(),
    };

    await setChatHistory(kv, allHistory);

    return json(200, { success: true, data: allHistory[index] });
  }

  if (context.request.method === 'DELETE') {
    const kv = getKV(context);
    if (!kv) return json(500, { error: '服务端存储未配置' });

    const allHistory = await getChatHistory(kv);
    const filtered = allHistory.filter((h) => !(h.id === chatId && h.userId === userId));

    await setChatHistory(kv, filtered);

    return json(200, { success: true });
  }

  return json(405, { error: 'Method not allowed' });
}