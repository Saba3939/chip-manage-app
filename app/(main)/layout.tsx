'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { User, LogOut, Settings, History } from 'lucide-react';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { useAuth } from '@/hooks/useAuth';

/**
 * メインアプリケーションのレイアウト
 * ヘッダーとナビゲーションを含む
 */
export default function MainLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { user, signOut } = useAuth();

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // ユーザー名の取得（表示名またはメールアドレスから）
  const displayName =
    user?.user_metadata?.display_name ||
    user?.email?.split('@')[0] ||
    'ユーザー';

  return (
    <AuthGuard>
      <div className="min-h-screen bg-background">
        {/* ヘッダー */}
        <header className="bg-card border-b border-border sticky top-0 z-50 shadow-sm">
          <div className="container mx-auto px-4 h-16 flex items-center justify-between">
            {/* ロゴ/タイトル */}
            <Link href="/dashboard" className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-foreground tracking-tight">
                チップ管理
              </h1>
            </Link>

            {/* ナビゲーション */}
            <nav className="flex items-center gap-4">
              {/* デスクトップナビゲーション */}
              <div className="hidden md:flex items-center gap-2">
                <Link href="/dashboard">
                  <Button variant="ghost" size="sm">
                    ダッシュボード
                  </Button>
                </Link>
                <Link href="/history">
                  <Button variant="ghost" size="sm">
                    履歴
                  </Button>
                </Link>
              </div>

              {/* ユーザーメニュー */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className="text-xs">
                        {displayName[0]?.toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden md:inline">{displayName}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>マイアカウント</DropdownMenuLabel>
                  <DropdownMenuSeparator />

                  {/* モバイルナビゲーション */}
                  <div className="md:hidden">
                    <DropdownMenuItem onClick={() => router.push('/dashboard')}>
                      <User className="mr-2 h-4 w-4" />
                      <span>ダッシュボード</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => router.push('/history')}>
                      <History className="mr-2 h-4 w-4" />
                      <span>履歴</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </div>

                  <DropdownMenuItem disabled>
                    <Settings className="mr-2 h-4 w-4" />
                    <span>設定</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>ログアウト</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </nav>
          </div>
        </header>

        {/* メインコンテンツ */}
        <main className="container mx-auto px-4 py-6">{children}</main>
      </div>
    </AuthGuard>
  );
}
