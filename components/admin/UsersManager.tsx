'use client';

import { useState, useEffect } from 'react';

interface User {
  id: number;
  email: string;
  username?: string;
  created_at: string;
  purchase_count: number;
  total_spent: number;
}

interface Purchase {
  id: number;
  purchased_at: string;
  amount: number;
  currency: string;
  status: string;
  event_title?: string;
  event_slug?: string;
  ticket_name?: string;
}

interface UserDetail extends User {
  purchases?: Purchase[];
}

export default function UsersManager() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<UserDetail | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch('/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      } else {
        alert('ユーザーリストの取得に失敗しました');
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
      alert('ユーザーリストの取得エラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetail = async (userId: number) => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`/api/admin/users/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSelectedUser(data);
        setShowModal(true);
      } else {
        alert('ユーザー詳細の取得に失敗しました');
      }
    } catch (error) {
      console.error('Failed to fetch user detail:', error);
      alert('ユーザー詳細の取得エラーが発生しました');
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <i className="fas fa-spinner fa-spin text-4xl text-purple-500 mb-4"></i>
        <p className="text-gray-300">読み込み中...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">
          <i className="fas fa-users text-purple-500 mr-2"></i>
          ユーザー管理
        </h2>
        <div className="text-gray-400 text-sm">
          総ユーザー数: {users.length}人
        </div>
      </div>

      {/* Table View */}
      <div className="bg-black bg-opacity-40 backdrop-blur-md rounded-xl border border-gray-800 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-800 bg-opacity-50">
            <tr className="border-b border-gray-700">
              <th className="text-left py-3 px-4 text-gray-400">ID</th>
              <th className="text-left py-3 px-4 text-gray-400">メールアドレス</th>
              <th className="text-left py-3 px-4 text-gray-400">ユーザー名</th>
              <th className="text-left py-3 px-4 text-gray-400">購入回数</th>
              <th className="text-left py-3 px-4 text-gray-400">総購入金額</th>
              <th className="text-left py-3 px-4 text-gray-400">登録日</th>
              <th className="text-left py-3 px-4 text-gray-400">操作</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-b border-gray-700 hover:bg-gray-700/50">
                <td className="py-3 px-4 text-white">{user.id}</td>
                <td className="py-3 px-4 text-white">{user.email}</td>
                <td className="py-3 px-4 text-white">{user.username || '-'}</td>
                <td className="py-3 px-4 text-white">{user.purchase_count}回</td>
                <td className="py-3 px-4 text-white">
                  ¥{(user.total_spent / 100).toLocaleString()}
                </td>
                <td className="py-3 px-4 text-white">
                  {new Date(user.created_at).toLocaleDateString('ja-JP')}
                </td>
                <td className="py-3 px-4">
                  <button
                    onClick={() => handleViewDetail(user.id)}
                    className="text-blue-400 hover:text-blue-300 transition"
                  >
                    詳細
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {users.length === 0 && (
        <div className="text-center py-12 bg-black bg-opacity-40 backdrop-blur-md rounded-xl border border-gray-800">
          <i className="fas fa-users text-gray-600 text-5xl mb-4"></i>
          <p className="text-gray-400">登録ユーザーがいません</p>
        </div>
      )}

      {/* User Detail Modal */}
      {showModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-white">ユーザー詳細</h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-white"
              >
                <i className="fas fa-times text-xl"></i>
              </button>
            </div>

            {/* User Info */}
            <div className="bg-gray-900 rounded-lg p-4 mb-6 space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-400">ID:</span>
                <span className="text-white">{selectedUser.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">メールアドレス:</span>
                <span className="text-white">{selectedUser.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">ユーザー名:</span>
                <span className="text-white">{selectedUser.username || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">登録日:</span>
                <span className="text-white">
                  {new Date(selectedUser.created_at).toLocaleString('ja-JP')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">総購入回数:</span>
                <span className="text-white">{selectedUser.purchase_count}回</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">総購入金額:</span>
                <span className="text-white font-bold text-purple-400">
                  ¥{(selectedUser.total_spent / 100).toLocaleString()}
                </span>
              </div>
            </div>

            {/* Purchase History */}
            <h4 className="text-lg font-bold text-white mb-3">購入履歴</h4>
            {selectedUser.purchases && selectedUser.purchases.length > 0 ? (
              <div className="space-y-3">
                {selectedUser.purchases.map((purchase) => (
                  <div
                    key={purchase.id}
                    className="bg-gray-900 rounded-lg p-4 border border-gray-700"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <h5 className="text-white font-bold">{purchase.event_title || 'イベント名なし'}</h5>
                        <p className="text-gray-400 text-sm">{purchase.ticket_name || 'チケット名なし'}</p>
                      </div>
                      <span className={`px-2 py-1 text-xs rounded ${
                        purchase.status === 'completed' 
                          ? 'bg-green-600 text-white' 
                          : 'bg-gray-600 text-gray-300'
                      }`}>
                        {purchase.status === 'completed' ? '完了' : purchase.status}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-400">
                        {new Date(purchase.purchased_at).toLocaleString('ja-JP')}
                      </span>
                      <span className="text-purple-400 font-bold">
                        ¥{(purchase.amount / 100).toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 bg-gray-900 rounded-lg">
                <i className="fas fa-shopping-cart text-gray-600 text-3xl mb-2"></i>
                <p className="text-gray-400">購入履歴がありません</p>
              </div>
            )}

            <div className="mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="w-full bg-gray-600 hover:bg-gray-700 text-white py-2 rounded-lg transition"
              >
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
