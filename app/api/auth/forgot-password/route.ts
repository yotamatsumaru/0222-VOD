import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { generatePasswordResetToken, generatePasswordResetEmail, sendEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { error: 'メールアドレスが必要です' },
        { status: 400 }
      );
    }

    // ユーザーの存在確認
    const result = await query('SELECT id, email, name FROM users WHERE email = $1', [email]);
    const users = result.rows;

    if (users.length === 0) {
      // セキュリティ上、ユーザーが存在しない場合でも成功レスポンスを返す
      return NextResponse.json({
        message: 'パスワードリセットメールを送信しました。メールをご確認ください。'
      });
    }

    const user = users[0];

    // パスワードリセットトークン生成
    const resetToken = generatePasswordResetToken(user.id, user.email);

    // メール送信
    const emailHtml = generatePasswordResetEmail(user.email, resetToken);
    const emailResult = await sendEmail(
      user.email,
      '【ストリーミングプラットフォーム】パスワードリセットのご案内',
      emailHtml
    );

    if (!emailResult.success) {
      console.error('Failed to send password reset email:', emailResult.error);
    }

    return NextResponse.json({
      message: 'パスワードリセットメールを送信しました。メールをご確認ください。'
    });

  } catch (error) {
    console.error('Password reset request error:', error);
    return NextResponse.json(
      { error: 'パスワードリセットのリクエストに失敗しました' },
      { status: 500 }
    );
  }
}
