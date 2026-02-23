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
  description?: string;
  artist_name?: string;
  start_time?: string;
}

export default function WatchPlayer({ slug, token }: WatchPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [event, setEvent] = useState<EventData | null>(null);
  const [streamUrl, setStreamUrl] = useState<string | null>(null);
  const [currentQuality, setCurrentQuality] = useState<number>(-1);
  const [availableQualities, setAvailableQualities] = useState<Array<{level: number, height: number, bitrate: number}>>([]);

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
    console.log('[WatchPlayer] Loading stream URL:', streamUrl);

    // Check if HLS is supported natively (Safari)
    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      console.log('[WatchPlayer] Using native HLS support (Safari)');
      video.src = streamUrl;
      
      // For Safari, we can't get quality levels directly
      // Show a message that quality is auto-managed
      console.log('[WatchPlayer] Native HLS - quality levels not available');
    } else if (Hls.isSupported()) {
      console.log('[WatchPlayer] Using HLS.js');
      // Use HLS.js for other browsers
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        debug: false,
      });

      hls.loadSource(streamUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        console.log('[WatchPlayer] HLS manifest parsed');
        console.log('[WatchPlayer] Available levels:', hls.levels.length);
        
        // Get available quality levels
        const levels = hls.levels.map((level, index) => {
          console.log(`[WatchPlayer] Level ${index}:`, {
            height: level.height,
            width: level.width,
            bitrate: level.bitrate,
          });
          return {
            level: index,
            height: level.height,
            bitrate: level.bitrate,
          };
        });
        
        if (levels.length > 0) {
          console.log('[WatchPlayer] Setting available qualities:', levels);
          setAvailableQualities(levels);
          setCurrentQuality(hls.currentLevel);
        } else {
          console.log('[WatchPlayer] No quality levels found in manifest');
        }
      });

      hls.on(Hls.Events.LEVEL_SWITCHED, (event, data) => {
        console.log('[WatchPlayer] Quality switched to level:', data.level);
        setCurrentQuality(data.level);
      });

      hls.on(Hls.Events.ERROR, (event, data) => {
        console.error('[WatchPlayer] HLS error:', data);
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              console.error('[WatchPlayer] Fatal network error, attempting recovery');
              hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              console.error('[WatchPlayer] Fatal media error, attempting recovery');
              hls.recoverMediaError();
              break;
            default:
              console.error('[WatchPlayer] Fatal error, cannot recover');
              setError('ストリーミングエラーが発生しました');
              break;
          }
        }
      });

      hlsRef.current = hls;

      return () => {
        console.log('[WatchPlayer] Cleaning up HLS instance');
        hls.destroy();
      };
    } else {
      console.error('[WatchPlayer] HLS not supported');
      setError('お使いのブラウザはHLS再生に対応していません');
    }
  }, [streamUrl]);

  const handleQualityChange = (level: number) => {
    if (hlsRef.current) {
      hlsRef.current.currentLevel = level;
      setCurrentQuality(level);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; color: string; icon: string }> = {
      live: { label: '配信中', color: 'bg-red-500', icon: 'fa-circle' },
      upcoming: { label: '配信予定', color: 'bg-blue-500', icon: 'fa-clock' },
      archived: { label: 'アーカイブ', color: 'bg-green-500', icon: 'fa-archive' },
      ended: { label: '配信終了', color: 'bg-gray-500', icon: 'fa-stop-circle' },
    };
    
    const config = statusConfig[status] || { label: status, color: 'bg-gray-500', icon: 'fa-info-circle' };
    return (
      <span className={`inline-flex items-center ${config.color} text-white px-3 py-1 rounded-full text-xs sm:text-sm font-medium ${status === 'live' ? 'animate-pulse' : ''}`}>
        <i className={`fas ${config.icon} text-xs mr-1.5`}></i>
        {config.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-900 via-purple-900/20 to-gray-900">
        <div className="text-center text-white">
          <i className="fas fa-spinner fa-spin text-5xl mb-4 text-purple-500"></i>
          <p className="text-xl">認証中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-gray-900 via-purple-900/20 to-gray-900">
        <div className="max-w-md w-full bg-black/60 backdrop-blur-lg rounded-2xl border border-red-500/30 p-8 text-center">
          <i className="fas fa-exclamation-triangle text-red-500 text-6xl mb-6"></i>
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
            視聴できません
          </h2>
          <p className="text-red-400 mb-8 text-base sm:text-lg">{error}</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/mypage"
              className="inline-block bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-lg transition"
            >
              <i className="fas fa-user mr-2"></i>
              マイページ
            </Link>
            <Link
              href="/events"
              className="inline-block bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-6 rounded-lg transition"
            >
              <i className="fas fa-calendar-alt mr-2"></i>
              イベント一覧
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-purple-900/20 to-gray-900">
      {/* Header - Minimal and compact */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-md border-b border-gray-800/50">
        <div className="max-w-[1600px] mx-auto px-3 sm:px-6">
          <div className="flex items-center justify-between h-14 sm:h-16">
            <Link href="/" className="flex items-center text-white hover:text-purple-400 transition">
              <i className="fas fa-broadcast-tower text-purple-500 text-lg sm:text-xl mr-2"></i>
              <span className="font-bold text-base sm:text-lg hidden sm:inline">StreamingPlatform</span>
            </Link>
            <div className="flex items-center gap-2 sm:gap-3">
              <Link
                href="/mypage"
                className="text-gray-300 hover:text-white transition px-2 sm:px-3 py-2 rounded-lg hover:bg-white/5 text-sm"
              >
                <i className="fas fa-user mr-1 sm:mr-2"></i>
                <span className="hidden sm:inline">マイページ</span>
              </Link>
              <Link
                href="/events"
                className="text-gray-300 hover:text-white transition px-2 sm:px-3 py-2 rounded-lg hover:bg-white/5 text-sm"
              >
                <i className="fas fa-calendar-alt mr-1 sm:mr-2"></i>
                <span className="hidden sm:inline">イベント一覧</span>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-14 sm:pt-16">
        <div className="max-w-[1600px] mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
          
          {/* Video Player - No overlays, clean design */}
          <div className="bg-black rounded-lg sm:rounded-xl overflow-hidden shadow-2xl mb-4 sm:mb-6">
            <div className="relative aspect-video">
              <video
                ref={videoRef}
                className="absolute top-0 left-0 w-full h-full"
                controls
                playsInline
                autoPlay
              >
                お使いのブラウザはビデオタグに対応していません。
              </video>
            </div>
          </div>

          {/* Event Info Section */}
          <div className="bg-black/40 backdrop-blur-md rounded-lg sm:rounded-xl border border-gray-800/50 p-4 sm:p-6 mb-4 sm:mb-6">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4 mb-3 sm:mb-4">
              <div className="flex-1 min-w-0">
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-2 break-words">
                  {event?.title}
                </h1>
                {event?.artist_name && (
                  <p className="text-gray-400 text-sm sm:text-base lg:text-lg flex items-center">
                    <i className="fas fa-user mr-2 flex-shrink-0"></i>
                    <span className="truncate">{event.artist_name}</span>
                  </p>
                )}
              </div>
              <div className="flex-shrink-0">
                {event?.status && getStatusBadge(event.status)}
              </div>
            </div>
            
            {event?.start_time && (
              <div className="text-gray-400 text-sm sm:text-base mb-3 sm:mb-4 flex items-center">
                <i className="fas fa-calendar mr-2 flex-shrink-0"></i>
                <span>{formatDate(event.start_time)}</span>
              </div>
            )}

            {event?.description && (
              <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-800">
                <p className="text-gray-300 text-sm sm:text-base whitespace-pre-wrap break-words leading-relaxed">
                  {event.description}
                </p>
              </div>
            )}
          </div>

          {/* Quality Settings - Below video as requested */}
          <div className="bg-black/40 backdrop-blur-md rounded-lg sm:rounded-xl border border-gray-800/50 p-4 sm:p-6">
            <h3 className="text-white font-bold text-base sm:text-lg mb-3 sm:mb-4 flex items-center">
              <i className="fas fa-cog mr-2 text-purple-400"></i>
              画質設定
            </h3>
            
            {availableQualities.length > 0 ? (
              <>
                {/* Quality buttons - responsive grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-3 mb-3">
                  <button
                    onClick={() => handleQualityChange(-1)}
                    className={`px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg font-medium transition-all text-sm sm:text-base ${
                      currentQuality === -1
                        ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/50 scale-105'
                        : 'bg-gray-800 text-gray-300 hover:bg-gray-700 hover:scale-105'
                    }`}
                  >
                    <i className="fas fa-magic mr-1.5"></i>
                    自動
                  </button>
                  {availableQualities.map((quality) => (
                    <button
                      key={quality.level}
                      onClick={() => handleQualityChange(quality.level)}
                      className={`px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg font-medium transition-all text-sm sm:text-base ${
                        currentQuality === quality.level
                          ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/50 scale-105'
                          : 'bg-gray-800 text-gray-300 hover:bg-gray-700 hover:scale-105'
                      }`}
                    >
                      <i className="fas fa-video mr-1.5 text-xs"></i>
                      {quality.height}p
                    </button>
                  ))}
                </div>
                
                <div className="flex items-start gap-2 text-gray-500 text-xs sm:text-sm bg-gray-900/50 rounded-lg p-3">
                  <i className="fas fa-info-circle flex-shrink-0 mt-0.5"></i>
                  <p className="leading-relaxed">
                    画質を選択すると固定画質で再生されます。「自動」では通信環境に応じて最適な画質に自動調整されます。
                  </p>
                </div>
              </>
            ) : (
              <div className="flex items-start gap-3 text-gray-400 text-sm bg-gray-900/50 rounded-lg p-4">
                <i className="fas fa-magic text-purple-400 text-xl flex-shrink-0 mt-0.5"></i>
                <div>
                  <p className="font-medium text-white mb-1">自動画質調整中</p>
                  <p className="text-xs sm:text-sm leading-relaxed">
                    このストリームは自動的に最適な画質で再生されています。通信環境に応じてリアルタイムで画質が調整されます。
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    <i className="fas fa-info-circle mr-1"></i>
                    ブラウザ: {videoRef.current?.canPlayType('application/vnd.apple.mpegurl') ? 'Safari (ネイティブHLS)' : 'HLS.js'} | 
                    画質レベル: マニフェストから取得中...
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Tips Section - Optional, mobile friendly */}
          <div className="mt-4 sm:mt-6 bg-purple-900/20 backdrop-blur-md rounded-lg sm:rounded-xl border border-purple-500/30 p-4 sm:p-6">
            <h3 className="text-white font-bold text-base sm:text-lg mb-3 flex items-center">
              <i className="fas fa-lightbulb mr-2 text-yellow-400"></i>
              視聴のヒント
            </h3>
            <ul className="text-gray-300 text-xs sm:text-sm space-y-2">
              <li className="flex items-start">
                <i className="fas fa-check text-green-400 mr-2 mt-0.5 flex-shrink-0"></i>
                <span>画質は自動で最適化されます。手動で変更も可能です。</span>
              </li>
              <li className="flex items-start">
                <i className="fas fa-check text-green-400 mr-2 mt-0.5 flex-shrink-0"></i>
                <span>プレーヤーの全画面ボタンで没入感のある視聴体験をお楽しみください。</span>
              </li>
              <li className="flex items-start">
                <i className="fas fa-check text-green-400 mr-2 mt-0.5 flex-shrink-0"></i>
                <span>安定した通信環境（Wi-Fi推奨）での視聴を推奨します。</span>
              </li>
              <li className="flex items-start">
                <i className="fas fa-check text-green-400 mr-2 mt-0.5 flex-shrink-0"></i>
                <span>モバイルでは縦向き・横向きどちらでも快適に視聴できます。</span>
              </li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}
