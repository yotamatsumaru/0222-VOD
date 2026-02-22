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
  event_id: number;
}

interface Event {
  id: number;
  title: string;
}

export default function TicketsManager() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTicket, setEditingTicket] = useState<Ticket | null>(null);

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      const credentials = sessionStorage.getItem('admin_credentials');
      const response = await fetch('/api/admin/tickets', {
        headers: {
          'Authorization': `Basic ${credentials}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch tickets');
      }
      
      const data = await response.json();
      setTickets(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to fetch tickets:', error);
      setTickets([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('このチケットを削除してもよろしいですか？')) return;

    try {
      const credentials = sessionStorage.getItem('admin_credentials');
      const response = await fetch(`/api/admin/tickets/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Basic ${credentials}`
        }
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
      const credentials = sessionStorage.getItem('admin_credentials');
      const response = await fetch(`/api/admin/tickets/${id}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Basic ${credentials}`
        },
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
        <button 
          onClick={() => {
            setEditingTicket(null);
            setShowModal(true);
          }}
          className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-6 rounded-lg transition"
        >
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
                  <th className="text-left text-gray-400 py-3 px-4">ID</th>
                  <th className="text-left text-gray-400 py-3 px-4">チケット名</th>
                  <th className="text-left text-gray-400 py-3 px-4">イベント</th>
                  <th className="text-left text-gray-400 py-3 px-4">価格</th>
                  <th className="text-left text-gray-400 py-3 px-4">在庫</th>
                  <th className="text-left text-gray-400 py-3 px-4">販売数</th>
                  <th className="text-left text-gray-400 py-3 px-4">状態</th>
                  <th className="text-right text-gray-400 py-3 px-4">アクション</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map((ticket) => (
                  <tr key={ticket.id} className="border-b border-gray-800 hover:bg-gray-900">
                    <td className="py-3 px-4 text-gray-400">#{ticket.id}</td>
                    <td className="py-3 px-4 text-white font-bold">{ticket.name}</td>
                    <td className="py-3 px-4 text-gray-300">{ticket.event_title}</td>
                    <td className="py-3 px-4 text-gray-300">
                      ¥{(ticket.price / 100).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-gray-300">
                      {ticket.stock !== null ? ticket.stock : '無制限'}
                    </td>
                    <td className="py-3 px-4 text-gray-300">{ticket.sold}</td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => toggleActive(ticket.id, ticket.is_active)}
                        className={`px-3 py-1 rounded-full text-xs font-bold ${
                          ticket.is_active
                            ? 'bg-green-600 text-white'
                            : 'bg-gray-600 text-white'
                        }`}
                      >
                        {ticket.is_active ? '販売中' : '停止中'}
                      </button>
                    </td>
                    <td className="py-3 px-4 text-right space-x-2">
                      <button
                        onClick={() => {
                          setEditingTicket(ticket);
                          setShowModal(true);
                        }}
                        className="text-blue-400 hover:text-blue-300"
                      >
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

      {showModal && (
        <TicketFormModal
          ticket={editingTicket}
          onClose={() => {
            setShowModal(false);
            setEditingTicket(null);
          }}
          onSuccess={() => {
            setShowModal(false);
            setEditingTicket(null);
            fetchTickets();
          }}
        />
      )}
    </div>
  );
}

function TicketFormModal({
  ticket,
  onClose,
  onSuccess,
}: {
  ticket: Ticket | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [events, setEvents] = useState<Event[]>([]);
  const [formData, setFormData] = useState({
    event_id: ticket?.event_id?.toString() || '',
    name: ticket?.name || '',
    description: '',
    price: ticket ? (ticket.price / 100).toString() : '',
    currency: ticket?.currency || 'jpy',
    stock: ticket?.stock?.toString() || '',
    sale_start: '',
    sale_end: '',
    is_active: ticket?.is_active ?? true,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const credentials = sessionStorage.getItem('admin_credentials');
      const response = await fetch('/api/admin/events', {
        headers: {
          'Authorization': `Basic ${credentials}`
        }
      });
      const data = await response.json();
      setEvents(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to fetch events:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const credentials = sessionStorage.getItem('admin_credentials');
      const url = ticket 
        ? `/api/admin/tickets/${ticket.id}`
        : '/api/admin/tickets';
      
      const method = ticket ? 'PATCH' : 'POST';

      // 価格を円から銭に変換
      const priceInCents = Math.round(parseFloat(formData.price) * 100);

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${credentials}`
        },
        body: JSON.stringify({
          ...formData,
          event_id: parseInt(formData.event_id),
          price: priceInCents,
          stock: formData.stock ? parseInt(formData.stock) : null,
        }),
      });

      if (response.ok) {
        alert(ticket ? 'チケットを更新しました' : 'チケットを作成しました');
        onSuccess();
      } else {
        const error = await response.json();
        alert(`エラー: ${error.message || '保存に失敗しました'}`);
      }
    } catch (error) {
      console.error('Submit error:', error);
      alert('保存に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
        <h3 className="text-2xl font-bold text-white mb-6">
          <i className="fas fa-ticket-alt text-purple-500 mr-2"></i>
          {ticket ? 'チケット編集' : '新規チケット作成'}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              イベント <span className="text-red-500">*</span>
            </label>
            <select
              name="event_id"
              value={formData.event_id}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="">イベントを選択</option>
              {events.map(event => (
                <option key={event.id} value={event.id}>{event.title}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              チケット名 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="一般チケット"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              説明
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="チケットの説明を入力"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                価格（円） <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleChange}
                required
                min="0"
                step="1"
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="3000"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                在庫数
              </label>
              <input
                type="number"
                name="stock"
                value={formData.stock}
                onChange={handleChange}
                min="0"
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="空欄で無制限"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                販売開始日時
              </label>
              <input
                type="datetime-local"
                name="sale_start"
                value={formData.sale_start}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                販売終了日時
              </label>
              <input
                type="datetime-local"
                name="sale_end"
                value={formData.sale_end}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              name="is_active"
              id="is_active"
              checked={formData.is_active}
              onChange={handleChange}
              className="w-4 h-4 text-purple-600 bg-gray-800 border-gray-700 rounded focus:ring-purple-500"
            />
            <label htmlFor="is_active" className="ml-2 text-sm text-gray-300">
              販売を有効にする
            </label>
          </div>

          <div className="flex justify-end space-x-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <i className="fas fa-spinner fa-spin mr-2"></i>
                  保存中...
                </>
              ) : (
                <>
                  <i className="fas fa-save mr-2"></i>
                  {ticket ? '更新' : '作成'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
