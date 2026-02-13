import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

vi.mock('@phosphor-icons/react', () => {
  const iconStub = (name: string) =>
    function MockIcon({ className }: { size?: number; className?: string }) {
      return <svg data-testid={`icon-${name}`} className={className} />;
    };

  return {
    // Toast component
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
    // Table
    ArrowUp: iconStub('ArrowUp'),
    ArrowDown: iconStub('ArrowDown'),
  };
});

const { InventoryForm } = await import('./InventoryForm');

describe('InventoryForm', () => {
  const defaultProps = {
    onSubmit: vi.fn(),
    onCancel: vi.fn(),
  };

  it('renders all create mode fields', () => {
    render(<InventoryForm {...defaultProps} />);
    expect(screen.getByLabelText('inventory.form.name')).toBeInTheDocument();
    expect(screen.getByLabelText('inventory.form.sku')).toBeInTheDocument();
    expect(screen.getByLabelText('inventory.form.supplier')).toBeInTheDocument();
    expect(screen.getByText('inventory.form.unit')).toBeInTheDocument();
    expect(screen.getByLabelText('inventory.form.initialQty')).toBeInTheDocument();
    expect(screen.getByLabelText('inventory.form.initialCostPerUnit')).toBeInTheDocument();
    expect(screen.getByLabelText('inventory.form.reorderThreshold')).toBeInTheDocument();
  });

  it('hides initialQty and initialCostPerUnit fields in edit mode (qty/WAC immutable)', () => {
    render(<InventoryForm {...defaultProps} isEdit />);
    expect(screen.queryByLabelText('inventory.form.initialQty')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('inventory.form.initialCostPerUnit')).not.toBeInTheDocument();
  });

  it('shows edit mode fields', () => {
    render(<InventoryForm {...defaultProps} isEdit />);
    expect(screen.getByLabelText('inventory.form.name')).toBeInTheDocument();
    expect(screen.getByLabelText('inventory.form.sku')).toBeInTheDocument();
    expect(screen.getByLabelText('inventory.form.supplier')).toBeInTheDocument();
    expect(screen.getByLabelText('inventory.form.reorderThreshold')).toBeInTheDocument();
  });

  it('pre-fills values in edit mode', () => {
    render(
      <InventoryForm
        {...defaultProps}
        isEdit
        defaultValues={{
          name: 'Fabric',
          sku: 'FAB-001',
          supplier: 'TextileCo',
          unit: 'meters',
          reorderThreshold: 20,
        }}
      />
    );
    expect(screen.getByLabelText('inventory.form.name')).toHaveValue('Fabric');
    expect(screen.getByLabelText('inventory.form.sku')).toHaveValue('FAB-001');
    expect(screen.getByLabelText('inventory.form.supplier')).toHaveValue('TextileCo');
  });

  it('shows create button in create mode', () => {
    render(<InventoryForm {...defaultProps} />);
    expect(screen.getByText('inventory.form.create')).toBeInTheDocument();
  });

  it('shows update button in edit mode', () => {
    render(<InventoryForm {...defaultProps} isEdit />);
    expect(screen.getByText('inventory.form.update')).toBeInTheDocument();
  });

  it('calls onCancel when cancel button clicked', () => {
    const onCancel = vi.fn();
    render(<InventoryForm {...defaultProps} onCancel={onCancel} />);
    fireEvent.click(screen.getByText('inventory.form.cancel'));
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it('shows validation error when name is empty on submit', async () => {
    const onSubmit = vi.fn();
    render(<InventoryForm onSubmit={onSubmit} onCancel={vi.fn()} />);

    fireEvent.click(screen.getByText('inventory.form.create'));

    await waitFor(() => {
      expect(screen.getByText('inventory.form.nameRequired')).toBeInTheDocument();
    });
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
