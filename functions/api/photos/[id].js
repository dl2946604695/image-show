import { json, corsPreflight, getKV, getSecret } from '../../_lib/cors.js';
import { getPhotos, ensureSeed } from '../../_lib/store.js';

export async function onRequest(context) {
  if (context.request.method === 'OPTIONS') return corsPreflight();
  if (context.request.method !== 'GET') return json(405, { error: 'Method not allowed' });

  const kv = getKV(context);
  if (!kv) return json(500, { error: '服务端存储未配置' });

  getSecret(context);
  await ensureSeed(kv);

  const { id } = context.params;
  const photos = await getPhotos(kv);
  const photo = photos.find((p) => p.id === id);
  if (!photo) return json(404, { error: '照片不存在' });

  return json(200, { success: true, data: photo });
}
