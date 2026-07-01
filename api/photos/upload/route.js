import { randomUUID } from 'crypto';
import { photos, users, initMockData, initMockPhotos } from '../../store.js';
import { verifyToken } from '../../jwt.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  await initMockData();
  await initMockPhotos();
  
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: '未授权，请先登录' });
  }

  const token = authHeader.split(' ')[1];
  const decoded = verifyToken(token);
  
  if (!decoded) {
    return res.status(401).json({ error: '无效的认证令牌' });
  }

  const user = users.find(u => u.id === decoded.userId);
  if (!user) {
    return res.status(401).json({ error: '用户不存在' });
  }

  try {
    const contentType = req.headers['content-type'];
    let title, description, category, file;

    if (contentType && contentType.includes('multipart/form-data')) {
      const boundary = contentType.split('boundary=')[1];
      const body = await new Promise((resolve) => {
        let data = [];
        req.on('data', (chunk) => data.push(chunk));
        req.on('end', () => resolve(Buffer.concat(data).toString()));
      });

      const parts = body.split(`--${boundary}`);
      for (const part of parts) {
        if (part.includes('name="title"')) {
          title = part.split('\r\n\r\n')[1]?.trim();
        } else if (part.includes('name="description"')) {
          description = part.split('\r\n\r\n')[1]?.trim() || '';
        } else if (part.includes('name="category"')) {
          category = part.split('\r\n\r\n')[1]?.trim();
        } else if (part.includes('name="file"')) {
          const fileMatch = part.match(/filename="([^"]+)"/);
          const typeMatch = part.match(/Content-Type: (\S+)/);
          const fileData = part.split('\r\n\r\n')[1]?.replace(/\r\n--$/, '');
          
          if (fileMatch && typeMatch && fileData) {
            file = {
              name: fileMatch[1],
              type: typeMatch[1],
              size: fileData.length,
              data: fileData,
            };
          }
        }
      }
    }

    if (!title || !file || !category) {
      return res.status(400).json({ error: '请填写完整信息' });
    }

    if (file.size > 10 * 1024 * 1024) {
      return res.status(400).json({ error: '文件大小不能超过 10MB' });
    }

    if (!file.type.startsWith('image/')) {
      return res.status(400).json({ error: '请上传图片文件' });
    }

    const imageUrl = `data:${file.type};base64,${Buffer.from(file.data, 'binary').toString('base64')}`;

    const newPhoto = {
      id: randomUUID(),
      title,
      description,
      url: imageUrl,
      thumbnailUrl: imageUrl,
      category,
      photographerId: user.id,
      photographerName: user.name,
      createdAt: new Date().toISOString(),
      likes: 0,
    };

    photos.push(newPhoto);

    res.status(201).json({
      success: true,
      data: newPhoto,
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: '上传失败' });
  }
}