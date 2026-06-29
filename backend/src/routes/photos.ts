import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';
import { photos, categories } from '../data/store';
import { authenticate, type AuthRequest } from '../middleware/auth';
import type { UploadRequest } from '../types';

const router = express.Router();

const UPLOAD_DIR = path.join(process.cwd(), 'uploads');
const THUMBNAIL_DIR = path.join(process.cwd(), 'thumbnails');

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

if (!fs.existsSync(THUMBNAIL_DIR)) {
  fs.mkdirSync(THUMBNAIL_DIR, { recursive: true });
}

router.get('/', (req, res) => {
  const { category } = req.query;
  
  let filteredPhotos = photos;
  if (category && typeof category === 'string') {
    filteredPhotos = photos.filter(p => p.category === category);
  }

  filteredPhotos.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  res.json({
    success: true,
    data: filteredPhotos,
  });
});

router.get('/:id', (req, res) => {
  const { id } = req.params;
  const photo = photos.find(p => p.id === id);

  if (!photo) {
    return res.status(404).json({ error: '照片不存在' });
  }

  res.json({
    success: true,
    data: photo,
  });
});

router.post('/upload', authenticate, (req, res) => {
  const { title, description, category } = req.body as UploadRequest;
  const file = (req.files?.file as Express.Multer.File) || null;
  const user = (req as AuthRequest).user;

  if (!title || !file || !category) {
    return res.status(400).json({ error: '请填写完整信息' });
  }

  if (file.size > 10 * 1024 * 1024) {
    return res.status(400).json({ error: '文件大小不能超过 10MB' });
  }

  if (!file.mimetype.startsWith('image/')) {
    return res.status(400).json({ error: '请上传图片文件' });
  }

  const fileExt = file.name.split('.').pop();
  const fileName = `${uuidv4()}.${fileExt}`;
  
  const uploadPath = path.join(UPLOAD_DIR, fileName);
  const thumbnailPath = path.join(THUMBNAIL_DIR, fileName);

  file.mv(uploadPath, (err) => {
    if (err) {
      return res.status(500).json({ error: '文件上传失败' });
    }

    fs.copyFile(uploadPath, thumbnailPath, (copyErr) => {
      if (copyErr) {
        console.error('Failed to copy thumbnail:', copyErr);
      }
    });

    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const newPhoto = {
      id: uuidv4(),
      title,
      description: description || '',
      url: `${baseUrl}/uploads/${fileName}`,
      thumbnailUrl: `${baseUrl}/thumbnails/${fileName}`,
      category,
      photographerId: user!.id,
      photographerName: user!.name,
      createdAt: new Date().toISOString(),
      likes: 0,
    };

    photos.push(newPhoto);

    res.status(201).json({
      success: true,
      data: newPhoto,
    });
  });
});

router.put('/:id/like', authenticate, (req, res) => {
  const { id } = req.params;
  const photo = photos.find(p => p.id === id);

  if (!photo) {
    return res.status(404).json({ error: '照片不存在' });
  }

  photo.likes += 1;

  res.json({
    success: true,
    data: { likes: photo.likes },
  });
});

router.get('/categories', (req, res) => {
  res.json({
    success: true,
    data: categories,
  });
});

export default router;