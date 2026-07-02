import { create } from 'zustand';
import type { Photo, Category, PhotoState } from '@/types';

export const usePhotoStore = create<PhotoState>((set, get) => ({
  photos: [],
  categories: [],
  selectedCategory: '',
  searchQuery: '',
  loading: false,
  hasLoaded: false,
  scrollY: 0,
  selectedPhoto: null,
  showDetail: false,

  setPhotos: (photos) => set({ photos }),
  setCategories: (categories) => set({ categories }),
  setSelectedCategory: (category) => set({ selectedCategory: category }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setLoading: (loading) => set({ loading }),
  setHasLoaded: (hasLoaded) => set({ hasLoaded }),
  setScrollY: (scrollY) => set({ scrollY }),
  setSelectedPhoto: (photo) => set({ selectedPhoto: photo }),
  setShowDetail: (show) => set({ showDetail: show }),

  openDetail: (photo) => set({ selectedPhoto: photo, showDetail: true }),
  closeDetail: () => set({ selectedPhoto: null, showDetail: false }),

  getFilteredPhotos: () => {
    const { photos, selectedCategory, searchQuery } = get();
    
    return photos.filter(photo => {
      const matchesCategory = !selectedCategory || photo.category === selectedCategory;
      const matchesSearch = !searchQuery || 
        photo.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        photo.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        photo.photographerName.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  },
}));