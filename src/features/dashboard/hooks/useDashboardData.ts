import { useMemo } from 'react';
import { useFirestoreCollection } from '@/hooks';
import { useWorkOrderStore, useTransactionStore } from '@/stores';
import { workOrderSchema, transactionSchema } from '@/types';
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

    // Net Profit: Revenue - (DirectCost + Overhead) for current month
    const currentMonthApproved = approved.filter(isCurrentMonth);
    const currentRevenue = currentMonthApproved
      .filter((t) => t.category === 'Revenue')
      .reduce((sum, t) => sum + toIlsAgora(t.amountAgora, t.currency), 0);
    const currentCosts = currentMonthApproved
      .filter((t) => t.category === 'DirectCost' || t.category === 'Overhead')
      .reduce((sum, t) => sum + toIlsAgora(t.amountAgora, t.currency), 0);
    const netProfitAgora = currentRevenue - currentCosts;

    // Previous month Net Profit for delta
    const prevMonthApproved = approved.filter(isPrevMonth);
    const prevRevenue = prevMonthApproved
      .filter((t) => t.category === 'Revenue')
      .reduce((sum, t) => sum + toIlsAgora(t.amountAgora, t.currency), 0);
    const prevCosts = prevMonthApproved
      .filter((t) => t.category === 'DirectCost' || t.category === 'Overhead')
      .reduce((sum, t) => sum + toIlsAgora(t.amountAgora, t.currency), 0);
    const prevNetProfitAgora = prevRevenue - prevCosts;
    const hasPreviousMonth = prevMonthApproved.length > 0;

    // Tax Jar — 35% flat rate of net profit (only if positive)
    const taxJarAgora = netProfitAgora > 0 ? calculateTaxReserve(netProfitAgora, 'flat', 0.35) : 0;

    // Active Projects — work orders with status Production
    const activeProjectCount = woStore.workOrders.filter(
      (wo) => wo.status === 'Production',
    ).length;

    // Monthly Overhead — sum of Overhead category for current month
    const monthlyOverheadAgora = currentMonthApproved
      .filter((t) => t.category === 'Overhead')
      .reduce((sum, t) => sum + toIlsAgora(t.amountAgora, t.currency), 0);
    const previousMonthOverheadAgora = prevMonthApproved
      .filter((t) => t.category === 'Overhead')
      .reduce((sum, t) => sum + toIlsAgora(t.amountAgora, t.currency), 0);

    // Pending Review breakdown
    const pendingReview = txnStore.transactions.filter(
      (t) => t.status === 'pending_review',
    );
    const pendingGreenCount = pendingReview.filter(
      (t) => (t.aiConfidence ?? 0) >= 85,
    ).length;
    const pendingCheckCount = pendingReview.length - pendingGreenCount;

    return {
      netProfitAgora,
      previousMonthNetProfitAgora: hasPreviousMonth ? prevNetProfitAgora : null,
      taxJarAgora,
      activeProjectCount,
      monthlyOverheadAgora,
      previousMonthOverheadAgora: hasPreviousMonth ? previousMonthOverheadAgora : null,
      pendingReviewCount: pendingReview.length,
      pendingGreenCount,
      pendingCheckCount,
    };
  }, [woStore.workOrders, txnStore.transactions, currentMonth, currentYear]);

  return {
    ...metrics,
    workOrders: woStore.workOrders,
    loading: woStore.loading || txnStore.loading,
  };
}
