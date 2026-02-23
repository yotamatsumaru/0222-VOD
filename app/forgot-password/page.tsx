'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'リクエストに失敗しました');
      }

      setMessage(data.message);
      setEmail(''); // フォームをクリア

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full">
        <div className="bg-gray-900 bg-opacity-90 backdrop-blur-md rounded-2xl shadow-2xl p-8 border border-gray-800">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-600 bg-opacity-20 rounded-full mb-4">
              <i className="fas fa-key text-3xl text-purple-400"></i>
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">
              パスワードを忘れた方
            </h1>
            <p className="text-gray-400">
              登録済みのメールアドレスを入力してください
            </p>
          </div>

          {message && (
            <div className="mb-6 bg-green-900 bg-opacity-50 border-2 border-green-400 text-green-200 px-4 py-3 rounded-lg text-sm font-semibold shadow-lg">
              <i className="fas fa-check-circle mr-2"></i>
              {message}
            </div>
          )}

          {error && (
            <div className="mb-6 bg-red-900 bg-opacity-50 border-2 border-red-400 text-red-200 px-4 py-3 rounded-lg text-sm font-semibold shadow-lg">
              <i className="fas fa-exclamation-circle mr-2"></i>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                メールアドレス
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="your@email.com"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <i className="fas fa-spinner fa-spin mr-2"></i>
                  送信中...
                </>
              ) : (
                <>
                  <i className="fas fa-paper-plane mr-2"></i>
                  リセットメールを送信
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center space-y-3">
            <p className="text-gray-400 text-sm">
              パスワードを思い出しましたか？{' '}
              <Link href="/login" className="text-purple-400 hover:text-purple-300 font-medium">
                ログイン
              </Link>
            </p>
            <Link href="/" className="block text-gray-500 hover:text-gray-400 text-sm">
              <i className="fas fa-arrow-left mr-2"></i>
              ホームに戻る
            </Link>
          </div>
        </div>

        <div className="mt-6 bg-blue-900 bg-opacity-30 border border-blue-700 rounded-lg p-4 text-blue-200 text-sm">
          <i className="fas fa-info-circle mr-2"></i>
          メールが届かない場合は、迷惑メールフォルダをご確認ください。
        </div>
      </div>
    </div>
  );
}
