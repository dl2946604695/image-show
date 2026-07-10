import { json, corsPreflight, getKV } from '../../_lib/cors.js';

export async function onRequest(context) {
  if (context.request.method === 'OPTIONS') return corsPreflight();

  const kv = getKV(context);
  if (!kv) return json(500, { error: '服务端存储未配置' });

  const { id } = context.params;
  const obj = await kv.getWithMetadata(`img:${id}`, 'arrayBuffer');
  if (!obj || !obj.value) return json(404, { error: '图片不存在' });

  const contentType = (obj.metadata && obj.metadata.contentType) || 'application/octet-stream';
  return new Response(obj.value, {
    headers: {
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=31536000, immutable',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
