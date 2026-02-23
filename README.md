# ライブ配信・ストリーミングプラットフォーム

AWS・Stripe・Next.jsを使用したライブ配信・ストリーミング基盤

[![Next.js](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.2-38bdf8)](https://tailwindcss.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14+-336791)](https://www.postgresql.org/)
[![Stripe](https://img.shields.io/badge/Stripe-API-008CDD)](https://stripe.com/)

## 🎯 主な機能

- ✅ イベント管理（ライブ/アーカイブ配信）
- ✅ アーティスト管理
- ✅ チケット購入システム（Stripe決済）
- ✅ 視聴認証（JWT）
- ✅ HLS動画プレイヤー
- ✅ CloudFront署名付きURL（DRM対応）
- ✅ 管理画面（ダッシュボード、CRUD操作）

## 🚀 クイックスタート

```bash
# リポジトリをクローン
git clone https://github.com/yotamatsumaru/0222-VOD.git
cd 0222-VOD

# 依存関係をインストール
npm install

# 環境変数を設定
cp .env.example .env.local
# .env.localを編集

# データベースを作成
createdb streaming_platform

# マイグレーション実行
npm run db:migrate

# 開発サーバー起動
npm run dev
```

ブラウザで http://localhost:3000 にアクセス

## 📚 完全ドキュメント

すべての詳細情報は **[DOCUMENTATION.md](./DOCUMENTATION.md)** をご覧ください：

- ✨ プロジェクト概要と機能詳細
- ⚙️ 環境構築手順
- 🚀 AWS EC2 + RDS デプロイ
- 🔧 トラブルシューティング
- 💳 Stripe設定
- 📡 API仕様
- 🗄️ データベース設計

## 🎬 使い方

### ユーザーフロー

1. **イベントを探す** → トップページでイベント閲覧
2. **チケット購入** → Stripe Checkoutで決済
3. **視聴** → アクセストークンで視聴ページにアクセス

### 管理者フロー

1. **管理画面にアクセス** → `https://your-domain.com/admin`
2. **ログイン** → Basic認証（デフォルト: admin / admin123）
3. **ダッシュボード** → 売上統計や購入数を確認
4. **イベント管理** → イベントの作成・編集・削除
5. **アーティスト管理** → アーティストの追加・編集
6. **チケット管理** → チケット種別の設定・在庫管理

## 🔑 環境変数

`.env.local` ファイルに以下を設定：

```bash
# Database
DATABASE_URL=postgresql://user:pass@host:5432/streaming_platform

# Stripe
STRIPE_SECRET_KEY=sk_test_your_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_key

# JWT & Admin
JWT_SECRET=your_secret_32_chars_min
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your_password

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## 🎨 スクリーンショット

### トップページ
紫のグラデーション背景で洗練されたUIデザイン

### 管理画面
売上統計、イベント・アーティスト・チケットの完全管理

## 📊 技術スタック

- **フロントエンド**: Next.js 16 (App Router), TypeScript, Tailwind CSS 4
- **バックエンド**: Next.js API Routes, PostgreSQL
- **決済**: Stripe
- **認証**: JWT (jsonwebtoken)
- **動画再生**: HLS.js, Video.js
- **配信**: AWS MediaLive, MediaPackage, CloudFront

## 🚀 デプロイ

### Vercel

```bash
vercel --prod
```

### AWS EC2 + RDS

詳細は **[DOCUMENTATION.md](./DOCUMENTATION.md#aws-ec2--rds-デプロイ)** を参照

## 🐛 トラブルシューティング

問題が発生した場合は **[DOCUMENTATION.md](./DOCUMENTATION.md#トラブルシューティング)** を参照してください。

一般的な問題：
- 管理画面ログインエラー
- データベース接続エラー
- Stripe決済エラー

## 📝 ライセンス

本プロジェクトは開発中のベータ版です。

## 🔗 リンク

- **GitHub**: https://github.com/yotamatsumaru/0222-VOD
- **完全ドキュメント**: [DOCUMENTATION.md](./DOCUMENTATION.md)

---

**最終更新**: 2026-02-22
