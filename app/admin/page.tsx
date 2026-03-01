'use client';

import { useState, useEffect } from 'react';
import EventsManager from '@/components/admin/EventsManager';
import ArtistsManager from '@/components/admin/ArtistsManager';
import TicketsManager from '@/components/admin/TicketsManager';
import PurchasesView from '@/components/admin/PurchasesView';
import AdminsManager from '@/components/admin/AdminsManager';
import UsersManager from '@/components/admin/UsersManager';

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
  artist_id?: number;
  artist_ids?: number[];
  artist_name?: string;
  artist_names?: string[];
}

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState<Stats | null>(null);
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (token) {
      verifyToken(token);
    } else {
      setIsCheckingAuth(false);
    }
  }, []);

  const verifyToken = async (token: string) => {
    try {
      const response = await fetch('/api/admin/auth/verify', {
        headers: { 'Authorization': `Bearer ${token}` }
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
    } finally {
      setIsCheckingAuth(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/admin/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('admin_token', data.token);
        setAdminUser(data.admin);
        setIsAuthenticated(true);
        fetchStats(data.token);
      } else {
        setError(data.error || '認証に失敗しました');
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
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data);
      } else {
        setStats({ totalSales: 0, totalPurchases: 0, totalEvents: 0, totalArtists: 0 });
      }
    } catch (err) {
      setStats({ totalSales: 0, totalPurchases: 0, totalEvents: 0, totalArtists: 0 });
    }
  };

  const refreshStats = () => {
    const token = localStorage.getItem('admin_token');
    if (token) fetchStats(token);
  };

  const isSuperAdmin = adminUser?.role === 'super_admin';

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400">認証確認中...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-gray-900 rounded-lg shadow-2xl p-8 border border-gray-800">
          <h1 className="text-3xl font-bold text-white mb-8 text-center">管理画面</h1>
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">ユーザー名</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">パスワード</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            {error && (
              <div className="bg-red-900/20 border border-red-800 text-red-400 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition disabled:opacity-50"
            >
              {loading ? 'ログイン中...' : 'ログイン'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-950 overflow-hidden">
      {/* Sidebar */}
      <aside className={`${sidebarCollapsed ? 'w-20' : 'w-64'} bg-gray-900 border-r border-gray-800 flex flex-col transition-all duration-300`}>
        {/* Header */}
        <div className="p-4 border-b border-gray-800">
          <div className="flex items-center justify-between">
            {!sidebarCollapsed && (
              <div>
                <h1 className="text-xl font-bold text-white">管理画面</h1>
                <div className="flex items-center mt-2">
                  <span className="text-sm text-gray-400">{adminUser?.username}</span>
                  <span className={`ml-2 px-2 py-0.5 text-xs rounded ${
                    isSuperAdmin ? 'bg-purple-600 text-white' : 'bg-blue-600 text-white'
                  }`}>
                    {isSuperAdmin ? 'Super Admin' : 'Artist Admin'}
                  </span>
                </div>
              </div>
            )}
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="text-gray-400 hover:text-white p-2"
            >
              <i className={`fas fa-${sidebarCollapsed ? 'angle-right' : 'angle-left'}`}></i>
            </button>
          </div>
        </div>

        {/* メイン (MAIN) */}
        <div className="px-4 pt-4 pb-2">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            {sidebarCollapsed ? '' : 'メイン (MAIN)'}
          </p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center' : ''} px-4 py-3 rounded-lg transition ${
              activeTab === 'dashboard'
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
            title={sidebarCollapsed ? 'ダッシュボード' : ''}
          >
            <i className="fas fa-home w-5"></i>
            {!sidebarCollapsed && <span className="ml-3">ダッシュボード</span>}
          </button>

          {/* 管理 (MANAGEMENT) */}
          <div className="pt-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 pb-2">
              {sidebarCollapsed ? '' : '管理 (MANAGEMENT)'}
            </p>
          </div>

          <button
            onClick={() => setActiveTab('users')}
            className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center' : ''} px-4 py-3 rounded-lg transition ${
              activeTab === 'users'
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
            title={sidebarCollapsed ? 'ユーザー管理' : ''}
          >
            <i className="fas fa-users w-5"></i>
            {!sidebarCollapsed && <span className="ml-3">ユーザー管理</span>}
          </button>

          {/* コンテンツ管理 */}
          <div className="pt-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 pb-2">
              {sidebarCollapsed ? '' : 'コンテンツ管理'}
            </p>
          </div>

          <button
            onClick={() => setActiveTab('events')}
            className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center' : ''} px-4 py-3 rounded-lg transition ${
              activeTab === 'events'
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
            title={sidebarCollapsed ? 'イベント管理' : ''}
          >
            <i className="fas fa-calendar-alt w-5"></i>
            {!sidebarCollapsed && <span className="ml-3">イベント管理</span>}
          </button>

          {isSuperAdmin && (
            <button
              onClick={() => setActiveTab('artists')}
              className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center' : ''} px-4 py-3 rounded-lg transition ${
                activeTab === 'artists'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
              title={sidebarCollapsed ? 'アーティスト管理' : ''}
            >
              <i className="fas fa-user-tie w-5"></i>
              {!sidebarCollapsed && <span className="ml-3">アーティスト管理</span>}
            </button>
          )}

          <button
            onClick={() => setActiveTab('tickets')}
            className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center' : ''} px-4 py-3 rounded-lg transition ${
              activeTab === 'tickets'
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
            title={sidebarCollapsed ? 'チケット管理' : ''}
          >
            <i className="fas fa-ticket-alt w-5"></i>
            {!sidebarCollapsed && <span className="ml-3">チケット管理</span>}
          </button>

          <button
            onClick={() => setActiveTab('purchases')}
            className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center' : ''} px-4 py-3 rounded-lg transition ${
              activeTab === 'purchases'
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
            title={sidebarCollapsed ? '購入履歴' : ''}
          >
            <i className="fas fa-shopping-cart w-5"></i>
            {!sidebarCollapsed && <span className="ml-3">購入履歴</span>}
          </button>

          {/* 分析 (ANALYTICS) */}
          <div className="pt-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 pb-2">
              {sidebarCollapsed ? '' : '分析 (ANALYTICS)'}
            </p>
          </div>

          <button
            onClick={() => setActiveTab('dashboard')}
            className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center' : ''} px-4 py-3 rounded-lg transition ${
              activeTab === 'dashboard'
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
            title={sidebarCollapsed ? '分析・レポート' : ''}
          >
            <i className="fas fa-chart-line w-5"></i>
            {!sidebarCollapsed && <span className="ml-3">分析・レポート</span>}
          </button>

          {/* システム (SYSTEM) */}
          <div className="pt-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 pb-2">
              {sidebarCollapsed ? '' : 'システム (SYSTEM)'}
            </p>
          </div>

          <button
            onClick={() => setActiveTab('settings')}
            className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center' : ''} px-4 py-3 rounded-lg transition ${
              activeTab === 'settings'
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
            title={sidebarCollapsed ? '設定' : ''}
          >
            <i className="fas fa-cog w-5"></i>
            {!sidebarCollapsed && <span className="ml-3">設定</span>}
          </button>

          {isSuperAdmin && (
            <button
              onClick={() => setActiveTab('admins')}
              className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center' : ''} px-4 py-3 rounded-lg transition ${
                activeTab === 'admins'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
              title={sidebarCollapsed ? '管理者管理' : ''}
            >
              <i className="fas fa-user-shield w-5"></i>
              {!sidebarCollapsed && <span className="ml-3">管理者管理</span>}
            </button>
          )}
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-gray-800">
          <button
            onClick={handleLogout}
            className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center' : ''} px-4 py-3 rounded-lg bg-red-600 hover:bg-red-700 text-white transition`}
            title={sidebarCollapsed ? 'ログアウト' : ''}
          >
            <i className="fas fa-sign-out-alt w-5"></i>
            {!sidebarCollapsed && <span className="ml-3">ログアウト</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {/* Top Bar */}
        <div className="bg-gray-900 border-b border-gray-800 px-6 py-4">
          <h2 className="text-2xl font-bold text-white">
            {activeTab === 'dashboard' && '統計情報'}
            {activeTab === 'events' && 'イベント管理'}
            {activeTab === 'artists' && 'アーティスト管理'}
            {activeTab === 'tickets' && 'チケット管理'}
            {activeTab === 'purchases' && '購入履歴'}
            {activeTab === 'users' && 'ユーザー管理'}
            {activeTab === 'admins' && '管理者管理'}
            {activeTab === 'settings' && '設定'}
          </h2>
        </div>

        {/* Content Area */}
        <div className="p-6">
          {activeTab === 'dashboard' && (
            <div>
              {stats ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
                    <div className="text-gray-400 text-sm mb-2">総売上</div>
                    <div className="text-3xl font-bold text-white">
                      ¥{(stats.totalSales || 0).toLocaleString()}
                    </div>
                  </div>
                  <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
                    <div className="text-gray-400 text-sm mb-2">購入数</div>
                    <div className="text-3xl font-bold text-white">
                      {stats.totalPurchases || 0}
                    </div>
                  </div>
                  <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
                    <div className="text-gray-400 text-sm mb-2">イベント数</div>
                    <div className="text-3xl font-bold text-white">
                      {stats.totalEvents || 0}
                    </div>
                  </div>
                  <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
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
          {activeTab === 'users' && isSuperAdmin && <UsersManager />}
          {activeTab === 'admins' && isSuperAdmin && <AdminsManager />}
          {activeTab === 'settings' && (
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
              <p className="text-gray-400">設定画面は準備中です</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
