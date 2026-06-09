import { describe, it, expect } from 'vitest';
import { parseEmail } from '../services/email-parser.service';

const TICKETMASTER_EMAIL = `From: customer-support@ticketmaster.com
Subject: Your Ticketmaster Order Confirmation

Event: Taylor Swift | The Eras Tour
Venue: SoFi Stadium, Inglewood, CA
Date: August 5, 2024 at 7:00 PM
Seat: Section 104, Row J, Seat 7
Order #: 12-34567/LAX
`;

const STUBHUB_EMAIL = `From: orders@stubhub.com
Subject: Your StubHub Order

You bought tickets to: Billie Eilish Tour
Where: Madison Square Garden
When: December 12, 2024
Section: Floor GA
Order #: SH-987654
`;

const DELTA_EMAIL = `From: confirmation@delta.com
Subject: Your Delta itinerary

Flight: DL1234
JFK → LHR
Date: July 4, 2024
Confirmation #: ABC123
`;

const MLB_EMAIL = `From: tickets@mlb.com
Subject: Your MLB Tickets

Matchup: Yankees vs Red Sox
at Yankee Stadium
When: May 15, 2024
`;

describe('parseEmail', () => {
  it('parses Ticketmaster confirmation', () => {
    const result = parseEmail(TICKETMASTER_EMAIL);
    expect(result).not.toBeNull();
    expect(result!.type).toBe('concert');
    expect(result!.title).toBe('Taylor Swift | The Eras Tour');
    expect(result!.venueName).toBe('SoFi Stadium, Inglewood, CA');
    expect(result!.personalData?.seat).toBe('Section 104, Row J, Seat 7');
    expect(result!.personalData?.orderNumber).toBe('12-34567/LAX');
    expect(result!.externalSource).toBe('email_ticketmaster');
  });

  it('parses StubHub confirmation', () => {
    const result = parseEmail(STUBHUB_EMAIL);
    expect(result).not.toBeNull();
    expect(result!.type).toBe('concert');
    expect(result!.title).toBe('Billie Eilish Tour');
    expect(result!.venueName).toBe('Madison Square Garden');
  });

  it('parses Delta flight', () => {
    const result = parseEmail(DELTA_EMAIL);
    expect(result).not.toBeNull();
    expect(result!.type).toBe('flight');
    expect(result!.title).toBe('JFK → LHR');
  });

  it('parses MLB tickets', () => {
    const result = parseEmail(MLB_EMAIL);
    expect(result).not.toBeNull();
    expect(result!.type).toBe('sports');
    expect(result!.title).toBe('Yankees vs Red Sox');
    expect(result!.venueName).toBe('Yankee Stadium');
  });

  it('returns null for unrecognized email', () => {
    const result = parseEmail('From: unknown@test.com\nSubject: Hello\n\nJust a regular email');
    expect(result).toBeNull();
  });
});
