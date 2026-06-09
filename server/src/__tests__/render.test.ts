import { describe, it, expect } from 'vitest';
import fs from 'fs';
import { renderStub, renderAndSaveStub, renderOGImage } from '../services/render.service';

const testData = {
  eventTitle: 'Test Concert',
  eventType: 'concert',
  venueName: 'Test Venue',
  venueCity: 'Test City',
  eventDate: '2024-08-15T00:00:00Z',
  seat: 'Section 104',
  companions: 'with friends',
  userName: 'Test User',
  userHandle: 'testuser',
  stubNumber: 42,
};

describe('renderStub', () => {
  it('should render a PNG buffer', async () => {
    const buffer = await renderStub(testData);
    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(1000);
    // Should be a valid PNG
    expect(buffer[0]).toBe(0x89);
    expect(buffer[1]).toBe(0x50); // P
  });

  it('should render with specific template', async () => {
    const buffer = await renderStub({ ...testData, eventType: 'flight' }, 'flight');
    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(1000);
  });
});

describe('renderAndSaveStub', () => {
  it('should save PNG to disk', async () => {
    const filePath = await renderAndSaveStub('test-stub-id', testData);
    expect(fs.existsSync(filePath)).toBe(true);
    const stat = fs.statSync(filePath);
    expect(stat.size).toBeGreaterThan(1000);
    fs.unlinkSync(filePath); // cleanup
  });
});

describe('renderOGImage', () => {
  it('should render OG-sized image', async () => {
    const buffer = await renderOGImage(testData);
    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(1000);
  });
});
