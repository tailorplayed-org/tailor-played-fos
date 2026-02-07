import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router';

// react-i18next and .module.scss handled by vitest resolve aliases

vi.mock('@phosphor-icons/react', () => ({
  ClipboardText: ({ className }: { size?: number; className?: string }) => (
    <svg data-testid="icon-ClipboardText" className={className} />
  ),
}));

const { WorkOrderDetailPage } = await import('./WorkOrderDetailPage');

describe('WorkOrderDetailPage', () => {
  it('renders without crashing with translated title', () => {
    render(
      <MemoryRouter initialEntries={['/work-orders/abc-123']}>
        <Routes>
          <Route path="/work-orders/:id" element={<WorkOrderDetailPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText('pages.workOrderDetail.title')).toBeInTheDocument();
  });

  it('passes route id as interpolation param to placeholder translation', () => {
    render(
      <MemoryRouter initialEntries={['/work-orders/abc-123']}>
        <Routes>
          <Route path="/work-orders/:id" element={<WorkOrderDetailPage />} />
        </Routes>
      </MemoryRouter>,
    );

    // The global t() mock appends unreplaced params as |key=value.
    // This verifies the component passes { id } from useParams to t().
    expect(
      screen.getByText('pages.workOrderDetail.placeholder|id=abc-123'),
    ).toBeInTheDocument();
  });
});
