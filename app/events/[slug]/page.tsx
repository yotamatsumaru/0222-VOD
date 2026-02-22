import { notFound } from 'next/navigation';
import Navigation from '@/components/Navigation';
import TicketPurchase from '@/components/TicketPurchase';
import { getOne, getAll } from '@/lib/db';
import { Event, Ticket } from '@/lib/types';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import Image from 'next/image';

export const dynamic = 'force-dynamic';

async function getEvent(slug: string): Promise<Event | null> {
  try {
    const event = await getOne<Event>(
      `
      SELECT e.*, a.name as artist_name, a.slug as artist_slug, a.image_url as artist_image
      FROM events e
      LEFT JOIN artists a ON e.artist_id = a.id
      WHERE e.slug = $1
    `,
      [slug]
    );
    return event;
  } catch (error) {
    console.error('Failed to fetch event:', error);
    return null;
  }
}

async function getTickets(eventId: number): Promise<Ticket[]> {
  try {
    const tickets = await getAll<Ticket>(
      `
      SELECT * FROM tickets
      WHERE event_id = $1 AND is_active = true
      ORDER BY price ASC
    `,
      [eventId]
    );
    return tickets;
  } catch (error) {
    console.error('Failed to fetch tickets:', error);
    return [];
  }
}

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const event = await getEvent(slug);

  if (!event) {
    notFound();
  }

  const tickets = await getTickets(event.id);

  return (
    <>
      <Navigation />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-black bg-opacity-40 backdrop-blur-md rounded-xl overflow-hidden border border-gray-800 mb-8">
          {/* Event Header Image */}
          <div className="aspect-video bg-gray-800 relative">
            {event.thumbnail_url ? (
              <Image
                src={event.thumbnail_url}
                alt={event.title}
                fill
                className="object-cover"
                priority
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <i className="fas fa-image text-gray-600 text-6xl"></i>
              </div>
            )}
            
            {/* Live Badge */}
            {event.status === 'live' && (
              <div className="absolute top-4 right-4 bg-red-600 text-white px-4 py-2 rounded-full font-bold animate-pulse">
                <i className="fas fa-circle text-xs mr-2"></i>
                配信中
              </div>
            )}
            {event.status === 'upcoming' && (
              <div className="absolute top-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-full font-bold">
                配信予定
              </div>
            )}
          </div>

          {/* Event Info */}
          <div className="p-6 md:p-8">
            <h1 className="text-2xl md:text-4xl font-bold text-white mb-4">
              {event.title}
            </h1>

            <div className="flex flex-col md:flex-row md:items-center gap-4 mb-6">
              {event.start_time && (
                <div className="text-gray-300">
                  <i className="fas fa-clock mr-2 text-purple-500"></i>
                  {format(new Date(event.start_time), 'yyyy年M月d日(E) HH:mm開演', {
                    locale: ja,
                  })}
                </div>
              )}
              
              <div className="text-gray-300">
                <i className="fas fa-tag mr-2 text-purple-500"></i>
                {event.status === 'live' && '配信中'}
                {event.status === 'upcoming' && '配信予定'}
                {event.status === 'ended' && '配信終了'}
                {event.status === 'archived' && 'アーカイブ'}
              </div>
            </div>

            {event.description && (
              <div className="mb-6">
                <h2 className="text-xl font-bold text-white mb-2">
                  イベント詳細
                </h2>
                <p className="text-gray-300 whitespace-pre-wrap">
                  {event.description}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Tickets Section */}
        <div className="bg-black bg-opacity-40 backdrop-blur-md rounded-xl border border-gray-800 p-6 md:p-8">
          <h2 className="text-2xl font-bold text-white mb-6">
            <i className="fas fa-ticket-alt text-purple-500 mr-2"></i>
            チケット購入
          </h2>

          {tickets.length > 0 ? (
            <TicketPurchase tickets={tickets} eventSlug={slug} />
          ) : (
            <div className="text-center text-gray-400 py-8">
              <i className="fas fa-exclamation-circle text-4xl mb-2"></i>
              <p>現在、購入可能なチケットはありません</p>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
