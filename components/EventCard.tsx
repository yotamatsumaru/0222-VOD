import Link from 'next/link';
import Image from 'next/image';
import { Event } from '@/lib/types';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';

interface EventCardProps {
  event: Event & { artist_name?: string };
}

export default function EventCard({ event }: EventCardProps) {
  const isLive = event.status === 'live';
  const badgeColor = isLive ? 'bg-red-600 animate-pulse' : 'bg-blue-600';
  const badgeText = isLive ? 'LIVE' : '配信予定';
  const borderClass = isLive
    ? 'border-red-500 ring-2 ring-red-500/50'
    : 'border-gray-800 hover:border-purple-500';

  return (
    <Link
      href={`/events/${event.slug}`}
      className={`block bg-black bg-opacity-40 backdrop-blur-md rounded-xl overflow-hidden border ${borderClass} transition hover:scale-105 duration-300`}
    >
      <div className="aspect-video bg-gray-800 relative">
        {event.thumbnail_url ? (
          <Image
            src={event.thumbnail_url}
            alt={event.title}
            fill
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <i className="fas fa-image text-gray-600 text-4xl"></i>
          </div>
        )}
        <div
          className={`${badgeColor} text-white px-3 py-1 rounded-full text-sm font-bold absolute top-2 right-2`}
        >
          {isLive && <i className="fas fa-circle text-xs mr-1"></i>}
          {badgeText}
        </div>
      </div>
      <div className="p-4">
        <h3 className="text-white font-bold text-lg mb-2 line-clamp-2">
          {event.title}
        </h3>
        {event.start_time && (
          <p className="text-gray-400 text-sm mb-2">
            <i className="fas fa-clock mr-1"></i>
            {format(new Date(event.start_time), 'yyyy年M月d日(E) HH:mm', {
              locale: ja,
            })}
          </p>
        )}
        {event.description && (
          <p className="text-gray-500 text-sm line-clamp-2">
            {event.description}
          </p>
        )}
      </div>
    </Link>
  );
}
