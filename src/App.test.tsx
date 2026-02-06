import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import App from './App';

describe('App', () => {
  it('renders the application title', () => {
    render(<App />);
    expect(screen.getByText('TP-FOS')).toBeInTheDocument();
  });

  it('renders the application description', () => {
    render(<App />);
    expect(
      screen.getByText('TailorPlayed Financial Operations System'),
    ).toBeInTheDocument();
  });
});
