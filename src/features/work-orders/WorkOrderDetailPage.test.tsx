import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest';
import { render, screen, within, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router';
import { useWorkOrderStore, useTransactionStore, useInventoryStore } from '@/stores';
import type { WorkOrder, Transaction, InventoryItem } from '@/types';

// Mock hooks — same pattern as WorkOrdersPage.test.tsx
const mockUpdateWorkOrder = vi.fn();
const mockCreateTransaction = vi.fn();

vi.mock('./hooks', () => ({
  useWorkOrders: () => useWorkOrderStore(),
  useWorkOrderActions: () => ({
    createWorkOrder: vi.fn(),
    updateWorkOrder: mockUpdateWorkOrder,
  }),
  useTransactions: () => useTransactionStore(),
  useTransactionActions: () => ({
    createTransaction: mockCreateTransaction,
  }),
}));

vi.mock('@/features/inventory/hooks/useInventory', () => ({
  useInventory: () => useInventoryStore(),
}));

vi.mock('@/features/inventory/hooks/useInventoryLogs', () => ({
  useInventoryLogs: () => ({ logs: [], loading: false, error: null }),
}));

const mockBatchCommit = vi.fn().mockResolvedValue(undefined);
const mockBatchUpdate = vi.fn();
const mockBatchSet = vi.fn();

vi.mock('firebase/firestore', async () => {
  const actual = await vi.importActual('firebase/firestore');
  return {
    ...actual,
    writeBatch: vi.fn(() => ({
      update: mockBatchUpdate,
      set: mockBatchSet,
      commit: mockBatchCommit,
    })),
    doc: vi.fn((_, coll, docId) => ({ path: `${coll}/${docId}` })),
    collection: vi.fn((_, name) => ({ path: name })),
    serverTimestamp: vi.fn(() => 'mock-server-timestamp'),
  };
});

vi.mock('@/services', () => ({
  db: {},
  auth: { currentUser: { uid: 'test-user-123' } },
}));

vi.mock('@/lib/wac', () => ({
  applyScoopCost: vi.fn((qty: number, wac: number) => qty * wac),
  calculateWAC: vi.fn(() => 5000),
}));

vi.mock('@/stores/useUIStore', async () => {
  const actual = await vi.importActual('@/stores/useUIStore');
  return {
    ...actual,
    toast: {
      success: vi.fn(),
      error: vi.fn(),
      warning: vi.fn(),
      info: vi.fn(),
    },
  };
});

// Mock zodResolver for forms (WorkOrderForm, TransactionForm)
vi.mock('@hookform/resolvers/zod', () => ({
  zodResolver: () => async (values: Record<string, unknown>) => {
    const errors: Record<string, { message: string }> = {};
    if (!values.clientName || (typeof values.clientName === 'string' && values.clientName.trim() === '')) {
      errors.clientName = { message: 'Client name is required' };
    }
    return {
      values: Object.keys(errors).length === 0 ? values : {},
      errors,
    };
  },
}));

function makeWorkOrder(overrides: Partial<WorkOrder> & { id: string; clientName: string }): WorkOrder {
  return {
    projectDescription: '',
    deadline: null,
    status: 'Lead',
    revenueTotalAgora: 0,
    directCostAgora: 0,
    inventoryCostAgora: 0,
    overheadAllocationAgora: 0,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    ...overrides,
  };
}

function makeTransaction(overrides: Partial<Transaction> & { id: string }): Transaction {
  return {
    vendorName: 'Default Vendor',
    amountAgora: 1000,
    currency: 'ILS' as const,
    date: new Date('2026-02-01'),
    category: 'DirectCost' as const,
    workOrderId: null,
    inventoryItemId: null,
    status: 'approved' as const,
    aiConfidence: null,
    originalFileUrl: null,
    source: 'manual' as const,
    notes: null,
    createdAt: new Date('2026-02-01'),
    updatedAt: new Date('2026-02-01'),
    ...overrides,
  };
}

const mockWO = makeWorkOrder({
  id: 'wo-123',
  clientName: 'Test Client',
  projectDescription: 'Test project description',
  deadline: new Date('2026-06-15'),
  status: 'Production',
  revenueTotalAgora: 150000,
  directCostAgora: 50000,
  inventoryCostAgora: 10000,
  overheadAllocationAgora: 5000,
});

const mockTransactions: Transaction[] = [
  makeTransaction({
    id: 'txn-1',
    vendorName: 'Supplier Alpha',
    amountAgora: 5000,
    date: new Date('2026-02-05'),
    category: 'DirectCost',
    workOrderId: 'wo-123',
  }),
  makeTransaction({
    id: 'txn-2',
    vendorName: 'Revenue Client',
    amountAgora: 15000,
    date: new Date('2026-02-07'),
    category: 'Revenue',
    workOrderId: 'wo-123',
  }),
  makeTransaction({
    id: 'txn-3',
    vendorName: 'Material Co',
    amountAgora: 3000,
    date: new Date('2026-02-01'),
    category: 'DirectCost',
    workOrderId: 'wo-123',
  }),
  makeTransaction({
    id: 'txn-unlinked',
    vendorName: 'Unlinked Vendor',
    amountAgora: 2000,
    date: new Date('2026-02-03'),
    category: 'Overhead',
    workOrderId: 'wo-999',
  }),
];

// Pre-load module with Phosphor icons to avoid per-test timeout
let WorkOrderDetailPage: typeof import('./WorkOrderDetailPage').WorkOrderDetailPage;

describe('WorkOrderDetailPage', () => {
  beforeAll(async () => {
    const mod = await import('./WorkOrderDetailPage');
    WorkOrderDetailPage = mod.WorkOrderDetailPage;
  }, 30_000);

  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
    useWorkOrderStore.setState({
      workOrders: [],
      loading: false,
      error: null,
    });
    useTransactionStore.setState({
      transactions: [],
      loading: false,
      error: null,
    });
    useInventoryStore.setState({
      inventory: [],
      loading: false,
      error: null,
    });
  });

  function renderDetail(id: string = 'wo-123') {
    return render(
      <MemoryRouter initialEntries={[`/work-orders/${id}`]}>
        <Routes>
          <Route path="/work-orders/:id" element={<WorkOrderDetailPage />} />
          <Route path="/work-orders" element={<div>Work Orders List</div>} />
        </Routes>
      </MemoryRouter>,
    );
  }

  // ── AC #1, #3: Project Header ──

  it('renders project header with client name, description, and deadline', () => {
    useWorkOrderStore.setState({ workOrders: [mockWO] });
    useTransactionStore.setState({ transactions: mockTransactions });
    renderDetail();

    expect(screen.getByText('Test Client')).toBeInTheDocument();
    expect(screen.getByText('Test project description')).toBeInTheDocument();

    // Deadline renders via i18n mock: key + |date=formatted_date
    const expectedDate = mockWO.deadline!.toLocaleDateString('en', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
    expect(screen.getByText(`workOrderDetail.deadline|date=${expectedDate}`)).toBeInTheDocument();
  });

  it('hides deadline display when deadline is null', () => {
    const woNoDeadline = makeWorkOrder({
      id: 'wo-123',
      clientName: 'No Deadline Client',
      status: 'Lead',
    });
    useWorkOrderStore.setState({ workOrders: [woNoDeadline] });
    renderDetail();

    expect(screen.getByText('No Deadline Client')).toBeInTheDocument();
    expect(screen.queryByText(/workOrderDetail\.deadline/)).not.toBeInTheDocument();
  });

  // ── AC #3: Edit button ──

  it('opens edit form when Edit button is clicked', async () => {
    useWorkOrderStore.setState({ workOrders: [mockWO] });
    renderDetail();
    const user = userEvent.setup();

    await user.click(screen.getByText('workOrderDetail.editWorkOrder'));

    const clientInput = screen.getByLabelText('workOrders.form.clientName') as HTMLInputElement;
    expect(clientInput.value).toBe('Test Client');
  });

  // ── AC #4: Status Stepper ──

  it('renders StatusStepper with current status', () => {
    useWorkOrderStore.setState({ workOrders: [mockWO] });
    renderDetail();

    expect(screen.getByRole('group', { name: 'workOrders.statusStepper.label' })).toBeInTheDocument();
  });

  it('calls updateWorkOrder when a status step is clicked', async () => {
    mockUpdateWorkOrder.mockResolvedValueOnce(undefined);
    useWorkOrderStore.setState({ workOrders: [mockWO] });
    renderDetail();
    const user = userEvent.setup();

    // mockWO is 'Production'; click 'Shipped' step to change status
    await user.click(screen.getByRole('button', { name: 'workOrders.status.Shipped' }));

    expect(mockUpdateWorkOrder).toHaveBeenCalledWith(
      'wo-123',
      { status: 'Shipped' },
      'workOrders.toast.statusChanged|status=workOrders.status.Shipped',
    );
  });

  // ── AC #5: Nutrition Label ──

  it('renders NutritionLabel component', () => {
    useWorkOrderStore.setState({ workOrders: [mockWO] });
    useTransactionStore.setState({ transactions: mockTransactions });
    renderDetail();

    expect(screen.getByText('nutritionLabel.title')).toBeInTheDocument();
  });

  // ── AC #6: Transactions list sorted by date ──

  it('renders transaction list sorted by date (newest first)', () => {
    useWorkOrderStore.setState({ workOrders: [mockWO] });
    useTransactionStore.setState({ transactions: mockTransactions });
    renderDetail();

    // Scope to the transactions section to avoid NutritionLabel's sub-items
    const heading = screen.getByText('workOrderDetail.transactionsTitle');
    const section = heading.closest('section')!;
    const listItems = within(section).getAllByRole('listitem');

    // Only 3 transactions linked to wo-123 (txn-unlinked is for wo-999)
    expect(listItems).toHaveLength(3);

    // Newest first: txn-2 (Feb 7) → txn-1 (Feb 5) → txn-3 (Feb 1)
    expect(listItems[0]).toHaveTextContent('Revenue Client');
    expect(listItems[1]).toHaveTextContent('Supplier Alpha');
    expect(listItems[2]).toHaveTextContent('Material Co');
  });

  it('shows transaction details: vendor name, formatted amount, category badge', () => {
    useWorkOrderStore.setState({ workOrders: [mockWO] });
    useTransactionStore.setState({ transactions: mockTransactions });
    renderDetail();

    const heading = screen.getByText('workOrderDetail.transactionsTitle');
    const section = heading.closest('section')!;

    // Vendor names
    expect(within(section).getByText('Supplier Alpha')).toBeInTheDocument();
    expect(within(section).getByText('Revenue Client')).toBeInTheDocument();
    expect(within(section).getByText('Material Co')).toBeInTheDocument();

    // Formatted amounts: 5000 agora=₪50.00, 15000=₪150.00, 3000=₪30.00
    expect(within(section).getByText('₪50.00')).toBeInTheDocument();
    expect(within(section).getByText('₪150.00')).toBeInTheDocument();
    expect(within(section).getByText('₪30.00')).toBeInTheDocument();

    // Category badges (i18n mock returns key as text)
    expect(within(section).getAllByText('transactions.category.DirectCost')).toHaveLength(2);
    expect(within(section).getByText('transactions.category.Revenue')).toBeInTheDocument();
  });

  it('does not show transactions from other work orders', () => {
    useWorkOrderStore.setState({ workOrders: [mockWO] });
    useTransactionStore.setState({ transactions: mockTransactions });
    renderDetail();

    const heading = screen.getByText('workOrderDetail.transactionsTitle');
    const section = heading.closest('section')!;

    expect(within(section).queryByText('Unlinked Vendor')).not.toBeInTheDocument();
  });

  // ── AC #7: Empty transactions state ──

  it('shows empty transactions state when no transactions linked', () => {
    useWorkOrderStore.setState({ workOrders: [mockWO] });
    useTransactionStore.setState({ transactions: [] });
    renderDetail();

    expect(screen.getByText('workOrderDetail.noTransactions')).toBeInTheDocument();
    expect(screen.getByText('workOrderDetail.noTransactionsHint')).toBeInTheDocument();
  });

  // ── AC #8: Add Transaction ──

  it('shows "Add Transaction" button', () => {
    useWorkOrderStore.setState({ workOrders: [mockWO] });
    useTransactionStore.setState({ transactions: mockTransactions });
    renderDetail();

    expect(screen.getByText('workOrderDetail.addTransaction')).toBeInTheDocument();
  });

  it('opens TransactionForm when "Add Transaction" clicked', async () => {
    useWorkOrderStore.setState({ workOrders: [mockWO] });
    useTransactionStore.setState({ transactions: mockTransactions });
    renderDetail();
    const user = userEvent.setup();

    await user.click(screen.getByText('workOrderDetail.addTransaction'));

    expect(screen.getByText('transactions.form.title')).toBeInTheDocument();
  });

  // ── AC #9: Not found state ──

  it('shows not-found error state for invalid Work Order ID', () => {
    useWorkOrderStore.setState({ workOrders: [mockWO] });
    renderDetail('nonexistent-id');

    expect(screen.getByText('workOrderDetail.notFound')).toBeInTheDocument();
    expect(screen.getByText('workOrderDetail.notFoundDescription')).toBeInTheDocument();
    expect(screen.getByText('workOrderDetail.backToWorkOrders')).toBeInTheDocument();
  });

  // ── AC #2: Back navigation ──

  it('shows back navigation link', () => {
    useWorkOrderStore.setState({ workOrders: [mockWO] });
    renderDetail();

    expect(screen.getByText('workOrderDetail.backToList')).toBeInTheDocument();
  });

  it('navigates back to work orders list when back button is clicked', async () => {
    useWorkOrderStore.setState({ workOrders: [mockWO] });
    renderDetail();
    const user = userEvent.setup();

    await user.click(screen.getByText('workOrderDetail.backToList'));

    expect(screen.getByText('Work Orders List')).toBeInTheDocument();
  });

  // ── Loading state ──

  it('shows loading skeleton while data loads', () => {
    useWorkOrderStore.setState({ loading: true });
    renderDetail();

    const skeleton = document.querySelector('[aria-busy="true"]');
    expect(skeleton).toBeTruthy();
  });

  it('does not show not-found state while still loading', () => {
    useWorkOrderStore.setState({ loading: true });
    renderDetail();

    expect(screen.queryByText('workOrderDetail.notFound')).not.toBeInTheDocument();
  });

  // ── AC Scoop: Scoop button and modal ──

  it('shows Scoop button in transactions section', () => {
    useWorkOrderStore.setState({ workOrders: [mockWO] });
    useTransactionStore.setState({ transactions: mockTransactions });
    renderDetail();

    expect(screen.getByText('inventory.scoop.action')).toBeInTheDocument();
  });

  it('opens ScoopModal when Scoop button is clicked', async () => {
    useWorkOrderStore.setState({ workOrders: [mockWO] });
    useTransactionStore.setState({ transactions: mockTransactions });
    useInventoryStore.setState({
      inventory: [
        {
          id: 'item-1',
          name: 'Cardboard',
          sku: null,
          supplier: null,
          currentQty: 100,
          wacAgora: 350,
          reorderThreshold: null,
          unit: 'sheets',
          createdAt: new Date('2026-01-01'),
          updatedAt: new Date('2026-01-15'),
        },
      ],
    });
    renderDetail();
    const user = userEvent.setup();

    await user.click(screen.getByText('inventory.scoop.action'));

    expect(screen.getByText('inventory.scoop.title')).toBeInTheDocument();
  });
});
