/**
 * Geolocation & Realtime Clock Service
 * Detects accurate realtime time and geographic location of the user on signup and profile viewing.
 */

// Format current time into 12-hour format with AM/PM (e.g. "08:30 PM", "02:45 AM")
export function getFormattedRealtimeTime(date: Date = new Date(), timeZone?: string): string {
  try {
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      ...(timeZone ? { timeZone } : {}),
    }).format(date);
  } catch {
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  }
}

// Fallback mapping from common IANA timezones to City, Country
const TIMEZONE_TO_LOCATION: Record<string, string> = {
  'Asia/Kolkata': 'Kolkata, IN',
  'Asia/Calcutta': 'Kolkata, IN',
  'Asia/Delhi': 'Delhi, IN',
  'Asia/Mumbai': 'Mumbai, IN',
  'Asia/Bangalore': 'Bengaluru, IN',
  'Asia/Chennai': 'Chennai, IN',
  'Asia/Hyderabad': 'Hyderabad, IN',
  'Asia/Dubai': 'Dubai, AE',
  'Asia/Singapore': 'Singapore, SG',
  'Asia/Tokyo': 'Tokyo, JP',
  'Asia/Bangkok': 'Bangkok, TH',
  'Asia/Dhaka': 'Dhaka, BD',
  'Asia/Karachi': 'Karachi, PK',
  'Asia/Kathmandu': 'Kathmandu, NP',
  'Asia/Colombo': 'Colombo, LK',
  'Europe/London': 'London, UK',
  'Europe/Paris': 'Paris, FR',
  'Europe/Berlin': 'Berlin, DE',
  'Europe/Amsterdam': 'Amsterdam, NL',
  'America/New_York': 'New York, US',
  'America/Los_Angeles': 'Los Angeles, US',
  'America/Chicago': 'Chicago, US',
  'America/Denver': 'Denver, US',
  'America/Toronto': 'Toronto, CA',
  'America/Vancouver': 'Vancouver, CA',
  'Australia/Sydney': 'Sydney, AU',
  'Australia/Melbourne': 'Melbourne, AU',
};

export interface DetectedLocationResult {
  city: string;
  countryCode: string;
  locationString: string; // e.g. "Delhi, IN"
  fullBadge: string;      // e.g. "Delhi, IN • 08:30 PM"
  timezone: string;
}

/**
 * Detect accurate user location and realtime time.
 * Prioritizes high-accuracy browser geolocation -> IP geo fallback -> Intl Timezone mapping.
 */
export async function detectUserGeoLocation(): Promise<DetectedLocationResult> {
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata';
  const currentTimeStr = getFormattedRealtimeTime(new Date(), tz);

  // 1. Try Browser Geolocation API if available and user grants permission
  if (typeof window !== 'undefined' && 'geolocation' in navigator) {
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          timeout: 3000,
          maximumAge: 300000,
          enableHighAccuracy: false,
        });
      });

      const { latitude, longitude } = pos.coords;
      const res = await fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`,
        { signal: AbortSignal.timeout(2500) }
      );
      if (res.ok) {
        const data = await res.json();
        const city = data.city || data.locality || data.principalSubdivision || 'Delhi';
        const countryCode = data.countryCode || 'IN';
        const locationString = `${city}, ${countryCode}`;
        return {
          city,
          countryCode,
          locationString,
          fullBadge: `${locationString} • ${currentTimeStr}`,
          timezone: tz,
        };
      }
    } catch {
      // Permission denied or timed out; continue to IP/timezone fallback
    }
  }

  // 2. Try fast IP-based geolocation lookup
  try {
    const ipRes = await fetch('https://ipapi.co/json/', {
      signal: AbortSignal.timeout(2000),
    });
    if (ipRes.ok) {
      const ipData = await ipRes.json();
      if (ipData && ipData.city && ipData.country_code) {
        const city = ipData.city;
        const countryCode = ipData.country_code;
        const locationString = `${city}, ${countryCode}`;
        const actualTz = ipData.timezone || tz;
        const timeStr = getFormattedRealtimeTime(new Date(), actualTz);
        return {
          city,
          countryCode,
          locationString,
          fullBadge: `${locationString} • ${timeStr}`,
          timezone: actualTz,
        };
      }
    }
  } catch {
    // Network or service failure; fall back to browser timezone deduction
  }

  // 3. Standard client-side TimeZone deduction (100% reliable, zero network dependency)
  let derivedLocation = TIMEZONE_TO_LOCATION[tz];
  if (!derivedLocation) {
    const parts = tz.split('/');
    const city = parts[parts.length - 1]?.replace(/_/g, ' ') || 'Delhi';
    const region = parts[0] || 'IN';
    derivedLocation = `${city}, ${region.substring(0, 2).toUpperCase()}`;
  }

  const [cityPart, countryPart] = derivedLocation.split(', ');
  return {
    city: cityPart || 'Delhi',
    countryCode: countryPart || 'IN',
    locationString: derivedLocation,
    fullBadge: `${derivedLocation} • ${currentTimeStr}`,
    timezone: tz,
  };
}

/**
 * Extract just the fixed place name (e.g. "Delhi, IN") from any location string,
 * stripping any trailing timestamp or bullet separator, so the location remains strictly fixed for a user.
 */
export function extractPlaceName(rawLocation?: string, timeZone?: string): string {
  if (!rawLocation || !rawLocation.trim()) {
    const tz = timeZone || (typeof Intl !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().timeZone : 'Asia/Kolkata') || 'Asia/Kolkata';
    return TIMEZONE_TO_LOCATION[tz] || 'Delhi, IN';
  }
  const clean = rawLocation.trim();
  if (clean.includes('•')) {
    const placePart = clean.split('•')[0].trim();
    return placePart || 'Delhi, IN';
  }
  return clean;
}

/**
 * Re-format a location string with current realtime time.
 * If raw is "Delhi, IN • 02:45 AM", extracts "Delhi, IN" and attaches current live time.
 */
export function formatLocationWithCurrentTime(
  rawLocation?: string,
  timeZone?: string,
  customLiveTime?: string
): string {
  const place = extractPlaceName(rawLocation, timeZone);
  const currentLiveTime = customLiveTime || getFormattedRealtimeTime(new Date(), timeZone);
  return `${place} • ${currentLiveTime}`;
}
