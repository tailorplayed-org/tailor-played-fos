import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Input } from './Input';
import { Select } from './Select';

describe('Input', () => {
  it('renders label', () => {
    render(<Input label="Name" />);
    expect(screen.getByLabelText('Name')).toBeTruthy();
  });

  it('renders sr-only label when hideLabel is true', () => {
    render(<Input label="Hidden" hideLabel />);
    const label = screen.getByText('Hidden');
    expect(label.className).toContain('srOnly');
  });

  it('shows error message', () => {
    render(<Input label="Email" error="Required" />);
    expect(screen.getByRole('alert').textContent).toBe('Required');
  });

  it('sets aria-invalid when error present', () => {
    render(<Input label="Email" error="Required" />);
    expect(screen.getByLabelText('Email').getAttribute('aria-invalid')).toBe('true');
  });

  it('shows helper text when no error', () => {
    render(<Input label="Name" helperText="Enter your name" />);
    expect(screen.getByText('Enter your name')).toBeTruthy();
  });

  it('hides helper text when error present', () => {
    render(<Input label="Name" helperText="Help" error="Error" />);
    expect(screen.queryByText('Help')).toBeNull();
    expect(screen.getByText('Error')).toBeTruthy();
  });

  it('handles value change', () => {
    const onChange = vi.fn();
    render(<Input label="Name" onChange={onChange} />);
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'abc' } });
    expect(onChange).toHaveBeenCalled();
  });

  it('applies error class on input', () => {
    render(<Input label="X" error="err" />);
    expect(screen.getByLabelText('X').className).toContain('inputError');
  });

  it('applies additional className', () => {
    const { container } = render(<Input label="Y" className="custom" />);
    expect(container.firstElementChild?.className).toContain('custom');
  });
});

describe('Select', () => {
  const options = [
    { value: 'a', label: 'Alpha' },
    { value: 'b', label: 'Beta' },
    { value: 'c', label: 'Charlie' },
  ];

  it('renders label', () => {
    render(<Select label="Choose" options={options} />);
    expect(screen.getByText('Choose')).toBeTruthy();
  });

  it('displays selected value', () => {
    render(<Select label="Choose" options={options} value="b" />);
    expect(screen.getByText('Beta')).toBeTruthy();
  });

  it('opens dropdown on click', () => {
    render(<Select label="Choose" options={options} />);
    fireEvent.click(screen.getByRole('button'));
    expect(screen.getByRole('listbox')).toBeTruthy();
  });

  it('selects option on click', () => {
    const onChange = vi.fn();
    render(<Select label="Choose" options={options} onChange={onChange} />);
    fireEvent.click(screen.getByRole('button'));
    fireEvent.click(screen.getByText('Alpha'));
    expect(onChange).toHaveBeenCalledWith('a');
  });

  it('closes on Escape', () => {
    render(<Select label="Choose" options={options} />);
    const trigger = screen.getByRole('button');
    fireEvent.click(trigger);
    expect(screen.getByRole('listbox')).toBeTruthy();
    fireEvent.keyDown(trigger, { key: 'Escape' });
    expect(screen.queryByRole('listbox')).toBeNull();
  });

  it('navigates with keyboard', () => {
    const onChange = vi.fn();
    render(<Select label="Choose" options={options} onChange={onChange} />);
    const trigger = screen.getByRole('button');
    fireEvent.keyDown(trigger, { key: 'ArrowDown' });
    // Dropdown should open
    expect(screen.getByRole('listbox')).toBeTruthy();
    fireEvent.keyDown(trigger, { key: 'ArrowDown' });
    fireEvent.keyDown(trigger, { key: 'Enter' });
    expect(onChange).toHaveBeenCalledWith('a');
  });

  it('shows error state', () => {
    render(<Select label="X" options={options} error="Required" />);
    expect(screen.getByRole('alert').textContent).toBe('Required');
  });

  it('filters options when searchable', () => {
    render(<Select label="Search" options={options} searchable />);
    fireEvent.click(screen.getByRole('button'));
    const search = screen.getByPlaceholderText('components.select.search');
    fireEvent.change(search, { target: { value: 'alp' } });
    expect(screen.getByText('Alpha')).toBeTruthy();
    expect(screen.queryByText('Beta')).toBeNull();
  });

  it('shows no results message', () => {
    render(<Select label="Search" options={options} searchable />);
    fireEvent.click(screen.getByRole('button'));
    const search = screen.getByPlaceholderText('components.select.search');
    fireEvent.change(search, { target: { value: 'zzz' } });
    expect(screen.getByText('components.select.noResults')).toBeTruthy();
  });
});

describe('SearchInput', () => {
  it('renders search icon and input', async () => {
    const { SearchInput } = await import('./SearchInput');
    render(<SearchInput value="" onChange={() => {}} />);
    expect(screen.getByRole('searchbox')).toBeTruthy();
  }, 15000);

  it('shows clear button when value exists', async () => {
    const { SearchInput } = await import('./SearchInput');
    const onClear = vi.fn();
    render(<SearchInput value="test" onChange={() => {}} onClear={onClear} />);
    const clearBtn = screen.getByRole('button', { name: 'components.searchInput.clear' });
    expect(clearBtn).toBeTruthy();
    fireEvent.click(clearBtn);
    expect(onClear).toHaveBeenCalled();
  });

  it('does not show clear button when value is empty', async () => {
    const { SearchInput } = await import('./SearchInput');
    render(<SearchInput value="" onChange={() => {}} />);
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('has accessible label even without explicit label prop', async () => {
    const { SearchInput } = await import('./SearchInput');
    render(<SearchInput value="" onChange={() => {}} />);
    // Default label comes from i18n key (mock returns key as text)
    const label = screen.getByText('components.searchInput.label');
    expect(label).toBeTruthy();
    expect(label.className).toContain('srOnly');
  });
});
