'use client';

import { useState, useEffect } from 'react';
import EventsManager from '@/components/admin/EventsManager';
import ArtistsManager from '@/components/admin/ArtistsManager';
import TicketsManager from '@/components/admin/TicketsManager';
import PurchasesView from '@/components/admin/PurchasesView';
import { 
  isAdminAuthenticated, 
  setAdminAuthenticated, 
  setAdminCredentials,
  getAdminCredentials 
} from '@/lib/adminStorage';

interface Stats {
  totalSales: number;
  totalPurchases: number;
  totalEvents: number;
  totalArtists: number;
}

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    // Check if already authenticated
    if (isAdminAuthenticated()) {
      setIsAuthenticated(true);
      fetchStats();
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const credentials = btoa(`${username}:${password}`);
      const response = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${credentials}`
        }
      });

      if (response.ok) {
        setAdminAuthenticated(true);
        setAdminCredentials(credentials);
        setIsAuthenticated(true);
        fetchStats();
      } else {
        setError('認証に失敗しました。ユーザー名とパスワードを確認してください。');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('ログインエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setAdminAuthenticated(false);
    setIsAuthenticated(false);
    setUsername('');
    setPassword('');
  };

  const fetchStats = async () => {
    try {
      const credentials = getAdminCredentials();
      if (!credentials) {
        setError('認証情報が見つかりません');
        // デフォルト値を設定
        setStats({
          totalSales: 0,
          totalPurchases: 0,
          totalEvents: 0,
          totalArtists: 0,
        });
        return;
      }
      
      const response = await fetch('/api/admin/stats', {
        headers: {
          'Authorization': `Basic ${credentials}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data);
      } else {
        console.error('Failed to fetch stats');
        // エラー時もデフォルト値を設定
        setStats({
          totalSales: 0,
          totalPurchases: 0,
          totalEvents: 0,
          totalArtists: 0,
        });
      }
    } catch (err) {
      console.error('Failed to fetch stats:', err);
      // エラー時もデフォルト値を設定
      setStats({
        totalSales: 0,
        totalPurchases: 0,
        totalEvents: 0,
        totalArtists: 0,
      });
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-gray-800 rounded-lg shadow-xl p-8">
          <h1 className="text-3xl font-bold text-white mb-8 text-center">
            管理画面ログイン
          </h1>
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-2">
                ユーザー名
              </label>
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="admin"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                パスワード
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            {error && (
              <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'ログイン中...' : 'ログイン'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <header className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-white">管理画面</h1>
          <button
            onClick={handleLogout}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition"
          >
            ログアウト
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tab Navigation */}
        <div className="bg-gray-800 rounded-lg p-1 mb-6 flex space-x-1">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex-1 py-3 px-4 rounded-lg font-medium transition ${
              activeTab === 'dashboard'
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            ダッシュボード
          </button>
          <button
            onClick={() => setActiveTab('events')}
            className={`flex-1 py-3 px-4 rounded-lg font-medium transition ${
              activeTab === 'events'
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            イベント管理
          </button>
          <button
            onClick={() => setActiveTab('artists')}
            className={`flex-1 py-3 px-4 rounded-lg font-medium transition ${
              activeTab === 'artists'
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            アーティスト管理
          </button>
          <button
            onClick={() => setActiveTab('tickets')}
            className={`flex-1 py-3 px-4 rounded-lg font-medium transition ${
              activeTab === 'tickets'
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            チケット管理
          </button>
          <button
            onClick={() => setActiveTab('purchases')}
            className={`flex-1 py-3 px-4 rounded-lg font-medium transition ${
              activeTab === 'purchases'
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            購入履歴
          </button>
        </div>

        {/* Tab Content */}
        <div className="bg-gray-800 rounded-lg p-6">
          {activeTab === 'dashboard' && (
            <div>
              <h2 className="text-2xl font-bold text-white mb-6">統計情報</h2>
              {stats ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-gray-700 rounded-lg p-6">
                    <div className="text-gray-400 text-sm mb-2">総売上</div>
                    <div className="text-3xl font-bold text-white">
                      ¥{(stats.totalSales || 0).toLocaleString()}
                    </div>
                  </div>
                  <div className="bg-gray-700 rounded-lg p-6">
                    <div className="text-gray-400 text-sm mb-2">購入数</div>
                    <div className="text-3xl font-bold text-white">
                      {stats.totalPurchases || 0}
                    </div>
                  </div>
                  <div className="bg-gray-700 rounded-lg p-6">
                    <div className="text-gray-400 text-sm mb-2">イベント数</div>
                    <div className="text-3xl font-bold text-white">
                      {stats.totalEvents || 0}
                    </div>
                  </div>
                  <div className="bg-gray-700 rounded-lg p-6">
                    <div className="text-gray-400 text-sm mb-2">アーティスト数</div>
                    <div className="text-3xl font-bold text-white">
                      {stats.totalArtists || 0}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-gray-400">読み込み中...</div>
              )}
            </div>
          )}

          {activeTab === 'events' && <EventsManager />}
          {activeTab === 'artists' && <ArtistsManager />}
          {activeTab === 'tickets' && <TicketsManager />}
          {activeTab === 'purchases' && <PurchasesView />}
        </div>
      </div>
    </div>
  );
}
