export const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

let token: string | null = localStorage.getItem('auth_token');

export function setAuthToken(newToken: string | null) {
  token = newToken;
  if (newToken) {
    localStorage.setItem('auth_token', newToken);
  } else {
    localStorage.removeItem('auth_token');
  }
}

const mockCategories = [
  { id: '1', name: '风景', icon: 'mountain' },
  { id: '2', name: '人物', icon: 'user' },
  { id: '3', name: '建筑', icon: 'building' },
  { id: '4', name: '动物', icon: 'cat' },
  { id: '5', name: '静物', icon: 'flower' },
];

const mockPhotos = [
  {
    id: '1',
    title: '晨曦山峦',
    description: '清晨的阳光洒在连绵的山峦上，金色的光芒与云雾交织成一幅壮丽的画卷。',
    url: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=beautiful%20mountain%20landscape%20at%20sunrise%20with%20golden%20light%20and%20mist%20professional%20photography&image_size=landscape_16_9',
    thumbnailUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=beautiful%20mountain%20landscape%20at%20sunrise%20with%20golden%20light%20and%20mist%20professional%20photography&image_size=landscape_4_3',
    category: '风景',
    photographerId: '1',
    photographerName: '张三',
    createdAt: '2024-01-15T10:30:00Z',
    likes: 128,
  },
  {
    id: '2',
    title: '城市夜景',
    description: '繁华都市的夜晚，霓虹灯闪烁，车流穿梭，构成一幅现代都市的交响曲。',
    url: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=city%20night%20skyline%20with%20neon%20lights%20and%20traffic%20long%20exposure%20photography&image_size=landscape_16_9',
    thumbnailUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=city%20night%20skyline%20with%20neon%20lights%20and%20traffic%20long%20exposure%20photography&image_size=landscape_4_3',
    category: '建筑',
    photographerId: '2',
    photographerName: '李四',
    createdAt: '2024-01-14T19:45:00Z',
    likes: 95,
  },
  {
    id: '3',
    title: '静谧花园',
    description: '午后的阳光透过树叶，洒落在盛开的花朵上，宁静而美好。',
    url: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=beautiful%20garden%20with%20colorful%20flowers%20and%20sunlight%20through%20leaves%20peaceful%20nature%20photography&image_size=portrait_4_3',
    thumbnailUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=beautiful%20garden%20with%20colorful%20flowers%20and%20sunlight%20through%20leaves%20peaceful%20nature%20photography&image_size=square',
    category: '静物',
    photographerId: '3',
    photographerName: '王五',
    createdAt: '2024-01-13T14:20:00Z',
    likes: 76,
  },
  {
    id: '4',
    title: '海边日落',
    description: '夕阳西下，金色的余晖洒满海面，波光粼粼，美不胜收。',
    url: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=beautiful%20seaside%20sunset%20with%20golden%20light%20and%20ocean%20waves%20professional%20landscape%20photography&image_size=landscape_16_9',
    thumbnailUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=beautiful%20seaside%20sunset%20with%20golden%20light%20and%20ocean%20waves%20professional%20landscape%20photography&image_size=landscape_4_3',
    category: '风景',
    photographerId: '1',
    photographerName: '张三',
    createdAt: '2024-01-12T18:30:00Z',
    likes: 156,
  },
  {
    id: '5',
    title: '猫咪小憩',
    description: '午后慵懒的猫咪，在窗台上享受阳光，可爱又温馨。',
    url: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=cute%20cat%20sleeping%20on%20windowsill%20with%20sunlight%20warm%20cozy%20pet%20photography&image_size=square',
    thumbnailUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=cute%20cat%20sleeping%20on%20windowsill%20with%20sunlight%20warm%20cozy%20pet%20photography&image_size=square',
    category: '动物',
    photographerId: '4',
    photographerName: '赵六',
    createdAt: '2024-01-11T15:00:00Z',
    likes: 234,
  },
  {
    id: '6',
    title: '古风人像',
    description: '身着汉服的女子，在古色古香的庭院中，展现东方古典之美。',
    url: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=beautiful%20asian%20woman%20in%20traditional%20chinese%20hanfu%20dress%20in%20ancient%20garden%20portrait%20photography&image_size=portrait_4_3',
    thumbnailUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=beautiful%20asian%20woman%20in%20traditional%20chinese%20hanfu%20dress%20in%20ancient%20garden%20portrait%20photography&image_size=square',
    category: '人物',
    photographerId: '5',
    photographerName: '陈七',
    createdAt: '2024-01-10T11:00:00Z',
    likes: 189,
  },
  {
    id: '7',
    title: '古镇街巷',
    description: '青石板铺就的小巷，白墙黛瓦，充满了历史的韵味。',
    url: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=ancient%20chinese%20town%20street%20with%20traditional%20architecture%20blue%20tiles%20and%20stone%20road%20photography&image_size=landscape_16_9',
    thumbnailUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=ancient%20chinese%20town%20street%20with%20traditional%20architecture%20blue%20tiles%20and%20stone%20road%20photography&image_size=landscape_4_3',
    category: '建筑',
    photographerId: '2',
    photographerName: '李四',
    createdAt: '2024-01-09T09:30:00Z',
    likes: 142,
  },
  {
    id: '8',
    title: '雪山之巅',
    description: '巍峨的雪山在蓝天的映衬下，显得格外壮丽神圣。',
    url: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=magnificent%20snow%20mountain%20peak%20under%20blue%20sky%20alpine%20landscape%20professional%20photography&image_size=portrait_16_9',
    thumbnailUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=magnificent%20snow%20mountain%20peak%20under%20blue%20sky%20alpine%20landscape%20professional%20photography&image_size=portrait_4_3',
    category: '风景',
    photographerId: '1',
    photographerName: '张三',
    createdAt: '2024-01-08T08:00:00Z',
    likes: 267,
  },
  {
    id: '9',
    title: '花卉特写',
    description: '娇艳的玫瑰在水珠的点缀下，更加鲜艳动人。',
    url: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=beautiful%20rose%20flower%20closeup%20with%20water%20drops%20macro%20photography%20vibrant%20colors&image_size=square',
    thumbnailUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=beautiful%20rose%20flower%20closeup%20with%20water%20drops%20macro%20photography%20vibrant%20colors&image_size=square',
    category: '静物',
    photographerId: '3',
    photographerName: '王五',
    createdAt: '2024-01-07T16:45:00Z',
    likes: 89,
  },
  {
    id: '10',
    title: '飞鸟翱翔',
    description: '雄鹰在蓝天白云间自由翱翔，展现力量与自由之美。',
    url: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=eagle%20flying%20in%20blue%20sky%20with%20clouds%20wildlife%20photography%20dramatic%20pose&image_size=landscape_16_9',
    thumbnailUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=eagle%20flying%20in%20blue%20sky%20with%20clouds%20wildlife%20photography%20dramatic%20pose&image_size=landscape_4_3',
    category: '动物',
    photographerId: '4',
    photographerName: '赵六',
    createdAt: '2024-01-06T10:15:00Z',
    likes: 112,
  },
  {
    id: '11',
    title: '时尚人像',
    description: '现代都市中的时尚青年，展现青春活力与个性风采。',
    url: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=fashion%20portrait%20of%20young%20person%20in%20modern%20city%20street%20style%20photography&image_size=portrait_4_3',
    thumbnailUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=fashion%20portrait%20of%20young%20person%20in%20modern%20city%20street%20style%20photography&image_size=square',
    category: '人物',
    photographerId: '5',
    photographerName: '陈七',
    createdAt: '2024-01-05T14:00:00Z',
    likes: 178,
  },
  {
    id: '12',
    title: '现代建筑',
    description: '线条流畅的现代建筑，在阳光下展现几何之美。',
    url: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=modern%20architecture%20building%20with%20clean%20lines%20and%20geometric%20design%20architectural%20photography&image_size=landscape_16_9',
    thumbnailUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=modern%20architecture%20building%20with%20clean%20lines%20and%20geometric%20design%20architectural%20photography&image_size=landscape_4_3',
    category: '建筑',
    photographerId: '2',
    photographerName: '李四',
    createdAt: '2024-01-04T11:30:00Z',
    likes: 67,
  },
];

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ success: boolean; data: T; error?: string }> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      throw new Error('Not JSON response');
    }

    const result = await response.json();

    if (!response.ok) {
      return { success: false, data: result as T, error: result.error || '请求失败' };
    }

    return result;
  } catch {
    return { success: false, data: {} as T, error: '网络错误' };
  }
}

export async function login(email: string, password: string) {
  const result = await request<{
    user: { id: string; email: string; name: string };
    token: string;
  }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });

  if (result.success && result.data.token) {
    setAuthToken(result.data.token);
  }

  return result;
}

export async function signup(email: string, password: string, name: string) {
  const result = await request<{
    user: { id: string; email: string; name: string };
    token: string;
  }>('/auth/signup', {
    method: 'POST',
    body: JSON.stringify({ email, password, name }),
  });

  if (result.success && result.data.token) {
    setAuthToken(result.data.token);
  }

  return result;
}

export async function logout() {
  setAuthToken(null);
}

export async function getPhotos(category?: string) {
  try {
    const params = category ? `?category=${encodeURIComponent(category)}` : '';
    const result = await request<{ id: string; title: string; description: string; url: string; thumbnailUrl: string; category: string; photographerId: string; photographerName: string; createdAt: string; likes: number }[]>('/photos' + params);
    
    if (result.success && result.data.length > 0) {
      return result;
    }
  } catch {
  }
  
  let filtered = mockPhotos;
  if (category) {
    filtered = mockPhotos.filter(p => p.category === category);
  }
  
  return { success: true, data: filtered };
}

export async function getPhoto(id: string) {
  try {
    const result = await request<{ id: string; title: string; description: string; url: string; thumbnailUrl: string; category: string; photographerId: string; photographerName: string; createdAt: string; likes: number }>(`/photos/${id}`);
    
    if (result.success && result.data) {
      return result;
    }
  } catch {
  }
  
  const photo = mockPhotos.find(p => p.id === id);
  if (photo) {
    return { success: true, data: photo };
  }
  
  return { success: false, data: {} as any, error: '照片不存在' };
}

export async function uploadPhoto(formData: FormData) {
  try {
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/photos/upload`, {
      method: 'POST',
      body: formData,
      headers,
    });

    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      throw new Error('Not JSON response');
    }

    const result = await response.json();

    if (!response.ok) {
      return { success: false, data: result, error: result.error || '上传失败' };
    }

    return result;
  } catch {
    return { success: false, data: {}, error: '上传失败' };
  }
}

export async function likePhoto(id: string) {
  try {
    const result = await request<{ likes: number }>(`/photos/${id}/like`, {
      method: 'PUT',
    });
    
    if (result.success) {
      return result;
    }
  } catch {
  }
  
  return { success: true, data: { likes: 0 } };
}

export async function getCategories() {
  try {
    const result = await request<{ id: string; name: string; icon: string }[]>('/photos/categories');
    
    if (result.success && result.data.length > 0) {
      return result;
    }
  } catch {
  }
  
  return { success: true, data: mockCategories };
}

export async function checkAuth() {
  if (!token) {
    return null;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/photos`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.ok) {
      const tokenPayload = JSON.parse(atob(token.split('.')[1]));
      return {
        id: tokenPayload.userId,
        email: '',
        name: '',
      };
    }
  } catch {
  }

  setAuthToken(null);
  return null;
}