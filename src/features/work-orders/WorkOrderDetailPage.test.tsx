import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router';

vi.mock('@phosphor-icons/react', () => ({
  ClipboardText: ({ className }: { size?: number; className?: string }) => (
    <svg data-testid="icon-ClipboardText" className={className} />
  ),
}));

vi.mock('./WorkOrderDetailPage.module.scss', () => ({
  default: {
    placeholder: 'placeholder',
    icon: 'icon',
    title: 'title',
    description: 'description',
    orderId: 'orderId',
  },
}));

const { WorkOrderDetailPage } = await import('./WorkOrderDetailPage');

describe('WorkOrderDetailPage', () => {
  it('renders without crashing and displays route param', () => {
    render(
      <MemoryRouter initialEntries={['/work-orders/abc-123']}>
        <Routes>
          <Route path="/work-orders/:id" element={<WorkOrderDetailPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText('Work Order Detail')).toBeInTheDocument();
    expect(screen.getByText('abc-123')).toBeInTheDocument();
  });
});
