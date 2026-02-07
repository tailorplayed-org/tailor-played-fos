import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

// react-i18next handled by resolve alias in vitest.config.ts
// CSS modules handled by css: false (returns proxy objects)

vi.mock('@phosphor-icons/react', () => ({
  ClipboardText: ({ className }: { size?: number; className?: string }) => (
    <svg data-testid="icon-ClipboardText" className={className} />
  ),
}));

const { WorkOrdersPage } = await import('./WorkOrdersPage');

describe('WorkOrdersPage', () => {
  it('renders without crashing', () => {
    render(<WorkOrdersPage />);
    expect(screen.getByText('pages.workOrders.title')).toBeInTheDocument();
  });

  it('displays translated placeholder message', () => {
    render(<WorkOrdersPage />);
    expect(screen.getByText('pages.workOrders.placeholder')).toBeInTheDocument();
  });
});
