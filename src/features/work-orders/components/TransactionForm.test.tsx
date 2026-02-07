import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest';
import { render, screen, waitFor, cleanup, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useWorkOrderStore } from '@/stores';
import type { TransactionFormProps } from './TransactionForm';

// Mock zodResolver for the form
vi.mock('@hookform/resolvers/zod', () => ({
  zodResolver: () => async (values: Record<string, unknown>) => {
    const errors: Record<string, { message: string }> = {};
    if (!values.vendorName || (typeof values.vendorName === 'string' && values.vendorName.trim() === '')) {
      errors.vendorName = { message: 'Vendor name is required' };
    }
    if (values.amount === undefined || values.amount === null || isNaN(values.amount as number) || (values.amount as number) <= 0) {
      errors.amount = { message: 'Amount must be positive' };
    }
    return {
      values: Object.keys(errors).length === 0 ? values : {},
      errors,
    };
  },
}));

// Pre-load module to avoid per-test timeout
let TransactionForm: typeof import('./TransactionForm').TransactionForm;

describe('TransactionForm', () => {
  const mockOnSubmit = vi.fn();
  const mockOnCancel = vi.fn();

  beforeAll(async () => {
    const mod = await import('./TransactionForm');
    TransactionForm = mod.TransactionForm;
  }, 30000);

  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
    useWorkOrderStore.setState({
      workOrders: [
        {
          id: 'wo-1',
          clientName: "David's Game",
          projectDescription: 'Board game',
          deadline: null,
          status: 'Production',
          revenueTotalAgora: 50000,
          directCostAgora: 20000,
          inventoryCostAgora: 0,
          overheadAllocationAgora: 0,
          createdAt: new Date('2026-01-01'),
          updatedAt: new Date('2026-01-01'),
        },
        {
          id: 'wo-2',
          clientName: 'Rina Wedding',
          projectDescription: '',
          deadline: null,
          status: 'Lead',
          revenueTotalAgora: 0,
          directCostAgora: 0,
          inventoryCostAgora: 0,
          overheadAllocationAgora: 0,
          createdAt: new Date('2026-01-01'),
          updatedAt: new Date('2026-01-01'),
        },
      ],
      loading: false,
      error: null,
    });
  });

  function renderForm(props: Partial<TransactionFormProps> = {}) {
    return render(
      <TransactionForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        {...props}
      />,
    );
  }

  it('renders all form fields', () => {
    renderForm();

    expect(screen.getByLabelText('transactions.form.vendorName')).toBeInTheDocument();
    expect(screen.getByLabelText('transactions.form.amount')).toBeInTheDocument();
    expect(screen.getByText('transactions.form.currency')).toBeInTheDocument();
    expect(screen.getByLabelText('transactions.form.date')).toBeInTheDocument();
    expect(screen.getByText('transactions.form.category')).toBeInTheDocument();
    expect(screen.getByText('transactions.form.workOrder')).toBeInTheDocument();
    expect(screen.getByLabelText('transactions.form.notes')).toBeInTheDocument();
  });

  it('renders form title', () => {
    renderForm();

    expect(screen.getByText('transactions.form.title')).toBeInTheDocument();
  });

  it('validates required vendor name on submit', async () => {
    renderForm();
    const user = userEvent.setup();

    const submitBtn = screen.getByRole('button', { name: 'transactions.form.submit' });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(screen.getAllByRole('alert').length).toBeGreaterThan(0);
    });
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('calls onCancel when cancel button is clicked', async () => {
    renderForm();
    const user = userEvent.setup();

    const cancelBtn = screen.getByRole('button', { name: 'transactions.form.cancel' });
    await user.click(cancelBtn);

    expect(mockOnCancel).toHaveBeenCalledTimes(1);
  });

  it('renders submit button with correct label', () => {
    renderForm();

    expect(screen.getByRole('button', { name: 'transactions.form.submit' })).toBeInTheDocument();
  });

  it('renders cancel button', () => {
    renderForm();

    expect(screen.getByRole('button', { name: 'transactions.form.cancel' })).toBeInTheDocument();
  });

  it('shows currency estimate helper for non-ILS currency', async () => {
    renderForm();
    const user = userEvent.setup();

    // Type an amount in the amount field
    const amountInput = screen.getByLabelText('transactions.form.amount');
    await user.type(amountInput, '100');

    // Change currency to USD — click the currency dropdown button, then select USD
    const currencyLabel = screen.getByText('transactions.form.currency');
    const currencySection = currencyLabel.closest('div');
    const currencyButton = currencySection!.querySelector('button')!;
    fireEvent.click(currencyButton);

    // Select USD option from the dropdown
    const usdOption = await screen.findByText('$ USD');
    fireEvent.click(usdOption);

    // Estimate text should appear (mocked i18n returns key with interpolated params)
    await waitFor(() => {
      const estimateEl = document.querySelector('[class*="estimateText"]');
      expect(estimateEl).toBeTruthy();
    });
  });

  it('calls onSubmit with correct data for valid form', async () => {
    mockOnSubmit.mockResolvedValue(undefined);
    renderForm();
    const user = userEvent.setup();

    // Fill in vendor name
    await user.type(screen.getByLabelText('transactions.form.vendorName'), 'Test Vendor');

    // Fill in amount
    await user.type(screen.getByLabelText('transactions.form.amount'), '82.50');

    // Select category — click category dropdown
    const categoryLabel = screen.getByText('transactions.form.category');
    const categorySection = categoryLabel.closest('div');
    const categoryButton = categorySection!.querySelector('button')!;
    fireEvent.click(categoryButton);
    const directCostOption = await screen.findByText('transactions.category.DirectCost');
    fireEvent.click(directCostOption);

    // Submit the form
    const submitBtn = screen.getByRole('button', { name: 'transactions.form.submit' });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledTimes(1);
    });

    const submittedData = mockOnSubmit.mock.calls[0][0];
    expect(submittedData.vendorName).toBe('Test Vendor');
    expect(submittedData.currency).toBe('ILS');
  });

  it('renders work order dropdown with options from store', () => {
    renderForm();

    // The WO dropdown should show work order names from the store
    const woLabel = screen.getByText('transactions.form.workOrder');
    const woSection = woLabel.closest('div');
    const woButton = woSection!.querySelector('button')!;
    fireEvent.click(woButton);

    expect(screen.getByText("David's Game")).toBeInTheDocument();
    expect(screen.getByText('Rina Wedding')).toBeInTheDocument();
  });
});
