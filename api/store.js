export const users = [];
export const photos = [];
export const categories = [
  { id: '1', name: '风景', icon: 'mountain' },
  { id: '2', name: '人物', icon: 'user' },
  { id: '3', name: '动物', icon: 'cat' },
  { id: '4', name: '建筑', icon: 'building' },
];

export async function initMockData() {
  if (users.length === 0) {
    users.push({
      id: '1',
      email: 'admin@example.com',
      name: '管理员',
      password: '$2b$10$EixZaYbB.rK4fl8x2q7Meu6Q6D6r7a9L9x9Q9L9x9Q9L9x9Q9L9x9',
      createdAt: new Date().toISOString(),
    });
    users.push({
      id: '2',
      email: 'user@example.com',
      name: '用户',
      password: '$2b$10$EixZaYbB.rK4fl8x2q7Meu6Q6D6r7a9L9x9Q9L9x9Q9L9x9Q9L9x9',
      createdAt: new Date().toISOString(),
    });
  }
}

export async function initMockPhotos() {
  if (photos.length === 0) {
    photos.push({
      id: '1',
      title: '山间日出',
      description: '清晨的阳光穿过山间云雾',
      url: 'https://picsum.photos/id/29/800/1200',
      thumbnailUrl: 'https://picsum.photos/id/29/400/600',
      category: '1',
      photographerId: '1',
      photographerName: '管理员',
      createdAt: new Date().toISOString(),
      likes: 128,
    });
    photos.push({
      id: '2',
      title: '城市夜景',
      description: '繁华都市的璀璨灯火',
      url: 'https://picsum.photos/id/1067/1200/800',
      thumbnailUrl: 'https://picsum.photos/id/1067/600/400',
      category: '4',
      photographerId: '2',
      photographerName: '用户',
      createdAt: new Date().toISOString(),
      likes: 256,
    });
    photos.push({
      id: '3',
      title: '可爱猫咪',
      description: '阳光下慵懒的小猫',
      url: 'https://picsum.photos/id/40/800/1000',
      thumbnailUrl: 'https://picsum.photos/id/40/400/500',
      category: '3',
      photographerId: '1',
      photographerName: '管理员',
      createdAt: new Date().toISOString(),
      likes: 512,
    });
    photos.push({
      id: '4',
      title: '海边风景',
      description: '蓝色大海与天空相连',
      url: 'https://picsum.photos/id/10/1200/800',
      thumbnailUrl: 'https://picsum.photos/id/10/600/400',
      category: '1',
      photographerId: '2',
      photographerName: '用户',
      createdAt: new Date().toISOString(),
      likes: 384,
    });
    photos.push({
      id: '5',
      title: '人像摄影',
      description: '自然光线中的人物肖像',
      url: 'https://picsum.photos/id/64/800/1200',
      thumbnailUrl: 'https://picsum.photos/id/64/400/600',
      category: '2',
      photographerId: '1',
      photographerName: '管理员',
      createdAt: new Date().toISOString(),
      likes: 192,
    });
    photos.push({
      id: '6',
      title: '古镇建筑',
      description: '历史悠久的古建筑群',
      url: 'https://picsum.photos/id/1076/1200/800',
      thumbnailUrl: 'https://picsum.photos/id/1076/600/400',
      category: '4',
      photographerId: '2',
      photographerName: '用户',
      createdAt: new Date().toISOString(),
      likes: 168,
    });
  }
}