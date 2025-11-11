import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRightLeft, BarChart3, QrCode, Wallet } from 'lucide-react';

/**
 * トップページ（ランディングページ）
 * モバイルファーストのシックなデザイン
 */
export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-8">
      <Card className="w-full max-w-md shadow-lg border-border">
        <CardHeader className="text-center space-y-4 px-6 pt-8 pb-6">
          <CardTitle className="text-4xl font-bold tracking-tight leading-tight">
            チップ管理アプリ
          </CardTitle>
          <CardDescription className="text-lg leading-relaxed">
            ポーカーやカードゲームのチップを
            <br />
            スマートにデジタル管理
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8 px-6 pb-8">
          {/* メイン機能の説明 */}
          <div className="space-y-3">
            <FeatureItem
              icon={<ArrowRightLeft className="w-6 h-6" />}
              text="リアルタイムでチップ送受信"
            />
            <FeatureItem
              icon={<BarChart3 className="w-6 h-6" />}
              text="残高を自動集計"
            />
            <FeatureItem
              icon={<QrCode className="w-6 h-6" />}
              text="QRコードで簡単参加"
            />
            <FeatureItem
              icon={<Wallet className="w-6 h-6" />}
              text="ゲーム後の清算も楽々"
            />
          </div>

          {/* アクションボタン */}
          <div className="space-y-4">
            <Link href="/login" className="block">
              <Button className="w-full h-14 text-lg" size="lg">
                ログイン
              </Button>
            </Link>
            <Link href="/register" className="block">
              <Button variant="outline" className="w-full h-14 text-lg" size="lg">
                新規登録
              </Button>
            </Link>
          </div>

          {/* 補足情報 */}
          <p className="text-sm text-center text-muted-foreground leading-relaxed">
            ゲームを始める前にアカウントを作成してください
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * 機能アイテムコンポーネント
 */
function FeatureItem({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors min-h-[60px]">
      <div className="flex-shrink-0 text-foreground">{icon}</div>
      <p className="text-base font-medium text-foreground leading-relaxed">{text}</p>
    </div>
  );
}
