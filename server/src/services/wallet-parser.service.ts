export interface RawImportItem {
  type: string;
  title: string;
  venueName?: string;
  venueCity?: string;
  venueCountry?: string;
  eventDate: string;
  eventTime?: string;
  personalData?: Record<string, any>;
  externalSource?: string;
  externalId?: string;
  metadata?: Record<string, any>;
}

export function detectPassType(data: any): 'apple' | 'google' | null {
  if (data?.passTypeIdentifier) return 'apple';
  if (data?.classId || data?.eventName?.defaultValue) return 'google';
  return null;
}

export function parseApplePass(passData: any): RawImportItem | null {
  try {
    const primaryFields: Record<string, string> = {};
    const secondaryFields: Record<string, string> = {};

    if (passData.eventTicket) {
      for (const field of passData.eventTicket.primaryFields || []) {
        primaryFields[field.key] = field.value || field.label;
      }
      for (const field of passData.eventTicket.secondaryFields || []) {
        secondaryFields[field.key] = field.value || field.label;
      }
    }

    const title = primaryFields.event || secondaryFields.event || passData.description || 'Unknown Event';
    const venue = primaryFields.venue || secondaryFields.venue;
    const date = secondaryFields.date || passData.relevantDate;
    const seat = secondaryFields.seat || primaryFields.seat;

    // Guess type from passTypeIdentifier
    let type = 'custom';
    if (passData.passTypeIdentifier?.includes('concert') || passData.passTypeIdentifier?.includes('ticketmaster') || passData.passTypeIdentifier?.includes('event')) type = 'concert';
    if (passData.passTypeIdentifier?.includes('flight') || passData.passTypeIdentifier?.includes('boarding')) type = 'flight';
    if (passData.passTypeIdentifier?.includes('sport') || passData.passTypeIdentifier?.includes('mlb') || passData.passTypeIdentifier?.includes('nfl')) type = 'sports';

    return {
      type,
      title,
      venueName: venue ? String(venue) : undefined,
      eventDate: date ? new Date(date).toISOString() : new Date().toISOString(),
      personalData: seat ? { seat: String(seat) } : {},
      externalSource: 'apple_wallet',
      externalId: passData.serialNumber,
      metadata: { passTypeIdentifier: passData.passTypeIdentifier },
    };
  } catch { return null; }
}

export function parseGooglePass(passData: any): RawImportItem | null {
  try {
    const title = passData.eventName?.defaultValue?.value || passData.header?.defaultValue?.value || 'Unknown';
    
    let type = 'custom';
    if (passData.classId === 'flight' || passData.flightHeader) {
      type = 'flight';
      return {
        type: 'flight',
        title,
        eventDate: passData.startDate || new Date().toISOString(),
        personalData: passData.flightHeader
          ? { flight: `${passData.flightHeader.carrier?.carrierIataCode || ''}${passData.flightHeader.flightNumber || ''}` }
          : {},
        metadata: {
          origin: passData.origin?.airportIataCode,
          destination: passData.destination?.airportIataCode,
        },
        externalSource: 'google_wallet',
      };
    }

    if (passData.classId?.includes('event') || passData.classId?.includes('ticket')) {
      type = 'concert';
    }

    // Extract venue from locations
    const locations = passData.locations || passData.textModulesData || [];
    let venueName: string | undefined;
    for (const loc of locations) {
      if (loc.header === 'Venue' || loc.id === 'venue') venueName = loc.body || loc.localizedBody?.defaultValue?.value;
    }

    return {
      type,
      title,
      venueName,
      eventDate: passData.startDate || new Date().toISOString(),
      externalSource: 'google_wallet',
      metadata: { classId: passData.classId },
    };
  } catch { return null; }
}

export function parsePass(rawData: any): { type: 'apple' | 'google'; item: RawImportItem } | null {
  const passType = detectPassType(rawData);
  if (!passType) return null;

  const item = passType === 'apple' ? parseApplePass(rawData) : parseGooglePass(rawData);
  if (!item) return null;

  return { type: passType, item };
}
