/**
 * 安全にsessionStorageにアクセスするヘルパー関数
 */
export function getAdminCredentials(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }
  return sessionStorage.getItem('admin_credentials');
}

export function setAdminCredentials(credentials: string): void {
  if (typeof window !== 'undefined') {
    sessionStorage.setItem('admin_credentials', credentials);
  }
}

export function isAdminAuthenticated(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  return sessionStorage.getItem('admin_authenticated') === 'true';
}

export function setAdminAuthenticated(authenticated: boolean): void {
  if (typeof window !== 'undefined') {
    if (authenticated) {
      sessionStorage.setItem('admin_authenticated', 'true');
    } else {
      sessionStorage.removeItem('admin_authenticated');
      sessionStorage.removeItem('admin_credentials');
    }
  }
}

/**
 * 管理画面APIリクエスト用のヘッダーを取得
 */
export function getAdminHeaders(): HeadersInit {
  const credentials = getAdminCredentials();
  if (!credentials) {
    return {};
  }
  
  return {
    'Authorization': `Basic ${credentials}`,
    'Content-Type': 'application/json',
  };
}
