# Vibe Deck

A modern Next.js 14 application for collaborative planning through swiping. Built with TypeScript, Tailwind CSS, and shadcn/ui.

## Features

- 🎯 **Swipe Interface**: Intuitive card-based swiping for decision making
- 👥 **Session Management**: Join sessions with friends using tokens
- 🔄 **Live Polling**: Real-time updates on group progress and results
- 📋 **Smart Matching**: Deterministic group vibe matching with confidence scoring
- 🎨 **Modern UI**: Beautiful, responsive design with Tailwind CSS and shadcn/ui

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **Storage**: Vercel KV (required for production)
- **Validation**: Zod
- **Animations**: Framer Motion
- **Code Quality**: ESLint + Prettier

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Vercel account (optional, for persistent storage)

### Installation

1. **Clone the repository**

   ```bash
   git clone <your-repo-url>
   cd vibe-deck
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

   ```bash
   cp env.example .env.local
   ```

   Update `.env.local` with your actual values:

   ```env
   # Vercel KV Configuration (required for production)
   KV_REST_API_URL=your_vercel_kv_rest_api_url
   KV_REST_API_TOKEN=your_vercel_kv_rest_api_token
   KV_REST_API_READ_ONLY_TOKEN=your_vercel_kv_read_only_token  # optional

   # Application Configuration
   NEXT_PUBLIC_BASE_URL=http://localhost:3000
   ```

4. **Start the development server**

```bash
npm run dev
   ```

   The application will be available at `http://localhost:3000`.

## Storage

This app uses **in-memory storage by default** with optional **Vercel KV** for persistence.

### Storage Behavior

- **Default**: Uses in-memory storage (data may reset on serverless cold starts)
- **With KV**: Persistent storage across all deployments and cold starts

### Vercel KV Setup (Optional for Persistence)

To enable persistent storage across cold starts:

1. **Create a Vercel KV database** in your Vercel dashboard
2. **Add the environment variables** to your `.env.local`:
   ```env
   KV_REST_API_URL=your_vercel_kv_rest_api_url
   KV_REST_API_TOKEN=your_vercel_kv_rest_api_token
   KV_REST_API_READ_ONLY_TOKEN=your_vercel_kv_read_only_token  # optional
   ```
3. **Deploy to Vercel** - the app will automatically use KV for storage

**Note**: Without KV, this app uses in-memory sessions. Data may reset on serverless cold starts. To enable persistence, configure Vercel KV.

## Usage

### Testing the End-to-End Flow

1. **Create a session**:
   - Go to [http://localhost:3000](http://localhost:3000)
   - Click "Start Swiping" to create a new session
   - Note the invite token and share URL

2. **Join the session**:
   - Open the share URL in a new browser tab/window
   - Enter a display name and join
   - Complete the vibe deck swiping

3. **View live results**:
   - Return to the original tab to see the sync page
   - Watch live updates as participants join and complete (polls every 3 seconds)
   - See provisional and final match results

4. **Create a plan**:
   - Click "Create Plan" to view detailed suggestions
   - Test the copy plan and sharing features
   - Try the geolocation-based nearby options

### Known Limitations

- **No Authentication**: Sessions are identified by tokens only, no user accounts
- **Light Duplicate Prevention**: Uses device fingerprinting, not foolproof
- **Provisional Logic**: Shows provisional matches after 2+ participants, finalizes at 70% confidence or when all participants complete
- **Development Mode**: Rate limiting uses in-memory storage, not distributed
- **No Real Geolocation**: Nearby suggestions use mock data in development

## Database Schema

### Tables

- **sessions**: Session management with invite tokens and location data
- **participants**: User participation tracking with swipe data
- **vibes**: Predefined vibe categories with tags
- **recommendations**: Vibe combination mappings to activity suggestions
- **matches**: Generated group recommendations

### Seed Data

The database comes pre-populated with:

- 10 common vibes (cozy-creative, chill-social, etc.)
- 6 recommendation combinations with 3-5 suggestions each
- Row Level Security disabled for development

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── (routes)/          # Route groups
│   ├── s/[token]/         # Join session page
│   ├── sync/[sessionId]/  # Friend sync status
│   ├── plan/[sessionId]/  # Final plan display
│   └── layout.tsx         # Root layout with brand bar
├── components/            # Reusable UI components
│   └── ui/               # shadcn/ui components
├── lib/                  # Utilities and configurations
│   ├── supabase.ts      # Supabase client
│   ├── rate-limit.ts    # Rate limiting logic
│   └── store.ts         # Jotai state atoms
├── server/              # API routes and server logic
│   └── api/            # Next.js API routes
└── types/              # TypeScript type definitions

supabase/
└── migrations/         # Database migration files

scripts/
└── seed-data.js       # Database seeding script
```

## Available Scripts

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting
- `npm run type-check` - Run TypeScript type checking
- `npm run seed` - Seed database with initial data
- `npm run test` - Run unit tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage report

## Pages

### 🏠 Home (`/`)

Main swipe interface for discovering and rating options.

### 🔗 Join Session (`/s/[token]`)

Join an existing session using a shared token with:

- **Auto-join**: Remembers returning participants via localStorage
- **Name Prompt**: Simple input for display name
- **Live Header**: Shows "You're in [Host]'s session" with participant count
- **Smart Detection**: Automatically detects completed state and redirects to sync
- **Seamless Flow**: Swipe → Submit → Redirect to live results

### 🔄 Friend Sync (`/sync/[sessionId]`)

Real-time view of group progress and live results with three distinct states:

**1. Waiting Room:**

- Avatar grid with participant initials and status badges
- Animated circular progress ring showing completed/total
- Real-time updates as participants join and complete swiping

**2. Provisional Match:**

- Banner showing group vibe key and confidence percentage
- Quick preview of top suggestion
- "Waiting for more participants" indicator

**3. Final Match:**

- Large vibe title with confidence score
- 3-5 detailed suggestions with descriptions and links
- Action buttons: Share to Group Chat, Create Plan, Save Card
- Native sharing with clipboard fallback

**Features:**

- Live participant status updates with visual indicators
- Toast notifications for all events
- Automatic fallback to polling if realtime fails
- "Resync" button for manual refresh
- Responsive design for all screen sizes

### 📋 Plan Page (`/plan/[sessionId]`)

Detailed planning interface with actionable suggestions and time selection:

**Time Selection:**

- Interactive time chips: Tonight, Tomorrow, This Weekend
- Smart time display based on current time
- Visual indicators for available time slots

**Plan Display:**

- Large vibe emoji and formatted name
- Confidence percentage badge
- Detailed suggestions with descriptions and external links
- Clean card-based layout with hover effects

**Copy Plan Feature:**

- One-click copy to clipboard with formatted text
- Includes participant names, confidence, and suggestions
- Includes link back to sync page for full details
- Toast notifications for success/error feedback

**Geolocation Integration:**

- Requests location permission on page load
- Generates Google Maps links for nearby options
- Smart keyword extraction from suggestion titles
- Fallback options for restaurants and activities
- External link icons for easy identification

**Host Controls:**

- "Close Session" button (host-only)
- Sets session status to 'matched' for cleanup
- Confirmation and feedback via toast notifications
- Session info display with invite link

**Features:**

- Responsive design for mobile and desktop
- Error handling for missing data or API failures
- Loading states and user feedback
- Integration with existing toast system

## Development

### Code Quality

- ESLint for code linting
- Prettier for code formatting
- TypeScript for type safety

### State Management

- Jotai for lightweight, atomic state management
- React Query for server state and caching

### Styling

- Tailwind CSS for utility-first styling
- shadcn/ui for consistent component design
- Framer Motion for smooth animations

### UI Components

- **VibeDeck** (`/components/VibeDeck.tsx`) - Interactive swipe interface with Framer Motion
- **Toast System** (`/components/ui/toast.tsx`) - Real-time notifications with auto-dismiss
- **Session Sync Hook** (`/hooks/useSessionSync.ts`) - Realtime + polling fallback
- **Visual Status Indicators** - Live connection status, participant states, progress bars
- **Responsive Design** - Mobile-first approach with adaptive layouts

### VibeDeck Features

- **Swipe Interactions**: Drag to swipe, keyboard arrows for desktop
- **Visual Feedback**: Dynamic gradients based on energy tags, swipe indicators
- **Progress Tracking**: Visual progress dots and completion states
- **Smart Inference**: Auto-completes top vibes from tags when insufficient selections
- **Dual Variants**: Solo mode for individual discovery, session mode for group participation
- **Smooth Animations**: Framer Motion powered transitions and micro-interactions

### Session Persistence

- **localStorage Integration**: Remembers participant info across page refreshes
- **Auto-detection**: Checks if participant already completed swiping
- **Smart Redirects**: Automatically routes to sync page if already done
- **Graceful Fallbacks**: Handles API errors and network issues elegantly

### Sharing & Social Features

- **Native Web Share API**: Uses `navigator.share()` when available
- **Clipboard Fallback**: Copies shareable text and URL to clipboard
- **Share Card Generation**: PNG cards (1080x1350) with vibe info and suggestions
- **Group Chat Integration**: Formatted messages for easy sharing
- **Plan Creation**: Direct link to detailed planning page
- **Download Utility**: `downloadShareCard()` function with progress callbacks

### Supabase Integration

- **Browser Client**: `supabase` - for public operations using anon key
- **Server Client**: `supabaseAdmin` - for server-side operations using service role key
- **Real-time**: Subscribe to session events with `subscribeToSession()`
- **Type Safety**: Full TypeScript support with generated database types
- **Helper Functions**:
  - `getSessionByToken()` - Find session by invite token
  - `isSessionActive()` - Check if session is valid and not expired
  - `getSessionParticipants()` - Get all participants for a session
  - `emitSessionEvent()` - Broadcast events to session participants (server only)

### Device Fingerprinting (`/lib/device.ts`)

- **Persistent UUID**: Generated and stored in localStorage (`vibe_device_id`)
- **Fallback Storage**: Uses sessionStorage if localStorage unavailable
- **Browser Fingerprint**: Combines device ID with browser characteristics
- **Double Voting Prevention**: Prevents same device from voting multiple times
- **Update Allowed**: Allows updates if participant hasn't completed voting
- **API Integration**: Automatically included in join and swipe requests

### Rate Limiting (`/lib/rate-limit.ts`)

- **Development**: In-memory rate limiter (60 req/min/IP)
- **Production**: Upstash Redis integration for distributed rate limiting
- **Headers**: X-RateLimit-\* headers for client feedback
- **Graceful Degradation**: Falls back to in-memory if Redis unavailable

### Session Expiration (`/lib/session-expiry.ts`)

- **48-Hour Expiry**: Sessions automatically expire after 48 hours
- **On-Access Check**: Expiration checked on every API call
- **Cron Job**: `/api/cron/expire-sessions` for bulk cleanup
- **Status Updates**: Expired sessions marked as 'expired' status

### Token Generation (`/lib/token.ts`)

- **Base58 Encoding**: 12-character tokens using base58 alphabet
- **Cryptographically Secure**: Uses Node.js crypto.randomBytes()
- **Validation**: Strict format validation for all tokens
- **Non-Guessable**: Excludes confusing characters (0, O, I, l)

### Matching Logic (`/server/matching.ts`)

- **Scoring System**: 1st place = 3 pts, 2nd place = 2 pts, 3rd place = 1 pt
- **Confidence Calculation**: `topScore / (3 * completedCount)`
- **Provisional Matches**: Shown when `completed >= min(2, totalParticipants)`
- **Final Matches**: Triggered when `completed == total` OR `confidence >= 0.7`
- **Realtime Events**: Automatically emits `provisional_match` or `final_match` events
- **Unit Tests**: Comprehensive test coverage for all scoring functions

### Event System (`/types/db.ts`)

- **Type-Safe Events**: Strongly typed event system with discriminated unions
- **Event Types**:
  - `participant_joined` - New participant joins session
  - `participant_updated` - Participant state changes (swiping → completed)
  - `provisional_match` - Early match results with confidence score
  - `final_match` - Final match with complete suggestions
- **Realtime Integration**: Supabase Realtime with automatic fallback to polling
- **Visual Feedback**: Toast notifications for all event types

### API Routes

- **POST /api/session** - Create a new session with host participant
- **POST /api/session/[token]/join** - Join an existing session with token
- **GET /api/session/[sessionId]/status** - Get session status and participants
- **POST /api/session/[sessionId]/swipes** - Submit swipes and trigger matching
- **POST /api/session/[sessionId]/compute** - Server-only helper to recompute matches
- **GET /api/vibes** - Fetch all available vibe cards
- **POST /api/share-card** - Generate shareable PNG card (1080x1350)
- **POST /api/cron/expire-sessions** - Cron job for session expiration
- **GET /api/test** - API health check endpoint

All API routes include:

- ✅ Zod validation for request/response schemas
- ✅ Proper error handling with appropriate HTTP status codes
- ✅ TypeScript type safety
- ✅ Device fingerprinting for double voting prevention
- ✅ 409 Conflict responses for duplicate device voting
- ✅ Rate limiting (60 req/min/IP in dev, Upstash in prod)
- ✅ Session expiration (48h with automatic cleanup)
- ✅ CORS headers (same-origin in dev, configurable in prod)

#### API Usage Examples

**Create Session:**

```bash
curl -X POST http://localhost:3000/api/session \
  -H "Content-Type: application/json" \
  -d '{
    "groupSizeHint": 4,
    "location": {"lat": 37.7749, "lng": -122.4194},
    "displayName": "Host User"
  }'
```

**Join Session:**

```bash
curl -X POST http://localhost:3000/api/session/ABC123DEF456/join \
  -H "Content-Type: application/json" \
  -d '{
    "displayName": "Participant User",
    "deviceFingerprint": "device123"
  }'
```

**Get Session Status:**

```bash
curl http://localhost:3000/api/session/session-uuid/status
```

**Submit Swipes:**

```bash
curl -X POST http://localhost:3000/api/session/session-uuid/swipes \
  -H "Content-Type: application/json" \
  -d '{
    "participantId": "participant-uuid",
    "rawSwipes": {"cozy-creative": 1, "chill-social": -1},
    "topVibes": ["cozy-creative", "music-mingle", "talk-taste"]
  }'
```

**Compute Match (Server Only):**

```bash
curl -X POST http://localhost:3000/api/session/session-uuid/compute
```

**Get Vibes:**

```bash
curl http://localhost:3000/api/vibes
```

**Generate Share Card:**

```bash
curl -X POST http://localhost:3000/api/share-card \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "session-uuid",
    "groupVibeKey": "cozy-creative",
    "participants": [{"name": "Alice"}, {"name": "Bob"}],
    "suggestions": [
      {"title": "Paint & Sip Night"},
      {"title": "DIY Craft Workshop"},
      {"title": "Art Gallery Visit"}
    ]
  }'
```

### VibeDeck Usage

**Solo Mode:**

```tsx
import VibeDeck from '@/components/VibeDeck';

function SoloPage() {
  const handleComplete = (result) => {
    console.log('Top vibes:', result.topVibes);
    console.log('Raw swipes:', result.rawSwipes);
  };

  return (
    <VibeDeck
      variant="solo"
      onComplete={handleComplete}
      className="max-w-md mx-auto"
    />
  );
}
```

**Session Mode:**

```tsx
import VibeDeck from '@/components/VibeDeck';

function SessionPage() {
  const handleComplete = async (result) => {
    // Submit to session API
    await fetch(`/api/session/${sessionId}/swipes`, {
      method: 'POST',
      body: JSON.stringify({
        participantId,
        rawSwipes: result.rawSwipes,
        topVibes: result.topVibes,
      }),
    });
  };

  return (
    <VibeDeck
      variant="session"
      onComplete={handleComplete}
      className="max-w-md mx-auto"
    />
  );
}
```

### Share Card Utility

**Download Share Card:**

```tsx
import { downloadShareCard } from '@/lib/share-card';

const shareCardData = {
  sessionId: 'session-uuid',
  groupVibeKey: 'cozy-creative',
  participants: [{ name: 'Alice' }, { name: 'Bob' }],
  suggestions: [
    { title: 'Paint & Sip Night' },
    { title: 'DIY Craft Workshop' },
    { title: 'Art Gallery Visit' },
  ],
};

await downloadShareCard(shareCardData, {
  onProgress: (progress) => console.log(`${progress}% complete`),
  onError: (error) => console.error('Failed:', error),
  onSuccess: () => console.log('Card downloaded!'),
});
```

**Generate Blob URL (for preview):**

```tsx
import { generateShareCardBlob } from '@/lib/share-card';

const blobUrl = await generateShareCardBlob(shareCardData);
// Use blobUrl for preview or display
```

### Device Fingerprinting Usage

**Basic Device ID:**

```tsx
import { getDeviceId, getDeviceFingerprint } from '@/lib/device';

// Get persistent device ID
const deviceId = getDeviceId(); // e.g., "550e8400-e29b-41d4-a716-446655440000"

// Get enhanced fingerprint with browser info
const fingerprint = getDeviceFingerprint(); // e.g., "550e8400-e29b-41d4-a716-446655440000-aGVsbG8gd29ybGQ="
```

**API Integration:**

```tsx
// Automatically included in API requests
const response = await fetch('/api/session/token123/join', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    displayName: 'Alice',
    deviceFingerprint: getDeviceFingerprint(), // Prevents double voting
  }),
});
```

**Device Info:**

```tsx
import { getDeviceInfo } from '@/lib/device';

const deviceInfo = getDeviceInfo();
console.log(deviceInfo);
// {
//   deviceId: "550e8400-e29b-41d4-a716-446655440000",
//   fingerprint: "550e8400-e29b-41d4-a716-446655440000-aGVsbG8gd29ybGQ=",
//   isPersistent: true,
//   storageType: "localStorage"
// }
```

### Plan Page Usage

**Basic Plan Display:**

```tsx
// The plan page automatically fetches session data and displays:
// - Time selection chips (Tonight, Tomorrow, This Weekend)
// - Match details with confidence score
// - Detailed suggestions with external links
// - Copy plan functionality
// - Nearby options (if geolocation granted)
// - Host controls (if user is host)

// Navigation to plan page:
router.push(`/plan/${sessionId}`);
```

### Testing

**Unit Tests:**

- **Matching Logic**: Comprehensive tests for scoring, confidence, and combo generation
- **API Routes**: Unit tests for all API endpoints with mocked dependencies
- **Edge Cases**: Error handling, malformed data, and boundary conditions
- **Performance**: Tests for large datasets and scalability

**Test Commands:**

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test -- --coverage

# Run specific test file
npm test -- matching.test.ts
```

**Test Coverage:**

- ✅ Matching algorithm functions
- ✅ API route handlers
- ✅ Input validation
- ✅ Error handling
- ✅ Edge cases and boundary conditions

**Copy Plan Format:**

```
🎯 Group Plan: cozy-creative

👥 Participants: Alice, Bob, Charlie
📊 Confidence: 85%

📋 Suggestions:
1. Paint & Sip Night - Create art while enjoying drinks
2. DIY Craft Workshop - Learn new crafting techniques
3. Art Gallery Visit - Explore local contemporary art

🔗 View full details: https://vibedeck.app/sync/session-uuid

Generated by Vibe Deck
```

## Database Setup

1. **Create Supabase Project**
   - Go to [supabase.com](https://supabase.com)
   - Create a new project
   - Note your project URL and anon key

2. **Run Migration**
   - Copy the contents of `supabase/migrations/001_initial_schema.sql`
   - Paste into your Supabase SQL editor
   - Execute the migration

3. **Seed Data**
   - Run `npm run seed` to populate initial data
   - This adds 10 vibes and 6 recommendation combinations

## Deployment

1. **Build the application**

   ```bash
   npm run build
   ```

2. **Deploy to your preferred platform**
   - Vercel (recommended for Next.js)
   - Netlify
   - AWS
   - Or any Node.js hosting platform

3. **Set up production environment variables**
   - Configure your Supabase production database
   - Set up Upstash Redis for rate limiting
   - Update `NEXT_PUBLIC_BASE_URL` to your production domain

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## License

MIT License - see LICENSE file for details
