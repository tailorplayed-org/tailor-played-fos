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
    doc: vi.fn((_db: unknown, collectionName: string, id: string) => ({ path: `${collectionName}/${id}` })),
    collection: vi.fn((_db: unknown, name: string) => ({ path: name })),
    serverTimestamp: vi.fn(() => 'mock-server-timestamp'),
  };
});

// Mock services
vi.mock('@/services', () => ({
  db: {},
  auth: { currentUser: null },
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
});
