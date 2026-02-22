'use client';

import { useState, useEffect } from 'react';

interface Event {
  id: number;
  title: string;
  slug: string;
  status: string;
  start_time: string;
  artist_name: string;
}

interface Artist {
  id: number;
  name: string;
}

export default function EventsManager() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);

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
      
      if (!response.ok) {
        throw new Error('Failed to fetch events');
      }
      
      const data = await response.json();
      setEvents(Array.isArray(data) ? data : []);
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
      const credentials = sessionStorage.getItem('admin_credentials');
      const response = await fetch(`/api/admin/events/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Basic ${credentials}`
        }
      });

      if (response.ok) {
        fetchEvents();
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
      const credentials = sessionStorage.getItem('admin_credentials');
      const response = await fetch(`/api/admin/events/${id}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Basic ${credentials}`
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        fetchEvents();
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
          <i className="fas fa-calendar-alt text-purple-500 mr-2"></i>
          イベント管理
        </h2>
        <button
          onClick={() => {
            setEditingEvent(null);
            setShowModal(true);
          }}
          className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-6 rounded-lg transition"
        >
          <i className="fas fa-plus mr-2"></i>
          新規作成
        </button>
      </div>

      <div className="bg-black bg-opacity-40 backdrop-blur-md rounded-xl border border-gray-800 overflow-hidden">
        {events.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700 bg-gray-900">
                  <th className="text-left text-gray-400 py-3 px-4">ID</th>
                  <th className="text-left text-gray-400 py-3 px-4">タイトル</th>
                  <th className="text-left text-gray-400 py-3 px-4">アーティスト</th>
                  <th className="text-left text-gray-400 py-3 px-4">ステータス</th>
                  <th className="text-left text-gray-400 py-3 px-4">開始日時</th>
                  <th className="text-right text-gray-400 py-3 px-4">アクション</th>
                </tr>
              </thead>
              <tbody>
                {events.map((event) => (
                  <tr key={event.id} className="border-b border-gray-800 hover:bg-gray-900">
                    <td className="py-3 px-4 text-gray-400">#{event.id}</td>
                    <td className="py-3 px-4 text-white font-bold">
                      {event.title}
                    </td>
                    <td className="py-3 px-4 text-gray-300">
                      {event.artist_name}
                    </td>
                    <td className="py-3 px-4">
                      <select
                        value={event.status}
                        onChange={(e) => handleStatusUpdate(event.id, e.target.value)}
                        className={`px-3 py-1 rounded-full text-sm font-bold ${
                          event.status === 'live'
                            ? 'bg-red-600 text-white'
                            : event.status === 'upcoming'
                            ? 'bg-blue-600 text-white'
                            : event.status === 'ended'
                            ? 'bg-gray-600 text-white'
                            : 'bg-green-600 text-white'
                        }`}
                      >
                        <option value="upcoming">配信予定</option>
                        <option value="live">配信中</option>
                        <option value="ended">終了</option>
                        <option value="archived">アーカイブ</option>
                      </select>
                    </td>
                    <td className="py-3 px-4 text-gray-400 text-sm">
                      {event.start_time
                        ? new Date(event.start_time).toLocaleString('ja-JP')
                        : '未設定'}
                    </td>
                    <td className="py-3 px-4 text-right space-x-2">
                      <button
                        onClick={() => {
                          setEditingEvent(event);
                          setShowModal(true);
                        }}
                        className="text-blue-400 hover:text-blue-300"
                      >
                        <i className="fas fa-edit"></i>
                      </button>
                      <button
                        onClick={() => handleDelete(event.id)}
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
            <i className="fas fa-calendar-times text-gray-600 text-5xl mb-4"></i>
            <p className="text-gray-400">イベントがありません</p>
          </div>
        )}
      </div>

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
    title: event?.title || '',
    slug: event?.slug || '',
    artist_id: '',
    description: '',
    thumbnail_url: '',
    event_type: 'live',
    stream_url: '',
    archive_url: '',
    start_time: event?.start_time ? new Date(event.start_time).toISOString().slice(0, 16) : '',
    end_time: '',
    status: event?.status || 'upcoming',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchArtists();
  }, []);

  const fetchArtists = async () => {
    try {
      const credentials = sessionStorage.getItem('admin_credentials');
      const response = await fetch('/api/admin/artists', {
        headers: {
          'Authorization': `Basic ${credentials}`
        }
      });
      const data = await response.json();
      setArtists(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to fetch artists:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const credentials = sessionStorage.getItem('admin_credentials');
      const url = event 
        ? `/api/admin/events/${event.id}`
        : '/api/admin/events';
      
      const method = event ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${credentials}`
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        alert(event ? 'イベントを更新しました' : 'イベントを作成しました');
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
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
      // タイトルからslugを自動生成
      ...(name === 'title' && !event ? { slug: value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') } : {})
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-xl max-w-3xl w-full p-6 max-h-[90vh] overflow-y-auto">
        <h3 className="text-2xl font-bold text-white mb-6">
          <i className="fas fa-calendar-alt text-purple-500 mr-2"></i>
          {event ? 'イベント編集' : '新規イベント作成'}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                タイトル <span className="text-red-500">*</span>
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
            </div>
          </div>

          <div>
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
                <option key={artist.id} value={artist.id}>{artist.name}</option>
              ))}
            </select>
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                イベント種別
              </label>
              <select
                name="event_type"
                value={formData.event_type}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="live">ライブ配信</option>
                <option value="archive">アーカイブ</option>
              </select>
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
                <option value="upcoming">配信予定</option>
                <option value="live">配信中</option>
                <option value="ended">終了</option>
                <option value="archived">アーカイブ</option>
              </select>
            </div>
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
              placeholder="https://example.com/image.jpg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              ストリームURL
            </label>
            <input
              type="url"
              name="stream_url"
              value={formData.stream_url}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="https://cloudfront.net/stream.m3u8"
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
              placeholder="https://cloudfront.net/archive.m3u8"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                開始日時 <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local"
                name="start_time"
                value={formData.start_time}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                終了日時
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
