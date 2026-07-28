import { corsPreflight, json } from '../../_lib/cors.js';
import { requireAdmin } from '../../_lib/admin.js';
import { getChatHistory, setChatHistory } from '../../_lib/store.js';

export async function onRequest(context) {
  if (context.request.method === 'OPTIONS') return corsPreflight();

  const auth = await requireAdmin(context);
  if (!auth.ok) return auth.response;
  const { kv } = auth;

  if (context.request.method === 'GET') {
    const chats = await getChatHistory(kv);
    const data = chats
      .map((c) => ({
        id: c.id,
        userId: c.userId,
        title: c.title,
        messageCount: (c.messages || []).length,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
      }))
      .sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0));
    return json(200, { success: true, data });
  }

  if (context.request.method === 'DELETE') {
    const url = new URL(context.request.url);
    const chatId = url.searchParams.get('chatId');
    if (!chatId) return json(400, { error: '缺少 chatId' });

    const chats = await getChatHistory(kv);
    const filtered = chats.filter((c) => c.id !== chatId);
    if (filtered.length === chats.length) return json(404, { error: '对话不存在' });

    await setChatHistory(kv, filtered);
    return json(200, { success: true });
  }

  return json(405, { error: 'Method not allowed' });
}
