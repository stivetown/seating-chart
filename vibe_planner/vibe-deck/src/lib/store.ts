import { atom } from 'jotai';
import type { User, Session, SwipeAction, Plan } from '@/types';

// User state
export const userAtom = atom<User | null>(null);

// Session state
export const sessionAtom = atom<Session | null>(null);

// Swipe actions state
export const swipeActionsAtom = atom<SwipeAction[]>([]);

// Current plan state
export const planAtom = atom<Plan | null>(null);

// UI state
export const isLoadingAtom = atom<boolean>(false);
export const errorAtom = atom<string | null>(null);
