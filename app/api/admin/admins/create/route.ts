import { NextRequest, NextResponse } from 'next/server';
import { requireSuperAdmin } from '@/lib/adminAuthNew';
import { insert, getOne } from '@/lib/db';
import bcrypt from 'bcryptjs';

async function postHandler(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password, email, role, artist_ids } = body;

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

    // 複数アーティスト対応: artist_ids配列が必要
    if (!artist_ids || !Array.isArray(artist_ids) || artist_ids.length === 0) {
      return NextResponse.json(
        { error: 'At least one artist ID is required for artist_admin (artist_ids must be an array)' },
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

    // 管理者を作成（artist_idはNULL、後方互換性のため残す）
    const admin = await insert(
      `INSERT INTO admins (username, password_hash, email, role, artist_id, is_active)
       VALUES ($1, $2, $3, $4, NULL, true)
       RETURNING id, username, email, role, artist_id, is_active, created_at, updated_at`,
      [username, password_hash, email || null, role]
    );

    // admin_artists テーブルに複数アーティストを登録
    for (const artistId of artist_ids) {
      await insert(
        `INSERT INTO admin_artists (admin_id, artist_id, created_at)
         VALUES ($1, $2, CURRENT_TIMESTAMP)`,
        [admin.id, artistId]
      );
    }

    // admin_with_artists ビューから完全な情報を取得
    const fullAdmin = await getOne(
      `SELECT id, username, email, role, artist_id, is_active, created_at, updated_at,
              artist_ids, artist_names
       FROM admin_with_artists
       WHERE id = $1`,
      [admin.id]
    );

    return NextResponse.json(fullAdmin || admin, { status: 201 });
  } catch (error) {
    console.error('Create admin error:', error);
    return NextResponse.json(
      { error: 'Failed to create admin' },
      { status: 500 }
    );
  }
}

export const POST = requireSuperAdmin(postHandler);
