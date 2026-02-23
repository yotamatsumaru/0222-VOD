'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated, removeAuthToken, getAuthHeaders } from '@/lib/userAuth';

export default function Navigation() {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);

  useEffect(() => {
    // ログイン状態をチェック
    const checkAuth = async () => {
      const authenticated = isAuthenticated();
      console.log('[Navigation] Is authenticated:', authenticated);
      setIsLoggedIn(authenticated);

      if (authenticated) {
        // ユーザー情報を取得
        try {
          const response = await fetch('/api/auth/me', {
            headers: getAuthHeaders() as HeadersInit,
          });
          console.log('[Navigation] User info response:', response.status);
          if (response.ok) {
            const data = await response.json();
            console.log('[Navigation] User data:', data);
            setUserName(data.user.name || data.user.email);
          } else {
            console.error('[Navigation] Failed to get user info:', response.status);
          }
        } catch (error) {
          console.error('[Navigation] Failed to fetch user:', error);
        }
      }
    };

    checkAuth();
  }, []);

  const handleLogout = () => {
    removeAuthToken();
    setIsLoggedIn(false);
    setUserName(null);
    router.push('/');
    router.refresh();
  };

  const handleMyPageClick = () => {
    console.log('[Navigation] Navigating to MyPage');
    router.push('/mypage');
  };

  return (
    <nav className="bg-black bg-opacity-50 backdrop-blur-md border-b border-gray-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center">
            <i className="fas fa-broadcast-tower text-purple-500 text-2xl mr-3"></i>
            <Link
              href="/"
              className="text-white text-xl font-bold hover:text-purple-400 transition"
            >
              StreamingPlatform
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex space-x-4 items-center">
            <Link
              href="/"
              className="text-gray-300 hover:text-white px-3 py-2 transition"
            >
              ホーム
            </Link>
            <Link
              href="/artists"
              className="text-gray-300 hover:text-white px-3 py-2 transition"
            >
              アーティスト
            </Link>
            <Link
              href="/events"
              className="text-gray-300 hover:text-white px-3 py-2 transition"
            >
              イベント
            </Link>

            {isLoggedIn ? (
              <>
                <button
                  onClick={handleMyPageClick}
                  className="text-purple-400 hover:text-purple-300 px-3 py-2 transition inline-flex items-center cursor-pointer"
                >
                  <i className="fas fa-user-circle mr-2 text-lg"></i>
                  <span>{userName || 'マイページ'}</span>
                </button>
                <button
                  onClick={handleLogout}
                  className="text-gray-400 hover:text-white px-3 py-2 transition"
                >
                  <i className="fas fa-sign-out-alt mr-2"></i>
                  ログアウト
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-gray-300 hover:text-white px-3 py-2 transition"
                >
                  <i className="fas fa-sign-in-alt mr-2"></i>
                  ログイン
                </Link>
                <Link
                  href="/register"
                  className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition"
                >
                  <i className="fas fa-user-plus mr-2"></i>
                  新規登録
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden text-white p-2 hover:text-purple-400 transition"
          >
            {mobileMenuOpen ? (
              <i className="fas fa-times text-2xl"></i>
            ) : (
              <i className="fas fa-bars text-2xl"></i>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-black bg-opacity-95 border-t border-gray-800">
          <div className="px-4 py-3 space-y-1">
            <Link
              href="/"
              className="block text-white px-3 py-2 rounded hover:bg-purple-600 transition"
              onClick={() => setMobileMenuOpen(false)}
            >
              <i className="fas fa-home mr-2"></i>ホーム
            </Link>
            <Link
              href="/artists"
              className="block text-gray-300 hover:text-white px-3 py-2 rounded hover:bg-gray-800 transition"
              onClick={() => setMobileMenuOpen(false)}
            >
              <i className="fas fa-users mr-2"></i>アーティスト
            </Link>
            <Link
              href="/events"
              className="block text-gray-300 hover:text-white px-3 py-2 rounded hover:bg-gray-800 transition"
              onClick={() => setMobileMenuOpen(false)}
            >
              <i className="fas fa-calendar-alt mr-2"></i>イベント
            </Link>

            {isLoggedIn ? (
              <>
                <Link
                  href="/mypage"
                  className="block text-purple-400 px-3 py-2 rounded hover:bg-gray-800 transition flex items-center"
                  onClick={() => setMobileMenuOpen(false)}
                  title="マイページ"
                >
                  <i className="fas fa-user-circle mr-2 text-lg"></i>
                  <span>{userName || 'マイページ'}</span>
                </Link>
                <button
                  onClick={() => {
                    handleLogout();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-left text-gray-400 px-3 py-2 rounded hover:bg-gray-800 transition"
                >
                  <i className="fas fa-sign-out-alt mr-2"></i>
                  ログアウト
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="block text-gray-300 hover:text-white px-3 py-2 rounded hover:bg-gray-800 transition"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <i className="fas fa-sign-in-alt mr-2"></i>
                  ログイン
                </Link>
                <Link
                  href="/register"
                  className="block bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded transition"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <i className="fas fa-user-plus mr-2"></i>
                  新規登録
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
