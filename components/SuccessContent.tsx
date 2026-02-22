'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

interface PurchaseData {
  eventTitle: string;
  eventSlug: string;
  ticketName: string;
  amount: number;
  currency: string;
  accessToken: string;
  customerEmail: string;
}

export default function SuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  
  const [loading, setLoading] = useState(true);
  const [purchase, setPurchase] = useState<PurchaseData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId) {
      setError('セッションIDが見つかりません');
      setLoading(false);
      return;
    }

    // Fetch purchase details
    const fetchPurchase = async () => {
      try {
        const response = await fetch(`/api/purchases/${sessionId}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch purchase details');
        }

        setPurchase(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPurchase();
  }, [sessionId]);

  if (loading) {
    return (
      <div className="text-center text-gray-400 py-8">
        <i className="fas fa-spinner fa-spin text-4xl mb-2"></i>
        <p>購入情報を確認中...</p>
      </div>
    );
  }

  if (error || !purchase) {
    return (
      <div className="bg-red-900 bg-opacity-20 border border-red-800 rounded-xl p-8 text-center">
        <i className="fas fa-exclamation-circle text-red-500 text-5xl mb-4"></i>
        <h2 className="text-2xl font-bold text-white mb-4">
          エラーが発生しました
        </h2>
        <p className="text-red-400 mb-6">{error || '購入情報が見つかりません'}</p>
        <Link
          href="/"
          className="inline-block bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-8 rounded-lg transition"
        >
          ホームに戻る
        </Link>
      </div>
    );
  }

  const watchUrl = `/watch/${purchase.eventSlug}?token=${purchase.accessToken}`;

  return (
    <div className="bg-black bg-opacity-40 backdrop-blur-md rounded-xl border border-gray-800 p-8">
      <div className="text-center mb-8">
        <div className="inline-block bg-green-600 rounded-full p-4 mb-4">
          <i className="fas fa-check text-white text-4xl"></i>
        </div>
        <h1 className="text-3xl font-bold text-white mb-2">
          購入が完了しました！
        </h1>
        <p className="text-gray-400">
          ご購入ありがとうございます
        </p>
      </div>

      <div className="bg-gray-900 bg-opacity-50 rounded-lg p-6 mb-6 space-y-4">
        <div className="flex justify-between items-center border-b border-gray-700 pb-4">
          <span className="text-gray-400">イベント</span>
          <span className="text-white font-bold">{purchase.eventTitle}</span>
        </div>
        <div className="flex justify-between items-center border-b border-gray-700 pb-4">
          <span className="text-gray-400">チケット</span>
          <span className="text-white">{purchase.ticketName}</span>
        </div>
        <div className="flex justify-between items-center border-b border-gray-700 pb-4">
          <span className="text-gray-400">金額</span>
          <span className="text-white font-bold text-xl">
            ¥{purchase.amount.toLocaleString()}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-400">メール</span>
          <span className="text-white">{purchase.customerEmail}</span>
        </div>
      </div>

      <div className="bg-purple-900 bg-opacity-20 border border-purple-800 rounded-lg p-6 mb-6">
        <h3 className="text-lg font-bold text-white mb-2">
          <i className="fas fa-key mr-2 text-purple-500"></i>
          アクセストークン
        </h3>
        <div className="bg-gray-900 rounded p-3 mb-4">
          <code className="text-purple-400 text-sm break-all">
            {purchase.accessToken}
          </code>
        </div>
        <p className="text-gray-400 text-sm">
          このトークンは視聴に必要です。安全に保管してください。
        </p>
      </div>

      <div className="flex flex-col gap-4">
        <Link
          href={watchUrl}
          className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-4 px-8 rounded-lg text-center transition text-lg"
        >
          <i className="fas fa-play-circle mr-2"></i>
          今すぐ視聴する
        </Link>
        <Link
          href="/events"
          className="w-full bg-gray-800 hover:bg-gray-700 text-white font-bold py-3 px-8 rounded-lg text-center transition"
        >
          <i className="fas fa-calendar-alt mr-2"></i>
          他のイベントを見る
        </Link>
      </div>

      <div className="mt-6 p-4 bg-blue-900 bg-opacity-20 border border-blue-800 rounded-lg text-blue-400 text-sm">
        <i className="fas fa-envelope mr-2"></i>
        購入確認メールを {purchase.customerEmail} に送信しました。
      </div>
    </div>
  );
}
