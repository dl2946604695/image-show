import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload as UploadIcon, X, ImagePlus } from 'lucide-react';
import { uploadPhoto, getCategories } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { usePhotoStore } from '@/store/photoStore';
import type { Category } from '@/types';

export function Upload() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const { categories, setCategories } = usePhotoStore();
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    const fetchCategories = async () => {
      const result = await getCategories();
      if (result.success && result.data) {
        const formattedCategories: Category[] = result.data.map((cat: any) => ({
          id: cat.id,
          name: cat.name,
          icon: cat.icon,
        }));
        setCategories(formattedCategories);
      }
    };

    fetchCategories();
  }, [isAuthenticated, navigate, setCategories]);

  useEffect(() => {
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setPreview('');
    }
  }, [file]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.size > 10 * 1024 * 1024) {
        setError('文件大小不能超过 10MB');
        return;
      }
      if (!selectedFile.type.startsWith('image/')) {
        setError('请上传图片文件');
        return;
      }
      setFile(selectedFile);
      setError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title || !file || !category) {
      setError('请填写完整信息');
      return;
    }

    setUploading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      formData.append('category', category);
      formData.append('file', file);

      const result = await uploadPhoto(formData);

      if (!result.success) {
        throw new Error(result.error || '上传失败');
      }

      navigate('/');
    } catch (err: any) {
      console.error('Upload failed:', err);
      setError(err.message || '上传失败，请重试');
    } finally {
      setUploading(false);
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="upload-modal-overlay">
      <div className="upload-modal-card relative">
        <button
          onClick={() => navigate('/')}
          className="upload-close-btn"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <h2 className="text-lg font-medium text-white mb-1">上传照片</h2>
          <p className="text-xs text-text-tertiary">分享你的精彩瞬间</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="upload-drop-zone">
            {preview ? (
              <div className="relative inline-block">
                <img
                  src={preview}
                  alt="预览"
                  className="max-h-32 rounded-lg object-contain"
                />
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setFile(null); }}
                  className="absolute -top-2 -right-2 p-1.5 bg-black/60 hover:bg-black/80 rounded-full transition-colors"
                >
                  <X className="w-4 h-4 text-white" />
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="w-12 h-12 mx-auto bg-bg-tertiary rounded-xl flex items-center justify-center">
                  <ImagePlus className="w-6 h-6 text-text-tertiary" />
                </div>
                <div>
                  <p className="text-sm text-text-secondary font-medium">拖拽照片到此处，或点击选择</p>
                  <p className="text-xs text-text-quaternary mt-1">支持 JPG、PNG，最大 10MB</p>
                </div>
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
          </div>

          <input
            type="text"
            placeholder="作品标题"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="upload-input"
            required
          />

          <div className="category-filter justify-start mb-4">
            <span className="text-xs text-text-tertiary mr-3">分类：</span>
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategory(cat.name)}
                className={`category-pill ${
                  category === cat.name
                    ? 'category-pill-active'
                    : 'category-pill-inactive'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {error && (
            <div className="bg-red-50/10 border border-red-500/20 rounded-lg px-4 py-3 text-red-400 text-sm mb-4">
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="upload-btn-secondary flex-1"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={uploading}
              className="upload-btn flex-1"
            >
              {uploading ? (
                <div className="loading-spinner mx-auto" />
              ) : (
                <span>
                  <UploadIcon className="w-4 h-4 inline mr-2" />
                  发布作品
                </span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}