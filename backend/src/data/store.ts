import bcrypt from 'bcryptjs';
import type { User, Photo, Category } from '../types';

export const users: User[] = [];

export const photos: Photo[] = [];

export const categories: Category[] = [
  { id: '1', name: '风景', icon: 'mountain' },
  { id: '2', name: '人物', icon: 'user' },
  { id: '3', name: '建筑', icon: 'building' },
  { id: '4', name: '动物', icon: 'cat' },
  { id: '5', name: '静物', icon: 'flower' },
];

const mockUsers: Omit<User, 'password'>[] = [
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
    for (const mockUser of mockUsers) {
      users.push({
        ...mockUser,
        password: await bcrypt.hash('123456', 10),
      });
    }
  }
}