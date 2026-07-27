import { json, corsPreflight, getKV } from '../../_lib/cors.js';
import { getPhotos, getUsers, ensureSeed } from '../../_lib/store.js';

export async function onRequest(context) {
  if (context.request.method === 'OPTIONS') return corsPreflight();
  if (context.request.method !== 'GET') return json(405, { error: 'Method not allowed' });

  const kv = getKV(context);
  if (!kv) return json(500, { error: '服务端存储未配置' });

  await ensureSeed(kv);

  const { userId } = context.params;
  const photos = await getPhotos(kv);
  const userPhotos = photos
    .filter((p) => p.photographerId === userId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const users = await getUsers(kv);
  const user = users.find((u) => u.id === userId);

  return json(200, {
    success: true,
    data: {
      user: user
        ? { id: user.id, name: user.name, email: user.email, createdAt: user.createdAt }
        : null,
      photos: userPhotos,
      stats: {
        count: userPhotos.length,
        totalLikes: userPhotos.reduce((sum, p) => sum + (p.likes || 0), 0),
        categories: [...new Set(userPhotos.map((p) => p.category).filter(Boolean))].length,
      },
    },
  });
}
