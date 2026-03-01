'use client';

import { useState, useEffect } from 'react';

interface Admin {
  id: number;
  username: string;
  role: 'super_admin' | 'artist_admin';
  email?: string;
  artist_id?: number; // 後方互換性（非推奨）
  artist_ids?: number[]; // 新: 複数アーティストID
  artist_name?: string; // 後方互換性（非推奨）
  artist_names?: string[]; // 新: 複数アーティスト名
  is_active: boolean;
  created_at: string;
}

interface Artist {
  id: number;
  name: string;
}

export default function AdminsManager() {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<Admin | null>(null);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    email: '',
    role: 'artist_admin' as 'super_admin' | 'artist_admin',
    artist_id: '', // 後方互換性（非推奨）
    artist_ids: [] as number[], // 新: 複数アーティストID
    is_active: true
  });

  useEffect(() => {
    fetchAdmins();
    fetchArtists();
  }, []);

  const fetchAdmins = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch('/api/admin/admins', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setAdmins(data);
      } else {
        alert('管理者リストの取得に失敗しました');
      }
    } catch (error) {
      console.error('Failed to fetch admins:', error);
      alert('管理者リストの取得エラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  const fetchArtists = async () => {
    try {
      const response = await fetch('/api/artists');
      if (response.ok) {
        const data = await response.json();
        setArtists(data);
      }
    } catch (error) {
      console.error('Failed to fetch artists:', error);
    }
  };

  const handleCreate = () => {
    setEditingAdmin(null);
    setFormData({
      username: '',
      password: '',
      email: '',
      role: 'artist_admin',
      artist_id: '',
      artist_ids: [],
      is_active: true
    });
    setShowModal(true);
  };

  const handleEdit = (admin: Admin) => {
    setEditingAdmin(admin);
    setFormData({
      username: admin.username,
      password: '',
      email: admin.email || '',
      role: admin.role,
      artist_id: admin.artist_id?.toString() || '',
      artist_ids: admin.artist_ids || (admin.artist_id ? [admin.artist_id] : []),
      is_active: admin.is_active
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const token = localStorage.getItem('admin_token');
    
    try {
      if (editingAdmin) {
        // Update existing admin
        const response = await fetch(`/api/admin/admins/${editingAdmin.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            email: formData.email || null,
            role: formData.role,
            artist_id: formData.artist_id ? parseInt(formData.artist_id) : null,
            is_active: formData.is_active,
            ...(formData.password && { password: formData.password })
          })
        });

        if (response.ok) {
          alert('管理者を更新しました');
          fetchAdmins();
          setShowModal(false);
        } else {
          const error = await response.json();
          alert(`更新エラー: ${error.error || '不明なエラー'}`);
        }
      } else {
        // Create new admin
        // 複数アーティストIDの検証
        if (formData.role === 'artist_admin' && formData.artist_ids.length === 0) {
          alert('アーティストを少なくとも1つ選択してください');
          return;
        }

        const response = await fetch('/api/admin/admins/create', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            username: formData.username,
            password: formData.password,
            email: formData.email || null,
            role: formData.role,
            artist_ids: formData.artist_ids // 複数アーティストID配列を送信
          })
        });

        if (response.ok) {
          alert('管理者を作成しました');
          fetchAdmins();
          setShowModal(false);
        } else {
          const error = await response.json();
          alert(`作成エラー: ${error.error || '不明なエラー'}`);
        }
      }
    } catch (error) {
      console.error('Submit error:', error);
      alert('処理中にエラーが発生しました');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('この管理者を削除してもよろしいですか？')) return;

    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`/api/admin/admins/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        alert('管理者を削除しました');
        fetchAdmins();
      } else {
        const error = await response.json();
        alert(`削除エラー: ${error.error || '不明なエラー'}`);
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('削除中にエラーが発生しました');
    }
  };

  if (loading) {
    return <div className="text-white">読み込み中...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white">管理者管理</h2>
        <button
          onClick={handleCreate}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition"
        >
          + 新規管理者作成
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-700">
              <th className="text-left py-3 px-4 text-gray-400">ID</th>
              <th className="text-left py-3 px-4 text-gray-400">ユーザー名</th>
              <th className="text-left py-3 px-4 text-gray-400">権限</th>
              <th className="text-left py-3 px-4 text-gray-400">アーティスト</th>
              <th className="text-left py-3 px-4 text-gray-400">メール</th>
              <th className="text-left py-3 px-4 text-gray-400">状態</th>
              <th className="text-left py-3 px-4 text-gray-400">作成日</th>
              <th className="text-left py-3 px-4 text-gray-400">操作</th>
            </tr>
          </thead>
          <tbody>
            {admins.map((admin) => (
              <tr key={admin.id} className="border-b border-gray-700 hover:bg-gray-700/50">
                <td className="py-3 px-4 text-white">{admin.id}</td>
                <td className="py-3 px-4 text-white">{admin.username}</td>
                <td className="py-3 px-4">
                  {admin.role === 'super_admin' ? (
                    <span className="px-2 py-1 bg-purple-600 text-white text-xs rounded">
                      Super Admin
                    </span>
                  ) : (
                    <span className="px-2 py-1 bg-blue-600 text-white text-xs rounded">
                      Artist Admin
                    </span>
                  )}
                </td>
                <td className="py-3 px-4 text-white">
                  {admin.role === 'super_admin' 
                    ? '-' 
                    : (admin.artist_names && admin.artist_names.length > 0
                        ? admin.artist_names.join(', ')
                        : admin.artist_name || '-')
                  }
                </td>
                <td className="py-3 px-4 text-white">{admin.email || '-'}</td>
                <td className="py-3 px-4">
                  {admin.is_active ? (
                    <span className="px-2 py-1 bg-green-600 text-white text-xs rounded">
                      有効
                    </span>
                  ) : (
                    <span className="px-2 py-1 bg-red-600 text-white text-xs rounded">
                      無効
                    </span>
                  )}
                </td>
                <td className="py-3 px-4 text-white">
                  {new Date(admin.created_at).toLocaleDateString('ja-JP')}
                </td>
                <td className="py-3 px-4">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEdit(admin)}
                      className="text-blue-400 hover:text-blue-300 transition"
                    >
                      編集
                    </button>
                    {admin.role !== 'super_admin' && (
                      <button
                        onClick={() => handleDelete(admin.id)}
                        className="text-red-400 hover:text-red-300 transition"
                      >
                        削除
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-white mb-4">
              {editingAdmin ? '管理者編集' : '新規管理者作成'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  ユーザー名
                </label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  disabled={!!editingAdmin}
                  required={!editingAdmin}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white disabled:opacity-50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  パスワード {editingAdmin && '(変更する場合のみ入力)'}
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required={!editingAdmin}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  メールアドレス（任意）
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  権限
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as 'super_admin' | 'artist_admin' })}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                >
                  <option value="artist_admin">Artist Admin</option>
                  <option value="super_admin">Super Admin</option>
                </select>
              </div>

              {formData.role === 'artist_admin' && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    担当アーティスト（複数選択可）
                  </label>
                  <div className="max-h-48 overflow-y-auto bg-gray-700 border border-gray-600 rounded-lg p-3 space-y-2">
                    {artists.length === 0 ? (
                      <p className="text-gray-400 text-sm">アーティストが登録されていません</p>
                    ) : (
                      artists.map((artist) => (
                        <label key={artist.id} className="flex items-center space-x-2 cursor-pointer hover:bg-gray-600 p-2 rounded">
                          <input
                            type="checkbox"
                            checked={formData.artist_ids.includes(artist.id)}
                            onChange={(e) => {
                              const newArtistIds = e.target.checked
                                ? [...formData.artist_ids, artist.id]
                                : formData.artist_ids.filter(id => id !== artist.id);
                              setFormData({ ...formData, artist_ids: newArtistIds });
                            }}
                            className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                          />
                          <span className="text-white text-sm">{artist.name}</span>
                        </label>
                      ))
                    )}
                  </div>
                  {formData.artist_ids.length > 0 && (
                    <p className="text-xs text-gray-400 mt-2">
                      選択中: {formData.artist_ids.length}人のアーティスト
                    </p>
                  )}
                </div>
              )}

              {editingAdmin && (
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="mr-2"
                  />
                  <label htmlFor="is_active" className="text-sm text-gray-300">
                    有効
                  </label>
                </div>
              )}

              <div className="flex space-x-4 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg transition"
                >
                  {editingAdmin ? '更新' : '作成'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 rounded-lg transition"
                >
                  キャンセル
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
