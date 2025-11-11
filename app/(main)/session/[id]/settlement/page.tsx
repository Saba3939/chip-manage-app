'use client';

import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, TrendingUp, TrendingDown, CheckCircle2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useSettlement } from '@/hooks/useSettlement';
import { confirmSettlement } from '@/lib/settlement/actions';
import { toast } from 'sonner';
import { useState } from 'react';

/**
 * 清算画面
 * セッション終了時の増減と清算額を表示
 */
export default function SettlementPage() {
  const router = useRouter();
  const params = useParams();
  const sessionId = params.id as string;
  const [confirming, setConfirming] = useState(false);

  // 清算データを取得
  const { settlement, loading, error } = useSettlement(sessionId);

  /**
   * 清算を確定する
   */
  const handleConfirmSettlement = async () => {
    setConfirming(true);
    const result = await confirmSettlement(sessionId);

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success('清算を確定しました');
      router.push('/dashboard');
    }

    setConfirming(false);
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <p className="text-neutral-600">清算データを読み込み中...</p>
      </div>
    );
  }

  if (error || !settlement) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">{error || 'データの取得に失敗しました'}</p>
        <Button className="mt-4" onClick={() => router.push('/dashboard')}>
          ダッシュボードに戻る
        </Button>
      </div>
    );
  }

  // 清算データをソート（増減額の降順）
  const sortedParticipants = [...settlement.participants].sort(
    (a, b) => b.difference - a.difference
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold">清算</h1>
              <Badge variant="outline">完了</Badge>
            </div>
            <p className="text-neutral-600 mt-1">
              {settlement.sessionName || 'セッション'} -{' '}
              {new Date(settlement.createdAt).toLocaleDateString('ja-JP')}
            </p>
          </div>
        </div>
      </div>

      {/* セッション情報 */}
      <Card>
        <CardHeader>
          <CardTitle>セッション情報</CardTitle>
          <CardDescription>
            チップの増減はポイントとしてあなたのアカウントに記録されます
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-neutral-600">参加人数</p>
              <p className="text-2xl font-bold">{settlement.participants.length}人</p>
            </div>
            <div>
              <p className="text-sm text-neutral-600">初期チップ</p>
              <p className="text-2xl font-bold">
                {settlement.totalInitial.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-neutral-600">ポイントレート</p>
              <p className="text-2xl font-bold">
                {settlement.rate ? `${settlement.rate}pt/chip` : '-'}
              </p>
            </div>
            <div>
              <p className="text-sm text-neutral-600">開催日時</p>
              <p className="text-lg font-semibold">
                {new Date(settlement.createdAt).toLocaleString('ja-JP', {
                  month: 'short',
                  day: 'numeric',
                })}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* チップ検証 */}
      {!settlement.isValid && (
        <Alert variant="destructive">
          <AlertDescription>
            警告: チップ総数が一致しません。
            初期: {settlement.totalInitial.toLocaleString()} / 最終:{' '}
            {settlement.totalFinal.toLocaleString()}
          </AlertDescription>
        </Alert>
      )}

      {settlement.isValid && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-900">
            チップ総数が正しく保存されています
          </AlertDescription>
        </Alert>
      )}

      {/* 清算テーブル */}
      <Card>
        <CardHeader>
          <CardTitle>清算結果</CardTitle>
          <CardDescription>各プレイヤーの増減と清算額</CardDescription>
        </CardHeader>
        <CardContent>
          {/* デスクトップ表示 */}
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>参加者</TableHead>
                  <TableHead className="text-right">初期チップ</TableHead>
                  <TableHead className="text-right">最終チップ</TableHead>
                  <TableHead className="text-right">チップ増減</TableHead>
                  <TableHead className="text-right">現在のポイント</TableHead>
                  <TableHead className="text-right">清算後のポイント</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedParticipants.map((participant) => (
                  <TableRow key={participant.userId}>
                    <TableCell className="font-medium">
                      {participant.displayName}
                    </TableCell>
                    <TableCell className="text-right">
                      {participant.initialChips.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      {participant.finalChips.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {participant.difference > 0 ? (
                          <TrendingUp className="h-4 w-4 text-green-600" />
                        ) : participant.difference < 0 ? (
                          <TrendingDown className="h-4 w-4 text-red-600" />
                        ) : null}
                        <span
                          className={`font-semibold ${
                            participant.difference > 0
                              ? 'text-green-600'
                              : participant.difference < 0
                              ? 'text-red-600'
                              : 'text-neutral-600'
                          }`}
                        >
                          {participant.difference >= 0 ? '+' : ''}
                          {participant.difference.toLocaleString()}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="font-semibold text-blue-600">
                        {participant.currentPoints.toLocaleString()}
                        <span className="text-sm text-blue-500 ml-1">pts</span>
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="font-bold text-green-600">
                        {participant.pointsAfterSettlement.toLocaleString()}
                        <span className="text-sm text-green-500 ml-1">pts</span>
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
                {/* 合計行 */}
                <TableRow className="bg-neutral-50 font-bold">
                  <TableCell>合計</TableCell>
                  <TableCell className="text-right">
                    {settlement.totalInitial.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">
                    {settlement.totalFinal.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">
                    {settlement.totalDifference.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right text-neutral-400">
                    -
                  </TableCell>
                  <TableCell className="text-right text-neutral-400">
                    -
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>

          {/* モバイル表示（カード形式） */}
          <div className="md:hidden space-y-4">
            {sortedParticipants.map((participant) => (
              <Card key={participant.userId} className="border-2">
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-lg">
                        {participant.displayName}
                      </h3>
                      <div className="flex items-center gap-2">
                        {participant.difference > 0 ? (
                          <TrendingUp className="h-5 w-5 text-green-600" />
                        ) : participant.difference < 0 ? (
                          <TrendingDown className="h-5 w-5 text-red-600" />
                        ) : null}
                        <span
                          className={`text-2xl font-bold ${
                            participant.difference > 0
                              ? 'text-green-600'
                              : participant.difference < 0
                              ? 'text-red-600'
                              : 'text-neutral-600'
                          }`}
                        >
                          {participant.difference >= 0 ? '+' : ''}
                          {participant.difference.toLocaleString()}
                        </span>
                      </div>
                    </div>

                    <Separator />

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-neutral-600">初期</p>
                        <p className="font-semibold">
                          {participant.initialChips.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-neutral-600">最終</p>
                        <p className="font-semibold">
                          {participant.finalChips.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-neutral-600">現在のポイント</p>
                        <p className="font-bold text-blue-600">
                          {participant.currentPoints.toLocaleString()}
                          <span className="text-sm text-blue-500 ml-1">pts</span>
                        </p>
                      </div>
                      <div>
                        <p className="text-neutral-600">清算後のポイント</p>
                        <p className="font-bold text-green-600">
                          {participant.pointsAfterSettlement.toLocaleString()}
                          <span className="text-sm text-green-500 ml-1">pts</span>
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* アクションボタン */}
      <div className="flex gap-4">
        <Button
          variant="outline"
          className="flex-1"
          onClick={() => router.push('/history')}
        >
          履歴を見る
        </Button>
        <Button
          className="flex-1"
          onClick={handleConfirmSettlement}
          disabled={confirming}
        >
          {confirming ? '確定中...' : 'ダッシュボードに戻る'}
        </Button>
      </div>
    </div>
  );
}
