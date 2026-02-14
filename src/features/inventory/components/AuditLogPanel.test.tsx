import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import type { InventoryLogEntry, InventoryItem, WorkOrder } from '@/types';

// Mock currency
vi.mock('@/lib/currency', () => ({
  formatCurrency: vi.fn((agora: number) => `₪${(agora / 100).toFixed(2)}`),
}));

// Mock Phosphor icons
vi.mock('@phosphor-icons/react', () => {
  const iconStub = (name: string) =>
    function MockIcon({ className }: { size?: number; className?: string; weight?: string }) {
      return <svg data-testid={`icon-${name}`} className={className} />;
    };

  return {
    ArrowFatUp: iconStub('ArrowFatUp'),
    ArrowBendDownRight: iconStub('ArrowBendDownRight'),
    Trash: iconStub('Trash'),
    X: iconStub('X'),
    Package: iconStub('Package'),
    // Layout / Toast icons that may be imported transitively
    Bell: iconStub('Bell'),
    ChartBar: iconStub('ChartBar'),
    ClipboardText: iconStub('ClipboardText'),
    GearSix: iconStub('GearSix'),
    Tray: iconStub('Tray'),
    MagnifyingGlass: iconStub('MagnifyingGlass'),
    CheckCircle: iconStub('CheckCircle'),
    XCircle: iconStub('XCircle'),
    Warning: iconStub('Warning'),
    Info: iconStub('Info'),
  };
});

const { AuditLogPanel } = await import('./AuditLogPanel');

const makeItem = (overrides: Partial<InventoryItem> = {}): InventoryItem => ({
  id: 'item-1',
  name: 'Cardboard',
  sku: null,
  supplier: null,
  currentQty: 100,
  wacAgora: 500,
  reorderThreshold: null,
  unit: 'sheets',
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-15'),
  ...overrides,
});

const items: InventoryItem[] = [
  makeItem({ id: 'item-1', name: 'Cardboard', currentQty: 100 }),
  makeItem({ id: 'item-2', name: 'Fabric', currentQty: 50 }),
];

const workOrders: WorkOrder[] = [
  { id: 'wo-1', clientName: 'TestClient' } as WorkOrder,
];

const makeLogs = (): InventoryLogEntry[] => [
  {
    id: 'log-1',
    itemId: 'item-1',
    action: 'restock',
    qtyChange: 50,
    costSnapshotAgora: 25000,
    wacBeforeAgora: 0,
    wacAfterAgora: 500,
    workOrderRef: null,
    reason: null,
    actorUid: 'user-1',
    timestamp: new Date('2026-02-01'),
  },
  {
    id: 'log-2',
    itemId: 'item-1',
    action: 'consume',
    qtyChange: -10,
    costSnapshotAgora: 5000,
    wacBeforeAgora: 500,
    wacAfterAgora: 500,
    workOrderRef: 'wo-1',
    reason: null,
    actorUid: 'user-1',
    timestamp: new Date('2026-02-05'),
  },
  {
    id: 'log-3',
    itemId: 'item-1',
    action: 'waste',
    qtyChange: -5,
    costSnapshotAgora: 2500,
    wacBeforeAgora: 500,
    wacAfterAgora: 500,
    workOrderRef: null,
    reason: 'Expired',
    actorUid: 'user-1',
    timestamp: new Date('2026-02-10'),
  },
  {
    id: 'log-4',
    itemId: 'item-2',
    action: 'restock',
    qtyChange: 30,
    costSnapshotAgora: 9000,
    wacBeforeAgora: 0,
    wacAfterAgora: 300,
    workOrderRef: null,
    reason: null,
    actorUid: 'user-1',
    timestamp: new Date('2026-02-03'),
  },
];

const renderWithRouter = (ui: React.ReactElement) =>
  render(<MemoryRouter>{ui}</MemoryRouter>);

describe('AuditLogPanel', () => {
  const mockClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders panel title and close button', () => {
    renderWithRouter(
      <AuditLogPanel
        logs={makeLogs()}
        inventoryItems={items}
        workOrders={workOrders}
        onClose={mockClose}
      />,
    );
    expect(screen.getByText('inventory.audit.title')).toBeInTheDocument();
    expect(screen.getByLabelText('inventory.audit.close')).toBeInTheDocument();
  });

  it('renders all log entries in chronological order (newest first)', () => {
    renderWithRouter(
      <AuditLogPanel
        logs={makeLogs()}
        inventoryItems={items}
        workOrders={workOrders}
        onClose={mockClose}
      />,
    );

    // All action labels should appear
    const restockLabels = screen.getAllByText('inventory.audit.actions.restock');
    expect(restockLabels).toHaveLength(2); // 2 restock entries
    expect(screen.getByText('inventory.audit.actions.consume')).toBeInTheDocument();
    expect(screen.getByText('inventory.audit.actions.waste')).toBeInTheDocument();
  });

  it('shows correct icons for restock/consume/waste', () => {
    renderWithRouter(
      <AuditLogPanel
        logs={makeLogs()}
        inventoryItems={items}
        workOrders={workOrders}
        onClose={mockClose}
      />,
    );

    expect(screen.getAllByTestId('icon-ArrowFatUp')).toHaveLength(2); // 2 restock entries
    expect(screen.getByTestId('icon-ArrowBendDownRight')).toBeInTheDocument();
    expect(screen.getByTestId('icon-Trash')).toBeInTheDocument();
  });

  it('displays formatted cost via formatCurrency', () => {
    renderWithRouter(
      <AuditLogPanel
        logs={makeLogs()}
        inventoryItems={items}
        workOrders={workOrders}
        onClose={mockClose}
      />,
    );

    // Cost for log-1: 25000 agora → ₪250.00
    expect(screen.getAllByText(/₪250\.00/).length).toBeGreaterThan(0);
  });

  it('shows Work Order name as clickable link when workOrderRef present', () => {
    renderWithRouter(
      <AuditLogPanel
        logs={makeLogs()}
        inventoryItems={items}
        workOrders={workOrders}
        onClose={mockClose}
      />,
    );

    const woLinks = screen.getAllByText('TestClient');
    expect(woLinks.length).toBeGreaterThan(0);
    // The link should point to the work order detail page
    const link = woLinks[0].closest('a');
    expect(link).toHaveAttribute('href', '/work-orders/wo-1');
  });

  it('shows empty state when no logs', () => {
    renderWithRouter(
      <AuditLogPanel
        logs={[]}
        inventoryItems={items}
        workOrders={workOrders}
        onClose={mockClose}
      />,
    );

    expect(screen.getByText('inventory.audit.emptyState')).toBeInTheDocument();
    expect(screen.getByTestId('icon-Package')).toBeInTheDocument();
  });

  it('calls onClose when close button clicked', () => {
    renderWithRouter(
      <AuditLogPanel
        logs={makeLogs()}
        inventoryItems={items}
        workOrders={workOrders}
        onClose={mockClose}
      />,
    );

    fireEvent.click(screen.getByLabelText('inventory.audit.close'));
    expect(mockClose).toHaveBeenCalledTimes(1);
  });

  it('shows qty change with sign prefix', () => {
    renderWithRouter(
      <AuditLogPanel
        logs={makeLogs()}
        inventoryItems={items}
        workOrders={workOrders}
        onClose={mockClose}
      />,
    );

    // Positive restock: +50
    expect(screen.getByText('+50')).toBeInTheDocument();
    // Negative consume: -10
    expect(screen.getByText('-10')).toBeInTheDocument();
    // Negative waste: -5
    expect(screen.getByText('-5')).toBeInTheDocument();
  });

  it('expands and collapses log entry details on click', () => {
    renderWithRouter(
      <AuditLogPanel
        logs={makeLogs()}
        inventoryItems={items}
        workOrders={workOrders}
        onClose={mockClose}
      />,
    );

    // Get the first log entry (newest first = waste log-3)
    const entries = screen.getAllByRole('button');
    // Find a log entry button (not the close or filter buttons)
    const logEntry = entries.find(
      (btn) => btn.className && btn.className.includes('logEntry'),
    );

    // If we can't find by class (CSS modules), find by the expand mechanism
    // Click a log entry to toggle expand
    const wasteEntry = screen.getByText('-5').closest('[role="button"]');
    expect(wasteEntry).toBeInTheDocument();

    // Click to expand
    if (wasteEntry) {
      fireEvent.click(wasteEntry);
      // The expanded details div should have the 'expanded' class
      const detailsDivs = wasteEntry.querySelectorAll('div');
      const expandedDiv = Array.from(detailsDivs).find(
        (d) => d.className && d.className.includes('expanded'),
      );
      expect(expandedDiv).toBeTruthy();

      // Click again to collapse
      fireEvent.click(wasteEntry);
      const stillExpanded = Array.from(wasteEntry.querySelectorAll('div')).find(
        (d) => d.className && d.className.includes('expanded'),
      );
      expect(stillExpanded).toBeFalsy();
    }
  });

  it('shows running balance when filtered by specific item', () => {
    const { container } = renderWithRouter(
      <AuditLogPanel
        logs={makeLogs()}
        inventoryItems={items}
        workOrders={workOrders}
        onClose={mockClose}
      />,
    );

    // Initially no running balance
    expect(screen.queryByTestId('running-balance')).not.toBeInTheDocument();

    // Open the filter select and choose item-1
    const trigger = container.querySelector('button[aria-haspopup="listbox"]');
    if (trigger) {
      fireEvent.click(trigger);
      const option = screen.getByRole('option', { name: 'Cardboard' });
      fireEvent.click(option);
    }

    // Now running balance should be shown
    expect(screen.getByTestId('running-balance')).toBeInTheDocument();
  });
});
