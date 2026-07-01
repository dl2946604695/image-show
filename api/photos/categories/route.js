import { categories, initMockData } from '../store.js';

export default async function handler(req, res) {
  await initMockData();
  
  res.status(200).json({
    success: true,
    data: categories,
  });
}