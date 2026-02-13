import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Table, type Column } from './Table';

vi.mock('@phosphor-icons/react', () => ({
  ArrowUp: () => <svg data-testid="icon-ArrowUp" />,
  ArrowDown: () => <svg data-testid="icon-ArrowDown" />,
}));

interface TestItem {
  id: string;
  name: string;
  qty: number;
}

const columns: Column<TestItem>[] = [
  { key: 'name', header: 'Name', sortable: true, render: (item) => item.name },
  { key: 'qty', header: 'Qty', sortable: true, align: 'end', render: (item) => item.qty },
  { key: 'hidden', header: 'Hidden', hideOnMobile: true, render: () => 'extra' },
];

const testData: TestItem[] = [
  { id: '1', name: 'Item A', qty: 10 },
  { id: '2', name: 'Item B', qty: 20 },
  { id: '3', name: 'Item C', qty: 5 },
];

describe('Table', () => {
  it('renders column headers', () => {
    render(<Table columns={columns} data={testData} />);
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Qty')).toBeInTheDocument();
    expect(screen.getByText('Hidden')).toBeInTheDocument();
  });

  it('renders data rows', () => {
    render(<Table columns={columns} data={testData} />);
    expect(screen.getByText('Item A')).toBeInTheDocument();
    expect(screen.getByText('Item B')).toBeInTheDocument();
    expect(screen.getByText('Item C')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
    expect(screen.getByText('20')).toBeInTheDocument();
  });

  it('shows empty state when no data', () => {
    render(
      <Table
        columns={columns}
        data={[]}
        emptyState={<div>No items found</div>}
      />
    );
    expect(screen.getByText('No items found')).toBeInTheDocument();
  });

  it('shows loading skeletons', () => {
    render(<Table columns={columns} data={[]} loading />);
    // Should show skeleton rows
    const skeletons = document.querySelectorAll('[aria-hidden="true"]');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('calls onSort when sortable header clicked', () => {
    const onSort = vi.fn();
    render(
      <Table
        columns={columns}
        data={testData}
        sortKey="name"
        sortDirection="asc"
        onSort={onSort}
      />
    );
    const nameHeader = screen.getByRole('button', { name: /Name/i });
    fireEvent.click(nameHeader);
    expect(onSort).toHaveBeenCalledWith('name');
  });

  it('displays sort direction indicator for active sort', () => {
    render(
      <Table
        columns={columns}
        data={testData}
        sortKey="name"
        sortDirection="asc"
        onSort={vi.fn()}
      />
    );
    expect(screen.getByTestId('icon-ArrowUp')).toBeInTheDocument();
  });

  it('displays descending indicator', () => {
    render(
      <Table
        columns={columns}
        data={testData}
        sortKey="name"
        sortDirection="desc"
        onSort={vi.fn()}
      />
    );
    expect(screen.getByTestId('icon-ArrowDown')).toBeInTheDocument();
  });

  it('calls onRowClick when row is clicked', () => {
    const onRowClick = vi.fn();
    render(
      <Table columns={columns} data={testData} onRowClick={onRowClick} />
    );
    fireEvent.click(screen.getByText('Item A'));
    expect(onRowClick).toHaveBeenCalledWith(testData[0]);
  });

  it('supports keyboard navigation on clickable rows', () => {
    const onRowClick = vi.fn();
    render(
      <Table columns={columns} data={testData} onRowClick={onRowClick} />
    );
    const row = screen.getByText('Item A').closest('tr')!;
    fireEvent.keyDown(row, { key: 'Enter' });
    expect(onRowClick).toHaveBeenCalledWith(testData[0]);
  });

  it('applies custom row className', () => {
    render(
      <Table
        columns={columns}
        data={testData}
        rowClassName={(item) => (item.qty < 10 ? 'low-stock' : undefined)}
      />
    );
    const lowStockRow = screen.getByText('Item C').closest('tr')!;
    expect(lowStockRow.className).toContain('low-stock');
  });
});
