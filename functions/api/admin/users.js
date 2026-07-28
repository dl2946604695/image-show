import { corsPreflight, json } from '../../_lib/cors.js';
import { requireAdmin } from '../../_lib/admin.js';
import { getUsers, setUsers, getPhotos } from '../../_lib/store.js';

export async function onRequest(context) {
  if (context.request.method === 'OPTIONS') return corsPreflight();

  const auth = await requireAdmin(context);
  if (!auth.ok) return auth.response;
  const { kv } = auth;

  if (context.request.method === 'GET') {
    const users = await getUsers(kv);
    const photos = await getPhotos(kv);
    const photoCount = new Map();
    for (const p of photos) {
      photoCount.set(p.photographerId, (photoCount.get(p.photographerId) || 0) + 1);
    }
    const data = users
      .map((u) => ({
        id: u.id,
        email: u.email,
        name: u.name,
        role: u.role || 'user',
        createdAt: u.createdAt,
        photoCount: photoCount.get(u.id) || 0,
      }))
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    return json(200, { success: true, data });
  }

  if (context.request.method === 'DELETE') {
    const url = new URL(context.request.url);
    const userId = url.searchParams.get('userId');
    if (!userId) return json(400, { error: '缺少 userId' });

    const users = await getUsers(kv);
    const target = users.find((u) => u.id === userId);
    if (!target) return json(404, { error: '用户不存在' });
    if (target.role === 'admin') return json(400, { error: '不能删除管理员账号' });

    await setUsers(kv, users.filter((u) => u.id !== userId));
    return json(200, { success: true });
  }

  return json(405, { error: 'Method not allowed' });
}
