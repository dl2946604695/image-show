import { photos, initMockData, initMockPhotos } from '../../store';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  await initMockData();
  await initMockPhotos();
  
  const { id } = params;
  const photo = photos.find(p => p.id === id);

  if (!photo) {
    return new Response(JSON.stringify({ error: '照片不存在' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({
    success: true,
    data: photo,
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}