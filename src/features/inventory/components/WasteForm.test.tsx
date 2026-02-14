import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import type { InventoryItem, WorkOrder } from '@/types';

// Mock currency
vi.mock('@/lib/currency', () => ({
  formatCurrency: vi.fn((agora: number) => `₪${(agora / 100).toFixed(2)}`),
  toMinorUnits: vi.fn((ils: number) => Math.round(ils * 100)),
}));

// Mock WAC
vi.mock('@/lib/wac', () => ({
  applyScoopCost: vi.fn((qty: number, wac: number) => Math.round(qty * wac)),
}));

// Mock Phosphor icons
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
    Trash: iconStub('Trash'),
    CheckCircle: iconStub('CheckCircle'),
    XCircle: iconStub('XCircle'),
    Warning: iconStub('Warning'),
    Info: iconStub('Info'),
    X: iconStub('X'),
    Bell: iconStub('Bell'),
    ChartBar: iconStub('ChartBar'),
    ClipboardText: iconStub('ClipboardText'),
    GearSix: iconStub('GearSix'),
    Tray: iconStub('Tray'),
    MagnifyingGlass: iconStub('MagnifyingGlass'),
  };
});

const { WasteForm } = await import('./WasteForm');

const makeItem = (overrides: Partial<InventoryItem> = {}): InventoryItem => ({
  id: 'item-1',
  name: 'Cardboard',
  sku: 'CBR-001',
  supplier: 'PaperInc',
  currentQty: 100,
  wacAgora: 500,
  reorderThreshold: 10,
  unit: 'sheets',
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-15'),
  ...overrides,
});

const items: InventoryItem[] = [
  makeItem({ id: 'item-1', name: 'Cardboard' }),
  makeItem({ id: 'item-2', name: 'Fabric', currentQty: 50, wacAgora: 300 }),
];

const workOrders: WorkOrder[] = [
  { id: 'wo-1', clientName: 'TestClient', status: 'in_progress', inventoryCostAgora: 10000 } as WorkOrder,
  { id: 'wo-2', clientName: 'OtherClient', status: 'in_progress', inventoryCostAgora: 5000 } as WorkOrder,
];

describe('WasteForm', () => {
  const mockSubmit = vi.fn().mockResolvedValue(undefined);
  const mockCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders form title', () => {
    render(
      <WasteForm
        inventoryItems={items}
        workOrders={workOrders}
        onSubmit={mockSubmit}
        onCancel={mockCancel}
      />,
    );
    expect(screen.getByText('inventory.waste.title')).toBeInTheDocument();
  });

  it('renders all fields (material, quantity, reason, work order optional)', () => {
    render(
      <WasteForm
        inventoryItems={items}
        workOrders={workOrders}
        onSubmit={mockSubmit}
        onCancel={mockCancel}
      />,
    );
    expect(screen.getByText('inventory.waste.material')).toBeInTheDocument();
    expect(screen.getByLabelText('inventory.waste.quantity')).toBeInTheDocument();
    expect(screen.getByLabelText('inventory.waste.reason')).toBeInTheDocument();
    expect(screen.getByText('inventory.waste.workOrder')).toBeInTheDocument();
  });

  it('pre-selects material when item prop provided', () => {
    render(
      <WasteForm
        item={items[0]}
        inventoryItems={items}
        workOrders={workOrders}
        onSubmit={mockSubmit}
        onCancel={mockCancel}
      />,
    );
    expect(screen.getByText('Cardboard')).toBeInTheDocument();
  });

  it('shows overdraft error when quantity exceeds available stock', async () => {
    render(
      <WasteForm
        item={items[0]}
        inventoryItems={items}
        workOrders={workOrders}
        onSubmit={mockSubmit}
        onCancel={mockCancel}
      />,
    );

    const qtyInput = screen.getByLabelText('inventory.waste.quantity');
    fireEvent.change(qtyInput, { target: { value: '150' } });

    await waitFor(() => {
      // t() mock renders interpolation as key|param=value
      expect(screen.getByRole('alert')).toHaveTextContent('inventory.waste.overdraftError');
    });
  });

  it('shows cost preview when quantity > 0 and item selected', async () => {
    render(
      <WasteForm
        item={items[0]}
        inventoryItems={items}
        workOrders={workOrders}
        onSubmit={mockSubmit}
        onCancel={mockCancel}
      />,
    );

    const qtyInput = screen.getByLabelText('inventory.waste.quantity');
    fireEvent.change(qtyInput, { target: { value: '5' } });

    await waitFor(() => {
      expect(screen.getByText('inventory.waste.calculatedCost')).toBeInTheDocument();
      // 5 * 500 = 2500 agora → ₪25.00
      expect(screen.getByText('₪25.00')).toBeInTheDocument();
    });
  });

  it('calls onSubmit with correct data when form is valid', async () => {
    render(
      <WasteForm
        item={items[0]}
        inventoryItems={items}
        workOrders={workOrders}
        onSubmit={mockSubmit}
        onCancel={mockCancel}
      />,
    );

    const qtyInput = screen.getByLabelText('inventory.waste.quantity');
    fireEvent.change(qtyInput, { target: { value: '5' } });

    const reasonInput = screen.getByLabelText('inventory.waste.reason');
    fireEvent.change(reasonInput, { target: { value: 'Expired' } });

    fireEvent.click(screen.getByText('inventory.waste.submit'));

    await waitFor(() => {
      expect(mockSubmit).toHaveBeenCalledWith({
        itemId: 'item-1',
        quantity: 5,
        reason: 'Expired',
        workOrderId: '',
      });
    });
  });

  it('calls onSubmit with linked workOrderId when WO selected', async () => {
    render(
      <WasteForm
        item={items[0]}
        inventoryItems={items}
        workOrders={workOrders}
        onSubmit={mockSubmit}
        onCancel={mockCancel}
      />,
    );

    const qtyInput = screen.getByLabelText('inventory.waste.quantity');
    fireEvent.change(qtyInput, { target: { value: '3' } });

    const reasonInput = screen.getByLabelText('inventory.waste.reason');
    fireEvent.change(reasonInput, { target: { value: 'Damaged' } });

    // Open the Work Order select and pick TestClient
    const woLabel = screen.getByText('inventory.waste.workOrder');
    const woTrigger = woLabel.closest('div')!.querySelector('button[aria-haspopup="listbox"]');
    if (woTrigger) {
      fireEvent.click(woTrigger);
      const option = screen.getByRole('option', { name: 'TestClient' });
      fireEvent.click(option);
    }

    fireEvent.click(screen.getByText('inventory.waste.submit'));

    await waitFor(() => {
      expect(mockSubmit).toHaveBeenCalledWith({
        itemId: 'item-1',
        quantity: 3,
        reason: 'Damaged',
        workOrderId: 'wo-1',
      });
    });
  });

  it('calls onCancel when cancel clicked', () => {
    render(
      <WasteForm
        inventoryItems={items}
        workOrders={workOrders}
        onSubmit={mockSubmit}
        onCancel={mockCancel}
      />,
    );
    fireEvent.click(screen.getByText('inventory.waste.cancel'));
    expect(mockCancel).toHaveBeenCalledTimes(1);
  });

  it('renders submit button with danger variant', () => {
    render(
      <WasteForm
        inventoryItems={items}
        workOrders={workOrders}
        onSubmit={mockSubmit}
        onCancel={mockCancel}
      />,
    );
    const submitBtn = screen.getByText('inventory.waste.submit').closest('button');
    expect(submitBtn).toBeInTheDocument();
  });

  it('disables submit button when reason is empty', async () => {
    render(
      <WasteForm
        item={items[0]}
        inventoryItems={items}
        workOrders={workOrders}
        onSubmit={mockSubmit}
        onCancel={mockCancel}
      />,
    );

    const qtyInput = screen.getByLabelText('inventory.waste.quantity');
    fireEvent.change(qtyInput, { target: { value: '5' } });

    // Reason is empty — submit button should be disabled
    const submitBtn = screen.getByText('inventory.waste.submit').closest('button');
    expect(submitBtn).toBeDisabled();
  });
});
