import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

// Mock Phosphor icons — include all icons used transitively
vi.mock('@phosphor-icons/react', () => {
  const iconStub = (name: string) =>
    function MockIcon({ className }: { size?: number; className?: string; weight?: string }) {
      return <svg data-testid={`icon-${name}`} className={className} />;
    };

  return {
    Receipt: iconStub('Receipt'),
    Plus: iconStub('Plus'),
    Repeat: iconStub('Repeat'),
    Desktop: iconStub('Desktop'),
    ForkKnife: iconStub('ForkKnife'),
    Buildings: iconStub('Buildings'),
    DotsThreeCircle: iconStub('DotsThreeCircle'),
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

const { OverheadForm } = await import('./OverheadForm');

describe('OverheadForm', () => {
  const mockSubmit = vi.fn().mockResolvedValue(undefined);
  const mockCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all form fields', () => {
    render(<OverheadForm onSubmit={mockSubmit} onCancel={mockCancel} />);
    expect(screen.getByText('overhead.form.title')).toBeInTheDocument();
    expect(screen.getByText('overhead.form.category')).toBeInTheDocument();
    expect(screen.getByLabelText('overhead.form.amount')).toBeInTheDocument();
    expect(screen.getByLabelText('overhead.form.date')).toBeInTheDocument();
    expect(screen.getByLabelText('overhead.form.description')).toBeInTheDocument();
    expect(screen.getByText('overhead.form.recurrence')).toBeInTheDocument();
  });

  it('date defaults to today', () => {
    render(<OverheadForm onSubmit={mockSubmit} onCancel={mockCancel} />);
    const dateInput = screen.getByLabelText('overhead.form.date') as HTMLInputElement;
    const today = new Date().toISOString().split('T')[0];
    expect(dateInput.value).toBe(today);
  });

  it('shows error when submitting without category', async () => {
    render(<OverheadForm onSubmit={mockSubmit} onCancel={mockCancel} />);

    // Fill in amount so only category is missing
    const amountInput = screen.getByLabelText('overhead.form.amount');
    fireEvent.change(amountInput, { target: { value: '50' } });

    fireEvent.click(screen.getByText('overhead.form.submit'));

    await waitFor(() => {
      expect(screen.getByText('overhead.form.categoryRequired')).toBeInTheDocument();
    });
    expect(mockSubmit).not.toHaveBeenCalled();
  });

  it('shows error for zero amount', async () => {
    render(<OverheadForm onSubmit={mockSubmit} onCancel={mockCancel} />);

    // Submit without changing amount (default 0)
    fireEvent.click(screen.getByText('overhead.form.submit'));

    await waitFor(() => {
      expect(screen.getByText('overhead.form.amountError')).toBeInTheDocument();
    });
    expect(mockSubmit).not.toHaveBeenCalled();
  });

  it('calls onCancel when cancel button clicked', () => {
    render(<OverheadForm onSubmit={mockSubmit} onCancel={mockCancel} />);
    fireEvent.click(screen.getByText('overhead.form.cancel'));
    expect(mockCancel).toHaveBeenCalledTimes(1);
  });

  it('calls onSubmit with correct data shape', async () => {
    render(<OverheadForm onSubmit={mockSubmit} onCancel={mockCancel} />);

    // Open category dropdown and select an option
    const categoryTrigger = screen.getByRole('button', { name: /overhead\.form\.category/i });
    fireEvent.click(categoryTrigger);
    const option = await screen.findByRole('option', { name: 'overhead.categories.meals' });
    fireEvent.click(option);

    // Fill in amount
    const amountInput = screen.getByLabelText('overhead.form.amount');
    fireEvent.change(amountInput, { target: { value: '150' } });

    // Date already defaults to today — leave as-is

    // Fill in description
    const descInput = screen.getByLabelText('overhead.form.description');
    fireEvent.change(descInput, { target: { value: 'Team lunch' } });

    // Submit the form
    fireEvent.click(screen.getByText('overhead.form.submit'));

    await waitFor(() => {
      expect(mockSubmit).toHaveBeenCalledTimes(1);
    });

    const submittedData = mockSubmit.mock.calls[0][0];
    expect(submittedData.category).toBe('meals');
    expect(submittedData.amountIls).toBe(150);
    expect(submittedData.date).toBe(new Date().toISOString().split('T')[0]);
    expect(submittedData.description).toBe('Team lunch');
    expect(submittedData.recurrence).toBe('one_time');
  });

  it('disables submit button while submitting', async () => {
    // Create a promise that we control to keep the form in submitting state
    let resolveSubmit!: () => void;
    const slowSubmit = vi.fn(
      () => new Promise<void>((resolve) => { resolveSubmit = resolve; }),
    );

    render(<OverheadForm onSubmit={slowSubmit} onCancel={mockCancel} />);

    // Select a category
    const categoryTrigger = screen.getByRole('button', { name: /overhead\.form\.category/i });
    fireEvent.click(categoryTrigger);
    const option = await screen.findByRole('option', { name: 'overhead.categories.software' });
    fireEvent.click(option);

    // Fill in amount
    const amountInput = screen.getByLabelText('overhead.form.amount');
    fireEvent.change(amountInput, { target: { value: '50' } });

    // Submit
    fireEvent.click(screen.getByText('overhead.form.submit'));

    // While submitting, submit button should be disabled
    // (Button component replaces text with spinner when loading, so find by type)
    await waitFor(() => {
      const submitBtn = document.querySelector('button[type="submit"]')!;
      expect(submitBtn).toBeDisabled();
      expect(submitBtn).toHaveAttribute('aria-busy', 'true');
    });

    // Resolve the promise to clean up
    resolveSubmit();
    await waitFor(() => {
      const submitBtn = document.querySelector('button[type="submit"]')!;
      expect(submitBtn).not.toBeDisabled();
    });
  });

  it('renders submit and cancel buttons', () => {
    render(<OverheadForm onSubmit={mockSubmit} onCancel={mockCancel} />);
    expect(screen.getByText('overhead.form.submit')).toBeInTheDocument();
    expect(screen.getByText('overhead.form.cancel')).toBeInTheDocument();
  });

  it('description is optional — can submit without it', async () => {
    render(<OverheadForm onSubmit={mockSubmit} onCancel={mockCancel} />);

    // Open category dropdown and select an option
    const categoryTrigger = screen.getByRole('button', { name: /overhead\.form\.category/i });
    fireEvent.click(categoryTrigger);
    const option = await screen.findByRole('option', { name: 'overhead.categories.software' });
    fireEvent.click(option);

    // Fill in amount
    const amountInput = screen.getByLabelText('overhead.form.amount');
    fireEvent.change(amountInput, { target: { value: '25' } });

    // Leave description empty, submit
    fireEvent.click(screen.getByText('overhead.form.submit'));

    await waitFor(() => {
      expect(mockSubmit).toHaveBeenCalledTimes(1);
    });

    // Description should default to empty string
    expect(mockSubmit.mock.calls[0][0].description).toBe('');
  });
});
