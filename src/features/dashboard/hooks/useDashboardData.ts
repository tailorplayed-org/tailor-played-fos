import { useMemo } from 'react';
import { useFirestoreCollection, useFirestoreDoc } from '@/hooks';
import { useWorkOrderStore, useTransactionStore, useSystemConfigStore, useOverheadStore, calculateBurn } from '@/stores';
import { workOrderSchema, transactionSchema, systemConfigSchema, overheadSchema } from '@/types';
import type { Transaction } from '@/types';
import { toIlsAgora, calculateTaxReserve } from '@/lib';

/**
 * Dashboard data hook — subscribes to Firestore collections and computes
 * all dashboard metrics. Owns its own subscriptions to avoid feature-boundary
 * violations (does NOT import from work-orders feature).
 *
 * Uses the SAFER pattern: reads full store state once, derives filtered data
 * via useMemo to avoid React 19 + Zustand v5 infinite loops.
 */
export function useDashboardData() {
  // Full store access — single call per store to avoid dual-subscription issues
  const woStore = useWorkOrderStore();
  const txnStore = useTransactionStore();
  const configStore = useSystemConfigStore();
  const ohStore = useOverheadStore();

  // Subscribe to Firestore collections (same pattern as useWorkOrders/useTransactions)
  useFirestoreCollection('work_orders', workOrderSchema, {
    onData: woStore.setWorkOrders,
    onError: woStore.setError,
    onLoading: woStore.setLoading,
  });

  useFirestoreCollection('transactions', transactionSchema, {
    onData: txnStore.setTransactions,
    onError: txnStore.setError,
    onLoading: txnStore.setLoading,
  });

  // Subscribe to overhead collection for burn rate KPI (Story 7.2)
  useFirestoreCollection('overhead', overheadSchema, {
    onData: ohStore.setOverhead,
    onError: ohStore.setError,
    onLoading: ohStore.setLoading,
  });

  // Subscribe to system_config/app document for dynamic tax and currency settings
  useFirestoreDoc('system_config', 'app', systemConfigSchema, {
    onData: configStore.setConfig,
    onError: configStore.setError,
    onLoading: configStore.setLoading,
  });

  // Compute current month/year outside useMemo so the memo recomputes
  // if the dashboard stays open across a month boundary.
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  // Derive all metrics from raw arrays via useMemo
  const metrics = useMemo(() => {
    const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;

    const isCurrentMonth = (t: Transaction) =>
      t.date.getMonth() === currentMonth && t.date.getFullYear() === currentYear;
    const isPrevMonth = (t: Transaction) =>
      t.date.getMonth() === prevMonth && t.date.getFullYear() === prevYear;

    const approved = txnStore.transactions.filter((t) => t.status === 'approved');

    // Dynamic currency rates from system_config (fallback to defaults)
    const rates = configStore.config?.currencyRates;

    // Net Profit: Revenue - (DirectCost + Overhead) for current month
    const currentMonthApproved = approved.filter(isCurrentMonth);
    const currentRevenue = currentMonthApproved
      .filter((t) => t.category === 'Revenue')
      .reduce((sum, t) => sum + toIlsAgora(t.amountAgora, t.currency, rates), 0);
    const currentCosts = currentMonthApproved
      .filter((t) => t.category === 'DirectCost' || t.category === 'Overhead')
      .reduce((sum, t) => sum + toIlsAgora(t.amountAgora, t.currency, rates), 0);
    const netProfitAgora = currentRevenue - currentCosts;

    // Previous month Net Profit for delta
    const prevMonthApproved = approved.filter(isPrevMonth);
    const prevRevenue = prevMonthApproved
      .filter((t) => t.category === 'Revenue')
      .reduce((sum, t) => sum + toIlsAgora(t.amountAgora, t.currency, rates), 0);
    const prevCosts = prevMonthApproved
      .filter((t) => t.category === 'DirectCost' || t.category === 'Overhead')
      .reduce((sum, t) => sum + toIlsAgora(t.amountAgora, t.currency, rates), 0);
    const prevNetProfitAgora = prevRevenue - prevCosts;
    const hasPreviousMonth = prevMonthApproved.length > 0;

    // Tax Jar — dynamic from system_config, defensive fallback to flat 35%
    const taxMethod = configStore.config?.taxMethod ?? 'flat';
    const flatRate = configStore.config?.flatRate ?? 0.35;
    const taxJarAgora = netProfitAgora > 0
      ? calculateTaxReserve(netProfitAgora, taxMethod, flatRate)
      : 0;

    // Active Projects — work orders with status Production
    const activeProjectCount = woStore.workOrders.filter(
      (wo) => wo.status === 'Production',
    ).length;

    // Monthly Overhead — from overhead collection with burn rate proration (Story 7.2)
    const currentMonthOverhead = ohStore.overhead.filter((item) => {
      if (item.recurrence === 'one_time') {
        return item.date.getFullYear() === currentYear && item.date.getMonth() === currentMonth;
      }
      return item.isActive;
    });
    const prevMonthOverhead = ohStore.overhead.filter((item) => {
      if (item.recurrence === 'one_time') {
        return item.date.getFullYear() === prevYear && item.date.getMonth() === prevMonth;
      }
      return item.isActive;
    });
    const monthlyOverheadAgora = calculateBurn(currentMonthOverhead);
    const previousMonthOverheadAgora = calculateBurn(prevMonthOverhead);

    // Pending Review breakdown
    const pendingReview = txnStore.transactions.filter(
      (t) => t.status === 'pending_review',
    );
    const pendingGreenCount = pendingReview.filter(
      (t) => (t.aiConfidence ?? 0) >= 85,
    ).length;
    const pendingCheckCount = pendingReview.length - pendingGreenCount;

    // Osek Patur threshold alert — warn at configurable % of annual threshold
    const threshold = configStore.config?.osPaturThresholdAgora ?? 12_000_000;
    const alertPercent = configStore.config?.osPaturAlertPercent ?? 0.80;
    const annualRevenueEstimate = currentRevenue * 12;
    const osPaturWarning = annualRevenueEstimate >= threshold * alertPercent;
    const osPaturPercent = threshold > 0 ? Math.round((annualRevenueEstimate / threshold) * 100) : 0;

    return {
      netProfitAgora,
      previousMonthNetProfitAgora: hasPreviousMonth ? prevNetProfitAgora : null,
      taxJarAgora,
      taxMethod,
      activeProjectCount,
      monthlyOverheadAgora,
      previousMonthOverheadAgora: prevMonthOverhead.length > 0 ? previousMonthOverheadAgora : null,
      pendingReviewCount: pendingReview.length,
      pendingGreenCount,
      pendingCheckCount,
      osPaturWarning,
      osPaturPercent,
      osPaturThresholdAgora: threshold,
    };
  }, [woStore.workOrders, txnStore.transactions, ohStore.overhead, configStore.config, currentMonth, currentYear]);

  return {
    ...metrics,
    workOrders: woStore.workOrders,
    loading: woStore.loading || txnStore.loading || ohStore.loading || configStore.loading,
    loaded: !woStore.loading && !txnStore.loading && !ohStore.loading && !configStore.loading,
  };
}
