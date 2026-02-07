import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

const { KpiCard } = await import('./KpiCard');

describe('KpiCard', () => {
  const defaultProps = {
    label: 'Tax Jar',
    value: '₪2,870.00',
  };

  it('renders label and value', () => {
    render(<KpiCard {...defaultProps} />);
    expect(screen.getByText('Tax Jar')).toBeInTheDocument();
    expect(screen.getByText('₪2,870.00')).toBeInTheDocument();
  });

  it('renders subtitle when provided', () => {
    render(<KpiCard {...defaultProps} subtitle="set aside from net profit" />);
    expect(screen.getByText('set aside from net profit')).toBeInTheDocument();
  });

  it('renders positive delta badge', () => {
    render(
      <KpiCard
        {...defaultProps}
        delta={{ value: 12, type: 'positive' }}
      />,
    );
    expect(screen.getByText(/12%/)).toBeInTheDocument();
  });

  it('renders negative delta badge', () => {
    render(
      <KpiCard
        {...defaultProps}
        delta={{ value: 8, type: 'negative' }}
      />,
    );
    expect(screen.getByText(/8%/)).toBeInTheDocument();
  });

  it('does not render delta when null', () => {
    render(<KpiCard {...defaultProps} delta={null} />);
    expect(screen.queryByText(/%/)).not.toBeInTheDocument();
  });

  it('renders icon when provided', () => {
    render(
      <KpiCard {...defaultProps} icon={<svg data-testid="test-icon" />} />,
    );
    expect(screen.getByTestId('test-icon')).toBeInTheDocument();
  });

  it('handles click events when onClick provided', () => {
    const onClick = vi.fn();
    render(<KpiCard {...defaultProps} onClick={onClick} />);
    const card = screen.getByRole('button');
    fireEvent.click(card);
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('handles keyboard activation with Enter', () => {
    const onClick = vi.fn();
    render(<KpiCard {...defaultProps} onClick={onClick} />);
    const card = screen.getByRole('button');
    fireEvent.keyDown(card, { key: 'Enter' });
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('handles keyboard activation with Space', () => {
    const onClick = vi.fn();
    render(<KpiCard {...defaultProps} onClick={onClick} />);
    const card = screen.getByRole('button');
    fireEvent.keyDown(card, { key: ' ' });
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('applies aria-label to clickable card', () => {
    const onClick = vi.fn();
    render(<KpiCard {...defaultProps} onClick={onClick} ariaLabel="View details" />);
    const card = screen.getByRole('button', { name: 'View details' });
    expect(card).toBeInTheDocument();
  });

  it('does not have button role when not clickable', () => {
    render(<KpiCard {...defaultProps} />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('renders skeleton when loading', () => {
    render(<KpiCard {...defaultProps} loading={true} />);
    expect(screen.getByTestId('kpi-card-skeleton')).toBeInTheDocument();
    expect(screen.queryByText('Tax Jar')).not.toBeInTheDocument();
  });

  it('does not render skeleton when not loading', () => {
    render(<KpiCard {...defaultProps} loading={false} />);
    expect(screen.queryByTestId('kpi-card-skeleton')).not.toBeInTheDocument();
    expect(screen.getByText('Tax Jar')).toBeInTheDocument();
  });
});
