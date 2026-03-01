'use client';

import { useState, useEffect } from 'react';

interface Event {
  id: number;
  artist_id: number;
  title: string;
  slug: string;
  description?: string;
  thumbnail_url?: string;
  stream_url?: string;
  archive_url?: string;
  status: string;
  start_time?: string;
  end_time?: string;
  artist_name: string;
  created_at: string;
}

interface Artist {
  id: number;
  name: string;
}

type SortField = 'title' | 'artist_name' | 'status' | 'start_time';
type SortOrder = 'asc' | 'desc';

interface EventsManagerProps {
  artistId?: number; // 後方互換性（非推奨）
  artistIds?: number[]; // 新: 複数アーティストID
}

export default function EventsManager({ artistId, artistIds }: EventsManagerProps) {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [selectedEvents, setSelectedEvents] = useState<Set<number>>(new Set());
  const [bulkStatus, setBulkStatus] = useState('');
  const [sortField, setSortField] = useState<SortField>('start_time');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch('/api/admin/events', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch events');
      }
      
      const data = await response.json();
      let eventsData = Array.isArray(data) ? data : [];
      
      // Artist Adminの場合、担当アーティストのイベントのみフィルタ
      const targetArtistIds = artistIds || (artistId ? [artistId] : null);
      if (targetArtistIds && targetArtistIds.length > 0) {
        eventsData = eventsData.filter(event => targetArtistIds.includes(event.artist_id));
      }
      
      setEvents(eventsData);
    } catch (error) {
      console.error('Failed to fetch events:', error);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('このイベントを削除してもよろしいですか？')) return;

    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`/api/admin/events/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        fetchEvents();
        alert('イベントを削除しました');
      } else {
        alert('削除に失敗しました');
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('削除に失敗しました');
    }
  };

  const handleStatusUpdate = async (id: number, newStatus: string) => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`/api/admin/events/${id}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        fetchEvents();
        alert('ステータスを更新しました');
      } else {
        const error = await response.json();
        alert(`更新に失敗しました: ${error.message || ''}`);
      }
    } catch (error) {
      console.error('Update error:', error);
      alert('更新に失敗しました');
    }
  };

  // 一括選択/解除
  const handleSelectAll = () => {
    if (selectedEvents.size === sortedEvents.length) {
      setSelectedEvents(new Set());
    } else {
      setSelectedEvents(new Set(sortedEvents.map(e => e.id)));
    }
  };

  const handleSelectEvent = (id: number) => {
    const newSelected = new Set(selectedEvents);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedEvents(newSelected);
  };

  // 一括削除
  const handleBulkDelete = async () => {
    if (selectedEvents.size === 0) {
      alert('削除するイベントを選択してください');
      return;
    }

    if (!confirm(`選択した${selectedEvents.size}件のイベントを削除してもよろしいですか？`)) {
      return;
    }

    try {
      const token = localStorage.getItem('admin_token');
      const deletePromises = Array.from(selectedEvents).map(id =>
        fetch(`/api/admin/events/${id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
      );

      await Promise.all(deletePromises);
      setSelectedEvents(new Set());
      fetchEvents();
      alert('選択したイベントを削除しました');
    } catch (error) {
      console.error('Bulk delete error:', error);
      alert('一部のイベントの削除に失敗しました');
    }
  };

  // 一括ステータス変更
  const handleBulkStatusUpdate = async () => {
    if (selectedEvents.size === 0) {
      alert('ステータスを変更するイベントを選択してください');
      return;
    }

    if (!bulkStatus) {
      alert('変更後のステータスを選択してください');
      return;
    }

    try {
      const token = localStorage.getItem('admin_token');
      const updatePromises = Array.from(selectedEvents).map(id =>
        fetch(`/api/admin/events/${id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ status: bulkStatus })
        })
      );

      await Promise.all(updatePromises);
      setSelectedEvents(new Set());
      setBulkStatus('');
      fetchEvents();
      alert(`選択した${selectedEvents.size}件のイベントのステータスを更新しました`);
    } catch (error) {
      console.error('Bulk status update error:', error);
      alert('一部のイベントのステータス更新に失敗しました');
    }
  };

  // ソート機能
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const sortedEvents = [...events].sort((a, b) => {
    let aValue: any = a[sortField];
    let bValue: any = b[sortField];

    // Handle null/undefined values
    if (aValue === null || aValue === undefined) aValue = '';
    if (bValue === null || bValue === undefined) bValue = '';

    // Convert to string for comparison
    aValue = String(aValue).toLowerCase();
    bValue = String(bValue).toLowerCase();

    if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <i className="fas fa-sort text-gray-600 ml-1"></i>;
    }
    return sortOrder === 'asc' 
      ? <i className="fas fa-sort-up text-purple-400 ml-1"></i>
      : <i className="fas fa-sort-down text-purple-400 ml-1"></i>;
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; color: string }> = {
      upcoming: { label: '配信予定', color: 'bg-blue-500/20 text-blue-300 border border-blue-500/30' },
      live: { label: '配信中', color: 'bg-red-500/20 text-red-300 border border-red-500/30' },
      archived: { label: 'アーカイブ', color: 'bg-green-500/20 text-green-300 border border-green-500/30' },
      draft: { label: '下書き', color: 'bg-gray-500/20 text-gray-300 border border-gray-500/30' },
    };
    
    const config = statusConfig[status] || { label: status, color: 'bg-gray-500/20 text-gray-300 border border-gray-500/30' };
    return (
      <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-white">
          <i className="fas fa-calendar-alt text-purple-500 mr-2"></i>
          イベント管理
        </h2>
        <button 
          onClick={() => {
            setEditingEvent(null);
            setShowModal(true);
          }}
          className="w-full sm:w-auto bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-6 rounded-lg transition"
        >
          <i className="fas fa-plus mr-2"></i>
          新規作成
        </button>
      </div>

      {/* 一括操作バー */}
      {selectedEvents.size > 0 && (
        <div className="bg-purple-900/30 backdrop-blur-md rounded-lg border border-purple-500/30 p-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <span className="text-white font-medium">
              {selectedEvents.size}件選択中
            </span>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <select
                value={bulkStatus}
                onChange={(e) => setBulkStatus(e.target.value)}
                className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:ring-2 focus:ring-purple-500"
              >
                <option value="">ステータス変更...</option>
                <option value="draft">下書き</option>
                <option value="upcoming">配信予定</option>
                <option value="live">配信中</option>
                <option value="archived">アーカイブ</option>
              </select>
              <button
                onClick={handleBulkStatusUpdate}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition text-sm font-medium"
              >
                <i className="fas fa-sync-alt mr-2"></i>
                ステータス変更
              </button>
              <button
                onClick={handleBulkDelete}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition text-sm font-medium"
              >
                <i className="fas fa-trash mr-2"></i>
                一括削除
              </button>
            </div>
          </div>
        </div>
      )}

      {/* テーブル表示（デスクトップ） */}
      <div className="hidden lg:block bg-black bg-opacity-40 backdrop-blur-md rounded-xl border border-gray-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-900/50">
              <tr className="text-left text-gray-300 text-sm">
                <th className="p-4 w-12">
                  <input
                    type="checkbox"
                    checked={selectedEvents.size === sortedEvents.length && sortedEvents.length > 0}
                    onChange={handleSelectAll}
                    className="w-4 h-4 rounded border-gray-600 text-purple-600 focus:ring-purple-500"
                  />
                </th>
                <th className="p-4 cursor-pointer hover:bg-white/5 transition" onClick={() => handleSort('title')}>
                  <div className="flex items-center">
                    タイトル
                    {getSortIcon('title')}
                  </div>
                </th>
                <th className="p-4 cursor-pointer hover:bg-white/5 transition" onClick={() => handleSort('artist_name')}>
                  <div className="flex items-center">
                    アーティスト
                    {getSortIcon('artist_name')}
                  </div>
                </th>
                <th className="p-4 cursor-pointer hover:bg-white/5 transition" onClick={() => handleSort('status')}>
                  <div className="flex items-center">
                    ステータス
                    {getSortIcon('status')}
                  </div>
                </th>
                <th className="p-4 cursor-pointer hover:bg-white/5 transition" onClick={() => handleSort('start_time')}>
                  <div className="flex items-center">
                    配信開始
                    {getSortIcon('start_time')}
                  </div>
                </th>
                <th className="p-4 text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {sortedEvents.map((event) => (
                <tr key={event.id} className="hover:bg-white/5 transition">
                  <td className="p-4">
                    <input
                      type="checkbox"
                      checked={selectedEvents.has(event.id)}
                      onChange={() => handleSelectEvent(event.id)}
                      className="w-4 h-4 rounded border-gray-600 text-purple-600 focus:ring-purple-500"
                    />
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      {event.thumbnail_url && (
                        <img
                          src={event.thumbnail_url}
                          alt={event.title}
                          className="w-16 h-10 object-cover rounded"
                        />
                      )}
                      <div className="min-w-0">
                        <div className="text-white font-medium truncate">{event.title}</div>
                        <div className="text-gray-400 text-xs truncate">@{event.slug}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="text-gray-300 whitespace-nowrap">{event.artist_name}</span>
                  </td>
                  <td className="p-4">
                    {getStatusBadge(event.status)}
                  </td>
                  <td className="p-4">
                    <span className="text-gray-300 text-sm whitespace-nowrap">{formatDate(event.start_time)}</span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-end gap-2">
                      <select
                        value={event.status}
                        onChange={(e) => handleStatusUpdate(event.id, e.target.value)}
                        className="px-3 py-1 bg-gray-800 border border-gray-700 rounded text-white text-sm focus:ring-2 focus:ring-purple-500 whitespace-nowrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <option value="draft">下書き</option>
                        <option value="upcoming">配信予定</option>
                        <option value="live">配信中</option>
                        <option value="archived">アーカイブ</option>
                      </select>
                      <button
                        onClick={() => {
                          setEditingEvent(event);
                          setShowModal(true);
                        }}
                        className="p-2 text-blue-400 hover:text-blue-300 hover:bg-blue-400/10 rounded transition"
                        title="編集"
                      >
                        <i className="fas fa-edit"></i>
                      </button>
                      <button
                        onClick={() => handleDelete(event.id)}
                        className="p-2 text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded transition"
                        title="削除"
                      >
                        <i className="fas fa-trash"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* カード表示（モバイル・タブレット） */}
      <div className="lg:hidden space-y-4">
        {sortedEvents.map((event) => (
          <div
            key={event.id}
            className="bg-black bg-opacity-40 backdrop-blur-md rounded-xl border border-gray-800 p-4"
          >
            <div className="flex items-start gap-3 mb-3">
              <input
                type="checkbox"
                checked={selectedEvents.has(event.id)}
                onChange={() => handleSelectEvent(event.id)}
                className="mt-1 w-4 h-4 rounded border-gray-600 text-purple-600 focus:ring-purple-500"
              />
              {event.thumbnail_url && (
                <img
                  src={event.thumbnail_url}
                  alt={event.title}
                  className="w-20 h-12 object-cover rounded"
                />
              )}
              <div className="flex-1 min-w-0">
                <h3 className="text-white font-medium truncate">{event.title}</h3>
                <p className="text-gray-400 text-sm truncate">@{event.slug}</p>
              </div>
            </div>
            
            <div className="space-y-2 mb-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">アーティスト:</span>
                <span className="text-gray-300">{event.artist_name}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">ステータス:</span>
                {getStatusBadge(event.status)}
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">配信開始:</span>
                <span className="text-gray-300">{formatDate(event.start_time)}</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <select
                value={event.status}
                onChange={(e) => handleStatusUpdate(event.id, e.target.value)}
                className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:ring-2 focus:ring-purple-500"
              >
                <option value="draft">下書き</option>
                <option value="upcoming">配信予定</option>
                <option value="live">配信中</option>
                <option value="archived">アーカイブ</option>
              </select>
              <button
                onClick={() => {
                  setEditingEvent(event);
                  setShowModal(true);
                }}
                className="px-4 py-2 text-blue-400 hover:text-blue-300 hover:bg-blue-400/10 rounded-lg transition"
              >
                <i className="fas fa-edit"></i>
              </button>
              <button
                onClick={() => handleDelete(event.id)}
                className="px-4 py-2 text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded-lg transition"
              >
                <i className="fas fa-trash"></i>
              </button>
            </div>
          </div>
        ))}
      </div>

      {events.length === 0 && (
        <div className="text-center py-12 bg-black bg-opacity-40 backdrop-blur-md rounded-xl border border-gray-800">
          <i className="fas fa-calendar-alt text-gray-600 text-5xl mb-4"></i>
          <p className="text-gray-400">イベントがありません</p>
        </div>
      )}

      {showModal && (
        <EventFormModal
          event={editingEvent}
          onClose={() => {
            setShowModal(false);
            setEditingEvent(null);
          }}
          onSuccess={() => {
            setShowModal(false);
            setEditingEvent(null);
            fetchEvents();
          }}
        />
      )}
    </div>
  );
}

function EventFormModal({
  event,
  onClose,
  onSuccess,
}: {
  event: Event | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [artists, setArtists] = useState<Artist[]>([]);
  const [formData, setFormData] = useState({
    artist_id: event?.artist_id || '',
    title: event?.title || '',
    slug: event?.slug || '',
    description: event?.description || '',
    thumbnail_url: event?.thumbnail_url || '',
    stream_url: event?.stream_url || '',
    archive_url: event?.archive_url || '',
    status: event?.status || 'draft',
    start_time: event?.start_time ? event.start_time.slice(0, 16) : '',
    end_time: event?.end_time ? event.end_time.slice(0, 16) : '',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchArtists();
  }, []);

  const fetchArtists = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch('/api/admin/artists', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setArtists(data);
      }
    } catch (error) {
      console.error('Failed to fetch artists:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('admin_token');
      const url = event 
        ? `/api/admin/events/${event.id}`
        : '/api/admin/events';
      
      const method = event ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          artist_id: parseInt(formData.artist_id as any),
          start_time: formData.start_time || null,
          end_time: formData.end_time || null,
        }),
      });

      if (response.ok) {
        alert(event ? 'イベントを更新しました' : 'イベントを作成しました');
        onSuccess();
      } else {
        const error = await response.json();
        console.error('API Error Response:', {
          status: response.status,
          statusText: response.statusText,
          error: error
        });
        alert(`エラー (${response.status}): ${error.error || error.message || '保存に失敗しました'}\n\n詳細: ${error.details || 'なし'}`);
      }
    } catch (error) {
      console.error('Submit error:', error);
      alert(`保存に失敗しました\n\nエラー: ${error instanceof Error ? error.message : '不明なエラー'}\n\nブラウザコンソール（F12）で詳細を確認してください。`);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
      // タイトルからslugを自動生成
      ...(name === 'title' && !event ? { 
        slug: value.toLowerCase()
          .replace(/\s+/g, '-')
          .replace(/[^a-z0-9-]/g, '')
          .substring(0, 50)
      } : {})
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-gray-900 rounded-xl max-w-3xl w-full p-6 my-8 max-h-[90vh] overflow-y-auto">
        <h3 className="text-2xl font-bold text-white mb-6">
          <i className="fas fa-calendar-alt text-purple-500 mr-2"></i>
          {event ? 'イベント編集' : '新規イベント作成'}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                アーティスト <span className="text-red-500">*</span>
              </label>
              <select
                name="artist_id"
                value={formData.artist_id}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="">アーティストを選択</option>
                {artists.map(artist => (
                  <option key={artist.id} value={artist.id}>
                    {artist.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                イベントタイトル <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="イベント名を入力"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                スラッグ <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="slug"
                value={formData.slug}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="event-slug"
              />
              <p className="text-gray-500 text-xs mt-1">
                URL用の識別子（例: live-2024）
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                ステータス
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="draft">下書き</option>
                <option value="upcoming">配信予定</option>
                <option value="live">配信中</option>
                <option value="archived">アーカイブ</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                配信開始時刻
              </label>
              <input
                type="datetime-local"
                name="start_time"
                value={formData.start_time}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                配信終了時刻
              </label>
              <input
                type="datetime-local"
                name="end_time"
                value={formData.end_time}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
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
              placeholder="イベントの説明を入力"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              サムネイルURL
            </label>
            <input
              type="url"
              name="thumbnail_url"
              value={formData.thumbnail_url}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="https://example.com/thumbnail.jpg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              配信URL
            </label>
            <input
              type="url"
              name="stream_url"
              value={formData.stream_url}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="https://stream.example.com/live"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              アーカイブURL
            </label>
            <input
              type="url"
              name="archive_url"
              value={formData.archive_url}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="https://archive.example.com/video"
            />
          </div>

          <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <i className="fas fa-spinner fa-spin mr-2"></i>
                  保存中...
                </>
              ) : (
                <>
                  <i className="fas fa-save mr-2"></i>
                  {event ? '更新' : '作成'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
