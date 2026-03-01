import { NextRequest, NextResponse } from 'next/server';
import { requireSuperAdmin } from '@/lib/adminAuthNew';
import { getAll } from '@/lib/db';

async function getHandler(request: NextRequest) {
  try {
    const admins = await getAll(
      `SELECT 
        a.id,
        a.username,
        a.email,
        a.role,
        a.is_active,
        a.artist_id,
        ar.name as artist_name,
        ar.slug as artist_slug,
        a.created_at,
        a.updated_at
      FROM admins a
      LEFT JOIN artists ar ON a.artist_id = ar.id
      ORDER BY a.created_at DESC`
    );

    return NextResponse.json(admins);
  } catch (error) {
    console.error('Get admins error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch admins' },
      { status: 500 }
    );
  }
}

export const GET = requireSuperAdmin(getHandler);
