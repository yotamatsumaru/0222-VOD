import { Suspense } from 'react';
import WatchPlayer from '@/components/WatchPlayer';

export default function WatchPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ token?: string }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-black flex items-center justify-center">
          <div className="text-center text-gray-400">
            <i className="fas fa-spinner fa-spin text-4xl mb-2"></i>
            <p>読み込み中...</p>
          </div>
        </div>
      }
    >
      <WatchPlayerWrapper params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function WatchPlayerWrapper({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ token?: string }>;
}) {
  const { slug } = await params;
  const { token } = await searchParams;

  return <WatchPlayer slug={slug} token={token} />;
}
