import { randomUUID } from 'crypto';
import { photos, users, initMockData, initMockPhotos } from '../../store.js';
import { verifyToken } from '../../jwt.js';

export async function POST(request) {
  await initMockData();
  await initMockPhotos();
  
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ error: '未授权，请先登录' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const token = authHeader.split(' ')[1];
  const decoded = verifyToken(token);
  
  if (!decoded) {
    return new Response(JSON.stringify({ error: '无效的认证令牌' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const user = users.find(u => u.id === decoded.userId);
  if (!user) {
    return new Response(JSON.stringify({ error: '用户不存在' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const formData = await request.formData();
  const title = formData.get('title');
  const description = formData.get('description') || '';
  const category = formData.get('category');
  const file = formData.get('file');

  if (!title || !file || !category) {
    return new Response(JSON.stringify({ error: '请填写完整信息' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (file.size > 10 * 1024 * 1024) {
    return new Response(JSON.stringify({ error: '文件大小不能超过 10MB' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (!file.type.startsWith('image/')) {
    return new Response(JSON.stringify({ error: '请上传图片文件' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  
  const base64 = buffer.toString('base64');
  const imageUrl = `data:${file.type};base64,${base64}`;

  const newPhoto = {
    id: randomUUID(),
    title,
    description,
    url: imageUrl,
    thumbnailUrl: imageUrl,
    category,
    photographerId: user.id,
    photographerName: user.name,
    createdAt: new Date().toISOString(),
    likes: 0,
  };

  photos.push(newPhoto);

  return new Response(JSON.stringify({
    success: true,
    data: newPhoto,
  }), {
    status: 201,
    headers: { 'Content-Type': 'application/json' },
  });
}