import { createHash, randomBytes, createHmac, timingSafeEqual } from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-here-change-in-production';
const JWT_EXPIRES_IN = 7 * 24 * 60 * 60;

export function generateToken(userId: string): string {
  const header = JSON.stringify({ alg: 'HS256', typ: 'JWT' });
  const payload = JSON.stringify({ 
    userId, 
    exp: Math.floor(Date.now() / 1000) + JWT_EXPIRES_IN 
  });
  
  const base64Header = Buffer.from(header).toString('base64url');
  const base64Payload = Buffer.from(payload).toString('base64url');
  
  const signature = createHmac('sha256', JWT_SECRET)
    .update(`${base64Header}.${base64Payload}`)
    .digest('base64url');
  
  return `${base64Header}.${base64Payload}.${signature}`;
}

export function verifyToken(token: string): { userId: string } | null {
  try {
    const [headerB64, payloadB64, signatureB64] = token.split('.');
    
    const expectedSignature = createHmac('sha256', JWT_SECRET)
      .update(`${headerB64}.${payloadB64}`)
      .digest('base64url');
    
    if (!timingSafeEqual(Buffer.from(signatureB64), Buffer.from(expectedSignature))) {
      return null;
    }
    
    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString());
    
    if (payload.exp && payload.exp < Date.now() / 1000) {
      return null;
    }
    
    return { userId: payload.userId };
  } catch {
    return null;
  }
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex');
  const hash = createHash('sha256')
    .update(`${password}${salt}`)
    .digest('hex');
  return `${salt}:${hash}`;
}

export async function comparePassword(password: string, hashedPassword: string): Promise<boolean> {
  const [salt, hash] = hashedPassword.split(':');
  const newHash = createHash('sha256')
    .update(`${password}${salt}`)
    .digest('hex');
  return timingSafeEqual(Buffer.from(newHash), Buffer.from(hash));
}