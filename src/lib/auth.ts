import { sign, verify } from 'hono/jwt';

export interface AccessTokenPayload {
  purchaseId: number;
  eventId: number;
  customerId: string;
  email: string;
  exp?: number;
}

export async function generateAccessToken(
  payload: Omit<AccessTokenPayload, 'exp'>,
  secret: string,
  expiresInSeconds: number = 86400 * 30 // 30 days default
): Promise<string> {
  const exp = Math.floor(Date.now() / 1000) + expiresInSeconds;
  
  const tokenPayload: AccessTokenPayload = {
    ...payload,
    exp,
  };

  return await sign(tokenPayload, secret);
}

export async function verifyAccessToken(
  token: string,
  secret: string
): Promise<AccessTokenPayload | null> {
  try {
    const payload = await verify(token, secret) as AccessTokenPayload;
    return payload;
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
}

export function generateRandomToken(length: number = 32): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  const randomValues = new Uint8Array(length);
  crypto.getRandomValues(randomValues);
  
  for (let i = 0; i < length; i++) {
    result += chars[randomValues[i] % chars.length];
  }
  
  return result;
}
