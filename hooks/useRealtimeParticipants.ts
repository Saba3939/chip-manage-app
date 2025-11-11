"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Database } from "@/lib/supabase/database.types";
import { RealtimeChannel } from "@supabase/supabase-js";

type SessionParticipantRow =
	Database["public"]["Tables"]["session_participants"]["Row"];

/**
 * 参加者情報をリアルタイムで購読するカスタムフック
 * session_participantsテーブルのINSERT/DELETEイベントを監視し、
 * 参加者リストを自動的に更新する
 */
export function useRealtimeParticipants(sessionId: string | null) {
	const [participants, setParticipants] = useState<SessionParticipantRow[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (!sessionId) {
			setLoading(false);
			return;
		}

		const supabase = createClient();
		let channel: RealtimeChannel | null = null;
		let isSubscribed = false;

		const setupRealtimeSubscription = async () => {
			try {
				// 初期データを取得
				const { data: initialData, error: fetchError } = await supabase
					.from("session_participants")
					.select("*")
					.eq("session_id", sessionId)
					.order("joined_at", { ascending: true });

				if (fetchError) {
					throw fetchError;
				}

				setParticipants(initialData || []);
				setError(null);

				// 既存のチャンネルがあれば削除
				const existingChannels = supabase.getChannels();
				for (const ch of existingChannels) {
					if (ch.topic.includes('session_participants')) {
						await supabase.removeChannel(ch);
						console.log('Removed existing channel:', ch.topic);
					}
				}

				// リアルタイム購読を設定（ユニークなチャンネル名）
				const channelName = `session_participants:${sessionId}:${Date.now()}`;
				console.log('Creating channel:', channelName);

				channel = supabase
					.channel(channelName)
					.on(
						"postgres_changes",
						{
							event: "INSERT",
							schema: "public",
							table: "session_participants",
						},
						(payload) => {
							console.log("Participant inserted:", payload);
							const newParticipant = payload.new as SessionParticipantRow;

							// session_idでフィルタリング
							if (newParticipant.session_id !== sessionId) {
								return;
							}

							setParticipants((current) => {
								if (current.some((p) => p.id === newParticipant.id)) {
									return current;
								}
								return [...current, newParticipant].sort(
									(a, b) =>
										new Date(a.joined_at).getTime() -
										new Date(b.joined_at).getTime()
								);
							});
						}
					)
					.on(
						"postgres_changes",
						{
							event: "UPDATE",
							schema: "public",
							table: "session_participants",
						},
						(payload) => {
							console.log("Participant updated:", payload);
							const newParticipant = payload.new as SessionParticipantRow;

							// session_idでフィルタリング
							if (newParticipant.session_id !== sessionId) {
								return;
							}

							setParticipants((current) =>
								current
									.map((p) =>
										p.id === newParticipant.id ? newParticipant : p
									)
									.sort(
										(a, b) =>
											new Date(a.joined_at).getTime() -
											new Date(b.joined_at).getTime()
									)
							);
						}
					)
					.on(
						"postgres_changes",
						{
							event: "DELETE",
							schema: "public",
							table: "session_participants",
						},
						(payload) => {
							console.log("Participant deleted:", payload);
							// DELETEの場合、oldには主キーのみが含まれる
							const deletedId = (payload.old as any)?.id;
							if (deletedId) {
								setParticipants((current) => {
									// 削除対象がこのセッションのものかチェック
									const targetParticipant = current.find((p) => p.id === deletedId);
									if (!targetParticipant) {
										return current;
									}
									return current.filter((p) => p.id !== deletedId);
								});
							}
						}
					)
					.subscribe((status, error) => {
						console.log("Participant subscription status:", status);
						console.log("Subscription error details:", error);

						if (status === "SUBSCRIBED") {
							isSubscribed = true;
							setLoading(false);
							console.log('✅ Participants channel subscribed successfully');
						}
						if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
							console.error("Channel error details:", error);
							setError("リアルタイム接続に問題が発生しました");
							setLoading(false);
						}
					});
			} catch (err) {
				console.error("Realtime participants setup error:", err);
				setError(err instanceof Error ? err.message : "エラーが発生しました");
				setLoading(false);
			}
		};

		setupRealtimeSubscription();

		// クリーンアップ: コンポーネントのアンマウント時に購読を解除
		return () => {
			console.log('🧹 Cleaning up participants subscription');
			if (channel) {
				console.log("Unsubscribing from participants channel:", channel.topic);
				supabase.removeChannel(channel);
			}
			isSubscribed = false;
		};
	}, [sessionId]);

	return { participants, loading, error };
}
