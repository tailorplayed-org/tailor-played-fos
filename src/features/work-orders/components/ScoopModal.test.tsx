import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import type { InventoryItem, WorkOrder } from '@/types';

// Mock Phosphor icons — include all icons used transitively
vi.mock('@phosphor-icons/react', () => {
  const iconStub = (name: string) =>
    function MockIcon({ className }: { size?: number; className?: string; weight?: string }) {
      return <svg data-testid={`icon-${name}`} className={className} />;
    };

  return {
    ArrowBendDownRight: iconStub('ArrowBendDownRight'),
    Plus: iconStub('Plus'),
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
    MagnifyingGlass: iconStub('MagnifyingGlass'),
  };
});

vi.mock('@/lib/wac', () => ({
  applyScoopCost: vi.fn((qty: number, wac: number) => qty * wac),
  calculateWAC: vi.fn(() => 5000),
}));

const { ScoopModal } = await import('./ScoopModal');

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

const makeWorkOrder = (overrides: Partial<WorkOrder> = {}): WorkOrder => ({
  id: 'wo-1',
  clientName: 'Acme Corp',
  projectDescription: 'Project Alpha',
  deadline: null,
  status: 'Production',
  revenueTotalAgora: 100000,
  directCostAgora: 0,
  inventoryCostAgora: 0,
  overheadAllocationAgora: 0,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-15'),
  ...overrides,
});

const items: InventoryItem[] = [
  makeItem({ id: 'item-1', name: 'Cardboard', currentQty: 100, wacAgora: 350 }),
  makeItem({ id: 'item-2', name: 'Fabric', currentQty: 50, wacAgora: 500 }),
  makeItem({ id: 'item-3', name: 'Thread', currentQty: 200, wacAgora: 100 }),
];

const workOrders: WorkOrder[] = [
  makeWorkOrder({ id: 'wo-1', clientName: 'Acme Corp' }),
  makeWorkOrder({ id: 'wo-2', clientName: 'Beta Ltd' }),
];

describe('ScoopModal', () => {
  const mockSubmit = vi.fn().mockResolvedValue(undefined);
  const mockClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all form fields when open', () => {
    render(
      <ScoopModal
        open={true}
        onClose={mockClose}
        onSubmit={mockSubmit}
        inventoryItems={items}
        workOrders={workOrders}
      />,
    );
    expect(screen.getByText('inventory.scoop.title')).toBeInTheDocument();
    expect(screen.getByText('inventory.scoop.material')).toBeInTheDocument();
    expect(screen.getByLabelText('inventory.scoop.quantity')).toBeInTheDocument();
    expect(screen.getByText('inventory.scoop.calculatedCost')).toBeInTheDocument();
    expect(screen.getByText('inventory.scoop.workOrder')).toBeInTheDocument();
  });

  it('does not render when open is false', () => {
    render(
      <ScoopModal
        open={false}
        onClose={mockClose}
        onSubmit={mockSubmit}
        inventoryItems={items}
        workOrders={workOrders}
      />,
    );
    expect(screen.queryByText('inventory.scoop.title')).not.toBeInTheDocument();
  });

  it('renders submit and cancel buttons', () => {
    render(
      <ScoopModal
        open={true}
        onClose={mockClose}
        onSubmit={mockSubmit}
        inventoryItems={items}
        workOrders={workOrders}
      />,
    );
    expect(screen.getByText('inventory.scoop.submit')).toBeInTheDocument();
    expect(screen.getByText('inventory.scoop.cancel')).toBeInTheDocument();
  });

  it('calls onClose when cancel button clicked', () => {
    render(
      <ScoopModal
        open={true}
        onClose={mockClose}
        onSubmit={mockSubmit}
        inventoryItems={items}
        workOrders={workOrders}
      />,
    );
    fireEvent.click(screen.getByText('inventory.scoop.cancel'));
    expect(mockClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose on Escape key', () => {
    render(
      <ScoopModal
        open={true}
        onClose={mockClose}
        onSubmit={mockSubmit}
        inventoryItems={items}
        workOrders={workOrders}
      />,
    );
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(mockClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when clicking overlay', () => {
    render(
      <ScoopModal
        open={true}
        onClose={mockClose}
        onSubmit={mockSubmit}
        inventoryItems={items}
        workOrders={workOrders}
      />,
    );
    // The overlay has role="presentation"
    const overlay = screen.getByRole('presentation');
    fireEvent.click(overlay);
    expect(mockClose).toHaveBeenCalledTimes(1);
  });

  it('does not close when clicking inside modal', () => {
    render(
      <ScoopModal
        open={true}
        onClose={mockClose}
        onSubmit={mockSubmit}
        inventoryItems={items}
        workOrders={workOrders}
      />,
    );
    const dialog = screen.getByRole('dialog');
    fireEvent.click(dialog);
    expect(mockClose).not.toHaveBeenCalled();
  });

  it('shows overdraft error when quantity exceeds available stock', async () => {
    render(
      <ScoopModal
        open={true}
        onClose={mockClose}
        onSubmit={mockSubmit}
        inventoryItems={items}
        workOrders={workOrders}
        preselectedItemId="item-1"
      />,
    );

    const qtyInput = screen.getByLabelText('inventory.scoop.quantity');
    fireEvent.change(qtyInput, { target: { value: '150' } });

    await waitFor(() => {
      expect(
        screen.getByText('inventory.scoop.overdraftError|available=100'),
      ).toBeInTheDocument();
    });
  });

  it('disables Confirm button when no material selected (default state)', () => {
    render(
      <ScoopModal
        open={true}
        onClose={mockClose}
        onSubmit={mockSubmit}
        inventoryItems={items}
        workOrders={workOrders}
      />,
    );
    const submitButton = screen.getByText('inventory.scoop.submit').closest('button');
    expect(submitButton).toBeDisabled();
  });

  it('shows available stock display when material is pre-selected', () => {
    render(
      <ScoopModal
        open={true}
        onClose={mockClose}
        onSubmit={mockSubmit}
        inventoryItems={items}
        workOrders={workOrders}
        preselectedItemId="item-1"
      />,
    );
    expect(screen.getByText('inventory.scoop.availableStock')).toBeInTheDocument();
  });

  it('shows calculated cost display', () => {
    render(
      <ScoopModal
        open={true}
        onClose={mockClose}
        onSubmit={mockSubmit}
        inventoryItems={items}
        workOrders={workOrders}
      />,
    );
    expect(screen.getByText('inventory.scoop.calculatedCost')).toBeInTheDocument();
  });

  it('calls onSubmit with correct data on valid submission', async () => {
    render(
      <ScoopModal
        open={true}
        onClose={mockClose}
        onSubmit={mockSubmit}
        inventoryItems={items}
        workOrders={workOrders}
        preselectedItemId="item-1"
        preselectedWorkOrderId="wo-1"
      />,
    );

    const qtyInput = screen.getByLabelText('inventory.scoop.quantity');
    fireEvent.change(qtyInput, { target: { value: '10' } });

    fireEvent.click(screen.getByText('inventory.scoop.submit'));

    await waitFor(() => {
      expect(mockSubmit).toHaveBeenCalledWith({
        itemId: 'item-1',
        quantity: 10,
        workOrderId: 'wo-1',
      });
    });
  });

  it('pre-selects work order when preselectedWorkOrderId provided', () => {
    render(
      <ScoopModal
        open={true}
        onClose={mockClose}
        onSubmit={mockSubmit}
        inventoryItems={items}
        workOrders={workOrders}
        preselectedWorkOrderId="wo-1"
      />,
    );
    // The Select should show the pre-selected work order name
    expect(screen.getByText('Acme Corp')).toBeInTheDocument();
  });

  it('pre-selects material when preselectedItemId provided', () => {
    render(
      <ScoopModal
        open={true}
        onClose={mockClose}
        onSubmit={mockSubmit}
        inventoryItems={items}
        workOrders={workOrders}
        preselectedItemId="item-1"
      />,
    );
    // The Select should show the pre-selected item name
    expect(screen.getByText('Cardboard')).toBeInTheDocument();
  });
});
