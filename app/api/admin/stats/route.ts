import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/adminAuth';
import { getOne } from '@/lib/db';

async function handler(request: NextRequest) {
  try {
    // Get total revenue
    const revenueResult = await getOne<{ total_revenue: number }>(
      `SELECT COALESCE(SUM(amount), 0) as total_revenue 
       FROM purchases 
       WHERE status = 'completed'`
    );

    // Get total purchases
    const purchasesResult = await getOne<{ total_purchases: number }>(
      `SELECT COUNT(*) as total_purchases 
       FROM purchases 
       WHERE status = 'completed'`
    );

    // Get total events
    const eventsResult = await getOne<{ total_events: number }>(
      'SELECT COUNT(*) as total_events FROM events'
    );

    // Get total artists
    const artistsResult = await getOne<{ total_artists: number }>(
      'SELECT COUNT(*) as total_artists FROM artists'
    );

    // Get recent purchases (last 10)
    const recentPurchases = await getOne(
      `SELECT 
        p.id,
        p.customer_email,
        p.customer_name,
        p.amount,
        p.currency,
        p.purchased_at,
        e.title as event_title,
        t.name as ticket_name
       FROM purchases p
       LEFT JOIN events e ON p.event_id = e.id
       LEFT JOIN tickets t ON p.ticket_id = t.id
       WHERE p.status = 'completed'
       ORDER BY p.purchased_at DESC
       LIMIT 10`
    );

    // Get event sales breakdown
    const eventSales = await getOne(
      `SELECT 
        e.id,
        e.title,
        COUNT(p.id) as purchase_count,
        COALESCE(SUM(p.amount), 0) as total_revenue
       FROM events e
       LEFT JOIN purchases p ON e.id = p.event_id AND p.status = 'completed'
       GROUP BY e.id, e.title
       ORDER BY total_revenue DESC
       LIMIT 10`
    );

    return NextResponse.json({
      totalRevenue: revenueResult?.total_revenue || 0,
      totalPurchases: purchasesResult?.total_purchases || 0,
      totalEvents: eventsResult?.total_events || 0,
      totalArtists: artistsResult?.total_artists || 0,
      recentPurchases: recentPurchases || [],
      eventSales: eventSales || [],
    });
  } catch (error: any) {
    console.error('Admin stats error:', {
      message: error.message,
      code: error.code,
      stack: error.stack
    });
    
    // エラー時もデフォルト値を返す（画面が壊れないように）
    return NextResponse.json({
      totalRevenue: 0,
      totalPurchases: 0,
      totalEvents: 0,
      totalArtists: 0,
      recentPurchases: [],
      eventSales: [],
      error: 'データベース接続エラー。統計情報を取得できませんでした。',
    });
  }
}

export const GET = requireAuth(handler);
