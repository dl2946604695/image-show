import { json, corsPreflight, getKV } from '../_lib/cors.js';
import { getPosts, ensureSeed } from '../_lib/store.js';

export async function onRequest(context) {
  if (context.request.method === 'OPTIONS') return corsPreflight();
  if (context.request.method !== 'GET') return json(405, { error: 'Method not allowed' });

  const kv = getKV(context);
  if (!kv) return json(500, { error: '服务端存储未配置' });

  await ensureSeed(kv);

  const url = new URL(context.request.url);
  const type = url.searchParams.get('type');

  let posts = await getPosts(kv);
  if (type) {
    posts = posts.filter((p) => p.type === type);
  }
  posts = posts
    .slice()
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return json(200, { success: true, data: posts });
}
