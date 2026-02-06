import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('@phosphor-icons/react', () => ({
  ClipboardText: ({ className }: { size?: number; className?: string }) => (
    <svg data-testid="icon-ClipboardText" className={className} />
  ),
}));

vi.mock('./WorkOrdersPage.module.scss', () => ({
  default: {
    placeholder: 'placeholder',
    icon: 'icon',
    title: 'title',
    description: 'description',
  },
}));

const { WorkOrdersPage } = await import('./WorkOrdersPage');

describe('WorkOrdersPage', () => {
  it('renders without crashing', () => {
    render(<WorkOrdersPage />);
    expect(screen.getByText('Work Orders')).toBeInTheDocument();
  });

  it('displays placeholder message', () => {
    render(<WorkOrdersPage />);
    expect(screen.getByText('Track and manage your production orders here.')).toBeInTheDocument();
  });
});
