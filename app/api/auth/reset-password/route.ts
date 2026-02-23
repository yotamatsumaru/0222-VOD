import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyPasswordResetToken } from '@/lib/email';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, newPassword } = body;

    if (!token || !newPassword) {
      return NextResponse.json(
        { error: 'トークンと新しいパスワードが必要です' },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: 'パスワードは6文字以上である必要があります' },
        { status: 400 }
      );
    }

    // トークン検証
    const payload = verifyPasswordResetToken(token);
    
    if (!payload) {
      return NextResponse.json(
        { error: 'トークンが無効または期限切れです' },
        { status: 400 }
      );
    }

    // 新しいパスワードをハッシュ化
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // パスワード更新
    await query(
      'UPDATE users SET password_hash = $1 WHERE id = $2',
      [hashedPassword, payload.userId]
    );

    return NextResponse.json({
      message: 'パスワードが正常にリセットされました'
    });

  } catch (error) {
    console.error('Password reset error:', error);
    return NextResponse.json(
      { error: 'パスワードのリセットに失敗しました' },
      { status: 500 }
    );
  }
}
