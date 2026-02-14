import { describe, it, expect, beforeAll } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import type { ComponentType } from 'react';
import type { WorkOrder, Transaction, InventoryLogEntry } from '@/types';
import type { NutritionLabelProps } from './NutritionLabel';

// Dynamic import to avoid jsdom hangs with Phosphor icons
let NutritionLabel: ComponentType<NutritionLabelProps>;

beforeAll(async () => {
  const mod = await import('./NutritionLabel');
  NutritionLabel = mod.NutritionLabel;
}, 30_000);

function createWorkOrder(overrides: Partial<WorkOrder> = {}): WorkOrder {
  return {
    id: 'wo-1',
    clientName: 'Test Client',
    projectDescription: 'Test project',
    deadline: null,
    status: 'Production',
    revenueTotalAgora: 1500000, // ₪15,000
    directCostAgora: 500000,    // ₪5,000
    inventoryCostAgora: 0,
    overheadAllocationAgora: 100000, // ₪1,000
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    ...overrides,
  };
}

function createTransaction(overrides: Partial<Transaction> = {}): Transaction {
  return {
    id: 'txn-1',
    vendorName: 'Supplier A',
    amountAgora: 200000,
    currency: 'ILS',
    date: new Date('2026-01-15'),
    category: 'DirectCost',
    workOrderId: 'wo-1',
    inventoryItemId: null,
    status: 'approved',
    aiConfidence: null,
    originalFileUrl: null,
    source: 'manual',
    notes: null,
    createdAt: new Date('2026-01-15'),
    updatedAt: new Date('2026-01-15'),
    ...overrides,
  };
}

function createInventoryLog(overrides: Partial<InventoryLogEntry> = {}): InventoryLogEntry {
  return {
    id: 'log-1',
    itemId: 'item-1',
    action: 'consume',
    qtyChange: -10,
    costSnapshotAgora: 3500,
    wacBeforeAgora: 350,
    wacAfterAgora: 350,
    workOrderRef: 'wo-1',
    reason: null,
    actorUid: 'user-1',
    timestamp: new Date('2026-02-10'),
    ...overrides,
  };
}

describe('NutritionLabel', () => {
  it('renders all financial lines in correct order', () => {
    const wo = createWorkOrder();
    render(<NutritionLabel workOrder={wo} transactions={[]} />);

    // Verify key sections are present
    expect(screen.getByText('nutritionLabel.title')).toBeInTheDocument();
    expect(screen.getByText('nutritionLabel.revenue')).toBeInTheDocument();
    expect(screen.getByText('nutritionLabel.directCosts')).toBeInTheDocument();
    expect(screen.getByText('nutritionLabel.inventoryCosts')).toBeInTheDocument();
    expect(screen.getByText('nutritionLabel.overheadAllocation')).toBeInTheDocument();
    expect(screen.getByText('nutritionLabel.totalCosts')).toBeInTheDocument();
    expect(screen.getByText('nutritionLabel.buffer')).toBeInTheDocument();
    expect(screen.getByText('nutritionLabel.netProfit')).toBeInTheDocument();
    expect(screen.getByText('nutritionLabel.margin')).toBeInTheDocument();
  });

  it('formats all amounts via formatCurrency', () => {
    const wo = createWorkOrder({
      revenueTotalAgora: 1500000,
      directCostAgora: 500000,
      inventoryCostAgora: 0,
      overheadAllocationAgora: 100000,
    });
    render(<NutritionLabel workOrder={wo} transactions={[]} />);

    // Revenue: ₪15,000.00
    expect(screen.getByText('₪15,000.00')).toBeInTheDocument();
    // Direct Costs: ₪5,000.00
    expect(screen.getByText('₪5,000.00')).toBeInTheDocument();
    // Overhead: ₪1,000.00
    expect(screen.getByText('₪1,000.00')).toBeInTheDocument();
  });

  it('shows correct margin percentage with color class', () => {
    // totalCost = 500000+0+100000 = 600000, buffer = 30000
    // margin = (1500000-600000-30000)/1500000*100 = 58%
    const wo = createWorkOrder();
    render(<NutritionLabel workOrder={wo} transactions={[]} />);

    expect(screen.getByText('58%')).toBeInTheDocument();
  });

  it('shows dash when revenue is 0', () => {
    const wo = createWorkOrder({ revenueTotalAgora: 0 });
    render(<NutritionLabel workOrder={wo} transactions={[]} />);

    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('expanding Direct Costs shows individual transactions', () => {
    const wo = createWorkOrder();
    const txns = [
      createTransaction({ id: 'txn-1', vendorName: 'Supplier A', amountAgora: 200000 }),
      createTransaction({ id: 'txn-2', vendorName: 'Vendor B', amountAgora: 150000, date: new Date('2026-02-01') }),
    ];
    render(<NutritionLabel workOrder={wo} transactions={txns} />);

    // Transactions not visible before expand
    expect(screen.queryByText('Supplier A')).not.toBeInTheDocument();

    // Click expand
    const expandBtn = screen.getByRole('button', {
      name: /nutritionLabel\.expand\|section=nutritionLabel\.directCosts/,
    });
    fireEvent.click(expandBtn);

    // Now transactions are visible
    expect(screen.getByText('Supplier A')).toBeInTheDocument();
    expect(screen.getByText('Vendor B')).toBeInTheDocument();
  });

  it('expanding Inventory Costs shows no scoops placeholder when no logs', () => {
    const wo = createWorkOrder();
    render(<NutritionLabel workOrder={wo} transactions={[]} />);

    // Click expand inventory
    const expandBtn = screen.getByRole('button', {
      name: /nutritionLabel\.expand\|section=nutritionLabel\.inventoryCosts/,
    });
    fireEvent.click(expandBtn);

    expect(screen.getByText('nutritionLabel.noScoops')).toBeInTheDocument();
  });

  it('expanding Inventory Costs shows scoop entries with item names and costs', () => {
    const wo = createWorkOrder({ inventoryCostAgora: 7000 });
    const logs = [
      createInventoryLog({ id: 'log-1', itemId: 'item-1', costSnapshotAgora: 3500 }),
      createInventoryLog({ id: 'log-2', itemId: 'item-2', costSnapshotAgora: 3500, timestamp: new Date('2026-02-12') }),
    ];
    const itemNames = { 'item-1': 'Cardboard', 'item-2': 'Fabric' };

    render(
      <NutritionLabel
        workOrder={wo}
        transactions={[]}
        inventoryLogs={logs}
        inventoryItemNames={itemNames}
      />,
    );

    // Click expand inventory
    const expandBtn = screen.getByRole('button', {
      name: /nutritionLabel\.expand\|section=nutritionLabel\.inventoryCosts/,
    });
    fireEvent.click(expandBtn);

    expect(screen.getByText('Cardboard')).toBeInTheDocument();
    expect(screen.getByText('Fabric')).toBeInTheDocument();
    // Cost: 3500 agora = ₪35.00
    const costs = screen.getAllByText('₪35.00');
    expect(costs).toHaveLength(2);
  });

  it('shows itemId when item name not found in inventoryItemNames', () => {
    const wo = createWorkOrder({ inventoryCostAgora: 3500 });
    const logs = [createInventoryLog({ id: 'log-1', itemId: 'unknown-item' })];

    render(
      <NutritionLabel
        workOrder={wo}
        transactions={[]}
        inventoryLogs={logs}
        inventoryItemNames={{}}
      />,
    );

    const expandBtn = screen.getByRole('button', {
      name: /nutritionLabel\.expand\|section=nutritionLabel\.inventoryCosts/,
    });
    fireEvent.click(expandBtn);

    expect(screen.getByText('unknown-item')).toBeInTheDocument();
  });

  it('buffer is 5% of total costs', () => {
    // totalCost = 500000+0+100000 = 600000, buffer = 30000 → ₪300.00
    const wo = createWorkOrder();
    render(<NutritionLabel workOrder={wo} transactions={[]} />);

    expect(screen.getByText('₪300.00')).toBeInTheDocument();
  });

  it('net profit = revenue - total costs - buffer', () => {
    // net = 1500000 - 600000 - 30000 = 870000 → ₪8,700.00
    const wo = createWorkOrder();
    render(<NutritionLabel workOrder={wo} transactions={[]} />);

    expect(screen.getByText('₪8,700.00')).toBeInTheDocument();
  });

  it('margin uses color: green >= 30%', () => {
    // 58% margin → healthy
    const wo = createWorkOrder();
    render(<NutritionLabel workOrder={wo} transactions={[]} />);

    const marginValue = screen.getByText('58%');
    expect(marginValue.className).toContain('marginHealthy');
  });

  it('margin uses color: yellow 20-29%', () => {
    // revenue=10000, directCost=7500, inventory=0, overhead=0
    // totalCost=7500, buffer=375, net=2125
    // margin = (10000-7500-375)/10000*100 = 21.25% → watch
    const wo = createWorkOrder({
      revenueTotalAgora: 10000,
      directCostAgora: 7500,
      inventoryCostAgora: 0,
      overheadAllocationAgora: 0,
    });
    render(<NutritionLabel workOrder={wo} transactions={[]} />);

    const marginValue = screen.getByText('21%');
    expect(marginValue.className).toContain('marginWatch');
  });

  it('margin uses color: red < 20%', () => {
    // revenue=10000, directCost=8500, inventory=0, overhead=0
    // totalCost=8500, buffer=425, net=1075
    // margin = (10000-8500-425)/10000*100 = 10.75% → danger
    const wo = createWorkOrder({
      revenueTotalAgora: 10000,
      directCostAgora: 8500,
      inventoryCostAgora: 0,
      overheadAllocationAgora: 0,
    });
    render(<NutritionLabel workOrder={wo} transactions={[]} />);

    const marginValue = screen.getByText('11%');
    expect(marginValue.className).toContain('marginDanger');
  });

  it('warning icon shows for danger margin', () => {
    const wo = createWorkOrder({
      revenueTotalAgora: 10000,
      directCostAgora: 8500,
      inventoryCostAgora: 0,
      overheadAllocationAgora: 0,
    });
    const { container } = render(<NutritionLabel workOrder={wo} transactions={[]} />);

    // marginDanger class should be present on the icon (via className)
    const marginSection = container.querySelector('.marginLabel');
    expect(marginSection).toBeInTheDocument();
    // The icon with marginDanger class confirms warning icon rendered
    const iconEl = marginSection?.querySelector('.marginDanger');
    expect(iconEl).toBeInTheDocument();
  });

  it('shimmer overlay shows when loading=true', () => {
    const wo = createWorkOrder();
    const { container } = render(<NutritionLabel workOrder={wo} transactions={[]} loading={true} />);

    const shimmers = container.querySelectorAll('.shimmer');
    expect(shimmers.length).toBeGreaterThan(0);
    // All shimmer elements should be aria-hidden
    shimmers.forEach((shimmer) => {
      expect(shimmer.getAttribute('aria-hidden')).toBe('true');
    });
  });

  it('shimmer does not show when loading=false', () => {
    const wo = createWorkOrder();
    const { container } = render(<NutritionLabel workOrder={wo} transactions={[]} loading={false} />);

    const shimmers = container.querySelectorAll('.shimmer');
    expect(shimmers.length).toBe(0);
  });

  it('shimmer does not show when loading is undefined', () => {
    const wo = createWorkOrder();
    const { container } = render(<NutritionLabel workOrder={wo} transactions={[]} />);

    const shimmers = container.querySelectorAll('.shimmer');
    expect(shimmers.length).toBe(0);
  });

  it('handles empty transactions array (all zeros)', () => {
    const wo = createWorkOrder({
      revenueTotalAgora: 0,
      directCostAgora: 0,
      inventoryCostAgora: 0,
      overheadAllocationAgora: 0,
    });
    render(<NutritionLabel workOrder={wo} transactions={[]} />);

    // Revenue, costs all ₪0.00
    const zeroes = screen.getAllByText('₪0.00');
    expect(zeroes.length).toBeGreaterThanOrEqual(5);
    // Margin shows dash
    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('handles WO with only revenue (no costs)', () => {
    const wo = createWorkOrder({
      revenueTotalAgora: 1000000,
      directCostAgora: 0,
      inventoryCostAgora: 0,
      overheadAllocationAgora: 0,
    });
    render(<NutritionLabel workOrder={wo} transactions={[]} />);

    // Revenue and net profit are both ₪10,000.00 (no costs)
    const amounts = screen.getAllByText('₪10,000.00');
    expect(amounts.length).toBe(2);
    // 100% margin (buffer = 0, totalCost = 0)
    expect(screen.getByText('100%')).toBeInTheDocument();
  });

  it('expand/collapse buttons have accessible labels', () => {
    const wo = createWorkOrder();
    render(<NutritionLabel workOrder={wo} transactions={[]} />);

    const buttons = screen.getAllByRole('button');
    buttons.forEach((btn) => {
      expect(btn).toHaveAttribute('aria-label');
      expect(btn).toHaveAttribute('aria-expanded');
    });
  });

  it('filters transactions to only DirectCost for this workOrder', () => {
    const wo = createWorkOrder({ id: 'wo-1' });
    const txns = [
      createTransaction({ id: 'txn-1', vendorName: 'Correct Vendor', category: 'DirectCost', workOrderId: 'wo-1' }),
      createTransaction({ id: 'txn-2', vendorName: 'Wrong WO', category: 'DirectCost', workOrderId: 'wo-other' }),
      createTransaction({ id: 'txn-3', vendorName: 'Wrong Cat', category: 'Revenue', workOrderId: 'wo-1' }),
    ];
    render(<NutritionLabel workOrder={wo} transactions={txns} />);

    // Expand Direct Costs
    const expandBtn = screen.getByRole('button', {
      name: /nutritionLabel\.expand\|section=nutritionLabel\.directCosts/,
    });
    fireEvent.click(expandBtn);

    expect(screen.getByText('Correct Vendor')).toBeInTheDocument();
    expect(screen.queryByText('Wrong WO')).not.toBeInTheDocument();
    expect(screen.queryByText('Wrong Cat')).not.toBeInTheDocument();
  });

  it('handles negative net profit correctly', () => {
    // revenue=5000, cost=8000, overhead=0, inventory=0
    // totalCost=8000, buffer=400, net=5000-8000-400=-3400
    const wo = createWorkOrder({
      revenueTotalAgora: 5000,
      directCostAgora: 8000,
      inventoryCostAgora: 0,
      overheadAllocationAgora: 0,
    });
    render(<NutritionLabel workOrder={wo} transactions={[]} />);

    // Negative margin → danger class
    const marginTexts = screen.getAllByText(/-68%/);
    expect(marginTexts.length).toBeGreaterThanOrEqual(1);
  });

  it('applies error color to negative net profit amount', () => {
    const wo = createWorkOrder({
      revenueTotalAgora: 5000,
      directCostAgora: 8000,
      inventoryCostAgora: 0,
      overheadAllocationAgora: 0,
    });
    const { container } = render(<NutritionLabel workOrder={wo} transactions={[]} />);

    // Net profit amount should have netProfitNegative class
    const negativeEl = container.querySelector('.netProfitNegative');
    expect(negativeEl).toBeInTheDocument();
  });

  it('does not apply error color to positive net profit amount', () => {
    const wo = createWorkOrder();
    const { container } = render(<NutritionLabel workOrder={wo} transactions={[]} />);

    const negativeEl = container.querySelector('.netProfitNegative');
    expect(negativeEl).not.toBeInTheDocument();
  });

  it('shows waste entries with waste icon and reason in inventory costs', () => {
    const wo = createWorkOrder({ inventoryCostAgora: 7000 });
    const wasteLogs: InventoryLogEntry[] = [
      createInventoryLog({
        id: 'log-waste',
        action: 'waste',
        qtyChange: -5,
        costSnapshotAgora: 2500,
        reason: 'Expired',
        workOrderRef: 'wo-1',
      }),
      createInventoryLog({
        id: 'log-scoop',
        action: 'consume',
        qtyChange: -10,
        costSnapshotAgora: 3500,
        reason: null,
        workOrderRef: 'wo-1',
      }),
    ];
    const itemNames: Record<string, string> = { 'item-1': 'Cardboard' };

    render(
      <NutritionLabel
        workOrder={wo}
        transactions={[]}
        inventoryLogs={wasteLogs}
        inventoryItemNames={itemNames}
      />,
    );

    // Expand Inventory Costs
    fireEvent.click(screen.getByText('nutritionLabel.inventoryCosts'));

    // Waste entry should show waste label with reason
    expect(screen.getByText(/Expired/)).toBeInTheDocument();
    // Scoop entry should show item name without waste label
    const cardboardEntries = screen.getAllByText(/Cardboard/);
    expect(cardboardEntries.length).toBe(2); // one scoop, one waste
  });

  it('margin progress bar has accessible label', () => {
    const wo = createWorkOrder();
    render(<NutritionLabel workOrder={wo} transactions={[]} />);

    const progressbar = screen.getByRole('progressbar');
    expect(progressbar).toHaveAttribute('aria-label', 'nutritionLabel.margin');
  });
});
