# ライブ配信・VODストリーミングプラットフォーム 仕様書

**バージョン**: 1.0  
**最終更新日**: 2026-02-23  
**プロジェクト名**: StreamingPlatform  
**リポジトリ**: https://github.com/yotamatsumaru/0222-VOD

---

## 目次

1. [プロジェクト概要](#1-プロジェクト概要)
2. [システムアーキテクチャ](#2-システムアーキテクチャ)
3. [機能仕様](#3-機能仕様)
4. [データベース設計](#4-データベース設計)
5. [API仕様](#5-api仕様)
6. [認証・セキュリティ](#6-認証セキュリティ)
7. [決済システム](#7-決済システム)
8. [動画配信システム](#8-動画配信システム)
9. [UI/UXデザイン](#9-uiuxデザイン)
10. [デプロイメント](#10-デプロイメント)
11. [開発ガイド](#11-開発ガイド)
12. [トラブルシューティング](#12-トラブルシューティング)

---

## 1. プロジェクト概要

### 1.1 プロジェクトの目的

ライブ配信およびVOD（Video on Demand）コンテンツを提供するストリーミングプラットフォーム。アーティストのライブイベントやアーカイブ動画を有料チケット制で視聴できるサービスを提供します。

### 1.2 主要機能

- **フロントエンド機能**
  - イベント一覧・詳細表示
  - アーティスト一覧・詳細表示
  - ユーザー登録・ログイン
  - チケット購入（Stripe決済）
  - 購入履歴確認（マイページ）
  - 動画視聴（HLS.js プレーヤー）
  - パスワードリセット機能

- **管理画面機能**
  - ダッシュボード（売上統計、購入数）
  - イベント管理（CRUD、一括操作、ソート）
  - アーティスト管理（CRUD）
  - チケット管理（CRUD）
  - 購入履歴閲覧

### 1.3 技術スタック

| カテゴリ | 技術 | バージョン |
|---------|------|-----------|
| **フレームワーク** | Next.js (App Router) | 16.1.6 |
| **言語** | TypeScript | 5.9+ |
| **スタイリング** | Tailwind CSS | 4.2+ |
| **データベース** | PostgreSQL | 14+ |
| **ORM** | 直接SQL（pg） | 8.x |
| **認証** | JWT (jsonwebtoken) | 9.x |
| **決済** | Stripe | Latest |
| **動画再生** | HLS.js | 1.x |
| **デプロイ** | AWS EC2 + RDS | - |
| **動画配信** | AWS IVS / MediaLive | - |

---

## 2. システムアーキテクチャ

### 2.1 全体構成図

```
┌─────────────────────────────────────────────────────────────┐
│                        クライアント                          │
│                    (Next.js Frontend)                       │
│  ┌─────────────┬─────────────┬─────────────┬─────────────┐ │
│  │ トップ      │ イベント    │ マイページ  │ 視聴ページ  │ │
│  │ ページ      │ 詳細        │            │            │ │
│  └─────────────┴─────────────┴─────────────┴─────────────┘ │
└───────────────────────┬─────────────────────────────────────┘
                        │ HTTPS
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                    Next.js API Routes                        │
│  ┌──────────┬──────────┬──────────┬──────────┬──────────┐  │
│  │ /api/auth│ /api/    │ /api/    │ /api/    │ /api/    │  │
│  │          │ events   │ artists  │ purchases│ watch    │  │
│  └──────────┴──────────┴──────────┴──────────┴──────────┘  │
└───────┬──────────────┬────────────────────┬─────────────────┘
        │              │                    │
        ▼              ▼                    ▼
┌──────────────┐ ┌──────────────┐   ┌──────────────┐
│ PostgreSQL   │ │   Stripe     │   │   AWS IVS    │
│   Database   │ │     API      │   │  (Stream)    │
└──────────────┘ └──────────────┘   └──────────────┘
```

### 2.2 ディレクトリ構造

```
streaming-platform-nextjs/
├── app/                      # Next.js App Router
│   ├── api/                  # API Routes
│   │   ├── admin/           # 管理系API
│   │   ├── auth/            # 認証API
│   │   ├── events/          # イベントAPI
│   │   ├── artists/         # アーティストAPI
│   │   ├── purchases/       # 購入履歴API
│   │   ├── stripe/          # Stripe Webhook
│   │   └── watch/           # 視聴認証API
│   ├── admin/               # 管理画面
│   ├── events/              # イベントページ
│   ├── artists/             # アーティストページ
│   ├── login/               # ログインページ
│   ├── register/            # 新規登録ページ
│   ├── mypage/              # マイページ
│   ├── watch/[slug]/        # 視聴ページ
│   ├── layout.tsx           # レイアウト
│   ├── page.tsx             # トップページ
│   └── globals.css          # グローバルCSS
├── components/              # Reactコンポーネント
│   ├── admin/              # 管理画面コンポーネント
│   ├── Navigation.tsx      # ナビゲーション
│   ├── EventCard.tsx       # イベントカード
│   ├── WatchPlayer.tsx     # 動画プレーヤー
│   ├── TicketPurchase.tsx  # チケット購入
│   └── Toast.tsx           # 通知コンポーネント
├── lib/                     # ユーティリティ
│   ├── db.ts               # データベース接続
│   ├── auth.ts             # JWT認証
│   ├── userAuth.ts         # ユーザー認証
│   ├── adminAuth.ts        # 管理者認証
│   ├── stripe.ts           # Stripe設定
│   ├── cloudfront.ts       # CloudFront署名
│   └── email.ts            # メール送信
├── public/                  # 静的ファイル
├── .env.local              # 環境変数
├── package.json            # 依存関係
├── tsconfig.json           # TypeScript設定
└── tailwind.config.ts      # Tailwind設定
```

### 2.3 データフロー

#### 2.3.1 ユーザー登録・ログインフロー

```
ユーザー
  │
  ├─► [POST] /api/auth/register
  │     └─► パスワードハッシュ化（bcrypt）
  │           └─► DB保存（users テーブル）
  │                 └─► JWTトークン発行
  │
  └─► [POST] /api/auth/login
        └─► パスワード検証
              └─► JWTトークン発行
                    └─► localStorage保存（auth_token）
```

#### 2.3.2 チケット購入フロー

```
ユーザー
  │
  ├─► イベント詳細ページ
  │     └─► チケット選択
  │
  ├─► [POST] /api/stripe/checkout
  │     └─► Stripe Checkout Session作成
  │           └─► リダイレクト → Stripe決済画面
  │
  ├─► 決済完了
  │     └─► [POST] /api/stripe/webhook
  │           └─► 購入レコード作成（purchases テーブル）
  │                 └─► アクセストークン発行（JWT）
  │
  └─► /success ページにリダイレクト
        └─► マイページで購入履歴確認可能
```

#### 2.3.3 動画視聴フロー

```
ユーザー
  │
  ├─► マイページ → 「視聴する」ボタン
  │     └─► /watch/[slug]?token=xxx にアクセス
  │
  ├─► [POST] /api/watch/verify
  │     └─► アクセストークン検証
  │           └─► イベント情報取得
  │
  ├─► [POST] /api/watch/stream-url
  │     └─► ストリームURL取得
  │           └─► CloudFront署名付きURL生成（オプション）
  │
  └─► HLS.js でストリーム再生
        └─► 画質自動調整 or 手動切り替え
```

---

## 3. 機能仕様

### 3.1 フロントエンド機能

#### 3.1.1 トップページ（`/`）

**目的**: イベント一覧表示、サービス紹介

**表示内容**:
- ヒーローセクション（背景：紫グラデーション）
- 最新イベント一覧（カード形式）
- アーティスト一覧へのリンク

**実装ファイル**: `app/page.tsx`

#### 3.1.2 イベント一覧ページ（`/events`）

**目的**: すべてのイベントを一覧表示

**表示内容**:
- イベントカード（サムネイル、タイトル、日時、ステータス）
- ステータスフィルタ（配信中、配信予定、アーカイブ）

**API**: `GET /api/events`

**実装ファイル**: `app/events/page.tsx`, `components/EventCard.tsx`

#### 3.1.3 イベント詳細ページ（`/events/[slug]`）

**目的**: イベントの詳細情報とチケット購入

**表示内容**:
- イベント画像
- タイトル、説明、日時
- アーティスト情報
- チケット選択・購入ボタン（Stripe Checkout）

**API**: `GET /api/events/[slug]`, `GET /api/events/[slug]/tickets`

**実装ファイル**: `app/events/[slug]/page.tsx`, `components/TicketPurchase.tsx`

#### 3.1.4 アーティスト一覧ページ（`/artists`）

**目的**: アーティスト一覧表示

**表示内容**:
- アーティストカード（画像、名前、説明）

**API**: `GET /api/artists`

**実装ファイル**: `app/artists/page.tsx`

#### 3.1.5 アーティスト詳細ページ（`/artists/[slug]`）

**目的**: アーティストの詳細情報とイベント一覧

**表示内容**:
- アーティスト画像
- 名前、説明
- 関連イベント一覧

**API**: `GET /api/artists/[slug]`

**実装ファイル**: `app/artists/[slug]/page.tsx`

#### 3.1.6 ログインページ（`/login`）

**目的**: ユーザーログイン

**フォーム**:
- メールアドレス
- パスワード
- ログインボタン
- パスワードを忘れた場合のリンク

**API**: `POST /api/auth/login`

**実装ファイル**: `app/login/page.tsx`

**認証方式**:
```typescript
localStorage.setItem('auth_token', jwt_token);
```

#### 3.1.7 新規登録ページ（`/register`）

**目的**: 新規ユーザー登録

**フォーム**:
- 名前
- メールアドレス
- パスワード
- パスワード確認
- 登録ボタン

**API**: `POST /api/auth/register`

**実装ファイル**: `app/register/page.tsx`

#### 3.1.8 マイページ（`/mypage`）

**目的**: 購入履歴確認と視聴

**表示内容**:
- ユーザー名
- 購入履歴リスト
  - イベントタイトル
  - チケット名
  - 購入日
  - 金額
  - ステータス（完了、返金、保留）
  - 「視聴する」ボタン（視聴可能期間内）
  - 「イベント詳細」リンク

**API**: `GET /api/auth/me`, `GET /api/purchases/my`

**実装ファイル**: `app/mypage/page.tsx`

**認証**: 
- SSR時のlocalStorage非対応問題を解決（mounted状態管理）
- auth_token キーで統一

#### 3.1.9 視聴ページ（`/watch/[slug]?token=xxx`）

**目的**: 動画視聴

**表示内容**:
- HLS.js 動画プレーヤー（オーバーレイなし）
- イベント情報（タイトル、アーティスト、日時、説明）
- ステータスバッジ（配信中、アーカイブ）
- 画質設定（動画の下に配置）
  - 自動
  - 360p, 720p, 1080p（利用可能な場合）
- 視聴のヒント

**API**: `POST /api/watch/verify`, `POST /api/watch/stream-url`

**実装ファイル**: `app/watch/[slug]/page.tsx`, `components/WatchPlayer.tsx`

**レスポンシブ対応**:
- モバイル: 2列グリッド
- タブレット: 3列グリッド
- デスクトップ: 4-6列グリッド

**画質切り替え**:
```typescript
// HLS.js の場合
hls.currentLevel = level; // -1: auto, 0+: specific level

// Safari (ネイティブHLS) の場合
// 自動画質のみ、手動切り替え不可
```

#### 3.1.10 パスワードリセット（`/forgot-password`, `/reset-password`）

**目的**: パスワード忘れた場合の再設定

**フロー**:
1. `/forgot-password`: メールアドレス入力
2. メールでリセットトークン送信
3. `/reset-password?token=xxx`: 新しいパスワード入力
4. パスワード更新

**API**: `POST /api/auth/forgot-password`, `POST /api/auth/reset-password`

**実装ファイル**: `app/forgot-password/page.tsx`, `app/reset-password/page.tsx`

### 3.2 管理画面機能

#### 3.2.1 管理画面トップ（`/admin`）

**認証**: Basic認証（デフォルト: admin / admin123）

**タブ構成**:
- ダッシュボード
- イベント管理
- アーティスト管理
- チケット管理
- 購入履歴

**実装ファイル**: `app/admin/page.tsx`

#### 3.2.2 ダッシュボード

**表示内容**:
- 総売上
- 総購入数
- イベント数
- アーティスト数
- 最近の購入（5件）

**API**: `GET /api/admin/stats`, `GET /api/admin/purchases`

**実装ファイル**: `components/admin/Dashboard.tsx`

#### 3.2.3 イベント管理

**機能**:
- イベント一覧表示
- 新規作成
- 編集
- 削除
- 一括削除
- 一括ステータス変更
- ソート機能（タイトル、アーティスト、ステータス、配信時刻）

**フォーム項目**:
- タイトル
- スラッグ
- 説明
- アーティスト選択
- 配信開始日時
- ステータス（下書き、配信予定、配信中、アーカイブ、配信終了）
- サムネイル画像URL
- 配信URL（stream_url）
- アーカイブURL（archive_url）

**API**: 
- `GET /api/admin/events`
- `POST /api/admin/events`
- `PUT /api/admin/events/[id]`
- `DELETE /api/admin/events/[id]`

**実装ファイル**: `components/admin/EventsManager.tsx`

**レスポンシブ対応**:
- デスクトップ: テーブル表示
- モバイル: カード表示

**ステータスカラー**:
- 下書き: グレー
- 配信予定: ブルー
- 配信中: レッド（アニメーション）
- アーカイブ: グリーン
- 配信終了: ダークグレー

#### 3.2.4 アーティスト管理

**機能**:
- アーティスト一覧表示
- 新規作成
- 編集
- 削除

**フォーム項目**:
- 名前
- スラッグ
- 説明
- 画像URL

**API**: 
- `GET /api/admin/artists`
- `POST /api/admin/artists`
- `PUT /api/admin/artists/[id]`
- `DELETE /api/admin/artists/[id]`

**実装ファイル**: `components/admin/ArtistsManager.tsx`

#### 3.2.5 チケット管理

**機能**:
- チケット一覧表示
- 新規作成
- 編集
- 削除

**フォーム項目**:
- イベント選択
- チケット名
- 価格
- 通貨（JPY, USD）
- 説明
- 在庫数
- 有効/無効

**API**: 
- `GET /api/admin/tickets`
- `POST /api/admin/tickets`
- `PUT /api/admin/tickets/[id]`
- `DELETE /api/admin/tickets/[id]`

**実装ファイル**: `components/admin/TicketsManager.tsx`

**Toast通知**: 成功・エラーメッセージを表示

#### 3.2.6 購入履歴

**表示内容**:
- 購入ID
- ユーザー名
- ユーザーメール
- イベント名
- チケット名
- 金額
- ステータス
- 購入日時

**API**: `GET /api/admin/purchases`

**実装ファイル**: `components/admin/PurchasesView.tsx`

---

## 4. データベース設計

### 4.1 テーブル一覧

| テーブル名 | 説明 |
|-----------|------|
| `users` | ユーザー情報 |
| `artists` | アーティスト情報 |
| `events` | イベント情報 |
| `tickets` | チケット種別 |
| `purchases` | 購入履歴 |
| `password_reset_tokens` | パスワードリセットトークン |

### 4.2 テーブル定義

#### 4.2.1 users テーブル

```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
```

**カラム説明**:
- `id`: ユーザーID（主キー）
- `name`: ユーザー名
- `email`: メールアドレス（一意）
- `password`: パスワード（bcryptハッシュ化）
- `created_at`: 作成日時
- `updated_at`: 更新日時

#### 4.2.2 artists テーブル

```sql
CREATE TABLE artists (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  image_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_artists_slug ON artists(slug);
```

**カラム説明**:
- `id`: アーティストID（主キー）
- `name`: アーティスト名
- `slug`: URL用スラッグ（一意）
- `description`: 説明
- `image_url`: 画像URL
- `created_at`: 作成日時
- `updated_at`: 更新日時

#### 4.2.3 events テーブル

```sql
CREATE TABLE events (
  id SERIAL PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  slug VARCHAR(200) NOT NULL UNIQUE,
  description TEXT,
  artist_id INTEGER REFERENCES artists(id) ON DELETE SET NULL,
  start_time TIMESTAMP NOT NULL,
  status VARCHAR(20) DEFAULT 'draft',
  thumbnail_url TEXT,
  stream_url TEXT,
  archive_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_events_slug ON events(slug);
CREATE INDEX idx_events_artist_id ON events(artist_id);
CREATE INDEX idx_events_status ON events(status);
CREATE INDEX idx_events_start_time ON events(start_time DESC);
```

**カラム説明**:
- `id`: イベントID（主キー）
- `title`: イベントタイトル
- `slug`: URL用スラッグ（一意）
- `description`: 説明
- `artist_id`: アーティストID（外部キー）
- `start_time`: 配信開始日時
- `status`: ステータス（`draft`, `upcoming`, `live`, `archived`, `ended`）
- `thumbnail_url`: サムネイル画像URL
- `stream_url`: ライブ配信URL（HLS .m3u8）
- `archive_url`: アーカイブ動画URL（HLS .m3u8）
- `created_at`: 作成日時
- `updated_at`: 更新日時

#### 4.2.4 tickets テーブル

```sql
CREATE TABLE tickets (
  id SERIAL PRIMARY KEY,
  event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  price INTEGER NOT NULL,
  currency VARCHAR(3) DEFAULT 'JPY',
  description TEXT,
  stock INTEGER,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_tickets_event_id ON tickets(event_id);
CREATE INDEX idx_tickets_is_active ON tickets(is_active);
```

**カラム説明**:
- `id`: チケットID（主キー）
- `event_id`: イベントID（外部キー）
- `name`: チケット名
- `price`: 価格（整数、最小単位）
- `currency`: 通貨コード（JPY, USD）
- `description`: 説明
- `stock`: 在庫数（NULL = 無制限）
- `is_active`: 有効/無効
- `created_at`: 作成日時
- `updated_at`: 更新日時

#### 4.2.5 purchases テーブル

```sql
CREATE TABLE purchases (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  ticket_id INTEGER REFERENCES tickets(id) ON DELETE SET NULL,
  stripe_session_id VARCHAR(255) UNIQUE,
  stripe_payment_intent_id VARCHAR(255),
  amount INTEGER NOT NULL,
  currency VARCHAR(3) DEFAULT 'JPY',
  status VARCHAR(20) DEFAULT 'pending',
  access_token TEXT,
  token_expires_at TIMESTAMP,
  purchased_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_purchases_user_id ON purchases(user_id);
CREATE INDEX idx_purchases_event_id ON purchases(event_id);
CREATE INDEX idx_purchases_stripe_session_id ON purchases(stripe_session_id);
CREATE INDEX idx_purchases_status ON purchases(status);
```

**カラム説明**:
- `id`: 購入ID（主キー）
- `user_id`: ユーザーID（外部キー）
- `event_id`: イベントID（外部キー）
- `ticket_id`: チケットID（外部キー）
- `stripe_session_id`: Stripe Checkout Session ID
- `stripe_payment_intent_id`: Stripe Payment Intent ID
- `amount`: 金額
- `currency`: 通貨コード
- `status`: ステータス（`pending`, `completed`, `refunded`）
- `access_token`: 視聴用アクセストークン（JWT）
- `token_expires_at`: トークン有効期限
- `purchased_at`: 購入日時

#### 4.2.6 password_reset_tokens テーブル

```sql
CREATE TABLE password_reset_tokens (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(255) NOT NULL UNIQUE,
  expires_at TIMESTAMP NOT NULL,
  used BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_password_reset_tokens_token ON password_reset_tokens(token);
CREATE INDEX idx_password_reset_tokens_user_id ON password_reset_tokens(user_id);
```

**カラム説明**:
- `id`: トークンID（主キー）
- `user_id`: ユーザーID（外部キー）
- `token`: リセットトークン（一意）
- `expires_at`: 有効期限
- `used`: 使用済みフラグ
- `created_at`: 作成日時

### 4.3 ER図

```
users                    password_reset_tokens
+----------------+       +---------------------+
| id (PK)        |◄──────┤ user_id (FK)        |
| name           |       | token               |
| email          |       | expires_at          |
| password       |       | used                |
| created_at     |       +---------------------+
| updated_at     |
+----------------+
      │
      │ 1
      │
      │ *
purchases
+-------------------------+
| id (PK)                 |
| user_id (FK)            |◄──────┐
| event_id (FK)           |       │
| ticket_id (FK)          |       │
| stripe_session_id       |       │
| amount                  |       │
| status                  |       │
| access_token            |       │
| token_expires_at        |       │
| purchased_at            |       │
+-------------------------+       │
      │                           │
      │ *                         │ 1
      │                           │
      ▼                           │
events                    artists
+------------------+      +------------------+
| id (PK)          |      | id (PK)          |
| title            |      | name             |
| slug             |      | slug             |
| description      |      | description      |
| artist_id (FK)   |──────► image_url        |
| start_time       |      | created_at       |
| status           |      | updated_at       |
| thumbnail_url    |      +------------------+
| stream_url       |
| archive_url      |
| created_at       |
| updated_at       |
+------------------+
      │
      │ 1
      │
      │ *
tickets
+------------------+
| id (PK)          |
| event_id (FK)    |
| name             |
| price            |
| currency         |
| description      |
| stock            |
| is_active        |
| created_at       |
| updated_at       |
+------------------+
```

---

## 5. API仕様

### 5.1 認証API

#### 5.1.1 ユーザー登録

**エンドポイント**: `POST /api/auth/register`

**リクエストボディ**:
```json
{
  "name": "山田太郎",
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**レスポンス** (200 OK):
```json
{
  "message": "User registered successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "name": "山田太郎",
    "email": "user@example.com"
  }
}
```

**エラー** (400 Bad Request):
```json
{
  "error": "Email already exists"
}
```

**実装**: `app/api/auth/register/route.ts`

#### 5.1.2 ユーザーログイン

**エンドポイント**: `POST /api/auth/login`

**リクエストボディ**:
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**レスポンス** (200 OK):
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "name": "山田太郎",
    "email": "user@example.com"
  }
}
```

**エラー** (401 Unauthorized):
```json
{
  "error": "Invalid email or password"
}
```

**実装**: `app/api/auth/login/route.ts`

#### 5.1.3 ユーザー情報取得

**エンドポイント**: `GET /api/auth/me`

**リクエストヘッダー**:
```
Authorization: Bearer <JWT_TOKEN>
```

**レスポンス** (200 OK):
```json
{
  "user": {
    "id": 1,
    "name": "山田太郎",
    "email": "user@example.com"
  }
}
```

**エラー** (401 Unauthorized):
```json
{
  "error": "Unauthorized"
}
```

**実装**: `app/api/auth/me/route.ts`

#### 5.1.4 パスワードリセット要求

**エンドポイント**: `POST /api/auth/forgot-password`

**リクエストボディ**:
```json
{
  "email": "user@example.com"
}
```

**レスポンス** (200 OK):
```json
{
  "message": "Password reset email sent"
}
```

**実装**: `app/api/auth/forgot-password/route.ts`

#### 5.1.5 パスワードリセット実行

**エンドポイント**: `POST /api/auth/reset-password`

**リクエストボディ**:
```json
{
  "token": "reset_token_here",
  "newPassword": "NewSecurePass456!"
}
```

**レスポンス** (200 OK):
```json
{
  "message": "Password reset successfully"
}
```

**エラー** (400 Bad Request):
```json
{
  "error": "Invalid or expired token"
}
```

**実装**: `app/api/auth/reset-password/route.ts`

### 5.2 イベントAPI

#### 5.2.1 イベント一覧取得

**エンドポイント**: `GET /api/events`

**クエリパラメータ**:
- `status`: フィルタ（`live`, `upcoming`, `archived`）

**レスポンス** (200 OK):
```json
{
  "events": [
    {
      "id": 1,
      "title": "Summer Live 2026",
      "slug": "summer-live-2026",
      "description": "最高の夏のライブ！",
      "artist_id": 1,
      "artist_name": "Artist Name",
      "start_time": "2026-07-15T19:00:00Z",
      "status": "upcoming",
      "thumbnail_url": "https://example.com/thumb.jpg"
    }
  ]
}
```

**実装**: `app/api/events/route.ts`

#### 5.2.2 イベント詳細取得

**エンドポイント**: `GET /api/events/[slug]`

**レスポンス** (200 OK):
```json
{
  "event": {
    "id": 1,
    "title": "Summer Live 2026",
    "slug": "summer-live-2026",
    "description": "詳細な説明...",
    "artist_id": 1,
    "artist_name": "Artist Name",
    "artist_slug": "artist-name",
    "start_time": "2026-07-15T19:00:00Z",
    "status": "upcoming",
    "thumbnail_url": "https://example.com/thumb.jpg",
    "stream_url": "https://stream.example.com/live.m3u8",
    "archive_url": null
  }
}
```

**エラー** (404 Not Found):
```json
{
  "error": "Event not found"
}
```

**実装**: `app/api/events/[slug]/route.ts`

#### 5.2.3 イベントのチケット一覧取得

**エンドポイント**: `GET /api/events/[slug]/tickets`

**レスポンス** (200 OK):
```json
{
  "tickets": [
    {
      "id": 1,
      "event_id": 1,
      "name": "一般チケット",
      "price": 3000,
      "currency": "JPY",
      "description": "通常の視聴チケット",
      "stock": 100,
      "is_active": true
    }
  ]
}
```

**実装**: `app/api/events/[slug]/tickets/route.ts`

### 5.3 アーティストAPI

#### 5.3.1 アーティスト一覧取得

**エンドポイント**: `GET /api/artists`

**レスポンス** (200 OK):
```json
{
  "artists": [
    {
      "id": 1,
      "name": "Artist Name",
      "slug": "artist-name",
      "description": "アーティスト説明",
      "image_url": "https://example.com/artist.jpg"
    }
  ]
}
```

**実装**: `app/api/artists/route.ts`

#### 5.3.2 アーティスト詳細取得

**エンドポイント**: `GET /api/artists/[slug]`

**レスポンス** (200 OK):
```json
{
  "artist": {
    "id": 1,
    "name": "Artist Name",
    "slug": "artist-name",
    "description": "詳細な説明...",
    "image_url": "https://example.com/artist.jpg"
  },
  "events": [
    {
      "id": 1,
      "title": "Summer Live 2026",
      "slug": "summer-live-2026",
      "start_time": "2026-07-15T19:00:00Z",
      "status": "upcoming",
      "thumbnail_url": "https://example.com/thumb.jpg"
    }
  ]
}
```

**実装**: `app/api/artists/[slug]/route.ts`

### 5.4 購入API

#### 5.4.1 購入履歴取得

**エンドポイント**: `GET /api/purchases/my`

**リクエストヘッダー**:
```
Authorization: Bearer <JWT_TOKEN>
```

**レスポンス** (200 OK):
```json
{
  "purchases": [
    {
      "id": 1,
      "event_id": 1,
      "event_title": "Summer Live 2026",
      "event_slug": "summer-live-2026",
      "ticket_name": "一般チケット",
      "amount": 3000,
      "currency": "JPY",
      "status": "completed",
      "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "token_expires_at": "2026-08-15T19:00:00Z",
      "purchased_at": "2026-07-10T10:30:00Z"
    }
  ]
}
```

**実装**: `app/api/purchases/my/route.ts`

#### 5.4.2 購入完了確認

**エンドポイント**: `GET /api/purchases/[sessionId]`

**レスポンス** (200 OK):
```json
{
  "purchase": {
    "id": 1,
    "event_id": 1,
    "event_title": "Summer Live 2026",
    "status": "completed",
    "amount": 3000,
    "currency": "JPY"
  }
}
```

**実装**: `app/api/purchases/[sessionId]/route.ts`

### 5.5 Stripe API

#### 5.5.1 Checkout Session作成

**エンドポイント**: `POST /api/stripe/checkout`

**リクエストヘッダー**:
```
Authorization: Bearer <JWT_TOKEN>
```

**リクエストボディ**:
```json
{
  "ticketId": 1,
  "eventSlug": "summer-live-2026"
}
```

**レスポンス** (200 OK):
```json
{
  "sessionId": "cs_test_a1b2c3d4e5f6...",
  "url": "https://checkout.stripe.com/pay/cs_test_..."
}
```

**実装**: `app/api/stripe/checkout/route.ts`

#### 5.5.2 Webhook

**エンドポイント**: `POST /api/stripe/webhook`

**処理イベント**:
- `checkout.session.completed`: 購入完了、purchasesテーブル更新
- `charge.refunded`: 返金、ステータス更新

**実装**: `app/api/stripe/webhook/route.ts`

### 5.6 視聴API

#### 5.6.1 視聴トークン検証

**エンドポイント**: `POST /api/watch/verify`

**リクエストボディ**:
```json
{
  "token": "access_token_jwt",
  "eventSlug": "summer-live-2026"
}
```

**レスポンス** (200 OK):
```json
{
  "valid": true,
  "event": {
    "id": 1,
    "title": "Summer Live 2026",
    "slug": "summer-live-2026",
    "status": "live",
    "description": "...",
    "artist_name": "Artist Name",
    "start_time": "2026-07-15T19:00:00Z"
  }
}
```

**エラー** (401 Unauthorized):
```json
{
  "error": "Invalid or expired token"
}
```

**実装**: `app/api/watch/verify/route.ts`

#### 5.6.2 ストリームURL取得

**エンドポイント**: `POST /api/watch/stream-url`

**リクエストボディ**:
```json
{
  "token": "access_token_jwt",
  "eventSlug": "summer-live-2026"
}
```

**レスポンス** (200 OK):
```json
{
  "streamUrl": "https://cdn.example.com/live.m3u8?signature=...",
  "status": "live"
}
```

**エラー** (404 Not Found):
```json
{
  "error": "ストリーミングURLが設定されていません"
}
```

**実装**: `app/api/watch/stream-url/route.ts`

### 5.7 管理API

#### 5.7.1 統計情報取得

**エンドポイント**: `GET /api/admin/stats`

**認証**: Basic認証

**レスポンス** (200 OK):
```json
{
  "totalRevenue": 150000,
  "totalPurchases": 50,
  "totalEvents": 10,
  "totalArtists": 5
}
```

**実装**: `app/api/admin/stats/route.ts`

#### 5.7.2 イベント管理API

**一覧取得**: `GET /api/admin/events`  
**作成**: `POST /api/admin/events`  
**更新**: `PUT /api/admin/events/[id]`  
**削除**: `DELETE /api/admin/events/[id]`

**実装**: `app/api/admin/events/route.ts`, `app/api/admin/events/[id]/route.ts`

#### 5.7.3 アーティスト管理API

**一覧取得**: `GET /api/admin/artists`  
**作成**: `POST /api/admin/artists`  
**更新**: `PUT /api/admin/artists/[id]`  
**削除**: `DELETE /api/admin/artists/[id]`

**実装**: `app/api/admin/artists/route.ts`, `app/api/admin/artists/[id]/route.ts`

#### 5.7.4 チケット管理API

**一覧取得**: `GET /api/admin/tickets`  
**作成**: `POST /api/admin/tickets`  
**更新**: `PUT /api/admin/tickets/[id]`  
**削除**: `DELETE /api/admin/tickets/[id]`

**実装**: `app/api/admin/tickets/route.ts`, `app/api/admin/tickets/[id]/route.ts`

---

## 6. 認証・セキュリティ

### 6.1 ユーザー認証

#### 6.1.1 JWT認証

**トークン生成**:
```typescript
import jwt from 'jsonwebtoken';

const token = jwt.sign(
  { userId: user.id, email: user.email },
  process.env.JWT_SECRET!,
  { expiresIn: '7d' }
);
```

**トークン検証**:
```typescript
import { verifyToken } from '@/lib/auth';

const payload = verifyToken(token);
if (!payload) {
  return { error: 'Unauthorized' };
}
```

**実装**: `lib/auth.ts`, `lib/userAuth.ts`

#### 6.1.2 パスワードハッシュ化

```typescript
import bcrypt from 'bcryptjs';

// ハッシュ化
const hashedPassword = await bcrypt.hash(password, 10);

// 検証
const isValid = await bcrypt.compare(password, hashedPassword);
```

**実装**: `app/api/auth/register/route.ts`, `app/api/auth/login/route.ts`

#### 6.1.3 localStorage管理

**保存**:
```typescript
import { setAuthToken } from '@/lib/userAuth';

setAuthToken(token); // localStorage.setItem('auth_token', token)
```

**取得**:
```typescript
import { getAuthToken } from '@/lib/userAuth';

const token = getAuthToken(); // localStorage.getItem('auth_token')
```

**削除**:
```typescript
import { removeAuthToken } from '@/lib/userAuth';

removeAuthToken(); // localStorage.removeItem('auth_token')
```

**実装**: `lib/userAuth.ts`

**重要**: SSR非対応問題を解決するため、`mounted`状態管理を実装

### 6.2 管理者認証

#### 6.2.1 Basic認証

**実装**:
```typescript
import { authenticate } from '@/lib/adminAuth';

const authResult = authenticate(request);
if (!authResult.authenticated) {
  return new Response('Unauthorized', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Admin Area"'
    }
  });
}
```

**環境変数**:
```bash
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
```

**実装**: `lib/adminAuth.ts`

### 6.3 視聴認証

#### 6.3.1 アクセストークン

購入完了時に生成されるJWT：

```typescript
const accessToken = jwt.sign(
  { 
    purchaseId: purchase.id,
    userId: user.id,
    eventId: event.id
  },
  process.env.JWT_SECRET!,
  { expiresIn: '30d' }
);
```

**有効期限**: 30日間

**実装**: `app/api/stripe/webhook/route.ts`

#### 6.3.2 視聴前検証

```typescript
// 1. トークン検証
const payload = verifyToken(accessToken);

// 2. イベントID一致確認
if (payload.eventId !== event.id) {
  return { error: 'Token not valid for this event' };
}

// 3. 有効期限確認（DBで管理）
if (new Date() > purchase.token_expires_at) {
  return { error: 'Token expired' };
}
```

**実装**: `app/api/watch/verify/route.ts`

### 6.4 CSRF対策

Next.jsのAPI Routesは自動的にSameSite Cookie属性を設定。

### 6.5 XSS対策

- Reactの自動エスケープを利用
- `dangerouslySetInnerHTML`は使用しない

### 6.6 SQL Injection対策

- パラメータ化クエリを使用

```typescript
const result = await query(
  'SELECT * FROM users WHERE email = $1',
  [email]
);
```

**実装**: `lib/db.ts`

---

## 7. 決済システム

### 7.1 Stripe統合

#### 7.1.1 Checkout Session

**フロー**:
```
1. ユーザーがチケット選択
   ↓
2. POST /api/stripe/checkout
   - Stripe Checkout Session作成
   - success_url: /success?session_id={CHECKOUT_SESSION_ID}
   - cancel_url: /events/[slug]
   ↓
3. Stripeの決済画面にリダイレクト
   ↓
4. 決済完了
   ↓
5. /success ページへリダイレクト
   ↓
6. Webhook経由で購入レコード作成
```

**Checkout Session作成**:
```typescript
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const session = await stripe.checkout.sessions.create({
  payment_method_types: ['card'],
  line_items: [{
    price_data: {
      currency: ticket.currency,
      product_data: {
        name: `${event.title} - ${ticket.name}`,
        description: event.description,
      },
      unit_amount: ticket.price,
    },
    quantity: 1,
  }],
  mode: 'payment',
  success_url: `${process.env.NEXT_PUBLIC_APP_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
  cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/events/${eventSlug}`,
  metadata: {
    userId: user.id,
    eventId: event.id,
    ticketId: ticket.id,
  },
});
```

**実装**: `app/api/stripe/checkout/route.ts`

#### 7.1.2 Webhook処理

**イベント処理**:

1. **checkout.session.completed**
   - 購入レコード作成
   - アクセストークン生成
   - ステータス: `completed`

2. **charge.refunded**
   - ステータス更新: `refunded`

**Webhook検証**:
```typescript
const sig = request.headers.get('stripe-signature');
const event = stripe.webhooks.constructEvent(
  body,
  sig,
  process.env.STRIPE_WEBHOOK_SECRET!
);
```

**実装**: `app/api/stripe/webhook/route.ts`

#### 7.1.3 テストカード

**成功**:
- カード番号: `4242 4242 4242 4242`
- 有効期限: 任意の未来の日付
- CVC: 任意の3桁

**失敗**:
- カード番号: `4000 0000 0000 0002`

### 7.2 在庫管理

チケットの`stock`カラムで管理：
- `NULL`: 無制限
- `数値`: 在庫数

購入時に在庫チェック（実装推奨）。

---

## 8. 動画配信システム

### 8.1 AWS IVS統合

#### 8.1.1 ストリーム設定

**IVSチャンネル設定**:
- チャンネルタイプ: STANDARD or BASIC
- Transcoding: 有効（複数画質配信）
- 推奨ビットレート:
  - 1080p: 4-6 Mbps
  - 720p: 2-3 Mbps
  - 480p: 1-1.5 Mbps
  - 360p: 0.5-1 Mbps

**Playback URL**: `https://xxxxx.ap-northeast-1.playback.live-video.net/api/video/v1/...m3u8`

**実装**: `events.stream_url` に保存

#### 8.1.2 HLS.js プレーヤー

**初期化**:
```typescript
import Hls from 'hls.js';

const hls = new Hls({
  enableWorker: true,
  lowLatencyMode: true,
  debug: false,
});

hls.loadSource(streamUrl);
hls.attachMedia(video);
```

**画質レベル取得**:
```typescript
hls.on(Hls.Events.MANIFEST_PARSED, () => {
  const levels = hls.levels.map((level, index) => ({
    level: index,
    height: level.height,
    bitrate: level.bitrate,
  }));
  setAvailableQualities(levels);
});
```

**画質切り替え**:
```typescript
hls.currentLevel = level; // -1: auto, 0+: specific level
```

**実装**: `components/WatchPlayer.tsx`

#### 8.1.3 Safari対応

SafariはネイティブでHLSをサポート：
```typescript
if (video.canPlayType('application/vnd.apple.mpegurl')) {
  video.src = streamUrl; // ネイティブ再生
} else if (Hls.isSupported()) {
  // HLS.js 使用
}
```

**注意**: Safari では画質の手動切り替えができない（自動のみ）

### 8.2 CloudFront署名付きURL（オプション）

#### 8.2.1 署名生成

```typescript
import { getSignedUrl } from '@aws-sdk/cloudfront-signer';

const signedUrl = getSignedUrl({
  url: streamUrl,
  keyPairId: process.env.CLOUDFRONT_KEY_PAIR_ID!,
  privateKey: process.env.CLOUDFRONT_PRIVATE_KEY!,
  dateLessThan: new Date(Date.now() + 3600 * 1000).toISOString(),
});
```

**実装**: `lib/cloudfront.ts`

**環境変数**:
```bash
CLOUDFRONT_KEY_PAIR_ID=APKAXXXXXXXXXXXXXXXX
CLOUDFRONT_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\n..."
```

### 8.3 アーカイブ動画

**保存先**: `events.archive_url`

**切り替えロジック**:
```typescript
const url = event.status === 'live' 
  ? event.stream_url 
  : event.archive_url || event.stream_url;
```

**実装**: `app/api/watch/stream-url/route.ts`

---

## 9. UI/UXデザイン

### 9.1 デザインシステム

#### 9.1.1 カラーパレット

**プライマリー**:
- 紫: `#8B5CF6` (purple-500)
- 濃い紫: `#7C3AED` (purple-600)
- 暗い紫: `#6D28D9` (purple-700)

**背景**:
- グラデーション: `from-gray-900 via-purple-900/20 to-gray-900`
- ダークグレー: `#111827` (gray-900)
- ブラック: `#000000`

**ステータスカラー**:
- 成功/完了: `#10B981` (green-500)
- エラー/配信中: `#EF4444` (red-500)
- 警告/配信予定: `#3B82F6` (blue-500)
- グレー/下書き: `#6B7280` (gray-500)

#### 9.1.2 タイポグラフィ

- フォント: システムデフォルト (`font-sans`)
- 見出し: `text-2xl`, `text-3xl`, `font-bold`
- 本文: `text-base`, `text-sm`
- キャプション: `text-xs`

#### 9.1.3 コンポーネント

**ボタン**:
```tsx
<button className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-lg transition">
  クリック
</button>
```

**カード**:
```tsx
<div className="bg-black/40 backdrop-blur-md rounded-xl border border-gray-800/50 p-6">
  コンテンツ
</div>
```

**ガラスモーフィズム**:
```tsx
<div className="bg-black/60 backdrop-blur-lg rounded-2xl">
  コンテンツ
</div>
```

### 9.2 レスポンシブデザイン

#### 9.2.1 ブレークポイント

| サイズ | 幅 | Tailwind |
|--------|---|----------|
| モバイル | < 640px | デフォルト |
| タブレット | 640px - 1024px | `sm:`, `md:` |
| デスクトップ | > 1024px | `lg:`, `xl:` |

#### 9.2.2 グリッド

**イベントカード**:
```tsx
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
  {/* カード */}
</div>
```

**画質ボタン**:
```tsx
<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
  {/* ボタン */}
</div>
```

### 9.3 アニメーション

**ホバー効果**:
```tsx
<button className="hover:scale-105 transition-all">
  ボタン
</button>
```

**配信中バッジ**:
```tsx
<span className="animate-pulse">配信中</span>
```

**ローディング**:
```tsx
<i className="fas fa-spinner fa-spin"></i>
```

### 9.4 アイコン

**Font Awesome** (CDN):
```html
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
```

**使用例**:
```tsx
<i className="fas fa-user"></i>        {/* ユーザー */}
<i className="fas fa-calendar"></i>    {/* カレンダー */}
<i className="fas fa-play"></i>        {/* 再生 */}
<i className="fas fa-broadcast-tower"></i> {/* 配信 */}
```

---

## 10. デプロイメント

### 10.1 環境変数

`.env.local`:
```bash
# Database
DATABASE_URL=postgresql://user:pass@host:5432/streaming_platform

# Stripe
STRIPE_SECRET_KEY=sk_test_xxxxx
STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx

# JWT & Admin
JWT_SECRET=your_secret_key_min_32_chars
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your_secure_password

# App URL
NEXT_PUBLIC_APP_URL=https://yourdomain.com

# CloudFront (Optional)
CLOUDFRONT_KEY_PAIR_ID=APKAXXXXXXXXXXXXXXXX
CLOUDFRONT_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\n..."

# Email (Optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your@email.com
SMTP_PASS=your_password
SMTP_FROM=noreply@yourdomain.com
```

### 10.2 AWS EC2デプロイ

#### 10.2.1 EC2インスタンス準備

```bash
# Node.js インストール
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
sudo yum install -y nodejs

# PM2 インストール
sudo npm install -g pm2

# PostgreSQL クライアント
sudo yum install -y postgresql
```

#### 10.2.2 アプリケーションデプロイ

```bash
# リポジトリクローン
cd /home/ec2-user
git clone https://github.com/yotamatsumaru/0222-VOD.git webapp
cd webapp

# 依存関係インストール
npm install

# 環境変数設定
nano .env.local
# 上記の環境変数を入力

# ビルド
npm run build

# PM2で起動
pm2 start npm --name "streaming-app" -- start
pm2 save
pm2 startup
```

#### 10.2.3 Nginx設定

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

#### 10.2.4 デプロイスクリプト

`deploy.sh`:
```bash
#!/bin/bash
set -e

echo "🚀 Starting deployment..."

# Git pull
git pull origin main

# Install dependencies
npm install

# Build
npm run build

# Restart PM2
pm2 restart streaming-app

echo "✅ Deployment completed!"
```

**使用方法**:
```bash
chmod +x deploy.sh
./deploy.sh
```

### 10.3 AWS RDS設定

#### 10.3.1 PostgreSQL作成

- Engine: PostgreSQL 14+
- Instance class: db.t3.micro (開発用)
- Storage: 20GB SSD
- Public access: No (VPC内のみ)

#### 10.3.2 セキュリティグループ

EC2からRDSへのアクセスを許可：
```
Type: PostgreSQL
Protocol: TCP
Port: 5432
Source: <EC2 Security Group>
```

#### 10.3.3 データベース初期化

```bash
# RDSエンドポイントに接続
psql -h <rds-endpoint> -U postgres -d streaming_platform

# テーブル作成（初回のみ）
\i schema.sql
```

### 10.4 SSL/TLS設定

#### 10.4.1 Let's Encrypt

```bash
# Certbot インストール
sudo yum install -y certbot python3-certbot-nginx

# SSL証明書取得
sudo certbot --nginx -d yourdomain.com

# 自動更新設定
sudo certbot renew --dry-run
```

### 10.5 監視・ログ

#### 10.5.1 PM2ログ

```bash
# ログ確認
pm2 logs streaming-app

# エラーログのみ
pm2 logs streaming-app --err

# リアルタイム監視
pm2 monit
```

#### 10.5.2 CloudWatch（推奨）

EC2メトリクス:
- CPU使用率
- メモリ使用率
- ネットワークトラフィック

RDSメトリクス:
- DB接続数
- CPU使用率
- ストレージ容量

---

## 11. 開発ガイド

### 11.1 ローカル開発環境

#### 11.1.1 セットアップ

```bash
# リポジトリクローン
git clone https://github.com/yotamatsumaru/0222-VOD.git
cd 0222-VOD

# 依存関係インストール
npm install

# 環境変数設定
cp .env.example .env.local
nano .env.local

# ローカルPostgreSQL起動
createdb streaming_platform

# テーブル作成
psql -d streaming_platform -f schema.sql

# 開発サーバー起動
npm run dev
```

ブラウザで http://localhost:3000 にアクセス

#### 11.1.2 開発コマンド

```bash
# 開発サーバー
npm run dev

# ビルド
npm run build

# 本番モード起動
npm start

# Linter
npm run lint

# 型チェック
npx tsc --noEmit
```

### 11.2 コーディング規約

#### 11.2.1 TypeScript

- 型定義を明示（`any`は避ける）
- インターフェースは`lib/types.ts`に集約
- `async/await`を使用（Promiseチェーンは避ける）

#### 11.2.2 React

- Functional Component を使用
- `'use client'`を必要な場合のみ追加
- Hooksの順序を守る

#### 11.2.3 命名規則

- コンポーネント: PascalCase (`EventCard.tsx`)
- 関数: camelCase (`getUserInfo`)
- 定数: UPPER_SNAKE_CASE (`JWT_SECRET`)
- ファイル: kebab-case またはPascalCase

### 11.3 Git ワークフロー

#### 11.3.1 ブランチ戦略

```
main (本番)
  └── develop (開発)
       ├── feature/xxx (新機能)
       ├── fix/xxx (バグ修正)
       └── refactor/xxx (リファクタリング)
```

#### 11.3.2 コミットメッセージ

```
<type>(<scope>): <subject>

feat: 新機能
fix: バグ修正
docs: ドキュメント
style: フォーマット
refactor: リファクタリング
test: テスト
chore: その他
```

**例**:
```bash
git commit -m "feat(watch): 画質設定を動画の下に配置"
git commit -m "fix(mypage): auth_tokenキーに統一"
```

### 11.4 テスト

#### 11.4.1 手動テスト項目

**ユーザーフロー**:
- [ ] 新規登録
- [ ] ログイン
- [ ] イベント閲覧
- [ ] チケット購入（Stripeテストカード）
- [ ] マイページ確認
- [ ] 動画視聴
- [ ] ログアウト

**管理フロー**:
- [ ] 管理画面ログイン
- [ ] イベント作成・編集・削除
- [ ] アーティスト作成・編集・削除
- [ ] チケット作成・編集・削除
- [ ] 購入履歴確認

**レスポンシブ**:
- [ ] モバイル（375px）
- [ ] タブレット（768px）
- [ ] デスクトップ（1920px）

#### 11.4.2 ブラウザテスト

- [ ] Chrome
- [ ] Firefox
- [ ] Safari
- [ ] Edge

---

## 12. トラブルシューティング

### 12.1 よくある問題

#### 12.1.1 ログインできない

**症状**: ログイン成功後、マイページにアクセスできない

**原因**:
- `auth_token` と `authToken` のキー不一致
- SSRでのlocalStorage非対応

**解決策**:
1. ブラウザコンソールで `localStorage.clear()`
2. 再ログイン
3. コンソールログ確認:
   ```
   [Navigation] Is authenticated: true
   [MyPage] Token exists: true
   ```

**実装修正済み**: コミット `e84b739`

#### 12.1.2 画質ボタンが表示されない

**症状**: 視聴ページに画質切り替えボタンが表示されない

**原因**:
- Safari（ネイティブHLS）使用
- HLS.js でマニフェストに画質レベルが含まれていない
- AWS IVS の Transcoding が無効

**確認方法**:
```javascript
// ブラウザコンソール
[WatchPlayer] Available levels: 0  // 問題
[WatchPlayer] Available levels: 3  // OK
```

**解決策**:
1. AWS IVS チャンネルで Transcoding を有効化
2. 複数ビットレート設定を追加

**代替表示**: 「自動画質調整中」メッセージ

**実装修正済み**: コミット `7903a04`

#### 12.1.3 Stripe Webhook が動作しない

**症状**: 購入完了後、マイページに表示されない

**原因**:
- Webhook Secret が未設定
- Webhookエンドポイントが未登録

**確認**:
```bash
# Stripe CLI でテスト
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

**解決策**:
1. Stripe Dashboard → Webhooks → エンドポイント追加
   - URL: `https://yourdomain.com/api/stripe/webhook`
   - イベント: `checkout.session.completed`, `charge.refunded`
2. Webhook Secret を `.env.local` に追加

#### 12.1.4 動画が再生されない

**症状**: 視聴ページで「ストリーミングエラー」

**原因**:
- `stream_url` が未設定
- URL形式が正しくない（.m3u8 で終わっていない）
- CORS設定

**確認**:
```javascript
// ブラウザコンソール
[WatchPlayer] Stream URL obtained: https://...m3u8
[WatchPlayer] HLS error: { type: 'networkError', ... }
```

**解決策**:
1. 管理画面でイベントの `stream_url` を確認
2. URLを直接ブラウザで開いて確認
3. AWS IVS チャンネルの状態を確認

#### 12.1.5 データベース接続エラー

**症状**: `Error: Connection refused`

**原因**:
- PostgreSQL が起動していない
- `DATABASE_URL` が間違っている
- RDS セキュリティグループ設定

**解決策**:
```bash
# ローカル
sudo service postgresql start
psql -d streaming_platform -c "SELECT 1"

# RDS
psql -h <rds-endpoint> -U postgres -d streaming_platform
```

**環境変数確認**:
```bash
echo $DATABASE_URL
```

#### 12.1.6 ビルドエラー

**症状**: `npm run build` が失敗

**原因**:
- 型エラー
- 環境変数未設定
- 依存関係の問題

**解決策**:
```bash
# 依存関係再インストール
rm -rf node_modules package-lock.json
npm install

# 型チェック
npx tsc --noEmit

# 詳細ログ
npm run build --verbose
```

### 12.2 デバッグ方法

#### 12.2.1 ブラウザコンソール

**開き方**: F12 キー

**確認項目**:
- エラーメッセージ
- ネットワークタブ（API呼び出し）
- Consoleログ（`[WatchPlayer]`, `[MyPage]` など）
- Application → Local Storage（`auth_token`）

#### 12.2.2 サーバーログ

**PM2**:
```bash
pm2 logs streaming-app
pm2 logs streaming-app --err --lines 100
```

**Next.js 開発サーバー**:
```bash
npm run dev
# ターミナルでログ確認
```

#### 12.2.3 データベース確認

```sql
-- ユーザー確認
SELECT * FROM users WHERE email = 'user@example.com';

-- 購入履歴確認
SELECT * FROM purchases WHERE user_id = 1;

-- イベント確認
SELECT id, title, slug, status, stream_url FROM events;
```

### 12.3 パフォーマンス最適化

#### 12.3.1 画像最適化

Next.js の Image コンポーネントを使用（推奨）:
```tsx
import Image from 'next/image';

<Image 
  src={event.thumbnail_url} 
  alt={event.title}
  width={800}
  height={450}
  priority
/>
```

#### 12.3.2 コード分割

動的インポート:
```tsx
import dynamic from 'next/dynamic';

const WatchPlayer = dynamic(() => import('@/components/WatchPlayer'), {
  ssr: false,
  loading: () => <div>Loading...</div>
});
```

#### 12.3.3 データベースインデックス

```sql
CREATE INDEX idx_events_slug ON events(slug);
CREATE INDEX idx_events_status ON events(status);
CREATE INDEX idx_purchases_user_id ON purchases(user_id);
```

---

## 13. 今後の改善案

### 13.1 機能追加

- [ ] コメント機能（ライブチャット）
- [ ] お気に入り機能
- [ ] 通知機能（メール、プッシュ）
- [ ] クーポン・割引機能
- [ ] サブスクリプションプラン
- [ ] ソーシャルログイン（Google, Twitter）
- [ ] モバイルアプリ（React Native）

### 13.2 技術改善

- [ ] ユニットテスト（Jest, React Testing Library）
- [ ] E2Eテスト（Playwright）
- [ ] CI/CD（GitHub Actions）
- [ ] Docker化
- [ ] Redis キャッシュ
- [ ] CDN統合（CloudFront, CloudFlare）
- [ ] 監視（Sentry, DataDog）

### 13.3 UX改善

- [ ] ダークモード切り替え
- [ ] 多言語対応（i18n）
- [ ] アクセシビリティ（WCAG準拠）
- [ ] PWA対応
- [ ] オフライン視聴（ダウンロード）

---

## 14. 参考資料

### 14.1 公式ドキュメント

- **Next.js**: https://nextjs.org/docs
- **TypeScript**: https://www.typescriptlang.org/docs
- **Tailwind CSS**: https://tailwindcss.com/docs
- **Stripe**: https://stripe.com/docs
- **HLS.js**: https://github.com/video-dev/hls.js
- **AWS IVS**: https://docs.aws.amazon.com/ivs/

### 14.2 プロジェクトリンク

- **GitHub**: https://github.com/yotamatsumaru/0222-VOD
- **README**: [README.md](./README.md)
- **完全ドキュメント**: [DOCUMENTATION.md](./DOCUMENTATION.md)

### 14.3 お問い合わせ

技術的な質問や問題報告は GitHub Issues にお願いします。

---

**最終更新**: 2026-02-23  
**バージョン**: 1.0  
**作成者**: AI Developer (Claude)
