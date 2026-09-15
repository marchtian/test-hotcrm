// Copyright (c) 2025 ObjectStack. Licensed under the Apache-2.0 license.

import { defineView } from '@objectstack/spec/ui';

/** Expense Claim Views — the register, and the current user's own claims. */
export const ExpenseClaimViews = defineView({
  list: {
    type: 'grid',
    name: 'all_expense_claims',
    label: 'All Expense Claims',
    data: { provider: 'object', object: 'crm_expense_claim' },
    columns: [
      { field: 'claim_number', width: 120, link: true, pinned: 'left' },
      { field: 'crm_delivery_project', width: 220 },
      { field: 'owner_id', width: 140 },
      { field: 'expense_date', width: 120, sortable: true },
      { field: 'category', width: 120 },
      { field: 'amount', width: 120, align: 'right', summary: 'sum' },
      { field: 'status', width: 110, sortable: true },
      { field: 'description', width: 260 },
    ],
    sort: [{ field: 'expense_date', order: 'desc' }],
    pagination: { pageSize: 25 },
    selection: { type: 'multiple' },
  },

  listViews: {
    my_expense_claims: {
      name: 'my_expense_claims',
      type: 'grid',
      label: 'My Expense Claims',
      data: { provider: 'object', object: 'crm_expense_claim' },
      columns: ['claim_number', 'crm_delivery_project', 'expense_date', 'category', 'amount', 'status'],
      filter: [{ field: 'owner_id', operator: 'equals', value: '{current_user_id}' }],
      sort: [{ field: 'expense_date', order: 'desc' }],
    },
  },
});
