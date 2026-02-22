import Navigation from '@/components/Navigation';
import EventCard from '@/components/EventCard';
import { getAll } from '@/lib/db';
import { Event } from '@/lib/types';

export const dynamic = 'force-dynamic';

async function getEvents(): Promise<Event[]> {
  try {
    const events = await getAll<Event>(`
      SELECT e.*, a.name as artist_name
      FROM events e
      LEFT JOIN artists a ON e.artist_id = a.id
      ORDER BY 
        CASE WHEN e.status = 'live' THEN 0 ELSE 1 END,
        e.start_time ASC
    `);
    return events;
  } catch (error) {
    console.error('Failed to fetch events:', error);
    return [];
  }
}

export default async function EventsPage() {
  const events = await getEvents();

  return (
    <>
      <Navigation />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-2xl md:text-4xl font-bold text-white mb-4">
            <i className="fas fa-calendar-alt text-purple-500 mr-2"></i>
            イベント一覧
          </h1>
        </div>

        {events.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        ) : (
          <div className="text-center text-gray-400 py-8">
            <i className="fas fa-calendar-times text-4xl mb-2"></i>
            <p>イベントがありません</p>
          </div>
        )}
      </main>
    </>
  );
}
