import { json, corsPreflight, getKV, getSecret } from '../../_lib/cors.js';
import { getUsers, setUsers, ensureSeed } from '../../_lib/store.js';
import { hashPassword, generateToken } from '../../_lib/auth.js';

export async function onRequest(context) {
  if (context.request.method === 'OPTIONS') return corsPreflight();
  if (context.request.method !== 'POST') return json(405, { error: 'Method not allowed' });

  const kv = getKV(context);
  if (!kv) return json(500, { error: '服务端存储未配置' });

  const secret = getSecret(context);
  await ensureSeed(kv);

  const { email, password, name } = await context.request.json().catch(() => ({}));
  if (!email || !password || !name) return json(400, { error: '请填写完整信息' });

  const users = await getUsers(kv);
  if (users.find((u) => u.email === email)) {
    return json(400, { error: '该邮箱已被注册' });
  }

  const hashed = await hashPassword(password);
  const newUser = {
    id: crypto.randomUUID(),
    email,
    name,
    password: hashed,
    createdAt: new Date().toISOString(),
  };
  users.push(newUser);
  await setUsers(kv, users);

  const token = await generateToken(newUser.id, secret);
  return json(201, {
    success: true,
    data: {
      user: { id: newUser.id, email: newUser.email, name: newUser.name },
      token,
    },
  });
}
