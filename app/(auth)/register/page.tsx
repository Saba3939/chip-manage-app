'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

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
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { signUp } from '@/lib/auth/actions';
import { getAuthErrorMessage } from '@/lib/auth/errors';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

// 登録フォームのスキーマ
const registerSchema = z
  .object({
    displayName: z
      .string()
      .min(1, '表示名を入力してください')
      .max(50, '表示名は50文字以内にしてください'),
    email: z.string().email('有効なメールアドレスを入力してください'),
    password: z.string().min(8, 'パスワードは8文字以上である必要があります'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'パスワードが一致しません',
    path: ['confirmPassword'],
  });

type RegisterFormValues = z.infer<typeof registerSchema>;

/**
 * 登録画面
 */
export default function RegisterPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      displayName: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  /**
   * 登録処理
   */
  const onSubmit = async (data: RegisterFormValues) => {
    setIsLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const result = await signUp(data.email, data.password, data.displayName);

      if (result.error) {
        setErrorMessage(getAuthErrorMessage({ message: result.error } as any));
      } else {
        setSuccessMessage(
          '登録が完了しました！確認メールをご確認ください。メールの確認後にログインできます。'
        );
        // 3秒後にログイン画面へリダイレクト
        setTimeout(() => {
          router.push('/login');
        }, 3000);
      }
    } catch (error) {
      console.error('Register error:', error);
      setErrorMessage('登録中にエラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="shadow-lg">
      <CardHeader className="space-y-3 px-6 pt-8 pb-6">
        <CardTitle className="text-3xl">新規登録</CardTitle>
        <CardDescription className="text-base">
          アカウントを作成してゲームを始めましょう
        </CardDescription>
      </CardHeader>
      <CardContent className="px-6 pb-8">
        {errorMessage && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        )}

        {successMessage && (
          <Alert className="mb-4 border-foreground/20 bg-muted">
            <CheckCircle2 className="h-4 w-4 text-foreground" />
            <AlertDescription className="text-foreground">
              {successMessage}
            </AlertDescription>
          </Alert>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <FormField
              control={form.control}
              name="displayName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base">表示名</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="けんと"
                      disabled={isLoading}
                      className="h-12 text-base"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base">メールアドレス</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="example@example.com"
                      disabled={isLoading}
                      className="h-12 text-base"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base">パスワード</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="••••••••"
                      disabled={isLoading}
                      className="h-12 text-base"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base">パスワード（確認）</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="••••••••"
                      disabled={isLoading}
                      className="h-12 text-base"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full h-12 text-base mt-6" disabled={isLoading}>
              {isLoading ? '登録中...' : '登録'}
            </Button>
          </form>
        </Form>
      </CardContent>
      <CardFooter className="flex flex-col space-y-2 px-6 pb-8">
        <div className="text-base text-center text-muted-foreground">
          すでにアカウントをお持ちですか？{' '}
          <Link
            href="/login"
            className="text-foreground hover:underline font-medium underline-offset-4"
          >
            ログイン
          </Link>
        </div>
      </CardFooter>
    </Card>
  );
}
