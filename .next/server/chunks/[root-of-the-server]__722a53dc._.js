module.exports=[24361,(e,t,r)=>{t.exports=e.x("util",()=>require("util"))},70406,(e,t,r)=>{t.exports=e.x("next/dist/compiled/@opentelemetry/api",()=>require("next/dist/compiled/@opentelemetry/api"))},18622,(e,t,r)=>{t.exports=e.x("next/dist/compiled/next-server/app-page-turbo.runtime.prod.js",()=>require("next/dist/compiled/next-server/app-page-turbo.runtime.prod.js"))},56704,(e,t,r)=>{t.exports=e.x("next/dist/server/app-render/work-async-storage.external.js",()=>require("next/dist/server/app-render/work-async-storage.external.js"))},32319,(e,t,r)=>{t.exports=e.x("next/dist/server/app-render/work-unit-async-storage.external.js",()=>require("next/dist/server/app-render/work-unit-async-storage.external.js"))},24725,(e,t,r)=>{t.exports=e.x("next/dist/server/app-render/after-task-async-storage.external.js",()=>require("next/dist/server/app-render/after-task-async-storage.external.js"))},874,(e,t,r)=>{t.exports=e.x("buffer",()=>require("buffer"))},88947,(e,t,r)=>{t.exports=e.x("stream",()=>require("stream"))},54799,(e,t,r)=>{t.exports=e.x("crypto",()=>require("crypto"))},93695,(e,t,r)=>{t.exports=e.x("next/dist/shared/lib/no-fallback-error.external.js",()=>require("next/dist/shared/lib/no-fallback-error.external.js"))},23862,e=>e.a(async(t,r)=>{try{let t=await e.y("pg-587764f78a6c7a9c");e.n(t),r()}catch(e){r(e)}},!0),62294,e=>e.a(async(t,r)=>{try{var a=e.i(23862),n=t([a]);[a]=n.then?(await n)():n;let p=null;async function o(e,t){let r=function(){if(!p){let e=process.env.DATABASE_URL;if(!e)throw console.error("DATABASE_URL is not defined in environment variables"),Error("DATABASE_URL is not configured");console.log("Initializing database connection pool..."),console.log("Database URL format:",e.replace(/:[^:@]+@/,":****@")),(p=new a.Pool({connectionString:e,ssl:{rejectUnauthorized:!1},max:20,idleTimeoutMillis:3e4,connectionTimeoutMillis:5e3})).on("error",e=>{console.error("Unexpected error on idle client",e)}),p.on("connect",()=>{console.log("Database connection established")})}return p}();try{let a=Date.now(),n=await r.query(e,t),o=Date.now()-a;return console.log("Query executed:",{sql:e.substring(0,100),duration:`${o}ms`,rows:n.rowCount}),n}catch(r){throw console.error("Database query error:",{sql:e.substring(0,200),params:t,error:r.message,code:r.code,detail:r.detail}),r}}async function i(e,t){return(await o(e,t)).rows[0]||null}async function s(e,t){return(await o(e,t)).rows}async function l(e,t){return(await o(e,t)).rows[0]}async function d(e,t){return(await o(e,t)).rows[0]||null}async function c(e,t){let r=await o(e,t);return null!==r.rowCount&&r.rowCount>0}e.s(["getAll",()=>s,"getOne",()=>i,"insert",()=>l,"query",()=>o,"remove",()=>c,"update",()=>d]),r()}catch(e){r(e)}},!1),133,e=>{"use strict";var t=e.i(24652);let r=process.env.JWT_SECRET||"fallback_secret_key";function a(e,a){return t.default.sign({userId:e,email:a,type:"password_reset"},r,{expiresIn:"1h"})}function n(e){try{let a=t.default.verify(e,r);if("password_reset"!==a.type)return null;return{userId:a.userId,email:a.email}}catch{return null}}function o(e,t){return`
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
      <p>こんにちは、${e||t}さん</p>
      
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
  `.trim()}function i(e,t,r,a,n,o,i,s){let l="http://localhost:3000",d=`${l}/watch/${s}?token=${i}`,c=new Intl.NumberFormat("ja-JP",{style:"currency",currency:o.toUpperCase()}).format(n/100);return`
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
      <p>こんにちは、${e||t}さん</p>
      
      <p>チケットのご購入が完了しました。</p>
      
      <div class="ticket-info">
        <h3>📋 購入内容</h3>
        <table style="width: 100%;">
          <tr>
            <td><strong>イベント名:</strong></td>
            <td>${r}</td>
          </tr>
          <tr>
            <td><strong>チケット:</strong></td>
            <td>${a}</td>
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
  `.trim()}function s(e,t){let r=`http://localhost:3000/reset-password?token=${t}`;return`
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
        <a href="${r}" class="button">パスワードをリセット</a>
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
          ${r}
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
  `.trim()}async function l(e,t,r){try{if("true"===process.env.DISABLE_EMAIL)return console.log("Email sending is disabled. Would send to:",e),console.log("Subject:",t),{success:!0};return console.log("=== EMAIL DEBUG ==="),console.log("To:",e),console.log("Subject:",t),console.log("Body length:",r.length),console.log("=================="),{success:!0}}catch(e){return console.error("Email send error:",e),{success:!1,error:e.message}}}e.s(["generatePasswordResetEmail",()=>s,"generatePasswordResetToken",()=>a,"generatePurchaseConfirmationEmail",()=>i,"generateWelcomeEmail",()=>o,"sendEmail",()=>l,"verifyPasswordResetToken",()=>n])},51332,e=>e.a(async(t,r)=>{try{var a=e.i(89171),n=e.i(62294),o=e.i(133),i=e.i(49632),s=t([n]);async function l(e){try{let{token:t,newPassword:r}=await e.json();if(!t||!r)return a.NextResponse.json({error:"トークンと新しいパスワードが必要です"},{status:400});if(r.length<6)return a.NextResponse.json({error:"パスワードは6文字以上である必要があります"},{status:400});let s=(0,o.verifyPasswordResetToken)(t);if(!s)return a.NextResponse.json({error:"トークンが無効または期限切れです"},{status:400});let l=await i.default.hash(r,10);return await (0,n.query)("UPDATE users SET password_hash = $1 WHERE id = $2",[l,s.userId]),a.NextResponse.json({message:"パスワードが正常にリセットされました"})}catch(e){return console.error("Password reset error:",e),a.NextResponse.json({error:"パスワードのリセットに失敗しました"},{status:500})}}[n]=s.then?(await s)():s,e.s(["POST",()=>l]),r()}catch(e){r(e)}},!1),18063,e=>e.a(async(t,r)=>{try{var a=e.i(47909),n=e.i(74017),o=e.i(60476),i=e.i(59756),s=e.i(61916),l=e.i(74677),d=e.i(69741),c=e.i(16795),p=e.i(87718),u=e.i(95169),h=e.i(47587),g=e.i(66012),x=e.i(70101),f=e.i(26937),m=e.i(10372),y=e.i(93695);e.i(52474);var v=e.i(220),b=e.i(51332),w=t([b]);[b]=w.then?(await w)():w;let k=new a.AppRouteRouteModule({definition:{kind:n.RouteKind.APP_ROUTE,page:"/api/auth/reset-password/route",pathname:"/api/auth/reset-password",filename:"route",bundlePath:""},distDir:".next",relativeProjectDir:"",resolvedPagePath:"[project]/app/api/auth/reset-password/route.ts",nextConfigOutput:"",userland:b}),{workAsyncStorage:A,workUnitAsyncStorage:C,serverHooks:T}=k;function R(){return(0,o.patchFetch)({workAsyncStorage:A,workUnitAsyncStorage:C})}async function E(e,t,r){k.isDev&&(0,i.addRequestMeta)(e,"devRequestTimingInternalsEnd",process.hrtime.bigint());let a="/api/auth/reset-password/route";a=a.replace(/\/index$/,"")||"/";let o=await k.prepare(e,t,{srcPage:a,multiZoneDraftMode:!1});if(!o)return t.statusCode=400,t.end("Bad Request"),null==r.waitUntil||r.waitUntil.call(r,Promise.resolve()),null;let{buildId:b,params:w,nextConfig:R,parsedUrl:E,isDraftMode:A,prerenderManifest:C,routerServerContext:T,isOnDemandRevalidate:P,revalidateOnlyGenerated:S,resolvedPathname:q,clientReferenceManifest:_,serverActionsManifest:N}=o,j=(0,d.normalizeAppPath)(a),D=!!(C.dynamicRoutes[j]||C.routes[q]),O=async()=>((null==T?void 0:T.render404)?await T.render404(e,t,E,!1):t.end("This page could not be found"),null);if(D&&!A){let e=!!C.routes[q],t=C.dynamicRoutes[j];if(t&&!1===t.fallback&&!e){if(R.experimental.adapterPath)return await O();throw new y.NoFallbackError}}let U=null;!D||k.isDev||A||(U=q,U="/index"===U?"/":U);let $=!0===k.isDev||!D,I=D&&!$;N&&_&&(0,l.setManifestsSingleton)({page:a,clientReferenceManifest:_,serverActionsManifest:N});let H=e.method||"GET",M=(0,s.getTracer)(),L=M.getActiveScopeSpan(),B={params:w,prerenderManifest:C,renderOpts:{experimental:{authInterrupts:!!R.experimental.authInterrupts},cacheComponents:!!R.cacheComponents,supportsDynamicResponse:$,incrementalCache:(0,i.getRequestMeta)(e,"incrementalCache"),cacheLifeProfiles:R.cacheLife,waitUntil:r.waitUntil,onClose:e=>{t.on("close",e)},onAfterTaskError:void 0,onInstrumentationRequestError:(t,r,a,n)=>k.onRequestError(e,t,a,n,T)},sharedContext:{buildId:b}},F=new c.NodeNextRequest(e),z=new c.NodeNextResponse(t),K=p.NextRequestAdapter.fromNodeNextRequest(F,(0,p.signalFromNodeResponse)(t));try{let o=async e=>k.handle(K,B).finally(()=>{if(!e)return;e.setAttributes({"http.status_code":t.statusCode,"next.rsc":!1});let r=M.getRootSpanAttributes();if(!r)return;if(r.get("next.span_type")!==u.BaseServerSpan.handleRequest)return void console.warn(`Unexpected root span type '${r.get("next.span_type")}'. Please report this Next.js issue https://github.com/vercel/next.js`);let n=r.get("next.route");if(n){let t=`${H} ${n}`;e.setAttributes({"next.route":n,"http.route":n,"next.span_name":t}),e.updateName(t)}else e.updateName(`${H} ${a}`)}),l=!!(0,i.getRequestMeta)(e,"minimalMode"),d=async i=>{var s,d;let c=async({previousCacheEntry:n})=>{try{if(!l&&P&&S&&!n)return t.statusCode=404,t.setHeader("x-nextjs-cache","REVALIDATED"),t.end("This page could not be found"),null;let a=await o(i);e.fetchMetrics=B.renderOpts.fetchMetrics;let s=B.renderOpts.pendingWaitUntil;s&&r.waitUntil&&(r.waitUntil(s),s=void 0);let d=B.renderOpts.collectedTags;if(!D)return await (0,g.sendResponse)(F,z,a,B.renderOpts.pendingWaitUntil),null;{let e=await a.blob(),t=(0,x.toNodeOutgoingHttpHeaders)(a.headers);d&&(t[m.NEXT_CACHE_TAGS_HEADER]=d),!t["content-type"]&&e.type&&(t["content-type"]=e.type);let r=void 0!==B.renderOpts.collectedRevalidate&&!(B.renderOpts.collectedRevalidate>=m.INFINITE_CACHE)&&B.renderOpts.collectedRevalidate,n=void 0===B.renderOpts.collectedExpire||B.renderOpts.collectedExpire>=m.INFINITE_CACHE?void 0:B.renderOpts.collectedExpire;return{value:{kind:v.CachedRouteKind.APP_ROUTE,status:a.status,body:Buffer.from(await e.arrayBuffer()),headers:t},cacheControl:{revalidate:r,expire:n}}}}catch(t){throw(null==n?void 0:n.isStale)&&await k.onRequestError(e,t,{routerKind:"App Router",routePath:a,routeType:"route",revalidateReason:(0,h.getRevalidateReason)({isStaticGeneration:I,isOnDemandRevalidate:P})},!1,T),t}},p=await k.handleResponse({req:e,nextConfig:R,cacheKey:U,routeKind:n.RouteKind.APP_ROUTE,isFallback:!1,prerenderManifest:C,isRoutePPREnabled:!1,isOnDemandRevalidate:P,revalidateOnlyGenerated:S,responseGenerator:c,waitUntil:r.waitUntil,isMinimalMode:l});if(!D)return null;if((null==p||null==(s=p.value)?void 0:s.kind)!==v.CachedRouteKind.APP_ROUTE)throw Object.defineProperty(Error(`Invariant: app-route received invalid cache entry ${null==p||null==(d=p.value)?void 0:d.kind}`),"__NEXT_ERROR_CODE",{value:"E701",enumerable:!1,configurable:!0});l||t.setHeader("x-nextjs-cache",P?"REVALIDATED":p.isMiss?"MISS":p.isStale?"STALE":"HIT"),A&&t.setHeader("Cache-Control","private, no-cache, no-store, max-age=0, must-revalidate");let u=(0,x.fromNodeOutgoingHttpHeaders)(p.value.headers);return l&&D||u.delete(m.NEXT_CACHE_TAGS_HEADER),!p.cacheControl||t.getHeader("Cache-Control")||u.get("Cache-Control")||u.set("Cache-Control",(0,f.getCacheControlHeader)(p.cacheControl)),await (0,g.sendResponse)(F,z,new Response(p.value.body,{headers:u,status:p.value.status||200})),null};L?await d(L):await M.withPropagatedContext(e.headers,()=>M.trace(u.BaseServerSpan.handleRequest,{spanName:`${H} ${a}`,kind:s.SpanKind.SERVER,attributes:{"http.method":H,"http.target":e.url}},d))}catch(t){if(t instanceof y.NoFallbackError||await k.onRequestError(e,t,{routerKind:"App Router",routePath:j,routeType:"route",revalidateReason:(0,h.getRevalidateReason)({isStaticGeneration:I,isOnDemandRevalidate:P})},!1,T),D)throw t;return await (0,g.sendResponse)(F,z,new Response(null,{status:500})),null}}e.s(["handler",()=>E,"patchFetch",()=>R,"routeModule",()=>k,"serverHooks",()=>T,"workAsyncStorage",()=>A,"workUnitAsyncStorage",()=>C]),r()}catch(e){r(e)}},!1)];

//# sourceMappingURL=%5Broot-of-the-server%5D__722a53dc._.js.map