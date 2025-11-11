'use client';

import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Copy, Check } from 'lucide-react';

interface QRCodeDisplayProps {
  sessionId: string;
  size?: number;
}

/**
 * QRコード表示コンポーネント
 * セッション参加用のQRコードを生成・表示
 */
export function QRCodeDisplay({ sessionId, size = 200 }: QRCodeDisplayProps) {
  const [copied, setCopied] = useState(false);

  // 参加用URL（本番環境では実際のドメインを使用）
  const joinUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/session/join/${sessionId}`
      : `https://example.com/session/join/${sessionId}`;

  /**
   * URLをクリップボードにコピー
   */
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(joinUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">QRコードを表示</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>セッションに招待</DialogTitle>
          <DialogDescription>
            このQRコードをスキャンしてもらうか、URLを共有してください
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* QRコード */}
          <div className="flex justify-center p-6 bg-white rounded-lg border-2 border-neutral-200">
            <QRCodeSVG value={joinUrl} size={size} level="H" />
          </div>

          {/* セッションID */}
          <div>
            <p className="text-sm font-semibold text-neutral-700 mb-2">
              セッションID:
            </p>
            <div className="flex items-center gap-2">
              <code className="flex-1 px-3 py-2 bg-neutral-100 rounded font-mono text-sm">
                {sessionId}
              </code>
              <Button
                variant="outline"
                size="icon"
                onClick={copyToClipboard}
                disabled={copied}
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* 参加URL */}
          <div>
            <p className="text-sm font-semibold text-neutral-700 mb-2">
              参加URL:
            </p>
            <div className="flex items-center gap-2">
              <div className="flex-1 px-3 py-2 bg-neutral-100 rounded text-sm break-all">
                {joinUrl}
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={copyToClipboard}
                disabled={copied}
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {copied && (
            <p className="text-sm text-center text-green-600">
              コピーしました！
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
