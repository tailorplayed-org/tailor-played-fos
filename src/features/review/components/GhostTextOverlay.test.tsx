import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

// Mock phosphor icons
vi.mock('@phosphor-icons/react', () => ({
  FileText: ({ className }: { size?: number; className?: string }) => (
    <svg data-testid="icon-FileText" className={className} />
  ),
}));

// Mock useWorkOrderStore
vi.mock('@/stores', () => ({
  useWorkOrderStore: (selector: (state: unknown) => unknown) =>
    selector({
      workOrders: [{ id: 'wo-1', name: 'Test Project' }],
    }),
  selectWorkOrderById: () => () => ({ name: 'Test Project' }),
}));

// Mock currency and dates
vi.mock('@/lib/currency', () => ({
  formatCurrency: (amount: number, currency: string) => `${currency} ${amount}`,
}));

vi.mock('@/lib/dates', () => ({
  relativeTime: () => 'Today',
}));

// Mock Badge
vi.mock('@/components/Badge', () => ({
  Badge: ({ label }: { label: string }) => <span data-testid="badge">{label}</span>,
}));

// Mock Button with focusable button element
vi.mock('@/components/Button', () => ({
  Button: ({
    children,
    variant,
    onClick,
  }: {
    children: React.ReactNode;
    variant?: string;
    onClick?: () => void;
  }) => (
    <button data-testid={`btn-${variant}`} onClick={onClick}>
      {children}
    </button>
  ),
}));

import type { Transaction } from '@/types';
import { GhostTextOverlay } from './GhostTextOverlay';

function createMockTransaction(overrides?: Partial<Transaction>): Transaction {
  return {
    id: 'txn-1',
    vendorName: 'Test Vendor',
    amountAgora: 8250,
    currency: 'ILS',
    date: new Date('2026-02-13'),
    category: 'DirectCost',
    workOrderId: null,
    inventoryItemId: null,
    status: 'pending_review',
    aiConfidence: 92,
    originalFileUrl: null,
    source: 'ai',
    sourceEmailRef: null,
    notes: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    suggestedWorkOrderId: 'wo-1',
    suggestedInventoryItemId: null,
    classificationReasoning: 'AI reasoning text',
    isEstimatedConversion: false,
    conversionRate: null,
    conversionRateDate: null,
    conversionRateStale: false,
    ...overrides,
  };
}

const defaultProps = {
  transaction: createMockTransaction(),
  onConfirm: vi.fn(),
  onEdit: vi.fn(),
  onReject: vi.fn(),
  onClose: vi.fn(),
};

describe('GhostTextOverlay', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders overlay with backdrop', () => {
    render(<GhostTextOverlay {...defaultProps} />);

    expect(screen.getByTestId('ghost-text-overlay')).toBeInTheDocument();
  });

  it('renders the GhostTextCard inside the overlay', () => {
    render(<GhostTextOverlay {...defaultProps} />);

    // Card content should be visible
    expect(screen.getByText('Test Vendor')).toBeInTheDocument();
  });

  it('closes when overlay background is clicked', () => {
    const onClose = vi.fn();
    render(<GhostTextOverlay {...defaultProps} onClose={onClose} />);

    fireEvent.click(screen.getByTestId('ghost-text-overlay'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does NOT close when card content is clicked', () => {
    const onClose = vi.fn();
    render(<GhostTextOverlay {...defaultProps} onClose={onClose} />);

    // Click on a card element — should not trigger onClose
    fireEvent.click(screen.getByText('Test Vendor'));
    expect(onClose).not.toHaveBeenCalled();
  });

  it('renders via portal at document.body', () => {
    render(<GhostTextOverlay {...defaultProps} />);

    const overlay = screen.getByTestId('ghost-text-overlay');
    expect(overlay.parentElement).toBe(document.body);
  });

  it('traps focus within the card (Tab wraps from last to first)', () => {
    render(<GhostTextOverlay {...defaultProps} />);

    const buttons = screen.getAllByRole('button');
    const lastButton = buttons[buttons.length - 1];

    // Focus the last button
    lastButton.focus();
    expect(document.activeElement).toBe(lastButton);

    // Press Tab on the last button — should cycle to first
    fireEvent.keyDown(document, { key: 'Tab', bubbles: true });
    expect(document.activeElement).toBe(buttons[0]);
  });

  it('traps focus within the card (Shift+Tab wraps from first to last)', () => {
    render(<GhostTextOverlay {...defaultProps} />);

    const buttons = screen.getAllByRole('button');
    const firstButton = buttons[0];
    const lastButton = buttons[buttons.length - 1];

    // Focus the first button
    firstButton.focus();
    expect(document.activeElement).toBe(firstButton);

    // Press Shift+Tab on the first button — should cycle to last
    fireEvent.keyDown(document, { key: 'Tab', shiftKey: true, bubbles: true });
    expect(document.activeElement).toBe(lastButton);
  });

  it('auto-focuses the first focusable element on open', () => {
    render(<GhostTextOverlay {...defaultProps} />);

    const buttons = screen.getAllByRole('button');
    expect(document.activeElement).toBe(buttons[0]);
  });
});
