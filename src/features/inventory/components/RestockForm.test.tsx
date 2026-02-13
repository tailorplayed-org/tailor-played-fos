import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import type { InventoryItem } from '@/types';

// Mock Phosphor icons — include all icons used transitively
vi.mock('@phosphor-icons/react', () => {
  const iconStub = (name: string) =>
    function MockIcon({ className }: { size?: number; className?: string; weight?: string }) {
      return <svg data-testid={`icon-${name}`} className={className} />;
    };

  return {
    Package: iconStub('Package'),
    Plus: iconStub('Plus'),
    PencilSimple: iconStub('PencilSimple'),
    ArrowUp: iconStub('ArrowUp'),
    ArrowDown: iconStub('ArrowDown'),
    ArrowCounterClockwise: iconStub('ArrowCounterClockwise'),
    // Toast
    CheckCircle: iconStub('CheckCircle'),
    XCircle: iconStub('XCircle'),
    Warning: iconStub('Warning'),
    Info: iconStub('Info'),
    X: iconStub('X'),
    // Layout
    Bell: iconStub('Bell'),
    ChartBar: iconStub('ChartBar'),
    ClipboardText: iconStub('ClipboardText'),
    GearSix: iconStub('GearSix'),
    Tray: iconStub('Tray'),
    // SearchInput
    MagnifyingGlass: iconStub('MagnifyingGlass'),
  };
});

const { RestockForm } = await import('./RestockForm');

const makeItem = (overrides: Partial<InventoryItem> = {}): InventoryItem => ({
  id: 'item-1',
  name: 'Cardboard',
  sku: 'CBR-001',
  supplier: 'PaperInc',
  currentQty: 100,
  wacAgora: 350,
  reorderThreshold: 10,
  unit: 'sheets',
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-15'),
  ...overrides,
});

const items: InventoryItem[] = [
  makeItem({ id: 'item-1', name: 'Cardboard' }),
  makeItem({ id: 'item-2', name: 'Fabric' }),
  makeItem({ id: 'item-3', name: 'Thread' }),
];

describe('RestockForm', () => {
  const mockSubmit = vi.fn().mockResolvedValue(undefined);
  const mockCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders form title', () => {
    render(
      <RestockForm
        inventoryItems={items}
        onSubmit={mockSubmit}
        onCancel={mockCancel}
      />,
    );
    expect(screen.getByText('inventory.restock.title')).toBeInTheDocument();
  });

  it('renders material select when no item pre-selected', () => {
    render(
      <RestockForm
        inventoryItems={items}
        onSubmit={mockSubmit}
        onCancel={mockCancel}
      />,
    );
    expect(screen.getByText('inventory.restock.material')).toBeInTheDocument();
  });

  it('shows pre-selected item name when item prop provided', () => {
    render(
      <RestockForm
        item={items[0]}
        inventoryItems={items}
        onSubmit={mockSubmit}
        onCancel={mockCancel}
      />,
    );
    expect(screen.getByText('Cardboard')).toBeInTheDocument();
  });

  it('renders quantity and total cost inputs', () => {
    render(
      <RestockForm
        inventoryItems={items}
        onSubmit={mockSubmit}
        onCancel={mockCancel}
      />,
    );
    expect(screen.getByLabelText('inventory.restock.quantity')).toBeInTheDocument();
    expect(screen.getByLabelText('inventory.restock.totalCost')).toBeInTheDocument();
  });

  it('renders unit cost preview', () => {
    render(
      <RestockForm
        inventoryItems={items}
        onSubmit={mockSubmit}
        onCancel={mockCancel}
      />,
    );
    expect(screen.getByText('inventory.restock.unitCost')).toBeInTheDocument();
    // Initial preview should be dash (zero qty)
    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('renders submit and cancel buttons', () => {
    render(
      <RestockForm
        inventoryItems={items}
        onSubmit={mockSubmit}
        onCancel={mockCancel}
      />,
    );
    expect(screen.getByText('inventory.restock.submit')).toBeInTheDocument();
    expect(screen.getByText('inventory.restock.cancel')).toBeInTheDocument();
  });

  it('calls onCancel when cancel button clicked', () => {
    render(
      <RestockForm
        inventoryItems={items}
        onSubmit={mockSubmit}
        onCancel={mockCancel}
      />,
    );
    fireEvent.click(screen.getByText('inventory.restock.cancel'));
    expect(mockCancel).toHaveBeenCalledTimes(1);
  });

  it('submits form with valid data when item is pre-selected', async () => {
    render(
      <RestockForm
        item={items[0]}
        inventoryItems={items}
        onSubmit={mockSubmit}
        onCancel={mockCancel}
      />,
    );

    const qtyInput = screen.getByLabelText('inventory.restock.quantity');
    fireEvent.change(qtyInput, { target: { value: '50' } });

    const costInput = screen.getByLabelText('inventory.restock.totalCost');
    fireEvent.change(costInput, { target: { value: '125.00' } });

    fireEvent.click(screen.getByText('inventory.restock.submit'));

    await waitFor(() => {
      expect(mockSubmit).toHaveBeenCalledWith({
        itemId: 'item-1',
        quantity: 50,
        totalCostIls: 125,
      });
    });
  });

  it('updates unit cost preview when quantity and cost change', async () => {
    render(
      <RestockForm
        item={items[0]}
        inventoryItems={items}
        onSubmit={mockSubmit}
        onCancel={mockCancel}
      />,
    );

    // Initially shows dash (default values are 0)
    expect(screen.getByText('—')).toBeInTheDocument();

    // Set quantity to 50 and cost to 125.00
    const qtyInput = screen.getByLabelText('inventory.restock.quantity');
    fireEvent.change(qtyInput, { target: { value: '50' } });

    const costInput = screen.getByLabelText('inventory.restock.totalCost');
    fireEvent.change(costInput, { target: { value: '125.00' } });

    // Unit cost = 125 / 50 = 2.50 ILS → toMinorUnits = 250 agora → formatCurrency = ₪2.50
    await waitFor(() => {
      expect(screen.queryByText('—')).not.toBeInTheDocument();
    });
  });

  it('shows validation error when quantity is zero', async () => {
    render(
      <RestockForm
        item={items[0]}
        inventoryItems={items}
        onSubmit={mockSubmit}
        onCancel={mockCancel}
      />,
    );

    // Submit without filling fields (defaults are 0)
    fireEvent.click(screen.getByText('inventory.restock.submit'));

    await waitFor(() => {
      expect(screen.getByText('inventory.restock.quantityError')).toBeInTheDocument();
    });
    expect(mockSubmit).not.toHaveBeenCalled();
  });
});
