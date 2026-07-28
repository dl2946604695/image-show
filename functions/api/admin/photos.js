import { corsPreflight, json } from '../../_lib/cors.js';
import { requireAdmin } from '../../_lib/admin.js';
import { getPhotos, setPhotos } from '../../_lib/store.js';

export async function onRequest(context) {
  if (context.request.method === 'OPTIONS') return corsPreflight();

  const auth = await requireAdmin(context);
  if (!auth.ok) return auth.response;
  const { kv } = auth;

  if (context.request.method === 'GET') {
    const photos = await getPhotos(kv);
    photos.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    return json(200, { success: true, data: photos });
  }

  if (context.request.method === 'DELETE') {
    const url = new URL(context.request.url);
    const photoId = url.searchParams.get('photoId');
    if (!photoId) return json(400, { error: '缺少 photoId' });

    const photos = await getPhotos(kv);
    const filtered = photos.filter((p) => p.id !== photoId);
    if (filtered.length === photos.length) return json(404, { error: '照片不存在' });

    await setPhotos(kv, filtered);
    // 尝试删除 KV 里的图片二进制（忽略失败）
    try { await kv.delete(`img:${photoId}`); } catch {}
    return json(200, { success: true });
  }

  return json(405, { error: 'Method not allowed' });
}
