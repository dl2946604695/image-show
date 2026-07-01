import { photos, initMockData, initMockPhotos } from '../../store.js';

export default async function handler(req, res) {
  await initMockData();
  await initMockPhotos();
  
  const { id } = req.query;
  const photo = photos.find(p => p.id === id);

  if (!photo) {
    return res.status(404).json({ error: '照片不存在' });
  }

  res.status(200).json({
    success: true,
    data: photo,
  });
}