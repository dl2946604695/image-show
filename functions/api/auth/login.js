import { json, corsPreflight, getKV, getSecret } from '../../_lib/cors.js';
import { getUsers, ensureSeed } from '../../_lib/store.js';
import { verifyPassword, generateToken } from '../../_lib/auth.js';

export async function onRequest(context) {
  if (context.request.method === 'OPTIONS') return corsPreflight();
  if (context.request.method !== 'POST') return json(405, { error: 'Method not allowed' });

  const kv = getKV(context);
  if (!kv) return json(500, { error: '服务端存储未配置' });

  const secret = getSecret(context);
  await ensureSeed(kv);

  const { email, password } = await context.request.json().catch(() => ({}));
  if (!email || !password) return json(400, { error: '请填写邮箱和密码' });

  const users = await getUsers(kv);
  const user = users.find((u) => u.email === email);
  if (!user) return json(401, { error: '邮箱或密码错误' });

  const ok = await verifyPassword(password, user.password);
  if (!ok) return json(401, { error: '邮箱或密码错误' });

  const token = await generateToken(user.id, secret);
  return json(200, {
    success: true,
    data: {
      user: { id: user.id, email: user.email, name: user.name },
      token,
    },
  });
}
