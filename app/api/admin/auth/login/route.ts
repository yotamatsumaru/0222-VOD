import { NextRequest, NextResponse } from 'next/server';
import { authenticateAdmin } from '@/lib/adminAuthNew';
import { getOne } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      );
    }

    const result = await authenticateAdmin(username, password);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid username or password' },
        { status: 401 }
      );
    }

    // Artist Adminの場合、アーティスト名を取得
    let artistName: string | undefined;
    if (result.admin?.artist_id) {
      const artist = await getOne<{ name: string }>(
        'SELECT name FROM artists WHERE id = $1',
        [result.admin.artist_id]
      );
      artistName = artist?.name;
    }

    return NextResponse.json({
      success: true,
      token: result.token,
      role: result.role,
      admin: {
        id: result.admin?.id,
        username: result.admin?.username,
        role: result.role,
        email: result.admin?.email,
        artist_id: result.admin?.artist_id,
        artist_name: artistName,
      },
    });
  } catch (error) {
    console.error('Admin login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
