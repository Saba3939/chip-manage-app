import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/actions';
import { getSession } from '@/lib/session/actions';
import { getParticipants, isHost } from '@/lib/session/participants';
import { SessionDetailClient } from '@/components/session/SessionDetailClient';

/**
 * セッション詳細画面（Server Component）
 */
export default async function SessionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  const { id: sessionId } = await params;
  const session = await getSession(sessionId);

  if (!session) {
    return (
      <div className="text-center py-12">
        <p className="text-neutral-600">セッションが見つかりませんでした</p>
      </div>
    );
  }

  const participants = await getParticipants(sessionId);
  const userIsHost = await isHost(sessionId, user.id);

  return (
    <SessionDetailClient
      session={session}
      participants={participants}
      currentUserId={user.id}
      isHost={userIsHost}
    />
  );
}
