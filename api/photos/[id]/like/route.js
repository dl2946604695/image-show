import { photos, users, initMockData, initMockPhotos } from '../../store.js';
import { verifyToken } from '../../jwt.js';

export async function onRequestPut({ request, params }) {
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

  const { id } = params;
  const photo = photos.find(p => p.id === id);

  if (!photo) {
    return new Response(JSON.stringify({ error: '照片不存在' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  photo.likes += 1;

  return new Response(JSON.stringify({
    success: true,
    data: { likes: photo.likes },
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}