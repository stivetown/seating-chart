/**
 * Calendar integration utilities
 * Generates .ics files and calendar links for various providers
 */

export interface CalendarEvent {
  title: string;
  description: string;
  location?: string;
  start: Date;
  end: Date;
  url?: string;
}

/**
 * Generate .ics file content (RFC 5545 format)
 */
export function generateICS(event: CalendarEvent): string {
  const formatDate = (date: Date): string => {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };

  const escape = (text: string): string => {
    return text
      .replace(/\\/g, '\\\\')
      .replace(/;/g, '\\;')
      .replace(/,/g, '\\,')
      .replace(/\n/g, '\\n');
  };

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Vibe Deck//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${Date.now()}-${Math.random().toString(36).substring(7)}@vibe-deck`,
    `DTSTAMP:${formatDate(new Date())}`,
    `DTSTART:${formatDate(event.start)}`,
    `DTEND:${formatDate(event.end)}`,
    `SUMMARY:${escape(event.title)}`,
    `DESCRIPTION:${escape(event.description)}`,
    ...(event.location ? [`LOCATION:${escape(event.location)}`] : []),
    ...(event.url ? [`URL:${event.url}`] : []),
    'END:VEVENT',
    'END:VCALENDAR',
  ];

  return lines.join('\r\n');
}

/**
 * Download .ics file
 */
export function downloadICS(event: CalendarEvent, filename: string = 'vibe-deck-event.ics'): void {
  const content = generateICS(event);
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Generate Google Calendar URL
 */
export function generateGoogleCalendarUrl(event: CalendarEvent): string {
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    dates: `${formatGoogleDate(event.start)}/${formatGoogleDate(event.end)}`,
    details: event.description,
    ...(event.location && { location: event.location }),
    ...(event.url && { sprop: `website:${event.url}` }),
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/**
 * Generate Outlook Calendar URL
 */
export function generateOutlookCalendarUrl(event: CalendarEvent): string {
  const params = new URLSearchParams({
    subject: event.title,
    startdt: event.start.toISOString(),
    enddt: event.end.toISOString(),
    body: event.description,
    ...(event.location && { location: event.location }),
  });

  return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`;
}

/**
 * Generate Yahoo Calendar URL
 */
export function generateYahooCalendarUrl(event: CalendarEvent): string {
  const params = new URLSearchParams({
    v: '60',
    view: 'd',
    type: '20',
    title: event.title,
    st: formatYahooDate(event.start),
    dur: formatDuration(event.start, event.end),
    desc: event.description,
    ...(event.location && { in_loc: event.location }),
  });

  return `https://calendar.yahoo.com/?${params.toString()}`;
}

/**
 * Format date for Google Calendar (YYYYMMDDTHHmmssZ)
 */
function formatGoogleDate(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}

/**
 * Format date for Yahoo Calendar (YYYYMMDDTHHmmss)
 */
function formatYahooDate(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  const hours = String(date.getUTCHours()).padStart(2, '0');
  const minutes = String(date.getUTCMinutes()).padStart(2, '0');
  const seconds = String(date.getUTCSeconds()).padStart(2, '0');
  return `${year}${month}${day}T${hours}${minutes}${seconds}`;
}

/**
 * Format duration for Yahoo Calendar (HHMM)
 */
function formatDuration(start: Date, end: Date): string {
  const durationMs = end.getTime() - start.getTime();
  const hours = Math.floor(durationMs / (1000 * 60 * 60));
  const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
  return `${String(hours).padStart(2, '0')}${String(minutes).padStart(2, '0')}`;
}

/**
 * Parse time string like "6:00 PM - 11:00 PM" or "Tomorrow" to Date objects
 */
export function parseTimeChip(
  chip: { label: string; time: string },
  baseDate: Date = new Date()
): { start: Date; end: Date } | null {
  const now = new Date(baseDate);
  let startDate = new Date(now);
  let endDate = new Date(now);

  // Handle "Tonight"
  if (chip.label === 'Tonight') {
    startDate.setHours(18, 0, 0, 0); // 6:00 PM
    endDate.setHours(23, 0, 0, 0); // 11:00 PM
    // If it's already past 6 PM today, use tomorrow
    if (now.getHours() >= 18) {
      startDate.setDate(startDate.getDate() + 1);
      endDate.setDate(endDate.getDate() + 1);
    }
    return { start: startDate, end: endDate };
  }

  // Handle "Tomorrow"
  if (chip.label === 'Tomorrow') {
    startDate.setDate(startDate.getDate() + 1);
    startDate.setHours(18, 0, 0, 0); // Default to 6:00 PM
    endDate.setDate(endDate.getDate() + 1);
    endDate.setHours(22, 0, 0, 0); // Default to 10:00 PM
    return { start: startDate, end: endDate };
  }

  // Handle "This Weekend" - default to Saturday
  if (chip.label === 'This Weekend') {
    const daysUntilSaturday = (6 - now.getDay()) % 7;
    const daysToAdd = daysUntilSaturday === 0 ? 7 : daysUntilSaturday;
    startDate.setDate(now.getDate() + daysToAdd);
    startDate.setHours(14, 0, 0, 0); // 2:00 PM Saturday
    endDate.setDate(now.getDate() + daysToAdd);
    endDate.setHours(18, 0, 0, 0); // 6:00 PM Saturday
    return { start: startDate, end: endDate };
  }

  // Try to parse time string like "6:00 PM - 11:00 PM"
  const timeMatch = chip.time.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/g);
  if (timeMatch && timeMatch.length >= 2) {
    const startTime = parseTimeString(timeMatch[0]);
    const endTime = parseTimeString(timeMatch[1]);
    
    if (startTime && endTime) {
      startDate.setHours(startTime.hours, startTime.minutes, 0, 0);
      endDate.setHours(endTime.hours, endTime.minutes, 0, 0);
      
      // If label suggests it's tomorrow, add a day
      if (chip.label.toLowerCase().includes('tomorrow')) {
        startDate.setDate(startDate.getDate() + 1);
        endDate.setDate(endDate.getDate() + 1);
      }
      
      return { start: startDate, end: endDate };
    }
  }

  return null;
}

/**
 * Parse time string like "6:00 PM" to hours and minutes
 */
function parseTimeString(timeStr: string): { hours: number; minutes: number } | null {
  const match = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (!match) return null;

  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const period = match[3].toUpperCase();

  if (period === 'PM' && hours !== 12) {
    hours += 12;
  } else if (period === 'AM' && hours === 12) {
    hours = 0;
  }

  return { hours, minutes };
}

