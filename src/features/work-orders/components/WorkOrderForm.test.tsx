import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock react-hook-form's zodResolver
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

// Pre-load module to avoid per-test timeout
let WorkOrderForm: typeof import('./WorkOrderForm').WorkOrderForm;

describe('WorkOrderForm', () => {
  const mockOnSubmit = vi.fn();
  const mockOnCancel = vi.fn();

  beforeAll(async () => {
    const mod = await import('./WorkOrderForm');
    WorkOrderForm = mod.WorkOrderForm;
  }, 30000);

  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  function renderForm(props: Record<string, unknown> = {}) {
    return render(
      <WorkOrderForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        {...props}
      />
    );
  }

  it('renders all form fields', () => {
    renderForm();

    expect(screen.getByLabelText('workOrders.form.clientName')).toBeInTheDocument();
    expect(screen.getByLabelText('workOrders.form.projectDescription')).toBeInTheDocument();
    expect(screen.getByLabelText('workOrders.form.deadline')).toBeInTheDocument();
    expect(screen.getByText('workOrders.form.status')).toBeInTheDocument();
  });

  it('shows create button in create mode', () => {
    renderForm();

    expect(screen.getByRole('button', { name: 'workOrders.form.create' })).toBeInTheDocument();
  });

  it('shows update button in edit mode', () => {
    renderForm({ isEdit: true });

    expect(screen.getByRole('button', { name: 'workOrders.form.update' })).toBeInTheDocument();
  });

  it('validates required Client Name on submit', async () => {
    renderForm();
    const user = userEvent.setup();

    const submitBtn = screen.getByRole('button', { name: 'workOrders.form.create' });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('submits valid data', async () => {
    renderForm();
    const user = userEvent.setup();

    const clientInput = screen.getByLabelText('workOrders.form.clientName');
    await user.type(clientInput, "David's Game");

    const submitBtn = screen.getByRole('button', { name: 'workOrders.form.create' });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledTimes(1);
    });
    const callArgs = mockOnSubmit.mock.calls[0][0];
    expect(callArgs).toEqual(expect.objectContaining({ clientName: "David's Game" }));
  });

  it('pre-fills fields in edit mode', () => {
    renderForm({
      isEdit: true,
      defaultValues: {
        clientName: 'Existing Client',
        projectDescription: 'Game project',
        deadline: new Date('2026-08-15'),
        status: 'Production',
      },
    });

    const clientInput = screen.getByLabelText('workOrders.form.clientName') as HTMLInputElement;
    expect(clientInput.value).toBe('Existing Client');

    const descInput = screen.getByLabelText('workOrders.form.projectDescription') as HTMLInputElement;
    expect(descInput.value).toBe('Game project');

    const deadlineInput = screen.getByLabelText('workOrders.form.deadline') as HTMLInputElement;
    expect(deadlineInput.value).toBe('2026-08-15');
  });

  it('calls onCancel when cancel button is clicked', async () => {
    renderForm();
    const user = userEvent.setup();

    const cancelBtn = screen.getByRole('button', { name: 'workOrders.form.cancel' });
    await user.click(cancelBtn);

    expect(mockOnCancel).toHaveBeenCalledTimes(1);
  });
});
