# Task 01: プロジェクト初期設定

## 目的
Next.js プロジェクトに必要なライブラリをインストールし、基本的な設定を行う。

## 実装内容

### 1. 必要なパッケージのインストール
- shadcn/ui の初期化
- Tailwind CSS の設定確認
- QRコードライブラリのインストール
  - `qrcode.react` - QRコード生成用
  - `html5-qrcode` - QRコード読み取り用

### 2. shadcn/uiコンポーネントのインストール
以下のコンポーネントを追加：
- Button
- Card
- Input
- Label
- Dialog
- Form
- Table
- Avatar
- Badge
- Separator

### 3. ディレクトリ構造の作成
```
app/
├── (auth)/
│   ├── login/
│   └── register/
├── (main)/
│   ├── dashboard/
│   ├── session/
│   │   ├── create/
│   │   ├── [id]/
│   │   └── join/[id]/
│   └── history/
components/
├── ui/              # shadcn/ui
├── session/
├── chip/
└── qr/
lib/
├── supabase/
└── utils.ts
hooks/
types/
```

### 4. 共通レイアウトの設定
- ルートレイアウト（`app/layout.tsx`）
- 認証レイアウト（`app/(auth)/layout.tsx`）
- メインレイアウト（`app/(main)/layout.tsx`）

### 5. 型定義ファイルの作成
- `types/index.ts` - 共通型定義
  - User型
  - Session型
  - Participant型
  - Balance型
  - Transaction型

### 6. Tailwind設定のカスタマイズ
- カラースキーマの定義
- フォント設定
- レスポンシブブレークポイント

## 完了条件
- [ ] 全パッケージが正常にインストールされている
- [ ] `npm run dev` でプロジェクトが起動する
- [ ] ディレクトリ構造が作成されている
- [ ] shadcn/uiコンポーネントが使用可能

## 動作確認
```bash
npm run dev
```
- http://localhost:3000 にアクセスできること
- コンソールにエラーが出ていないこと

## 参考リンク
- [shadcn/ui インストール](https://ui.shadcn.com/docs/installation/next)
- [Next.js App Router](https://nextjs.org/docs/app)
