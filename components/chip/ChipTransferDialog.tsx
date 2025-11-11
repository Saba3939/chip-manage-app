'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { ArrowRight, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useChipTransfer } from '@/hooks/useChipTransfer';

interface ChipTransferDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sessionId: string;
  recipient: {
    id: string;
    name: string;
    balance: number;
  };
  sender: {
    id: string;
    name: string;
    balance: number;
  };
  onTransferSuccess?: () => void;
}

/**
 * チップ送信ダイアログコンポーネント
 */
export function ChipTransferDialog({
  open,
  onOpenChange,
  sessionId,
  recipient,
  sender,
  onTransferSuccess,
}: ChipTransferDialogProps) {
  const { transfer, loading, error, clearError } = useChipTransfer();

  // 送信額のバリデーション
  const transferSchema = z.object({
    amount: z
      .number()
      .int('整数を入力してください')
      .positive('正の数値を入力してください')
      .max(sender.balance, `送信可能なチップは${sender.balance}までです`),
  });

  type TransferFormValues = z.infer<typeof transferSchema>;

  const form = useForm<TransferFormValues>({
    resolver: zodResolver(transferSchema),
    defaultValues: {
      amount: 0,
    },
  });

  const watchAmount = form.watch('amount');
  const remainingBalance = sender.balance - (watchAmount || 0);

  /**
   * クイック選択ボタンの金額
   */
  const quickAmounts = [100, 500, 1000];
  const allIn = sender.balance;

  /**
   * チップ送信処理
   */
  const onSubmit = async (data: TransferFormValues) => {
    // エラーをクリア
    clearError();

    // チップ送信を実行
    const result = await transfer({
      sessionId,
      toUserId: recipient.id,
      amount: data.amount,
      onSuccess: () => {
        toast.success(`${recipient.name}に${data.amount}チップを送信しました`);
        onOpenChange(false);
        form.reset();
        onTransferSuccess?.();
      },
      onError: (errorMsg) => {
        toast.error(errorMsg);
      },
    });
  };

  /**
   * ダイアログが閉じられた時にエラーをクリア
   */
  useEffect(() => {
    if (!open) {
      clearError();
      form.reset();
    }
  }, [open, clearError, form]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>チップを送る</DialogTitle>
          <DialogDescription>
            {recipient.name}にチップを送信します
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* 送信者と受取人の表示 */}
          <div className="flex items-center justify-between py-4">
            {/* 送信者 */}
            <div className="flex flex-col items-center gap-2">
              <Avatar className="h-12 w-12">
                <AvatarFallback>{sender.name[0]}</AvatarFallback>
              </Avatar>
              <div className="text-center">
                <p className="text-sm font-semibold">{sender.name}</p>
                <p className="text-xs text-neutral-600">
                  {sender.balance.toLocaleString()}
                </p>
              </div>
            </div>

            <ArrowRight className="h-6 w-6 text-neutral-400" />

            {/* 受取人 */}
            <div className="flex flex-col items-center gap-2">
              <Avatar className="h-12 w-12">
                <AvatarFallback>{recipient.name[0]}</AvatarFallback>
              </Avatar>
              <div className="text-center">
                <p className="text-sm font-semibold">{recipient.name}</p>
                <p className="text-xs text-neutral-600">
                  {recipient.balance.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <Separator />

          {/* エラー表示 */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* フォーム */}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>送信額</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="100"
                        value={field.value || ''}
                        onChange={(e) => {
                          const value = e.target.valueAsNumber;
                          field.onChange(isNaN(value) ? 0 : value);
                        }}
                        disabled={loading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* クイック選択ボタン */}
              <div className="grid grid-cols-4 gap-2">
                {quickAmounts.map((amount) => (
                  <Button
                    key={amount}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => form.setValue('amount', amount)}
                    disabled={amount > sender.balance || loading}
                  >
                    {amount}
                  </Button>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => form.setValue('amount', allIn)}
                  disabled={loading}
                >
                  All-in
                </Button>
              </div>

              {/* 送信後の残高プレビュー */}
              {watchAmount > 0 && (
                <div className="p-4 bg-neutral-100 rounded-lg space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-neutral-600">送信額:</span>
                    <span className="font-semibold">
                      {watchAmount.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-neutral-600">残高:</span>
                    <span
                      className={`font-semibold ${
                        remainingBalance < 0 ? 'text-red-600' : ''
                      }`}
                    >
                      {remainingBalance.toLocaleString()}
                    </span>
                  </div>
                </div>
              )}

              {/* アクションボタン */}
              <div className="flex gap-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => onOpenChange(false)}
                  disabled={loading}
                >
                  キャンセル
                </Button>
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={loading || !watchAmount || watchAmount <= 0}
                >
                  {loading ? '送信中...' : '送信'}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
