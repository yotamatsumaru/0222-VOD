// Artists listing page

async function loadArtists() {
    try {
        const response = await axios.get('/api/artists');
        const artists = response.data;
        
        const artistsContainer = document.getElementById('artists-list');
        
        if (artists.length === 0) {
            artistsContainer.innerHTML = `
                <div class="col-span-full text-center text-gray-400 py-8">
                    <i class="fas fa-user-slash text-4xl mb-2"></i>
                    <p>アーティストが見つかりません</p>
                </div>
            `;
            return;
        }
        
        artistsContainer.innerHTML = artists.map(artist => `
            <a href="/artists/${artist.slug}" class="block bg-black bg-opacity-40 backdrop-blur-md rounded-xl overflow-hidden border border-gray-800 hover:border-purple-500 transition transform hover:scale-105">
                <div class="aspect-square bg-gray-800 relative">
                    <img src="${artist.image_url || 'https://via.placeholder.com/400x400'}" 
                         alt="${artist.name}" 
                         class="w-full h-full object-cover">
                </div>
                <div class="p-4">
                    <h3 class="text-white font-bold text-lg text-center">${artist.name}</h3>
                </div>
            </a>
        `).join('');
    } catch (error) {
        console.error('Failed to load artists:', error);
        document.getElementById('artists-list').innerHTML = `
            <div class="col-span-full text-center text-red-400 py-8">
                <i class="fas fa-exclamation-triangle text-4xl mb-2"></i>
                <p>アーティストの読み込みに失敗しました</p>
            </div>
        `;
    }
}

// Load artists on page load
loadArtists();
