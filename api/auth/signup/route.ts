import { randomUUID } from 'crypto';
import { users, initMockData } from '../store';
import { generateToken, hashPassword } from '../jwt';

export async function POST(request: Request) {
  await initMockData();
  
  const { email, password, name } = await request.json();

  if (!email || !password || !name) {
    return new Response(JSON.stringify({ error: '请填写完整信息' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (password.length < 6) {
    return new Response(JSON.stringify({ error: '密码长度至少为6位' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const existingUser = users.find(u => u.email === email);
  if (existingUser) {
    return new Response(JSON.stringify({ error: '该邮箱已被注册' }), {
      status: 409,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const hashedPassword = await hashPassword(password);
  const newUser = {
    id: randomUUID(),
    email,
    name,
    password: hashedPassword,
    createdAt: new Date().toISOString(),
  };

  users.push(newUser);
  const token = generateToken(newUser.id);

  return new Response(JSON.stringify({
    success: true,
    data: {
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
      },
      token,
    },
  }), {
    status: 201,
    headers: { 'Content-Type': 'application/json' },
  });
}