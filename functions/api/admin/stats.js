import { corsPreflight, json } from '../../_lib/cors.js';
import { requireAdmin } from '../../_lib/admin.js';
import { getUsers, getPhotos, getPosts, getChatHistory } from '../../_lib/store.js';

export async function onRequest(context) {
  if (context.request.method === 'OPTIONS') return corsPreflight();
  if (context.request.method !== 'GET') return json(405, { error: 'Method not allowed' });

  const auth = await requireAdmin(context);
  if (!auth.ok) return auth.response;
  const { kv } = auth;

  const [users, photos, posts, chats] = await Promise.all([
    getUsers(kv),
    getPhotos(kv),
    getPosts(kv),
    getChatHistory(kv),
  ]);

  const totalLikes = photos.reduce((s, p) => s + (p.likes || 0), 0);

  // 按摄影师聚合作品数
  const photographerMap = new Map();
  for (const p of photos) {
    const id = p.photographerId || 'unknown';
    const entry = photographerMap.get(id) || { id, name: p.photographerName || '匿名', count: 0, likes: 0 };
    entry.count += 1;
    entry.likes += p.likes || 0;
    photographerMap.set(id, entry);
  }
  const topPhotographers = [...photographerMap.values()]
    .sort((a, b) => b.likes - a.likes || b.count - a.count)
    .slice(0, 5);

  // 近期 7 天每天上传数
  const now = Date.now();
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now - (6 - i) * 86400000);
    return { date: d.toISOString().slice(0, 10), count: 0 };
  });
  for (const p of photos) {
    const ds = (p.createdAt || '').slice(0, 10);
    const day = days.find((d) => d.date === ds);
    if (day) day.count += 1;
  }

  return json(200, {
    success: true,
    data: {
      users: users.length,
      photos: photos.length,
      posts: posts.length,
      chats: chats.length,
      totalLikes,
      topPhotographers,
      uploadsByDay: days,
    },
  });
}
