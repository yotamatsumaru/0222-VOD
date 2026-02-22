import jwt from 'jsonwebtoken';
import { JWTPayload } from './types';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export function generateAccessToken(payload: Omit<JWTPayload, 'exp'>): string {
  const expiresIn = 24 * 60 * 60; // 24 hours
  return jwt.sign(
    {
      ...payload,
      exp: Math.floor(Date.now() / 1000) + expiresIn,
    },
    JWT_SECRET
  );
}

export function verifyAccessToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    return decoded;
  } catch (error) {
    console.error('JWT verification failed:', error);
    return null;
  }
}

export function decodeAccessToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.decode(token) as JWTPayload;
    return decoded;
  } catch (error) {
    console.error('JWT decode failed:', error);
    return null;
  }
}
