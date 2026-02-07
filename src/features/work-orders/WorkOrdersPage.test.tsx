import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useWorkOrderStore } from '@/stores';
import type { WorkOrder } from '@/types';

// Mock hooks
const mockCreateWorkOrder = vi.fn();
const mockUpdateWorkOrder = vi.fn();

vi.mock('./hooks', () => ({
  useWorkOrders: () => useWorkOrderStore(),
  useWorkOrderActions: () => ({
    createWorkOrder: mockCreateWorkOrder,
    updateWorkOrder: mockUpdateWorkOrder,
  }),
}));

// Mock zodResolver for the form
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

const mockWorkOrders: WorkOrder[] = [
  {
    id: 'wo-1',
    clientName: "David's Game",
    projectDescription: 'Custom board game',
    deadline: new Date('2026-06-01'),
    status: 'Production',
    revenueTotalAgora: 50000,
    directCostAgora: 20000,
    inventoryCostAgora: 5000,
    overheadAllocationAgora: 3000,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'wo-2',
    clientName: 'Rina Wedding Game',
    projectDescription: '',
    deadline: null,
    status: 'Lead',
    revenueTotalAgora: 0,
    directCostAgora: 0,
    inventoryCostAgora: 0,
    overheadAllocationAgora: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

// Pre-load module with Phosphor icons to avoid per-test timeout
let WorkOrdersPage: typeof import('./WorkOrdersPage').WorkOrdersPage;

describe('WorkOrdersPage', () => {
  beforeAll(async () => {
    const mod = await import('./WorkOrdersPage');
    WorkOrdersPage = mod.WorkOrdersPage;
  }, 30000);

  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
    useWorkOrderStore.setState({
      workOrders: [],
      loading: false,
      error: null,
    });
  });

  function renderPage() {
    return render(<WorkOrdersPage />);
  }

  it('renders page title', () => {
    renderPage();
    expect(screen.getByText('workOrders.title')).toBeInTheDocument();
  });

  it('shows loading skeleton when loading', () => {
    useWorkOrderStore.setState({ loading: true });
    renderPage();
    const skeleton = document.querySelector('[aria-busy="true"]');
    expect(skeleton).toBeTruthy();
  });

  it('shows empty state when no work orders', () => {
    renderPage();
    expect(screen.getByText('workOrders.emptyState.title')).toBeInTheDocument();
    expect(screen.getByText('workOrders.emptyState.description')).toBeInTheDocument();
    expect(screen.getByText('workOrders.emptyState.cta')).toBeInTheDocument();
  });

  it('renders list of work orders', () => {
    useWorkOrderStore.setState({ workOrders: mockWorkOrders });
    renderPage();

    expect(screen.getByText("David's Game")).toBeInTheDocument();
    expect(screen.getByText('Rina Wedding Game')).toBeInTheDocument();
    expect(screen.getByText('Custom board game')).toBeInTheDocument();
    expect(screen.getByText('workOrders.card.noDescription')).toBeInTheDocument();
  });

  it('shows create form when "New Work Order" button is clicked', async () => {
    useWorkOrderStore.setState({ workOrders: mockWorkOrders });
    renderPage();
    const user = userEvent.setup();

    await user.click(screen.getByText('workOrders.newWorkOrder'));

    expect(screen.getByLabelText('workOrders.form.clientName')).toBeInTheDocument();
  });

  it('shows edit form when "Edit" button is clicked', async () => {
    useWorkOrderStore.setState({ workOrders: mockWorkOrders });
    renderPage();
    const user = userEvent.setup();

    const editButtons = screen.getAllByText('workOrders.card.edit');
    await user.click(editButtons[0]);

    const clientInput = screen.getByLabelText('workOrders.form.clientName') as HTMLInputElement;
    expect(clientInput.value).toBe("David's Game");
  });

  it('shows error message when error occurs', () => {
    useWorkOrderStore.setState({ error: 'Failed to load work orders' });
    renderPage();

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('workOrders.error.title')).toBeInTheDocument();
    expect(screen.getByText('Failed to load work orders')).toBeInTheDocument();
  });

  it('opens create form from empty state CTA', async () => {
    renderPage();
    const user = userEvent.setup();

    await user.click(screen.getByText('workOrders.emptyState.cta'));

    expect(screen.getByLabelText('workOrders.form.clientName')).toBeInTheDocument();
  });
});
