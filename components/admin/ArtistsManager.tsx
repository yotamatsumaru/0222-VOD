'use client';

import { useState, useEffect } from 'react';

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

  useEffect(() => {
    fetchArtists();
  }, []);

  const fetchArtists = async () => {
    try {
      const response = await fetch('/api/admin/artists');
      const data = await response.json();
      setArtists(data);
    } catch (error) {
      console.error('Failed to fetch artists:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('このアーティストを削除してもよろしいですか？')) return;

    try {
      const response = await fetch(`/api/admin/artists/${id}`, {
        method: 'DELETE',
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
        <button className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-6 rounded-lg transition">
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
                <button className="text-blue-400 hover:text-blue-300">
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
    </div>
  );
}
