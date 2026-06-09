import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { NewStubPage } from '../pages/NewStubPage';

function renderWithProviders(ui: React.ReactElement) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <BrowserRouter>{ui}</BrowserRouter>
    </QueryClientProvider>,
  );
}

describe('NewStubPage', () => {
  it('renders the new stub form', () => {
    renderWithProviders(<NewStubPage />);
    expect(screen.getByText(/log an experience/i)).toBeDefined();
    expect(screen.getByLabelText(/event type/i)).toBeDefined();
    expect(screen.getByLabelText(/title/i)).toBeDefined();
    expect(screen.getByLabelText(/date/i)).toBeDefined();
  });
});
