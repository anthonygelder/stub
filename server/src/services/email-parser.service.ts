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

interface SenderTemplate {
  domain: string;
  extract: (body: string, subject: string) => RawImportItem | null;
}

const monthMap: Record<string, string> = {
  january: '01', february: '02', march: '03', april: '04', may: '05', june: '06',
  july: '07', august: '08', september: '09', october: '10', november: '11', december: '12',
  jan: '01', feb: '02', mar: '03', apr: '04', jun: '06',
  jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12',
};

function parseDate(text: string): string | null {
  // Try: "August 5, 2024" or "Aug 5, 2024" or "5 August 2024"
  const match = text.match(/(\w+)\s+(\d{1,2}),?\s*(\d{4})/);
  if (match) {
    const month = monthMap[match[1].toLowerCase()];
    if (month) return `${match[3]}-${month}-${match[2].padStart(2, '0')}T00:00:00Z`;
  }
  const match2 = text.match(/(\d{1,2})\s+(\w+)\s+(\d{4})/);
  if (match2) {
    const month = monthMap[match2[2].toLowerCase()];
    if (month) return `${match2[3]}-${month}-${match2[1].padStart(2, '0')}T00:00:00Z`;
  }
  return null;
}

const TEMPLATES: SenderTemplate[] = [
  {
    domain: 'ticketmaster.com',
    extract: (body) => {
      const eventMatch = body.match(/Event:\s*(.+)/i);
      const venueMatch = body.match(/Venue:\s*(.+)/i);
      const dateMatch = body.match(/Date:\s*(.+)/i);
      const timeMatch = body.match(/Time:\s*(.+)/i);
      const seatMatch = body.match(/Seat:\s*(.+)/i) || body.match(/Seats?:\s*(.+)/i);
      const orderMatch = body.match(/Order\s*#?:\s*([\w-/]+)/i);

      if (!eventMatch) return null;

      return {
        type: 'concert',
        title: eventMatch[1].trim(),
        venueName: venueMatch?.[1]?.trim(),
        eventDate: parseDate(dateMatch?.[1] || '') || new Date().toISOString(),
        eventTime: timeMatch?.[1]?.trim(),
        personalData: { seat: seatMatch?.[1]?.trim(), orderNumber: orderMatch?.[1]?.trim() },
        externalSource: 'email_ticketmaster',
        externalId: orderMatch?.[1]?.trim(),
        metadata: { sender: 'ticketmaster.com' },
      };
    },
  },
  {
    domain: 'stubhub.com',
    extract: (body) => {
      const eventMatch = body.match(/Event:\s*(.+)/i) || body.match(/You bought tickets to:\s*(.+)/i);
      const venueMatch = body.match(/Venue:\s*(.+)/i) || body.match(/Where:\s*(.+)/i);
      const dateMatch = body.match(/Date:\s*(.+)/i) || body.match(/When:\s*(.+)/i);
      const seatMatch = body.match(/Seats?:\s*(.+)/i) || body.match(/Section:\s*(.+)/i);
      const orderMatch = body.match(/Order\s*#?:\s*([\w-]+)/i);

      if (!eventMatch) return null;

      return {
        type: 'concert',
        title: eventMatch[1].trim(),
        venueName: venueMatch?.[1]?.trim(),
        eventDate: parseDate(dateMatch?.[1] || '') || new Date().toISOString(),
        personalData: { seat: seatMatch?.[1]?.trim() },
        externalSource: 'email_stubhub',
        externalId: orderMatch?.[1]?.trim(),
        metadata: { sender: 'stubhub.com' },
      };
    },
  },
  {
    domain: 'delta.com',
    extract: (body, subject) => {
      const routeMatch = body.match(/([A-Z]{3})\s*(?:→|to|-)\s*([A-Z]{3})/i);
      const flightMatch = body.match(/Flight\s*(?:#|Number?)\s*:?\s*([A-Z]{0,2}\d+)/i);
      const dateMatch = body.match(/Date:\s*(.+)/i) || body.match(/Depart(?:ure)?:\s*(.+)/i);
      const confirmMatch = body.match(/Confirmation\s*(?:#|Number?)\s*:?\s*([\w]+)/i);

      return {
        type: 'flight',
        title: routeMatch ? `${routeMatch[1].toUpperCase()} → ${routeMatch[2].toUpperCase()}` : (subject || 'Flight'),
        eventDate: parseDate(dateMatch?.[1] || '') || new Date().toISOString(),
        personalData: { flightNumber: flightMatch?.[1]?.trim() },
        externalSource: 'email_delta',
        externalId: confirmMatch?.[1]?.trim(),
        metadata: { sender: 'delta.com', route: routeMatch ? `${routeMatch[1]}-${routeMatch[2]}` : undefined },
      };
    },
  },
  {
    domain: 'mlb.com',
    extract: (body) => {
      const teamsMatch = body.match(/([A-Za-z. ]+?)\s+(?:vs\.?|\bat\b|@)\s+([A-Za-z. ]+)/i) ||
                         body.match(/Matchup:\s*([A-Za-z. ]+?)\s+(?:vs\.?|\bat\b|@)\s+([A-Za-z. ]+)/i);
      const venueMatch = body.match(/(?:\bat\b|@|Venue:)\s*(.+?)(?:,|\n|$)/i);
      const dateMatch = body.match(/Date:\s*(.+)/i) || body.match(/(?:Game|When):\s*(.+)/i);

      if (!teamsMatch) return null;

      return {
        type: 'sports',
        title: teamsMatch[1].trim() + ' vs ' + teamsMatch[2].trim(),
        venueName: venueMatch?.[1]?.trim(),
        eventDate: parseDate(dateMatch?.[1] || '') || new Date().toISOString(),
        externalSource: 'email_mlb',
        metadata: { sender: 'mlb.com' },
      };
    },
  },
];

export function parseEmail(rawEmail: string): RawImportItem | null {
  // Extract subject and body
  const parts = rawEmail.split('\n');
  let subject = '';
  let from = '';
  const bodyLines: string[] = [];
  let inHeaders = true;

  for (const line of parts) {
    if (inHeaders) {
      if (line === '' || line === '\r') { inHeaders = false; continue; }
      if (line.toLowerCase().startsWith('subject:')) subject = line.slice(8).trim();
      if (line.toLowerCase().startsWith('from:')) from = line.slice(5).trim();
    } else {
      bodyLines.push(line);
    }
  }

  const body = bodyLines.join('\n');

  // Try each template
  for (const template of TEMPLATES) {
    if (from.toLowerCase().includes(template.domain)) {
      const result = template.extract(body, subject);
      if (result) return result;
    }
  }

  // Generic fallback: try to find event-like patterns
  const eventMatch = body.match(/Event:\s*(.+)/i) || body.match(/You (?:have|got) tickets to:\s*(.+)/i);
  if (eventMatch) {
    const dateMatch = body.match(/Date:\s*(.+)/i);
    return {
      type: 'custom',
      title: eventMatch[1].trim(),
      eventDate: parseDate(dateMatch?.[1] || '') || new Date().toISOString(),
      externalSource: 'email_unknown',
      metadata: { sender: from },
    };
  }

  return null;
}
