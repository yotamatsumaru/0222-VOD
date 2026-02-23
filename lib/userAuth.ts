import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export interface UserPayload {
  userId: number;
  email: string;
}

// クライアントサイドでトークンを保存
export function setAuthToken(token: string) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('auth_token', token);
  }
}

// クライアントサイドでトークンを取得
export function getAuthToken(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('auth_token');
  }
  return null;
}

// クライアントサイドでトークンを削除
export function removeAuthToken() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('auth_token');
  }
}

// クライアントサイドでログイン状態を確認
export function isAuthenticated(): boolean {
  const token = getAuthToken();
  if (!token) return false;

  try {
    const decoded = jwt.decode(token) as { exp: number } | null;
    if (!decoded || !decoded.exp) return false;
    
    // トークンの有効期限をチェック
    return decoded.exp * 1000 > Date.now();
  } catch {
    return false;
  }
}

// サーバーサイドでトークンを検証
export function verifyToken(token: string): UserPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as UserPayload;
    return decoded;
  } catch {
    return null;
  }
}

// Authorization ヘッダーを生成
export function getAuthHeaders(): { Authorization: string } | {} {
  const token = getAuthToken();
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}
