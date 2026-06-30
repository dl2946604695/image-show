import { categories, initMockData } from '../../store.js';

export async function GET(request) {
  await initMockData();
  
  return new Response(JSON.stringify({
    success: true,
    data: categories,
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}