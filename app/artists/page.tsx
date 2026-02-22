import Navigation from '@/components/Navigation';
import { getAll } from '@/lib/db';
import { Artist } from '@/lib/types';
import Link from 'next/link';
import Image from 'next/image';

export const dynamic = 'force-dynamic';

async function getArtists(): Promise<Artist[]> {
  try {
    const artists = await getAll<Artist>(`
      SELECT * FROM artists
      ORDER BY created_at DESC
    `);
    return artists;
  } catch (error) {
    console.error('Failed to fetch artists:', error);
    return [];
  }
}

export default async function ArtistsPage() {
  const artists = await getArtists();

  return (
    <>
      <Navigation />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-2xl md:text-4xl font-bold text-white mb-8">
          <i className="fas fa-users text-purple-500 mr-2"></i>
          アーティスト一覧
        </h1>

        {artists.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {artists.map((artist) => (
              <Link
                key={artist.id}
                href={`/artists/${artist.slug}`}
                className="block bg-black bg-opacity-40 backdrop-blur-md rounded-xl overflow-hidden border border-gray-800 hover:border-purple-500 transition hover:scale-105 duration-300"
              >
                <div className="aspect-square bg-gray-800 relative">
                  {artist.image_url ? (
                    <Image
                      src={artist.image_url}
                      alt={artist.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <i className="fas fa-user text-gray-600 text-6xl"></i>
                    </div>
                  )}
                </div>
                <div className="p-4 text-center">
                  <h3 className="text-white font-bold text-lg">
                    {artist.name}
                  </h3>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center text-gray-400 py-8">
            <i className="fas fa-users text-4xl mb-2"></i>
            <p>アーティストがいません</p>
          </div>
        )}
      </main>
    </>
  );
}
