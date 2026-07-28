import { verifyToken } from './auth.js';
import { getUsers } from './store.js';
import { getSecret } from './cors.js';

// 校验请求是否来自管理员，返回 { ok, payload, user } 或 { ok: false, response }
export async function requireAdmin(context) {
  const auth = context.request.headers.get('Authorization') || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) {
    return { ok: false, response: json(401, { error: '未授权' }) };
  }

  const secret = getSecret(context);
  const payload = await verifyToken(token, secret);
  if (!payload || !payload.userId) {
    return { ok: false, response: json(401, { error: '无效的登录凭证' }) };
  }

  const kv = context.env.PHOTO_STORE;
  if (!kv) {
    return { ok: false, response: json(500, { error: '服务端存储未配置' }) };
  }

  const users = await getUsers(kv);
  const user = users.find((u) => u.id === payload.userId);
  if (!user || user.role !== 'admin') {
    return { ok: false, response: json(403, { error: '需要管理员权限' }) };
  }

  return { ok: true, payload, user, kv };
}

// 复用 cors.js 的 json，避免循环依赖问题
function json(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    },
  });
}
