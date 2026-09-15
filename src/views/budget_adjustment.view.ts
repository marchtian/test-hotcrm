// Copyright (c) 2025 ObjectStack. Licensed under the Apache-2.0 license.

import { defineView } from '@objectstack/spec/ui';

/** Budget Adjustment Views — the register, and the ones awaiting approval. */
export const BudgetAdjustmentViews = defineView({
  list: {
    type: 'grid',
    name: 'all_budget_adjustments',
    label: 'All Budget Adjustments',
    data: { provider: 'object', object: 'crm_budget_adjustment' },
    columns: [
      { field: 'request_number', width: 120, link: true, pinned: 'left' },
      { field: 'crm_delivery_project', width: 220 },
      { field: 'cost_category', width: 150 },
      { field: 'amount', width: 130, align: 'right', summary: 'sum' },
      { field: 'status', width: 110, sortable: true },
      { field: 'approval_status', width: 120 },
      { field: 'owner_id', width: 140 },
      { field: 'reason', width: 280 },
    ],
    sort: [{ field: 'created_at', order: 'desc' }],
    pagination: { pageSize: 25 },
    selection: { type: 'multiple' },
  },

  listViews: {
    pending_budget_approval: {
      name: 'pending_budget_approval',
      type: 'grid',
      label: 'Pending Approval',
      data: { provider: 'object', object: 'crm_budget_adjustment' },
      columns: ['request_number', 'crm_delivery_project', 'cost_category', 'amount', 'owner_id', 'reason', 'variance_analysis'],
      filter: [{ field: 'status', operator: 'equals', value: 'submitted' }],
      sort: [{ field: 'updated_at', order: 'desc' }],
    },
  },
});
