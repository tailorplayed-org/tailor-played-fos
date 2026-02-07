import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest';
import { render, screen, within, cleanup } from '@testing-library/react';
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

function makeOrder(overrides: Partial<WorkOrder> & { id: string; clientName: string }): WorkOrder {
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

const mockWorkOrders: WorkOrder[] = [
  makeOrder({
    id: 'wo-1',
    clientName: "David's Game",
    projectDescription: 'Custom board game',
    deadline: new Date('2026-06-01'),
    status: 'Production',
    revenueTotalAgora: 50000,
    directCostAgora: 20000,
    inventoryCostAgora: 5000,
    overheadAllocationAgora: 3000,
    updatedAt: new Date('2026-02-01'),
  }),
  makeOrder({
    id: 'wo-2',
    clientName: 'Rina Wedding Game',
    status: 'Lead',
    revenueTotalAgora: 0,
    updatedAt: new Date('2026-01-15'),
  }),
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

  // ── Existing Story 2.1 tests ──

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

  // ── Story 2.2 tests ──

  it('sorts work orders by status priority (Production first, Shipped last)', () => {
    const diverseOrders = [
      makeOrder({ id: 'wo-a', clientName: 'Lead Order', status: 'Lead', updatedAt: new Date('2026-01-10') }),
      makeOrder({ id: 'wo-b', clientName: 'Shipped Order', status: 'Shipped', updatedAt: new Date('2026-01-20') }),
      makeOrder({ id: 'wo-c', clientName: 'Production Order', status: 'Production', updatedAt: new Date('2026-01-15') }),
      makeOrder({ id: 'wo-d', clientName: 'Design Order', status: 'Design', updatedAt: new Date('2026-01-12') }),
    ];
    useWorkOrderStore.setState({ workOrders: diverseOrders });
    renderPage();

    const listItems = screen.getAllByRole('listitem');
    expect(within(listItems[0]).getByText('Production Order')).toBeInTheDocument();
    expect(within(listItems[1]).getByText('Design Order')).toBeInTheDocument();
    expect(within(listItems[2]).getByText('Lead Order')).toBeInTheDocument();
    expect(within(listItems[3]).getByText('Shipped Order')).toBeInTheDocument();
  });

  it('displays margin percentage with color coding for healthy margin', () => {
    // revenue=50000, cost=28000 → margin=44% → healthy
    useWorkOrderStore.setState({ workOrders: [mockWorkOrders[0]] });
    renderPage();

    expect(screen.getByText('44%')).toBeInTheDocument();
  });

  it('displays "—" for margin when revenue is 0', () => {
    // revenue=0 → show "—"
    useWorkOrderStore.setState({ workOrders: [mockWorkOrders[1]] });
    renderPage();

    expect(screen.getByText('workOrders.margin.noRevenue')).toBeInTheDocument();
  });

  it('displays margin color coding for watch margin (20-29%)', () => {
    // revenue=10000, cost=7500 → margin=25% → watch
    const watchOrder = makeOrder({
      id: 'wo-watch',
      clientName: 'Watch Margin Project',
      revenueTotalAgora: 10000,
      directCostAgora: 7500,
    });
    useWorkOrderStore.setState({ workOrders: [watchOrder] });
    renderPage();

    expect(screen.getByText('25%')).toBeInTheDocument();
  });

  it('displays margin color coding for danger margin (< 20%)', () => {
    // revenue=10000, cost=9000 → margin=10% → danger
    const dangerOrder = makeOrder({
      id: 'wo-danger',
      clientName: 'Danger Margin Project',
      revenueTotalAgora: 10000,
      directCostAgora: 9000,
    });
    useWorkOrderStore.setState({ workOrders: [dangerOrder] });
    renderPage();

    expect(screen.getByText('10%')).toBeInTheDocument();
  });

  it('applies cardDanger class to cards with margin < 20% and revenue > 0', () => {
    // revenue=10000, cost=9000 → margin=10% → danger → red-tinted border
    const dangerOrder = makeOrder({
      id: 'wo-danger',
      clientName: 'Danger Border Project',
      revenueTotalAgora: 10000,
      directCostAgora: 9000,
    });
    useWorkOrderStore.setState({ workOrders: [dangerOrder] });
    renderPage();

    let el: HTMLElement | null = screen.getByText('Danger Border Project');
    while (el && !el.className?.includes('cardDanger')) {
      el = el.parentElement;
    }
    expect(el).not.toBeNull();
    expect(el?.className).toContain('cardDanger');
  });

  it('does not apply cardDanger class when revenue is 0 even though margin is 0%', () => {
    // revenue=0 → margin=0% → danger status, but no revenue → no danger border
    useWorkOrderStore.setState({ workOrders: [mockWorkOrders[1]] });
    renderPage();

    let el: HTMLElement | null = screen.getByText('Rina Wedding Game');
    while (el && !el.className?.includes('card')) {
      el = el.parentElement;
    }
    expect(el?.className).not.toContain('cardDanger');
  });

  it('expands StatusStepper on status area click', async () => {
    useWorkOrderStore.setState({ workOrders: mockWorkOrders });
    renderPage();
    const user = userEvent.setup();

    // Before click — no stepper group visible
    expect(screen.queryByRole('group', { name: 'workOrders.statusStepper.label' })).not.toBeInTheDocument();

    // Click the status area (Change Status button)
    const changeStatusButtons = screen.getAllByLabelText('workOrders.card.changeStatus');
    await user.click(changeStatusButtons[0]);

    // Stepper should now be visible
    expect(screen.getByRole('group', { name: 'workOrders.statusStepper.label' })).toBeInTheDocument();
  });

  it('calls updateWorkOrder on status change via StatusStepper', async () => {
    mockUpdateWorkOrder.mockResolvedValue(undefined);
    useWorkOrderStore.setState({ workOrders: mockWorkOrders });
    renderPage();
    const user = userEvent.setup();

    // Open stepper on first card (Production status)
    const changeStatusButtons = screen.getAllByLabelText('workOrders.card.changeStatus');
    await user.click(changeStatusButtons[0]);

    // Click "Shipped" step in the stepper
    await user.click(screen.getByRole('button', { name: 'workOrders.status.Shipped' }));

    expect(mockUpdateWorkOrder).toHaveBeenCalledWith('wo-1', { status: 'Shipped' }, expect.any(String));
  });

  it('applies muted styling class to shipped cards', () => {
    const shippedOrder = makeOrder({
      id: 'wo-shipped',
      clientName: 'Shipped Project',
      status: 'Shipped',
      revenueTotalAgora: 10000,
      directCostAgora: 5000,
    });
    useWorkOrderStore.setState({ workOrders: [shippedOrder] });
    renderPage();

    // Walk up from text to find the element with cardShipped class
    let el: HTMLElement | null = screen.getByText('Shipped Project');
    while (el && !el.className?.includes('cardShipped')) {
      el = el.parentElement;
    }
    expect(el).not.toBeNull();
    expect(el?.className).toContain('cardShipped');
  });

  it('only opens one stepper at a time', async () => {
    useWorkOrderStore.setState({ workOrders: mockWorkOrders });
    renderPage();
    const user = userEvent.setup();

    const changeStatusButtons = screen.getAllByLabelText('workOrders.card.changeStatus');

    // Open first card stepper
    await user.click(changeStatusButtons[0]);
    expect(screen.getAllByRole('group', { name: 'workOrders.statusStepper.label' })).toHaveLength(1);

    // Open second card stepper — first should close
    await user.click(changeStatusButtons[1]);
    expect(screen.getAllByRole('group', { name: 'workOrders.statusStepper.label' })).toHaveLength(1);
  });

  it('toggles stepper off when clicking same status area', async () => {
    useWorkOrderStore.setState({ workOrders: mockWorkOrders });
    renderPage();
    const user = userEvent.setup();

    const changeStatusButtons = screen.getAllByLabelText('workOrders.card.changeStatus');

    // Open
    await user.click(changeStatusButtons[0]);
    expect(screen.getByRole('group', { name: 'workOrders.statusStepper.label' })).toBeInTheDocument();

    // Close
    await user.click(changeStatusButtons[0]);
    expect(screen.queryByRole('group', { name: 'workOrders.statusStepper.label' })).not.toBeInTheDocument();
  });

  it('displays transaction count placeholder (0)', () => {
    useWorkOrderStore.setState({ workOrders: [mockWorkOrders[0]] });
    renderPage();

    // AC 1: "cost count (number of linked transactions — show 0 for now)"
    expect(screen.getByText('0 workOrders.card.transactions')).toBeInTheDocument();
  });

  it('displays formatted revenue for cards with revenue', () => {
    useWorkOrderStore.setState({ workOrders: [mockWorkOrders[0]] });
    renderPage();

    // formatCurrency(50000 agora) = ₪500.00
    expect(screen.getByText('₪500.00')).toBeInTheDocument();
  });
});
