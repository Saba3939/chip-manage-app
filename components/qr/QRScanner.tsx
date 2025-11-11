'use client';

import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Camera } from 'lucide-react';

interface QRScannerProps {
  onScan: (decodedText: string) => void;
  onError?: (error: string) => void;
}

/**
 * QRコードスキャナーコンポーネント
 * html5-qrcodeを使用してカメラからQRコードを読み取る
 */
export function QRScanner({ onScan, onError }: QRScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const elementId = 'qr-scanner-region';

  useEffect(() => {
    const initScanner = async () => {
      try {
        // Html5Qrcodeインスタンスを作成
        const scanner = new Html5Qrcode(elementId);
        scannerRef.current = scanner;

        // カメラを起動してスキャン開始
        await scanner.start(
          { facingMode: 'environment' }, // 背面カメラを使用
          {
            fps: 10, // 1秒あたり10フレーム
            qrbox: { width: 250, height: 250 }, // スキャンエリアのサイズ
          },
          (decodedText) => {
            // QRコード検出時のコールバック
            console.log('QR Code detected:', decodedText);
            onScan(decodedText);
          },
          (errorMessage) => {
            // エラー時のコールバック（スキャン失敗は頻繁に発生するため、ログのみ）
            // console.log('Scan error:', errorMessage);
          }
        );

        setIsScanning(true);
        setError(null);
      } catch (err) {
        console.error('Scanner initialization error:', err);
        const errorMsg =
          err instanceof Error
            ? err.message
            : 'カメラへのアクセスが拒否されました';

        setError(errorMsg);
        setIsScanning(false);

        if (onError) {
          onError(errorMsg);
        }
      }
    };

    initScanner();

    // クリーンアップ
    return () => {
      if (scannerRef.current && isScanning) {
        scannerRef.current
          .stop()
          .then(() => {
            console.log('Scanner stopped');
          })
          .catch((err) => {
            console.error('Error stopping scanner:', err);
          });
      }
    };
  }, []);

  return (
    <div className="space-y-4">
      {/* スキャナー領域 */}
      <div className="relative">
        <div
          id={elementId}
          className="rounded-lg overflow-hidden bg-neutral-900 min-h-[300px]"
        />

        {!isScanning && !error && (
          <div className="absolute inset-0 flex items-center justify-center bg-neutral-900/80">
            <div className="text-center text-white">
              <Camera className="h-12 w-12 mx-auto mb-2 animate-pulse" />
              <p>カメラを起動中...</p>
            </div>
          </div>
        )}
      </div>

      {/* エラー表示 */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error.includes('Permission') || error.includes('許可')
              ? 'カメラへのアクセスが拒否されました。ブラウザの設定でカメラの許可を有効にしてください。'
              : error}
          </AlertDescription>
        </Alert>
      )}

      {/* スキャン中の説明 */}
      {isScanning && (
        <div className="text-center text-sm text-neutral-600">
          <p>QRコードをカメラに向けてください</p>
        </div>
      )}
    </div>
  );
}
