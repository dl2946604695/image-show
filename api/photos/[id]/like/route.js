import { photos, users, initMockData, initMockPhotos } from '../../store.js';
import { verifyToken } from '../../jwt.js';

export default async function handler(req, res) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  await initMockData();
  await initMockPhotos();
  
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: '未授权，请先登录' });
  }

  const token = authHeader.split(' ')[1];
  const decoded = verifyToken(token);
  
  if (!decoded) {
    return res.status(401).json({ error: '无效的认证令牌' });
  }

  const { id } = req.query;
  const photo = photos.find(p => p.id === id);

  if (!photo) {
    return res.status(404).json({ error: '照片不存在' });
  }

  photo.likes += 1;

  res.status(200).json({
    success: true,
    data: { likes: photo.likes },
  });
}