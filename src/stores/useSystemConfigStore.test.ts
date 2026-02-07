import { describe, it, expect, beforeEach } from 'vitest';
import { useSystemConfigStore } from './useSystemConfigStore';
import type { SystemConfig } from '@/types';

const mockConfig: SystemConfig = {
  taxMethod: 'flat',
  flatRate: 0.35,
  currencyRates: { ILS: 1, USD: 3.5, EUR: 3.8 },
  osPaturThresholdAgora: 12_000_000,
};

describe('useSystemConfigStore', () => {
  beforeEach(() => {
    useSystemConfigStore.setState({
      config: null,
      loading: true,
      error: null,
    });
  });

  it('has correct initial state', () => {
    const state = useSystemConfigStore.getState();
    expect(state.config).toBeNull();
    expect(state.loading).toBe(true);
    expect(state.error).toBeNull();
  });

  it('setConfig updates config and clears loading/error', () => {
    useSystemConfigStore.getState().setConfig(mockConfig);
    const state = useSystemConfigStore.getState();
    expect(state.config).toEqual(mockConfig);
    expect(state.loading).toBe(false);
    expect(state.error).toBeNull();
  });

  it('setLoading updates loading state', () => {
    useSystemConfigStore.getState().setLoading(false);
    expect(useSystemConfigStore.getState().loading).toBe(false);

    useSystemConfigStore.getState().setLoading(true);
    expect(useSystemConfigStore.getState().loading).toBe(true);
  });

  it('setError updates error and clears loading', () => {
    useSystemConfigStore.getState().setError('Permission denied');
    const state = useSystemConfigStore.getState();
    expect(state.error).toBe('Permission denied');
    expect(state.loading).toBe(false);
  });

  it('setError clears error when set to null', () => {
    useSystemConfigStore.getState().setError('Some error');
    useSystemConfigStore.getState().setError(null);
    expect(useSystemConfigStore.getState().error).toBeNull();
  });

  it('setConfig replaces previous config', () => {
    useSystemConfigStore.getState().setConfig(mockConfig);
    const updatedConfig: SystemConfig = {
      ...mockConfig,
      taxMethod: 'bracket',
      flatRate: 0.25,
    };
    useSystemConfigStore.getState().setConfig(updatedConfig);
    const state = useSystemConfigStore.getState();
    expect(state.config?.taxMethod).toBe('bracket');
    expect(state.config?.flatRate).toBe(0.25);
  });

  it('setConfig clears previous error', () => {
    useSystemConfigStore.getState().setError('Previous error');
    useSystemConfigStore.getState().setConfig(mockConfig);
    const state = useSystemConfigStore.getState();
    expect(state.error).toBeNull();
    expect(state.config).toEqual(mockConfig);
  });
});
