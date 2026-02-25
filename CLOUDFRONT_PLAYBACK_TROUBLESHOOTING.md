# CloudFront URLが再生されない問題の解決ガイド

## 🔴 問題

CloudFront経由のIVS URLが視聴ページで再生されない

**使用したURL**:
```
https://d3tcssbjmdt7t.cloudfront.net/ivs/v1/700918785224/QC04GuGsbn7f/2026/2/23/9/23/e6w7MybzchaS/media/hls/master.m3u8
```

---

## 🔍 チェックリスト

### 1. URL形式の確認

**❌ 間違った例**:
```
shttps://d3tcssbjmdt7t.cloudfront.net/...  ← "shttps" (sが重複)
http://d3tcssbjmdt7t.cloudfront.net/...    ← "http" (httpsではない)
```

**✅ 正しい形式**:
```
https://d3tcssbjmdt7t.cloudfront.net/ivs/v1/700918785224/QC04GuGsbn7f/2026/2/23/9/23/e6w7MybzchaS/media/hls/master.m3u8
```

### 2. 管理画面での設定確認

1. **管理画面にログイン**
   ```
   http://18.178.182.252/admin
   ```

2. **イベント管理 → 編集**

3. **アーカイブURL** に正しいURLを貼り付け
   ```
   https://d3tcssbjmdt7t.cloudfront.net/ivs/v1/700918785224/QC04GuGsbn7f/2026/2/23/9/23/e6w7MybzchaS/media/hls/master.m3u8
   ```

4. **ステータス** を「アーカイブ」に設定

5. **保存**

### 3. ブラウザでURLを直接テスト

**手順**:
1. ブラウザ（Chrome/Firefox）でURLを直接開く
   ```
   https://d3tcssbjmdt7t.cloudfront.net/ivs/v1/700918785224/QC04GuGsbn7f/2026/2/23/9/23/e6w7MybzchaS/media/hls/master.m3u8
   ```

**期待される結果**:

#### ✅ 成功（200 OK）
```
#EXTM3U
#EXT-X-VERSION:3
#EXT-X-STREAM-INF:BANDWIDTH=800000,RESOLUTION=640x360
360p/index.m3u8
#EXT-X-STREAM-INF:BANDWIDTH=2500000,RESOLUTION=1280x720
720p/index.m3u8
```
→ プレイリストがダウンロードされる

#### ❌ 403 Forbidden
```xml
<Error>
  <Code>AccessDenied</Code>
  <Message>Access Denied</Message>
</Error>
```
→ CloudFront署名が必要、またはアクセス制限

#### ❌ 404 Not Found
```xml
<Error>
  <Code>NoSuchKey</Code>
  <Message>The specified key does not exist.</Message>
</Error>
```
→ URLが間違っている、またはファイルが存在しない

---

## 🛠️ 問題別の解決方法

### 問題A: 403 Forbidden

**原因1**: CloudFront Distributionが署名付きURLを要求している

**解決策**: 署名なしでアクセス可能にする

1. **AWS Console → CloudFront → Distributions**
2. 該当Distribution (`d3tcssbjmdt7t.cloudfront.net`) を選択
3. **Behaviors** タブ → 該当パスのBehavior を編集
4. **Restrict viewer access**: **No** に設定
5. **Save changes**
6. Distribution が Deploy されるまで待つ（5-15分）

**原因2**: Origin Access Identity (OAI) の設定

**解決策**: S3バケットポリシーを更新

1. **AWS Console → S3 → バケット選択**
2. **Permissions** → **Bucket Policy**
3. CloudFront OAI からのアクセスを許可

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowCloudFrontAccess",
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::cloudfront:user/CloudFront Origin Access Identity <YOUR-OAI-ID>"
      },
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::<BUCKET-NAME>/*"
    }
  ]
}
```

### 問題B: 404 Not Found

**原因**: URLが間違っている、またはファイルが存在しない

**確認方法**:

1. **AWS IVS Console → Recorded Media**
   - 該当の録画を確認
   - Playback URL をコピー

2. **URL構造を確認**:
   ```
   https://<CloudFront-Domain>/ivs/v1/<Account-ID>/<Channel-ARN>/<Year>/<Month>/<Day>/<Hour>/<Minute>/<Recording-ID>/media/hls/master.m3u8
   ```

3. **各要素が正しいか確認**:
   - Account ID: `700918785224` ✅
   - Channel ARN: `QC04GuGsbn7f` ✅
   - Date/Time: `2026/2/23/9/23` ✅
   - Recording ID: `e6w7MybzchaS` ✅

**解決策**:

正しいURLをAWS IVS Consoleから取得：
1. AWS Console → IVS → Channels → 該当チャンネル
2. Recorded Streams → 該当録画を選択
3. **Playback URL** をコピー
4. そのままアーカイブURLに貼り付け

### 問題C: CORSエラー

**症状**: ブラウザコンソールに以下のエラー
```
Access to XMLHttpRequest at 'https://d3tcssbjmdt7t.cloudfront.net/...' 
from origin 'http://18.178.182.252' has been blocked by CORS policy
```

**解決策**: CloudFront の CORS 設定を有効化

1. **AWS Console → CloudFront → Distributions**
2. 該当Distribution を選択
3. **Behaviors** タブ → 該当Behavior を編集
4. **Response headers policy**: `CORS-With-Preflight` を選択
5. **Save changes**

**または、カスタムヘッダーを追加**:

1. **Response headers policies** → **Create policy**
2. **CORS configuration**:
   - Access-Control-Allow-Origin: `*` （または特定ドメイン）
   - Access-Control-Allow-Methods: `GET, HEAD, OPTIONS`
   - Access-Control-Allow-Headers: `*`
3. Behavior に適用

---

## 🧪 視聴ページでのテスト手順

### 1. 管理画面でイベント設定

```
イベント管理 → 編集:
- タイトル: テスト配信
- アーティスト: 任意
- ステータス: アーカイブ
- アーカイブURL: https://d3tcssbjmdt7t.cloudfront.net/ivs/v1/.../master.m3u8
保存
```

### 2. チケット作成（テスト用）

```
チケット管理 → 新規作成:
- イベント: テスト配信
- チケット名: テストチケット
- 価格: 100 (1円)
保存
```

### 3. フロントエンドで購入＆視聴

1. ユーザーでログイン
2. イベント詳細ページでチケット購入（Stripeテストカード）
3. マイページ → 「視聴する」をクリック
4. **F12** → **Console** タブを開く

### 4. コンソールログ確認

**✅ 成功時のログ**:
```javascript
[WatchPlayer] Loading stream URL: https://d3tcssbjmdt7t.cloudfront.net/...
[WatchPlayer] Using HLS.js
[WatchPlayer] HLS manifest parsed
[WatchPlayer] Available levels: 2
[WatchPlayer] Level 0: { height: 360, width: 640, bitrate: 800000 }
[WatchPlayer] Level 1: { height: 720, width: 1280, bitrate: 2500000 }
```

**❌ エラー時のログ**:

#### CORS エラー
```javascript
Access to XMLHttpRequest ... has been blocked by CORS policy
```
→ 上記「問題C: CORSエラー」を参照

#### 403 Forbidden
```javascript
[WatchPlayer] HLS error: { type: 'networkError', details: 'manifestLoadError', fatal: true, response: { code: 403 } }
```
→ 上記「問題A: 403 Forbidden」を参照

#### 404 Not Found
```javascript
[WatchPlayer] HLS error: { type: 'networkError', details: 'manifestLoadError', fatal: true, response: { code: 404 } }
```
→ 上記「問題B: 404 Not Found」を参照

#### マニフェストパースエラー
```javascript
[WatchPlayer] HLS error: { type: 'networkError', details: 'manifestParsingError' }
```
→ URLの内容がHLSマニフェストではない

---

## 📝 推奨される確認順序

1. **✅ URLをブラウザで直接開く**
   - 200 OK → プレイリストがダウンロードされる
   - 403 → CloudFront署名設定を確認
   - 404 → URLが間違っている

2. **✅ VLCなどのプレーヤーで再生テスト**
   - VLC → メディアを開く → ネットワーク → URL貼り付け
   - 再生できれば URL自体は正しい

3. **✅ 管理画面でURLを設定**
   - コピー&ペーストでミスがないように
   - 先頭に余分な文字（`s`など）がないか確認

4. **✅ ブラウザコンソールでエラー確認**
   - F12 → Console タブ
   - `[WatchPlayer]` で始まるログを確認

5. **✅ CloudFront設定を確認**
   - Restrict viewer access: No
   - CORS設定: 有効

---

## 🎯 よくある原因と解決策まとめ

| 症状 | 原因 | 解決策 |
|------|------|--------|
| 動画が再生されない | URLが間違っている | AWS IVS Consoleから正しいURLを取得 |
| 403 Forbidden | CloudFront署名が必要 | Restrict viewer access を No に |
| 404 Not Found | ファイルが存在しない | URLを確認、IVS録画が完了しているか確認 |
| CORSエラー | CORS設定がない | CloudFront Response headers policy 設定 |
| 画質ボタンなし | Transcodingが無効 | IVS チャンネルで Transcoding 有効化 |
| プレーヤーが表示されない | 購入トークンが無効 | マイページから正しく購入しているか確認 |

---

## 🔗 AWS IVS 録画URLの取得方法

### AWS Console での確認

1. **AWS Console → Amazon IVS**
2. **Channels** → 該当チャンネルを選択
3. **Recorded Streams** タブ
4. 該当の録画を選択
5. **Playback URL** をコピー

**URL形式**:
```
https://d3tcssbjmdt7t.cloudfront.net/ivs/v1/700918785224/QC04GuGsbn7f/2026/2/23/9/23/e6w7MybzchaS/media/hls/master.m3u8
```

### IVS APIで取得（オプション）

```bash
aws ivs list-recording-configurations --region ap-northeast-1
aws ivs list-recordings --recording-configuration-arn <ARN> --region ap-northeast-1
```

---

## 📞 サポート

### 追加で確認すべき情報

問題が解決しない場合、以下の情報を提供してください：

1. **ブラウザコンソールのログ**（F12 → Console）
   ```javascript
   [WatchPlayer] Loading stream URL: ...
   [WatchPlayer] HLS error: ...
   ```

2. **ブラウザでURLを直接開いた結果**
   - 200 OK / 403 / 404 ?
   - どんな内容が表示されるか？

3. **AWS IVS録画の状態**
   - Recording Status: RECORDING / ENDED ?
   - Playback URLが表示されているか？

4. **CloudFront Distribution設定**
   - Restrict viewer access: Yes / No ?
   - Response headers policy: 設定あり / なし ?

---

**最終更新**: 2026-02-23  
**バージョン**: 1.0
