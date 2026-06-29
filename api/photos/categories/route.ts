import { categories, initMockData } from '../../../store';

export async function GET(request: Request) {
  await initMockData();
  
  return new Response(JSON.stringify({
    success: true,
    data: categories,
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}