'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { getAdminCredentials } from '@/lib/adminStorage';

interface Purchase {
  id: number;
  event_id: number;
  ticket_id: number;
  stripe_customer_id: string;
  customer_email: string;
  customer_name: string;
  amount: number;
  currency: string;
  status: string;
  purchased_at: string;
  event_title?: string;
  ticket_name?: string;
}

export default function PurchasesView() {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchPurchases();
  }, []);

  const fetchPurchases = async () => {
    try {
      setLoading(true);
      const credentials = getAdminCredentials();
      const response = await fetch('/api/admin/purchases', {
        headers: {
          'Authorization': `Basic ${credentials}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch purchases');
      }

      const data = await response.json();
      setPurchases(data);
    } catch (err) {
      setError('購入履歴の取得に失敗しました');
      console.error('Failed to fetch purchases:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-gray-400">読み込み中...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-3 rounded-lg">
        {error}
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white">購入履歴</h2>
        <button
          onClick={fetchPurchases}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition"
        >
          更新
        </button>
      </div>

      {purchases.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          購入履歴がありません
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left py-3 px-4 text-gray-300 font-semibold">ID</th>
                <th className="text-left py-3 px-4 text-gray-300 font-semibold">イベント</th>
                <th className="text-left py-3 px-4 text-gray-300 font-semibold">チケット</th>
                <th className="text-left py-3 px-4 text-gray-300 font-semibold">購入者</th>
                <th className="text-left py-3 px-4 text-gray-300 font-semibold">金額</th>
                <th className="text-left py-3 px-4 text-gray-300 font-semibold">ステータス</th>
                <th className="text-left py-3 px-4 text-gray-300 font-semibold">購入日時</th>
              </tr>
            </thead>
            <tbody>
              {purchases.map((purchase) => (
                <tr key={purchase.id} className="border-b border-gray-700 hover:bg-gray-700/50">
                  <td className="py-3 px-4 text-gray-300">{purchase.id}</td>
                  <td className="py-3 px-4 text-gray-300">{purchase.event_title || '-'}</td>
                  <td className="py-3 px-4 text-gray-300">{purchase.ticket_name || '-'}</td>
                  <td className="py-3 px-4">
                    <div className="text-gray-300">{purchase.customer_name}</div>
                    <div className="text-sm text-gray-500">{purchase.customer_email}</div>
                  </td>
                  <td className="py-3 px-4 text-gray-300">
                    ¥{(purchase.amount / 100).toLocaleString()}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded text-sm ${
                      purchase.status === 'completed'
                        ? 'bg-green-500/20 text-green-400'
                        : purchase.status === 'pending'
                        ? 'bg-yellow-500/20 text-yellow-400'
                        : 'bg-red-500/20 text-red-400'
                    }`}>
                      {purchase.status === 'completed' ? '完了' :
                       purchase.status === 'pending' ? '保留' : '失敗'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-300">
                    {format(new Date(purchase.purchased_at), 'yyyy/MM/dd HH:mm')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
