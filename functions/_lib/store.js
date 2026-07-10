// Cloudflare KV 存储辅助 + 初始种子数据
import { hashPassword } from './auth.js';

const KEYS = {
  users: 'app:users',
  photos: 'app:photos',
  categories: 'app:categories',
};

export async function getJSON(kv, key, fallback) {
  if (!kv) return fallback;
  const v = await kv.get(key);
  if (v === null) return fallback;
  try {
    return JSON.parse(v);
  } catch {
    return fallback;
  }
}

export async function setJSON(kv, key, value) {
  await kv.put(key, JSON.stringify(value));
}

export const getUsers = (kv) => getJSON(kv, KEYS.users, []);
export const setUsers = (kv, v) => setJSON(kv, KEYS.users, v);
export const getPhotos = (kv) => getJSON(kv, KEYS.photos, []);
export const setPhotos = (kv, v) => setJSON(kv, KEYS.photos, v);
export const getCategories = (kv) => getJSON(kv, KEYS.categories, []);
export const setCategories = (kv, v) => setJSON(kv, KEYS.categories, v);

const SEED_CATEGORIES = [
  { id: '1', name: '风景', icon: 'mountain' },
  { id: '2', name: '人物', icon: 'user' },
  { id: '3', name: '建筑', icon: 'building' },
  { id: '4', name: '动物', icon: 'cat' },
  { id: '5', name: '静物', icon: 'flower' },
];

const SEED_PHOTOS = [
  { id: '1', title: '晨曦山峦', description: '清晨的阳光洒在连绵的山峦上，金色的光芒与云雾交织成一幅壮丽的画卷。', url: 'https://picsum.photos/id/10/1200/800', thumbnailUrl: 'https://picsum.photos/id/10/800/600', category: '风景', photographerId: '1', photographerName: '张三', createdAt: '2024-01-15T10:30:00Z', likes: 128 },
  { id: '2', title: '城市夜景', description: '繁华都市的夜晚，霓虹灯闪烁，车流穿梭，构成一幅现代都市的交响曲。', url: 'https://picsum.photos/id/1067/1200/800', thumbnailUrl: 'https://picsum.photos/id/1067/800/600', category: '建筑', photographerId: '2', photographerName: '李四', createdAt: '2024-01-14T19:45:00Z', likes: 95 },
  { id: '3', title: '静谧花园', description: '午后的阳光透过树叶，洒落在盛开的花朵上，宁静而美好。', url: 'https://picsum.photos/id/106/800/1000', thumbnailUrl: 'https://picsum.photos/id/106/600/600', category: '静物', photographerId: '3', photographerName: '王五', createdAt: '2024-01-13T14:20:00Z', likes: 76 },
  { id: '4', title: '海边日落', description: '夕阳西下，金色的余晖洒满海面，波光粼粼，美不胜收。', url: 'https://picsum.photos/id/1015/1200/800', thumbnailUrl: 'https://picsum.photos/id/1015/800/600', category: '风景', photographerId: '1', photographerName: '张三', createdAt: '2024-01-12T18:30:00Z', likes: 156 },
  { id: '5', title: '猫咪小憩', description: '午后慵懒的猫咪，在窗台上享受阳光，可爱又温馨。', url: 'https://picsum.photos/id/40/600/600', thumbnailUrl: 'https://picsum.photos/id/40/600/600', category: '动物', photographerId: '4', photographerName: '赵六', createdAt: '2024-01-11T15:00:00Z', likes: 234 },
  { id: '6', title: '古风人像', description: '身着汉服的女子，在古色古香的庭院中，展现东方古典之美。', url: 'https://picsum.photos/id/1005/800/1000', thumbnailUrl: 'https://picsum.photos/id/1005/600/600', category: '人物', photographerId: '5', photographerName: '陈七', createdAt: '2024-01-10T11:00:00Z', likes: 189 },
  { id: '7', title: '古镇街巷', description: '青石板铺就的小巷，白墙黛瓦，充满了历史的韵味。', url: 'https://picsum.photos/id/1033/1200/800', thumbnailUrl: 'https://picsum.photos/id/1033/800/600', category: '建筑', photographerId: '2', photographerName: '李四', createdAt: '2024-01-09T09:30:00Z', likes: 142 },
  { id: '8', title: '雪山之巅', description: '巍峨的雪山在蓝天的映衬下，显得格外壮丽神圣。', url: 'https://picsum.photos/id/1015/800/1200', thumbnailUrl: 'https://picsum.photos/id/1015/600/800', category: '风景', photographerId: '1', photographerName: '张三', createdAt: '2024-01-08T08:00:00Z', likes: 267 },
  { id: '9', title: '花卉特写', description: '娇艳的玫瑰在水珠的点缀下，更加鲜艳动人。', url: 'https://picsum.photos/id/106/600/600', thumbnailUrl: 'https://picsum.photos/id/106/600/600', category: '静物', photographerId: '3', photographerName: '王五', createdAt: '2024-01-07T16:45:00Z', likes: 89 },
  { id: '10', title: '飞鸟翱翔', description: '雄鹰在蓝天白云间自由翱翔，展现力量与自由之美。', url: 'https://picsum.photos/id/1000/1200/800', thumbnailUrl: 'https://picsum.photos/id/1000/800/600', category: '动物', photographerId: '4', photographerName: '赵六', createdAt: '2024-01-06T10:15:00Z', likes: 112 },
  { id: '11', title: '时尚人像', description: '现代都市中的时尚青年，展现青春活力与个性风采。', url: 'https://picsum.photos/id/1006/800/1000', thumbnailUrl: 'https://picsum.photos/id/1006/600/600', category: '人物', photographerId: '5', photographerName: '陈七', createdAt: '2024-01-05T14:00:00Z', likes: 178 },
  { id: '12', title: '现代建筑', description: '线条流畅的现代建筑，在阳光下展现几何之美。', url: 'https://picsum.photos/id/1067/1200/800', thumbnailUrl: 'https://picsum.photos/id/1067/800/600', category: '建筑', photographerId: '2', photographerName: '李四', createdAt: '2024-01-04T11:30:00Z', likes: 67 },
];

// 首次运行时填充分类、示例照片与管理员账号
export async function ensureSeed(kv) {
  if (!kv) return;
  if ((await getCategories(kv)).length === 0) {
    await setCategories(kv, SEED_CATEGORIES);
  }
  if ((await getPhotos(kv)).length === 0) {
    await setPhotos(kv, SEED_PHOTOS);
  }
  if ((await getUsers(kv)).length === 0) {
    const hashed = await hashPassword('123456');
    await setUsers(kv, [
      {
        id: 'admin',
        email: 'admin@example.com',
        name: '管理员',
        password: hashed,
        createdAt: new Date().toISOString(),
      },
    ]);
  }
}
