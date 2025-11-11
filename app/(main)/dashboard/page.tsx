import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Plus, Users, Coins } from 'lucide-react';
import { getCurrentUser } from '@/lib/auth/actions';
import { getSessionsByUser } from '@/lib/session/actions';
import { signOut } from '@/lib/auth/actions';
import { getCurrentUserProfile } from '@/lib/profile/actions';

/**
 * ダッシュボード画面
 * ユーザーのアクティブセッションと履歴を表示
 */
export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  // プロファイル情報を取得（ポイント残高を含む）
  const { data: profile } = await getCurrentUserProfile();

  const sessions = await getSessionsByUser(user.id);
  const activeSessions = sessions.filter(
    (s) => s.status === 'waiting' || s.status === 'active'
  );
  const recentHistory = sessions
    .filter((s) => s.status === 'completed')
    .slice(0, 3);

  // ログアウト処理
  async function handleSignOut() {
    'use server';
    await signOut();
  }

  return (
    <div className="space-y-8 pb-8">
      {/* ポイント残高カード */}
      {profile && (
        <Card className="bg-muted/50 border-border shadow-md">
          <CardHeader className="space-y-3 pb-4">
            <CardTitle className="flex items-center gap-2 text-xl">
              <Coins className="h-6 w-6 text-foreground" />
              保有ポイント
            </CardTitle>
            <CardDescription className="text-base">
              ゲームで獲得したポイントが累積されます
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-5xl font-bold text-foreground">
              {profile.points.toLocaleString()}
              <span className="text-xl text-muted-foreground ml-2">pts</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* アクションカード */}
      <div className="grid grid-cols-1 gap-4">
        <Link href="/session/create">
          <Card className="hover:shadow-lg transition-all hover:border-foreground/20 cursor-pointer active:scale-98">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-full bg-foreground flex items-center justify-center flex-shrink-0">
                  <Plus className="h-7 w-7 text-background" />
                </div>
                <div>
                  <CardTitle className="text-xl mb-2">新しいセッションを作成</CardTitle>
                  <CardDescription className="text-base">
                    ゲームを開始してQRコードで友達を招待
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>
        </Link>

        <Link href="/session/join/new">
          <Card className="hover:shadow-lg transition-all hover:border-foreground/20 cursor-pointer active:scale-98">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                  <Users className="h-7 w-7 text-foreground" />
                </div>
                <div>
                  <CardTitle className="text-xl mb-2">セッションに参加</CardTitle>
                  <CardDescription className="text-base">
                    QRコードをスキャンして参加
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>
        </Link>
      </div>

      {/* アクティブセッション */}
      <div>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-2xl font-bold">アクティブセッション</h3>
        </div>

        {activeSessions.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-16 text-center text-muted-foreground">
              <p className="text-lg mb-2">アクティブなセッションはありません</p>
              <p className="text-base">
                新しいセッションを作成するか、既存のセッションに参加してください
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {activeSessions.map((session) => (
              <Link key={session.id} href={`/session/${session.id}`}>
                <Card className="hover:shadow-lg transition-all hover:border-foreground/20 cursor-pointer active:scale-98">
                  <CardHeader className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <CardTitle className="text-xl">
                        {session.name || 'セッション'}
                      </CardTitle>
                      <Badge
                        variant={
                          session.status === 'active' ? 'default' : 'secondary'
                        }
                        className="text-sm px-3 py-1"
                      >
                        {session.status === 'waiting' ? '待機中' : '進行中'}
                      </Badge>
                    </div>
                    <CardDescription className="text-base">
                      {session.max_participants} 人まで参加可能
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center gap-2 text-base text-muted-foreground">
                      <Users className="h-5 w-5" />
                      <span>
                        初期チップ: {session.initial_chips.toLocaleString()}
                      </span>
                    </div>
                    {session.rate && (
                      <div className="text-base text-muted-foreground">
                        レート: {session.rate}円/チップ
                      </div>
                    )}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* 最近の履歴 */}
      <div>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-2xl font-bold">最近の履歴</h3>
          {recentHistory.length > 0 && (
            <Link href="/history">
              <Button variant="ghost" size="sm" className="text-base">
                すべて見る
              </Button>
            </Link>
          )}
        </div>

        {recentHistory.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-16 text-center text-muted-foreground">
              <p className="text-lg">履歴はまだありません</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {recentHistory.map((session) => (
              <Link key={session.id} href={`/session/${session.id}`}>
                <Card className="hover:shadow-md transition-all hover:border-foreground/20 cursor-pointer active:scale-98">
                  <CardContent className="py-5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div>
                          <h4 className="font-semibold text-lg mb-1">
                            {session.name || 'セッション'}
                          </h4>
                          <p className="text-base text-muted-foreground">
                            {new Date(session.created_at).toLocaleDateString(
                              'ja-JP',
                              {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                              }
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
