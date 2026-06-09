import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ImportReviewPage } from '../pages/ImportReviewPage';

vi.mock('../api/client', () => ({ api: { get: vi.fn(), post: vi.fn(), delete: vi.fn() } }));
import { api } from '../api/client';

function renderWithProviders(ui: React.ReactElement) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={qc}><BrowserRouter>{ui}</BrowserRouter></QueryClientProvider>);
}

describe('ImportReviewPage', () => {
  beforeEach(() => vi.clearAllMocks());

  it('shows loading state initially', () => {
    (api.get as any).mockReturnValue(new Promise(() => {}));
    renderWithProviders(<ImportReviewPage />);
    expect(screen.getByText(/loading drafts/i)).toBeDefined();
  });

  it('shows empty state when no drafts', async () => {
    (api.get as any).mockResolvedValue({ data: [] });
    renderWithProviders(<ImportReviewPage />);
    await waitFor(() => expect(screen.getByText(/no drafts to review/i)).toBeDefined());
  });

  it('shows draft stubs for review', async () => {
    (api.get as any).mockResolvedValue({ data: [{
      id: 'd1', importSource: 'wallet_apple', personalData: { seat: 'A1' },
      event: { type: 'concert', title: 'Review Concert', venueName: 'Venue', venueCity: 'City', eventDate: '2024-01-01T00:00:00Z' },
    }]});
    renderWithProviders(<ImportReviewPage />);
    await waitFor(() => expect(screen.getByText('Review Concert')).toBeDefined());
    expect(screen.getByText('✓ Publish')).toBeDefined();
    expect(screen.getByText('✕ Discard')).toBeDefined();
  });
});
