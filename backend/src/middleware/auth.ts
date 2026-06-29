import type { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';
import { users } from '../data/store';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    name: string;
  };
}

export function authenticate(req: AuthRequest, res: Response, next: NextFunction) {
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

  req.user = {
    id: user.id,
    email: user.email,
    name: user.name,
  };
  
  next();
}