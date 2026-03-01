import { NextRequest, NextResponse } from 'next/server';
import { requireSuperAdmin } from '@/lib/adminAuthNew';
import { insert, getOne } from '@/lib/db';
import bcrypt from 'bcryptjs';

async function postHandler(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password, email, role, artistId } = body;

    // バリデーション
    if (!username || !password || !role) {
      return NextResponse.json(
        { error: 'Username, password, and role are required' },
        { status: 400 }
      );
    }

    if (role !== 'artist_admin') {
      return NextResponse.json(
        { error: 'Only artist_admin can be created through this API' },
        { status: 400 }
      );
    }

    if (!artistId) {
      return NextResponse.json(
        { error: 'Artist ID is required for artist_admin' },
        { status: 400 }
      );
    }

    // ユーザー名の重複チェック
    const existingAdmin = await getOne(
      'SELECT id FROM admins WHERE username = $1',
      [username]
    );

    if (existingAdmin) {
      return NextResponse.json(
        { error: 'Username already exists' },
        { status: 409 }
      );
    }

    // パスワードをハッシュ化
    const password_hash = await bcrypt.hash(password, 10);

    // 管理者を作成
    const admin = await insert(
      `INSERT INTO admins (username, password_hash, email, role, artist_id, is_active)
       VALUES ($1, $2, $3, $4, $5, true)
       RETURNING id, username, email, role, artist_id, is_active, created_at, updated_at`,
      [username, password_hash, email || null, role, artistId]
    );

    return NextResponse.json(admin, { status: 201 });
  } catch (error) {
    console.error('Create admin error:', error);
    return NextResponse.json(
      { error: 'Failed to create admin' },
      { status: 500 }
    );
  }
}

export const POST = requireSuperAdmin(postHandler);
