'use client';

import Link from 'next/link';
import { useState } from 'react';

export default function Navigation() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="bg-black bg-opacity-50 backdrop-blur-md border-b border-gray-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center">
            <i className="fas fa-broadcast-tower text-purple-500 text-2xl mr-3"></i>
            <Link
              href="/"
              className="text-white text-xl font-bold hover:text-purple-400 transition"
            >
              StreamingPlatform
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex space-x-4">
            <Link
              href="/"
              className="text-gray-300 hover:text-white px-3 py-2 transition"
            >
              ホーム
            </Link>
            <Link
              href="/artists"
              className="text-gray-300 hover:text-white px-3 py-2 transition"
            >
              アーティスト
            </Link>
            <Link
              href="/events"
              className="text-gray-300 hover:text-white px-3 py-2 transition"
            >
              イベント
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden text-white p-2 hover:text-purple-400 transition"
          >
            {mobileMenuOpen ? (
              <i className="fas fa-times text-2xl"></i>
            ) : (
              <i className="fas fa-bars text-2xl"></i>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-black bg-opacity-95 border-t border-gray-800">
          <div className="px-4 py-3 space-y-1">
            <Link
              href="/"
              className="block text-white px-3 py-2 rounded hover:bg-purple-600 transition"
              onClick={() => setMobileMenuOpen(false)}
            >
              <i className="fas fa-home mr-2"></i>ホーム
            </Link>
            <Link
              href="/artists"
              className="block text-gray-300 hover:text-white px-3 py-2 rounded hover:bg-gray-800 transition"
              onClick={() => setMobileMenuOpen(false)}
            >
              <i className="fas fa-users mr-2"></i>アーティスト
            </Link>
            <Link
              href="/events"
              className="block text-gray-300 hover:text-white px-3 py-2 rounded hover:bg-gray-800 transition"
              onClick={() => setMobileMenuOpen(false)}
            >
              <i className="fas fa-calendar-alt mr-2"></i>イベント
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
