import { json, corsPreflight, getKV, getSecret } from '../_lib/cors.js';
import { getPhotos, ensureSeed } from '../_lib/store.js';

export async function onRequest(context) {
  if (context.request.method === 'OPTIONS') return corsPreflight();
  if (context.request.method !== 'GET') return json(405, { error: 'Method not allowed' });

  const kv = getKV(context);
  if (!kv) return json(500, { error: '服务端存储未配置' });

  getSecret(context);
  await ensureSeed(kv);

  const url = new URL(context.request.url);
  const category = url.searchParams.get('category');

  let photos = await getPhotos(kv);
  if (category) {
    photos = photos.filter((p) => p.category === category);
  }
  photos.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return json(200, { success: true, data: photos });
}
