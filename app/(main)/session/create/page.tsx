'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { ArrowLeft } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useSessionActions } from '@/hooks/useSessionActions';

// セッション作成フォームのスキーマ
const sessionCreateSchema = z.object({
  name: z.string().optional(),
  initial_chips: z.number().int().positive('正の整数を入力してください'),
  max_participants: z
    .number()
    .int()
    .min(2, '2人以上である必要があります')
    .max(20, '20人以下である必要があります'),
  rate: z.union([z.number().positive('正の数値を入力してください'), z.literal('')]).optional(),
});

type SessionCreateFormValues = z.infer<typeof sessionCreateSchema>;

/**
 * セッション作成画面
 */
export default function SessionCreatePage() {
  const router = useRouter();
  const [selectedChips, setSelectedChips] = useState('1000');
  const { createSession, loading } = useSessionActions();

  const form = useForm<SessionCreateFormValues>({
    resolver: zodResolver(sessionCreateSchema),
    defaultValues: {
      name: '',
      initial_chips: 1000,
      max_participants: 10,
      rate: '',
    },
  });

  /**
   * セッション作成処理
   */
  const onSubmit = async (data: SessionCreateFormValues) => {
    const result = await createSession({
      name: data.name || undefined,
      initialChips: data.initial_chips,
      maxParticipants: data.max_participants,
      rate: data.rate ? Number(data.rate) : undefined,
    });

    if (!result.error && result.data) {
      router.push(`/session/${result.data.id}`);
    }
  };

  const chipOptions = [
    { value: '500', label: '500' },
    { value: '1000', label: '1,000' },
    { value: '2000', label: '2,000' },
    { value: '5000', label: '5,000' },
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">新しいセッションを作成</h1>
          <p className="text-neutral-600 mt-1">
            ゲーム設定を入力してセッションを開始しましょう
          </p>
        </div>
      </div>

      {/* フォーム */}
      <Card>
        <CardHeader>
          <CardTitle>セッション設定</CardTitle>
          <CardDescription>
            初期チップ数や参加人数を設定してください
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* セッション名 */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>セッション名（任意）</FormLabel>
                    <FormControl>
                      <Input placeholder="今日のポーカー" {...field} />
                    </FormControl>
                    <FormDescription>
                      空欄の場合は「セッション」と表示されます
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* 初期チップ数 */}
              <FormField
                control={form.control}
                name="initial_chips"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>初期チップ数</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={(value) => {
                          setSelectedChips(value);
                          if (value !== 'custom') {
                            field.onChange(parseInt(value));
                          }
                        }}
                        value={selectedChips}
                        className="grid grid-cols-2 gap-4"
                      >
                        {chipOptions.map((option) => (
                          <div key={option.value}>
                            <RadioGroupItem
                              value={option.value}
                              id={`chips-${option.value}`}
                              className="peer sr-only"
                            />
                            <label
                              htmlFor={`chips-${option.value}`}
                              className="flex items-center justify-center rounded-md border-2 border-neutral-200 bg-white p-4 hover:bg-neutral-50 peer-data-[state=checked]:border-blue-600 peer-data-[state=checked]:bg-blue-50 cursor-pointer transition-all"
                            >
                              <span className="text-lg font-semibold">
                                {option.label}
                              </span>
                            </label>
                          </div>
                        ))}
                      </RadioGroup>
                    </FormControl>

                    {/* カスタム入力 */}
                    <div className="pt-2">
                      <FormLabel className="text-sm text-neutral-600">
                        または手動で入力
                      </FormLabel>
                      <Input
                        type="number"
                        placeholder="1000"
                        value={field.value || ''}
                        onChange={(e) => {
                          const value = e.target.valueAsNumber;
                          field.onChange(isNaN(value) ? 0 : value);
                          setSelectedChips('custom');
                        }}
                        className="mt-2"
                      />
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* 最大参加人数 */}
              <FormField
                control={form.control}
                name="max_participants"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>最大参加人数</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(parseInt(value))}
                      defaultValue={field.value?.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="参加人数を選択" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Array.from({ length: 19 }, (_, i) => i + 2).map((num) => (
                          <SelectItem key={num} value={num.toString()}>
                            {num}人
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      セッションに参加できる最大人数
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* レート設定 */}
              <FormField
                control={form.control}
                name="rate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ポイントレート（任意）</FormLabel>
                    <FormControl>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          placeholder="10"
                          value={field.value === '' || field.value === undefined ? '' : field.value}
                          onChange={(e) => {
                            const value = e.target.value;
                            if (value === '') {
                              field.onChange('');
                            } else {
                              const numValue = e.target.valueAsNumber;
                              field.onChange(isNaN(numValue) ? '' : numValue);
                            }
                          }}
                        />
                        <span className="text-neutral-600">pt / チップ</span>
                      </div>
                    </FormControl>
                    <FormDescription>
                      1チップあたりのポイント換算レート（ゲーム参加費とポイント獲得に使用）
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* アクションボタン */}
              <div className="flex gap-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => router.back()}
                  disabled={loading}
                >
                  キャンセル
                </Button>
                <Button type="submit" className="flex-1" disabled={loading}>
                  {loading ? '作成中...' : 'セッションを作成'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
