import { usePhotoStore } from '@/store/photoStore';

export function CategoryFilter() {
  const { categories, selectedCategory, setSelectedCategory } = usePhotoStore();

  return (
    <div className="category-filter">
      <button
        onClick={() => setSelectedCategory('')}
        className={`category-pill ${
          selectedCategory === ''
            ? 'category-pill-active'
            : 'category-pill-inactive'
        }`}
      >
        全部
      </button>
      
      {categories.map((category) => (
        <button
          key={category.id}
          onClick={() => setSelectedCategory(category.name)}
          className={`category-pill ${
            selectedCategory === category.name
              ? 'category-pill-active'
              : 'category-pill-inactive'
          }`}
        >
          {category.name}
        </button>
      ))}
    </div>
  );
}