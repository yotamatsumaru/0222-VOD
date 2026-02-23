'use client';

export default function MyPageTest() {
  console.log('[MyPageTest] Component rendered!');
  
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-white mb-4">MyPage Test</h1>
        <p className="text-white">このページが表示されていれば、ルーティングは動作しています。</p>
        <p className="text-white mt-4">ブラウザコンソールを確認してください。</p>
      </div>
    </div>
  );
}
