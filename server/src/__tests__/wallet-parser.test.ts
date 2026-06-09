import { describe, it, expect } from 'vitest';
import { detectPassType, parseApplePass, parseGooglePass, parsePass } from '../services/wallet-parser.service';

const APPLE_PASS = {
  passTypeIdentifier: "pass.com.ticketmaster.event",
  serialNumber: "abc123",
  relevantDate: "2024-08-15T19:00:00Z",
  eventTicket: {
    primaryFields: [
      { key: "event", label: "Event", value: "Taylor Swift Eras Tour" },
      { key: "venue", label: "Venue", value: "SoFi Stadium" }
    ],
    secondaryFields: [
      { key: "date", label: "Date", value: "August 15, 2024" },
      { key: "seat", label: "Seat", value: "Section 104, Row J, Seat 7" }
    ]
  }
};

const GOOGLE_FLIGHT = {
  classId: "flight",
  eventName: { defaultValue: { language: "en", value: "JFK → LHR" } },
  flightHeader: { carrier: { carrierIataCode: "DL" }, flightNumber: "1234" },
  origin: { airportIataCode: "JFK" },
  destination: { airportIataCode: "LHR" },
  startDate: "2024-07-04T10:00:00Z"
};

describe('detectPassType', () => {
  it('detects Apple pass', () => {
    expect(detectPassType(APPLE_PASS)).toBe('apple');
  });
  it('detects Google pass', () => {
    expect(detectPassType(GOOGLE_FLIGHT)).toBe('google');
  });
  it('returns null for unknown', () => {
    expect(detectPassType({ foo: 'bar' })).toBeNull();
  });
});

describe('parseApplePass', () => {
  it('parses concert pass', () => {
    const result = parseApplePass(APPLE_PASS);
    expect(result?.type).toBe('concert');
    expect(result?.title).toBe('Taylor Swift Eras Tour');
    expect(result?.venueName).toBe('SoFi Stadium');
    expect(result?.externalId).toBe('abc123');
    expect(result?.personalData?.seat).toBe('Section 104, Row J, Seat 7');
  });
});

describe('parseGooglePass', () => {
  it('parses flight pass', () => {
    const result = parseGooglePass(GOOGLE_FLIGHT);
    expect(result?.type).toBe('flight');
    expect(result?.title).toBe('JFK → LHR');
    expect(result?.metadata?.origin).toBe('JFK');
  });
});

describe('parsePass', () => {
  it('routes to correct parser', () => {
    const result = parsePass(APPLE_PASS);
    expect(result?.type).toBe('apple');
    expect(result?.item.title).toBe('Taylor Swift Eras Tour');
  });
});
