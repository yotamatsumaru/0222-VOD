// Success page - After Stripe checkout

async function loadSuccessInfo() {
    const container = document.getElementById('success-content');
    
    if (!sessionId) {
        container.innerHTML = `
            <div class="bg-red-900 bg-opacity-20 border border-red-800 rounded-xl p-8 text-center">
                <i class="fas fa-exclamation-triangle text-red-500 text-4xl mb-4"></i>
                <h2 class="text-2xl font-bold text-white mb-2">エラー</h2>
                <p class="text-gray-300">セッションIDが見つかりません</p>
                <a href="/" class="inline-block mt-4 bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-6 rounded-lg transition">
                    ホームに戻る
                </a>
            </div>
        `;
        return;
    }
    
    try {
        // Get session status
        const response = await axios.get(`/api/stripe/checkout/${sessionId}`);
        const { status, customerEmail, purchase } = response.data;
        
        if (status === 'paid' && purchase) {
            // Success!
            container.innerHTML = `
                <div class="bg-green-900 bg-opacity-20 border border-green-800 rounded-xl p-8">
                    <div class="text-center mb-6">
                        <i class="fas fa-check-circle text-green-500 text-6xl mb-4"></i>
                        <h2 class="text-3xl font-bold text-white mb-2">購入完了！</h2>
                        <p class="text-gray-300">チケットの購入が完了しました</p>
                    </div>
                    
                    <div class="bg-black bg-opacity-40 rounded-lg p-6 mb-6">
                        <h3 class="text-xl font-bold text-white mb-4">購入情報</h3>
                        <div class="space-y-2 text-gray-300">
                            <p>
                                <i class="fas fa-envelope mr-2 text-purple-500"></i>
                                メールアドレス: <span class="text-white">${customerEmail || 'N/A'}</span>
                            </p>
                            <p>
                                <i class="fas fa-ticket-alt mr-2 text-purple-500"></i>
                                チケットID: <span class="text-white">#${purchase.id}</span>
                            </p>
                            <p>
                                <i class="fas fa-calendar-alt mr-2 text-purple-500"></i>
                                購入日時: <span class="text-white">${new Date(purchase.purchased_at).toLocaleString('ja-JP')}</span>
                            </p>
                        </div>
                    </div>
                    
                    <div class="bg-blue-900 bg-opacity-20 border border-blue-800 rounded-lg p-6 mb-6">
                        <h3 class="text-lg font-bold text-white mb-3">
                            <i class="fas fa-key text-blue-500 mr-2"></i>
                            視聴用アクセストークン
                        </h3>
                        <div class="bg-black bg-opacity-60 rounded p-3 mb-3">
                            <code class="text-green-400 text-sm break-all">${purchase.access_token}</code>
                        </div>
                        <p class="text-gray-400 text-sm mb-3">
                            <i class="fas fa-info-circle mr-1"></i>
                            このトークンは視聴ページで自動的に使用されます。保存する必要はありません。
                        </p>
                        ${purchase.access_expires_at ? `
                            <p class="text-gray-500 text-sm">
                                有効期限: ${new Date(purchase.access_expires_at).toLocaleString('ja-JP')}
                            </p>
                        ` : ''}
                    </div>
                    
                    <div class="bg-yellow-900 bg-opacity-20 border border-yellow-800 rounded-lg p-4 mb-6">
                        <p class="text-yellow-300 text-sm">
                            <i class="fas fa-exclamation-triangle mr-2"></i>
                            購入確認メールが ${customerEmail} に送信されます。メールに記載された視聴用URLから配信をご視聴いただけます。
                        </p>
                    </div>
                    
                    <div class="flex justify-center space-x-4">
                        <a href="/events" class="bg-gray-800 hover:bg-gray-700 text-white font-bold py-3 px-6 rounded-lg transition">
                            <i class="fas fa-list mr-2"></i>
                            イベント一覧
                        </a>
                        ${purchase.event_id ? `
                            <a href="/watch/${purchase.event_id}?token=${purchase.access_token}" 
                               class="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-lg transition">
                                <i class="fas fa-play mr-2"></i>
                                視聴ページへ
                            </a>
                        ` : ''}
                    </div>
                </div>
            `;
        } else if (status === 'unpaid') {
            // Payment failed
            container.innerHTML = `
                <div class="bg-yellow-900 bg-opacity-20 border border-yellow-800 rounded-xl p-8 text-center">
                    <i class="fas fa-exclamation-circle text-yellow-500 text-4xl mb-4"></i>
                    <h2 class="text-2xl font-bold text-white mb-2">決済が完了していません</h2>
                    <p class="text-gray-300 mb-4">決済処理中、またはキャンセルされました。</p>
                    <a href="/events" class="inline-block bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-lg transition">
                        イベント一覧に戻る
                    </a>
                </div>
            `;
        } else {
            // Unknown status
            container.innerHTML = `
                <div class="bg-gray-900 bg-opacity-40 border border-gray-800 rounded-xl p-8 text-center">
                    <i class="fas fa-question-circle text-gray-500 text-4xl mb-4"></i>
                    <h2 class="text-2xl font-bold text-white mb-2">処理中...</h2>
                    <p class="text-gray-300 mb-4">決済処理を確認しています。しばらくお待ちください。</p>
                    <button onclick="location.reload()" class="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-lg transition">
                        <i class="fas fa-redo mr-2"></i>
                        更新
                    </button>
                </div>
            `;
        }
    } catch (error) {
        console.error('Failed to load success info:', error);
        
        container.innerHTML = `
            <div class="bg-red-900 bg-opacity-20 border border-red-800 rounded-xl p-8 text-center">
                <i class="fas fa-exclamation-triangle text-red-500 text-4xl mb-4"></i>
                <h2 class="text-2xl font-bold text-white mb-2">エラー</h2>
                <p class="text-gray-300 mb-4">購入情報の取得に失敗しました</p>
                <div class="flex justify-center space-x-4">
                    <button onclick="location.reload()" class="bg-gray-800 hover:bg-gray-700 text-white font-bold py-2 px-6 rounded-lg transition">
                        <i class="fas fa-redo mr-2"></i>
                        再試行
                    </button>
                    <a href="/events" class="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-6 rounded-lg transition">
                        イベント一覧
                    </a>
                </div>
            </div>
        `;
    }
}

// Load success info on page load
loadSuccessInfo();
