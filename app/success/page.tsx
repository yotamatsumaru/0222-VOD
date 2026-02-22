import { Suspense } from 'react';
import SuccessContent from '@/components/SuccessContent';
import Navigation from '@/components/Navigation';

export default function SuccessPage() {
  return (
    <>
      <Navigation />
      
      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Suspense fallback={
          <div className="text-center text-gray-400 py-8">
            <i className="fas fa-spinner fa-spin text-4xl mb-2"></i>
            <p>読み込み中...</p>
          </div>
        }>
          <SuccessContent />
        </Suspense>
      </main>
    </>
  );
}
