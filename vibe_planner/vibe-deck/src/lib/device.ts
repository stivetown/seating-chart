'use client';

/**
 * Device fingerprinting utilities for preventing double voting
 */

const DEVICE_ID_KEY = 'vibe_device_id';

/**
 * Generates a UUID v4 string
 */
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Gets or creates a persistent device ID in localStorage
 * Falls back to session-based ID if localStorage is not available
 */
export function getDeviceId(): string {
  // Check if we're in a browser environment
  if (typeof window === 'undefined') {
    // Server-side: generate a temporary ID (should not be used for persistence)
    return `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  try {
    // Try to get existing device ID from localStorage
    let deviceId = localStorage.getItem(DEVICE_ID_KEY);

    if (!deviceId) {
      // Generate new device ID and store it
      deviceId = generateUUID();
      localStorage.setItem(DEVICE_ID_KEY, deviceId);
    }

    return deviceId;
  } catch (error) {
    // localStorage not available (private browsing, etc.)
    console.warn('localStorage not available, using session-based device ID');

    // Try to get from sessionStorage as fallback
    try {
      let sessionDeviceId = sessionStorage.getItem(DEVICE_ID_KEY);
      if (!sessionDeviceId) {
        sessionDeviceId = generateUUID();
        sessionStorage.setItem(DEVICE_ID_KEY, sessionDeviceId);
      }
      return sessionDeviceId;
    } catch (sessionError) {
      // Both localStorage and sessionStorage unavailable
      // Generate a temporary ID that will be different each time
      return `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
  }
}

/**
 * Gets the device fingerprint for API requests
 * This is a combination of device ID and some browser characteristics
 */
export function getDeviceFingerprint(): string {
  const deviceId = getDeviceId();

  // Add some browser characteristics for additional uniqueness
  const browserInfo =
    typeof window !== 'undefined'
      ? {
          userAgent: navigator.userAgent.substring(0, 50), // First 50 chars
          language: navigator.language,
          platform: navigator.platform,
          screen: `${screen.width}x${screen.height}`,
        }
      : {};

  // Create a simple hash of browser info
  const browserHash =
    typeof window !== 'undefined'
      ? btoa(JSON.stringify(browserInfo)).substring(0, 16)
      : 'server';

  return `${deviceId}-${browserHash}`;
}

/**
 * Clears the stored device ID (useful for testing or reset)
 */
export function clearDeviceId(): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.removeItem(DEVICE_ID_KEY);
    sessionStorage.removeItem(DEVICE_ID_KEY);
  } catch (error) {
    console.warn('Could not clear device ID:', error);
  }
}

/**
 * Checks if the current device ID is persistent (stored in localStorage)
 * Returns false if using session-based or temporary ID
 */
export function isDeviceIdPersistent(): boolean {
  if (typeof window === 'undefined') return false;

  try {
    return localStorage.getItem(DEVICE_ID_KEY) !== null;
  } catch (error) {
    return false;
  }
}

/**
 * Gets device information for debugging
 */
export function getDeviceInfo(): {
  deviceId: string;
  fingerprint: string;
  isPersistent: boolean;
  storageType: 'localStorage' | 'sessionStorage' | 'temporary';
} {
  const deviceId = getDeviceId();
  const fingerprint = getDeviceFingerprint();
  const isPersistent = isDeviceIdPersistent();

  let storageType: 'localStorage' | 'sessionStorage' | 'temporary' =
    'temporary';

  if (typeof window !== 'undefined') {
    try {
      if (localStorage.getItem(DEVICE_ID_KEY)) {
        storageType = 'localStorage';
      } else if (sessionStorage.getItem(DEVICE_ID_KEY)) {
        storageType = 'sessionStorage';
      }
    } catch (error) {
      storageType = 'temporary';
    }
  }

  return {
    deviceId,
    fingerprint,
    isPersistent,
    storageType,
  };
}
