'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Purchase {
  id: number;
  event_id: number;
  event_title: string;
  event_slug: string;
  ticket_name: string;
  amount: number;
  currency: string;
  status: string;
  purchased_at: string;
  access_token: string | null;
  token_expires_at: string | null;
}

export default function MyPage() {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userName, setUserName] = useState('');
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      router.push('/login?redirect=/mypage');
      return;
    }

    // Fetch user info
    fetch('/api/auth/me', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    })
      .then(res => res.json())
      .then(data => {
        if (data.user) {
          setUserName(data.user.name || data.user.email);
        }
      })
      .catch(err => console.error('Failed to fetch user:', err));

    // Fetch user purchases
    fetch('/api/purchases/my', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    })
      .then(res => {
        if (!res.ok) {
          throw new Error('Failed to fetch purchases');
        }
        return res.json();
      })
      .then(data => {
        setPurchases(data.purchases || []);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error:', err);
        setError('購入履歴の取得に失敗しました');
        setLoading(false);
      });
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    router.push('/');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatPrice = (amount: number, currency: string) => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount / 100);
  };

  const isTokenValid = (expiresAt: string | null) => {
    if (!expiresAt) return false;
    return new Date(expiresAt) > new Date();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white text-xl">読み込み中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">マイページ</h1>
              <p className="text-white/70">
                ようこそ、{userName || 'ゲスト'}さん
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="px-6 py-3 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-all"
            >
              ログアウト
            </button>
          </div>
        </div>

        {/* Purchases List */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8">
          <h2 className="text-2xl font-bold text-white mb-6">購入履歴</h2>

          {error && (
            <div className="bg-red-500/20 border border-red-500/50 text-white rounded-lg p-4 mb-6">
              {error}
            </div>
          )}

          {purchases.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-white/70 text-lg mb-6">
                購入履歴がありません
              </p>
              <Link
                href="/events"
                className="inline-block px-8 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-all"
              >
                イベントを探す
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {purchases.map((purchase) => (
                <div
                  key={purchase.id}
                  className="bg-white/5 border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-all"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-white mb-2">
                        {purchase.event_title}
                      </h3>
                      <p className="text-white/70 mb-1">
                        チケット: {purchase.ticket_name}
                      </p>
                      <p className="text-white/70 text-sm">
                        購入日時: {formatDate(purchase.purchased_at)}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-white mb-2">
                        {formatPrice(purchase.amount, purchase.currency)}
                      </div>
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-sm ${
                          purchase.status === 'completed'
                            ? 'bg-green-500/20 text-green-300'
                            : purchase.status === 'refunded'
                            ? 'bg-red-500/20 text-red-300'
                            : 'bg-yellow-500/20 text-yellow-300'
                        }`}
                      >
                        {purchase.status === 'completed'
                          ? '購入済み'
                          : purchase.status === 'refunded'
                          ? '返金済み'
                          : '処理中'}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <Link
                      href={`/events/${purchase.event_slug}`}
                      className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all"
                    >
                      イベント詳細
                    </Link>
                    {purchase.access_token &&
                      isTokenValid(purchase.token_expires_at) &&
                      purchase.status === 'completed' && (
                        <Link
                          href={`/watch/${purchase.event_slug}?token=${purchase.access_token}`}
                          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-all"
                        >
                          視聴する
                        </Link>
                      )}
                    {purchase.token_expires_at &&
                      !isTokenValid(purchase.token_expires_at) && (
                        <span className="px-4 py-2 bg-gray-500/20 text-gray-400 rounded-lg">
                          視聴期限切れ
                        </span>
                      )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
