import express from 'express';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { users } from '../data/store';
import { generateToken } from '../utils/jwt';
import type { SignupRequest, LoginRequest } from '../types';

const router = express.Router();

router.post('/login', async (req, res) => {
  const { email, password } = req.body as LoginRequest;

  if (!email || !password) {
    return res.status(400).json({ error: '请填写邮箱和密码' });
  }

  const user = users.find(u => u.email === email);
  if (!user) {
    return res.status(401).json({ error: '邮箱或密码错误' });
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    return res.status(401).json({ error: '邮箱或密码错误' });
  }

  const token = generateToken(user.id);
  
  res.json({
    success: true,
    data: {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      token,
    },
  });
});

router.post('/signup', async (req, res) => {
  const { email, password, name } = req.body as SignupRequest;

  if (!email || !password || !name) {
    return res.status(400).json({ error: '请填写完整信息' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: '密码长度至少为6位' });
  }

  const existingUser = users.find(u => u.email === email);
  if (existingUser) {
    return res.status(409).json({ error: '该邮箱已被注册' });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser = {
    id: uuidv4(),
    email,
    name,
    password: hashedPassword,
    createdAt: new Date().toISOString(),
  };

  users.push(newUser);
  const token = generateToken(newUser.id);

  res.status(201).json({
    success: true,
    data: {
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
      },
      token,
    },
  });
});

export default router;