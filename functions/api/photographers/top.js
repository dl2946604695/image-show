import { json, corsPreflight, getKV } from '../../_lib/cors.js';
import { getPhotos, ensureSeed } from '../../_lib/store.js';

export async function onRequest(context) {
  if (context.request.method === 'OPTIONS') return corsPreflight();
  if (context.request.method !== 'GET') return json(405, { error: 'Method not allowed' });

  const kv = getKV(context);
  if (!kv) return json(500, { error: '服务端存储未配置' });

  await ensureSeed(kv);

  const photos = await getPhotos(kv);

  const map = new Map();
  for (const p of photos) {
    if (!p.photographerId) continue;
    const entry = map.get(p.photographerId) || {
      id: p.photographerId,
      name: p.photographerName || '匿名摄影师',
      photoCount: 0,
      totalLikes: 0,
      coverPhoto: null,
    };
    entry.photoCount += 1;
    entry.totalLikes += p.likes || 0;
    if (!entry.coverPhoto || (p.likes || 0) > (entry.coverPhoto.likes || 0)) {
      entry.coverPhoto = p;
    }
    map.set(p.photographerId, entry);
  }

 const photographers = [...map.values()]
    .filter((p) => p.photoCount > 0)
    .sort((a, b) => b.totalLikes - a.totalLikes || b.photoCount - a.photoCount)
    .slice(0, 12);

  return json(200, { success: true, data: photographers });
}
