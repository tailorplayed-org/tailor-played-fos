import { describe, it, expect, vi, beforeAll } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { StatusStepperProps } from './StatusStepper';

let StatusStepper: React.ComponentType<StatusStepperProps>;

beforeAll(async () => {
  const mod = await import('./StatusStepper');
  StatusStepper = mod.StatusStepper;
}, 30_000);

function renderStepper(props: Partial<StatusStepperProps> = {}) {
  const defaultProps: StatusStepperProps = {
    currentStatus: 'Lead',
    onStatusChange: vi.fn(),
    ...props,
  };
  return render(<StatusStepper {...defaultProps} />);
}

describe('StatusStepper', () => {
  it('renders all 4 status steps', () => {
    renderStepper();
    expect(screen.getByRole('button', { name: 'workOrders.status.Lead' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'workOrders.status.Design' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'workOrders.status.Production' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'workOrders.status.Shipped' })).toBeInTheDocument();
  });

  it('highlights current status with aria-current="step"', () => {
    renderStepper({ currentStatus: 'Design' });
    const designBtn = screen.getByRole('button', { name: 'workOrders.status.Design' });
    expect(designBtn).toHaveAttribute('aria-current', 'step');

    const leadBtn = screen.getByRole('button', { name: 'workOrders.status.Lead' });
    expect(leadBtn).not.toHaveAttribute('aria-current');
  });

  it('calls onStatusChange when a step is clicked', async () => {
    const user = userEvent.setup();
    const onStatusChange = vi.fn();
    renderStepper({ currentStatus: 'Lead', onStatusChange });

    await user.click(screen.getByRole('button', { name: 'workOrders.status.Production' }));
    expect(onStatusChange).toHaveBeenCalledWith('Production');
  });

  it('allows backward status change', async () => {
    const user = userEvent.setup();
    const onStatusChange = vi.fn();
    renderStepper({ currentStatus: 'Production', onStatusChange });

    await user.click(screen.getByRole('button', { name: 'workOrders.status.Lead' }));
    expect(onStatusChange).toHaveBeenCalledWith('Lead');
  });

  it('prevents clicks when disabled', async () => {
    const user = userEvent.setup();
    const onStatusChange = vi.fn();
    renderStepper({ disabled: true, onStatusChange });

    const btn = screen.getByRole('button', { name: 'workOrders.status.Design' });
    expect(btn).toBeDisabled();
    await user.click(btn);
    expect(onStatusChange).not.toHaveBeenCalled();
  });

  it('has correct role="group" with aria-label on container', () => {
    renderStepper();
    const group = screen.getByRole('group', { name: 'workOrders.statusStepper.label' });
    expect(group).toBeInTheDocument();
  });

  it('marks steps before current as completed (no aria-current)', () => {
    renderStepper({ currentStatus: 'Production' });

    const leadBtn = screen.getByRole('button', { name: 'workOrders.status.Lead' });
    const designBtn = screen.getByRole('button', { name: 'workOrders.status.Design' });
    const prodBtn = screen.getByRole('button', { name: 'workOrders.status.Production' });
    const shippedBtn = screen.getByRole('button', { name: 'workOrders.status.Shipped' });

    expect(leadBtn).not.toHaveAttribute('aria-current');
    expect(designBtn).not.toHaveAttribute('aria-current');
    expect(prodBtn).toHaveAttribute('aria-current', 'step');
    expect(shippedBtn).not.toHaveAttribute('aria-current');
  });
});
