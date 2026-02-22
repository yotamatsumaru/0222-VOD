import { notFound } from 'next/navigation';
import Navigation from '@/components/Navigation';
import EventCard from '@/components/EventCard';
import { getOne, getAll } from '@/lib/db';
import { Artist, Event } from '@/lib/types';
import Image from 'next/image';

export const dynamic = 'force-dynamic';

async function getArtist(slug: string): Promise<Artist | null> {
  try {
    const artist = await getOne<Artist>(
      'SELECT * FROM artists WHERE slug = $1',
      [slug]
    );
    return artist;
  } catch (error) {
    console.error('Failed to fetch artist:', error);
    return null;
  }
}

async function getArtistEvents(artistId: number): Promise<Event[]> {
  try {
    const events = await getAll<Event>(
      `
      SELECT e.*, a.name as artist_name
      FROM events e
      LEFT JOIN artists a ON e.artist_id = a.id
      WHERE e.artist_id = $1
      ORDER BY 
        CASE WHEN e.status = 'live' THEN 0 ELSE 1 END,
        e.start_time ASC
    `,
      [artistId]
    );
    return events;
  } catch (error) {
    console.error('Failed to fetch events:', error);
    return [];
  }
}

export default async function ArtistDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const artist = await getArtist(slug);

  if (!artist) {
    notFound();
  }

  const events = await getArtistEvents(artist.id);

  return (
    <>
      <Navigation />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Artist Header */}
        <div className="bg-black bg-opacity-40 backdrop-blur-md rounded-xl border border-gray-800 p-6 md:p-8 mb-8">
          <div className="flex flex-col md:flex-row gap-6 items-start">
            {/* Artist Image */}
            <div className="w-32 h-32 md:w-48 md:h-48 rounded-full overflow-hidden bg-gray-800 flex-shrink-0 relative">
              {artist.image_url ? (
                <Image
                  src={artist.image_url}
                  alt={artist.name}
                  fill
                  className="object-cover"
                  priority
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <i className="fas fa-user text-gray-600 text-6xl"></i>
                </div>
              )}
            </div>

            {/* Artist Info */}
            <div className="flex-1">
              <h1 className="text-3xl md:text-5xl font-bold text-white mb-4">
                {artist.name}
              </h1>
              {artist.bio && (
                <p className="text-gray-300 text-lg whitespace-pre-wrap">
                  {artist.bio}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Events Section */}
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-6">
            <i className="fas fa-calendar-alt text-purple-500 mr-2"></i>
            イベント
          </h2>

          {events.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-400 py-8 bg-black bg-opacity-40 backdrop-blur-md rounded-xl border border-gray-800">
              <i className="fas fa-calendar-times text-4xl mb-2"></i>
              <p>現在、予定されているイベントはありません</p>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
