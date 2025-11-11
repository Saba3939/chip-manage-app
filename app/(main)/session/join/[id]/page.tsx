'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { ArrowLeft } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { QRScanner } from '@/components/qr/QRScanner';
import { useSessionActions } from '@/hooks/useSessionActions';

// ID入力フォームのスキーマ
const joinByIdSchema = z.object({
  sessionId: z.string().min(1, 'セッションIDを入力してください'),
});

type JoinByIdFormValues = z.infer<typeof joinByIdSchema>;

/**
 * セッション参加画面
 * QRスキャンまたはID手動入力で参加
 */
export default function SessionJoinPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('qr');
  const [hasJoined, setHasJoined] = useState(false);
  const { joinSession: joinSessionAction, loading } = useSessionActions();

  const form = useForm<JoinByIdFormValues>({
    resolver: zodResolver(joinByIdSchema),
    defaultValues: {
      sessionId: '',
    },
  });

  /**
   * QRコード読み取り成功時
   */
  const handleQRScan = (decodedText: string) => {
    console.log('QR scanned:', decodedText);

    try {
      // URLからセッションIDを抽出
      // 例: http://localhost:3000/session/join/session-123
      const url = new URL(decodedText);
      const pathParts = url.pathname.split('/');
      const sessionId = pathParts[pathParts.length - 1];

      if (sessionId) {
        handleJoinSession(sessionId);
      } else {
        setError('無効なQRコードです');
      }
    } catch (err) {
      // URL形式でない場合は、そのままセッションIDとして扱う
      handleJoinSession(decodedText);
    }
  };

  /**
   * セッションに参加する処理
   */
  const handleJoinSession = async (sessionId: string) => {
    setError(null);

    const result = await joinSessionAction(sessionId);

    if (!result.error) {
      setHasJoined(true);
      router.push(`/session/${sessionId}`);
    } else {
      setError(result.error);
    }
  };

  /**
   * ID入力フォーム送信
   */
  const onSubmit = (data: JoinByIdFormValues) => {
    handleJoinSession(data.sessionId);
  };

  // URLパラメータから直接参加を試みる
  useEffect(() => {
    const urlSessionId = params?.id as string;
    if (urlSessionId && urlSessionId !== 'new' && !hasJoined && !loading) {
      handleJoinSession(urlSessionId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params?.id]);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">セッションに参加</h1>
          <p className="text-neutral-600 mt-1">
            QRコードをスキャンするか、セッションIDを入力してください
          </p>
        </div>
      </div>

      {/* エラー表示 */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* タブ */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="qr">QRコードスキャン</TabsTrigger>
          <TabsTrigger value="id">IDを入力</TabsTrigger>
        </TabsList>

        {/* QRスキャンタブ */}
        <TabsContent value="qr" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>QRコードをスキャン</CardTitle>
              <CardDescription>
                ホストが表示しているQRコードをカメラに向けてください
              </CardDescription>
            </CardHeader>
            <CardContent>
              <QRScanner
                onScan={handleQRScan}
                onError={(err) => setError(err)}
              />

              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-900">
                  💡 ヒント：カメラが起動しない場合は、ブラウザの設定でカメラの許可を有効にしてください。
                  または「IDを入力」タブから手動で参加できます。
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ID入力タブ */}
        <TabsContent value="id" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>セッションIDを入力</CardTitle>
              <CardDescription>
                ホストから共有されたセッションIDを入力してください
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-4"
                >
                  <FormField
                    control={form.control}
                    name="sessionId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>セッションID</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="session-123456"
                            {...field}
                            disabled={loading}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={loading}
                  >
                    {loading ? '参加中...' : '参加する'}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
