import { json, corsPreflight, getKV, getSecret } from '../../_lib/cors.js';
import { getUsers, getPhotos, setPhotos, ensureSeed } from '../../_lib/store.js';
import { verifyToken } from '../../_lib/auth.js';

export async function onRequest(context) {
  if (context.request.method === 'OPTIONS') return corsPreflight();
  if (context.request.method !== 'POST') return json(405, { error: 'Method not allowed' });

  const kv = getKV(context);
  if (!kv) return json(500, { error: '服务端存储未配置' });

  const secret = getSecret(context);

  const auth = context.request.headers.get('Authorization') || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  const decoded = token ? await verifyToken(token, secret) : null;
  if (!decoded) return json(401, { error: '请先登录' });

  await ensureSeed(kv);
  const users = await getUsers(kv);
  const user = users.find((u) => u.id === decoded.userId);
  if (!user) return json(401, { error: '用户不存在' });

  let form;
  try {
    form = await context.request.formData();
  } catch {
    return json(400, { error: '表单解析失败' });
  }

  const title = (form.get('title') || '').toString().trim();
  const description = (form.get('description') || '').toString().trim();
  const category = (form.get('category') || '').toString().trim();
  const file = form.get('file');

  if (!title || !category || !file) {
    return json(400, { error: '请填写完整信息' });
  }
  if (file.size > 10 * 1024 * 1024) {
    return json(400, { error: '文件大小不能超过 10MB' });
  }
  if (!file.type || !file.type.startsWith('image/')) {
    return json(400, { error: '请上传图片文件' });
  }

  const id = crypto.randomUUID();
  const arrayBuffer = await file.arrayBuffer();
  await kv.put(`img:${id}`, arrayBuffer, {
    metadata: { contentType: file.type, name: file.name },
  });

  const newPhoto = {
    id,
    title,
    description,
    url: `/api/photos/${id}/image`,
    thumbnailUrl: `/api/photos/${id}/image`,
    category,
    photographerId: user.id,
    photographerName: user.name,
    createdAt: new Date().toISOString(),
    likes: 0,
  };

  const photos = await getPhotos(kv);
  photos.push(newPhoto);
  await setPhotos(kv, photos);

  return json(201, { success: true, data: newPhoto });
}
