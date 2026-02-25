'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Ticket } from '@/lib/types';
import { getAuthToken } from '@/lib/userAuth';

interface TicketPurchaseProps {
  tickets: Ticket[];
  eventSlug: string;
}

export default function TicketPurchase({ tickets, eventSlug }: TicketPurchaseProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handlePurchase = async (ticketId: number) => {
    try {
      setLoading(true);
      setError(null);

      // Check if user is authenticated
      const token = getAuthToken();
      if (!token) {
        // Redirect to login page with return URL
        router.push(`/login?redirect=/events/${eventSlug}`);
        return;
      }

      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          ticketId,
          eventSlug,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.requiresAuth) {
          // Token expired or invalid, redirect to login
          router.push(`/login?redirect=/events/${eventSlug}`);
          return;
        }
        throw new Error(data.error || 'Failed to create checkout session');
      }

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-900 bg-opacity-20 border border-red-800 rounded-lg p-4 text-red-400">
          <i className="fas fa-exclamation-triangle mr-2"></i>
          {error}
        </div>
      )}

      {tickets.map((ticket) => {
        const soldOut = ticket.stock !== null && ticket.sold >= ticket.stock;
        const availability =
          ticket.stock !== null ? `残り${ticket.stock - ticket.sold}枚` : '在庫あり';

        return (
          <div
            key={ticket.id}
            className="bg-gray-900 bg-opacity-50 border border-gray-700 rounded-lg p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4"
          >
            <div className="flex-1">
              <h3 className="text-lg font-bold text-white mb-2">
                {ticket.name}
              </h3>
              {ticket.description && (
                <p className="text-gray-400 text-sm mb-2">
                  {ticket.description}
                </p>
              )}
              <div className="flex items-center gap-4">
                <span className="text-2xl font-bold text-purple-400">
                  {ticket.currency === 'JPY' ? '¥' : '$'}
                  {(ticket.price / 100).toLocaleString()}
                </span>
                {!soldOut && (
                  <span className="text-sm text-gray-500">{availability}</span>
                )}
              </div>
            </div>

            <div>
              <button
                onClick={() => handlePurchase(ticket.id)}
                disabled={loading || soldOut}
                className={`px-8 py-3 rounded-lg font-bold transition ${
                  soldOut
                    ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                    : loading
                    ? 'bg-purple-700 text-white cursor-wait'
                    : 'bg-purple-600 hover:bg-purple-700 text-white'
                }`}
              >
                {loading ? (
                  <>
                    <i className="fas fa-spinner fa-spin mr-2"></i>
                    処理中...
                  </>
                ) : soldOut ? (
                  '売り切れ'
                ) : (
                  <>
                    <i className="fas fa-shopping-cart mr-2"></i>
                    購入する
                  </>
                )}
              </button>
            </div>
          </div>
        );
      })}

      <div className="mt-6 p-4 bg-blue-900 bg-opacity-20 border border-blue-800 rounded-lg text-blue-400 text-sm">
        <i className="fas fa-info-circle mr-2"></i>
        チケットを購入するにはログインが必要です。購入後、マイページから視聴できます。
      </div>
    </div>
  );
}
