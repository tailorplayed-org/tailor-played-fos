import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Badge } from './Badge';
import { StatusBadge } from './StatusBadge';
import { ConfidenceBadge } from './ConfidenceBadge';

describe('Badge', () => {
  it('renders label text', () => {
    render(<Badge label="Active" />);
    expect(screen.getByText('Active')).toBeTruthy();
  });

  it('applies default color class', () => {
    render(<Badge label="Default" />);
    expect(screen.getByText('Default').className).toContain('colorDefault');
  });

  it('applies success color class', () => {
    render(<Badge label="OK" color="success" />);
    expect(screen.getByText('OK').className).toContain('success');
  });

  it('applies warning color class', () => {
    render(<Badge label="Warn" color="warning" />);
    expect(screen.getByText('Warn').className).toContain('warning');
  });

  it('applies error color class', () => {
    render(<Badge label="Err" color="error" />);
    expect(screen.getByText('Err').className).toContain('error');
  });

  it('applies info color class', () => {
    render(<Badge label="Info" color="info" />);
    expect(screen.getByText('Info').className).toContain('info');
  });

  it('applies additional className', () => {
    render(<Badge label="X" className="extra" />);
    expect(screen.getByText('X').className).toContain('extra');
  });
});

describe('StatusBadge', () => {
  it('maps Lead to info color', () => {
    render(<StatusBadge status="Lead" />);
    const el = screen.getByText('Lead');
    expect(el.className).toContain('info');
  });

  it('maps Design to warning color', () => {
    render(<StatusBadge status="Design" />);
    expect(screen.getByText('Design').className).toContain('warning');
  });

  it('maps Production to success color', () => {
    render(<StatusBadge status="Production" />);
    expect(screen.getByText('Production').className).toContain('success');
  });

  it('maps Shipped to default color', () => {
    render(<StatusBadge status="Shipped" />);
    expect(screen.getByText('Shipped').className).toContain('colorDefault');
  });
});

describe('ConfidenceBadge', () => {
  it('renders success for confidence >= 85', () => {
    render(<ConfidenceBadge confidence={85} />);
    const el = screen.getByText('85%');
    expect(el.className).toContain('success');
  });

  it('renders success for confidence = 86', () => {
    render(<ConfidenceBadge confidence={86} />);
    const el = screen.getByText('86%');
    expect(el.className).toContain('success');
  });

  it('renders warning with check me for confidence < 85', () => {
    render(<ConfidenceBadge confidence={84} />);
    // Mock returns the key as text
    const el = screen.getByText('84% — components.confidenceBadge.checkMe');
    expect(el.className).toContain('warning');
  });

  it('renders warning for confidence = 0', () => {
    render(<ConfidenceBadge confidence={0} />);
    const el = screen.getByText('0% — components.confidenceBadge.checkMe');
    expect(el.className).toContain('warning');
  });
});
