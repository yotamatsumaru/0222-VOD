module.exports=[24361,(e,r,t)=>{r.exports=e.x("util",()=>require("util"))},70406,(e,r,t)=>{r.exports=e.x("next/dist/compiled/@opentelemetry/api",()=>require("next/dist/compiled/@opentelemetry/api"))},18622,(e,r,t)=>{r.exports=e.x("next/dist/compiled/next-server/app-page-turbo.runtime.prod.js",()=>require("next/dist/compiled/next-server/app-page-turbo.runtime.prod.js"))},56704,(e,r,t)=>{r.exports=e.x("next/dist/server/app-render/work-async-storage.external.js",()=>require("next/dist/server/app-render/work-async-storage.external.js"))},32319,(e,r,t)=>{r.exports=e.x("next/dist/server/app-render/work-unit-async-storage.external.js",()=>require("next/dist/server/app-render/work-unit-async-storage.external.js"))},24725,(e,r,t)=>{r.exports=e.x("next/dist/server/app-render/after-task-async-storage.external.js",()=>require("next/dist/server/app-render/after-task-async-storage.external.js"))},54799,(e,r,t)=>{r.exports=e.x("crypto",()=>require("crypto"))},874,(e,r,t)=>{r.exports=e.x("buffer",()=>require("buffer"))},88947,(e,r,t)=>{r.exports=e.x("stream",()=>require("stream"))},93695,(e,r,t)=>{r.exports=e.x("next/dist/shared/lib/no-fallback-error.external.js",()=>require("next/dist/shared/lib/no-fallback-error.external.js"))},23862,e=>e.a(async(r,t)=>{try{let r=await e.y("pg-587764f78a6c7a9c");e.n(r),t()}catch(e){t(e)}},!0),62294,e=>e.a(async(r,t)=>{try{var n=e.i(23862),o=r([n]);[n]=o.then?(await o)():o;let p=null;async function a(e,r){let t=function(){if(!p){let e=process.env.DATABASE_URL;if(!e)throw console.error("DATABASE_URL is not defined in environment variables"),Error("DATABASE_URL is not configured");console.log("Initializing database connection pool..."),console.log("Database URL format:",e.replace(/:[^:@]+@/,":****@")),(p=new n.Pool({connectionString:e,ssl:{rejectUnauthorized:!1},max:20,idleTimeoutMillis:3e4,connectionTimeoutMillis:5e3})).on("error",e=>{console.error("Unexpected error on idle client",e)}),p.on("connect",()=>{console.log("Database connection established")})}return p}();try{let n=Date.now(),o=await t.query(e,r),a=Date.now()-n;return console.log("Query executed:",{sql:e.substring(0,100),duration:`${a}ms`,rows:o.rowCount}),o}catch(t){throw console.error("Database query error:",{sql:e.substring(0,200),params:r,error:t.message,code:t.code,detail:t.detail}),t}}async function i(e,r){return(await a(e,r)).rows[0]||null}async function s(e,r){return(await a(e,r)).rows}async function l(e,r){return(await a(e,r)).rows[0]}async function d(e,r){return(await a(e,r)).rows[0]||null}async function c(e,r){let t=await a(e,r);return null!==t.rowCount&&t.rowCount>0}e.s(["getAll",()=>s,"getOne",()=>i,"insert",()=>l,"query",()=>a,"remove",()=>c,"update",()=>d]),t()}catch(e){t(e)}},!1),133,e=>{"use strict";var r=e.i(24652);let t=process.env.JWT_SECRET||"fallback_secret_key";function n(e,n){return r.default.sign({userId:e,email:n,type:"password_reset"},t,{expiresIn:"1h"})}function o(e){try{let n=r.default.verify(e,t);if("password_reset"!==n.type)return null;return{userId:n.userId,email:n.email}}catch{return null}}function a(e,r){return`
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
      <p>こんにちは、${e||r}さん</p>
      
      <p>ストリーミングプラットフォームへのご登録ありがとうございます。</p>
      
      <p>これからライブ配信やアーカイブ動画をお楽しみいただけます。</p>
      
      <div style="text-align: center;">
        <a href="http://localhost:3000/events" class="button">イベント一覧を見る</a>
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
  `.trim()}function i(e,r,t,n,o,a,i,s){let l="http://localhost:3000",d=`${l}/watch/${s}?token=${i}`,c=new Intl.NumberFormat("ja-JP",{style:"currency",currency:a.toUpperCase()}).format(o/100);return`
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
      <p>こんにちは、${e||r}さん</p>
      
      <p>チケットのご購入が完了しました。</p>
      
      <div class="ticket-info">
        <h3>📋 購入内容</h3>
        <table style="width: 100%;">
          <tr>
            <td><strong>イベント名:</strong></td>
            <td>${t}</td>
          </tr>
          <tr>
            <td><strong>チケット:</strong></td>
            <td>${n}</td>
          </tr>
          <tr>
            <td><strong>金額:</strong></td>
            <td>${c}</td>
          </tr>
        </table>
      </div>
      
      <div style="text-align: center; background: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3>🎬 視聴ページはこちら</h3>
        <a href="${d}" class="button">視聴ページを開く</a>
        <p style="font-size: 12px; color: #856404; margin-top: 10px;">
          ⚠️ このリンクは30日間有効です
        </p>
      </div>
      
      <p>マイページからも視聴リンクにアクセスできます：<br>
      <a href="${l}/mypage">${l}/mypage</a></p>
      
      <p>素晴らしい視聴体験をお楽しみください！</p>
    </div>
    <div class="footer">
      <p>このメールは自動送信されています。</p>
      <p>&copy; 2026 Streaming Platform. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `.trim()}function s(e,r){let t=`http://localhost:3000/reset-password?token=${r}`;return`
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
        <a href="${t}" class="button">パスワードをリセット</a>
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
          ${t}
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
  `.trim()}async function l(e,r,t){try{if("true"===process.env.DISABLE_EMAIL)return console.log("Email sending is disabled. Would send to:",e),console.log("Subject:",r),{success:!0};return console.log("=== EMAIL DEBUG ==="),console.log("To:",e),console.log("Subject:",r),console.log("Body length:",t.length),console.log("=================="),{success:!0}}catch(e){return console.error("Email send error:",e),{success:!1,error:e.message}}}e.s(["generatePasswordResetEmail",()=>s,"generatePasswordResetToken",()=>n,"generatePurchaseConfirmationEmail",()=>i,"generateWelcomeEmail",()=>a,"sendEmail",()=>l,"verifyPasswordResetToken",()=>o])},70999,e=>{"use strict";var r=e.i(24652);let t=process.env.JWT_SECRET||"your-secret-key";function n(e){return r.default.sign({...e,exp:Math.floor(Date.now()/1e3)+86400},t)}function o(e){try{return r.default.verify(e,t)}catch(e){return console.error("JWT verification failed:",e),null}}e.s(["generateAccessToken",()=>n,"verifyAccessToken",()=>o])}];

//# sourceMappingURL=%5Broot-of-the-server%5D__779391fe._.js.map