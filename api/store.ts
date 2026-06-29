export interface User {
  id: string;
  email: string;
  name: string;
  password: string;
  createdAt: string;
}

export interface Photo {
  id: string;
  title: string;
  description: string;
  url: string;
  thumbnailUrl: string;
  category: string;
  photographerId: string;
  photographerName: string;
  createdAt: string;
  likes: number;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
}

export const users: User[] = [];

export const photos: Photo[] = [];

export const categories: Category[] = [
  { id: '1', name: '风景', icon: 'mountain' },
  { id: '2', name: '人物', icon: 'user' },
  { id: '3', name: '建筑', icon: 'building' },
  { id: '4', name: '动物', icon: 'cat' },
  { id: '5', name: '静物', icon: 'flower' },
];

const mockUsers = [
  {
    id: '1',
    email: 'admin@example.com',
    name: '管理员',
    createdAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '2',
    email: 'user@example.com',
    name: '用户',
    createdAt: '2024-01-02T00:00:00Z',
  },
];

export async function initMockData(): Promise<void> {
  if (users.length === 0) {
    const { hashPassword } = await import('./jwt');
    for (const mockUser of mockUsers) {
      users.push({
        ...mockUser,
        password: await hashPassword('123456'),
      });
    }
  }
}

const mockPhotos = [
  {
    id: '1',
    title: '山间日出',
    description: '清晨的阳光洒在连绵的山脉上，金色的光芒穿透云层，美不胜收。',
    url: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=beautiful%20mountain%20sunrise%20golden%20light%20clouds&image_size=landscape_16_9',
    thumbnailUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=beautiful%20mountain%20sunrise%20golden%20light%20clouds&image_size=square_hd',
    category: '风景',
    photographerId: '1',
    photographerName: '管理员',
    createdAt: '2024-01-15T10:30:00Z',
    likes: 128,
  },
  {
    id: '2',
    title: '城市夜景',
    description: '繁华都市的夜晚，霓虹灯闪烁，车流穿梭，构成一幅现代都市画卷。',
    url: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=city%20night%20neon%20lights%20traffic%20modern&image_size=landscape_16_9',
    thumbnailUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=city%20night%20neon%20lights%20traffic%20modern&image_size=square_hd',
    category: '建筑',
    photographerId: '2',
    photographerName: '用户',
    createdAt: '2024-01-14T18:45:00Z',
    likes: 95,
  },
  {
    id: '3',
    title: '海边日落',
    description: '夕阳西下，金色的余晖洒在海面上，波光粼粼，令人心旷神怡。',
    url: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=seaside%20sunset%20golden%20ocean%20waves&image_size=landscape_16_9',
    thumbnailUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=seaside%20sunset%20golden%20ocean%20waves&image_size=square_hd',
    category: '风景',
    photographerId: '1',
    photographerName: '管理员',
    createdAt: '2024-01-13T17:20:00Z',
    likes: 156,
  },
  {
    id: '4',
    title: '静谧森林',
    description: '阳光透过树叶的缝隙洒落，形成斑驳的光影，宁静而神秘。',
    url: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=forest%20sunlight%20rays%20mysterious%20peaceful&image_size=landscape_16_9',
    thumbnailUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=forest%20sunlight%20rays%20mysterious%20peaceful&image_size=square_hd',
    category: '风景',
    photographerId: '2',
    photographerName: '用户',
    createdAt: '2024-01-12T09:15:00Z',
    likes: 87,
  },
  {
    id: '5',
    title: '城市建筑',
    description: '现代建筑的几何美感，线条流畅，结构严谨，展现人类智慧的结晶。',
    url: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=modern%20architecture%20geometric%20lines%20building&image_size=landscape_16_9',
    thumbnailUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=modern%20architecture%20geometric%20lines%20building&image_size=square_hd',
    category: '建筑',
    photographerId: '1',
    photographerName: '管理员',
    createdAt: '2024-01-11T14:00:00Z',
    likes: 63,
  },
  {
    id: '6',
    title: '猫咪特写',
    description: '毛茸茸的小猫咪，眼神灵动，可爱至极。',
    url: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=cute%20cat%20close%20up%20fluffy%20adorable&image_size=portrait_4_3',
    thumbnailUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=cute%20cat%20close%20up%20fluffy%20adorable&image_size=square_hd',
    category: '动物',
    photographerId: '2',
    photographerName: '用户',
    createdAt: '2024-01-10T11:30:00Z',
    likes: 203,
  },
];

export async function initMockPhotos(): Promise<void> {
  if (photos.length === 0) {
    photos.push(...mockPhotos);
  }
}