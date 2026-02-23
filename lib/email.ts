import jwt from 'jsonwebtoken';
import { query } from './db';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key';

// メール送信用のトークン生成（パスワードリセット用）
export function generatePasswordResetToken(userId: number, email: string): string {
  return jwt.sign(
    { userId, email, type: 'password_reset' },
    JWT_SECRET,
    { expiresIn: '1h' } // 1時間有効
  );
}

// パスワードリセットトークンの検証
export function verifyPasswordResetToken(token: string): { userId: number; email: string } | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    if (decoded.type !== 'password_reset') {
      return null;
    }
    return { userId: decoded.userId, email: decoded.email };
  } catch {
    return null;
  }
}

// メールテンプレート生成
export function generateWelcomeEmail(name: string, email: string): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
    .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
    .footer { text-align: center; margin-top: 30px; color: #999; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎉 ご登録ありがとうございます！</h1>
    </div>
    <div class="content">
      <p>こんにちは、${name || email}さん</p>
      
      <p>ストリーミングプラットフォームへのご登録ありがとうございます。</p>
      
      <p>これからライブ配信やアーカイブ動画をお楽しみいただけます。</p>
      
      <div style="text-align: center;">
        <a href="${appUrl}/events" class="button">イベント一覧を見る</a>
      </div>
      
      <h3>📝 ご利用方法</h3>
      <ol>
        <li>イベントページで興味のあるイベントを選択</li>
        <li>チケットを購入</li>
        <li>マイページから視聴リンクにアクセス</li>
      </ol>
      
      <p>ご不明な点がございましたら、お気軽にお問い合わせください。</p>
    </div>
    <div class="footer">
      <p>このメールは自動送信されています。</p>
      <p>&copy; 2026 Streaming Platform. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

export function generatePurchaseConfirmationEmail(
  userName: string,
  email: string,
  eventTitle: string,
  ticketName: string,
  amount: number,
  currency: string,
  accessToken: string,
  eventSlug: string
): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const watchUrl = `${appUrl}/watch/${eventSlug}?token=${accessToken}`;
  const price = new Intl.NumberFormat('ja-JP', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(amount / 100);
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
    .ticket-info { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea; }
    .button { display: inline-block; background: #667eea; color: white; padding: 15px 40px; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold; }
    .footer { text-align: center; margin-top: 30px; color: #999; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>✅ ご購入ありがとうございます</h1>
    </div>
    <div class="content">
      <p>こんにちは、${userName || email}さん</p>
      
      <p>チケットのご購入が完了しました。</p>
      
      <div class="ticket-info">
        <h3>📋 購入内容</h3>
        <table style="width: 100%;">
          <tr>
            <td><strong>イベント名:</strong></td>
            <td>${eventTitle}</td>
          </tr>
          <tr>
            <td><strong>チケット:</strong></td>
            <td>${ticketName}</td>
          </tr>
          <tr>
            <td><strong>金額:</strong></td>
            <td>${price}</td>
          </tr>
        </table>
      </div>
      
      <div style="text-align: center; background: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3>🎬 視聴ページはこちら</h3>
        <a href="${watchUrl}" class="button">視聴ページを開く</a>
        <p style="font-size: 12px; color: #856404; margin-top: 10px;">
          ⚠️ このリンクは30日間有効です
        </p>
      </div>
      
      <p>マイページからも視聴リンクにアクセスできます：<br>
      <a href="${appUrl}/mypage">${appUrl}/mypage</a></p>
      
      <p>素晴らしい視聴体験をお楽しみください！</p>
    </div>
    <div class="footer">
      <p>このメールは自動送信されています。</p>
      <p>&copy; 2026 Streaming Platform. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

export function generatePasswordResetEmail(
  email: string,
  resetToken: string
): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const resetUrl = `${appUrl}/reset-password?token=${resetToken}`;
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
    .warning { background: #fff3cd; border: 1px solid #ffc107; padding: 15px; border-radius: 5px; margin: 20px 0; }
    .button { display: inline-block; background: #667eea; color: white; padding: 15px 40px; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold; }
    .footer { text-align: center; margin-top: 30px; color: #999; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🔐 パスワードリセット</h1>
    </div>
    <div class="content">
      <p>こんにちは、</p>
      
      <p>パスワードリセットのリクエストを受け付けました。</p>
      
      <p>以下のボタンをクリックして、新しいパスワードを設定してください：</p>
      
      <div style="text-align: center;">
        <a href="${resetUrl}" class="button">パスワードをリセット</a>
      </div>
      
      <div class="warning">
        <strong>⚠️ 重要な注意事項</strong>
        <ul>
          <li>このリンクは1時間のみ有効です</li>
          <li>リクエストしていない場合は、このメールを無視してください</li>
          <li>リンクをクリックするまで、現在のパスワードは有効です</li>
        </ul>
      </div>
      
      <p style="font-size: 12px; color: #666;">
        リンクが機能しない場合は、以下のURLをブラウザにコピー＆ペーストしてください：<br>
        <code style="background: #e9ecef; padding: 5px; display: block; word-break: break-all; margin-top: 10px;">
          ${resetUrl}
        </code>
      </p>
    </div>
    <div class="footer">
      <p>このメールは自動送信されています。</p>
      <p>&copy; 2026 Streaming Platform. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

// AWS SES メール送信関数（AWS SDK設定が必要）
export async function sendEmail(
  to: string,
  subject: string,
  htmlBody: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // 環境変数でメール送信を無効化できる
    if (process.env.DISABLE_EMAIL === 'true') {
      console.log('Email sending is disabled. Would send to:', to);
      console.log('Subject:', subject);
      return { success: true };
    }

    // AWS SES設定が必要な場合
    // const AWS = require('aws-sdk');
    // const ses = new AWS.SES({ region: process.env.AWS_REGION || 'ap-northeast-1' });
    
    // const params = {
    //   Source: process.env.EMAIL_FROM || 'noreply@example.com',
    //   Destination: { ToAddresses: [to] },
    //   Message: {
    //     Subject: { Data: subject, Charset: 'UTF-8' },
    //     Body: { Html: { Data: htmlBody, Charset: 'UTF-8' } }
    //   }
    // };
    
    // await ses.sendEmail(params).promise();
    
    // デバッグ用：メール内容をログ出力
    console.log('=== EMAIL DEBUG ===');
    console.log('To:', to);
    console.log('Subject:', subject);
    console.log('Body length:', htmlBody.length);
    console.log('==================');
    
    return { success: true };
  } catch (error: any) {
    console.error('Email send error:', error);
    return { success: false, error: error.message };
  }
}
