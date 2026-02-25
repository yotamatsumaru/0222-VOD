# AWS IVS + CloudFront 配信ガイド

このドキュメントでは、AWS IVSとCloudFrontを使用した動画配信の設定方法を説明します。

## 📺 対応するURL形式

### 1. AWS IVS Playback URL（直接）
```
https://xxxxx.ap-northeast-1.playback.live-video.net/api/video/v1/.../master.m3u8
```

### 2. CloudFront経由のIVS URL（推奨）
```
https://d3tcssbjmdt7t.cloudfront.net/ivs/v1/700918785224/QC04GuGsbn7f/2026/2/23/9/23/e6w7MybzchaS/media/hls/master.m3u8
```

両方の形式に対応しています。

---

## 🎬 イベントへの配信URL設定

### 管理画面での設定手順

1. **管理画面にログイン**
   - URL: `https://yourdomain.com/admin`
   - 認証: Basic認証（デフォルト: admin / admin123）

2. **イベント管理タブを開く**

3. **イベントを編集**
   - 新規作成 または 既存イベントの「編集」ボタンをクリック

4. **配信URLを設定**

   #### ライブ配信の場合
   ```
   配信URL (Stream URL): 
   https://xxxxx.playback.live-video.net/api/video/v1/.../master.m3u8
   
   ステータス: 配信予定 または 配信中
   ```

   #### アーカイブ動画の場合
   ```
   アーカイブURL (Archive URL):
   https://d3tcssbjmdt7t.cloudfront.net/ivs/v1/.../master.m3u8
   
   ステータス: アーカイブ
   ```

5. **保存**

---

## 🔒 CloudFront署名付きURL（オプション）

CloudFront署名付きURLを使用すると、認証されたユーザーのみが動画を視聴できます。

### 環境変数設定

`.env.local` に以下を追加：

```bash
# CloudFront設定
CLOUDFRONT_DOMAIN=d3tcssbjmdt7t.cloudfront.net
CLOUDFRONT_KEY_PAIR_ID=APKAXXXXXXXXXXXXXXXX
CLOUDFRONT_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----
MIIEpAIBAAKCAQEA...
（秘密鍵の内容）
...
-----END RSA PRIVATE KEY-----"
```

### AWS CloudFront設定

1. **Trusted Key Groupsの作成**
   - AWS Console → CloudFront → Key management → Key groups
   - 新しいKey Groupを作成
   - Public Keyをアップロード

2. **CloudFront Distributionの設定**
   - Distribution → Behaviors → Edit
   - Restrict viewer access: Yes
   - Trusted key groups: 上記で作成したKey Group

3. **秘密鍵の取得**
   ```bash
   # RSA鍵ペアを生成（初回のみ）
   openssl genrsa -out private_key.pem 2048
   openssl rsa -pubout -in private_key.pem -out public_key.pem
   
   # public_key.pem を CloudFront にアップロード
   # private_key.pem の内容を CLOUDFRONT_PRIVATE_KEY に設定
   ```

### 署名なしで使用する場合

環境変数を設定しなければ、署名なしで直接URLを使用します。パブリックアクセス可能なCloudFront Distributionの場合はこちらで問題ありません。

---

## 🎥 動画形式の要件

### HLS (HTTP Live Streaming)

- **フォーマット**: `.m3u8` (マスタープレイリスト)
- **セグメント**: `.ts` ファイル（通常2-10秒）
- **コーデック**: H.264 (動画), AAC (音声)

### 推奨ビットレート

| 解像度 | ビットレート | 用途 |
|--------|------------|------|
| 1080p | 4-6 Mbps | 高画質 |
| 720p | 2-3 Mbps | 標準 |
| 480p | 1-1.5 Mbps | モバイル |
| 360p | 0.5-1 Mbps | 低速回線 |

AWS IVS Transcodingを有効にすると、自動で複数の解像度が生成されます。

---

## 🧪 テスト手順

### 1. URLの動作確認

#### ブラウザで直接開く
```
https://d3tcssbjmdt7t.cloudfront.net/ivs/v1/.../master.m3u8
```

期待される結果：
- プレイリストファイルがダウンロードされる
- または VLC、MPV などのプレーヤーで開ける

#### curlでテスト
```bash
curl -I https://d3tcssbjmdt7t.cloudfront.net/ivs/v1/.../master.m3u8

# 期待されるレスポンス
HTTP/2 200
content-type: application/vnd.apple.mpegurl
```

### 2. 管理画面で設定

1. イベント作成/編集
2. Archive URL に CloudFront URL を貼り付け
3. ステータスを「アーカイブ」に設定
4. 保存

### 3. フロントエンドで視聴

1. ユーザーでログイン
2. イベント詳細ページでチケット購入
3. マイページから「視聴する」をクリック
4. 動画が再生されることを確認

### 4. ブラウザコンソールで確認

F12 → Console タブ：
```javascript
[WatchPlayer] Loading stream URL: https://d3tcssbjmdt7t.cloudfront.net/...
[WatchPlayer] Using HLS.js
[WatchPlayer] HLS manifest parsed
[WatchPlayer] Available levels: 3
[WatchPlayer] Level 0: { height: 360, width: 640, bitrate: 800000 }
[WatchPlayer] Level 1: { height: 720, width: 1280, bitrate: 2500000 }
[WatchPlayer] Level 2: { height: 1080, width: 1920, bitrate: 5000000 }
```

---

## 🐛 トラブルシューティング

### 問題: 動画が再生されない

**確認項目**:

1. **URLが正しいか**
   ```bash
   # ブラウザで直接開く
   https://d3tcssbjmdt7t.cloudfront.net/ivs/v1/.../master.m3u8
   ```

2. **CORSエラー**
   ```
   ブラウザコンソール:
   Access to XMLHttpRequest ... has been blocked by CORS policy
   ```
   
   **解決策**: CloudFront の CORS 設定を確認
   ```
   AWS Console → CloudFront → Distribution → Behaviors → 
   Response headers policy → CORS-With-Preflight
   ```

3. **HLS.js エラー**
   ```javascript
   [WatchPlayer] HLS error: { type: 'networkError', ... }
   ```
   
   **解決策**:
   - ネットワーク接続を確認
   - URLが有効か確認
   - CloudFront Distribution が有効か確認

4. **署名エラー（署名付きURLの場合）**
   ```
   HTTP 403 Forbidden
   ```
   
   **解決策**:
   - `CLOUDFRONT_KEY_PAIR_ID` が正しいか確認
   - `CLOUDFRONT_PRIVATE_KEY` の改行が正しく保存されているか確認
   - CloudFront Trusted Key Group の設定を確認

### 問題: 画質切り替えができない

**原因**: AWS IVS の Transcoding が無効

**解決策**:
1. AWS Console → IVS → Channels → 該当チャンネル
2. Transcoding: Enable
3. 複数のビットレートを設定

---

## 💡 ベストプラクティス

### 1. ライブ配信とアーカイブの分離

```
ライブ配信:
- stream_url に IVS Playback URL を設定
- ステータス: 配信中

アーカイブ:
- archive_url に CloudFront URL を設定
- ステータス: アーカイブ
```

### 2. CloudFront の活用

- **低レイテンシ**: エッジロケーションから配信
- **コスト削減**: IVS直接よりCloudFront経由の方が安価
- **DRM**: 署名付きURLで不正視聴を防止

### 3. 監視

- **CloudWatch**: CloudFront メトリクスを監視
  - リクエスト数
  - エラー率
  - バイト転送量

---

## 📚 参考資料

### AWS公式ドキュメント

- **AWS IVS**: https://docs.aws.amazon.com/ivs/
- **CloudFront**: https://docs.aws.amazon.com/cloudfront/
- **署名付きURL**: https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/private-content-signed-urls.html

### HLS仕様

- **RFC 8216**: https://tools.ietf.org/html/rfc8216
- **HLS.js**: https://github.com/video-dev/hls.js/

---

## 🔐 セキュリティ

### 推奨設定

1. **CloudFront署名付きURL**
   - 認証されたユーザーのみアクセス可能
   - 有効期限を設定（デフォルト: 1時間）

2. **HTTPS必須**
   - すべての動画配信をHTTPSで行う
   - HTTP → HTTPS リダイレクトを設定

3. **Geo-restriction（オプション）**
   - 特定の国からのアクセスのみ許可

4. **Rate limiting**
   - AWS WAF で過度なリクエストをブロック

---

## 🚀 本番環境チェックリスト

- [ ] CloudFront Distribution が有効
- [ ] CORS設定が正しい
- [ ] HTTPS が有効
- [ ] 署名付きURL（必要な場合）の設定完了
- [ ] AWS IVS Transcoding 有効
- [ ] イベントのarchive_url設定
- [ ] フロントエンドでの再生テスト
- [ ] 複数ブラウザでのテスト（Chrome, Firefox, Safari）
- [ ] モバイルでのテスト
- [ ] CloudWatch監視設定

---

**最終更新**: 2026-02-23  
**バージョン**: 1.0
