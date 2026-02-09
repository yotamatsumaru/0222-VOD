// Events listing page

let currentFilter = 'all';

async function loadEvents(status = null) {
    try {
        let url = '/api/events';
        if (status && status !== 'all') {
            url += `?status=${status}`;
        }

        const response = await axios.get(url);
        const events = response.data;
        
        const eventsContainer = document.getElementById('events-list');
        
        if (events.length === 0) {
            eventsContainer.innerHTML = `
                <div class="col-span-full text-center text-gray-400 py-8">
                    <i class="fas fa-calendar-times text-4xl mb-2"></i>
                    <p>イベントが見つかりません</p>
                </div>
            `;
            return;
        }
        
        eventsContainer.innerHTML = events.map(event => {
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
                <a href="/events/${event.slug}" class="block bg-black bg-opacity-40 backdrop-blur-md rounded-xl overflow-hidden border border-gray-800 hover:border-purple-500 transition transform hover:scale-105">
                    <div class="aspect-video bg-gray-800 relative">
                        <img src="${event.thumbnail_url || 'https://via.placeholder.com/800x450'}" 
                             alt="${event.title}" 
                             class="w-full h-full object-cover">
                        <div class="absolute top-2 right-2 ${statusColor} text-white px-3 py-1 rounded-full text-sm font-bold">
                            ${event.status === 'live' ? '<i class="fas fa-circle mr-1"></i>' : ''}
                            ${statusBadge}
                        </div>
                        ${event.event_type === 'archive' ? '<div class="absolute top-2 left-2 bg-black bg-opacity-70 text-white px-3 py-1 rounded-full text-sm"><i class="fas fa-archive mr-1"></i>アーカイブ</div>' : ''}
                    </div>
                    <div class="p-4">
                        <h3 class="text-white font-bold text-lg mb-2 line-clamp-1">${event.title}</h3>
                        <p class="text-gray-400 text-sm mb-2">
                            <i class="fas fa-clock mr-1"></i>
                            ${event.start_time ? new Date(event.start_time).toLocaleString('ja-JP', {
                                year: 'numeric',
                                month: '2-digit',
                                day: '2-digit',
                                hour: '2-digit',
                                minute: '2-digit'
                            }) : '日時未定'}
                        </p>
                        ${event.description ? `<p class="text-gray-500 text-sm line-clamp-2">${event.description}</p>` : ''}
                    </div>
                </a>
            `;
        }).join('');
    } catch (error) {
        console.error('Failed to load events:', error);
        document.getElementById('events-list').innerHTML = `
            <div class="col-span-full text-center text-red-400 py-8">
                <i class="fas fa-exclamation-triangle text-4xl mb-2"></i>
                <p>イベントの読み込みに失敗しました</p>
            </div>
        `;
    }
}

function filterEvents(status) {
    currentFilter = status;
    
    // Update button styles
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('bg-purple-600', 'active');
        btn.classList.add('bg-gray-800');
    });
    
    event.target.classList.remove('bg-gray-800');
    event.target.classList.add('bg-purple-600', 'active');
    
    // Reload events with filter
    loadEvents(status);
}

// Load events on page load
loadEvents();
