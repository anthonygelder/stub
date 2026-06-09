import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RegisterPage } from '../pages/RegisterPage';

function renderWithProviders(ui: React.ReactElement) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <BrowserRouter>{ui}</BrowserRouter>
    </QueryClientProvider>,
  );
}

describe('RegisterPage', () => {
  it('renders register form', () => {
    renderWithProviders(<RegisterPage />);
    expect(screen.getByLabelText(/display name/i)).toBeDefined();
    expect(screen.getByLabelText(/handle/i)).toBeDefined();
    expect(screen.getByLabelText(/email/i)).toBeDefined();
    expect(screen.getByRole('button', { name: /create account/i })).toBeDefined();
  });

  it('has link to login page', () => {
    renderWithProviders(<RegisterPage />);
    expect(screen.getByText(/log in/i)).toBeDefined();
  });
});
