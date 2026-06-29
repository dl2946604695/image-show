const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

let token: string | null = localStorage.getItem('auth_token');

export function setAuthToken(newToken: string | null) {
  token = newToken;
  if (newToken) {
    localStorage.setItem('auth_token', newToken);
  } else {
    localStorage.removeItem('auth_token');
  }
}

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

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const result = await response.json();

  if (!response.ok) {
    return { success: false, data: result as T, error: result.error || '请求失败' };
  }

  return result;
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
  const params = category ? `?category=${encodeURIComponent(category)}` : '';
  return request<{ id: string; title: string; description: string; url: string; thumbnailUrl: string; category: string; photographerId: string; photographerName: string; createdAt: string; likes: number }[]>('/photos' + params);
}

export async function getPhoto(id: string) {
  return request<{ id: string; title: string; description: string; url: string; thumbnailUrl: string; category: string; photographerId: string; photographerName: string; createdAt: string; likes: number }>(`/photos/${id}`);
}

export async function uploadPhoto(formData: FormData) {
  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}/photos/upload`, {
    method: 'POST',
    body: formData,
    headers,
  });

  const result = await response.json();

  if (!response.ok) {
    return { success: false, data: result, error: result.error || '上传失败' };
  }

  return result;
}

export async function likePhoto(id: string) {
  return request<{ likes: number }>(`/photos/${id}/like`, {
    method: 'PUT',
  });
}

export async function getCategories() {
  return request<{ id: string; name: string; icon: string }[]>('/photos/categories');
}

export async function checkAuth() {
  if (!token) {
    return null;
  }

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

  setAuthToken(null);
  return null;
}