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
    ArrowBendDownRight: iconStub('ArrowBendDownRight'),
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

// Mock Firestore
vi.mock('firebase/firestore', async () => {
  const actual = await vi.importActual('firebase/firestore');
  return {
    ...actual,
    addDoc: vi.fn().mockResolvedValue({ id: 'new-item-id' }),
    updateDoc: vi.fn().mockResolvedValue(undefined),
    writeBatch: vi.fn(() => ({
      update: vi.fn(),
      set: vi.fn(),
      commit: vi.fn().mockResolvedValue(undefined),
    })),
    doc: vi.fn((_db: unknown, collectionName: string, id?: string) => ({ path: id ? `${collectionName}/${id}` : collectionName })),
    collection: vi.fn((_db: unknown, name: string) => ({ path: name })),
    serverTimestamp: vi.fn(() => 'mock-server-timestamp'),
  };
});

// Mock WAC calculation
vi.mock('@/lib/wac', () => ({
  calculateWAC: vi.fn(() => 5000),
  applyScoopCost: vi.fn((qty: number, wac: number) => qty * wac),
}));

// Mock services
vi.mock('@/services', () => ({
  db: {},
  auth: { currentUser: { uid: 'test-user-123' } },
}));

// Mock useInventory
const mockInventoryState = {
  inventory: [] as InventoryItem[],
  loading: false,
  error: null as string | null,
  setInventory: vi.fn(),
  setLoading: vi.fn(),
  setError: vi.fn(),
};

vi.mock('./hooks/useInventory', () => ({
  useInventory: () => mockInventoryState,
}));

// Mock useWorkOrders
const mockWorkOrdersState = {
  workOrders: [] as { id: string; clientName: string; inventoryCostAgora: number }[],
  loading: false,
  error: null as string | null,
  setWorkOrders: vi.fn(),
  setLoading: vi.fn(),
  setError: vi.fn(),
};

vi.mock('@/features/work-orders/hooks/useWorkOrders', () => ({
  useWorkOrders: () => mockWorkOrdersState,
}));

// Mock toast
vi.mock('@/stores/useUIStore', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const { InventoryPage } = await import('./InventoryPage');

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

describe('InventoryPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockInventoryState.inventory = [];
    mockInventoryState.loading = false;
    mockInventoryState.error = null;
  });

  it('renders the page title', () => {
    render(<InventoryPage />);
    expect(screen.getByText('inventory.title')).toBeInTheDocument();
  });

  it('shows empty state when no items exist', () => {
    render(<InventoryPage />);
    expect(screen.getByText('inventory.emptyState')).toBeInTheDocument();
    expect(screen.getByText('inventory.emptyStateHint')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    mockInventoryState.loading = true;
    render(<InventoryPage />);
    const skeletons = document.querySelectorAll('[aria-hidden="true"]');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('shows error state', () => {
    mockInventoryState.error = 'Connection failed';
    render(<InventoryPage />);
    expect(screen.getByText('Connection failed')).toBeInTheDocument();
  });

  it('renders inventory items in table', () => {
    mockInventoryState.inventory = [
      makeItem({ id: '1', name: 'Fabric' }),
      makeItem({ id: '2', name: 'Thread' }),
    ];
    render(<InventoryPage />);
    expect(screen.getByText('Fabric')).toBeInTheDocument();
    expect(screen.getByText('Thread')).toBeInTheDocument();
  });

  it('shows Add Material button when items exist', () => {
    mockInventoryState.inventory = [makeItem()];
    render(<InventoryPage />);
    // Header "Add Material" button
    const addButtons = screen.getAllByText('inventory.addMaterial');
    expect(addButtons.length).toBeGreaterThan(0);
  });

  it('opens create form when Add Material clicked', () => {
    mockInventoryState.inventory = [makeItem()];
    render(<InventoryPage />);
    const addButton = screen.getAllByText('inventory.addMaterial')[0];
    fireEvent.click(addButton);
    // Form should now be visible
    expect(screen.getByText('inventory.form.create')).toBeInTheDocument();
  });

  it('opens edit form when row clicked', () => {
    mockInventoryState.inventory = [makeItem({ id: '1', name: 'Fabric' })];
    render(<InventoryPage />);
    fireEvent.click(screen.getByText('Fabric'));
    // Edit form should show
    expect(screen.getByText('inventory.form.update')).toBeInTheDocument();
  });

  it('closes form when cancel clicked', () => {
    mockInventoryState.inventory = [makeItem()];
    render(<InventoryPage />);
    // Open create form
    fireEvent.click(screen.getAllByText('inventory.addMaterial')[0]);
    expect(screen.getByText('inventory.form.create')).toBeInTheDocument();
    // Cancel
    fireEvent.click(screen.getByText('inventory.form.cancel'));
    expect(screen.queryByText('inventory.form.create')).not.toBeInTheDocument();
  });

  it('calls addDoc on form submit in create mode', async () => {
    const { addDoc } = await import('firebase/firestore');
    mockInventoryState.inventory = [makeItem()];
    render(<InventoryPage />);

    // Open create form
    fireEvent.click(screen.getAllByText('inventory.addMaterial')[0]);

    // Fill required fields
    const nameInput = screen.getByLabelText('inventory.form.name');
    fireEvent.change(nameInput, { target: { value: 'New Material' } });

    // Select unit via the Select component
    const unitButton = screen.getByText('inventory.form.unit').closest('div')!.querySelector('button')!;
    fireEvent.click(unitButton);
    await waitFor(() => {
      const option = screen.getByRole('option', { name: 'inventory.units.sheets' });
      fireEvent.click(option);
    });

    // Submit
    fireEvent.click(screen.getByText('inventory.form.create'));

    await waitFor(() => {
      expect(addDoc).toHaveBeenCalled();
    });
  });

  it('renders Restock action button in table rows', () => {
    mockInventoryState.inventory = [makeItem({ id: '1', name: 'Fabric' })];
    render(<InventoryPage />);
    expect(screen.getByText('inventory.restock.action')).toBeInTheDocument();
  });

  it('opens restock form when Restock button clicked', () => {
    mockInventoryState.inventory = [makeItem({ id: '1', name: 'Fabric' })];
    render(<InventoryPage />);
    fireEvent.click(screen.getByText('inventory.restock.action'));
    expect(screen.getByText('inventory.restock.title')).toBeInTheDocument();
    // Pre-selected item name appears in both restock form and table
    const fabricElements = screen.getAllByText('Fabric');
    expect(fabricElements.length).toBeGreaterThanOrEqual(2);
  });

  it('closes restock form when cancel clicked', () => {
    mockInventoryState.inventory = [makeItem({ id: '1', name: 'Fabric' })];
    render(<InventoryPage />);
    fireEvent.click(screen.getByText('inventory.restock.action'));
    expect(screen.getByText('inventory.restock.title')).toBeInTheDocument();
    fireEvent.click(screen.getByText('inventory.restock.cancel'));
    expect(screen.queryByText('inventory.restock.title')).not.toBeInTheDocument();
  });

  it('renders Scoop action button in table rows', () => {
    mockInventoryState.inventory = [makeItem({ id: '1', name: 'Fabric' })];
    render(<InventoryPage />);
    expect(screen.getByText('inventory.scoop.action')).toBeInTheDocument();
  });

  it('opens ScoopModal when Scoop button clicked', () => {
    mockInventoryState.inventory = [makeItem({ id: '1', name: 'Fabric' })];
    render(<InventoryPage />);
    fireEvent.click(screen.getByText('inventory.scoop.action'));
    expect(screen.getByText('inventory.scoop.title')).toBeInTheDocument();
  });

  it('closes ScoopModal when cancel clicked', () => {
    mockInventoryState.inventory = [makeItem({ id: '1', name: 'Fabric' })];
    render(<InventoryPage />);
    fireEvent.click(screen.getByText('inventory.scoop.action'));
    expect(screen.getByText('inventory.scoop.title')).toBeInTheDocument();
    fireEvent.click(screen.getByText('inventory.scoop.cancel'));
    expect(screen.queryByText('inventory.scoop.title')).not.toBeInTheDocument();
  });

  it('calls writeBatch on restock form submit with correct arguments', async () => {
    const { writeBatch } = await import('firebase/firestore');
    const mockCommit = vi.fn().mockResolvedValue(undefined);
    const mockBatchUpdate = vi.fn();
    const mockBatchSet = vi.fn();
    (writeBatch as ReturnType<typeof vi.fn>).mockReturnValue({
      update: mockBatchUpdate,
      set: mockBatchSet,
      commit: mockCommit,
    });

    mockInventoryState.inventory = [makeItem({ id: 'item-1', name: 'Fabric', currentQty: 100, wacAgora: 350 })];
    render(<InventoryPage />);

    // Open restock form
    fireEvent.click(screen.getByText('inventory.restock.action'));

    // Fill restock form
    const qtyInput = screen.getByLabelText('inventory.restock.quantity');
    fireEvent.change(qtyInput, { target: { value: '50' } });

    const costInput = screen.getByLabelText('inventory.restock.totalCost');
    fireEvent.change(costInput, { target: { value: '125.00' } });

    // Submit
    fireEvent.click(screen.getByText('inventory.restock.submit'));

    await waitFor(() => {
      expect(writeBatch).toHaveBeenCalled();
    });

    // Verify inventory item update (currentQty incremented, wacAgora set)
    expect(mockBatchUpdate).toHaveBeenCalledWith(
      expect.anything(), // doc ref
      expect.objectContaining({
        currentQty: 150, // 100 + 50
        updatedAt: 'mock-server-timestamp',
      }),
    );

    // Verify inventory_log entry created
    expect(mockBatchSet).toHaveBeenCalledWith(
      expect.anything(), // doc ref
      expect.objectContaining({
        itemId: 'item-1',
        action: 'restock',
        qtyChange: 50,
        wacBeforeAgora: 350,
        actorUid: 'test-user-123',
        timestamp: 'mock-server-timestamp',
      }),
    );

    expect(mockCommit).toHaveBeenCalled();
  });
});
