// Copyright (c) 2025 ObjectStack. Licensed under the Apache-2.0 license.

import { defineView } from '@objectstack/spec/ui';

/**
 * Presales Project Views
 *
 *   • grid   — the presales register (number, source, money, status)
 *   • kanban — by document status: draft → submitted → approved → converted
 *
 * No `form.sections`: the record form derives its layout from the object's
 * `fieldGroups` (AGENTS.md — enumerating fields is the escape hatch).
 */
export const PresalesProjectViews = defineView({
  list: {
    type: 'grid',
    name: 'all_presales_projects',
    label: 'All Presales Projects',
    data: { provider: 'object', object: 'crm_presales_project' },
    columns: [
      { field: 'project_number', width: 120, link: true, pinned: 'left' },
      { field: 'name', width: 240, link: true },
      { field: 'crm_account', width: 180 },
      { field: 'crm_opportunity', width: 200 },
      { field: 'business_category', width: 130 },
      { field: 'status', width: 120, sortable: true },
      { field: 'quote_amount', width: 130, align: 'right', summary: 'sum' },
      { field: 'est_total_cost', width: 130, align: 'right', summary: 'sum' },
      { field: 'gross_margin', width: 110, align: 'right' },
      { field: 'project_director', width: 140 },
      { field: 'owner_id', width: 140 },
    ],
    sort: [{ field: 'created_at', order: 'desc' }],
    pagination: { pageSize: 25 },
    selection: { type: 'multiple' },
    appearance: { allowedVisualizations: ['grid', 'kanban'] },
    kanban: { groupByField: 'status', summarizeField: 'quote_amount', columns: ['name', 'crm_account', 'quote_amount', 'gross_margin'] },
  },

  listViews: {
    presales_kanban: {
      name: 'presales_kanban',
      type: 'kanban',
      label: 'Presales Board',
      data: { provider: 'object', object: 'crm_presales_project' },
      columns: ['name', 'crm_account', 'quote_amount', 'gross_margin', 'owner_id'],
      kanban: {
        groupByField: 'status',
        summarizeField: 'quote_amount',
        columns: ['name', 'crm_account', 'quote_amount', 'gross_margin'],
      },
      sort: [{ field: 'created_at', order: 'desc' }],
      navigation: { mode: 'drawer', width: '640px' },
    },

    pending_presales_approval: {
      name: 'pending_presales_approval',
      type: 'grid',
      label: 'Pending Approval',
      data: { provider: 'object', object: 'crm_presales_project' },
      columns: ['project_number', 'name', 'crm_account', 'quote_amount', 'gross_margin', 'project_director', 'owner_id'],
      filter: [{ field: 'status', operator: 'equals', value: 'submitted' }],
      sort: [{ field: 'updated_at', order: 'desc' }],
    },
  },
});
