// Artist detail page

async function loadArtistDetail() {
    try {
        const response = await axios.get(`/api/artists/${artistSlug}`);
        const artist = response.data;
        
        const container = document.getElementById('artist-detail');
        
        container.innerHTML = `
            <div class="bg-black bg-opacity-40 backdrop-blur-md rounded-xl overflow-hidden border border-gray-800 mb-8">
                <div class="grid md:grid-cols-3 gap-0">
                    <div class="aspect-square bg-gray-800">
                        <img src="${artist.image_url || 'https://via.placeholder.com/800x800'}" 
                             alt="${artist.name}" 
                             class="w-full h-full object-cover">
                    </div>
                    <div class="md:col-span-2 p-8">
                        <h1 class="text-4xl font-bold text-white mb-4">${artist.name}</h1>
                        ${artist.description ? `
                            <p class="text-gray-300 text-lg whitespace-pre-line">${artist.description}</p>
                        ` : ''}
                    </div>
                </div>
            </div>
            
            <div>
                <h2 class="text-3xl font-bold text-white mb-6">
                    <i class="fas fa-calendar-alt text-purple-500 mr-2"></i>
                    イベント
                </h2>
                
                ${artist.events && artist.events.length > 0 ? `
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        ${artist.events.map(event => {
                            let statusBadge = '';
                            let statusColor = 'bg-gray-600';
                            
                            switch(event.status) {
                                case 'upcoming':
                                    statusBadge = 'UPCOMING';
                                    statusColor = 'bg-blue-600';
                                    break;
                                case 'live':
                                    statusBadge = 'LIVE';
                                    statusColor = 'bg-red-600 animate-pulse';
                                    break;
                                case 'ended':
                                    statusBadge = 'ENDED';
                                    statusColor = 'bg-gray-600';
                                    break;
                                case 'archived':
                                    statusBadge = 'ARCHIVE';
                                    statusColor = 'bg-purple-600';
                                    break;
                            }
                            
                            return `
                                <a href="/events/${event.slug}" class="block bg-black bg-opacity-40 backdrop-blur-md rounded-xl overflow-hidden border border-gray-800 hover:border-purple-500 transition">
                                    <div class="aspect-video bg-gray-800 relative">
                                        <img src="${event.thumbnail_url || 'https://via.placeholder.com/800x450'}" 
                                             alt="${event.title}" 
                                             class="w-full h-full object-cover">
                                        <div class="absolute top-2 right-2 ${statusColor} text-white px-3 py-1 rounded-full text-sm font-bold">
                                            ${event.status === 'live' ? '<i class="fas fa-circle mr-1"></i>' : ''}
                                            ${statusBadge}
                                        </div>
                                    </div>
                                    <div class="p-4">
                                        <h3 class="text-white font-bold text-lg mb-2">${event.title}</h3>
                                        <p class="text-gray-400 text-sm">
                                            <i class="fas fa-clock mr-1"></i>
                                            ${event.start_time ? new Date(event.start_time).toLocaleString('ja-JP') : '日時未定'}
                                        </p>
                                    </div>
                                </a>
                            `;
                        }).join('')}
                    </div>
                ` : `
                    <div class="text-center text-gray-400 py-8 bg-black bg-opacity-40 backdrop-blur-md rounded-xl border border-gray-800">
                        <i class="fas fa-calendar-times text-4xl mb-2"></i>
                        <p>現在、イベントはありません</p>
                    </div>
                `}
            </div>
        `;
    } catch (error) {
        console.error('Failed to load artist:', error);
        document.getElementById('artist-detail').innerHTML = `
            <div class="bg-red-900 bg-opacity-20 border border-red-800 rounded-xl p-8 text-center">
                <i class="fas fa-exclamation-triangle text-red-500 text-4xl mb-4"></i>
                <h2 class="text-2xl font-bold text-white mb-2">エラー</h2>
                <p class="text-gray-300">アーティスト情報の読み込みに失敗しました</p>
                <a href="/artists" class="inline-block mt-4 bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-6 rounded-lg transition">
                    アーティスト一覧に戻る
                </a>
            </div>
        `;
    }
}

// Load artist detail on page load
loadArtistDetail();
