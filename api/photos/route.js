import { photos, categories, initMockData, initMockPhotos } from '../store.js';

export async function GET(request) {
  await initMockData();
  await initMockPhotos();
  
  const url = new URL(request.url);
  const category = url.searchParams.get('category');

  let filteredPhotos = photos;
  if (category) {
    filteredPhotos = photos.filter(p => p.category === category);
  }

  filteredPhotos.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return new Response(JSON.stringify({
    success: true,
    data: filteredPhotos,
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}