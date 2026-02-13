import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

// Mock Badge components
vi.mock('@/components/Badge', () => ({
  ConfidenceBadge: ({ confidence, className }: { confidence: number; className?: string }) => (
    <span data-testid="confidence-badge" data-confidence={confidence} className={className}>
      {confidence}%
    </span>
  ),
  Badge: ({ label, className }: { label: string; className?: string }) => (
    <span data-testid="badge" className={className}>
      {label}
    </span>
  ),
}));

// Mock currency/dates
vi.mock('@/lib/currency', () => ({
  formatCurrency: (amountAgora: number, currency: string) => `${currency} ${amountAgora / 100}`,
}));

vi.mock('@/lib/dates', () => ({
  relativeTime: () => 'Today',
}));

const { ReviewQueueItem } = await import('./ReviewQueueItem');

function makeTxn(overrides: Partial<{
  id: string;
  vendorName: string;
  amountAgora: number;
  currency: string;
  aiConfidence: number | null;
  sourceEmailRef: string | null;
}> = {}) {
  return {
    id: overrides.id ?? 'txn-1',
    vendorName: overrides.vendorName ?? 'Office Depot',
    amountAgora: overrides.amountAgora ?? 8200,
    currency: overrides.currency ?? 'ILS',
    date: new Date('2026-02-13'),
    category: 'DirectCost' as const,
    workOrderId: null,
    inventoryItemId: null,
    status: 'pending_review' as const,
    aiConfidence: 'aiConfidence' in overrides ? overrides.aiConfidence! : 85,
    originalFileUrl: null,
    source: 'ai' as const,
    sourceEmailRef: overrides.sourceEmailRef ?? null,
    notes: null,
    createdAt: new Date('2026-02-13'),
    updatedAt: new Date('2026-02-13'),
    suggestedWorkOrderId: null,
    suggestedInventoryItemId: null,
    classificationReasoning: null,
    isEstimatedConversion: false,
    conversionRate: null,
    conversionRateDate: null,
    conversionRateStale: false,
  };
}

describe('ReviewQueueItem', () => {
  it('renders vendor name, formatted amount, confidence, and date', () => {
    render(
      <ReviewQueueItem
        transaction={makeTxn({ vendorName: 'Fabric Co', amountAgora: 15000, currency: 'ILS' })}
        onSelect={vi.fn()}
      />,
    );

    expect(screen.getByText('Fabric Co')).toBeInTheDocument();
    expect(screen.getByText('ILS 150')).toBeInTheDocument();
    expect(screen.getByTestId('confidence-badge')).toBeInTheDocument();
    expect(screen.getByText('Today')).toBeInTheDocument();
  });

  it('calls onSelect with transaction id on click', () => {
    const onSelect = vi.fn();

    render(
      <ReviewQueueItem
        transaction={makeTxn({ id: 'click-test' })}
        onSelect={onSelect}
      />,
    );

    fireEvent.click(screen.getByRole('button'));
    expect(onSelect).toHaveBeenCalledWith('click-test');
  });

  it('renders with selected state', () => {
    const { container } = render(
      <ReviewQueueItem
        transaction={makeTxn()}
        selected={true}
        onSelect={vi.fn()}
      />,
    );

    const button = container.querySelector('button');
    expect(button?.getAttribute('aria-pressed')).toBe('true');
  });

  it('renders mailbox source badge when sourceEmailRef exists', () => {
    render(
      <ReviewQueueItem
        transaction={makeTxn({ sourceEmailRef: 'inbox@test.com' })}
        onSelect={vi.fn()}
      />,
    );

    expect(screen.getByTestId('badge')).toBeInTheDocument();
  });

  it('does not render mailbox badge when sourceEmailRef is null', () => {
    render(
      <ReviewQueueItem
        transaction={makeTxn({ sourceEmailRef: null })}
        onSelect={vi.fn()}
      />,
    );

    expect(screen.queryByTestId('badge')).not.toBeInTheDocument();
  });

  it('handles null aiConfidence gracefully', () => {
    render(
      <ReviewQueueItem
        transaction={makeTxn({ aiConfidence: null })}
        onSelect={vi.fn()}
      />,
    );

    const badge = screen.getByTestId('confidence-badge');
    expect(badge.dataset.confidence).toBe('0');
  });
});
