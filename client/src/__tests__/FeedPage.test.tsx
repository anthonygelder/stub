import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { FeedPage } from '../pages/FeedPage';

vi.mock('../api/client', () => ({ api: { get: vi.fn() } }));
import { api } from '../api/client';

function renderWithProviders(ui: React.ReactElement) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={qc}><BrowserRouter>{ui}</BrowserRouter></QueryClientProvider>);
}

describe('FeedPage', () => {
  it('shows empty state when no feed items', async () => {
    (api.get as any).mockResolvedValue({ data: [] });
    renderWithProviders(<FeedPage />);
    await waitFor(() => { expect(screen.getByText(/no stubs in your feed/i)).toBeDefined(); });
  });

  it('shows feed items from followed users', async () => {
    (api.get as any).mockResolvedValue({ data: [{
      id: 'stub-1', personalData: {}, createdAt: '2024-01-01T00:00:00Z',
      user: { id: 'u1', handle: 'testuser', displayName: 'Test User' },
      event: { id: 'e1', type: 'concert', title: 'Feed Event', eventDate: '2024-01-01T00:00:00Z' },
    }]});
    renderWithProviders(<FeedPage />);
    await waitFor(() => { expect(screen.getByText('Feed Event')).toBeDefined(); });
  });
});
