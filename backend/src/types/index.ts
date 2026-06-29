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

export interface LoginRequest {
  email: string;
  password: string;
}

export interface SignupRequest {
  email: string;
  password: string;
  name: string;
}

export interface UploadRequest {
  title: string;
  description: string;
  category: string;
}

export interface ErrorResponse {
  error: string;
}

export interface SuccessResponse<T = any> {
  success: boolean;
  data: T;
}