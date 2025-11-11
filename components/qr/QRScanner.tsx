"use client";

import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Camera } from "lucide-react";

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
	const isStartedRef = useRef(false); // スキャナーが実際に起動したかを追跡
	const onScanRef = useRef(onScan);
	const onErrorRef = useRef(onError);
	const elementId = "qr-scanner-region";

	// 最新のコールバックをrefに保存
	useEffect(() => {
		onScanRef.current = onScan;
		onErrorRef.current = onError;
	});

	useEffect(() => {
		let isMounted = true;

		const initScanner = async () => {
			try {
				// Html5Qrcodeインスタンスを作成
				const scanner = new Html5Qrcode(elementId);
				scannerRef.current = scanner;

				if (!isMounted) {
					scannerRef.current = null;
					return;
				}

				// カメラを起動してスキャン開始
				await scanner.start(
					{ facingMode: "environment" },
					{
						fps: 10,
						qrbox: 250,
						aspectRatio: 1.0,
					},
					(decodedText) => {
						onScanRef.current(decodedText);
					},
					() => {
						// スキャンエラーは無視
					}
				);

				// ここまで来たらスキャナーが起動成功
				isStartedRef.current = true;

				if (isMounted) {
					setIsScanning(true);
					setError(null);
				} else {
					// アンマウント済みなら停止
					if (isStartedRef.current) {
						try {
							await scanner.stop();
							isStartedRef.current = false;
						} catch {
							// エラー無視
						}
					}
					scannerRef.current = null;
				}
			} catch (err) {
				// マウント中のみエラー処理
				if (isMounted && !(err instanceof Error && err.name === "AbortError")) {
					const errorMsg =
						err instanceof Error
							? err.message
							: "カメラへのアクセスが拒否されました";

					setError(errorMsg);
					setIsScanning(false);

					if (onErrorRef.current) {
						onErrorRef.current(errorMsg);
					}
				}
				scannerRef.current = null;
			}
		};

		initScanner();

		// クリーンアップ
		return () => {
			isMounted = false;
			const currentScanner = scannerRef.current;

			// スキャナーが実際に起動している場合のみstopを呼ぶ
			if (currentScanner && isStartedRef.current) {
				currentScanner
					.stop()
					.then(() => {
						isStartedRef.current = false;
						scannerRef.current = null;
					})
					.catch(() => {
						// エラー無視
						isStartedRef.current = false;
						scannerRef.current = null;
					});
			} else {
				scannerRef.current = null;
			}
		};
	}, []);

	return (
		<div className='space-y-4'>
			{/* スキャナー領域 */}
			<div className='relative'>
				<div
					id={elementId}
					className='rounded-lg overflow-hidden bg-neutral-900 min-h-[300px]'
				/>

				{!isScanning && !error && (
					<div className='absolute inset-0 flex items-center justify-center bg-neutral-900/80'>
						<div className='text-center text-white'>
							<Camera className='h-12 w-12 mx-auto mb-2 animate-pulse' />
							<p>カメラを起動中...</p>
						</div>
					</div>
				)}
			</div>

			{/* エラー表示 */}
			{error && (
				<Alert variant='destructive'>
					<AlertCircle className='h-4 w-4' />
					<AlertDescription>
						{error.includes("Permission") || error.includes("許可")
							? "カメラへのアクセスが拒否されました。ブラウザの設定でカメラの許可を有効にしてください。"
							: error}
					</AlertDescription>
				</Alert>
			)}

			{/* スキャン中の説明 */}
			{isScanning && (
				<div className='text-center text-sm text-neutral-600'>
					<p>QRコードをカメラに向けてください</p>
				</div>
			)}
		</div>
	);
}
