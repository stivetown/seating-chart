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
      <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-700 to-blue-800 relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-indigo-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-blue-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
        </div>
        <div className="mx-auto max-w-md p-6 relative z-10 flex items-center min-h-screen">
          <div className="w-full bg-white/70 backdrop-blur-xl border border-white/30 shadow-2xl shadow-indigo-500/10 rounded-2xl p-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Join your friend's vibe</h1>
            <p className="mt-2 text-sm text-gray-700">
              You'll swipe a few vibe cards (≈30s). Then we'll show your group's match.
            </p>

            <label className="mt-6 block text-sm font-medium text-gray-900">Your name (optional)</label>
            <input
              className="mt-2 w-full rounded-xl border border-white/40 bg-white/80 backdrop-blur-sm px-4 py-3 text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50"
              placeholder="e.g., Sam"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />

            <button
              className="mt-6 w-full rounded-xl bg-gradient-to-r from-indigo-500 to-blue-500 hover:from-indigo-600 hover:to-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 disabled:opacity-60 transition-all"
              onClick={handleJoin}
              disabled={step === 'posting'}
            >
              {step === 'posting' ? 'Joining…' : 'Start swiping'}
            </button>

            {err && (
              <div className="mt-4 rounded-xl border border-red-300/30 bg-red-500/80 backdrop-blur-md p-3 text-sm text-white shadow-lg shadow-red-500/20">
                {String(err)}
              </div>
            )}

            <div className="mt-6 text-xs text-gray-600">
              No account needed. We only use your picks to match the group.
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'swipe' && sessionId && participantId) {
    const LazyDeck = require('@/components/VibeDeck').default;
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-700 to-blue-800 relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-indigo-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-blue-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
        </div>
        <div className="mx-auto max-w-lg p-4 relative z-10">
          <div className="mb-3 text-center text-sm text-white font-medium drop-shadow-lg">Swipe your vibe — right to keep, left to pass.</div>
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
      </div>
    );
  }

  if (step === 'posting') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-700 to-blue-800 relative overflow-hidden flex items-center justify-center">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-indigo-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        </div>
        <div className="text-center relative z-10 bg-white/80 backdrop-blur-xl border border-white/30 shadow-2xl shadow-indigo-500/20 rounded-2xl p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mx-auto mb-4"></div>
          <p className="text-gray-700 font-medium">Saving your picks…</p>
        </div>
      </div>
    );
  }

  // Error fallback
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-700 to-blue-800 relative overflow-hidden flex items-center justify-center">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-indigo-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
      </div>
      <div className="mx-auto max-w-md p-6 relative z-10">
        <div className="rounded-xl border border-red-300/30 bg-red-500/80 backdrop-blur-md p-4 text-sm text-white shadow-lg shadow-red-500/20 mb-4">
          {String(err || 'Something went wrong.')}
        </div>
        <button 
          className="w-full rounded-xl bg-gradient-to-r from-indigo-500 to-blue-500 hover:from-indigo-600 hover:to-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition-all"
          onClick={() => setStep('join')}
        >
          Try again
        </button>
      </div>
    </div>
  );
}