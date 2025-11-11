"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Play, StopCircle, Wifi, WifiOff, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { QRCodeDisplay } from "@/components/qr/QRCodeDisplay";
import { ChipTransferDialog } from "@/components/chip/ChipTransferDialog";
import { TransactionHistory } from "@/components/chip/TransactionHistory";
import { useSessionActions } from "@/hooks/useSessionActions";
import { useRealtimeParticipants } from "@/hooks/useRealtimeParticipants";
import { useRealtimeBalances } from "@/hooks/useRealtimeBalances";
import { useRealtimeTest } from "@/hooks/useRealtimeTest";
import { useRealtimeSession } from "@/hooks/useRealtimeSession";
import { Database } from "@/lib/supabase/database.types";
import { Participant } from "@/lib/session/participants";
import { createClient } from "@/lib/supabase/client";

type SessionRow = Database["public"]["Tables"]["sessions"]["Row"];
type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

interface SessionDetailClientProps {
	session: SessionRow;
	participants: Participant[];
	currentUserId: string;
	isHost: boolean;
}

/**
 * セッション詳細画面のクライアントコンポーネント
 */
export function SessionDetailClient({
	session: initialSession,
	participants: _initialParticipants,
	currentUserId,
	isHost,
}: SessionDetailClientProps) {
	const router = useRouter();
	const { startSession, endSession, loading } = useSessionActions();

	// セッション情報をリアルタイムで購読
	const { session: realtimeSession } = useRealtimeSession(initialSession.id, initialSession);
	const session = realtimeSession || initialSession;

	// テスト用フック（デバッグ情報を表示）
	const { status: testStatus, errorDetails: testError } = useRealtimeTest(session.id);

	// リアルタイム更新フック
	const {
		participants: realtimeParticipants,
		loading: participantsLoading,
		error: participantsError,
	} = useRealtimeParticipants(session.id);

	// waiting状態では残高テーブルはまだ存在しないため、active状態のみ購読
	const {
		balances: realtimeBalances,
		loading: balancesLoading,
		error: balancesError,
		recentChange,
	} = useRealtimeBalances(session.status === "active" ? session.id : null);

	// プロファイル情報を取得
	const [profiles, setProfiles] = useState<Record<string, ProfileRow>>({});

	// チップ送信ダイアログの状態
	const [transferDialogOpen, setTransferDialogOpen] = useState(false);
	const [selectedRecipient, setSelectedRecipient] =
		useState<ParticipantWithProfile | null>(null);

	useEffect(() => {
		const fetchProfiles = async () => {
			if (realtimeParticipants.length === 0) return;

			const supabase = createClient();
			const userIds = realtimeParticipants.map((p) => p.user_id);

			const { data, error } = await supabase
				.from("profiles")
				.select("*")
				.in("id", userIds);

			if (error) {
				console.error("Failed to fetch profiles:", error);
				return;
			}

			if (data) {
				const profilesMap = data.reduce((acc, profile) => {
					acc[profile.id] = profile;
					return acc;
				}, {} as Record<string, ProfileRow>);
				setProfiles(profilesMap);
			}
		};

		fetchProfiles();
	}, [realtimeParticipants]);

	// 参加者情報を統合（プロファイル情報を含む）
	type ParticipantWithProfile = (typeof realtimeParticipants)[0] & {
		profiles: ProfileRow | null;
	};
	const participants: ParticipantWithProfile[] = useMemo(() => {
		return realtimeParticipants.map((p) => ({
			...p,
			profiles: profiles[p.user_id] || null,
		}));
	}, [realtimeParticipants, profiles]);

	const participantCount = participants.length;
	const canStart = participantCount >= 2;

	// 接続状態の判定
	// waiting状態ではbalancesの購読はスキップされるため、participantsのみで判定
	// active状態では両方の接続を確認
	const isConnected =
		session.status === "waiting"
			? !participantsLoading && !participantsError
			: !participantsLoading &&
			  !balancesLoading &&
			  !participantsError &&
			  !balancesError;

	// エラーメッセージの表示判定（waiting状態ではbalancesのエラーは無視）
	const hasRealtimeError =
		session.status === "waiting"
			? !!participantsError
			: !!(participantsError || balancesError);

	// デバッグ情報をコンソールに出力
	useEffect(() => {
		console.log("Realtime status:", {
			sessionStatus: session.status,
			participantsLoading,
			balancesLoading,
			participantsError,
			balancesError,
			participantsCount: realtimeParticipants.length,
			balancesCount: realtimeBalances.length,
			isConnected,
			hasRealtimeError,
		});
	}, [
		session.status,
		participantsLoading,
		balancesLoading,
		participantsError,
		balancesError,
		isConnected,
		hasRealtimeError,
		realtimeParticipants.length,
		realtimeBalances.length,
	]);

	/**
	 * ゲームを開始
	 */
	const handleStartGame = async () => {
		await startSession(session.id);
		// リアルタイム購読により自動的に更新されるため、router.refresh()は不要
	};

	/**
	 * セッションを終了
	 */
	const handleEndSession = async () => {
		await endSession(session.id);
	};

	/**
	 * ユーザーの残高を取得
	 */
	const getUserBalance = (userId: string): number => {
		const balance = realtimeBalances.find((b) => b.user_id === userId);
		return balance?.amount ?? session.initial_chips;
	};

	/**
	 * 残高変更アニメーションのクラス名を取得
	 */
	const getBalanceAnimationClass = (userId: string): string => {
		if (!recentChange || recentChange.userId !== userId) return "";

		if (recentChange.changeType === "increase") {
			return "animate-pulse text-green-600";
		} else if (recentChange.changeType === "decrease") {
			return "animate-pulse text-red-600";
		}
		return "";
	};

	/**
	 * チップ送信ダイアログを開く
	 */
	const handleOpenTransferDialog = (recipient: ParticipantWithProfile) => {
		setSelectedRecipient(recipient);
		setTransferDialogOpen(true);
	};

	/**
	 * 現在のユーザー情報を取得
	 */
	const currentUser = participants.find((p) => p.user_id === currentUserId);
	const currentUserBalance = getUserBalance(currentUserId);
	const currentUserName =
		currentUser?.profiles?.display_name || `ユーザー ${currentUserId.slice(0, 8)}`;

	return (
		<div className='max-w-4xl mx-auto space-y-6'>
			{/* ヘッダー */}
			<div className='flex items-center justify-between'>
				<div className='flex items-center gap-4'>
					<Button variant='ghost' size='icon' onClick={() => router.back()}>
						<ArrowLeft className='h-5 w-5' />
					</Button>
					<div>
						<div className='flex items-center gap-3'>
							<h1 className='text-3xl font-bold'>
								{session.name || "セッション"}
							</h1>
							<Badge
								variant={
									session.status === "active"
										? "default"
										: session.status === "waiting"
										? "secondary"
										: "outline"
								}
							>
								{session.status === "waiting"
									? "待機中"
									: session.status === "active"
									? "進行中"
									: "完了"}
							</Badge>
						</div>
						<p className='text-neutral-600 mt-1'>セッションID: {session.id}</p>
					</div>
				</div>

				{/* 接続状態インジケーター */}
				<div className='flex items-center gap-2'>
					{session.status === "waiting" ? (
						// waiting状態ではparticipantsの接続のみチェック
						participantsLoading ? (
							<>
								<div className='h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin' />
								<span className='text-sm text-blue-600'>接続中...</span>
							</>
						) : participantsError ? (
							<>
								<WifiOff className='h-4 w-4 text-red-600' />
								<span className='text-sm text-red-600'>切断</span>
							</>
						) : (
							<>
								<Wifi className='h-4 w-4 text-green-600' />
								<span className='text-sm text-green-600'>接続中</span>
							</>
						)
					) : // active状態では両方の接続をチェック
					participantsLoading || balancesLoading ? (
						<>
							<div className='h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin' />
							<span className='text-sm text-blue-600'>接続中...</span>
						</>
					) : isConnected ? (
						<>
							<Wifi className='h-4 w-4 text-green-600' />
							<span className='text-sm text-green-600'>接続中</span>
						</>
					) : (
						<>
							<WifiOff className='h-4 w-4 text-red-600' />
							<span className='text-sm text-red-600'>切断</span>
						</>
					)}
				</div>
			</div>

			{/* デバッグ情報（一時的） */}
			<Card className='border-blue-300 bg-blue-50'>
				<CardContent className='pt-6'>
					<div className='space-y-2'>
						<p className='font-semibold text-blue-900'>
							Realtime デバッグ情報
						</p>
						<p className='text-sm text-blue-800'>
							テストステータス: {testStatus}
						</p>
						{testError && (
							<pre className='text-xs text-blue-700 overflow-auto'>
								{JSON.stringify(testError, null, 2)}
							</pre>
						)}
						<p className='text-sm text-blue-800'>
							参加者: {participantsLoading ? '読み込み中' : participantsError || '正常'}
						</p>
						<p className='text-sm text-blue-800'>
							残高: {balancesLoading ? '読み込み中' : balancesError || '正常'}
						</p>
					</div>
				</CardContent>
			</Card>

			{/* エラーメッセージ */}
			{hasRealtimeError && (
				<Card className='border-red-300 bg-red-50'>
					<CardContent className='pt-6'>
						<div className='space-y-2'>
							<p className='font-semibold text-red-900'>
								リアルタイム接続エラー
							</p>
							{participantsError && (
								<p className='text-sm text-red-800'>
									参加者: {participantsError}
								</p>
							)}
							{session.status === "active" && balancesError && (
								<p className='text-sm text-red-800'>残高: {balancesError}</p>
							)}
							<p className='text-sm text-red-700 mt-2'>
								ページを再読み込みしてください。問題が続く場合は、Supabaseのリアルタイム機能とRLSポリシーを確認してください。
							</p>
						</div>
					</CardContent>
				</Card>
			)}

			{/* 待機中の表示 */}
			{session.status === "waiting" && (
				<>
					{/* セッション情報 */}
					<Card>
						<CardHeader>
							<CardTitle>セッション情報</CardTitle>
						</CardHeader>
						<CardContent className='space-y-4'>
							<div className='grid grid-cols-2 gap-4'>
								<div>
									<p className='text-sm text-neutral-600'>初期チップ数</p>
									<p className='text-2xl font-bold'>
										{session.initial_chips.toLocaleString()}
									</p>
								</div>
								{session.rate && (
									<div>
										<p className='text-sm text-neutral-600'>レート</p>
										<p className='text-2xl font-bold'>
											{session.rate}pts/チップ
										</p>
									</div>
								)}
							</div>

							<Separator />

							<div>
								<div className='flex items-center justify-between mb-2'>
									<p className='text-sm text-neutral-600'>参加状況</p>
									<span className='text-sm font-semibold'>
										{participantCount} / {session.max_participants}人
									</span>
								</div>
								<Progress
									value={(participantCount / session.max_participants) * 100}
								/>
							</div>
						</CardContent>
					</Card>

					{/* QRコード */}
					<Card>
						<CardHeader>
							<CardTitle>プレイヤーを招待</CardTitle>
							<CardDescription>
								QRコードをスキャンしてもらうか、セッションIDを共有してください
							</CardDescription>
						</CardHeader>
						<CardContent>
							<QRCodeDisplay sessionId={session.id} />
						</CardContent>
					</Card>

					{/* 参加者リスト */}
					<Card>
						<CardHeader>
							<CardTitle>参加者</CardTitle>
						</CardHeader>
						<CardContent>
							<div className='space-y-3'>
								{participants.map((participant) => (
									<div
										key={participant.id}
										className='flex items-center gap-3 p-3 rounded-lg border border-neutral-200'
									>
										<Avatar>
											<AvatarFallback>
												{participant.profiles?.display_name?.[0] || "U"}
											</AvatarFallback>
										</Avatar>
										<div className='flex-1'>
											<p className='font-semibold'>
												{participant.profiles?.display_name || "Unknown"}
											</p>
											<p className='text-sm text-neutral-600'>
												{new Date(participant.joined_at).toLocaleTimeString(
													"ja-JP"
												)}
												に参加
											</p>
										</div>
										{participant.user_id === session.host_user_id && (
											<Badge variant='outline'>ホスト</Badge>
										)}
									</div>
								))}
							</div>
						</CardContent>
					</Card>

					{/* ホスト専用アクション */}
					{isHost && (
						<div className='flex gap-4'>
							<Button
								variant='outline'
								className='flex-1'
								onClick={() => router.push("/dashboard")}
								disabled={loading}
							>
								セッションをキャンセル
							</Button>
							<Button
								className='flex-1'
								onClick={handleStartGame}
								disabled={!canStart || loading}
							>
								<Play className='mr-2 h-4 w-4' />
								ゲームを開始
							</Button>
						</div>
					)}

					{!canStart && isHost && (
						<p className='text-center text-sm text-neutral-600'>
							ゲームを開始するには2人以上の参加が必要です
						</p>
					)}
				</>
			)}

			{/* 進行中の表示 */}
			{session.status === "active" && (
				<>
					{/* 参加者リストと残高 */}
					<Card>
						<CardHeader>
							<CardTitle>参加者と残高</CardTitle>
							<CardDescription>
								リアルタイムで残高が更新されます
							</CardDescription>
						</CardHeader>
						<CardContent>
							<div className='space-y-3'>
								{participants.map((participant) => {
									const isMe = participant.user_id === currentUserId;
									const balance = getUserBalance(participant.user_id);
									const animationClass = getBalanceAnimationClass(
										participant.user_id
									);

									return (
										<div
											key={participant.id}
											className={`flex items-center gap-3 p-4 rounded-lg border transition-all ${
												isMe
													? "border-blue-300 bg-blue-50"
													: "border-neutral-200"
											}`}
										>
											<Avatar>
												<AvatarFallback>
													{participant.profiles?.display_name?.[0] || "U"}
												</AvatarFallback>
											</Avatar>
											<div className='flex-1'>
												<p className='font-semibold'>
													{participant.profiles?.display_name || "Unknown"}
													{isMe && " (あなた)"}
												</p>
												<div className='flex items-baseline gap-2 mt-1'>
													<span
														className={`text-2xl font-bold ${animationClass}`}
													>
														{balance.toLocaleString()}
													</span>
													<span className='text-sm text-neutral-600'>
														チップ
													</span>
												</div>
											</div>
											<div className='flex items-center gap-2'>
												{participant.user_id === session.host_user_id && (
													<Badge variant='outline'>ホスト</Badge>
												)}
												{!isMe && (
													<Button
														size='sm'
														onClick={() =>
															handleOpenTransferDialog(participant)
														}
													>
														<Send className='h-4 w-4 mr-1' />
														送信
													</Button>
												)}
											</div>
										</div>
									);
								})}
							</div>
						</CardContent>
					</Card>

					{/* トランザクション履歴 */}
					<TransactionHistory
						sessionId={session.id}
						currentUserId={currentUserId}
						limit={20}
					/>

					{/* ホスト専用アクション */}
					{isHost && (
						<Button
							className='w-full'
							variant='destructive'
							onClick={handleEndSession}
							disabled={loading}
						>
							<StopCircle className='mr-2 h-4 w-4' />
							セッションを終了
						</Button>
					)}
				</>
			)}

			{/* チップ送信ダイアログ */}
			{selectedRecipient && (
				<ChipTransferDialog
					open={transferDialogOpen}
					onOpenChange={setTransferDialogOpen}
					sessionId={session.id}
					recipient={{
						id: selectedRecipient.user_id,
						name:
							selectedRecipient.profiles?.display_name ||
							`ユーザー ${selectedRecipient.user_id.slice(0, 8)}`,
						balance: getUserBalance(selectedRecipient.user_id),
					}}
					sender={{
						id: currentUserId,
						name: currentUserName,
						balance: currentUserBalance,
					}}
					onTransferSuccess={() => {
						// トランザクション成功後の処理（リアルタイム更新で自動的に反映される）
					}}
				/>
			)}
		</div>
	);
}
