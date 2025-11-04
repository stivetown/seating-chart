'use client';

export interface ShareCardData {
  sessionId: string;
  groupVibeKey: string;
  participants: Array<{ name: string }>;
  suggestions: Array<{ title: string }>;
}

export interface ShareCardOptions {
  onProgress?: (progress: number) => void;
  onError?: (error: string) => void;
  onSuccess?: () => void;
}

/**
 * Downloads a share card as a PNG file
 */
export async function downloadShareCard(
  data: ShareCardData,
  options: ShareCardOptions = {}
): Promise<void> {
  const { onProgress, onError, onSuccess } = options;

  try {
    onProgress?.(10);

    // Validate input data
    if (
      !data.sessionId ||
      !data.groupVibeKey ||
      !data.participants?.length ||
      !data.suggestions?.length
    ) {
      throw new Error('Invalid share card data provided');
    }

    onProgress?.(20);

    // Call the API endpoint
    const response = await fetch('/api/share-card', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    onProgress?.(50);

    if (!response.ok) {
      const errorData = await response
        .json()
        .catch(() => ({ error: 'Unknown error' }));
      throw new Error(
        errorData.error ||
          `HTTP ${response.status}: Failed to generate share card`
      );
    }

    onProgress?.(70);

    // Get the image blob
    const blob = await response.blob();

    // Verify it's a PNG
    if (blob.type !== 'image/png') {
      throw new Error('Invalid image format received');
    }

    onProgress?.(90);

    // Create download link
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `vibe-deck-${data.groupVibeKey}-${Date.now()}.png`;

    // Trigger download
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Clean up
    URL.revokeObjectURL(url);

    onProgress?.(100);
    onSuccess?.();
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to download share card';
    console.error('Share card download error:', error);
    onError?.(errorMessage);
    throw error;
  }
}

/**
 * Generates a share card and returns the blob URL (for preview)
 */
export async function generateShareCardBlob(
  data: ShareCardData,
  options: ShareCardOptions = {}
): Promise<string> {
  const { onProgress, onError } = options;

  try {
    onProgress?.(10);

    // Validate input data
    if (
      !data.sessionId ||
      !data.groupVibeKey ||
      !data.participants?.length ||
      !data.suggestions?.length
    ) {
      throw new Error('Invalid share card data provided');
    }

    onProgress?.(20);

    // Call the API endpoint
    const response = await fetch('/api/share-card', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    onProgress?.(50);

    if (!response.ok) {
      const errorData = await response
        .json()
        .catch(() => ({ error: 'Unknown error' }));
      throw new Error(
        errorData.error ||
          `HTTP ${response.status}: Failed to generate share card`
      );
    }

    onProgress?.(70);

    // Get the image blob
    const blob = await response.blob();

    // Verify it's a PNG
    if (blob.type !== 'image/png') {
      throw new Error('Invalid image format received');
    }

    onProgress?.(90);

    // Create and return blob URL
    const url = URL.createObjectURL(blob);

    onProgress?.(100);
    return url;
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to generate share card';
    console.error('Share card generation error:', error);
    onError?.(errorMessage);
    throw error;
  }
}

/**
 * Formats participant names for display
 */
export function formatParticipantNames(
  participants: Array<{ name: string }>
): string {
  if (participants.length === 0) return '';
  if (participants.length === 1) return participants[0].name;
  if (participants.length === 2)
    return `${participants[0].name} and ${participants[1].name}`;
  if (participants.length === 3)
    return `${participants[0].name}, ${participants[1].name}, and ${participants[2].name}`;

  // For 4+ participants, show first names and count
  const firstNames = participants.slice(0, 2).map((p) => p.name);
  const remaining = participants.length - 2;
  return `${firstNames.join(', ')} and ${remaining} other${remaining === 1 ? '' : 's'}`;
}

/**
 * Formats suggestions for display
 */
export function formatSuggestions(
  suggestions: Array<{ title: string }>,
  maxCount: number = 3
): string[] {
  return suggestions.slice(0, maxCount).map((s) => s.title);
}
