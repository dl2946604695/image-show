import { json, corsPreflight, getKV, getSecret } from '../../_lib/cors.js';
import { getPhotos, ensureSeed } from '../../_lib/store.js';
import { verifyToken } from '../../_lib/auth.js';

export async function onRequest(context) {
  if (context.request.method === 'OPTIONS') return corsPreflight();
  if (context.request.method !== 'GET') return json(405, { error: 'Method not allowed' });

  const kv = getKV(context);
  if (!kv) return json(500, { error: '服务端存储未配置' });

  const secret = getSecret(context);
  await ensureSeed(kv);

  const auth = context.request.headers.get('Authorization') || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  const decoded = token ? await verifyToken(token, secret) : null;
  if (!decoded) return json(401, { error: '请先登录' });

  const photos = await getPhotos(kv);
  const userPhotos = photos
    .filter((p) => p.photographerId === decoded.userId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return json(200, { success: true, data: userPhotos });
}
