// Watch page - Video player

let player = null;

async function initializePlayer() {
    const container = document.getElementById('watch-container');
    
    // Check if access token is provided
    if (!accessToken) {
        container.innerHTML = `
            <div class="max-w-4xl mx-auto px-4 py-12">
                <div class="bg-red-900 bg-opacity-20 border border-red-800 rounded-xl p-8 text-center">
                    <i class="fas fa-lock text-red-500 text-4xl mb-4"></i>
                    <h2 class="text-2xl font-bold text-white mb-2">アクセストークンが必要です</h2>
                    <p class="text-gray-300 mb-4">この配信を視聴するには、チケットを購入してください。</p>
                    <a href="/events" class="inline-block bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-lg transition">
                        <i class="fas fa-ticket-alt mr-2"></i>
                        チケットを購入する
                    </a>
                </div>
            </div>
        `;
        return;
    }
    
    try {
        // Verify access token
        const verifyResponse = await axios.post('/api/watch/verify', {
            token: accessToken
        });
        
        if (!verifyResponse.data.valid) {
            throw new Error('Invalid token');
        }
        
        const { event } = verifyResponse.data;
        
        // Get stream URL
        const streamResponse = await axios.post('/api/watch/stream-url', {
            token: accessToken,
            eventId: event.id
        });
        
        const { streamUrl, useSigned } = streamResponse.data;
        
        // Create video player
        container.innerHTML = `
            <div class="relative">
                <video id="video-player" 
                       class="video-js vjs-big-play-centered vjs-16-9 w-full"
                       controls
                       preload="auto"
                       data-setup='{}'>
                </video>
                
                <div class="max-w-7xl mx-auto px-4 py-6">
                    <h1 class="text-3xl font-bold text-white mb-2">${event.title}</h1>
                    <div class="flex items-center space-x-4 text-gray-400">
                        <span>
                            <i class="fas fa-${event.eventType === 'live' ? 'broadcast-tower' : 'archive'} mr-2"></i>
                            ${event.eventType === 'live' ? 'ライブ配信' : 'アーカイブ配信'}
                        </span>
                        ${event.status === 'live' ? '<span class="text-red-500"><i class="fas fa-circle animate-pulse mr-1"></i>配信中</span>' : ''}
                    </div>
                </div>
            </div>
        `;
        
        // Initialize Video.js player
        player = videojs('video-player', {
            controls: true,
            autoplay: false,
            preload: 'auto',
            fluid: true,
            aspectRatio: '16:9',
            sources: [{
                src: streamUrl,
                type: event.eventType === 'live' ? 'application/x-mpegURL' : 'application/x-mpegURL'
            }]
        });
        
        // Handle player errors
        player.on('error', function() {
            const error = player.error();
            console.error('Player error:', error);
            
            container.innerHTML = `
                <div class="max-w-4xl mx-auto px-4 py-12">
                    <div class="bg-red-900 bg-opacity-20 border border-red-800 rounded-xl p-8 text-center">
                        <i class="fas fa-exclamation-triangle text-red-500 text-4xl mb-4"></i>
                        <h2 class="text-2xl font-bold text-white mb-2">再生エラー</h2>
                        <p class="text-gray-300 mb-4">動画の再生中にエラーが発生しました。</p>
                        <p class="text-gray-400 text-sm mb-4">エラーコード: ${error ? error.code : 'Unknown'}</p>
                        <button onclick="location.reload()" class="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-lg transition">
                            <i class="fas fa-redo mr-2"></i>
                            再読み込み
                        </button>
                    </div>
                </div>
            `;
        });
        
        // Log player events
        player.on('loadstart', () => console.log('Loading video...'));
        player.on('canplay', () => console.log('Video ready to play'));
        player.on('playing', () => console.log('Video playing'));
        
    } catch (error) {
        console.error('Failed to initialize player:', error);
        
        container.innerHTML = `
            <div class="max-w-4xl mx-auto px-4 py-12">
                <div class="bg-red-900 bg-opacity-20 border border-red-800 rounded-xl p-8 text-center">
                    <i class="fas fa-exclamation-triangle text-red-500 text-4xl mb-4"></i>
                    <h2 class="text-2xl font-bold text-white mb-2">アクセスエラー</h2>
                    <p class="text-gray-300 mb-4">
                        ${error.response?.status === 401 
                            ? '無効または期限切れのアクセストークンです。'
                            : 'ストリームへのアクセスに失敗しました。'}
                    </p>
                    <a href="/events" class="inline-block bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-lg transition">
                        イベント一覧に戻る
                    </a>
                </div>
            </div>
        `;
    }
}

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (player) {
        player.dispose();
    }
});

// Initialize player on page load
initializePlayer();
