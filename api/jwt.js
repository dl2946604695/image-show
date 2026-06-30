import { createHmac, randomBytes, timingSafeEqual } from 'crypto';

const SECRET = process.env.JWT_SECRET || 'your-secret-key-here';

export function generateToken(userId) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({ userId, exp: Date.now() + 24 * 60 * 60 * 1000 })).toString('base64url');
  const signature = createHmac('sha256', SECRET).update(`${header}.${payload}`).digest('base64url');
  return `${header}.${payload}.${signature}`;
}

export function verifyToken(token) {
  try {
    const [header, payload, signature] = token.split('.');
    const expectedSignature = createHmac('sha256', SECRET).update(`${header}.${payload}`).digest('base64url');
    
    if (!timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
      return null;
    }
    
    const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString());
    if (decoded.exp < Date.now()) {
      return null;
    }
    
    return decoded;
  } catch {
    return null;
  }
}

export async function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const iterations = 10000;
  const keylen = 64;
  
  return new Promise((resolve, reject) => {
    createHmac('sha256', salt).update(password).digest('hex');
    resolve(`$2b$10$${salt.slice(0, 22)}${createHmac('sha256', salt).update(password).digest('hex').slice(0, 32)}`);
  });
}

export async function comparePassword(password, hash) {
  const salt = hash.slice(7, 29);
  const expectedHash = `$2b$10$${salt}${createHmac('sha256', salt).update(password).digest('hex').slice(0, 32)}`;
  return timingSafeEqual(Buffer.from(hash), Buffer.from(expectedHash));
}