import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

// Mock Select component
vi.mock('@/components/Input/Select', () => ({
  Select: ({
    options,
    value,
    onChange,
    searchable,
  }: {
    options: Array<{ value: string; label: string }>;
    value?: string;
    onChange?: (val: string) => void;
    searchable?: boolean;
    label: string;
    hideLabel?: boolean;
  }) => (
    <div data-testid="select-dropdown" data-searchable={searchable}>
      <button data-testid="select-trigger">
        {options.find((o) => o.value === value)?.label ?? ''}
      </button>
      <ul role="listbox">
        {options.map((opt) => (
          <li
            key={opt.value}
            role="option"
            aria-selected={opt.value === value}
            onClick={() => onChange?.(opt.value)}
          >
            {opt.label}
          </li>
        ))}
      </ul>
    </div>
  ),
}));

import { GhostTextField } from './GhostTextField';

const categoryOptions = [
  { value: 'DirectCost', label: 'Direct Cost' },
  { value: 'InventoryRestock', label: 'Inventory Restock' },
  { value: 'Overhead', label: 'Overhead' },
  { value: 'Revenue', label: 'Revenue' },
  { value: 'Personal', label: 'Personal' },
];

describe('GhostTextField', () => {
  // ─── AI-suggested (default) state ───

  it('renders AI-suggested state with label and display value', () => {
    render(
      <GhostTextField
        label="Category"
        value="DirectCost"
        type="category"
        options={categoryOptions}
        isEdited={false}
        onChange={vi.fn()}
      />,
    );

    expect(screen.getByText('Category')).toBeInTheDocument();
    expect(screen.getByText('Direct Cost')).toBeInTheDocument();
  });

  it('renders with button role and aria-label when interactive', () => {
    render(
      <GhostTextField
        label="Category"
        value="DirectCost"
        type="category"
        options={categoryOptions}
        isEdited={false}
        onChange={vi.fn()}
      />,
    );

    const field = screen.getByRole('button');
    expect(field).toHaveAttribute('aria-label', 'Category: Direct Cost');
    expect(field).toHaveAttribute('tabindex', '0');
  });

  it('falls back to raw value when no matching option found', () => {
    render(
      <GhostTextField
        label="Category"
        value="Unknown"
        type="category"
        options={categoryOptions}
        isEdited={false}
        onChange={vi.fn()}
      />,
    );

    expect(screen.getByText('Unknown')).toBeInTheDocument();
  });

  // ─── Edit mode activation ───

  it('activates edit mode on click — renders searchable Select', () => {
    render(
      <GhostTextField
        label="Category"
        value="DirectCost"
        type="category"
        options={categoryOptions}
        isEdited={false}
        onChange={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole('button'));

    expect(screen.getByTestId('select-dropdown')).toBeInTheDocument();
    expect(screen.getByTestId('select-dropdown')).toHaveAttribute(
      'data-searchable',
      'true',
    );
  });

  it('activates edit mode on Enter key press', () => {
    render(
      <GhostTextField
        label="Category"
        value="DirectCost"
        type="category"
        options={categoryOptions}
        isEdited={false}
        onChange={vi.fn()}
      />,
    );

    fireEvent.keyDown(screen.getByRole('button'), { key: 'Enter' });
    expect(screen.getByTestId('select-dropdown')).toBeInTheDocument();
  });

  it('activates edit mode on Space key press', () => {
    render(
      <GhostTextField
        label="Category"
        value="DirectCost"
        type="category"
        options={categoryOptions}
        isEdited={false}
        onChange={vi.fn()}
      />,
    );

    fireEvent.keyDown(screen.getByRole('button'), { key: ' ' });
    expect(screen.getByTestId('select-dropdown')).toBeInTheDocument();
  });

  it('calls onDropdownToggle(true) when activated', () => {
    const onDropdownToggle = vi.fn();
    render(
      <GhostTextField
        label="Category"
        value="DirectCost"
        type="category"
        options={categoryOptions}
        isEdited={false}
        onChange={vi.fn()}
        onDropdownToggle={onDropdownToggle}
      />,
    );

    fireEvent.click(screen.getByRole('button'));
    expect(onDropdownToggle).toHaveBeenCalledWith(true);
  });

  // ─── Selection ───

  it('calls onChange when option is selected', () => {
    const onChange = vi.fn();
    render(
      <GhostTextField
        label="Category"
        value="DirectCost"
        type="category"
        options={categoryOptions}
        isEdited={false}
        onChange={onChange}
      />,
    );

    // Activate
    fireEvent.click(screen.getByRole('button'));
    // Select an option
    fireEvent.click(screen.getByText('Overhead'));

    expect(onChange).toHaveBeenCalledWith('Overhead');
  });

  it('calls onDropdownToggle(false) when option is selected', () => {
    const onDropdownToggle = vi.fn();
    render(
      <GhostTextField
        label="Category"
        value="DirectCost"
        type="category"
        options={categoryOptions}
        isEdited={false}
        onChange={vi.fn()}
        onDropdownToggle={onDropdownToggle}
      />,
    );

    fireEvent.click(screen.getByRole('button'));
    fireEvent.click(screen.getByText('Overhead'));

    expect(onDropdownToggle).toHaveBeenCalledWith(false);
  });

  it('exits edit mode after selecting an option', () => {
    render(
      <GhostTextField
        label="Category"
        value="DirectCost"
        type="category"
        options={categoryOptions}
        isEdited={false}
        onChange={vi.fn()}
      />,
    );

    // Activate
    fireEvent.click(screen.getByRole('button'));
    expect(screen.getByTestId('select-dropdown')).toBeInTheDocument();

    // Select
    fireEvent.click(screen.getByText('Overhead'));

    // Select should no longer be visible; ghost field display returns
    expect(screen.queryByTestId('select-dropdown')).not.toBeInTheDocument();
  });

  // ─── User-edited state ───

  it('shows checkmark when isEdited is true', () => {
    render(
      <GhostTextField
        label="Category"
        value="DirectCost"
        type="category"
        options={categoryOptions}
        isEdited={true}
        onChange={vi.fn()}
      />,
    );

    expect(screen.getByText('✓')).toBeInTheDocument();
  });

  it('does not show checkmark when isEdited is false', () => {
    render(
      <GhostTextField
        label="Category"
        value="DirectCost"
        type="category"
        options={categoryOptions}
        isEdited={false}
        onChange={vi.fn()}
      />,
    );

    expect(screen.queryByText('✓')).not.toBeInTheDocument();
  });

  // ─── Readonly type ───

  it('readonly type renders without button role', () => {
    render(
      <GhostTextField
        label="Amount"
        value="₪82.50"
        type="readonly"
        isEdited={false}
        onChange={vi.fn()}
      />,
    );

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(screen.getByText('₪82.50')).toBeInTheDocument();
    expect(screen.getByText('Amount')).toBeInTheDocument();
  });

  it('readonly type does not activate on click', () => {
    render(
      <GhostTextField
        label="Amount"
        value="₪82.50"
        type="readonly"
        isEdited={false}
        onChange={vi.fn()}
      />,
    );

    const field = screen.getByTestId('ghost-text-field');
    fireEvent.click(field);
    expect(screen.queryByTestId('select-dropdown')).not.toBeInTheDocument();
  });

  // ─── Project type ───

  it('works with project type and project options', () => {
    const projectOptions = [
      { value: 'wo-1', label: "David's Game (Production)" },
      { value: 'wo-2', label: 'Logo Design (Design)' },
    ];

    render(
      <GhostTextField
        label="Project"
        value="wo-1"
        type="project"
        options={projectOptions}
        isEdited={false}
        onChange={vi.fn()}
      />,
    );

    expect(screen.getByText("David's Game (Production)")).toBeInTheDocument();

    // Activate and see dropdown
    fireEvent.click(screen.getByRole('button'));
    expect(screen.getByTestId('select-dropdown')).toBeInTheDocument();
    expect(screen.getByText('Logo Design (Design)')).toBeInTheDocument();
  });
});
