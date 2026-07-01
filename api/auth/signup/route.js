import { hashPassword, generateToken } from '../jwt.js';
import { users, initMockData } from '../store.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  await initMockData();
  
  const { email, password, name } = req.body;

  if (!email || !password || !name) {
    return res.status(400).json({ error: '请填写完整信息' });
  }

  const existingUser = users.find(u => u.email === email);
  if (existingUser) {
    return res.status(400).json({ error: '该邮箱已被注册' });
  }

  const hashedPassword = await hashPassword(password);
  const newUser = {
    id: Date.now().toString(),
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
}