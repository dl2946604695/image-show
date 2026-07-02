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

export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
}

export interface PhotoState {
  photos: Photo[];
  categories: Category[];
  selectedCategory: string;
  searchQuery: string;
  loading: boolean;
  hasLoaded: boolean;
  scrollY: number;
  selectedPhoto: Photo | null;
  showDetail: boolean;
  setPhotos: (photos: Photo[]) => void;
  setCategories: (categories: Category[]) => void;
  setSelectedCategory: (category: string) => void;
  setSearchQuery: (query: string) => void;
  setLoading: (loading: boolean) => void;
  setHasLoaded: (hasLoaded: boolean) => void;
  setScrollY: (scrollY: number) => void;
  setSelectedPhoto: (photo: Photo | null) => void;
  setShowDetail: (show: boolean) => void;
  openDetail: (photo: Photo) => void;
  closeDetail: () => void;
  getFilteredPhotos: () => Photo[];
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  setUser: (user: User | null) => void;
  initAuth: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  signup: (email: string, password: string, name: string) => Promise<void>;
}