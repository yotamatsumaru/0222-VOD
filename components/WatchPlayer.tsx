'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import Hls from 'hls.js';

interface WatchPlayerProps {
  slug: string;
  token?: string;
}

interface EventData {
  id: number;
  title: string;
  slug: string;
  status: string;
}

export default function WatchPlayer({ slug, token }: WatchPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [event, setEvent] = useState<EventData | null>(null);
  const [streamUrl, setStreamUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setError('アクセストークンが必要です。マイページから視聴してください。');
      setLoading(false);
      return;
    }

    console.log('[WatchPlayer] Starting verification for:', { slug, tokenPreview: token.substring(0, 20) + '...' });

    const verifyAndLoadStream = async () => {
      try {
        // Verify token
        console.log('[WatchPlayer] Verifying token...');
        const verifyResponse = await fetch('/api/watch/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token, eventSlug: slug }),
        });

        const verifyData = await verifyResponse.json();
        console.log('[WatchPlayer] Verify response:', { status: verifyResponse.status, data: verifyData });

        if (!verifyResponse.ok) {
          throw new Error(verifyData.error || 'Token verification failed');
        }

        setEvent(verifyData.event);
        console.log('[WatchPlayer] Event verified:', verifyData.event);

        // Get stream URL
        console.log('[WatchPlayer] Getting stream URL...');
        const streamResponse = await fetch('/api/watch/stream-url', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token, eventSlug: slug }),
        });

        const streamData = await streamResponse.json();
        console.log('[WatchPlayer] Stream response:', { status: streamResponse.status, data: streamData });

        if (!streamResponse.ok) {
          throw new Error(streamData.error || 'Failed to get stream URL');
        }

        console.log('[WatchPlayer] Stream URL obtained:', streamData.streamUrl);
        setStreamUrl(streamData.streamUrl);
        setLoading(false);
      } catch (err: any) {
        console.error('[WatchPlayer] Error:', err);
        setError(err.message);
        setLoading(false);
      }
    };

    verifyAndLoadStream();
  }, [slug, token]);

  useEffect(() => {
    if (!streamUrl || !videoRef.current) return;

    const video = videoRef.current;

    // Check if HLS is supported natively (Safari)
    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = streamUrl;
    } else if (Hls.isSupported()) {
      // Use HLS.js for other browsers
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
      });

      hls.loadSource(streamUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        console.log('HLS manifest loaded');
      });

      hls.on(Hls.Events.ERROR, (event, data) => {
        console.error('HLS error:', data);
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              console.error('Network error');
              hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              console.error('Media error');
              hls.recoverMediaError();
              break;
            default:
              setError('ストリーミングエラーが発生しました');
              break;
          }
        }
      });

      hlsRef.current = hls;

      return () => {
        hls.destroy();
      };
    } else {
      setError('お使いのブラウザはHLS再生に対応していません');
    }
  }, [streamUrl]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center text-gray-400">
          <i className="fas fa-spinner fa-spin text-4xl mb-4"></i>
          <p>認証中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-black bg-opacity-40 backdrop-blur-md rounded-xl border border-red-800 p-8 text-center">
          <i className="fas fa-exclamation-triangle text-red-500 text-5xl mb-4"></i>
          <h2 className="text-2xl font-bold text-white mb-4">
            視聴できません
          </h2>
          <p className="text-red-400 mb-6">{error}</p>
          <Link
            href="/events"
            className="inline-block bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-8 rounded-lg transition"
          >
            イベント一覧に戻る
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Video Player */}
      <div className="relative w-full h-screen">
        <video
          ref={videoRef}
          className="w-full h-full"
          controls
          autoPlay
          playsInline
        >
          お使いのブラウザはビデオタグに対応していません。
        </video>

        {/* Event Info Overlay */}
        <div className="absolute top-4 left-4 bg-black bg-opacity-75 backdrop-blur-md rounded-lg p-4 max-w-md">
          <h1 className="text-white text-xl font-bold mb-2">
            {event?.title}
          </h1>
          {event?.status === 'live' && (
            <div className="inline-flex items-center bg-red-600 text-white px-3 py-1 rounded-full text-sm font-bold animate-pulse">
              <i className="fas fa-circle text-xs mr-2"></i>
              配信中
            </div>
          )}
          {event?.status === 'archived' && (
            <div className="inline-flex items-center bg-gray-600 text-white px-3 py-1 rounded-full text-sm">
              <i className="fas fa-archive mr-2"></i>
              アーカイブ
            </div>
          )}
        </div>

        {/* Close Button */}
        <Link
          href="/events"
          className="absolute top-4 right-4 bg-black bg-opacity-75 backdrop-blur-md hover:bg-opacity-90 text-white rounded-full w-12 h-12 flex items-center justify-center transition"
        >
          <i className="fas fa-times text-xl"></i>
        </Link>
      </div>
    </div>
  );
}
