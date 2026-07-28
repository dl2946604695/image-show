import { corsPreflight, json } from '../../_lib/cors.js';
import { requireAdmin } from '../../_lib/admin.js';
import { getPosts, setPosts } from '../../_lib/store.js';

export async function onRequest(context) {
  if (context.request.method === 'OPTIONS') return corsPreflight();

  const auth = await requireAdmin(context);
  if (!auth.ok) return auth.response;
  const { kv } = auth;

  if (context.request.method === 'GET') {
    const posts = await getPosts(kv);
    posts.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    return json(200, { success: true, data: posts });
  }

  if (context.request.method === 'DELETE') {
    const url = new URL(context.request.url);
    const postId = url.searchParams.get('postId');
    if (!postId) return json(400, { error: '缺少 postId' });

    const posts = await getPosts(kv);
    const filtered = posts.filter((p) => p.id !== postId);
    if (filtered.length === posts.length) return json(404, { error: '帖子不存在' });

    await setPosts(kv, filtered);
    return json(200, { success: true });
  }

  return json(405, { error: 'Method not allowed' });
}
