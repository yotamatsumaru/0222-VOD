'use client';

import { useState, useEffect } from 'react';
import { getAdminCredentials } from '@/lib/adminStorage';

interface Artist {
  id: number;
  name: string;
  slug: string;
  bio?: string;
  image_url?: string;
}

export default function ArtistsManager() {
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingArtist, setEditingArtist] = useState<Artist | null>(null);

  useEffect(() => {
    fetchArtists();
  }, []);

  const fetchArtists = async () => {
    try {
      const credentials = getAdminCredentials();
      const response = await fetch('/api/admin/artists', {
        headers: {
          'Authorization': `Basic ${credentials}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch artists');
      }
      
      const data = await response.json();
      setArtists(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to fetch artists:', error);
      setArtists([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('このアーティストを削除してもよろしいですか？')) return;

    try {
      const credentials = getAdminCredentials();
      const response = await fetch(`/api/admin/artists/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Basic ${credentials}`
        }
      });

      if (response.ok) {
        fetchArtists();
      } else {
        alert('削除に失敗しました');
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('削除に失敗しました');
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
          アーティスト管理
        </h2>
        <button 
          onClick={() => {
            setEditingArtist(null);
            setShowModal(true);
          }}
          className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-6 rounded-lg transition"
        >
          <i className="fas fa-plus mr-2"></i>
          新規作成
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {artists.map((artist) => (
          <div
            key={artist.id}
            className="bg-black bg-opacity-40 backdrop-blur-md rounded-xl border border-gray-800 p-6"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-xl font-bold text-white mb-1">
                  {artist.name}
                </h3>
                <p className="text-gray-400 text-sm">@{artist.slug}</p>
              </div>
              <div className="flex space-x-2">
                <button 
                  onClick={() => {
                    setEditingArtist(artist);
                    setShowModal(true);
                  }}
                  className="text-blue-400 hover:text-blue-300"
                >
                  <i className="fas fa-edit"></i>
                </button>
                <button
                  onClick={() => handleDelete(artist.id)}
                  className="text-red-400 hover:text-red-300"
                >
                  <i className="fas fa-trash"></i>
                </button>
              </div>
            </div>
            {artist.image_url && (
              <img 
                src={artist.image_url} 
                alt={artist.name}
                className="w-full h-48 object-cover rounded-lg mb-4"
              />
            )}
            {artist.bio && (
              <p className="text-gray-300 text-sm line-clamp-3">{artist.bio}</p>
            )}
          </div>
        ))}
      </div>

      {artists.length === 0 && (
        <div className="text-center py-12 bg-black bg-opacity-40 backdrop-blur-md rounded-xl border border-gray-800">
          <i className="fas fa-users text-gray-600 text-5xl mb-4"></i>
          <p className="text-gray-400">アーティストがいません</p>
        </div>
      )}

      {showModal && (
        <ArtistFormModal
          artist={editingArtist}
          onClose={() => {
            setShowModal(false);
            setEditingArtist(null);
          }}
          onSuccess={() => {
            setShowModal(false);
            setEditingArtist(null);
            fetchArtists();
          }}
        />
      )}
    </div>
  );
}

function ArtistFormModal({
  artist,
  onClose,
  onSuccess,
}: {
  artist: Artist | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({
    name: artist?.name || '',
    slug: artist?.slug || '',
    bio: artist?.bio || '',
    image_url: artist?.image_url || '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const credentials = getAdminCredentials();
      const url = artist 
        ? `/api/admin/artists/${artist.id}`
        : '/api/admin/artists';
      
      const method = artist ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${credentials}`
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        alert(artist ? 'アーティストを更新しました' : 'アーティストを作成しました');
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
      // 名前からslugを自動生成
      ...(name === 'name' && !artist ? { slug: value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') } : {})
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
        <h3 className="text-2xl font-bold text-white mb-6">
          <i className="fas fa-users text-purple-500 mr-2"></i>
          {artist ? 'アーティスト編集' : '新規アーティスト作成'}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              アーティスト名 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="アーティスト名を入力"
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
              placeholder="artist-slug"
            />
            <p className="text-gray-500 text-xs mt-1">
              URL用の識別子（例: reirie）
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              プロフィール
            </label>
            <textarea
              name="bio"
              value={formData.bio}
              onChange={handleChange}
              rows={4}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="アーティストのプロフィールを入力"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              画像URL
            </label>
            <input
              type="url"
              name="image_url"
              value={formData.image_url}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="https://example.com/image.jpg"
            />
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
                  {artist ? '更新' : '作成'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
