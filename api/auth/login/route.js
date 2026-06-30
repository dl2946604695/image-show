import { comparePassword, generateToken } from '../jwt.js';
import { users, initMockData } from '../store.js';

export async function POST(request) {
  await initMockData();
  
  const { email, password } = await request.json();

  if (!email || !password) {
    return new Response(JSON.stringify({ error: '请填写邮箱和密码' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const user = users.find(u => u.email === email);
  if (!user) {
    return new Response(JSON.stringify({ error: '邮箱或密码错误' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const isPasswordValid = await comparePassword(password, user.password);
  if (!isPasswordValid) {
    return new Response(JSON.stringify({ error: '邮箱或密码错误' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const token = generateToken(user.id);

  return new Response(JSON.stringify({
    success: true,
    data: {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      token,
    },
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}