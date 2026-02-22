'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Stats {
  totalRevenue: number;
  totalPurchases: number;
  totalEvents: number;
  totalArtists: number;
  recentPurchases: any[];
  eventSales: any[];
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/stats');
      
      if (!response.ok) {
        throw new Error('Failed to fetch statistics');
      }

      const data = await response.json();
      setStats(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
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

  if (error) {
    return (
      <div className="bg-red-900 bg-opacity-20 border border-red-800 rounded-lg p-6 text-center">
        <i className="fas fa-exclamation-triangle text-red-500 text-4xl mb-4"></i>
        <p className="text-red-400">{error}</p>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="space-y-8">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-purple-600 to-purple-800 rounded-xl p-6 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <i className="fas fa-yen-sign text-3xl text-white opacity-80"></i>
            <span className="text-purple-200 text-sm">総売上</span>
          </div>
          <p className="text-3xl font-bold text-white">
            ¥{stats.totalRevenue.toLocaleString()}
          </p>
        </div>

        <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl p-6 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <i className="fas fa-shopping-cart text-3xl text-white opacity-80"></i>
            <span className="text-blue-200 text-sm">購入数</span>
          </div>
          <p className="text-3xl font-bold text-white">
            {stats.totalPurchases}
          </p>
        </div>

        <div className="bg-gradient-to-br from-green-600 to-green-800 rounded-xl p-6 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <i className="fas fa-calendar-alt text-3xl text-white opacity-80"></i>
            <span className="text-green-200 text-sm">イベント数</span>
          </div>
          <p className="text-3xl font-bold text-white">
            {stats.totalEvents}
          </p>
        </div>

        <div className="bg-gradient-to-br from-orange-600 to-orange-800 rounded-xl p-6 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <i className="fas fa-users text-3xl text-white opacity-80"></i>
            <span className="text-orange-200 text-sm">アーティスト数</span>
          </div>
          <p className="text-3xl font-bold text-white">
            {stats.totalArtists}
          </p>
        </div>
      </div>

      {/* Recent Purchases */}
      <div className="bg-black bg-opacity-40 backdrop-blur-md rounded-xl border border-gray-800 p-6">
        <h2 className="text-2xl font-bold text-white mb-4">
          <i className="fas fa-receipt text-purple-500 mr-2"></i>
          最近の購入
        </h2>
        {stats.recentPurchases && stats.recentPurchases.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left text-gray-400 py-3 px-4">顧客</th>
                  <th className="text-left text-gray-400 py-3 px-4">イベント</th>
                  <th className="text-left text-gray-400 py-3 px-4">チケット</th>
                  <th className="text-right text-gray-400 py-3 px-4">金額</th>
                  <th className="text-right text-gray-400 py-3 px-4">日時</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentPurchases.map((purchase: any, index: number) => (
                  <tr key={index} className="border-b border-gray-800 hover:bg-gray-900">
                    <td className="py-3 px-4 text-white">
                      {purchase.customer_name || purchase.customer_email}
                    </td>
                    <td className="py-3 px-4 text-gray-300">
                      {purchase.event_title}
                    </td>
                    <td className="py-3 px-4 text-gray-300">
                      {purchase.ticket_name}
                    </td>
                    <td className="py-3 px-4 text-right text-white font-bold">
                      ¥{purchase.amount.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right text-gray-400 text-sm">
                      {new Date(purchase.purchased_at).toLocaleString('ja-JP')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-400 text-center py-8">購入履歴がありません</p>
        )}
      </div>

      {/* Event Sales */}
      <div className="bg-black bg-opacity-40 backdrop-blur-md rounded-xl border border-gray-800 p-6">
        <h2 className="text-2xl font-bold text-white mb-4">
          <i className="fas fa-chart-bar text-purple-500 mr-2"></i>
          イベント別売上
        </h2>
        {stats.eventSales && stats.eventSales.length > 0 ? (
          <div className="space-y-4">
            {stats.eventSales.map((event: any, index: number) => (
              <div key={index} className="flex items-center justify-between p-4 bg-gray-900 rounded-lg">
                <div className="flex-1">
                  <h3 className="text-white font-bold">{event.title}</h3>
                  <p className="text-gray-400 text-sm">
                    {event.purchase_count} 件の購入
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-purple-400">
                    ¥{event.total_revenue.toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-400 text-center py-8">売上データがありません</p>
        )}
      </div>
    </div>
  );
}
