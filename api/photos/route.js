import { photos, categories, initMockData, initMockPhotos } from '../store.js';

export default async function handler(req, res) {
  await initMockData();
  await initMockPhotos();
  
  const category = req.query.category;

  let filteredPhotos = photos;
  if (category) {
    filteredPhotos = photos.filter(p => p.category === category);
  }

  filteredPhotos.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  res.status(200).json({
    success: true,
    data: filteredPhotos,
  });
}