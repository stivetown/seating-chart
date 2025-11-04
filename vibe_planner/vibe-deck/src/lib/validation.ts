import { z } from 'zod';

// Token validation schema
export const tokenSchema = z
  .string()
  .length(12)
  .regex(/^[1-9A-HJ-NP-Za-km-z]+$/);

// Session creation schema
export const createSessionSchema = z.object({
  groupSizeHint: z.number().int().min(1).max(20).optional(),
  location: z
    .object({
      lat: z.number().min(-90).max(90),
      lng: z.number().min(-180).max(180),
    })
    .optional(),
  displayName: z.string().min(1).max(100).optional(),
});

// Join session schema
export const joinSessionSchema = z.object({
  displayName: z.string().min(1).max(100).optional(),
  deviceFingerprint: z.string().min(1).max(255).optional(),
});

// Swipe submission schema
export const swipeSubmissionSchema = z.object({
  participantId: z.string().uuid(),
  rawSwipes: z.record(z.string(), z.number()),
  topVibes: z.array(z.string()).min(1).max(10),
  deviceFingerprint: z.string().min(1).max(255).optional(),
});

// Response schemas
export const sessionResponseSchema = z.object({
  sessionId: z.string(),
  inviteToken: z.string(),
  joinUrl: z.string(),
});

export const joinResponseSchema = z.object({
  participantId: z.string(),
  sessionId: z.string(),
});

export const statusResponseSchema = z.object({
  status: z.enum(['active', 'matched', 'expired']),
  hostName: z.string(),
  participants: z.array(
    z.object({
      id: z.string(),
      name: z.string().nullable(),
      state: z.enum(['joined', 'swiping', 'completed']),
    })
  ),
  counts: z.object({
    total: z.number(),
    joined: z.number(),
    swiping: z.number(),
    completed: z.number(),
  }),
  provisionalMatch: z
    .object({
      groupVibe: z.any(),
      suggestions: z.array(z.any()),
    })
    .optional(),
});

export const swipeResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  matchGenerated: z.boolean().optional(),
});

export const shareCardSchema = z.object({
  sessionId: z.string().uuid(),
  groupVibeKey: z.string().min(1),
  participants: z
    .array(
      z.object({
        name: z.string().min(1),
      })
    )
    .min(1),
  suggestions: z
    .array(
      z.object({
        title: z.string().min(1),
      })
    )
    .min(1)
    .max(3),
});

export type CreateSessionInput = z.infer<typeof createSessionSchema>;
export type JoinSessionInput = z.infer<typeof joinSessionSchema>;
export type SwipeSubmissionInput = z.infer<typeof swipeSubmissionSchema>;
export type SessionResponse = z.infer<typeof sessionResponseSchema>;
export type JoinResponse = z.infer<typeof joinResponseSchema>;
export type StatusResponse = z.infer<typeof statusResponseSchema>;
export type SwipeResponse = z.infer<typeof swipeResponseSchema>;
export type ShareCardInput = z.infer<typeof shareCardSchema>;
