// Admin panel JavaScript

let authToken = null;

// Check if user is logged in
function checkAuth() {
    authToken = localStorage.getItem('admin_auth');
    
    if (authToken) {
        document.getElementById('login-section').classList.add('hidden');
        document.getElementById('admin-content').classList.remove('hidden');
        loadDashboard();
    } else {
        document.getElementById('login-section').classList.remove('hidden');
        document.getElementById('admin-content').classList.add('hidden');
    }
}

// Login form handler
document.getElementById('login-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    // Create Basic Auth token
    const token = btoa(`${username}:${password}`);
    
    try {
        // Test authentication
        const response = await axios.get('/api/admin/stats', {
            headers: {
                'Authorization': `Basic ${token}`
            }
        });
        
        // Success - save token
        localStorage.setItem('admin_auth', token);
        authToken = token;
        
        document.getElementById('login-section').classList.add('hidden');
        document.getElementById('admin-content').classList.remove('hidden');
        
        loadDashboard();
    } catch (error) {
        const errorDiv = document.getElementById('login-error');
        errorDiv.textContent = 'ログインに失敗しました。ユーザー名とパスワードを確認してください。';
        errorDiv.classList.remove('hidden');
    }
});

// Logout
document.getElementById('logout-btn')?.addEventListener('click', () => {
    localStorage.removeItem('admin_auth');
    authToken = null;
    checkAuth();
});

// API helper with auth
async function adminAPI(method, url, data = null) {
    const config = {
        method: method,
        url: url,
        headers: {
            'Authorization': `Basic ${authToken}`
        }
    };
    
    if (data) {
        config.data = data;
    }
    
    try {
        return await axios(config);
    } catch (error) {
        if (error.response?.status === 401) {
            // Auth failed - logout
            localStorage.removeItem('admin_auth');
            authToken = null;
            checkAuth();
        }
        throw error;
    }
}

// Switch tabs
function switchTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active', 'text-white', 'border-purple-500');
        btn.classList.add('text-gray-400', 'border-transparent');
    });
    
    event.target.classList.add('active', 'text-white', 'border-purple-500');
    event.target.classList.remove('text-gray-400', 'border-transparent');
    
    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.add('hidden');
    });
    
    document.getElementById(`tab-${tabName}`).classList.remove('hidden');
    
    // Load content based on tab
    switch(tabName) {
        case 'stats':
            loadStats();
            break;
        case 'events':
            loadEvents();
            break;
        case 'artists':
            loadArtists();
            break;
        case 'purchases':
            loadPurchases();
            break;
    }
}

// Load dashboard
function loadDashboard() {
    loadStats();
}

// Load stats
async function loadStats() {
    try {
        const response = await adminAPI('get', '/api/admin/stats');
        const stats = response.data;
        
        const container = document.getElementById('stats-content');
        container.innerHTML = `
            <div class="grid md:grid-cols-3 gap-6 mb-8">
                <div class="bg-black bg-opacity-40 backdrop-blur-md rounded-xl p-6 border border-gray-800">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-gray-400 text-sm">総売上</p>
                            <p class="text-3xl font-bold text-white mt-2">¥${(stats.total_revenue / 100).toLocaleString()}</p>
                        </div>
                        <i class="fas fa-yen-sign text-4xl text-green-500"></i>
                    </div>
                </div>
                
                <div class="bg-black bg-opacity-40 backdrop-blur-md rounded-xl p-6 border border-gray-800">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-gray-400 text-sm">総購入数</p>
                            <p class="text-3xl font-bold text-white mt-2">${stats.total_purchases}</p>
                        </div>
                        <i class="fas fa-shopping-cart text-4xl text-blue-500"></i>
                    </div>
                </div>
                
                <div class="bg-black bg-opacity-40 backdrop-blur-md rounded-xl p-6 border border-gray-800">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-gray-400 text-sm">平均単価</p>
                            <p class="text-3xl font-bold text-white mt-2">¥${stats.total_purchases > 0 ? Math.round(stats.total_revenue / stats.total_purchases / 100).toLocaleString() : 0}</p>
                        </div>
                        <i class="fas fa-chart-line text-4xl text-purple-500"></i>
                    </div>
                </div>
            </div>
            
            <div class="bg-black bg-opacity-40 backdrop-blur-md rounded-xl p-6 border border-gray-800">
                <h3 class="text-xl font-bold text-white mb-4">イベント別売上</h3>
                <div class="overflow-x-auto">
                    <table class="w-full">
                        <thead>
                            <tr class="text-left text-gray-400 border-b border-gray-700">
                                <th class="pb-3">イベント名</th>
                                <th class="pb-3">購入数</th>
                                <th class="pb-3">売上</th>
                            </tr>
                        </thead>
                        <tbody class="text-gray-300">
                            ${stats.events.map(event => `
                                <tr class="border-b border-gray-800">
                                    <td class="py-3">${event.title}</td>
                                    <td class="py-3">${event.purchase_count || 0}</td>
                                    <td class="py-3">¥${((event.revenue || 0) / 100).toLocaleString()}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    } catch (error) {
        console.error('Failed to load stats:', error);
    }
}

// Load events
async function loadEvents() {
    try {
        const response = await adminAPI('get', '/api/admin/events');
        const events = response.data;
        
        const container = document.getElementById('events-content');
        container.innerHTML = `
            <div class="space-y-4">
                ${events.map(event => `
                    <div class="bg-black bg-opacity-40 backdrop-blur-md rounded-xl p-6 border border-gray-800">
                        <div class="flex justify-between items-start">
                            <div class="flex-1">
                                <h3 class="text-xl font-bold text-white mb-2">${event.title}</h3>
                                <p class="text-gray-400 mb-4">${event.description || ''}</p>
                                <div class="flex space-x-4 text-sm text-gray-500">
                                    <span><i class="fas fa-calendar mr-1"></i>${event.start_time || 'TBD'}</span>
                                    <span><i class="fas fa-${event.event_type === 'live' ? 'broadcast-tower' : 'archive'} mr-1"></i>${event.event_type}</span>
                                    <span class="px-2 py-1 rounded ${
                                        event.status === 'live' ? 'bg-red-600' :
                                        event.status === 'upcoming' ? 'bg-blue-600' :
                                        event.status === 'archived' ? 'bg-purple-600' :
                                        'bg-gray-600'
                                    } text-white">${event.status}</span>
                                </div>
                            </div>
                            <div class="flex space-x-2">
                                <select onchange="updateEventStatus(${event.id}, this.value)" class="bg-gray-900 text-white px-3 py-2 rounded border border-gray-700">
                                    <option value="upcoming" ${event.status === 'upcoming' ? 'selected' : ''}>Upcoming</option>
                                    <option value="live" ${event.status === 'live' ? 'selected' : ''}>Live</option>
                                    <option value="ended" ${event.status === 'ended' ? 'selected' : ''}>Ended</option>
                                    <option value="archived" ${event.status === 'archived' ? 'selected' : ''}>Archived</option>
                                </select>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    } catch (error) {
        console.error('Failed to load events:', error);
    }
}

// Update event status
async function updateEventStatus(eventId, status) {
    try {
        await adminAPI('patch', `/api/admin/events/${eventId}/status`, { status });
        alert('イベントステータスを更新しました');
        loadEvents();
    } catch (error) {
        console.error('Failed to update event status:', error);
        alert('更新に失敗しました');
    }
}

// Load artists
async function loadArtists() {
    try {
        const response = await adminAPI('get', '/api/admin/artists');
        const artists = response.data;
        
        const container = document.getElementById('artists-content');
        container.innerHTML = `
            <div class="grid md:grid-cols-3 gap-6">
                ${artists.map(artist => `
                    <div class="bg-black bg-opacity-40 backdrop-blur-md rounded-xl overflow-hidden border border-gray-800">
                        <div class="aspect-square bg-gray-800">
                            <img src="${artist.image_url || 'https://via.placeholder.com/400x400'}" 
                                 alt="${artist.name}" 
                                 class="w-full h-full object-cover">
                        </div>
                        <div class="p-4">
                            <h3 class="text-white font-bold text-lg">${artist.name}</h3>
                            <p class="text-gray-400 text-sm mt-1">${artist.description || ''}</p>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    } catch (error) {
        console.error('Failed to load artists:', error);
    }
}

// Load purchases
async function loadPurchases() {
    try {
        const response = await adminAPI('get', '/api/admin/purchases');
        const purchases = response.data;
        
        const container = document.getElementById('purchases-content');
        container.innerHTML = `
            <div class="bg-black bg-opacity-40 backdrop-blur-md rounded-xl p-6 border border-gray-800">
                <div class="overflow-x-auto">
                    <table class="w-full">
                        <thead>
                            <tr class="text-left text-gray-400 border-b border-gray-700">
                                <th class="pb-3">購入日時</th>
                                <th class="pb-3">顧客</th>
                                <th class="pb-3">イベント</th>
                                <th class="pb-3">チケット</th>
                                <th class="pb-3">金額</th>
                                <th class="pb-3">ステータス</th>
                            </tr>
                        </thead>
                        <tbody class="text-gray-300">
                            ${purchases.map(purchase => `
                                <tr class="border-b border-gray-800">
                                    <td class="py-3">${new Date(purchase.purchased_at).toLocaleString('ja-JP')}</td>
                                    <td class="py-3">${purchase.customer_email}</td>
                                    <td class="py-3">${purchase.event_title}</td>
                                    <td class="py-3">${purchase.ticket_name}</td>
                                    <td class="py-3">¥${(purchase.amount / 100).toLocaleString()}</td>
                                    <td class="py-3">
                                        <span class="px-2 py-1 rounded text-xs ${
                                            purchase.status === 'completed' ? 'bg-green-600' :
                                            purchase.status === 'pending' ? 'bg-yellow-600' :
                                            'bg-gray-600'
                                        } text-white">${purchase.status}</span>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    } catch (error) {
        console.error('Failed to load purchases:', error);
    }
}

// Show create event modal (placeholder)
function showCreateEventModal() {
    alert('イベント作成機能は開発中です。データベースに直接挿入するか、APIを使用してください。');
}

// Show create artist modal (placeholder)
function showCreateArtistModal() {
    alert('アーティスト作成機能は開発中です。データベースに直接挿入するか、APIを使用してください。');
}

// Initialize
checkAuth();
