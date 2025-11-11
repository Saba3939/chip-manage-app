import { ReactNode } from 'react';

/**
 * 認証関連ページのレイアウト
 * シックな白黒デザインでモバイルファースト
 */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-8">
      <div className="w-full max-w-md">
        {/* アプリロゴ/タイトル */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-foreground tracking-tight leading-tight">
            チップ管理アプリ
          </h1>
          <p className="text-muted-foreground mt-3 text-base leading-relaxed">
            ゲームのチップをスマートに管理
          </p>
        </div>

        {/* 認証フォームコンテンツ */}
        {children}
      </div>
    </div>
  );
}
