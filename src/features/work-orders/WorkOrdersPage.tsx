import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ClipboardText, Plus, PencilSimple, WarningCircle } from '@phosphor-icons/react';
import { Button, Card, StatusBadge, Skeleton } from '@/components';
import { useWorkOrders, useWorkOrderActions } from './hooks';
import { WorkOrderForm } from './components';
import type { WorkOrder, CreateWorkOrderInput } from '@/types';
import styles from './WorkOrdersPage.module.scss';

export function WorkOrdersPage() {
  const { t } = useTranslation();
  const { workOrders, loading, error } = useWorkOrders();
  const { createWorkOrder, updateWorkOrder } = useWorkOrderActions();

  const [showForm, setShowForm] = useState(false);
  const [editingOrder, setEditingOrder] = useState<WorkOrder | null>(null);

  const handleCreate = async (data: CreateWorkOrderInput) => {
    try {
      await createWorkOrder(data);
      setShowForm(false);
    } catch {
      // Error toast already shown by useWorkOrderActions — keep form open
    }
  };

  const handleUpdate = async (data: CreateWorkOrderInput) => {
    if (!editingOrder) return;
    try {
      await updateWorkOrder(editingOrder.id, data);
      setEditingOrder(null);
    } catch {
      // Error toast already shown by useWorkOrderActions — keep form open
    }
  };

  const handleEdit = (order: WorkOrder) => {
    setEditingOrder(order);
    setShowForm(false);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingOrder(null);
  };

  const isFormVisible = showForm || editingOrder !== null;

  if (error) {
    return (
      <div className={styles.page}>
        <div className={styles.errorState} role="alert">
          <WarningCircle size={48} className={styles.errorIcon} />
          <p className={styles.errorText}>{t('workOrders.error.title')}</p>
          <p className={styles.errorDetail}>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>{t('workOrders.title')}</h1>
        {!isFormVisible && (
          <Button onClick={() => setShowForm(true)}>
            <Plus size={18} weight="bold" />
            <span>{t('workOrders.newWorkOrder')}</span>
          </Button>
        )}
      </header>

      {isFormVisible && (
        <section className={styles.formSection} aria-label={editingOrder ? t('workOrders.editWorkOrder') : t('workOrders.newWorkOrder')}>
          <WorkOrderForm
            onSubmit={editingOrder ? handleUpdate : handleCreate}
            onCancel={handleCancel}
            isEdit={!!editingOrder}
            defaultValues={
              editingOrder
                ? {
                    clientName: editingOrder.clientName,
                    projectDescription: editingOrder.projectDescription,
                    deadline: editingOrder.deadline,
                    status: editingOrder.status,
                  }
                : undefined
            }
          />
        </section>
      )}

      {loading && <LoadingSkeleton />}

      {!loading && workOrders.length === 0 && <EmptyState onCreateClick={() => setShowForm(true)} />}

      {!loading && workOrders.length > 0 && (
        <ul className={styles.list} role="list">
          {workOrders.map((order) => (
            <li key={order.id}>
              <WorkOrderCard order={order} onEdit={() => handleEdit(order)} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function EmptyState({ onCreateClick }: { onCreateClick: () => void }) {
  const { t } = useTranslation();

  return (
    <div className={styles.emptyState}>
      <ClipboardText size={64} className={styles.emptyIcon} />
      <h2 className={styles.emptyTitle}>{t('workOrders.emptyState.title')}</h2>
      <p className={styles.emptyDescription}>{t('workOrders.emptyState.description')}</p>
      <Button onClick={onCreateClick}>
        {t('workOrders.emptyState.cta')}
      </Button>
    </div>
  );
}

function WorkOrderCard({ order, onEdit }: { order: WorkOrder; onEdit: () => void }) {
  const { t } = useTranslation();

  return (
    <Card className={styles.card}>
      <div className={styles.cardHeader}>
        <h3 className={styles.clientName}>{order.clientName}</h3>
        <StatusBadge status={order.status} />
      </div>
      <p className={styles.description}>
        {order.projectDescription || t('workOrders.card.noDescription')}
      </p>
      {order.deadline && (
        <time className={styles.deadline} dateTime={order.deadline.toISOString()}>
          {order.deadline.toLocaleDateString()}
        </time>
      )}
      <div className={styles.cardActions}>
        <Button variant="ghost" size="sm" onClick={onEdit} aria-label={`${t('workOrders.card.edit')} ${order.clientName}`}>
          <PencilSimple size={18} />
          <span>{t('workOrders.card.edit')}</span>
        </Button>
      </div>
    </Card>
  );
}

function LoadingSkeleton() {
  return (
    <div className={styles.skeletonList} aria-busy="true">
      {[1, 2, 3].map((i) => (
        <Card key={i} className={styles.card}>
          <Skeleton width="60%" height={24} variant="text" />
          <Skeleton width="40%" height={18} variant="text" />
          <Skeleton width="100%" height={16} variant="text" />
        </Card>
      ))}
    </div>
  );
}
