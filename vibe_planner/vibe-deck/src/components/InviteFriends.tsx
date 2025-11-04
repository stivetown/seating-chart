'use client';
import { useEffect, useMemo, useState } from 'react';
import QRCode from 'qrcode';

type Props = {
  sessionId: string;
  open: boolean;
  onClose: () => void;
};

export default function InviteFriends({ sessionId, open, onClose }: Props) {
  const [joinUrl, setJoinUrl] = useState<string>('');
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [err, setErr] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let alive = true;
    async function load() {
      setErr(null);
      try {
        const res = await fetch(`/api/session/${sessionId}/invite`, { cache: 'no-store' });
        if (!res.ok) throw new Error('invite_fetch_failed');
        const data = await res.json();
        if (alive) {
          // If the server didn't provide a full URL (NEXT_PUBLIC_BASE_URL not set), build it client-side
          let url = data.joinUrl;
          if (url && !url.startsWith('http')) {
            url = new URL(url, window.location.origin).toString();
          }
          setJoinUrl(url);
        }
      } catch (e: any) {
        if (alive) setErr(e?.message || 'failed');
      }
    }
    if (open) load();
    return () => { alive = false; };
  }, [sessionId, open]);

  useEffect(() => {
    let alive = true;
    async function makeQR() {
      if (!joinUrl) return;
      try {
        const url = await QRCode.toDataURL(joinUrl, { margin: 1, width: 256 });
        if (alive) setQrDataUrl(url);
      } catch {/* ignore */}
    }
    makeQR();
    return () => { alive = false; };
  }, [joinUrl]);

  const canShare = typeof navigator !== 'undefined' && !!(navigator as any).share;

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-[92%] max-w-md rounded-2xl bg-white p-5 shadow-xl">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Invite friends</h2>
          <button onClick={onClose} aria-label="Close" className="text-sm text-neutral-500 hover:text-black">✕</button>
        </div>

        {err && <div className="mt-3 rounded border border-red-200 bg-red-50 p-2 text-sm text-red-700">Error: {err}</div>}

        <p className="mt-3 text-sm text-neutral-600">
          Send this link to friends. They'll swipe their vibe, and matches will appear here.
        </p>

        <div className="mt-3">
          <label className="block text-sm font-medium text-gray-700 mb-1">Join link</label>
          <input
            value={joinUrl}
            readOnly
            className="w-full rounded-lg border px-3 py-2 text-sm"
            onFocus={(e) => e.currentTarget.select()}
          />
          <div className="mt-1 text-xs text-gray-500">
            Share this link (starts with /s/). Do not share the /sync link.
          </div>
          <div className="mt-2 flex gap-2">
            <button
              className="rounded bg-black px-3 py-2 text-sm text-white"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(joinUrl);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1500);
                  const { capture } = await import('@/lib/analytics').catch(() => ({ capture: async () => {} }));
                  capture?.('invite_copied', { sessionId });
                } catch {/* ignore */}
              }}
            >
              {copied ? 'Copied!' : 'Copy link'}
            </button>
            <button
              className="rounded border px-3 py-2 text-sm"
              onClick={async () => {
                try {
                  if (canShare) {
                    await (navigator as any).share({ title: 'Join my Vibe Deck', url: joinUrl, text: 'Swipe your vibe here:' });
                  } else {
                    await navigator.clipboard.writeText(joinUrl);
                  }
                  const { capture } = await import('@/lib/analytics').catch(() => ({ capture: async () => {} }));
                  capture?.('invite_shared', { sessionId, method: canShare ? 'web_share' : 'clipboard' });
                } catch {/* ignore */}
              }}
            >
              {canShare ? 'Share…' : 'Copy & share'}
            </button>
          </div>
        </div>

        <div className="mt-4 flex flex-col items-center">
          {qrDataUrl ? (
            <>
              <img src={qrDataUrl} alt="QR code" className="h-40 w-40 rounded-lg border" />
              <div className="mt-2 text-xs text-neutral-500">Scan to join</div>
            </>
          ) : (
            <div className="h-40 w-40 animate-pulse rounded-lg bg-neutral-100" />
          )}
        </div>

        <div className="mt-4 text-xs text-neutral-500">
          Tip: paste the link into your group chat or text it to 2–3 friends.
        </div>
      </div>
    </div>
  );
}
