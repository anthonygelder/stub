import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ProfilePage } from '../pages/ProfilePage';

vi.mock('../api/client', () => ({
  api: {
    get: vi.fn(),
  },
}));

import { api } from '../api/client';

function renderWithProviders(ui: React.ReactElement) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <BrowserRouter>{ui}</BrowserRouter>
    </QueryClientProvider>,
  );
}

describe('ProfilePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows loading state initially', () => {
    (api.get as any).mockReturnValue(new Promise(() => {}));
    renderWithProviders(<ProfilePage />);
    expect(screen.getByText(/loading/i)).toBeDefined();
  });

  it('shows demo stubs when API is unreachable', async () => {
    (api.get as any).mockRejectedValue(new Error('Network Error'));
    renderWithProviders(<ProfilePage />);
    await waitFor(() => {
      expect(screen.getByText(/static preview/i)).toBeDefined();
    }, { timeout: 3000 });
  });

  it('shows empty state when API returns empty array', async () => {
    (api.get as any).mockResolvedValue({ data: [] });
    renderWithProviders(<ProfilePage />);
    await waitFor(() => {
      expect(screen.getByText(/no stubs yet/i)).toBeDefined();
    });
  });
});
