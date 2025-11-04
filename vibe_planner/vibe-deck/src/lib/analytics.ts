// 'use client';
let warned = false;
let ph: any = null;
const key = () => process.env.NEXT_PUBLIC_POSTHOG_KEY;
const host = () => process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com';

async function init() {
  if (typeof window === 'undefined') return;
  if (!key()) {
    if (!warned) { console.warn('PostHog key not found, using custom logger only'); warned = true; }
    return;
  }
  if (ph) return;
  const { default: posthog } = await import('posthog-js');
  posthog.init(key() as string, { api_host: host(), capture_pageview: false });
  ph = posthog;
}
export async function capture(event: string, props?: Record<string, any>) {
  await init(); if (ph) ph.capture(event, props); else console.debug('[analytics]', event, props || {});
}
export async function pageview(props?: Record<string, any>) { await init(); if (ph) ph.capture('$pageview', props); }
export async function identify(id: string, props?: Record<string, any>) { await init(); if (ph) ph.identify(id, props); }
export function reset(){ if (ph) ph.reset(); }

// Convenience functions for common events
export async function initAnalytics() {
  await init();
}

export async function trackSessionCreated(props: { sessionId: string; participantId: string }) {
  await capture('session_created', props);
}

export async function trackParticipantJoined(props: { sessionId: string; participantId: string; displayName?: string }) {
  await capture('participant_joined', props);
}

export async function trackDeckCompleted(props: { sessionId: string; participantId: string; topVibes: string[] }) {
  await capture('deck_completed', props);
}

export async function trackProvisionalShown(props: { sessionId: string; groupVibe: { key: string; confidence: number }; completedCount: number; totalParticipants: number; sampleSuggestion?: string }) {
  await capture('provisional_shown', props);
}

export async function trackFinalShown(props: { sessionId: string; groupVibe: { key: string; confidence: number }; suggestionCount: number; totalParticipants: number }) {
  await capture('final_shown', props);
}

export async function trackShareClicked(props: { sessionId: string; type: 'card' | 'link'; shareMethod: 'native' | 'clipboard'; shareTarget: string; groupVibeKey: string }) {
  await capture('share_clicked', props);
}

export async function trackPlanCreated(props: { sessionId: string; groupVibe: { key: string; confidence: number } }) {
  await capture('plan_created', props);
}

export async function trackInviteOpened(props: { token: string; source: string }) {
  await capture('invite_opened', props);
}

export async function trackInviteCopied(props: { sessionId: string }) {
  await capture('invite_copied', props);
}

export async function trackInviteShared(props: { sessionId: string; method: 'web_share' | 'clipboard' }) {
  await capture('invite_shared', props);
}

export async function trackInviteQRShown(props: { sessionId: string }) {
  await capture('invite_qr_shown', props);
}

export async function trackJoinSuccess(props: { sessionId: string }) {
  await capture('join_success', props);
}

export async function trackJoinError(props: { token: string; error: string }) {
  await capture('join_error', props);
}