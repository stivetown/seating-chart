'use client';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

type JoinResp = { participantId: string; sessionId: string };

function useLocalParticipant(token: string) {
  const key = `vibe_participant_${token}`;
  return {
    get: () => {
      try { return JSON.parse(localStorage.getItem(key) || 'null'); } catch { return null; }
    },
    set: (v: any) => localStorage.setItem(key, JSON.stringify(v)),
    clear: () => localStorage.removeItem(key),
  };
}

export default function JoinAndSwipePage({ params }: { params: Promise<{ token: string }> }) {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const store = useLocalParticipant(token || '');

  const [displayName, setDisplayName] = useState('');
  const [step, setStep] = useState<'join'|'swipe'|'posting'|'error'>('join');
  const [err, setErr] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [participantId, setParticipantId] = useState<string | null>(null);

  // Handle async params
  useEffect(() => {
    params.then((resolvedParams) => {
      if (resolvedParams?.token) {
        setToken(resolvedParams.token);
      }
    });
  }, [params]);

  // If we already joined earlier, check participant state and redirect appropriately
  useEffect(() => {
    if (!token) return;
    const saved = store.get();
    if (saved?.participantId && saved?.sessionId) {
      setParticipantId(saved.participantId);
      setSessionId(saved.sessionId);
      
      // Check if participant is already completed
      fetch(`/api/session/${saved.sessionId}/status`)
        .then(res => res.json())
        .then(data => {
          const participant = data.participants?.find((p: any) => p.id === saved.participantId);
          if (participant?.state === 'completed') {
            // Already completed, go to sync page
            router.replace(`/sync/${saved.sessionId}`);
          } else {
            // Not completed yet, go to swipe
            setStep('swipe');
          }
        })
        .catch(() => {
          // If we can't check status, assume we need to swipe
          setStep('swipe');
        });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, router]);

  async function handleJoin() {
    if (!token) return;
    setErr(null);
    setStep('posting');
    try {
          const res = await fetch(`/api/join/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ displayName: displayName || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'join_failed');
      const { participantId, sessionId } = data as JoinResp;
      setParticipantId(participantId);
      setSessionId(sessionId);
      store.set({ participantId, sessionId });
      setStep('swipe');
    } catch (e: any) {
      setErr(e?.message || 'Could not join');
      setStep('error');
    }
  }

  // Lazy-load the deck to keep this page slim
  const VibeDeck = useMemo(() => {
    return (props: any) => null;
  }, []);
  useEffect(() => {
    // dynamic import to avoid SSR mismatch
    (async () => {
      const mod = await import('@/components/VibeDeck').catch(() => null);
      if (mod && mod.default) {
        // no-op: component will be rendered via key below
      }
    })();
  }, []);

  // Render
  if (step === 'join') {
    return (
      <div className="mx-auto max-w-md p-6">
        <h1 className="text-xl font-semibold">Join your friend's vibe</h1>
        <p className="mt-2 text-sm text-neutral-600">
          You'll swipe a few vibe cards (≈30s). Then we'll show your group's match.
        </p>

        <label className="mt-4 block text-sm font-medium">Your name (optional)</label>
        <input
          className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
          placeholder="e.g., Sam"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
        />

        <button
          className="mt-4 w-full rounded-lg bg-black px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
          onClick={handleJoin}
          disabled={step === 'posting'}
        >
          {step === 'posting' ? 'Joining…' : 'Start swiping'}
        </button>

        {err && <div className="mt-3 rounded border border-red-200 bg-red-50 p-2 text-sm text-red-700">{String(err)}</div>}

        <div className="mt-6 text-xs text-neutral-500">
          No account needed. We only use your picks to match the group.
        </div>
      </div>
    );
  }

  if (step === 'swipe' && sessionId && participantId) {
    const LazyDeck = require('@/components/VibeDeck').default;
    return (
      <div className="mx-auto max-w-lg p-4">
        <div className="mb-3 text-sm text-neutral-600">Swipe your vibe — right to keep, left to pass.</div>
        <LazyDeck
          variant="session"
          onComplete={async ({ rawSwipes, topVibes }: { rawSwipes: Record<string, number>; topVibes: string[] }) => {
            setStep('posting');
            try {
              if (!participantId || typeof participantId !== 'string' || participantId.trim() === '') {
                throw new Error('missing_participantId');
              }

              const cleanSwipes: Record<string, number> = {};
              Object.entries(rawSwipes || {}).forEach(([k, v]) => {
                const n = typeof v === 'number' ? v : Number(v);
                if (Number.isFinite(n)) cleanSwipes[String(k)] = n;
              });

              const cleanTop = Array.from(new Set((topVibes || []).map(String).filter(Boolean))).slice(0, 3);

              const payload = { participantId, rawSwipes: cleanSwipes, topVibes: cleanTop };
              console.log('SWIPES_PAYLOAD', payload);

              const res = await fetch(`/api/session/${sessionId}/swipes`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
              });
              const data = await res.json().catch(() => ({}));
              if (!res.ok) throw new Error(typeof data?.error === 'string' ? data.error : 'swipes_failed');

              router.replace(`/sync/${sessionId}`);
            } catch (e: any) {
              console.error('SWIPES_ERROR', e);
              setErr(String(e?.message || e));
              setStep('error');
            }
          }}
        />
      </div>
    );
  }

  if (step === 'posting') {
    return <div className="p-6 text-sm text-neutral-600">Saving your picks…</div>;
  }

  // Error fallback
  return (
    <div className="mx-auto max-w-md p-6">
      <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{String(err || 'Something went wrong.')}</div>
      <button className="mt-3 rounded border px-3 py-2 text-sm" onClick={() => setStep('join')}>Try again</button>
    </div>
  );
}