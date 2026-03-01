'use client';

import { useState, useEffect } from 'react';
import EventsManager from '@/components/admin/EventsManager';
import ArtistsManager from '@/components/admin/ArtistsManager';
import TicketsManager from '@/components/admin/TicketsManager';
import PurchasesView from '@/components/admin/PurchasesView';
import AdminsManager from '@/components/admin/AdminsManager';

interface Stats {
  totalSales: number;
  totalPurchases: number;
  totalEvents: number;
  totalArtists: number;
}

interface AdminUser {
  id: number;
  username: string;
  role: 'super_admin' | 'artist_admin';
  email?: string;
  artist_id?: number; // 後方互換性（非推奨）
  artist_ids?: number[]; // 新: 複数アーティストID
  artist_name?: string; // 後方互換性（非推奨）
  artist_names?: string[]; // 新: 複数アーティスト名
}

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState<Stats | null>(null);
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);

  useEffect(() => {
    // Check if already authenticated
    const token = localStorage.getItem('admin_token');
    if (token) {
      verifyToken(token);
    }
  }, []);

  const verifyToken = async (token: string) => {
    try {
      const response = await fetch('/api/admin/auth/verify', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setAdminUser(data.admin);
        setIsAuthenticated(true);
        fetchStats(token);
      } else {
        localStorage.removeItem('admin_token');
      }
    } catch (err) {
      console.error('Token verification error:', err);
      localStorage.removeItem('admin_token');
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/admin/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('admin_token', data.token);
        setAdminUser(data.admin);
        setIsAuthenticated(true);
        fetchStats(data.token);
      } else {
        setError(data.error || '認証に失敗しました。ユーザー名とパスワードを確認してください。');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('ログインエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    setIsAuthenticated(false);
    setAdminUser(null);
    setUsername('');
    setPassword('');
    setActiveTab('dashboard');
  };

  const fetchStats = async (token: string) => {
    try {
      const response = await fetch('/api/admin/stats', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data);
      } else {
        console.error('Failed to fetch stats');
        setStats({
          totalSales: 0,
          totalPurchases: 0,
          totalEvents: 0,
          totalArtists: 0,
        });
      }
    } catch (err) {
      console.error('Failed to fetch stats:', err);
      setStats({
        totalSales: 0,
        totalPurchases: 0,
        totalEvents: 0,
        totalArtists: 0,
      });
    }
  };

  const refreshStats = () => {
    const token = localStorage.getItem('admin_token');
    if (token) {
      fetchStats(token);
    }
  };

  const isSuperAdmin = adminUser?.role === 'super_admin';

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
          <div>
            <h1 className="text-2xl font-bold text-white">管理画面</h1>
            <p className="text-sm text-gray-400 mt-1">
              {adminUser?.username} 
              {isSuperAdmin ? (
                <span className="ml-2 px-2 py-1 bg-purple-600 text-white text-xs rounded">Super Admin</span>
              ) : (
                <span className="ml-2 px-2 py-1 bg-blue-600 text-white text-xs rounded">
                  Artist Admin {adminUser?.artist_name && `- ${adminUser.artist_name}`}
                </span>
              )}
            </p>
          </div>
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
        <div className="bg-gray-800 rounded-lg p-1 mb-6 flex flex-wrap gap-1">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex-1 min-w-[120px] py-3 px-4 rounded-lg font-medium transition ${
              activeTab === 'dashboard'
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            ダッシュボード
          </button>
          <button
            onClick={() => setActiveTab('events')}
            className={`flex-1 min-w-[120px] py-3 px-4 rounded-lg font-medium transition ${
              activeTab === 'events'
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            イベント管理
          </button>
          {isSuperAdmin && (
            <button
              onClick={() => setActiveTab('artists')}
              className={`flex-1 min-w-[120px] py-3 px-4 rounded-lg font-medium transition ${
                activeTab === 'artists'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              アーティスト管理
            </button>
          )}
          <button
            onClick={() => setActiveTab('tickets')}
            className={`flex-1 min-w-[120px] py-3 px-4 rounded-lg font-medium transition ${
              activeTab === 'tickets'
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            チケット管理
          </button>
          <button
            onClick={() => setActiveTab('purchases')}
            className={`flex-1 min-w-[120px] py-3 px-4 rounded-lg font-medium transition ${
              activeTab === 'purchases'
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            購入履歴
          </button>
          {isSuperAdmin && (
            <button
              onClick={() => setActiveTab('admins')}
              className={`flex-1 min-w-[120px] py-3 px-4 rounded-lg font-medium transition ${
                activeTab === 'admins'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              管理者管理
            </button>
          )}
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

          {activeTab === 'events' && <EventsManager artistId={adminUser?.artist_id} artistIds={adminUser?.artist_ids} />}
          {activeTab === 'artists' && isSuperAdmin && <ArtistsManager onDataChanged={refreshStats} />}
          {activeTab === 'tickets' && <TicketsManager artistId={adminUser?.artist_id} artistIds={adminUser?.artist_ids} />}
          {activeTab === 'purchases' && <PurchasesView artistId={adminUser?.artist_id} artistIds={adminUser?.artist_ids} />}
          {activeTab === 'admins' && isSuperAdmin && <AdminsManager />}
        </div>
      </div>
    </div>
  );
}
