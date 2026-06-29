import { useNavigate } from 'react-router-dom';
import type { Photo } from '@/types';

interface PhotoCardProps {
  photo: Photo;
}

const heights = [280, 320, 360, 400, 440];

export function PhotoCard({ photo }: PhotoCardProps) {
  const navigate = useNavigate();
  const height = heights[parseInt(photo.id) % heights.length];

  return (
    <div
      className="masonry-item photo-card"
      style={{ height: `${height}px` }}
      onClick={() => navigate(`/photo/${photo.id}`)}
    >
      <img
        src={photo.thumbnailUrl}
        alt={photo.title}
        className="photo-card-image"
        loading="lazy"
        style={{ height: '100%' }}
      />
      
      <span className="photo-card-category-tag">
        {photo.category}
      </span>
      
      <div className="photo-card-overlay">
        <h3 className="photo-card-title">{photo.title}</h3>
        <p className="photo-card-meta">{photo.photographerName}</p>
      </div>
    </div>
  );
}