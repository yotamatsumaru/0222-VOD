import Link from 'next/link';
import { getAll } from '@/lib/db';
import { Event } from '@/lib/types';
import EventCard from '@/components/EventCard';
import Navigation from '@/components/Navigation';

export const dynamic = 'force-dynamic';

async function getUpcomingEvents(): Promise<Event[]> {
  try {
    const events = await getAll<Event>(`
      SELECT e.*, a.name as artist_name
      FROM events e
      LEFT JOIN artists a ON e.artist_id = a.id
      WHERE e.status IN ('upcoming', 'live')
      ORDER BY 
        CASE WHEN e.status = 'live' THEN 0 ELSE 1 END,
        e.start_time ASC
      LIMIT 6
    `);
    return events;
  } catch (error) {
    console.error('Failed to fetch events:', error);
    return [];
  }
}

export default async function HomePage() {
  const events = await getUpcomingEvents();

  return (
    <>
      <Navigation />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-16">
          <h1 className="text-3xl md:text-5xl font-bold text-white mb-4">
            ライブ配信・ストリーミング
            <br />
            プラットフォーム
          </h1>
          <p className="text-base md:text-xl text-gray-300 mb-8">
            お気に入りのアーティストのライブをどこでも視聴
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link
              href="/events"
              className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-8 rounded-lg transition"
            >
              <i className="fas fa-calendar-alt mr-2"></i>
              イベント一覧
            </Link>
            <Link
              href="/artists"
              className="bg-gray-800 hover:bg-gray-700 text-white font-bold py-3 px-8 rounded-lg transition"
            >
              <i className="fas fa-users mr-2"></i>
              アーティスト一覧
            </Link>
          </div>
        </div>

        <div className="mb-12">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-6">
            <i className="fas fa-fire text-orange-500 mr-2"></i>
            今後のライブ
          </h2>
          {events.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-400 py-8">
              <i className="fas fa-calendar-times text-4xl mb-2"></i>
              <p>現在、予定されているライブはありません</p>
            </div>
          )}
        </div>

        <div className="bg-black bg-opacity-40 backdrop-blur-md rounded-xl p-6 md:p-8 border border-gray-800">
          <h2 className="text-xl md:text-2xl font-bold text-white mb-4">
            <i className="fas fa-info-circle text-blue-500 mr-2"></i>
            プラットフォームについて
          </h2>
          <div className="grid md:grid-cols-3 gap-6 text-gray-300">
            <div>
              <i className="fas fa-video text-purple-500 text-2xl md:text-3xl mb-2"></i>
              <h3 className="font-bold text-white mb-2 text-base md:text-lg">
                高品質配信
              </h3>
              <p className="text-sm md:text-base">
                AWS + CloudFrontによる安定した配信
              </p>
            </div>
            <div>
              <i className="fas fa-lock text-purple-500 text-2xl md:text-3xl mb-2"></i>
              <h3 className="font-bold text-white mb-2 text-base md:text-lg">
                セキュア
              </h3>
              <p className="text-sm md:text-base">DRM保護と署名付きURL</p>
            </div>
            <div>
              <i className="fas fa-credit-card text-purple-500 text-2xl md:text-3xl mb-2"></i>
              <h3 className="font-bold text-white mb-2 text-base md:text-lg">
                簡単決済
              </h3>
              <p className="text-sm md:text-base">Stripeによる安全な決済</p>
            </div>
          </div>
        </div>
      </main>

      <footer className="bg-black bg-opacity-50 border-t border-gray-800 mt-20 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center text-gray-400">
            <p>&copy; 2024 StreamingPlatform. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </>
  );
}
