'use client';

import { useState, useEffect } from 'react';

interface Ticket {
  id: number;
  name: string;
  price: number;
  currency: string;
  stock: number | null;
  sold: number;
  is_active: boolean;
  event_title: string;
}

export default function TicketsManager() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      const response = await fetch('/api/admin/tickets');
      const data = await response.json();
      setTickets(data);
    } catch (error) {
      console.error('Failed to fetch tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('このチケットを削除してもよろしいですか？')) return;

    try {
      const response = await fetch(`/api/admin/tickets/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchTickets();
      } else {
        alert('削除に失敗しました');
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('削除に失敗しました');
    }
  };

  const toggleActive = async (id: number, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/admin/tickets/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentStatus }),
      });

      if (response.ok) {
        fetchTickets();
      } else {
        alert('更新に失敗しました');
      }
    } catch (error) {
      console.error('Update error:', error);
      alert('更新に失敗しました');
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
          <i className="fas fa-ticket-alt text-purple-500 mr-2"></i>
          チケット管理
        </h2>
        <button className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-6 rounded-lg transition">
          <i className="fas fa-plus mr-2"></i>
          新規作成
        </button>
      </div>

      <div className="bg-black bg-opacity-40 backdrop-blur-md rounded-xl border border-gray-800 overflow-hidden">
        {tickets.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700 bg-gray-900">
                  <th className="text-left text-gray-400 py-3 px-4">イベント</th>
                  <th className="text-left text-gray-400 py-3 px-4">チケット名</th>
                  <th className="text-right text-gray-400 py-3 px-4">価格</th>
                  <th className="text-center text-gray-400 py-3 px-4">在庫</th>
                  <th className="text-center text-gray-400 py-3 px-4">販売数</th>
                  <th className="text-center text-gray-400 py-3 px-4">ステータス</th>
                  <th className="text-right text-gray-400 py-3 px-4">アクション</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map((ticket) => (
                  <tr key={ticket.id} className="border-b border-gray-800 hover:bg-gray-900">
                    <td className="py-3 px-4 text-white">
                      {ticket.event_title}
                    </td>
                    <td className="py-3 px-4 text-gray-300">
                      {ticket.name}
                    </td>
                    <td className="py-3 px-4 text-right text-white font-bold">
                      ¥{ticket.price.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-center text-gray-400">
                      {ticket.stock !== null ? ticket.stock : '無制限'}
                    </td>
                    <td className="py-3 px-4 text-center text-gray-400">
                      {ticket.sold}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => toggleActive(ticket.id, ticket.is_active)}
                        className={`px-3 py-1 rounded-full text-sm font-bold ${
                          ticket.is_active
                            ? 'bg-green-600 text-white'
                            : 'bg-gray-600 text-gray-300'
                        }`}
                      >
                        {ticket.is_active ? '有効' : '無効'}
                      </button>
                    </td>
                    <td className="py-3 px-4 text-right space-x-2">
                      <button className="text-blue-400 hover:text-blue-300">
                        <i className="fas fa-edit"></i>
                      </button>
                      <button
                        onClick={() => handleDelete(ticket.id)}
                        className="text-red-400 hover:text-red-300"
                      >
                        <i className="fas fa-trash"></i>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <i className="fas fa-ticket-alt text-gray-600 text-5xl mb-4"></i>
            <p className="text-gray-400">チケットがありません</p>
          </div>
        )}
      </div>
    </div>
  );
}
